const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');
const https = require('https');
const os = require('os');

class ExecutableManager {
  constructor() {
    this.appRoot = path.resolve(__dirname, '..', '..');
    this.binDir = path.join(this.appRoot, 'bin');
    this.scriptsDir = path.join(this.appRoot, 'scripts');
  }

  async ensureBinDirectory() {
    try {
      await fs.mkdir(this.binDir, { recursive: true });
      return true;
    } catch (error) {
      console.error('Failed to create bin directory:', error);
      return false;
    }
  }

  getFFmpegPath() {
    const platform = process.platform;
    if (platform === 'win32') {
      return path.join(this.binDir, 'ffmpeg.exe');
    } else if (platform === 'darwin') {
      return path.join(this.binDir, 'ffmpeg');
    } else {
      return path.join(this.binDir, 'ffmpeg');
    }
  }

  getFFprobePath() {
    const platform = process.platform;
    if (platform === 'win32') {
      return path.join(this.binDir, 'ffprobe.exe');
    } else if (platform === 'darwin') {
      return path.join(this.binDir, 'ffprobe');
    } else {
      return path.join(this.binDir, 'ffprobe');
    }
  }

  getYtDlpPath() {
    const platform = process.platform;
    if (platform === 'win32') {
      // Check scripts directory first (where it currently exists)
      const scriptsPath = path.join(this.scriptsDir, 'yt-dlp.exe');
      const binPath = path.join(this.binDir, 'yt-dlp.exe');
      return { scriptsPath, binPath, preferred: scriptsPath };
    } else if (platform === 'darwin') {
      return { preferred: path.join(this.binDir, 'yt-dlp') };
    } else {
      return { preferred: path.join(this.binDir, 'yt-dlp') };
    }
  }

  async checkExecutable(execPath) {
    try {
      await fs.access(execPath, fs.constants.F_OK | fs.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  }

  async testExecutable(execPath, testArgs = ['--version']) {
    return new Promise((resolve) => {
      const proc = spawn(execPath, testArgs, { stdio: 'pipe' });
      let settled = false;
      
      proc.on('close', (code) => {
        if (!settled) {
          settled = true;
          resolve(code === 0);
        }
      });
      
      proc.on('error', () => {
        if (!settled) {
          settled = true;
          resolve(false);
        }
      });
      
      setTimeout(() => {
        if (!settled) {
          settled = true;
          try { proc.kill(); } catch {}
          resolve(false);
        }
      }, 5000);
    });
  }

  async downloadFile(url, outputPath) {
    return new Promise((resolve, reject) => {
      const file = require('fs').createWriteStream(outputPath);
      
      https.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Handle redirect
          return this.downloadFile(response.headers.location, outputPath)
            .then(resolve)
            .catch(reject);
        }
        
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          resolve();
        });
        
        file.on('error', (err) => {
          fs.unlink(outputPath).catch(() => {});
          reject(err);
        });
      }).on('error', (err) => {
        reject(err);
      });
    });
  }

  async downloadFFmpeg() {
    const platform = process.platform;
    const arch = process.arch;
    
    if (platform !== 'win32') {
      throw new Error('Auto-download only supported on Windows. Please install FFmpeg manually.');
    }

    await this.ensureBinDirectory();
    
    const ffmpegPath = this.getFFmpegPath();
    const ffprobePath = this.getFFprobePath();
    
    // Download URLs for Windows
    const baseUrl = 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest';
    const zipName = arch === 'x64' ? 'ffmpeg-master-latest-win64-gpl.zip' : 'ffmpeg-master-latest-win32-gpl.zip';
    
    console.log('Downloading FFmpeg...');
    // This is a simplified version - in production you'd want to download and extract the zip
    throw new Error('Please download FFmpeg manually from https://ffmpeg.org/download.html and place ffmpeg.exe and ffprobe.exe in the bin directory');
  }

  async downloadYtDlp() {
    const platform = process.platform;
    
    if (platform !== 'win32') {
      throw new Error('Auto-download only supported on Windows. Please install yt-dlp manually.');
    }

    await this.ensureBinDirectory();
    
    const ytDlpPaths = this.getYtDlpPath();
    const outputPath = ytDlpPaths.binPath;
    
    const downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
    
    console.log('Downloading yt-dlp.exe...');
    try {
      await this.downloadFile(downloadUrl, outputPath);
      
      // Make executable on Unix-like systems
      if (platform !== 'win32') {
        await fs.chmod(outputPath, 0o755);
      }
      
      console.log('yt-dlp.exe downloaded successfully');
      return true;
    } catch (error) {
      console.error('Failed to download yt-dlp:', error);
      throw error;
    }
  }

  async getSystemInfo() {
    return {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      appRoot: this.appRoot,
      binDir: this.binDir,
      scriptsDir: this.scriptsDir
    };
  }
}

module.exports = { ExecutableManager };