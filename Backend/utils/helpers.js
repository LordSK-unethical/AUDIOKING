const path = require('path');
const fs = require('fs').promises;

/**
 * Utility helper functions for the Electron app
 */

/**
 * Check if a file exists
 * @param {string} filePath - Path to the file
 * @returns {Promise<boolean>} - True if file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure directory exists, create if it doesn't
 * @param {string} dirPath - Directory path
 * @returns {Promise<void>}
 */
async function ensureDirectory(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Get file extension
 * @param {string} filename - File name
 * @returns {string} - File extension
 */
function getFileExtension(filename) {
  return path.extname(filename).toLowerCase();
}

/**
 * Format file size in human readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate file type
 * @param {string} filename - File name
 * @param {string[]} allowedExtensions - Array of allowed extensions
 * @returns {boolean} - True if valid
 */
function validateFileType(filename, allowedExtensions) {
  const ext = getFileExtension(filename).substring(1);
  return allowedExtensions.includes(ext);
}

module.exports = {
  fileExists,
  ensureDirectory,
  getFileExtension,
  formatFileSize,
  validateFileType
};
