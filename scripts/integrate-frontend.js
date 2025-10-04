/**
 * Integration helper for existing frontend files
 * Run this after copying your frontend files to integrate them properly
 */

const fs = require('fs').promises;
const path = require('path');

async function integrateFrontend() {
  console.log('🔧 Integrating frontend files...');
  
  try {
    // Update your existing JS files to use the Electron API
    const frontendJsFiles = [
      'Frontend/js/main.js',
      'Frontend/js/converter.js'
    ];
    
    for (const file of frontendJsFiles) {
      if (await fileExists(file)) {
        console.log(`📝 Processing ${file}...`);
        // Add Electron API integration code at the top of each JS file
        const electronIntegration = `
// Electron API Integration
const electronAPI = window.electronAPI;
const logger = window.logger;

// Check if running in Electron
const isElectron = electronAPI !== undefined;

if (isElectron) {
  logger.log('Running in Electron environment');
} else {
  logger.warn('Not running in Electron - some features may be limited');
}

`;
        
        const existingContent = await fs.readFile(file, 'utf-8');
        const updatedContent = electronIntegration + existingContent;
        await fs.writeFile(file, updatedContent);
        
        console.log(`✅ Updated ${file}`);
      }
    }
    
    console.log('🎉 Frontend integration completed!');
  } catch (error) {
    console.error('❌ Integration failed:', error);
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Run integration
integrateFrontend();
