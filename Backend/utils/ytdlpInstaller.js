const { ExecutableManager } = require('./executableManager');
const path = require('path');
const fs = require('fs').promises;

class YtDlpInstaller {
  constructor() {
    this.execManager = new ExecutableManager();
  }

  static async checkYtDlpInstallation() {
    const installer = new YtDlpInstaller();
    return await installer.checkInstallation();
  }

  async checkInstallation() {
    try {
      const ytDlpPaths = this.execManager.getYtDlpPath();
      
      // Check scripts directory first (current location)
      if (ytDlpPaths.scriptsPath && await this.execManager.checkExecutable(ytDlpPaths.scriptsPath)) {
        const works = await this.execManager.testExecutable(ytDlpPaths.scriptsPath, ['--version']);
        if (works) {
          return {
            available: true,
            path: ytDlpPaths.scriptsPath,
            source: 'scripts'
          };
        }
      }
      
      // Check bin directory
      if (ytDlpPaths.binPath && await this.execManager.checkExecutable(ytDlpPaths.binPath)) {
        const works = await this.execManager.testExecutable(ytDlpPaths.binPath, ['--version']);
        if (works) {
          return {
            available: true,
            path: ytDlpPaths.binPath,
            source: 'bin'
          };
        }
      }
      
      // Check system PATH
      const systemWorks = await this.execManager.testExecutable('yt-dlp', ['--version']);
      if (systemWorks) {
        return {
          available: true,
          path: 'yt-dlp',
          source: 'system'
        };
      }
      
      return {
        available: false,
        path: null,
        source: 'none'
      };
    } catch (error) {
      return {
        available: false,
        path: null,
        source: 'none',
        error: error.message
      };
    }
  }

  static async installYtDlp() {
    const installer = new YtDlpInstaller();
    return await installer.install();
  }

  async install() {
    try {
      console.log('Installing yt-dlp.exe...');
      await this.execManager.downloadYtDlp();
      
      // Verify installation
      const status = await this.checkInstallation();
      if (status.available) {
        console.log('yt-dlp.exe installed successfully');
        return true;
      } else {
        throw new Error('Installation verification failed');
      }
    } catch (error) {
      console.error('yt-dlp installation failed:', error);
      throw error;
    }
  }

  getExecutablePath() {
    const ytDlpPaths = this.execManager.getYtDlpPath();
    return ytDlpPaths.preferred;
  }
}

module.exports = { YtDlpInstaller };