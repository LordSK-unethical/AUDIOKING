const { contextBridge, ipcRenderer } = require('electron');

console.log('[Preload] AUDIOKING Advanced preload script initializing...');

/**
 * Secure API exposure with comprehensive functionality
 */
const electronAPI = {
  // Core Navigation
  navigateTo: (page, options = {}) => {
    console.log('[Preload] Advanced navigation request:', page, options);
    return ipcRenderer.invoke('navigation:goto', page, options);
  },

  // Enhanced File Operations
  selectAudioFile: () => {
    console.log('[Preload] Single audio file selection request');
    return ipcRenderer.invoke('dialog:select-audio-file');
  },

  selectAudioFiles: () => {
    console.log('[Preload] Multiple audio files selection request');
    return ipcRenderer.invoke('dialog:select-audio-files');
  },

  selectFolder: () => {
    console.log('[Preload] Folder selection request');
    return ipcRenderer.invoke('dialog:select-folder');
  },

  // Audio Conversion API
  convertAudio: (audioData, options) => {
    console.log('[Preload] Audio conversion request');
    return ipcRenderer.invoke('audio:convert', audioData, options);
  },

  batchConvert: (audioFiles, options) => {
    console.log('[Preload] Batch conversion request for', audioFiles?.length, 'files');
    return ipcRenderer.invoke('audio:batch-convert', audioFiles, options);
  },

  cancelConversion: (conversionId) => {
    console.log('[Preload] Cancel conversion request:', conversionId);
    return ipcRenderer.invoke('audio:cancel-conversion', conversionId);
  },

  // Progress and Event Handling
  onAudioProgress: (callback) => {
    const listener = (event, progressData) => {
      callback(progressData);
    };
    ipcRenderer.on('audio:conversion-progress', listener);
    return () => ipcRenderer.removeListener('audio:conversion-progress', listener);
  },

  onBatchProgress: (callback) => {
    const listener = (event, batchData) => {
      callback(batchData);
    };
    ipcRenderer.on('audio:batch-progress', listener);
    return () => ipcRenderer.removeListener('audio:batch-progress', listener);
  },

  onConversionComplete: (callback) => {
    const listener = (event, completionData) => {
      callback(completionData);
    };
    ipcRenderer.on('audio:conversion-complete', listener);
    return () => ipcRenderer.removeListener('audio:conversion-complete', listener);
  },

  onConversionError: (callback) => {
    const listener = (event, errorData) => {
      callback(errorData);
    };
    ipcRenderer.on('audio:conversion-error', listener);
    return () => ipcRenderer.removeListener('audio:conversion-error', listener);
  },

  // Enhanced Notifications
  showNotification: (title, body, options = {}) => {
    console.log('[Preload] Notification request:', title);
    return ipcRenderer.invoke('notification:show', title, body, options);
  },

  // Application Information
  getAppInfo: () => {
    console.log('[Preload] App info request');
    return ipcRenderer.invoke('app:get-info');
  },

  // Settings Management
  getSettings: () => {
    console.log('[Preload] Get settings request');
    return ipcRenderer.invoke('settings:get');
  },

  saveSettings: (key, value) => {
    console.log('[Preload] Save settings request');
    return ipcRenderer.invoke('settings:set', key, value);
  },

  // System Integration
  showSaveDialog: (options = {}) => {
    console.log('[Preload] Save dialog request');
    return ipcRenderer.invoke('dialog:save', options);
  },

  showMessageBox: (options) => {
    console.log('[Preload] Message box request');
    return ipcRenderer.invoke('dialog:message-box', options);
  },

  // File System Operations (secure)
  readFile: (filePath) => {
    console.log('[Preload] Read file request');
    return ipcRenderer.invoke('fs:read-file', filePath);
  },

  writeFile: (filePath, data) => {
    console.log('[Preload] Write file request');
    return ipcRenderer.invoke('fs:write-file', filePath, data);
  },

  // Advanced Features
  getSystemInfo: () => {
    console.log('[Preload] System info request');
    return ipcRenderer.invoke('system:get-info');
  },

  openExternal: (url) => {
    console.log('[Preload] Open external URL request:', url);
    return ipcRenderer.invoke('shell:open-external', url);
  },

  // Performance Monitoring
  getMemoryUsage: () => {
    return ipcRenderer.invoke('process:memory-usage');
  },

  // Development and Debugging
  isDev: () => {
    return ipcRenderer.invoke('app:is-dev');
  },

  openDevTools: () => {
    return ipcRenderer.invoke('dev:open-tools');
  },

  // FFmpeg Installation Management
  checkFFmpegInstallation: () => {
    console.log('[Preload] FFmpeg installation check request');
    return ipcRenderer.invoke('ffmpeg:check-installation');
  },

  getFFmpegInstructions: () => {
    console.log('[Preload] FFmpeg installation instructions request');
    return ipcRenderer.invoke('ffmpeg:get-instructions');
  },

  // YouTube Integration
  downloadFromYouTube: (url, options) => {
    console.log('[Preload] YouTube download request:', url);
    return ipcRenderer.invoke('youtube:download', url, options);
  },

  getYouTubeInfo: (url) => {
    console.log('[Preload] YouTube info request:', url);
    return ipcRenderer.invoke('youtube:get-info', url);
  },

  onYouTubeProgress: (callback) => {
    const listener = (event, progressData) => {
      callback(progressData);
    };
    ipcRenderer.on('youtube:download-progress', listener);
    return () => ipcRenderer.removeListener('youtube:download-progress', listener);
  },

  // Test function to verify API
  test: () => {
    console.log('[Preload] API test function called');
    return Promise.resolve('AUDIOKING electronAPI is working correctly!');
  }
};

// Expose the comprehensive API
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Enhanced logging system
const logger = {
  log: (...args) => {
    console.log('[Renderer]', ...args);
  },
  error: (...args) => {
    console.error('[Renderer ERROR]', ...args);
  },
  warn: (...args) => {
    console.warn('[Renderer WARN]', ...args);
  },
  info: (...args) => {
    console.info('[Renderer INFO]', ...args);
  },
  debug: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[Renderer DEBUG]', ...args);
    }
  }
};

contextBridge.exposeInMainWorld('logger', logger);

// Expose version information
contextBridge.exposeInMainWorld('appVersion', {
  electron: process.versions.electron,
  node: process.versions.node,
  chrome: process.versions.chrome,
  platform: process.platform
});

console.log('[Preload] Advanced electronAPI exposed with', Object.keys(electronAPI).length, 'methods');
console.log('[Preload] Enhanced logger system initialized');
console.log('[Preload] AUDIOKING preload script loaded successfully');
