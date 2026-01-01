import json
import os
from pathlib import Path
from django.conf import settings

class ShortcutManager:
    def __init__(self):
        self.shortcuts_file = Path(settings.BASE_DIR) / 'data' / 'shortcuts.json'
        self.default_shortcuts = {
            'increase_speed': {
                'windows': 'Ctrl+Shift+Up',
                'mac': 'Cmd+Shift+Up',
                'linux': 'Ctrl+Shift+Up',
                'description': 'Increase playback speed'
            },
            'decrease_speed': {
                'windows': 'Ctrl+Shift+Down',
                'mac': 'Cmd+Shift+Down',
                'linux': 'Ctrl+Shift+Down',
                'description': 'Decrease playback speed'
            },
            'play_pause': {
                'windows': 'Space',
                'mac': 'Space',
                'linux': 'Space',
                'description': 'Play/Pause video'
            },
            'fullscreen': {
                'windows': 'F',
                'mac': 'F',
                'linux': 'F',
                'description': 'Toggle fullscreen'
            },
            'mute': {
                'windows': 'M',
                'mac': 'M',
                'linux': 'M',
                'description': 'Mute/Unmute'
            },
            'volume_up': {
                'windows': 'Up',
                'mac': 'Up',
                'linux': 'Up',
                'description': 'Volume up'
            },
            'volume_down': {
                'windows': 'Down',
                'mac': 'Down',
                'linux': 'Down',
                'description': 'Volume down'
            },
            'seek_forward': {
                'windows': 'Right',
                'mac': 'Right',
                'linux': 'Right',
                'description': 'Seek forward 5 seconds'
            },
            'seek_backward': {
                'windows': 'Left',
                'mac': 'Left',
                'linux': 'Left',
                'description': 'Seek backward 5 seconds'
            },
            'next_video': {
                'windows': 'Shift+N',
                'mac': 'Cmd+Right',
                'linux': 'Shift+N',
                'description': 'Next video'
            },
            'previous_video': {
                'windows': 'Shift+P',
                'mac': 'Cmd+Left',
                'linux': 'Shift+P',
                'description': 'Previous video'
            }
        }
        self.load_shortcuts()

    def load_shortcuts(self):
        """Load shortcuts from JSON file or create default"""
        try:
            if self.shortcuts_file.exists():
                with open(self.shortcuts_file, 'r') as f:
                    self.shortcuts = json.load(f)
            else:
                self.shortcuts = self.default_shortcuts
                self.save_shortcuts()
        except:
            self.shortcuts = self.default_shortcuts

    def save_shortcuts(self):
        """Save shortcuts to JSON file"""
        os.makedirs(self.shortcuts_file.parent, exist_ok=True)
        with open(self.shortcuts_file, 'w') as f:
            json.dump(self.shortcuts, f, indent=4)

    def get_shortcuts(self, platform='windows'):
        """Get shortcuts for specific platform"""
        formatted = {}
        for action, data in self.shortcuts.items():
            formatted[action] = {
                'key': data.get(platform, data.get('windows', '')),
                'description': data.get('description', '')
            }
        return formatted

    def update_shortcut(self, action, platform, new_key):
        """Update a specific shortcut"""
        if action in self.shortcuts:
            self.shortcuts[action][platform] = new_key
            self.save_shortcuts()
            return True
        return False

    def reset_to_default(self):
        """Reset all shortcuts to default"""
        self.shortcuts = self.default_shortcuts.copy()
        self.save_shortcuts()

shortcut_manager = ShortcutManager()