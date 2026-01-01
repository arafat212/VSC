from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
import json
from .settings import shortcut_manager
from django.contrib import messages
import os
from pathlib import Path
from django.conf import settings

# Add these imports at the top if not already present
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

# Add these new views

@login_required
def shortcuts_settings(request):
    """Shortcut settings page"""
    platform = request.GET.get('platform', 'windows')
    
    # Get available platforms
    platforms = ['windows', 'mac', 'linux']
    
    # Get shortcuts for selected platform
    shortcuts = shortcut_manager.get_shortcuts(platform)
    
    context = {
        'shortcuts': shortcuts,
        'platforms': platforms,
        'current_platform': platform,
        'platform_names': {
            'windows': 'Windows',
            'mac': 'Mac',
            'linux': 'Linux'
        }
    }
    return render(request, 'shortcuts/shortcuts.html', context)

@csrf_exempt
@require_POST
@login_required
def update_shortcut(request):
    """Update a shortcut via AJAX"""
    try:
        data = json.loads(request.body)
        action = data.get('action')
        platform = data.get('platform')
        new_key = data.get('new_key')
        
        if not all([action, platform, new_key]):
            return JsonResponse({'success': False, 'error': 'Missing parameters'})
        
        success = shortcut_manager.update_shortcut(action, platform, new_key)
        
        if success:
            return JsonResponse({'success': True})
        else:
            return JsonResponse({'success': False, 'error': 'Action not found'})
            
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

@login_required
def reset_shortcuts(request):
    """Reset all shortcuts to default"""
    if request.method == 'POST':
        shortcut_manager.reset_to_default()
        messages.success(request, 'Shortcuts reset to default successfully!')
        return redirect('shortcuts_settings')
    
    return render(request, 'shortcuts/reset_confirm.html')

@login_required
def export_shortcuts(request):
    """Export shortcuts to JSON file"""
    shortcuts = shortcut_manager.shortcuts
    
    response = JsonResponse(shortcuts, json_dumps_params={'indent': 4})
    response['Content-Disposition'] = 'attachment; filename="vsc_shortcuts.json"'
    return response

@login_required
def import_shortcuts(request):
    """Import shortcuts from JSON file"""
    if request.method == 'POST' and request.FILES.get('shortcuts_file'):
        try:
            file = request.FILES['shortcuts_file']
            imported_data = json.loads(file.read().decode('utf-8'))
            
            # Validate imported data
            if isinstance(imported_data, dict):
                # Update existing shortcuts
                for action, data in imported_data.items():
                    if action in shortcut_manager.shortcuts and isinstance(data, dict):
                        for platform in ['windows', 'mac', 'linux']:
                            if platform in data:
                                shortcut_manager.shortcuts[action][platform] = data[platform]
                
                shortcut_manager.save_shortcuts()
                messages.success(request, 'Shortcuts imported successfully!')
            else:
                messages.error(request, 'Invalid shortcuts file format')
                
        except json.JSONDecodeError:
            messages.error(request, 'Invalid JSON file')
        except Exception as e:
            messages.error(request, f'Error importing shortcuts: {str(e)}')
    
    return redirect('shortcuts_settings')

# Add shortcut data to video player context
def video_player(request, video_id=None):
    # ... existing code ...
    
    # Get shortcuts for current platform (detect from user agent)
    user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
    
    if 'mac' in user_agent:
        platform = 'mac'
    elif 'linux' in user_agent:
        platform = 'linux'
    else:
        platform = 'windows'
    
    shortcuts = shortcut_manager.get_shortcuts(platform)
    
    # Add to your existing context
    context = {
        # ... existing context variables ...
        'shortcuts_json': json.dumps(shortcuts),
        'current_platform': platform,
    }
    
    return render(request, 'player/video_player.html', context)