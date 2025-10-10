const { ExecutableManager } = require('./executableManager');
const path = require('path');
const fs = require('fs').promises;

class FFmpegInstaller {
  constructor() {
    this.execManager = new ExecutableManager();
  }

  static async checkFFmpegInstallation() {
    const installer = new FFmpegInstaller();
    return await installer.checkInstallation();
  }

  async checkInstallation() {
    try {
      const ffmpegPath = this.execManager.getFFmpegPath();
      const ffprobePath = this.execManager.getFFprobePath();
      
      // Check bundled executables first
      const hasFFmpeg = await this.execManager.checkExecutable(ffmpegPath) && 
                       await this.execManager.testExecutable(ffmpegPath);
      const hasFFprobe = await this.execManager.checkExecutable(ffprobePath) && 
                        await this.execManager.testExecutable(ffprobePath);
      
      if (hasFFmpeg && hasFFprobe) {
        return {
          ffmpeg: true,
          ffprobe: true,
          ready: true,
          ffmpegPath,
          ffprobePath,
          source: 'bundled'
        };
      }
      
      // Fallback to system PATH
      const systemFFmpeg = await this.isSystemExecutableAvailable('ffmpeg');
      const systemFFprobe = await this.isSystemExecutableAvailable('ffprobe');
      
      return {
        ffmpeg: systemFFmpeg,
        ffprobe: systemFFprobe,
        ready: systemFFmpeg && systemFFprobe,
        ffmpegPath: systemFFmpeg ? 'ffmpeg' : null,
        ffprobePath: systemFFprobe ? 'ffprobe' : null,
        source: (systemFFmpeg && systemFFprobe) ? 'system' : 'none'
      };
    } catch (error) {
      return { ffmpeg: false, ffprobe: false, ready: false, error: error.message };
    }
  }

  async isSystemExecutableAvailable(execName) {
    return await this.execManager.testExecutable(execName, ['-version']);
  }

  static getInstallationInstructions() {
    const platform = process.platform;
    
    const instructions = {
      win32: {
        title: 'Windows Installation',
        steps: [
          '1. Download FFmpeg from https://ffmpeg.org/download.html',
          '2. Extract to C:\\ffmpeg',
          '3. Add C:\\ffmpeg\\bin to your PATH environment variable',
          '4. Restart AUDIOKING'
        ],
        quickInstall: 'Or use: winget install ffmpeg'
      },
      darwin: {
        title: 'macOS Installation',
        steps: [
          '1. Install Homebrew if not already installed',
          '2. Run: brew install ffmpeg',
          '3. Restart AUDIOKING'
        ],
        quickInstall: 'brew install ffmpeg'
      },
      linux: {
        title: 'Linux Installation',
        steps: [
          'Ubuntu/Debian: sudo apt install ffmpeg',
          'CentOS/RHEL: sudo yum install ffmpeg',
          'Arch: sudo pacman -S ffmpeg',
          'Restart AUDIOKING after installation'
        ],
        quickInstall: 'sudo apt install ffmpeg'
      }
    };

    return instructions[platform] || instructions.linux;
  }
}

module.exports = { FFmpegInstaller };