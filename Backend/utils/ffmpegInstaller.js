const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class FFmpegInstaller {
  static async checkFFmpegInstallation() {
    try {
      const hasFFmpeg = await this.isFFmpegAvailable();
      const hasFFprobe = await this.isFFprobeAvailable();
      
      return {
        ffmpeg: hasFFmpeg,
        ffprobe: hasFFprobe,
        ready: hasFFmpeg && hasFFprobe
      };
    } catch (error) {
      return { ffmpeg: false, ffprobe: false, ready: false, error: error.message };
    }
  }

  static async isFFmpegAvailable() {
    return new Promise((resolve) => {
      const proc = spawn('ffmpeg', ['-version']);
      let settled = false;
      
      proc.on('close', (code) => {
        if (!settled) { settled = true; resolve(code === 0); }
      });
      
      proc.on('error', () => {
        if (!settled) { settled = true; resolve(false); }
      });
      
      setTimeout(() => {
        if (!settled) {
          settled = true;
          try { proc.kill(); } catch {}
          resolve(false);
        }
      }, 3000);
    });
  }

  static async isFFprobeAvailable() {
    return new Promise((resolve) => {
      const proc = spawn('ffprobe', ['-version']);
      let settled = false;
      
      proc.on('close', (code) => {
        if (!settled) { settled = true; resolve(code === 0); }
      });
      
      proc.on('error', () => {
        if (!settled) { settled = true; resolve(false); }
      });
      
      setTimeout(() => {
        if (!settled) {
          settled = true;
          try { proc.kill(); } catch {}
          resolve(false);
        }
      }, 3000);
    });
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