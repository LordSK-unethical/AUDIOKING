# AUDIOKING Installation Guide

This guide will help you set up AUDIOKING with all required dependencies using executable files instead of Python packages.

## Quick Setup

1. **Run the setup script:**
   ```bash
   npm run setup-executables
   ```

2. **Download FFmpeg (Required):**
   - Go to https://ffmpeg.org/download.html
   - Choose "Windows builds by BtbN"
   - Download the latest "release" build
   - Extract `ffmpeg.exe` and `ffprobe.exe` to the `bin/` directory

3. **Verify installation:**
   ```bash
   npm run setup-executables
   ```

## Detailed Setup

### 1. FFmpeg Installation (Required for Audio Conversion)

FFmpeg is required for all audio conversion operations.

**Option A: Bundled Installation (Recommended)**
1. Download FFmpeg from https://ffmpeg.org/download.html
2. Choose "Windows builds by BtbN" → "release builds"
3. Download the latest version (e.g., `ffmpeg-master-latest-win64-gpl.zip`)
4. Extract the zip file
5. Copy `ffmpeg.exe` and `ffprobe.exe` from the `bin/` folder to `AUDIOKING/bin/`

**Option B: System Installation**
1. Install FFmpeg system-wide using winget:
   ```bash
   winget install ffmpeg
   ```
2. Or download and add to system PATH manually

### 2. yt-dlp Setup (Required for YouTube Downloads)

yt-dlp is already included in the `scripts/` directory as `yt-dlp.exe`.

**If missing or outdated:**
1. Download from https://github.com/yt-dlp/yt-dlp/releases/latest
2. Download `yt-dlp.exe`
3. Place in `scripts/` directory (or `bin/` directory)

### 3. Verification

Run the verification script:
```bash
npm run setup-executables
```

Expected output:
```
✓ Bin directory created/verified
✓ yt-dlp.exe found in scripts directory
✓ yt-dlp.exe is working correctly
✓ FFmpeg executables found in bin directory
Setup complete!
```

## Directory Structure

After setup, your directory should look like:
```
AUDIOKING/
├── bin/
│   ├── ffmpeg.exe      (required)
│   ├── ffprobe.exe     (required)
│   └── README.md
├── scripts/
│   ├── yt-dlp.exe      (existing)
│   └── setup-executables.js
└── Backend/
    └── utils/
        ├── executableManager.js    (new)
        ├── ffmpegInstaller.js      (updated)
        ├── ytdlpInstaller.js       (updated)
        └── youtubeDownloader.js    (updated)
```

## Troubleshooting

### FFmpeg Issues
- **"FFmpeg not found"**: Ensure `ffmpeg.exe` and `ffprobe.exe` are in the `bin/` directory
- **Permission errors**: Right-click executables → Properties → Unblock if downloaded from internet
- **Path issues**: The app prioritizes bundled executables over system PATH

### yt-dlp Issues
- **"yt-dlp.exe not found"**: Check if `yt-dlp.exe` exists in `scripts/` directory
- **Download failures**: Try updating yt-dlp.exe to the latest version
- **YouTube errors**: yt-dlp handles most YouTube changes automatically

### General Issues
- **Antivirus blocking**: Add AUDIOKING directory to antivirus exclusions
- **Windows Defender**: Allow the executables when prompted
- **Firewall**: Allow network access for YouTube downloads

## Benefits of This Setup

1. **No Python dependency**: Uses standalone executables
2. **Faster startup**: No Python module loading
3. **Better reliability**: Direct executable calls
4. **Easier deployment**: All dependencies bundled
5. **Offline capable**: Works without internet after setup

## Development

For developers:
```bash
# Check current status
npm run setup-executables

# Test FFmpeg
npm run check-ffmpeg

# Start development
npm run dev
```

## Production Build

The executables will be automatically included in the production build:
```bash
npm run build-win
```

The built application will include all necessary executables and work independently.