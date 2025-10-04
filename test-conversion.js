const { AudioProcessor } = require('./Backend/api/audioProcessor');
const path = require('path');

async function testConversion() {
  console.log('Testing audio conversion...');
  
  const processor = new AudioProcessor();
  
  // Set up progress callback
  processor.onProgress = (progress) => {
    console.log(`Progress: ${progress.progress}% - ${progress.status}`);
  };
  
  try {
    // Test with a sample file (you'll need to provide a real audio file)
    const testFile = path.join(__dirname, 'test-audio.mp3'); // Replace with actual test file
    
    const result = await processor.convertAudio(testFile, {
      outputFormat: 'wav',
      bitrate: 192,
      sampleRate: 44100
    });
    
    console.log('Conversion successful!');
    console.log('Output file:', result.outputPath);
    console.log('File size:', result.size, 'bytes');
    
  } catch (error) {
    console.error('Conversion failed:', error.message);
    
    if (error.message.includes('ffmpeg')) {
      console.log('\nFFmpeg installation required:');
      console.log('Windows: winget install ffmpeg');
      console.log('macOS: brew install ffmpeg');
      console.log('Linux: sudo apt install ffmpeg');
    }
  }
}

// Run test if called directly
if (require.main === module) {
  testConversion();
}

module.exports = { testConversion };