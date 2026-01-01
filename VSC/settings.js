// Settings management utility for Video Speed Controller
class SettingsManager {
    static defaultSettings = {
        // Speed control settings
        speedStep: 0.25,
        customSpeed1: 1.5,
        customSpeed2: 2.0,
        lastSpeed: 1.0,
        
        // Extension settings
        extensionEnabled: true,
        showNotifications: true,
        autoApplySpeed: true,
        
        // UI settings
        language: 'en',
        theme: 'light',
        fontSize: 'medium',
        
        // Speed limits
        maxSpeed: 10.0,
        minSpeed: 0.1,
        
        // Advanced settings
        rememberPerSite: false,
        audioPreservation: true,
        scrollControl: false,
        
        // Custom shortcuts (stored as objects)
        customShortcuts: {}
    };
    
    // Get all settings
    static async getSettings() {
        return new Promise((resolve) => {
            chrome.storage.local.get(this.defaultSettings, (settings) => {
                resolve(settings);
            });
        });
    }
    
    // Save settings
    static async saveSettings(settings) {
        return new Promise((resolve) => {
            chrome.storage.local.set(settings, () => {
                resolve();
            });
        });
    }
    
    // Update a single setting
    static async updateSetting(key, value) {
        const settings = await this.getSettings();
        settings[key] = value;
        await this.saveSettings(settings);
        return settings;
    }
    
    // Reset all settings to default
    static async resetToDefaults() {
        await this.saveSettings(this.defaultSettings);
        return this.defaultSettings;
    }
    
    // Get site-specific settings
    static async getSiteSettings(url) {
        const domain = this.extractDomain(url);
        const key = `site_${domain}`;
        
        return new Promise((resolve) => {
            chrome.storage.local.get([key], (result) => {
                resolve(result[key] || {});
            });
        });
    }
    
    // Save site-specific settings
    static async saveSiteSettings(url, siteSettings) {
        const domain = this.extractDomain(url);
        const key = `site_${domain}`;
        
        return new Promise((resolve) => {
            chrome.storage.local.set({ [key]: siteSettings }, () => {
                resolve();
            });
        });
    }
    
    // Get custom shortcut for a command
    static async getShortcut(command) {
        const settings = await this.getSettings();
        return settings.customShortcuts[command] || null;
    }
    
    // Save custom shortcut
    static async saveShortcut(command, shortcut) {
        const settings = await this.getSettings();
        settings.customShortcuts[command] = shortcut;
        await this.saveSettings(settings);
        return settings;
    }
    
    // Get all shortcuts
    static async getAllShortcuts() {
        const settings = await this.getSettings();
        return settings.customShortcuts;
    }
    
    // Reset shortcuts to default
    static async resetShortcuts() {
        const settings = await this.getSettings();
        settings.customShortcuts = {};
        await this.saveSettings(settings);
        return settings;
    }
    
    // Get available languages
    static getLanguages() {
        return [
            { code: 'en', name: 'English', nativeName: 'English' },
            { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
            { code: 'es', name: 'Spanish', nativeName: 'Español' },
            { code: 'fr', name: 'French', nativeName: 'Français' },
            { code: 'de', name: 'German', nativeName: 'Deutsch' },
            { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
            { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
            { code: 'ja', name: 'Japanese', nativeName: '日本語' },
            { code: 'zh', name: 'Chinese', nativeName: '中文' }
        ];
    }
    
    // Get available themes
    static getThemes() {
        return [
            { id: 'light', name: 'Light Theme' },
            { id: 'dark', name: 'Dark Theme' },
            { id: 'blue', name: 'Blue Theme' },
            { id: 'green', name: 'Green Theme' },
            { id: 'purple', name: 'Purple Theme' }
        ];
    }
    
    // Get font sizes
    static getFontSizes() {
        return [
            { id: 'small', name: 'Small', size: '12px' },
            { id: 'medium', name: 'Medium', size: '14px' },
            { id: 'large', name: 'Large', size: '16px' }
        ];
    }
    
    // Get preset speeds
    static getPresetSpeeds() {
        return [
            0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 
            2.5, 3.0, 3.5, 4.0, 5.0, 7.0, 10.0
        ];
    }
    
    // Get default shortcuts
    static getDefaultShortcuts() {
        return {
            'increase_speed': { key: 'ArrowUp', ctrl: true, shift: true, alt: false },
            'decrease_speed': { key: 'ArrowDown', ctrl: true, shift: true, alt: false },
            'reset_speed': { key: '0', ctrl: true, shift: true, alt: false },
            'toggle_enabled': { key: 'E', ctrl: true, shift: true, alt: false },
            'custom_speed_1': { key: '1', ctrl: true, shift: true, alt: false },
            'custom_speed_2': { key: '2', ctrl: true, shift: true, alt: false },
            'show_menu': { key: 'V', ctrl: true, shift: true, alt: false }
        };
    }
    
    // Validate speed value
    static validateSpeed(speed, settings = null) {
        let minSpeed = 0.1;
        let maxSpeed = 10.0;
        
        if (settings) {
            minSpeed = settings.minSpeed || 0.1;
            maxSpeed = settings.maxSpeed || 10.0;
        }
        
        speed = parseFloat(speed);
        
        if (isNaN(speed)) {
            return 1.0;
        }
        
        if (speed < minSpeed) {
            return minSpeed;
        }
        
        if (speed > maxSpeed) {
            return maxSpeed;
        }
        
        return parseFloat(speed.toFixed(2));
    }
    
    // Extract domain from URL
    static extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '');
        } catch (e) {
            return 'unknown';
        }
    }
    
    // Format shortcut for display
    static formatShortcut(shortcut) {
        if (!shortcut) return 'Not set';
        
        const parts = [];
        if (shortcut.ctrl) parts.push('Ctrl');
        if (shortcut.shift) parts.push('Shift');
        if (shortcut.alt) parts.push('Alt');
        
        let key = shortcut.key;
        if (key === 'ArrowUp') key = '↑';
        if (key === 'ArrowDown') key = '↓';
        if (key === 'ArrowLeft') key = '←';
        if (key === 'ArrowRight') key = '→';
        if (key === ' ') key = 'Space';
        
        parts.push(key.toUpperCase());
        return parts.join('+');
    }
    
    // Parse shortcut from string
    static parseShortcut(shortcutString) {
        if (!shortcutString) return null;
        
        const parts = shortcutString.split('+');
        const shortcut = {
            ctrl: false,
            shift: false,
            alt: false,
            key: ''
        };
        
        for (const part of parts) {
            const partLower = part.toLowerCase().trim();
            
            if (partLower === 'ctrl' || partLower === 'cmd' || partLower === 'control') {
                shortcut.ctrl = true;
            } else if (partLower === 'shift') {
                shortcut.shift = true;
            } else if (partLower === 'alt' || partLower === 'option') {
                shortcut.alt = true;
            } else {
                // Handle special keys
                let key = part;
                if (key === '↑') key = 'ArrowUp';
                if (key === '↓') key = 'ArrowDown';
                if (key === '←') key = 'ArrowLeft';
                if (key === '→') key = 'ArrowRight';
                if (key === ' ') key = 'Space';
                
                shortcut.key = key;
            }
        }
        
        return shortcut.key ? shortcut : null;
    }
    
    // Check if shortcut conflicts with existing shortcuts
    static async checkShortcutConflict(newShortcut, excludeCommand = null) {
        const shortcuts = await this.getAllShortcuts();
        
        for (const [command, shortcut] of Object.entries(shortcuts)) {
            if (excludeCommand && command === excludeCommand) continue;
            
            if (shortcut && 
                shortcut.ctrl === newShortcut.ctrl &&
                shortcut.shift === newShortcut.shift &&
                shortcut.alt === newShortcut.alt &&
                shortcut.key.toLowerCase() === newShortcut.key.toLowerCase()) {
                return { conflict: true, command };
            }
        }
        
        return { conflict: false };
    }
    
    // Export settings as JSON
    static async exportSettings() {
        const settings = await this.getSettings();
        const exportData = {
            version: '2.0.1',
            exportDate: new Date().toISOString(),
            settings: settings
        };
        
        return JSON.stringify(exportData, null, 2);
    }
    
    // Import settings from JSON
    static async importSettings(jsonString) {
        try {
            const importData = JSON.parse(jsonString);
            
            if (!importData.settings || !importData.version) {
                throw new Error('Invalid settings file');
            }
            
            // Merge with default settings
            const currentSettings = await this.getSettings();
            const newSettings = {
                ...currentSettings,
                ...importData.settings
            };
            
            await this.saveSettings(newSettings);
            return { success: true, message: 'Settings imported successfully' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
    
    // Clear all site-specific settings
    static async clearSiteSettings() {
        return new Promise((resolve) => {
            chrome.storage.local.get(null, (items) => {
                const keysToRemove = [];
                
                for (const key in items) {
                    if (key.startsWith('site_')) {
                        keysToRemove.push(key);
                    }
                }
                
                chrome.storage.local.remove(keysToRemove, () => {
                    resolve({ removed: keysToRemove.length });
                });
            });
        });
    }
    
    // Get storage usage
    static async getStorageUsage() {
        return new Promise((resolve) => {
            chrome.storage.local.getBytesInUse(null, (bytes) => {
                const kb = (bytes / 1024).toFixed(2);
                const mb = (bytes / (1024 * 1024)).toFixed(2);
                resolve({ bytes, kb, mb });
            });
        });
    }
    
    // Reset speed statistics
    static async resetStatistics() {
        const settings = await this.getSettings();
        
        // Clear statistics-related data
        delete settings.siteStatistics;
        delete settings.usageStats;
        delete settings.favoriteSpeeds;
        
        await this.saveSettings(settings);
        return { success: true };
    }
    
    // Get speed statistics
    static async getStatistics() {
        const settings = await this.getSettings();
        
        const stats = {
            totalVideosControlled: settings.siteStatistics?.totalVideos || 0,
            totalSpeedChanges: settings.siteStatistics?.totalChanges || 0,
            mostUsedSpeed: settings.siteStatistics?.mostUsedSpeed || 1.0,
            averageSessionTime: settings.siteStatistics?.avgSessionTime || 0,
            favoriteSpeeds: settings.favoriteSpeeds || [],
            topSites: settings.siteStatistics?.topSites || []
        };
        
        return stats;
    }
    
    // Update statistics
    static async updateStatistics(event, data = {}) {
        const settings = await this.getSettings();
        
        if (!settings.siteStatistics) {
            settings.siteStatistics = {
                totalVideos: 0,
                totalChanges: 0,
                mostUsedSpeed: {},
                topSites: {},
                lastUpdate: new Date().toISOString()
            };
        }
        
        switch (event) {
            case 'video_controlled':
                settings.siteStatistics.totalVideos = (settings.siteStatistics.totalVideos || 0) + 1;
                break;
                
            case 'speed_changed':
                settings.siteStatistics.totalChanges = (settings.siteStatistics.totalChanges || 0) + 1;
                
                // Track most used speed
                const speed = data.speed || 1.0;
                if (!settings.siteStatistics.mostUsedSpeed[speed]) {
                    settings.siteStatistics.mostUsedSpeed[speed] = 0;
                }
                settings.siteStatistics.mostUsedSpeed[speed]++;
                
                // Track site usage
                if (data.site) {
                    if (!settings.siteStatistics.topSites[data.site]) {
                        settings.siteStatistics.topSites[data.site] = 0;
                    }
                    settings.siteStatistics.topSites[data.site]++;
                }
                break;
                
            case 'extension_used':
                // Update favorite speeds
                if (data.speed && data.speed !== 1.0) {
                    if (!settings.favoriteSpeeds) {
                        settings.favoriteSpeeds = [];
                    }
                    
                    const speedIndex = settings.favoriteSpeeds.findIndex(s => s.speed === data.speed);
                    
                    if (speedIndex === -1) {
                        settings.favoriteSpeeds.push({
                            speed: data.speed,
                            count: 1,
                            lastUsed: new Date().toISOString()
                        });
                    } else {
                        settings.favoriteSpeeds[speedIndex].count++;
                        settings.favoriteSpeeds[speedIndex].lastUsed = new Date().toISOString();
                    }
                    
                    // Sort by count (descending)
                    settings.favoriteSpeeds.sort((a, b) => b.count - a.count);
                    
                    // Keep only top 10
                    if (settings.favoriteSpeeds.length > 10) {
                        settings.favoriteSpeeds = settings.favoriteSpeeds.slice(0, 10);
                    }
                }
                break;
        }
        
        settings.siteStatistics.lastUpdate = new Date().toISOString();
        await this.saveSettings(settings);
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsManager;
} else {
    window.SettingsManager = SettingsManager;
}