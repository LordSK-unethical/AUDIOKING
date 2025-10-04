const { ipcMain, dialog, shell, Notification } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const { mainWindow } = require('../main');

/**
 * Initialize all IPC handlers
 */
function initializeAPI() {
  console.log('Initializing IPC handlers...');
  
  // File dialog handlers
  setupFileHandlers();
  
  // Converter handlers (example)
  setupConverterHandlers();
  
  // App info handlers
  setupAppHandlers();
  
  // Navigation handlers
  setupNavigationHandlers();
  
  // Notification handlers
  setupNotificationHandlers();
  
  console.log('IPC handlers initialized successfully');
}

/**
 * File operation handlers
 */
function setupFileHandlers() {
  // File selection dialog
  ipcMain.handle('dialog:selectFile', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
          { name: 'All Files', extensions: ['*'] },
          { name: 'Text Files', extensions: ['txt', 'md', 'json'] },
          { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
        ]
      });
      
      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }
      
      return result.filePaths[0];
    } catch (error) {
      console.error('Error selecting file:', error);
      throw error;
    }
  });
  
  // File save operation
  ipcMain.handle('file:save', async (event, data, filename) => {
    try {
      const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: filename,
        filters: [
          { name: 'All Files', extensions: ['*'] },
          { name: 'Text Files', extensions: ['txt'] },
          { name: 'JSON Files', extensions: ['json'] }
        ]
      });
      
      if (result.canceled || !result.filePath) {
        return null;
      }
      
      await fs.writeFile(result.filePath, data, 'utf-8');
      return result.filePath;
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  });
  
  // File read operation
  ipcMain.handle('file:read', async (event, filepath) => {
    try {
      const data = await fs.readFile(filepath, 'utf-8');
      return data;
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  });
}

/**
 * Converter operation handlers (example for your converter page)
 */
function setupConverterHandlers() {
  ipcMain.handle('converter:convert', async (event, data, options) => {
    try {
      console.log('Converting data with options:', options);
      
      // Example conversion logic - replace with your actual conversion code
      let convertedData;
      
      switch (options.type) {
        case 'text-to-upper':
          convertedData = data.toUpperCase();
          break;
        case 'text-to-lower':
          convertedData = data.toLowerCase();
          break;
        case 'reverse-text':
          convertedData = data.split('').reverse().join('');
          break;
        default:
          convertedData = data; // No conversion
      }
      
      return {
        success: true,
        data: convertedData,
        originalSize: data.length,
        convertedSize: convertedData.length
      };
    } catch (error) {
      console.error('Conversion error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });
}

/**
 * App information handlers
 */
function setupAppHandlers() {
  const { app } = require('electron');
  
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion();
  });
  
  ipcMain.handle('app:getInfo', () => {
    return {
      name: app.getName(),
      version: app.getVersion(),
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      platform: process.platform,
      arch: process.arch
    };
  });
}

/**
 * Navigation handlers
 */
function setupNavigationHandlers() {
  ipcMain.handle('navigation:goto', async (event, page) => {
    try {
      const validPages = ['index', 'converter', 'about'];
      
      if (!validPages.includes(page)) {
        throw new Error(`Invalid page: ${page}`);
      }
      
      const htmlFile = page === 'index' 
        ? 'index.html' 
        : `pages/${page}.html`;
        
      const filePath = path.join(__dirname, '../../Frontend', htmlFile);
      
      // Check if file exists
      await fs.access(filePath);
      
      // Navigate to the page
      await mainWindow.loadFile(filePath);
      
      return { success: true, page };
    } catch (error) {
      console.error('Navigation error:', error);
      return { success: false, error: error.message };
    }
  });
}

/**
 * Notification handlers
 */
function setupNotificationHandlers() {
  ipcMain.handle('notification:show', (event, title, body) => {
    try {
      const notification = new Notification({
        title: title,
        body: body,
        icon: path.join(__dirname, '../../assets/icons/app-icon.png')
      });
      
      notification.show();
      return { success: true };
    } catch (error) {
      console.error('Notification error:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { initializeAPI };
