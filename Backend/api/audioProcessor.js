const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const { FFmpegInstaller } = require('../utils/ffmpegInstaller');
const { ExecutableManager } = require('../utils/executableManager');

class AudioProcessor {
  constructor() {
    this.onProgress = null;
    this.totalDuration = null;
    this.execManager = new ExecutableManager();
  }

  async convertAudio(inputPath, options) {
    console.log('[Processor] convertAudio()', { inputPath, options });

    const outDir = path.join(os.tmpdir(), 'audioking-output');
    await fs.mkdir(outDir, { recursive: true });

    const base = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(outDir, `${base}-${Date.now()}.${options.outputFormat}`);

    // Check FFmpeg availability
    const ffmpegStatus = await FFmpegInstaller.checkFFmpegInstallation();
    if (!ffmpegStatus.ready) {
      throw new Error('FFmpeg not available. Please install FFmpeg or place ffmpeg.exe in the bin directory.');
    }

    // Get the correct FFmpeg executable path
    const ffmpegPath = ffmpegStatus.ffmpegPath;
    const ffprobePath = ffmpegStatus.ffprobePath;
    
    console.log('[Processor] Using FFmpeg:', ffmpegPath);
    console.log('[Processor] Using FFprobe:', ffprobePath);

    // Get duration for progress tracking
    this.totalDuration = await this.getDurationWithFFprobe(inputPath, ffprobePath);
    const args = this.buildArgs(inputPath, outputPath, options);
    console.log('[Processor] ffmpeg', args.join(' '));

    await new Promise((resolve, reject) => {
      const proc = spawn(ffmpegPath, args);

      proc.stderr.on('data', (d) => {
        const s = d.toString();
        const p = this.parseProgress(s);
        if (p && this.onProgress) this.onProgress(p);
      });

      proc.on('error', (e) => reject(new Error(`ffmpeg spawn error: ${e.message}`)));
      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited with code ${code}`));
      });
    });

    return { outputPath, filename: path.basename(outputPath), size: (await fs.stat(outputPath)).size };
  }

  buildArgs(input, output, options) {
    const args = ['-y', '-i', input, '-progress', 'pipe:2'];
    const fmt = (options.outputFormat || '').toLowerCase();

    if (fmt === 'mp3') {
      args.push('-codec:a', 'libmp3lame');
      if (options.bitrate) args.push('-b:a', `${options.bitrate}k`);
    } else if (fmt === 'wav') {
      args.push('-codec:a', 'pcm_s16le');
    } else if (fmt === 'flac') {
      args.push('-codec:a', 'flac');
    } else if (fmt === 'aac') {
      args.push('-codec:a', 'aac');
      if (options.bitrate) args.push('-b:a', `${options.bitrate}k`);
    } else if (fmt === 'ogg') {
      args.push('-codec:a', 'libvorbis');
      if (options.bitrate) args.push('-b:a', `${options.bitrate}k`);
    } else if (fmt === 'opus') {
      args.push('-codec:a', 'libopus');
      if (options.bitrate) args.push('-b:a', `${options.bitrate}k`);
    } else if (fmt === 'm4a') {
      args.push('-codec:a', 'aac', '-f', 'mp4');
      if (options.bitrate) args.push('-b:a', `${options.bitrate}k`);
    } else if (fmt === 'aiff') {
      args.push('-codec:a', 'pcm_s16be');
    }

    if (options.sampleRate) args.push('-ar', String(options.sampleRate));
    if (options.channels) args.push('-ac', String(options.channels));

    args.push(output);
    return args;
  }

  parseProgress(stderrChunk) {
    // Try to extract out_time_ms and progress
    const lines = stderrChunk.split('\n');
    let timeUs = null;
    let end = false;

    for (const line of lines) {
      const [k, v] = line.split('=');
      if (k === 'out_time_ms') timeUs = parseInt(v, 10);
      if (k === 'progress' && v?.trim() === 'end') end = true;
    }

    if (end) return { progress: 100, status: 'Complete' };
    if (timeUs && this.totalDuration) {
      const sec = timeUs / 1_000_000;
      const pct = Math.max(0, Math.min(99, Math.round((sec / this.totalDuration) * 100)));
      return { progress: pct, status: 'Converting...' };
    }
    return null;
    }

  async getDurationWithFFprobe(input, ffprobePath = 'ffprobe') {
    return new Promise((resolve) => {
      const p = spawn(ffprobePath, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', input]);
      let out = '';
      p.stdout.on('data', (d) => { out += d.toString(); });
      p.on('close', () => {
        const n = parseFloat(out.trim());
        resolve(!isNaN(n) && isFinite(n) ? n : null);
      });
      p.on('error', () => resolve(null));
    });
  }
}

module.exports = { AudioProcessor };
