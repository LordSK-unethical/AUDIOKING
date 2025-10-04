const { Menu, shell, dialog, app } = require('electron');

/**
 * Setup application menus
 */
function setupMenus(mainWindow) {
  if (!mainWindow) {
    console.error('[MenuSetup] No main window provided');
    return;
  }

  console.log('[MenuSetup] Setting up application menus');

  const template = [
    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Audio File...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu:open-file');
            }
          }
        },
        {
          label: 'Open Multiple Files...',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu:open-multiple-files');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu:save-file');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    
    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' }
      ]
    },
    
    // Convert menu
    {
      label: 'Convert',
      submenu: [
        {
          label: 'Start Conversion',
          accelerator: 'CmdOrCtrl+Enter',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu:start-conversion');
            }
          }
        },
        {
          label: 'Cancel Conversion',
          accelerator: 'Escape',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu:cancel-conversion');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Batch Convert',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu:batch-convert');
            }
          }
        }
      ]
    },
    
    // View menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    
    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    
    // Help menu
    {
      label: 'Help',
      submenu: [
        {
          label: 'About AUDIOKING',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'About AUDIOKING',
                message: 'AUDIOKING v1.0.0',
                detail: 'Universal Audio Converter\n\nBuilt with Electron and FFmpeg\nSupports MP3, WAV, FLAC, and OPUS formats'
              });
            }
          }
        },
        {
          label: 'Supported Formats',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu:show-formats');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Report Issue',
          click: () => {
            shell.openExternal('https://github.com/your-repo/audioking/issues');
          }
        },
        {
          label: 'Documentation',
          click: () => {
            shell.openExternal('https://github.com/your-repo/audioking/wiki');
          }
        }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });

    // Window menu for macOS
    template[5].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' }
    ];
  }

  try {
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    console.log('[MenuSetup] Application menu set successfully');
  } catch (error) {
    console.error('[MenuSetup] Error setting up menus:', error);
  }
}

module.exports = { setupMenus };
