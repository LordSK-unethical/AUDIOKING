// Settings page functionality
document.addEventListener('DOMContentLoaded', () => {
    const saveSettings = document.getElementById('saveSettings');
    const resetSettings = document.getElementById('resetSettings');
    const backToHome = document.getElementById('backToHome');
    const browseOutputFolder = document.getElementById('browseOutputFolder');

    // Load saved settings
    loadSettings();

    // Event listeners
    saveSettings?.addEventListener('click', () => {
        const settings = {
            defaultQuality: document.getElementById('defaultQuality')?.value,
            defaultSampleRate: document.getElementById('defaultSampleRate')?.value,
            outputFolder: document.getElementById('outputFolder')?.value,
            preserveMetadata: document.getElementById('preserveMetadata')?.checked,
            autoDownload: document.getElementById('autoDownload')?.checked,
            showNotifications: document.getElementById('showNotifications')?.checked,
            darkTheme: document.getElementById('darkTheme')?.checked,
            autoUpdates: document.getElementById('autoUpdates')?.checked,
            language: document.getElementById('language')?.value
        };
        
        localStorage.setItem('audiokingSettings', JSON.stringify(settings));
        
        // Apply theme immediately to all pages
        if (settings.darkTheme) {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        }
        
        alert('Settings saved successfully!');
    });

    resetSettings?.addEventListener('click', () => {
        if (confirm('Reset all settings to default values?')) {
            localStorage.removeItem('audiokingSettings');
            loadSettings();
            alert('Settings reset to default values.');
        }
    });

    browseOutputFolder?.addEventListener('click', async () => {
        if (window.electronAPI && window.electronAPI.showSaveDialog) {
            try {
                const result = await window.electronAPI.showSaveDialog({
                    properties: ['openDirectory'],
                    title: 'Select Output Folder'
                });
                if (result && !result.canceled && result.filePath) {
                    document.getElementById('outputFolder').value = result.filePath;
                }
            } catch (error) {
                console.error('Folder selection error:', error);
                alert('Folder selection not available in this environment.');
            }
        } else {
            alert('Folder selection requires Electron environment.');
        }
    });

    backToHome?.addEventListener('click', () => {
        window.location.href = '../index.html';
    });

    function loadSettings() {
        const defaultSettings = {
            defaultQuality: 'medium',
            defaultSampleRate: '44100',
            outputFolder: 'Downloads',
            preserveMetadata: true,
            autoDownload: false,
            showNotifications: true,
            darkTheme: true,
            autoUpdates: true,
            language: 'en'
        };

        const saved = localStorage.getItem('audiokingSettings');
        const settings = saved ? JSON.parse(saved) : defaultSettings;

        // Apply settings to form elements
        Object.keys(settings).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = settings[key];
                } else {
                    element.value = settings[key];
                }
            }
        });
        
        // Apply theme
        if (settings.darkTheme) {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        }
    }
});