const { spawn } = require('child_process');
const os = require('os');

class YtDlpInstaller {
  static async checkYtDlpInstallation() {
    return new Promise((resolve) => {
      const ytDlp = spawn('yt-dlp', ['--version']);
      ytDlp.on('close', (code) => {
        resolve(code === 0);
      });
      ytDlp.on('error', () => {
        resolve(false);
      });
    });
  }

  static async installYtDlp() {
    const platform = os.platform();
    
    return new Promise((resolve, reject) => {
      let installCmd, installArgs;
      
      if (platform === 'win32') {
        installCmd = 'winget';
        installArgs = ['install', 'yt-dlp'];
      } else if (platform === 'darwin') {
        installCmd = 'brew';
        installArgs = ['install', 'yt-dlp'];
      } else {
        installCmd = 'sudo';
        installArgs = ['apt', 'install', '-y', 'yt-dlp'];
      }
      
      const installer = spawn(installCmd, installArgs);
      
      installer.on('close', (code) => {
        if (code === 0) {
          resolve(true);
        } else {
          reject(new Error(`Installation failed with code ${code}`));
        }
      });
      
      installer.on('error', (error) => {
        reject(new Error(`Installation error: ${error.message}`));
      });
    });
  }
}

module.exports = { YtDlpInstaller };