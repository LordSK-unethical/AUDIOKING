// Backend/api/audioHandler.js
const { ipcMain } = require('electron');

/**
 * Initialize audio API without registering duplicate IPC handlers
 */
function initializeAudioAPI() {
  console.log('[AudioHandler] Initializing audio API...');
  
  // DO NOT register dialog handlers here - they are in main.js
  // Only register audio processing specific handlers
  
  setupAudioProcessingHandlers();
  
  console.log('[AudioHandler] Audio API initialized');
}

/**
 * Setup audio processing specific handlers (not file dialogs)
 */
function setupAudioProcessingHandlers() {
  // Only register handlers that are NOT in main.js
  
  // Example: Audio processing specific handlers
  ipcMain.handle('audio:get-metadata', async (event, filePath) => {
    try {
      console.log('[AudioHandler] Getting metadata for:', filePath);
      // Your metadata extraction logic here
      return { success: true, metadata: {} };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle('audio:analyze', async (event, audioData) => {
    try {
      console.log('[AudioHandler] Analyzing audio data');
      // Your audio analysis logic here
      return { success: true, analysis: {} };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  console.log('[AudioHandler] Audio processing handlers registered');
}

module.exports = {
  initializeAudioAPI
};
