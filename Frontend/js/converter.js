(() => {
  const getBridge = () => (window && window.electronAPI) ? window.electronAPI : undefined;
  const getLogger = () => (window && window.logger) ? window.logger : console;

  const electron = getBridge();
  const log = getLogger();
  const isElectron = !!electron;

  class AudioConverter {
    constructor() {
      // Core elements
      this.uploadArea = document.getElementById('uploadArea');
      this.fileInput = document.getElementById('fileInput');
      this.batchFileInput = document.getElementById('batchFileInput');
      this.browseLink = document.getElementById('browseLink');
      this.uploadBtn = document.getElementById('uploadBtn');
      this.addMoreFiles = document.getElementById('addMoreFiles');
      this.changeFileBtn = document.getElementById('changeFileBtn');

      // Batch mode elements
      this.batchMode = document.getElementById('batchMode');
      this.batchFilesList = document.getElementById('batchFilesList');
      this.batchFilesContainer = document.getElementById('batchFilesContainer');
      this.batchCount = document.getElementById('batchCount');
      this.uploadTitle = document.getElementById('uploadTitle');
      this.batchProgress = document.getElementById('batchProgress');
      this.batchProgressFill = document.getElementById('batchProgressFill');
      this.batchProgressText = document.getElementById('batchProgressText');
      this.batchProgressDetails = document.getElementById('batchProgressDetails');
      this.downloadAllBtn = document.getElementById('downloadAllBtn');

      // UI state elements
      this.defaultContent = document.getElementById('defaultContent');
      this.fileSelectedContent = document.getElementById('fileSelectedContent');
      this.audioPreview = document.getElementById('audioPreview');
      this.audioPlayer = document.getElementById('audioPlayer');

      // Form elements
      this.convertForm = document.getElementById('convertForm');
      this.outputFormat = document.getElementById('outputFormat');
      this.qualitySettings = document.getElementById('qualitySettings');
      this.customQuality = document.getElementById('customQuality');

      // Quality controls
      this.presetBtns = document.querySelectorAll('.preset-btn');
      this.bitrateSlider = document.getElementById('bitrateSlider');
      this.sampleRateSlider = document.getElementById('sampleRateSlider');
      this.bitrateValue = document.getElementById('bitrateValue');
      this.sampleRateValue = document.getElementById('sampleRateValue');

      // Progress and messages
      this.progress = document.getElementById('conversionProgress');
      this.progressFill = document.getElementById('progressFill');
      this.progressPercent = document.getElementById('progressPercent');
      this.progressStatus = document.getElementById('progressStatus');
      this.statusMsg = document.getElementById('statusMsg');
      this.errorMsg = document.getElementById('errorMsg');
      this.successMsg = document.getElementById('successMsg');

      // Download elements
      this.downloadSection = document.getElementById('downloadSection');
      this.convertedFileLink = document.getElementById('convertedFileLink');
      this.convertAnotherBtn = document.getElementById('convertAnotherBtn');
      this.convertBtnText = document.getElementById('convertBtnText');
      this.downloadDescription = document.getElementById('downloadDescription');

      // File info elements
      this.fileIcon = document.getElementById('fileIcon');
      this.fileName = document.getElementById('fileName');
      this.fileSize = document.getElementById('fileSize');
      this.fileType = document.getElementById('fileType');
      this.audioDuration = document.getElementById('audioDuration');
      this.audioBitrate = document.getElementById('audioBitrate');
      this.audioSampleRate = document.getElementById('audioSampleRate');

      // Format cards
      this.formatCards = document.querySelectorAll('.format-card');

      // State - Updated for only 4 formats
      this.currentFile = null;
      this.currentPath = null;
      this.currentFormat = null;
      this.batchFiles = [];
      this.currentQualityPreset = 'medium';
      this.sampleRates = [44100, 48000, 96000];
      this.convertedFiles = [];

      // Supported formats - Only 4 formats now
      this.supportedInputFormats = [
        'mp3', 'wav', 'flac', 'opus', 'aac', 'ogg', 'm4a', 
        'wma', 'aiff', '3gp', 'ac3', 'amr', 'au', 'caf', 'mp2'
      ];
      
      this.supportedOutputFormats = {
        'mp3': { name: 'MP3', quality: true, description: 'Most compatible format' },
        'wav': { name: 'WAV', quality: false, description: 'Uncompressed quality' },
        'flac': { name: 'FLAC', quality: false, description: 'Lossless compression' },
        'opus': { name: 'OPUS', quality: true, description: 'Modern efficient codec' }
      };

      this.qualityPresets = {
        high: { bitrate: 320, sampleRate: 48000, quality: 0 },
        medium: { bitrate: 192, sampleRate: 44100, quality: 1 },
        low: { bitrate: 128, sampleRate: 44100, quality: 2 }
      };

      this.init();
    }

    init() {
      log.log('[Renderer] Enhanced AUDIOKING converter init with 4 formats');

      this.setupFileUpload();
      this.setupYouTubeDownload();
      this.setupBatchMode();
      this.setupFormatSelection();
      this.setupQualityControls();
      this.setupFormSubmission();
      this.setupProgressTracking();
      this.setupDownloadHandlers();
    }

    setupFileUpload() {
      const openSinglePicker = (source) => {
        if (!this.fileInput) return log.error('[Renderer] fileInput missing');
        log.log('[Renderer] Opening single file picker from:', source);
        this.fileInput.click();
      };

      const openMultiplePicker = (source) => {
        if (!this.batchFileInput) return log.error('[Renderer] batchFileInput missing');
        log.log('[Renderer] Opening multiple file picker from:', source);
        this.batchFileInput.click();
      };

      // Upload area click handling
      if (this.uploadArea) {
        this.uploadArea.addEventListener('click', (e) => {
          if (e.target.closest('button')) return;
          if (this.batchMode && this.batchMode.checked) {
            openMultiplePicker('uploadArea-batch');
          } else {
            openSinglePicker('uploadArea-single');
          }
        });

        // Drag and drop
        ['dragenter','dragover','dragleave','drop'].forEach(evt => {
          this.uploadArea.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); });
        });
        ['dragenter','dragover'].forEach(evt => {
          this.uploadArea.addEventListener(evt, () => this.uploadArea.classList.add('dragover'));
        });
        ['dragleave','drop'].forEach(evt => {
          this.uploadArea.addEventListener(evt, () => this.uploadArea.classList.remove('dragover'));
        });
        this.uploadArea.addEventListener('drop', (e) => {
          const files = Array.from(e.dataTransfer.files).filter(f => this.isAudioFile(f));
          log.log('[Renderer] Dropped files:', files.length);
          
          if (this.batchMode && this.batchMode.checked) {
            this.addBatchFiles(files);
          } else if (files.length > 0) {
            this.onFileChosen(files[0]);
          }
        });
      }

      // Button handlers
      this.browseLink?.addEventListener('click', (e) => { 
        e.preventDefault(); e.stopPropagation(); 
        if (this.batchMode && this.batchMode.checked) {
          openMultiplePicker('browseLink');
        } else {
          openSinglePicker('browseLink');
        }
      });
      
      this.uploadBtn?.addEventListener('click', () => {
        if (this.batchMode && this.batchMode.checked) {
          openMultiplePicker('uploadBtn');
        } else {
          openSinglePicker('uploadBtn');
        }
      });
      
      this.changeFileBtn?.addEventListener('click', (e) => { 
        e.preventDefault(); e.stopPropagation(); 
        openSinglePicker('changeFileBtn');
      });

      this.addMoreFiles?.addEventListener('click', () => openMultiplePicker('addMoreFiles'));

      // File input handlers
      this.fileInput?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        log.log('[Renderer] Single file selected:', file?.name || 'none');
        if (file) this.onFileChosen(file);
      });

      this.batchFileInput?.addEventListener('change', (e) => {
        const files = Array.from(e.target.files || []).filter(f => this.isAudioFile(f));
        log.log('[Renderer] Batch files selected:', files.length);
        this.addBatchFiles(files);
      });
    }

    setupBatchMode() {
      if (this.batchMode) {
        this.batchMode.addEventListener('change', (e) => {
          const isBatch = e.target.checked;
          log.log('[Renderer] Batch mode:', isBatch);
          
          this.updateBatchModeUI(isBatch);
          
          if (!isBatch) {
            this.clearBatchFiles();
          }
        });
      }
    }

    setupFormatSelection() {
      // Format dropdown
      if (this.outputFormat) {
        this.outputFormat.addEventListener('change', (e) => {
          this.currentFormat = e.target.value;
          this.updateFormatSelection(e.target.value);
        });
      }

      // Format cards - only for the 4 supported formats
      this.formatCards.forEach(card => {
        card.addEventListener('click', () => {
          const format = card.dataset.format;
          log.log('[Renderer] Format card clicked:', format);
          if (['mp3', 'wav', 'flac', 'opus'].includes(format)) {
            this.selectFormat(format);
          }
        });

        // Keyboard accessibility
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const format = card.dataset.format;
            if (['mp3', 'wav', 'flac', 'opus'].includes(format)) {
              this.selectFormat(format);
            }
          }
        });
      });
    }

    setupQualityControls() {
      // Preset buttons
      this.presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const preset = btn.dataset.preset;
          this.selectQualityPreset(preset);
        });
      });

      // Bitrate slider
      if (this.bitrateSlider) {
        this.bitrateSlider.addEventListener('input', (e) => {
          const value = e.target.value;
          if (this.bitrateValue) {
            this.bitrateValue.textContent = `${value} kbps`;
          }
          this.selectQualityPreset('custom');
        });
      }

      // Sample rate slider
      if (this.sampleRateSlider) {
        this.sampleRateSlider.addEventListener('input', (e) => {
          const index = parseInt(e.target.value);
          const rate = this.sampleRates[index];
          const rateText = index === 2 ? '96 kHz' : (index === 1 ? '48 kHz' : '44.1 kHz');
          if (this.sampleRateValue) {
            this.sampleRateValue.textContent = rateText;
          }
          this.selectQualityPreset('custom');
        });
      }
    }

    setupFormSubmission() {
      if (this.convertForm) {
        this.convertForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          log.log('[Renderer] Form submitted');
          
          if (this.batchMode && this.batchMode.checked) {
            await this.performBatchConversion();
          } else {
            await this.performSingleConversion();
          }
        });
      }
    }

    setupProgressTracking() {
      if (isElectron && electron.onAudioProgress) {
        electron.onAudioProgress((p) => {
          const value = Math.max(0, Math.min(100, Math.round(p.progress || 0)));
          if (this.progress && this.progress.style.display !== 'none') {
            if (this.progressFill) this.progressFill.style.width = `${value}%`;
            if (this.progressPercent) this.progressPercent.textContent = `${value}%`;
            if (this.progressStatus) this.progressStatus.textContent = p.status || 'Converting...';
          }
        });
      }

      if (isElectron && electron.onBatchProgress) {
        electron.onBatchProgress((p) => {
          this.updateBatchProgress(p);
        });
      }
    }

    setupYouTubeDownload() {
      const youtubeUrl = document.getElementById('youtubeUrl');
      const youtubeBtn = document.getElementById('youtubeDownloadBtn');
      const youtubeInfo = document.getElementById('youtubeInfo');

      youtubeBtn?.addEventListener('click', async () => {
        const url = youtubeUrl?.value?.trim();
        if (!url) return this.showError('Please enter a YouTube URL');

        try {
          this.setConverting(true);
          this.showStatus('Getting video info...');

          if (!electron || !electron.getYouTubeInfo) {
            throw new Error('YouTube functionality not available');
          }
          
          const infoResult = await electron.getYouTubeInfo(url);
          if (!infoResult.success) throw new Error(infoResult.error);

          youtubeInfo.innerHTML = `
            <h4>${infoResult.info.title}</h4>
            <p>Duration: ${this.formatDuration(infoResult.info.duration)}</p>
          `;
          youtubeInfo.style.display = 'block';

          this.showStatus('Downloading audio from YouTube...');
          
          const result = await electron.downloadFromYouTube(url);
          if (!result.success) throw new Error(result.error);

          // Create file object from downloaded path
          this.currentFile = { name: result.title + '.webm', path: result.filePath };
          this.currentPath = result.filePath;
          
          this.onFileChosen(this.currentFile);
          this.showSuccess('YouTube audio downloaded successfully!');
        } catch (error) {
          this.showError(error.message);
        } finally {
          this.setConverting(false);
        }
      });

      if (isElectron && electron.onYouTubeProgress) {
        electron.onYouTubeProgress((progress) => {
          if (this.progress && this.progress.style.display !== 'none') {
            if (this.progressFill) this.progressFill.style.width = `${progress.progress}%`;
            if (this.progressPercent) this.progressPercent.textContent = `${progress.progress}%`;
            if (this.progressStatus) this.progressStatus.textContent = progress.status;
          }
        });
      }
    }

    setupDownloadHandlers() {
      this.convertAnotherBtn?.addEventListener('click', () => this.resetAll());
      this.downloadAllBtn?.addEventListener('click', () => this.downloadAllFiles());
    }

    // Batch Mode Methods
    updateBatchModeUI(isBatch) {
      if (isBatch) {
        if (this.uploadTitle) {
          this.uploadTitle.innerHTML = 'Drop your audio files here or <button type="button" class="browse-link" id="browseLink">browse files</button>';
        }
        if (this.batchFilesList) this.batchFilesList.style.display = 'block';
        if (this.convertBtnText) this.convertBtnText.textContent = 'Convert All Files';
        
        // Update description
        const desc = this.uploadArea?.querySelector('.upload-description');
        if (desc) desc.textContent = 'Select multiple audio files for batch conversion. All files will be converted to the same output format.';
      } else {
        if (this.uploadTitle) {
          this.uploadTitle.innerHTML = 'Drop your audio files here or <button type="button" class="browse-link" id="browseLink">browse file</button>';
        }
        if (this.batchFilesList) this.batchFilesList.style.display = 'none';
        if (this.convertBtnText) this.convertBtnText.textContent = 'Convert Audio';
        
        // Restore description
        const desc = this.uploadArea?.querySelector('.upload-description');
        if (desc) desc.innerHTML = 'MP3, WAV, FLAC, OPUS and other formats supported.<br />Upload up to 100 MB per file. Secure audio conversion.';
      }

      // Re-wire browse link
      const newBrowseLink = document.getElementById('browseLink');
      if (newBrowseLink) {
        newBrowseLink.addEventListener('click', (e) => {
          e.preventDefault(); e.stopPropagation();
          if (isBatch) {
            this.batchFileInput?.click();
          } else {
            this.fileInput?.click();
          }
        });
      }
    }

    addBatchFiles(files) {
      files.forEach(file => {
        if (!this.batchFiles.find(f => f.name === file.name && f.size === file.size)) {
          this.batchFiles.push(file);
        }
      });
      
      this.updateBatchFilesList();
      this.showStatus(`${this.batchFiles.length} files selected for batch conversion.`);
    }

    updateBatchFilesList() {
      if (!this.batchFilesContainer || !this.batchCount) return;
      
      this.batchCount.textContent = this.batchFiles.length;
      
      this.batchFilesContainer.innerHTML = '';
      
      this.batchFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'batch-file-item';
        item.innerHTML = `
          <span>${file.name} (${this.formatSize(file.size)})</span>
          <button type="button" class="batch-file-remove" data-index="${index}">Remove</button>
        `;
        
        item.querySelector('.batch-file-remove')?.addEventListener('click', () => {
          this.removeBatchFile(index);
        });
        
        this.batchFilesContainer.appendChild(item);
      });
    }

    removeBatchFile(index) {
      this.batchFiles.splice(index, 1);
      this.updateBatchFilesList();
    }

    clearBatchFiles() {
      this.batchFiles = [];
      this.updateBatchFilesList();
    }

    // Format Selection Methods - Updated for 4 formats only
    selectFormat(format) {
      if (!['mp3', 'wav', 'flac', 'opus'].includes(format)) {
        log.warn('[Renderer] Unsupported format selected:', format);
        return;
      }
      
      this.currentFormat = format;
      if (this.outputFormat) this.outputFormat.value = format;
      this.updateFormatSelection(format);
      
      // Visual feedback
      this.formatCards.forEach(card => {
        card.classList.toggle('selected', card.dataset.format === format);
      });
    }

    updateFormatSelection(format) {
      // Only MP3 and OPUS have quality settings now
      const compressedFormats = ['mp3', 'opus'];
      
      if (compressedFormats.includes(format)) {
        if (this.qualitySettings) this.qualitySettings.style.display = 'block';
      } else {
        if (this.qualitySettings) this.qualitySettings.style.display = 'none';
        if (this.customQuality) this.customQuality.style.display = 'none';
      }
    }

    // Quality Control Methods
    selectQualityPreset(preset) {
      this.currentQualityPreset = preset;
      
      // Update button states
      this.presetBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.preset === preset);
      });
      
      // Update sliders and show/hide custom controls
      if (preset === 'custom') {
        if (this.customQuality) this.customQuality.style.display = 'block';
      } else {
        if (this.customQuality) this.customQuality.style.display = 'none';
        
        // Set preset values
        if (this.qualityPresets[preset]) {
          if (this.bitrateSlider) this.bitrateSlider.value = this.qualityPresets[preset].bitrate;
          if (this.bitrateValue) this.bitrateValue.textContent = `${this.qualityPresets[preset].bitrate} kbps`;
          
          const rateIndex = this.sampleRates.indexOf(this.qualityPresets[preset].sampleRate);
          if (this.sampleRateSlider) this.sampleRateSlider.value = rateIndex;
          if (this.sampleRateValue) {
            this.sampleRateValue.textContent = this.qualityPresets[preset].sampleRate === 48000 ? '48 kHz' : '44.1 kHz';
          }
        }
      }
    }

    // File Processing Methods
    async onFileChosen(file) {
      try {
        log.log('[Renderer] Single file chosen:', file.name, file.type || 'unknown', file.size || 'unknown');
        this.currentFile = file;
        this.currentPath = file.path || null;

        if (this.defaultContent) this.defaultContent.style.display = 'none';
        if (this.fileSelectedContent) this.fileSelectedContent.style.display = 'block';

        if (this.fileName) this.fileName.textContent = file.name;
        if (this.fileSize) this.fileSize.textContent = file.size ? this.formatSize(file.size) : 'Unknown';
        if (this.fileType) this.fileType.textContent = (file.type || file.name.split('.').pop() || 'Audio').toUpperCase() + ' Audio';

        // Audio preview (only for browser File objects)
        if (this.audioPreview && this.audioPlayer && file.size) {
          const url = URL.createObjectURL(file);
          this.audioPlayer.src = url;
          this.audioPreview.style.display = 'block';
          this._objectUrl = url;
        }

        // Extract duration
        if (file.size) {
          const duration = await this.extractDuration(file);
          if (typeof duration === 'number' && this.audioDuration) {
            this.audioDuration.textContent = this.formatDuration(duration);
          }
        }

        this.showStatus('File ready. Choose target format and convert.');
      } catch (e) {
        log.error('[Renderer] onFileChosen error:', e);
        this.showError('Failed to handle file.');
      }
    }

    async performSingleConversion() {
      if (!this.currentFile) return this.showError('Please select an audio file.');
      if (!this.currentFormat) return this.showError('Please select an output format.');
      if (!['mp3', 'wav', 'flac', 'opus'].includes(this.currentFormat)) {
        return this.showError('Selected format is not supported.');
      }

      try {
        this.setConverting(true);
        this.showStatus('Starting conversion...');

        const result = await this.convertFile(this.currentFile, this.getConversionOptions());

        if (result.success) {
          this.showConversionComplete([result]);
          this.showSuccess('Conversion complete!');
        } else {
          throw new Error(result.error);
        }
      } catch (e) {
        log.error('[Renderer] Single conversion error:', e);
        this.showError(e.message || 'Conversion failed.');
      } finally {
        this.setConverting(false);
      }
    }

    async performBatchConversion() {
      if (this.batchFiles.length === 0) return this.showError('Please select audio files for batch conversion.');
      if (!this.currentFormat) return this.showError('Please select an output format.');
      if (!['mp3', 'wav', 'flac', 'opus'].includes(this.currentFormat)) {
        return this.showError('Selected format is not supported.');
      }

      try {
        this.setConverting(true);
        this.showBatchProgress({ current: 0, total: this.batchFiles.length });
        
        // Check FFmpeg installation first
        if (isElectron && electron.checkFFmpegInstallation) {
          const ffmpegStatus = await electron.checkFFmpegInstallation();
          if (!ffmpegStatus.ready) {
            const instructions = await electron.getFFmpegInstructions();
            throw new Error(`FFmpeg not installed. ${instructions.quickInstall || 'Please install FFmpeg to continue.'}`);
          }
        }
        
        const options = this.getConversionOptions();
        
        // Prepare batch data - convert files to proper format
        const batchData = [];
        for (const file of this.batchFiles) {
          if (file.path) {
            batchData.push({ path: file.path, name: file.name });
          } else {
            const arrayBuffer = await file.arrayBuffer();
            batchData.push({ buffer: new Uint8Array(arrayBuffer), name: file.name });
          }
        }
        
        log.log('[Renderer] Sending batch data:', batchData.length, 'files');
        const result = await electron.batchConvert(batchData, options);
        log.log('[Renderer] Batch result:', result);
        
        if (result.success) {
          this.convertedFiles = result.results.filter(r => r.success);
          log.log('[Renderer] Converted files:', this.convertedFiles.length);
          this.showConversionComplete(this.convertedFiles);
          this.showSuccess(`Batch conversion complete! Converted ${this.convertedFiles.length} of ${this.batchFiles.length} files.`);
        } else {
          throw new Error(result.error);
        }
      } catch (e) {
        log.error('[Renderer] Batch conversion error:', e);
        this.showError(e.message || 'Batch conversion failed.');
      } finally {
        this.setConverting(false);
      }
    }

    async convertFile(file, options) {
      // Check FFmpeg installation first
      if (isElectron && electron.checkFFmpegInstallation) {
        const ffmpegStatus = await electron.checkFFmpegInstallation();
        if (!ffmpegStatus.ready) {
          const instructions = await electron.getFFmpegInstructions();
          throw new Error(`FFmpeg not installed. ${instructions.quickInstall || 'Please install FFmpeg to continue.'}`);
        }
      }

      let audioData;
      if (file.path) {
        audioData = { path: file.path, name: file.name };
      } else {
        const ab = await file.arrayBuffer();
        audioData = { buffer: new Uint8Array(ab), name: file.name };
      }

      if (!isElectron || !electron.convertAudio) {
        throw new Error('Electron bridge not available.');
      }

      return await electron.convertAudio(audioData, options);
    }

    getConversionOptions() {
      const options = { outputFormat: this.currentFormat };
      
      // Add quality settings only for compressed formats (MP3 and OPUS)
      const compressedFormats = ['mp3', 'opus'];
      
      if (compressedFormats.includes(this.currentFormat)) {
        if (this.currentQualityPreset === 'custom') {
          options.bitrate = parseInt(this.bitrateSlider?.value || '192');
          const sampleRateIndex = parseInt(this.sampleRateSlider?.value || '0');
          options.sampleRate = this.sampleRates[sampleRateIndex];
        } else {
          const preset = this.qualityPresets[this.currentQualityPreset] || this.qualityPresets.medium;
          options.bitrate = preset.bitrate;
          options.sampleRate = preset.sampleRate;
        }
      }
      
      return options;
    }

    // UI Update Methods
    showBatchProgress(progress) {
      log.log('[Renderer] Showing batch progress:', progress);
      if (this.batchProgress) {
        this.batchProgress.style.display = 'block';
      }
      if (this.progress) {
        this.progress.style.display = 'none';
      }
      
      // Initialize progress display
      if (progress && this.batchProgressFill && this.batchProgressText) {
        const percentage = (progress.current / progress.total) * 100;
        this.batchProgressFill.style.width = `${percentage}%`;
        this.batchProgressText.textContent = `Processing file ${progress.current} of ${progress.total}`;
      }
    }

    updateBatchProgress(progress) {
      if (this.batchProgressFill && this.batchProgressText) {
        const percentage = (progress.current / progress.total) * 100;
        this.batchProgressFill.style.width = `${percentage}%`;
        this.batchProgressText.textContent = `Processing file ${progress.current} of ${progress.total}`;
        
        if (this.batchProgressDetails && progress.filename) {
          this.batchProgressDetails.textContent = `Converting: ${progress.filename}`;
        }
      }
    }

    showConversionComplete(results) {
      if (this.downloadSection) {
        this.downloadSection.style.display = 'block';
        
        if (results.length === 1) {
          // Single file
          if (this.convertedFileLink) {
            this.convertedFileLink.href = results[0].downloadUrl;
            this.convertedFileLink.download = results[0].filename;
            this.convertedFileLink.style.display = 'inline-block';
          }
          if (this.downloadAllBtn) this.downloadAllBtn.style.display = 'none';
          if (this.downloadDescription) this.downloadDescription.textContent = 'Your audio file has been converted successfully.';
        } else {
          // Multiple files
          if (this.convertedFileLink) this.convertedFileLink.style.display = 'none';
          if (this.downloadAllBtn) this.downloadAllBtn.style.display = 'inline-block';
          if (this.downloadDescription) this.downloadDescription.textContent = `${results.length} audio files have been converted successfully.`;
        }
      }
      
      // Hide progress
      if (this.progress) this.progress.style.display = 'none';
      if (this.batchProgress) this.batchProgress.style.display = 'none';
    }

    downloadAllFiles() {
      this.convertedFiles.forEach(file => {
        const a = document.createElement('a');
        a.href = file.downloadUrl;
        a.download = file.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
    }

    // Utility Methods
    isAudioFile(file) {
      const audioTypes = ['audio/', 'video/'];
      const audioExtensions = ['.mp3', '.wav', '.flac', '.opus', '.aac', '.ogg', '.m4a', '.wma', '.aiff', '.3gp'];
      
      return audioTypes.some(type => file.type.startsWith(type)) ||
             audioExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    }

    resetAll() {
      this.currentFile = null;
      this.currentPath = null;
      this.currentFormat = null;
      this.clearBatchFiles();
      this.convertedFiles = [];
      
      if (this._objectUrl) {
        URL.revokeObjectURL(this._objectUrl);
        this._objectUrl = null;
      }

      // Reset file inputs
      if (this.fileInput) this.fileInput.value = '';
      if (this.batchFileInput) this.batchFileInput.value = '';
      if (this.outputFormat) this.outputFormat.value = '';
      
      // Clear YouTube input
      const youtubeUrl = document.getElementById('youtubeUrl');
      const youtubeInfo = document.getElementById('youtubeInfo');
      if (youtubeUrl) youtubeUrl.value = '';
      if (youtubeInfo) youtubeInfo.style.display = 'none';

      // Reset UI
      if (this.fileSelectedContent) this.fileSelectedContent.style.display = 'none';
      if (this.defaultContent) this.defaultContent.style.display = 'block';
      if (this.audioPreview) this.audioPreview.style.display = 'none';
      if (this.progress) this.progress.style.display = 'none';
      if (this.batchProgress) this.batchProgress.style.display = 'none';
      if (this.downloadSection) this.downloadSection.style.display = 'none';
      if (this.qualitySettings) this.qualitySettings.style.display = 'none';
      
      // Reset format cards
      this.formatCards.forEach(card => {
        card.classList.remove('selected');
      });
      
      // Reset quality preset
      this.selectQualityPreset('medium');
      
      this.hideMessages();
    }

    setConverting(on) {
      const btn = this.convertForm?.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = on;
        btn.classList.toggle('loading', on);
      }
    }

    showStatus(msg) {
      this.hideMessages();
      if (this.statusMsg) {
        this.statusMsg.textContent = msg;
        this.statusMsg.style.display = 'block';
      }
    }

    showError(msg) {
      this.hideMessages();
      if (this.errorMsg) {
        this.errorMsg.textContent = msg;
        this.errorMsg.style.display = 'block';
      }
    }

    showSuccess(msg) {
      this.hideMessages();
      if (this.successMsg) {
        this.successMsg.textContent = msg;
        this.successMsg.style.display = 'block';
      }
    }

    hideMessages() {
      [this.statusMsg, this.errorMsg, this.successMsg].forEach(el => {
        if (el) el.style.display = 'none';
      });
    }

    async extractDuration(file) {
      return new Promise((resolve) => {
        const a = document.createElement('audio');
        const url = URL.createObjectURL(file);
        a.src = url;
        a.addEventListener('loadedmetadata', () => {
          const d = a.duration;
          URL.revokeObjectURL(url);
          resolve(d);
        });
        a.addEventListener('error', () => {
          URL.revokeObjectURL(url);
          resolve(null);
        });
        setTimeout(() => {
          URL.revokeObjectURL(url);
          resolve(null);
        }, 5000);
      });
    }

    formatSize(bytes) {
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    }

    formatDuration(s) {
      if (!s || isNaN(s)) return '—';
      const m = Math.floor(s / 60);
      const ss = Math.floor(s % 60);
      return `${m}:${String(ss).padStart(2, '0')}`;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    log.log('[Renderer] Enhanced converter (4 formats) DOMContentLoaded');
    window.audioConverter = new AudioConverter();
  });
})();
