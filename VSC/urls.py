from django.urls import path
from . import views

urlpatterns = [
    # ... existing URLs ...
    
    # Shortcut management URLs
    path('shortcuts/', views.shortcuts_settings, name='shortcuts_settings'),
    path('shortcuts/update/', views.update_shortcut, name='update_shortcut'),
    path('shortcuts/reset/', views.reset_shortcuts, name='reset_shortcuts'),
    path('shortcuts/export/', views.export_shortcuts, name='export_shortcuts'),
    path('shortcuts/import/', views.import_shortcuts, name='import_shortcuts'),
]