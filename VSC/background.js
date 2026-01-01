// Background service worker for video speed controller

// Handle keyboard commands from manifest (4 commands only)
chrome.commands.onCommand.addListener(async (command) => {
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    if (tabs.length === 0) return;
    
    const tabId = tabs[0].id;
    
    try {
        switch (command) {
            case 'increase_speed':
                await chrome.tabs.sendMessage(tabId, {
                    action: "setSpeed",
                    delta: 0.25
                });
                break;
                
            case 'decrease_speed':
                await chrome.tabs.sendMessage(tabId, {
                    action: "setSpeed",
                    delta: -0.25
                });
                break;
                
            case 'reset_speed':
                await chrome.tabs.sendMessage(tabId, {
                    action: "setSpeed",
                    speed: 1.0
                });
                break;
                
            case 'toggle_enabled':
                const data = await chrome.storage.local.get('extensionEnabled');
                const newState = !data.extensionEnabled;
                await chrome.storage.local.set({extensionEnabled: newState});
                await chrome.tabs.sendMessage(tabId, {
                    action: "toggleEnabled",
                    enabled: newState
                });
                break;
        }
    } catch (error) {
        console.log('Could not send command to tab:', error);
    }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Set default settings
        const defaultSettings = {
            speedStep: 0.25,
            customSpeed1: 1.5,
            customSpeed2: 2.0,
            language: 'en',
            extensionEnabled: true,
            lastSpeed: 1.0
        };
        
        chrome.storage.local.set(defaultSettings, () => {
            console.log('Default settings saved');
        });
        
        // Open options page on install
        chrome.runtime.openOptionsPage();
    }
    
    if (details.reason === 'update') {
        console.log('Extension updated to version 2.0.1');
    }
});

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
    console.log('Video Speed Controller started');
});

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // Only inject for http/https pages
        if (tab.url.startsWith('http')) {
            // Ping content script to check if it's loaded
            chrome.tabs.sendMessage(tabId, {action: "ping"}, (response) => {
                if (chrome.runtime.lastError) {
                    // Content script not injected, this is normal
                    console.log('Content script will load on next page load');
                }
            });
        }
    }
});

// Handle extension icon click to toggle enabled state
chrome.action.onClicked.addListener(async (tab) => {
    const data = await chrome.storage.local.get('extensionEnabled');
    const newState = !data.extensionEnabled;
    
    await chrome.storage.local.set({extensionEnabled: newState});
    
    // Update icon
    const iconPath = newState ? {
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
    try {
        await chrome.tabs.sendMessage(tab.id, {
            action: "toggleEnabled",
            enabled: newState
        });
    } catch (error) {
        console.log('Could not send message to tab:', error);
    }
});