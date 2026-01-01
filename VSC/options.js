document.addEventListener('DOMContentLoaded', async function() {
    // Load current settings
    await loadSettings();
    
    // Setup event listeners
    document.getElementById('saveSettings').addEventListener('click', saveSettings);
    document.getElementById('resetSettings').addEventListener('click', resetSettings);
    
    // Load shortcuts info
    loadShortcutsInfo();
});

async function loadSettings() {
    const defaultSettings = {
        speedStep: 0.25,
        customSpeed1: 1.5,
        customSpeed2: 2.0,
        language: 'en',
        maxSpeed: 10,
        minSpeed: 0.1
    };
    
    const settings = await chrome.storage.local.get(defaultSettings);
    
    // Populate form fields
    document.getElementById('speedStep').value = settings.speedStep;
    document.getElementById('customSpeed1').value = settings.customSpeed1;
    document.getElementById('customSpeed2').value = settings.customSpeed2;
    document.getElementById('languageSelect').value = settings.language;
    document.getElementById('maxSpeed').value = settings.maxSpeed;
    document.getElementById('minSpeed').value = settings.minSpeed;
}

function loadShortcutsInfo() {
    const shortcutsList = document.getElementById('shortcutsList');
    shortcutsList.innerHTML = `
        <div class="shortcut-info">
            <h3>Available Shortcuts</h3>
            <p>These shortcuts work when the extension is enabled:</p>
            
            <div class="shortcut-item">
                <strong>Ctrl+Shift+↑</strong> - Increase speed by 0.25x
            </div>
            <div class="shortcut-item">
                <strong>Ctrl+Shift+↓</strong> - Decrease speed by 0.25x
            </div>
            <div class="shortcut-item">
                <strong>Ctrl+Shift+0</strong> - Reset to normal speed (1.0x)
            </div>
            <div class="shortcut-item">
                <strong>Ctrl+Shift+E</strong> - Toggle extension on/off
            </div>
            <div class="shortcut-item">
                <strong>Ctrl+Shift+1</strong> - Set to Custom Speed 1 (${document.getElementById('customSpeed1').value}x)
            </div>
            <div class="shortcut-item">
                <strong>Ctrl+Shift+2</strong> - Set to Custom Speed 2 (${document.getElementById('customSpeed2').value}x)
            </div>
            <div class="shortcut-item">
                <strong>Ctrl+Shift+V</strong> - Open speed menu
            </div>
            
            <p style="margin-top: 15px; color: #666;">
                <em>Note: To customize keyboard shortcuts, visit:</em><br>
                <strong>chrome://extensions/shortcuts</strong> (Chrome)<br>
                <strong>edge://extensions/shortcuts</strong> (Edge)<br>
                <strong>about:addons → Extension Shortcuts</strong> (Firefox)
            </p>
        </div>
    `;
}

async function saveSettings() {
    const settings = {
        speedStep: parseFloat(document.getElementById('speedStep').value),
        customSpeed1: parseFloat(document.getElementById('customSpeed1').value),
        customSpeed2: parseFloat(document.getElementById('customSpeed2').value),
        language: document.getElementById('languageSelect').value,
        maxSpeed: parseFloat(document.getElementById('maxSpeed').value),
        minSpeed: parseFloat(document.getElementById('minSpeed').value)
    };
    
    // Validate settings
    let isValid = true;
    let errorMessage = '';
    
    if (settings.speedStep < 0.1 || settings.speedStep > 1) {
        isValid = false;
        errorMessage = 'Speed step must be between 0.1 and 1';
    }
    
    if (settings.customSpeed1 < settings.minSpeed || settings.customSpeed1 > settings.maxSpeed) {
        isValid = false;
        errorMessage = `Custom speed 1 must be between ${settings.minSpeed} and ${settings.maxSpeed}`;
    }
    
    if (settings.customSpeed2 < settings.minSpeed || settings.customSpeed2 > settings.maxSpeed) {
        isValid = false;
        errorMessage = `Custom speed 2 must be between ${settings.minSpeed} and ${settings.maxSpeed}`;
    }
    
    if (settings.maxSpeed < 5 || settings.maxSpeed > 20) {
        isValid = false;
        errorMessage = 'Maximum speed must be between 5 and 20';
    }
    
    if (settings.minSpeed < 0.05 || settings.minSpeed > 1) {
        isValid = false;
        errorMessage = 'Minimum speed must be between 0.05 and 1';
    }
    
    if (!isValid) {
        showMessage(errorMessage, 'error');
        return;
    }
    
    // Save settings
    await chrome.storage.local.set(settings);
    showMessage('Settings saved successfully!', 'success');
    
    // Update shortcuts info
    loadShortcutsInfo();
    
    // Notify content scripts about settings change
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                action: "reloadSettings"
            }).catch(() => {
                // Tab might not have content script
            });
        });
    });
    
    // Reload extension popup if open
    chrome.runtime.sendMessage({action: "settingsUpdated"});
}

async function resetSettings() {
    const defaultSettings = {
        speedStep: 0.25,
        customSpeed1: 1.5,
        customSpeed2: 2.0,
        language: 'en',
        maxSpeed: 10,
        minSpeed: 0.1,
        extensionEnabled: true
    };
    
    if (confirm('Are you sure you want to reset all settings to default?')) {
        await chrome.storage.local.set(defaultSettings);
        await loadSettings();
        loadShortcutsInfo();
        showMessage('All settings have been reset to default.', 'success');
    }
}

function showMessage(message, type) {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.style.display = 'block';
    
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 3000);
}