const fs = require('fs').promises;
const path = require('path');
const { ExecutableManager } = require('../Backend/utils/executableManager');

async function setupExecutables() {
  console.log('Setting up AUDIOKING executables...');
  
  const execManager = new ExecutableManager();
  const systemInfo = await execManager.getSystemInfo();
  
  console.log('System Info:', systemInfo);
  
  // Ensure bin directory exists
  await execManager.ensureBinDirectory();
  console.log('✓ Bin directory created/verified');
  
  // Check current yt-dlp in scripts directory
  const ytDlpPaths = execManager.getYtDlpPath();
  
  try {
    if (ytDlpPaths.scriptsPath) {
      const exists = await execManager.checkExecutable(ytDlpPaths.scriptsPath);
      if (exists) {
        console.log('✓ yt-dlp.exe found in scripts directory:', ytDlpPaths.scriptsPath);
        
        // Test if it works
        const works = await execManager.testExecutable(ytDlpPaths.scriptsPath, ['--version']);
        if (works) {
          console.log('✓ yt-dlp.exe is working correctly');
        } else {
          console.log('⚠ yt-dlp.exe exists but not working properly');
        }
      } else {
        console.log('✗ yt-dlp.exe not found in scripts directory');
      }
    }
  } catch (error) {
    console.error('Error checking yt-dlp:', error.message);
  }
  
  // Check FFmpeg
  const ffmpegPath = execManager.getFFmpegPath();
  const ffprobePath = execManager.getFFprobePath();
  
  try {
    const ffmpegExists = await execManager.checkExecutable(ffmpegPath);
    const ffprobeExists = await execManager.checkExecutable(ffprobePath);
    
    if (ffmpegExists && ffprobeExists) {
      console.log('✓ FFmpeg executables found in bin directory');
    } else {
      console.log('✗ FFmpeg executables not found in bin directory');
      console.log('Expected paths:');
      console.log('  FFmpeg:', ffmpegPath);
      console.log('  FFprobe:', ffprobePath);
      console.log('');
      console.log('Please download FFmpeg from https://ffmpeg.org/download.html');
      console.log('and place ffmpeg.exe and ffprobe.exe in the bin directory.');
    }
  } catch (error) {
    console.error('Error checking FFmpeg:', error.message);
  }
  
  console.log('Setup complete!');
}

if (require.main === module) {
  setupExecutables().catch(console.error);
}

module.exports = { setupExecutables };