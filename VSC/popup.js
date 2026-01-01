document.addEventListener('DOMContentLoaded', async function() {
    // Initialize i18n
    await initI18n();
    
    // Get DOM elements
    const currentSpeedEl = document.getElementById('currentSpeed');
    const decreaseBtn = document.getElementById('decreaseSpeed');
    const resetBtn = document.getElementById('resetSpeed');
    const increaseBtn = document.getElementById('increaseSpeed');
    const speedSlider = document.getElementById('speedSlider');
    const speedInput = document.getElementById('speedInput');
    const setCustomBtn = document.getElementById('setCustomSpeed');
    const presetButtons = document.querySelectorAll('.preset-btn');
    const toggleExtensionBtn = document.getElementById('toggleExtension');
    const openOptionsBtn = document.getElementById('openOptions');
    const shortcutHelpBtn = document.getElementById('shortcutHelp');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const closeModalBtn = document.getElementById('closeModal');
    const shortcutModal = document.getElementById('shortcutModal');
    
    // Load settings
    let settings = await loadSettings();
    let currentSpeed = settings.lastSpeed || 1.0;
    let isEnabled = settings.extensionEnabled;
    
    // Initialize UI
    updateUI();
    updateSpeedDisplay();
    
    // Get current speed from active tab
    chrome.tabs.query({active: true, currentWindow: true}, async function(tabs) {
        if (tabs.length === 0) return;
        
        const tabId = tabs[0].id;
        try {
            const response = await chrome.tabs.sendMessage(tabId, {
                action: "getSpeed"
            });
            if (response && response.speed) {
                currentSpeed = response.speed;
                updateSpeedDisplay();
            }
        } catch (error) {
            console.log("Could not get speed from content script");
        }
    });
    
    // Event Listeners
    decreaseBtn.addEventListener('click', () => changeSpeed(-settings.speedStep));
    increaseBtn.addEventListener('click', () => changeSpeed(settings.speedStep));
    resetBtn.addEventListener('click', () => setSpeed(1.0));
    
    speedSlider.addEventListener('input', function() {
        speedInput.value = this.value;
    });
    
    speedInput.addEventListener('input', function() {
        const value = parseFloat(this.value);
        if (value >= 0.1 && value <= 10) {
            speedSlider.value = this.value;
        }
    });
    
    speedInput.addEventListener('change', function() {
        const value = parseFloat(this.value);
        if (value >= 0.1 && value <= 10) {
            setSpeed(value);
        } else {
            speedInput.value = currentSpeed.toFixed(2);
        }
    });
    
    setCustomBtn.addEventListener('click', function() {
        const speed = parseFloat(speedInput.value);
        if (speed >= 0.1 && speed <= 10) {
            setSpeed(speed);
        }
    });
    
    presetButtons.forEach(button => {
        button.addEventListener('click', function() {
            const speed = parseFloat(this.getAttribute('data-speed'));
            setSpeed(speed);
        });
    });
    
    toggleExtensionBtn.addEventListener('click', async function() {
        isEnabled = !isEnabled;
        await chrome.storage.local.set({extensionEnabled: isEnabled});
        
        // Update icon
        const iconPath = isEnabled ? {
            16: "icons/icon16.png",
            48: "icons/icon48.png",
            128: "icons/icon128.png"
        } : {
            16: "icons/disabled16.png",
            48: "icons/disabled48.png",
            128: "icons/disabled128.png"
        };
        
        chrome.action.setIcon({path: iconPath});
        
        // Send message to content script
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs.length === 0) return;
            
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "toggleEnabled",
                enabled: isEnabled
            }).catch(() => {
                console.log("Tab not ready yet");
            });
        });
        
        updateUI();
    });
    
    openOptionsBtn.addEventListener('click', function() {
        chrome.runtime.openOptionsPage();
    });
    
    shortcutHelpBtn.addEventListener('click', function() {
        shortcutModal.style.display = 'flex';
    });
    
    closeModalBtn.addEventListener('click', function() {
        shortcutModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === shortcutModal) {
            shortcutModal.style.display = 'none';
        }
    });
    
    // Functions
    async function loadSettings() {
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
                resolve(result);
            });
        });
    }
    
    async function initI18n() {
        const settings = await loadSettings();
        const lang = settings.language;
        
        try {
            const response = await fetch(chrome.runtime.getURL(`locales/${lang}.json`));
            const translations = await response.json();
            
            // Apply translations
            document.querySelectorAll('[data-i18n]').forEach(element => {
                const key = element.getAttribute('data-i18n');
                if (translations[key]) {
                    if (element.tagName === 'INPUT' || element.tagName === 'BUTTON') {
                        element.value = translations[key];
                    } else {
                        element.textContent = translations[key];
                    }
                }
            });
        } catch (error) {
            console.error("Error loading translations:", error);
        }
    }
    
    function updateSpeedDisplay() {
        currentSpeedEl.textContent = currentSpeed.toFixed(2) + 'x';
        speedSlider.value = currentSpeed;
        speedInput.value = currentSpeed.toFixed(2);
        
        // Update preset button states
        presetButtons.forEach(btn => {
            const btnSpeed = parseFloat(btn.getAttribute('data-speed'));
            if (Math.abs(btnSpeed - currentSpeed) < 0.01) {
                btn.style.background = '#4A6FA5';
                btn.style.color = 'white';
            } else {
                btn.style.background = 'white';
                btn.style.color = '#4A6FA5';
            }
        });
    }
    
    function updateUI() {
        if (isEnabled) {
            statusDot.style.backgroundColor = '#4CAF50';
            statusText.textContent = 'Active';
            toggleExtensionBtn.textContent = 'Disable Extension';
            toggleExtensionBtn.style.background = 'linear-gradient(135deg, #f44336 0%, #e53935 100%)';
        } else {
            statusDot.style.backgroundColor = '#f44336';
            statusText.textContent = 'Disabled';
            toggleExtensionBtn.textContent = 'Enable Extension';
            toggleExtensionBtn.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
        }
    }
    
    async function changeSpeed(delta) {
        let newSpeed = currentSpeed + delta;
        newSpeed = Math.max(0.1, Math.min(10, newSpeed));
        await setSpeed(newSpeed);
    }
    
    async function setSpeed(speed) {
        currentSpeed = parseFloat(speed.toFixed(2));
        updateSpeedDisplay();
        
        // Save to storage
        await chrome.storage.local.set({lastSpeed: currentSpeed});
        
        // Send to content script
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs.length === 0) return;
            
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "setSpeed",
                speed: currentSpeed
            }).catch(() => {
                console.log("Tab not ready yet");
            });
        });
    }
});