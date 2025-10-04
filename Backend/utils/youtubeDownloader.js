const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');

class YouTubeDownloader {
  constructor() {
    this.onProgress = null;
    this.currentDownloadId = null; // Track current download
  }

  async downloadAudio(url, options = {}) {
    try {
      // Validate URL format
      if (!this.isValidYouTubeUrl(url)) {
        throw new Error('Invalid YouTube URL format');
      }

      const outputDir = path.join(os.tmpdir(), 'audioking-downloads');
      
      // Use async fs.mkdir instead of sync
      await fs.mkdir(outputDir, { recursive: true });
      
      // Generate a unique download ID for this session
      this.currentDownloadId = crypto.randomBytes(8).toString('hex');
      
      // Improved output template with unique session ID
      const outputTemplate = path.join(outputDir, `yt-${this.currentDownloadId}-%(id)s-%(title).50s.%(ext)s`);
      
      return new Promise((resolve, reject) => {
        const ytDlpArgs = [
          '--format', 'bestaudio/best',
          '--extract-audio',
          '--audio-format', 'mp3',
          '--audio-quality', '0', // Best quality
          '--output', outputTemplate,
          '--no-playlist', // Only download single video
          '--no-check-certificate',
          '--extractor-args', 'youtube:player_client=android',
          '--ignore-errors', // Continue on minor errors
          '--no-warnings',
          '--force-overwrites', // Ensure fresh downloads
          url
        ];

        const ytDlp = spawn('yt-dlp', ytDlpArgs);

        let outputPath = '';
        let title = '';
        let currentProgress = 0;
        let videoId = this.extractVideoId(url);

        ytDlp.stdout.on('data', (data) => {
          const output = data.toString();
          console.log('yt-dlp output:', output);
          
          // Parse progress information more accurately
          const progressMatch = output.match(/\[download\]\s+(\d+(?:\.\d+)?)%/);
          if (progressMatch) {
            currentProgress = parseFloat(progressMatch[1]);
            if (this.onProgress) {
              this.onProgress({
                progress: currentProgress,
                status: `Downloading... ${currentProgress.toFixed(1)}%`
              });
            }
          }
          
          // Multiple patterns for extracting destination filename
          const destinationPatterns = [
            /\[download\] Destination: (.+)/,
            /\[download\] (.+?)(?:\s+has already been downloaded)/,
            /\[ffmpeg\] Destination: (.+)/,
            /\[ExtractAudio\] Destination: (.+)/
          ];

          for (const pattern of destinationPatterns) {
            const match = output.match(pattern);
            if (match && !outputPath) {
              const potentialPath = match[1].trim();
              // Ensure this path contains our unique download ID
              if (potentialPath.includes(this.currentDownloadId)) {
                outputPath = potentialPath;
                title = this.extractTitleFromPath(outputPath);
                console.log(`Detected output path: ${outputPath}`);
                break;
              }
            }
          }

          // Handle conversion progress
          if (output.includes('[ffmpeg]') && output.includes('Converting')) {
            if (this.onProgress) {
              this.onProgress({
                progress: 90,
                status: 'Converting to MP3...'
              });
            }
          }

          // Handle post-processing
          if (output.includes('[ffmpeg]') && output.includes('Destination:')) {
            const match = output.match(/\[ffmpeg\] Destination: (.+)/);
            if (match && match[1].includes(this.currentDownloadId)) {
              outputPath = match[1].trim();
              title = this.extractTitleFromPath(outputPath);
              console.log(`Post-processing output: ${outputPath}`);
            }
          }
        });

        let errorOutput = '';
        ytDlp.stderr.on('data', (data) => {
          const error = data.toString();
          errorOutput += error;
          console.error(`yt-dlp stderr: ${error}`);
          
          // Handle specific error cases
          if (error.includes('Video unavailable') || error.includes('Private video')) {
            reject(new Error('Video is unavailable or private'));
            return;
          }
          if (error.includes('Sign in to confirm your age')) {
            reject(new Error('Age-restricted video - cannot download'));
            return;
          }
          if (error.includes('HTTP Error 429')) {
            reject(new Error('Rate limited by YouTube - try again later'));
            return;
          }
        });

        ytDlp.on('error', (error) => {
          if (error.code === 'ENOENT') {
            reject(new Error('yt-dlp not found. Please install yt-dlp: pip install yt-dlp'));
          } else {
            reject(new Error(`Failed to start yt-dlp: ${error.message}`));
          }
        });

        ytDlp.on('close', async (code) => {
          console.log(`yt-dlp process closed with code: ${code}`);
          console.log(`Expected output path: ${outputPath}`);
          
          if (code === 0) {
            try {
              // If we don't have the output path, try to find it using our unique ID
              if (!outputPath || !(await this.fileExists(outputPath))) {
                console.log('Output path not detected, searching for file...');
                outputPath = await this.findDownloadedFileById(outputDir, this.currentDownloadId);
              }
              
              if (outputPath && await this.fileExists(outputPath)) {
                const stats = await fs.stat(outputPath);
                
                // Final progress update
                if (this.onProgress) {
                  this.onProgress({ progress: 100, status: 'Download complete' });
                }
                
                resolve({
                  filePath: outputPath,
                  title: title || this.extractTitleFromPath(outputPath) || 'YouTube Audio',
                  duration: null,
                  fileSize: stats.size,
                  downloadId: this.currentDownloadId
                });
              } else {
                // Last resort: try to find any file with the video ID
                const fallbackPath = await this.findDownloadedFileByVideoId(outputDir, videoId);
                if (fallbackPath && await this.fileExists(fallbackPath)) {
                  const stats = await fs.stat(fallbackPath);
                  resolve({
                    filePath: fallbackPath,
                    title: this.extractTitleFromPath(fallbackPath) || 'YouTube Audio',
                    duration: null,
                    fileSize: stats.size,
                    downloadId: this.currentDownloadId
                  });
                } else {
                  reject(new Error('Download completed but file not found'));
                }
              }
            } catch (error) {
              reject(new Error(`Post-download verification failed: ${error.message}`));
            }
          } else {
            const errorMsg = this.parseError(errorOutput) || `Process exited with code: ${code}`;
            reject(new Error(`YouTube download failed: ${errorMsg}`));
          }
        });

        // Set timeout to prevent hanging
        const timeout = setTimeout(() => {
          ytDlp.kill('SIGTERM');
          reject(new Error('Download timeout - process took too long (5 minutes)'));
        }, 300000); // 5 minutes

        ytDlp.on('close', () => {
          clearTimeout(timeout);
        });
      });
    } catch (error) {
      throw new Error(`Download setup failed: ${error.message}`);
    }
  }

  // Extract video ID from YouTube URL
  extractVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  // Find downloaded file by unique download ID
  async findDownloadedFileById(outputDir, downloadId) {
    try {
      const files = await fs.readdir(outputDir);
      const matchingFiles = files
        .filter(f => f.includes(downloadId) && f.endsWith('.mp3'))
        .sort((a, b) => {
          // Sort by modification time (newest first)
          try {
            const statsA = require('fs').statSync(path.join(outputDir, a));
            const statsB = require('fs').statSync(path.join(outputDir, b));
            return statsB.mtime - statsA.mtime;
          } catch {
            return b.localeCompare(a);
          }
        });
      
      console.log(`Found ${matchingFiles.length} files with download ID ${downloadId}:`, matchingFiles);
      return matchingFiles[0] ? path.join(outputDir, matchingFiles[0]) : null;
    } catch (error) {
      console.error('Error finding file by ID:', error);
      return null;
    }
  }

  // Fallback: find by video ID
  async findDownloadedFileByVideoId(outputDir, videoId) {
    if (!videoId) return null;
    
    try {
      const files = await fs.readdir(outputDir);
      const matchingFiles = files
        .filter(f => f.includes(videoId) && f.endsWith('.mp3'))
        .sort((a, b) => {
          try {
            const statsA = require('fs').statSync(path.join(outputDir, a));
            const statsB = require('fs').statSync(path.join(outputDir, b));
            return statsB.mtime - statsA.mtime;
          } catch {
            return b.localeCompare(a);
          }
        });
      
      return matchingFiles[0] ? path.join(outputDir, matchingFiles[0]) : null;
    } catch (error) {
      console.error('Error finding file by video ID:', error);
      return null;
    }
  }

  async findDownloadedFile(outputDir) {
    try {
      const files = await fs.readdir(outputDir);
      const mp3Files = files
        .filter(f => f.endsWith('.mp3') && f.includes('yt-'))
        .sort((a, b) => {
          // Sort by modification time (newest first)
          try {
            const statsA = require('fs').statSync(path.join(outputDir, a));
            const statsB = require('fs').statSync(path.join(outputDir, b));
            return statsB.mtime - statsA.mtime;
          } catch {
            return b.localeCompare(a);
          }
        });
      
      return mp3Files[0] ? path.join(outputDir, mp3Files[0]) : null;
    } catch {
      return null;
    }
  }

  extractTitleFromPath(filePath) {
    const basename = path.basename(filePath, '.mp3');
    // Remove the yt-{downloadId}-{videoId}- prefix to get clean title
    return basename.replace(/^yt-[a-f0-9]+-[\w-]+-/, '').trim() || 'YouTube Audio';
  }

  // ... rest of the methods remain the same ...
  async getVideoInfo(url) {
    try {
      if (!this.isValidYouTubeUrl(url)) {
        throw new Error('Invalid YouTube URL format');
      }

      return new Promise((resolve, reject) => {
        const ytDlp = spawn('yt-dlp', [
          '--print', 'title',
          '--print', 'duration', 
          '--print', 'thumbnail',
          '--no-warnings',
          '--extractor-args', 'youtube:player_client=android',
          url
        ]);
        
        let output = '';
        let errorOutput = '';
        
        ytDlp.stdout.on('data', (data) => {
          output += data.toString();
        });

        ytDlp.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });
        
        ytDlp.on('error', (error) => {
          if (error.code === 'ENOENT') {
            reject(new Error('yt-dlp not found. Please install yt-dlp: pip install yt-dlp'));
          } else {
            reject(new Error(`Failed to get video info: ${error.message}`));
          }
        });
        
        ytDlp.on('close', (code) => {
          if (code === 0) {
            const lines = output.trim().split('\n');
            resolve({
              title: lines[0] || 'Unknown Title',
              duration: this.parseDuration(lines[1]),
              thumbnail: lines[2] || null
            });
          } else {
            const errorMsg = this.parseError(errorOutput) || 'Failed to get video info';
            reject(new Error(errorMsg));
          }
        });

        const timeout = setTimeout(() => {
          ytDlp.kill('SIGTERM');
          reject(new Error('Timeout getting video info'));
        }, 30000);

        ytDlp.on('close', () => {
          clearTimeout(timeout);
        });
      });
    } catch (error) {
      throw new Error(`Video info setup failed: ${error.message}`);
    }
  }

  isValidYouTubeUrl(url) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)[\w-]+/;
    return youtubeRegex.test(url);
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  parseDuration(durationStr) {
    if (!durationStr || durationStr === 'NA' || durationStr === 'null') return null;
    
    const seconds = parseInt(durationStr);
    if (isNaN(seconds)) return null;
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  parseError(errorOutput) {
    if (!errorOutput) return null;
    
    if (errorOutput.includes('Video unavailable')) return 'Video is unavailable';
    if (errorOutput.includes('Private video')) return 'Video is private';
    if (errorOutput.includes('Sign in to confirm')) return 'Age-restricted video';
    if (errorOutput.includes('No video formats found')) return 'No downloadable formats available';
    if (errorOutput.includes('HTTP Error 429')) return 'Rate limited - try again later';
    if (errorOutput.includes('HTTP Error 403')) return 'Access forbidden - video may be region blocked';
    if (errorOutput.includes('Requested format is not available')) return 'Requested audio format not available';
    
    const lines = errorOutput.trim().split('\n');
    const meaningfulLine = lines.find(line => 
      (line.includes('ERROR') || line.includes('WARNING')) && line.length > 10
    );
    
    return meaningfulLine || 'Unknown error occurred';
  }

  sanitizeFilename(filename) {
    return filename
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/\.+/g, '.')
      .trim()
      .substring(0, 100);
  }

  async cleanup(maxAge = 24 * 60 * 60 * 1000) {
    try {
      const outputDir = path.join(os.tmpdir(), 'audioking-downloads');
      
      if (!(await this.fileExists(outputDir))) {
        return;
      }

      const files = await fs.readdir(outputDir);
      const now = Date.now();
      let cleanedCount = 0;
      
      for (const file of files) {
        try {
          const filePath = path.join(outputDir, file);
          const stats = await fs.stat(filePath);
          
          if (now - stats.mtime.getTime() > maxAge) {
            await fs.unlink(filePath);
            cleanedCount++;
            console.log(`Cleaned up old file: ${file}`);
          }
        } catch (error) {
          console.error(`Failed to clean up ${file}:`, error.message);
        }
      }
      
      console.log(`Cleanup completed: removed ${cleanedCount} old files`);
    } catch (error) {
      console.error('Cleanup failed:', error.message);
    }
  }

  async getDownloadStats() {
    try {
      const outputDir = path.join(os.tmpdir(), 'audioking-downloads');
      
      if (!(await this.fileExists(outputDir))) {
        return { totalFiles: 0, totalSize: 0, oldestFile: null, newestFile: null };
      }

      const files = await fs.readdir(outputDir);
      const mp3Files = files.filter(f => f.endsWith('.mp3'));
      
      let totalSize = 0;
      let oldestTime = Infinity;
      let newestTime = 0;
      let oldestFile = null;
      let newestFile = null;
      
      for (const file of mp3Files) {
        try {
          const filePath = path.join(outputDir, file);
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
          
          if (stats.mtime.getTime() < oldestTime) {
            oldestTime = stats.mtime.getTime();
            oldestFile = file;
          }
          
          if (stats.mtime.getTime() > newestTime) {
            newestTime = stats.mtime.getTime();
            newestFile = file;
          }
        } catch (error) {
          console.error(`Failed to stat ${file}:`, error.message);
        }
      }
      
      return {
        totalFiles: mp3Files.length,
        totalSize: totalSize,
        totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
        oldestFile: oldestFile,
        newestFile: newestFile
      };
    } catch (error) {
      console.error('Failed to get download stats:', error.message);
      return { totalFiles: 0, totalSize: 0, oldestFile: null, newestFile: null };
    }
  }
}

module.exports = { YouTubeDownloader };
