const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

/**
 * Validate if file is a supported audio format
 */
async function validateAudioFile(filePath) {
  try {
    // Check file exists
    await fs.access(filePath);
    
    // Check file extension
    const ext = path.extname(filePath).toLowerCase();
    const supportedExtensions = [
      '.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', 
      '.wma', '.aiff', '.opus', '.3gp', '.ac3', '.amr'
    ];
    
    if (!supportedExtensions.includes(ext)) {
      return false;
    }
    
    // Additional validation could include:
    // - File size check
    // - Magic number validation
    // - Audio format validation using ffprobe
    
    return true;
    
  } catch (error) {
    console.error('Audio file validation error:', error);
    return false;
  }
}

/**
 * Extract audio metadata using ffprobe
 */
async function getAudioMetadata(filePath) {
  return new Promise((resolve) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath
    ]);
    
    let stdout = '';
    let stderr = '';
    
    ffprobe.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    ffprobe.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    ffprobe.on('close', (code) => {
      if (code === 0 && stdout) {
        try {
          const data = JSON.parse(stdout);
          const audioStream = data.streams?.find(stream => stream.codec_type === 'audio');
          
          const metadata = {
            duration: parseFloat(data.format?.duration) || null,
            bitrate: parseInt(data.format?.bit_rate) || null,
            size: parseInt(data.format?.size) || null,
            format: data.format?.format_name || null,
            sampleRate: audioStream ? parseInt(audioStream.sample_rate) : null,
            channels: audioStream ? parseInt(audioStream.channels) : null,
            codec: audioStream ? audioStream.codec_name : null
          };
          
          resolve(metadata);
        } catch (error) {
          console.error('Error parsing ffprobe output:', error);
          resolve(getFallbackMetadata(filePath));
        }
      } else {
        console.warn('ffprobe failed, using fallback metadata');
        resolve(getFallbackMetadata(filePath));
      }
    });
    
    ffprobe.on('error', (error) => {
      console.warn('ffprobe error:', error.message);
      resolve(getFallbackMetadata(filePath));
    });
  });
}

/**
 * Get basic file metadata as fallback
 */
async function getFallbackMetadata(filePath) {
  try {
    const stats = await fs.stat(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    return {
      duration: null,
      bitrate: null,
      size: stats.size,
      format: ext.substring(1),
      sampleRate: null,
      channels: null,
      codec: null,
      created: stats.birthtime,
      modified: stats.mtime
    };
  } catch (error) {
    return {
      duration: null,
      bitrate: null,
      size: null,
      format: null,
      sampleRate: null,
      channels: null,
      codec: null
    };
  }
}

/**
 * Get supported audio formats
 */
function getSupportedFormats() {
  return {
    input: [
      'mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 
      'wma', 'aiff', 'opus', '3gp', 'ac3', 'amr'
    ],
    output: [
      'mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'opus', 'aiff'
    ]
  };
}

/**
 * Format file size in human readable format
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration in MM:SS format
 */
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Generate waveform data points
 */
async function generateWaveform(filePath, samples = 1000) {
  // This would require audio processing libraries
  // For now, return mock data
  return Array.from({ length: samples }, () => Math.random() * 2 - 1);
}

module.exports = {
  validateAudioFile,
  getAudioMetadata,
  getFallbackMetadata,
  getSupportedFormats,
  formatFileSize,
  formatDuration,
  generateWaveform
};
