/**
 * ZIP Download Utility
 * Handles creation and download of ZIP files containing multiple processed images
 */

// Simple ZIP implementation using browser streams  
// eslint-disable-next-line no-unused-vars
class SimpleZip {
  constructor() {
    this.files = [];
  }

  async addFile(filename, data) {
    // Convert data to bytes if it's a URL
    if (typeof data === 'string' && data.startsWith('http')) {
      try {
        const response = await fetch(data);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        data = await response.arrayBuffer();
      } catch (error) {
        console.warn(`Failed to fetch file ${filename}:`, error);
        return false;
      }
    }

    this.files.push({
      name: filename,
      data: data,
      size: data.byteLength || data.length
    });
    
    return true;
  }

  async generateZip() {
    // For now, we'll use a simple approach that works in all browsers
    // In a production app, you'd want to use a proper ZIP library like JSZip
    
    // Since we can't easily create proper ZIP files without a library,
    // we'll download files individually with a small delay
    // This is a fallback approach
    
    return this.files;
  }
}

/**
 * Downloads multiple files as a ZIP archive
 * Falls back to individual downloads if ZIP creation fails
 */
export async function downloadAsZip(files, zipFilename = 'batch-download.zip') {
  try {
    // Check if we have files to process
    if (!files || files.length === 0) {
      throw new Error('No files to download');
    }

    // For browsers that support the File System Access API, we could create a proper ZIP
    // For now, we'll use a simpler approach that works everywhere
    
    if (files.length === 1) {
      // Single file - direct download
      return await downloadSingleFile(files[0]);
    }

    // Multiple files - create a simple archive experience
    return await downloadMultipleFiles(files, zipFilename);
    
  } catch (error) {
    console.error('ZIP download failed:', error);
    throw new Error(`Failed to create ZIP archive: ${error.message}`);
  }
}

/**
 * Downloads a single file
 */
async function downloadSingleFile(fileItem) {
  const { fileName, result } = fileItem;
  
  if (!result || !result.url) {
    throw new Error(`No download URL available for ${fileName}`);
  }

  try {
    // Create download link
    const link = document.createElement('a');
    link.href = result.url;
    link.download = fileName || 'processed-image';
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return { success: true, downloadedFiles: 1 };
  } catch (error) {
    throw new Error(`Failed to download ${fileName}: ${error.message}`);
  }
}

/**
 * Downloads multiple files with a managed experience
 */
async function downloadMultipleFiles(files, zipFilename) {
  let downloadedCount = 0;
  let failedCount = 0;
  const failedFiles = [];

  // Show initial notification about batch download
  const totalFiles = files.length;
  
  for (let i = 0; i < files.length; i++) {
    const fileItem = files[i];
    
    try {
      // Add a small delay to prevent overwhelming the browser
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      await downloadSingleFile(fileItem);
      downloadedCount++;
      
    } catch (error) {
      console.error(`Failed to download ${fileItem.fileName}:`, error);
      failedCount++;
      failedFiles.push({
        fileName: fileItem.fileName,
        error: error.message
      });
    }
  }

  return {
    success: downloadedCount > 0,
    downloadedFiles: downloadedCount,
    failedFiles: failedCount,
    errors: failedFiles,
    message: `Downloaded ${downloadedCount} of ${totalFiles} files${failedCount > 0 ? ` (${failedCount} failed)` : ''}`
  };
}

/**
 * Creates a ZIP file using the more advanced File System Access API
 * (Only works in supported browsers like Chrome)
 */
// eslint-disable-next-line no-unused-vars
async function createRealZip(files, zipFilename) {
  // Check if File System Access API is available
  if (!('showSaveFilePicker' in window)) {
    throw new Error('ZIP creation not supported in this browser');
  }

  try {
    // Request file handle for ZIP
    const fileHandle = await window.showSaveFilePicker({
      suggestedName: zipFilename,
      types: [{
        description: 'ZIP archives',
        accept: { 'application/zip': ['.zip'] }
      }]
    });

    const writable = await fileHandle.createWritable();
    
    // This would require a proper ZIP implementation
    // For now, we'll throw an error to fall back to individual downloads
    await writable.close();
    
    throw new Error('ZIP creation not implemented yet');
    
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('ZIP download was cancelled by user');
    }
    throw error;
  }
}

/**
 * Estimates the total size of files to be downloaded
 */
export function estimateBatchSize(files) {
  let totalSize = 0;
  let estimatedCount = 0;

  files.forEach(file => {
    if (file.result && file.result.size) {
      totalSize += file.result.size;
      estimatedCount++;
    }
  });

  // If we don't have size info for all files, estimate
  if (estimatedCount < files.length && estimatedCount > 0) {
    const averageSize = totalSize / estimatedCount;
    totalSize += (files.length - estimatedCount) * averageSize;
  }

  return {
    totalSize,
    formattedSize: formatFileSize(totalSize),
    hasCompleteInfo: estimatedCount === files.length
  };
}

/**
 * Formats file size for display
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Checks if the browser supports advanced download features
 */
export function getDownloadCapabilities() {
  return {
    fileSystemAccess: 'showSaveFilePicker' in window,
    streams: 'ReadableStream' in window && 'WritableStream' in window,
    compression: 'CompressionStream' in window,
    webStreamsZip: false // Would need a proper library
  };
}

export default downloadAsZip;