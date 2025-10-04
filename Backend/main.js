const { app, BrowserWindow, ipcMain, Menu, dialog, shell, systemPreferences, powerMonitor } = require('electron');
const path = require('path');
const fs = require('fs').promises;
let isDev = false;
try {
  isDev = require('electron-is-dev');
} catch (error) {
  isDev = process.env.NODE_ENV === 'development';
}
const { initializeAudioAPI } = require('./api/audioHandler');
const os = require('os');
const { FFmpegInstaller } = require('./utils/ffmpegInstaller');
const { setupMenus } = require('./utils/menuSetup');

// Application state
let mainWindow = null;
let splashWindow = null;
let isQuitting = false;
let appSettings = {};

/**
 * Create the main application window with advanced configuration
 */
function createMainWindow() {
  console.log('[Main] Creating advanced AUDIOKING BrowserWindow...');
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload', 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    },
    icon: path.join(__dirname, '../assets/icons/audioking-icon.png'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#1a1a1a',
    frame: true,
    resizable: true,
    maximizable: true,
    minimizable: true,
    fullscreenable: true,
    autoHideMenuBar: false,
    vibrancy: process.platform === 'darwin' ? 'dark' : null,
    visualEffectState: 'active'
  });

  // Load the main application
  const indexPath = path.join(__dirname, '../Frontend/index.html');
  console.log('[Main] Loading main application:', indexPath);
  mainWindow.loadFile(indexPath);

  // Handle window ready state
  mainWindow.once('ready-to-show', () => {
    console.log('[Main] Main window ready - showing AUDIOKING');
    
    // Show main window
    mainWindow.show();
    mainWindow.focus();
    
    // Open DevTools in development
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Window event handlers
  mainWindow.on('closed', () => {
    console.log('[Main] Main window closed');
    mainWindow = null;
  });

  mainWindow.on('close', (e) => {
    if (process.platform === 'darwin' && !isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    console.log('[Main] Opening external URL:', url);
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Performance monitoring
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Main] Page load completed');
  });

  return mainWindow;
}

/**
 * Setup ALL IPC handlers in one place - CENTRALIZED
 */
function setupAllIpcHandlers() {
  console.log('[Main] Setting up ALL IPC handlers...');

  // Navigation handler
  ipcMain.handle('navigation:goto', async (event, page, options = {}) => {
    try {
      console.log('[Main] Navigation request:', page, options);
      
      const pageMap = {
        'index': 'index.html',
        'converter': 'pages/converter.html',
        'batch': 'pages/batch.html',
        'settings': 'pages/settings.html',
        'help': 'pages/help.html'
      };
      
      const fileName = pageMap[page];
      if (!fileName) {
        throw new Error(`Unknown page: ${page}`);
      }
      
      const filePath = path.join(__dirname, '../Frontend', fileName);
      
      // Verify file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        throw new Error(`Page file not found: ${fileName}`);
      }
      
      console.log('[Main] Loading page file:', filePath);
      await mainWindow.loadFile(filePath);
      
      // Update window title
      const pageTitles = {
        'index': 'AUDIOKING - Universal Audio Converter',
        'converter': 'Audio Converter - AUDIOKING',
        'batch': 'Batch Processing - AUDIOKING',
        'settings': 'Settings - AUDIOKING',
        'help': 'Help & Support - AUDIOKING'
      };
      
      if (pageTitles[page]) {
        mainWindow.setTitle(pageTitles[page]);
      }
      
      console.log('[Main] Successfully navigated to:', page);
      return { success: true, page, timestamp: Date.now() };
      
    } catch (error) {
      console.error('[Main] Navigation error:', error);
      return { success: false, error: error.message, timestamp: Date.now() };
    }
  });

  // Single file selection handler
  ipcMain.handle('dialog:select-audio-file', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Select Audio File - AUDIOKING',
        filters: [
          {
            name: 'Audio Files',
            extensions: ['mp3', 'wav', 'flac', 'opus', 'aac', 'ogg', 'm4a', 'wma', 'aiff']
          }
        ],
        properties: ['openFile']
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        console.log('[Main] Audio file selected:', filePath);
        
        const stats = await fs.stat(filePath);
        return {
          success: true,
          filePath,
          fileName: path.basename(filePath),
          fileSize: stats.size,
          lastModified: stats.mtime
        };
      }
      
      return { success: false, canceled: true };
    } catch (error) {
      console.error('[Main] File selection error:', error);
      return { success: false, error: error.message };
    }
  });

  // Multiple files selection handler
  ipcMain.handle('dialog:select-audio-files', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Select Multiple Audio Files - AUDIOKING',
        filters: [
          {
            name: 'Audio Files',
            extensions: ['mp3', 'wav', 'flac', 'opus', 'aac', 'ogg', 'm4a', 'wma', 'aiff']
          }
        ],
        properties: ['openFile', 'multiSelections']
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const fileDetails = await Promise.all(
          result.filePaths.map(async (filePath) => {
            const stats = await fs.stat(filePath);
            return {
              filePath,
              fileName: path.basename(filePath),
              fileSize: stats.size,
              lastModified: stats.mtime
            };
          })
        );
        
        console.log('[Main] Multiple audio files selected:', fileDetails.length);
        return { success: true, files: fileDetails };
      }
      
      return { success: false, canceled: true };
    } catch (error) {
      console.error('[Main] Multiple file selection error:', error);
      return { success: false, error: error.message };
    }
  });

  // Audio conversion handler
  ipcMain.handle('audio:convert', async (event, audioData, options) => {
    try {
      console.log('[Main] Audio conversion request');
      const { AudioProcessor } = require('./api/audioProcessor');
      const processor = new AudioProcessor();
      
      // Handle progress updates
      processor.onProgress = (progress) => {
        mainWindow.webContents.send('audio:conversion-progress', progress);
      };
      
      let inputPath;
      if (audioData.path) {
        inputPath = audioData.path;
      } else if (audioData.buffer) {
        // Save buffer to temp file
        const tempPath = path.join(os.tmpdir(), `temp-${Date.now()}-${audioData.name}`);
        const buffer = Buffer.isBuffer(audioData.buffer) ? audioData.buffer : Buffer.from(audioData.buffer);
        await fs.writeFile(tempPath, buffer);
        inputPath = tempPath;
      } else {
        throw new Error('No file path or buffer provided');
      }
      
      const result = await processor.convertAudio(inputPath, options);
      
      // Create download URL
      const downloadUrl = `file://${result.outputPath}`;
      
      return {
        success: true,
        outputPath: result.outputPath,
        filename: result.filename,
        size: result.size,
        downloadUrl
      };
    } catch (error) {
      console.error('[Main] Audio conversion error:', error);
      return { success: false, error: error.message };
    }
  });

  // Batch conversion handler
  ipcMain.handle('audio:batch-convert', async (event, audioFiles, options) => {
    try {
      console.log('[Main] Batch conversion request for', audioFiles?.length, 'files');
      console.log('[Main] Options:', options);
      const { AudioProcessor } = require('./api/audioProcessor');
      const processor = new AudioProcessor();
      const results = [];
      
      for (let i = 0; i < audioFiles.length; i++) {
        const audioData = audioFiles[i];
        
        // Send batch progress
        mainWindow.webContents.send('audio:batch-progress', {
          current: i + 1,
          total: audioFiles.length,
          filename: audioData.name
        });
        
        try {
          let inputPath;
          if (audioData.path) {
            inputPath = audioData.path;
          } else if (audioData.buffer) {
            const tempPath = path.join(os.tmpdir(), `temp-${Date.now()}-${audioData.name}`);
            const buffer = Buffer.isBuffer(audioData.buffer) ? audioData.buffer : Buffer.from(audioData.buffer);
            await fs.writeFile(tempPath, buffer);
            inputPath = tempPath;
          } else {
            throw new Error('No file path or buffer provided');
          }
          
          const result = await processor.convertAudio(inputPath, options);
          results.push({
            success: true,
            outputPath: result.outputPath,
            filename: result.filename,
            size: result.size,
            downloadUrl: `file://${result.outputPath}`
          });
        } catch (error) {
          console.error('[Main] Batch file conversion error:', error);
          results.push({ success: false, error: error.message, filename: audioData.name });
        }
      }
      
      return { success: true, results };
    } catch (error) {
      console.error('[Main] Batch conversion error:', error);
      return { success: false, error: error.message };
    }
  });

  // Notification handler
  ipcMain.handle('notification:show', async (event, title, body, options = {}) => {
    try {
      console.log('[Main] Showing notification:', title, body);
      // Add native notification logic here
      return { success: true, timestamp: Date.now() };
    } catch (error) {
      console.error('[Main] Notification error:', error);
      return { success: false, error: error.message };
    }
  });

  // App info handler
  ipcMain.handle('app:get-info', async () => {
    const { FFmpegInstaller } = require('./utils/ffmpegInstaller');
    const ffmpegStatus = await FFmpegInstaller.checkFFmpegInstallation();
    
    return {
      name: app.getName(),
      version: app.getVersion(),
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      platform: process.platform,
      arch: process.arch,
      locale: app.getLocale(),
      ffmpeg: ffmpegStatus
    };
  });

  // FFmpeg installation check
  ipcMain.handle('ffmpeg:check-installation', async () => {
    const { FFmpegInstaller } = require('./utils/ffmpegInstaller');
    return await FFmpegInstaller.checkFFmpegInstallation();
  });

  // FFmpeg installation instructions
  ipcMain.handle('ffmpeg:get-instructions', async () => {
    const { FFmpegInstaller } = require('./utils/ffmpegInstaller');
    return FFmpegInstaller.getInstallationInstructions();
  });

  // yt-dlp installation check
  ipcMain.handle('ytdlp:check-installation', async () => {
    const { YtDlpInstaller } = require('./utils/ytdlpInstaller');
    return await YtDlpInstaller.checkYtDlpInstallation();
  });

  // yt-dlp installation
  ipcMain.handle('ytdlp:install', async () => {
    const { YtDlpInstaller } = require('./utils/ytdlpInstaller');
    try {
      await YtDlpInstaller.installYtDlp();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // YouTube download handler
  ipcMain.handle('youtube:download', async (event, url, options) => {
    try {
      console.log('[Main] YouTube download request:', url);
      const { YouTubeDownloader } = require('./utils/youtubeDownloader');
      const downloader = new YouTubeDownloader();
      
      downloader.onProgress = (progress) => {
        mainWindow.webContents.send('youtube:download-progress', progress);
      };
      
      const result = await downloader.downloadAudio(url, options);
      
      return {
        success: true,
        filePath: result.filePath,
        title: result.title,
        duration: result.duration
      };
    } catch (error) {
      console.error('[Main] YouTube download error:', error);
      return { success: false, error: error.message };
    }
  });

  // YouTube info handler
  ipcMain.handle('youtube:get-info', async (event, url) => {
    try {
      const { YouTubeDownloader } = require('./utils/youtubeDownloader');
      const downloader = new YouTubeDownloader();
      const info = await downloader.getVideoInfo(url);
      return { success: true, info };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Settings handlers
  ipcMain.handle('settings:get', async () => {
    const { SettingsStore } = require('./utils/settingsStore');
    const store = new SettingsStore();
    return store.getAll();
  });

  ipcMain.handle('settings:set', async (event, key, value) => {
    const { SettingsStore } = require('./utils/settingsStore');
    const store = new SettingsStore();
    store.set(key, value);
    return { success: true };
  });

  console.log('[Main] All IPC handlers registered successfully');
}

/**
 * Application lifecycle management
 */
app.whenReady().then(async () => {
  console.log('[Main] Electron app ready - initializing AUDIOKING Desktop...');
  
  try {
    // 1. FIRST: Register all IPC handlers BEFORE creating window
    setupAllIpcHandlers();
    
    // 2. SECOND: Initialize audio API (without registering duplicate handlers)
    console.log('[Main] Initializing audio API...');
    initializeAudioAPI(); // This should NOT register IPC handlers now
    
    // 3. THIRD: Create main window
    createMainWindow();
    
    // 4. FOURTH: Setup application menus
    if (mainWindow) {
      setupMenus(mainWindow);
    }
    
    // 5. Check FFmpeg and yt-dlp installation on startup
    setTimeout(async () => {
      try {
        const ffmpegStatus = await FFmpegInstaller.checkFFmpegInstallation();
        if (!ffmpegStatus.ready) {
          console.warn('[Main] FFmpeg not available, showing setup guide');
        }
        
        const { YtDlpInstaller } = require('./utils/ytdlpInstaller');
        const ytDlpAvailable = await YtDlpInstaller.checkYtDlpInstallation();
        if (!ytDlpAvailable) {
          console.log('[Main] yt-dlp not found, attempting installation...');
          try {
            await YtDlpInstaller.installYtDlp();
            console.log('[Main] yt-dlp installed successfully');
          } catch (error) {
            console.warn('[Main] yt-dlp installation failed:', error.message);
          }
        }
      } catch (error) {
        console.error('[Main] Installation check failed:', error);
      }
    }, 2000);
    
    // 5. Setup security
    setupApplicationSecurity();
    
    console.log('[Main] AUDIOKING Desktop initialization complete');
    
  } catch (error) {
    console.error('[Main] Initialization error:', error);
    dialog.showErrorBox('Initialization Error', `Failed to initialize AUDIOKING: ${error.message}`);
  }
});

/**
 * Setup application security
 */
function setupApplicationSecurity() {
  app.on('web-contents-created', (event, contents) => {
    contents.on('will-navigate', (navigationEvent, navigationUrl) => {
      try {
        const parsedUrl = new URL(navigationUrl);
        console.log('[Main] Navigation security check:', navigationUrl);
        
        if (parsedUrl.protocol === 'file:') {
          const appDirPath = path.resolve(__dirname, '..');
          let targetPath;
          
          if (process.platform === 'win32') {
            targetPath = path.resolve(decodeURIComponent(parsedUrl.pathname.substring(1)));
          } else {
            targetPath = path.resolve(decodeURIComponent(parsedUrl.pathname));
          }
          
          if (targetPath.startsWith(appDirPath)) {
            console.log('[Main] ✓ Navigation allowed within app directory');
            return;
          }
        }
        
        console.warn('[Main] ✗ Navigation blocked:', navigationUrl);
        navigationEvent.preventDefault();
        
      } catch (error) {
        console.error('[Main] Navigation security error:', error);
        if (navigationUrl.startsWith('file://')) {
          console.log('[Main] ⚠ Allowing file navigation despite security error');
          return;
        }
        navigationEvent.preventDefault();
      }
    });
  });
}

// App lifecycle handlers
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  } else if (mainWindow) {
    mainWindow.show();
  }
});

app.on('window-all-closed', () => {
  console.log('[Main] All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  console.log('[Main] Application quitting...');
  isQuitting = true;
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('[Main] Uncaught Exception:', error);
  if (!isDev && mainWindow && !mainWindow.isDestroyed()) {
    dialog.showErrorBox('Application Error', `An error occurred: ${error.message}`);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Main] Unhandled Promise Rejection:', reason);
});

// Export for use in other modules
module.exports = { 
  mainWindow: () => mainWindow,
  createMainWindow,
  isMainWindowReady: () => mainWindow && !mainWindow.isDestroyed()
};

console.log('[Main] AUDIOKING Advanced Desktop main.js loaded successfully');
