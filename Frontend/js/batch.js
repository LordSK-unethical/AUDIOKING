// Batch processing functionality
document.addEventListener('DOMContentLoaded', () => {
    const batchUploadArea = document.getElementById('batchUploadArea');
    const browseBatchFiles = document.getElementById('browseBatchFiles');
    const browseFolders = document.getElementById('browseFolders');
    
    // Folder input for folder selection
    const folderInput = document.createElement('input');
    folderInput.type = 'file';
    folderInput.webkitdirectory = true;
    folderInput.style.display = 'none';
    document.body.appendChild(folderInput);
    const batchFilesList = document.getElementById('batchFilesList');
    const filesContainer = document.getElementById('filesContainer');
    const fileCount = document.getElementById('fileCount');
    const clearFiles = document.getElementById('clearFiles');
    const startBatch = document.getElementById('startBatch');
    const backToHome = document.getElementById('backToHome');

    let selectedFiles = [];

    // File input for batch selection
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = 'audio/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // Event listeners
    browseBatchFiles?.addEventListener('click', () => fileInput.click());
    browseFolders?.addEventListener('click', () => folderInput.click());
    
    folderInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files).filter(f => f.type.startsWith('audio/'));
        addFiles(files);
    });
    
    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        addFiles(files);
    });

    clearFiles?.addEventListener('click', () => {
        selectedFiles = [];
        updateFilesList();
    });

    startBatch?.addEventListener('click', async () => {
        if (selectedFiles.length > 0) {
            const format = document.getElementById('batchOutputFormat')?.value || 'mp3';
            const quality = document.getElementById('batchQuality')?.value || 'medium';
            
            if (window.electronAPI && window.electronAPI.batchConvert) {
                try {
                    const batchData = [];
                    for (const file of selectedFiles) {
                        const arrayBuffer = await file.arrayBuffer();
                        batchData.push({ buffer: new Uint8Array(arrayBuffer), name: file.name });
                    }
                    
                    const options = { outputFormat: format };
                    if (quality === 'high') options.bitrate = 320;
                    else if (quality === 'low') options.bitrate = 128;
                    else options.bitrate = 192;
                    
                    const result = await window.electronAPI.batchConvert(batchData, options);
                    if (result.success) {
                        alert(`Batch conversion completed! ${result.results.length} files converted.`);
                    } else {
                        alert(`Batch conversion failed: ${result.error}`);
                    }
                } catch (error) {
                    alert(`Batch conversion error: ${error.message}`);
                }
            } else {
                alert(`Starting batch conversion of ${selectedFiles.length} files...`);
            }
        }
    });

    backToHome?.addEventListener('click', () => {
        window.location.href = '../index.html';
    });

    function addFiles(files) {
        files.forEach(file => {
            if (!selectedFiles.find(f => f.name === file.name)) {
                selectedFiles.push(file);
            }
        });
        updateFilesList();
    }

    function updateFilesList() {
        if (fileCount) fileCount.textContent = selectedFiles.length;
        
        if (selectedFiles.length > 0) {
            if (batchFilesList) batchFilesList.style.display = 'block';
            if (filesContainer) {
                filesContainer.innerHTML = selectedFiles.map((file, index) => 
                    `<div class="batch-file-item">
                        <span>${file.name}</span>
                        <button onclick="removeFile(${index})">Remove</button>
                    </div>`
                ).join('');
            }
        } else {
            if (batchFilesList) batchFilesList.style.display = 'none';
        }
    }

    window.removeFile = (index) => {
        selectedFiles.splice(index, 1);
        updateFilesList();
    };
});