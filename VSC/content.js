// Video Speed Controller Content Script
class VideoSpeedController {
    constructor() {
        this.settings = {};
        this.videos = [];
        this.currentSpeed = 1.0;
        this.isEnabled = true;
        this.observer = null;
        this.initialized = false;
        
        this.init();
    }
    
    async init() {
        // Load settings
        await this.loadSettings();
        
        // Find existing videos
        this.scanForVideos();
        
        // Setup mutation observer
        this.setupObserver();
        
        // Listen for messages
        this.setupMessageListener();
        
        // Listen for keyboard shortcuts
        this.setupKeyboardListeners();
        
        this.initialized = true;
        
        console.log('Video Speed Controller initialized');
    }
    
    async loadSettings() {
        const defaultSettings = {
            speedStep: 0.25,
            customSpeed1: 1.5,
            customSpeed2: 2.0,
            language: 'en',
            extensionEnabled: true,
            lastSpeed: 1.0
        };
        
        return new Promise((resolve) => {
            chrome.storage.local.get(defaultSettings, (result) => {
                this.settings = result;
                this.isEnabled = result.extensionEnabled;
                this.currentSpeed = result.lastSpeed || 1.0;
                resolve();
            });
        });
    }
    
    scanForVideos() {
        this.videos = Array.from(document.querySelectorAll('video'));
        this.applySpeedToAllVideos();
    }
    
    setupObserver() {
        this.observer = new MutationObserver((mutations) => {
            let shouldScan = false;
            
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeName === 'VIDEO' || 
                            (node.querySelector && node.querySelector('video'))) {
                            shouldScan = true;
                            break;
                        }
                    }
                }
            }
            
            if (shouldScan) {
                this.scanForVideos();
            }
        });
        
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action) {
                case "setSpeed":
                    this.setSpeed(request.speed);
                    sendResponse({success: true});
                    break;
                    
                case "getSpeed":
                    sendResponse({speed: this.currentSpeed});
                    break;
                    
                case "toggleEnabled":
                    this.toggleEnabled(request.enabled);
                    sendResponse({success: true});
                    break;
                    
                case "getState":
                    sendResponse({
                        speed: this.currentSpeed,
                        enabled: this.isEnabled,
                        videoCount: this.videos.length
                    });
                    break;
                    
                case "reloadSettings":
                    this.loadSettings().then(() => {
                        this.applySpeedToAllVideos();
                        sendResponse({success: true});
                    });
                    return true;
            }
            return true;
        });
    }
    
    setupKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            // Only handle our shortcuts when extension is enabled
            if (!this.isEnabled) return;
            
            // Check for Ctrl/Cmd + Shift combinations
            const isCtrlCmd = e.ctrlKey || e.metaKey;
            const isShift = e.shiftKey;
            
            if (!isCtrlCmd || !isShift) return;
            
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    this.changeSpeed(this.settings.speedStep);
                    this.showSpeedNotification();
                    break;
                    
                case 'ArrowDown':
                    e.preventDefault();
                    this.changeSpeed(-this.settings.speedStep);
                    this.showSpeedNotification();
                    break;
                    
                case '0':
                    e.preventDefault();
                    this.setSpeed(1.0);
                    this.showSpeedNotification();
                    break;
                    
                case 'E':
                case 'e':
                    e.preventDefault();
                    this.toggleEnabled(!this.isEnabled);
                    break;
                    
                case '1':
                    e.preventDefault();
                    this.setSpeed(this.settings.customSpeed1);
                    this.showSpeedNotification();
                    break;
                    
                case '2':
                    e.preventDefault();
                    this.setSpeed(this.settings.customSpeed2);
                    this.showSpeedNotification();
                    break;
                    
                case 'V':
                case 'v':
                    e.preventDefault();
                    this.showSpeedMenu();
                    break;
            }
        }, true);
    }
    
    applySpeedToAllVideos() {
        if (!this.isEnabled) return;
        
        this.videos.forEach(video => {
            try {
                if (video.playbackRate !== this.currentSpeed) {
                    video.playbackRate = this.currentSpeed;
                }
            } catch (error) {
                console.warn('Could not set video speed:', error);
            }
        });
    }
    
    setSpeed(speed) {
        // Clamp speed between 0.1 and 10
        speed = Math.max(0.1, Math.min(10, speed));
        this.currentSpeed = parseFloat(speed.toFixed(2));
        
        // Save to storage
        chrome.storage.local.set({lastSpeed: this.currentSpeed});
        
        // Apply to videos
        this.applySpeedToAllVideos();
    }
    
    changeSpeed(delta) {
        const newSpeed = this.currentSpeed + delta;
        this.setSpeed(newSpeed);
    }
    
    toggleEnabled(enabled) {
        this.isEnabled = enabled;
        
        if (enabled) {
            this.applySpeedToAllVideos();
            this.showNotification('✓ Extension Enabled', 'success');
        } else {
            // Reset all videos to normal speed
            this.videos.forEach(video => {
                try {
                    video.playbackRate = 1.0;
                } catch (error) {
                    console.warn('Could not reset video speed:', error);
                }
            });
            this.showNotification('✗ Extension Disabled', 'info');
        }
        
        // Save to storage
        chrome.storage.local.set({extensionEnabled: enabled});
    }
    
    showSpeedNotification() {
        this.showNotification(`Speed: ${this.currentSpeed.toFixed(2)}x`, 'info');
    }
    
    showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.getElementById('vsc-notification');
        if (existing) existing.remove();
        
        // Create notification
        const notification = document.createElement('div');
        notification.id = 'vsc-notification';
        notification.className = `vsc-notification vsc-${type}`;
        notification.textContent = message;
        
        // Style notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: type === 'success' ? '#4CAF50' : 
                       type === 'error' ? '#f44336' : '#2196F3',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '4px',
            zIndex: '999999',
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'all 0.3s ease',
            opacity: '0',
            transform: 'translateY(-10px)'
        });
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 10);
        
        // Auto remove after 2 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 2000);
    }
    
    showSpeedMenu() {
        // Remove existing menu
        const existingMenu = document.getElementById('vsc-speed-menu');
        if (existingMenu) existingMenu.remove();
        
        // Create menu
        const menu = document.createElement('div');
        menu.id = 'vsc-speed-menu';
        menu.innerHTML = `
            <div class="vsc-menu-overlay"></div>
            <div class="vsc-menu-content">
                <h3>Speed Control</h3>
                <div class="vsc-menu-speed-display">${this.currentSpeed.toFixed(2)}x</div>
                <div class="vsc-menu-buttons">
                    <button class="vsc-menu-btn" data-speed="${this.settings.customSpeed1}">
                        Custom 1: ${this.settings.customSpeed1}x
                    </button>
                    <button class="vsc-menu-btn" data-speed="${this.settings.customSpeed2}">
                        Custom 2: ${this.settings.customSpeed2}x
                    </button>
                    <button class="vsc-menu-btn" data-speed="0.5">0.5x</button>
                    <button class="vsc-menu-btn" data-speed="1.0">1.0x</button>
                    <button class="vsc-menu-btn" data-speed="1.5">1.5x</button>
                    <button class="vsc-menu-btn" data-speed="2.0">2.0x</button>
                    <button class="vsc-menu-btn" data-speed="3.0">3.0x</button>
                    <button class="vsc-menu-btn" data-speed="5.0">5.0x</button>
                    <button class="vsc-menu-btn" data-speed="10.0">10.0x</button>
                </div>
                <div class="vsc-menu-custom">
                    <input type="number" 
                           class="vsc-menu-input" 
                           min="0.1" 
                           max="10" 
                           step="0.1" 
                           value="${this.currentSpeed.toFixed(2)}">
                    <button class="vsc-menu-set">Set Custom Speed</button>
                </div>
                <button class="vsc-menu-close">Close</button>
            </div>
        `;
        
        document.body.appendChild(menu);
        
        // Add event listeners
        menu.querySelectorAll('.vsc-menu-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const speed = parseFloat(btn.getAttribute('data-speed'));
                this.setSpeed(speed);
                this.showSpeedNotification();
                document.body.removeChild(menu);
            });
        });
        
        const customInput = menu.querySelector('.vsc-menu-input');
        const setCustomBtn = menu.querySelector('.vsc-menu-set');
        
        setCustomBtn.addEventListener('click', () => {
            const speed = parseFloat(customInput.value);
            if (speed >= 0.1 && speed <= 10) {
                this.setSpeed(speed);
                this.showSpeedNotification();
                document.body.removeChild(menu);
            }
        });
        
        menu.querySelector('.vsc-menu-close').addEventListener('click', () => {
            document.body.removeChild(menu);
        });
        
        menu.querySelector('.vsc-menu-overlay').addEventListener('click', () => {
            document.body.removeChild(menu);
        });
        
        // Close with Escape key
        const closeHandler = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(menu);
                document.removeEventListener('keydown', closeHandler);
            }
        };
        document.addEventListener('keydown', closeHandler);
    }
}

// Initialize controller
let controller;

function initializeController() {
    if (!controller && document.readyState === 'complete') {
        controller = new VideoSpeedController();
    }
}

// Start when document is ready
if (document.readyState === 'complete') {
    initializeController();
} else {
    document.addEventListener('DOMContentLoaded', initializeController);
}

// Handle page refresh
window.addEventListener('pageshow', () => {
    if (!controller) {
        initializeController();
    }
});