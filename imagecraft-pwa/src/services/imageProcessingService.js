/**
 * Image Processing Service
 * High-performance image conversion with modern browser APIs
 * Includes automatic download functionality and progressive processing
 * Now uses both Web Workers and direct Canvas API for optimal performance
 */

import { getModernImageProcessor } from './modernImageProcessor.js';

class ImageProcessingService {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
    this.requestCounter = 0;
    this.pendingRequests = new Map();
    this.progressCallbacks = new Map();
    this.modernProcessor = null;
    this.useModernProcessor = false;
    
    this.initializeService();
  }

  async initializeService() {
    try {
      // Try to initialize Web Worker first
      await this.initializeWorker();
    } catch (error) {
      console.warn('Web Worker initialization failed, falling back to modern processor:', error);
      // Fallback to modern processor
      await this.initializeModernProcessor();
    }
  }

  async initializeModernProcessor() {
    try {
      console.log('Initializing modern processor fallback...');
      this.modernProcessor = getModernImageProcessor();
      
      // Wait for modern processor to be ready
      if (this.modernProcessor && typeof this.modernProcessor.initializeCapabilities === 'function') {
        await this.modernProcessor.initializeCapabilities();
      }
      
      this.useModernProcessor = true;
      this.isInitialized = true;
      console.log('Modern image processor initialized successfully as fallback');
    } catch (error) {
      console.error('Failed to initialize modern processor:', error);
      this.isInitialized = false;
      throw new Error(`All initialization methods failed: ${error.message}`);
    }
  }

  async initializeWorker() {
    try {
      console.log('Initializing image processing worker...');
      
      // Create Web Worker
      this.worker = new Worker('/workers/image-processor-worker.js');
      
      // Set up message handler
      this.worker.onmessage = (e) => {
        this.handleWorkerMessage(e.data);
      };
      
      // Set up error handler
      this.worker.onerror = (error) => {
        console.error('Image processing worker error:', error);
        this.handleWorkerError(error);
      };
      
      // Additional error handling for worker termination
      this.worker.onmessageerror = (error) => {
        console.error('Image processing worker message error:', error);
        this.handleWorkerError(error);
      };
      
      console.log('Worker created, waiting for ready signal...');
      
      // Wait for worker ready signal with shorter timeout
      await this.waitForWorkerReady();
      this.isInitialized = true;
      this.useModernProcessor = false;
      
      console.log('Image processing service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize image processing worker:', error);
      // Always throw to trigger fallback
      throw error;
    }
  }

  waitForWorkerReady() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('Worker initialization timeout - no ready signal received');
        reject(new Error('Worker initialization timeout'));
      }, 5000); // Reduced timeout for faster fallback

      const messageHandler = (e) => {
        console.log('Worker message received:', e.data);
        if (e.data.type === 'ready') {
          console.log('Worker ready signal received');
          clearTimeout(timeout);
          this.worker.removeEventListener('message', messageHandler);
          resolve();
        }
      };

      const errorHandler = (error) => {
        console.error('Worker error during initialization:', error);
        clearTimeout(timeout);
        this.worker.removeEventListener('message', messageHandler);
        this.worker.removeEventListener('error', errorHandler);
        reject(new Error(`Worker error during initialization: ${error.message}`));
      };

      this.worker.addEventListener('message', messageHandler);
      this.worker.addEventListener('error', errorHandler);
    });
  }

  handleWorkerMessage(message) {
    const { type, id, result, error, progress, message: progressMessage } = message;

    switch (type) {
      case 'progress':
        const progressCallback = this.progressCallbacks.get(id);
        if (progressCallback) {
          progressCallback(progress, progressMessage);
        }
        break;

      case 'success':
        const successRequest = this.pendingRequests.get(id);
        if (successRequest) {
          this.pendingRequests.delete(id);
          this.progressCallbacks.delete(id);
          successRequest.resolve(result);
        }
        break;

      case 'error':
        const errorRequest = this.pendingRequests.get(id);
        if (errorRequest) {
          this.pendingRequests.delete(id);
          this.progressCallbacks.delete(id);
          errorRequest.reject(new Error(error));
        }
        break;
        
      default:
        console.warn('Unknown message type from worker:', type);
        break;
    }
  }

  handleWorkerError(error) {
    // Reject all pending requests
    for (const [, request] of this.pendingRequests) {
      request.reject(new Error('Worker error: ' + error.message));
    }
    
    this.pendingRequests.clear();
    this.progressCallbacks.clear();
  }

  /**
   * Convert image to specified format with automatic download
   */
  async convertImage(file, outputFormat, quality = 'medium', options = {}) {
    if (!this.isInitialized) {
      throw new Error('Image processing service not initialized');
    }

    // Use modern processor if worker failed or for large files
    if (this.useModernProcessor || this.shouldUseModernProcessor(file)) {
      // Ensure modern processor is available
      if (!this.modernProcessor) {
        console.warn('Modern processor not available, attempting to initialize...');
        await this.initializeModernProcessor();
      }
      
      if (!this.modernProcessor) {
        throw new Error('Modern processor initialization failed - service unavailable');
      }

      const result = await this.modernProcessor.convertImage(
        file,
        outputFormat.toLowerCase(),
        quality,
        {
          width: options.width,
          height: options.height,
          maxWidth: options.maxWidth,
          maxHeight: options.maxHeight,
          maintainAspectRatio: options.maintainAspectRatio !== false,
          backgroundColor: options.backgroundColor || '#FFFFFF',
          onProgress: options.onProgress
        }
      );

      // Automatic download if requested
      if (options.autoDownload !== false) {
        // Use the actual format from the conversion result, fallback to blob type detection
        const actualFormat = result.format || this.getFormatFromMimeType(result.blob.type) || outputFormat;
        await this.downloadBlob(
          result.blob,
          this.generateFileName(file.name || 'converted', actualFormat),
          actualFormat
        );
      }
      
      return {
        ...result,
        originalSize: file.size,
        originalName: file.name,
        size: result.blob?.size || result.size || 0,
        compressionRatio: file.size > 0 && result.blob?.size > 0 ? result.blob.size / file.size : 1
      };
    }

    // Use Web Worker for smaller files
    const requestId = ++this.requestCounter;
    
    return new Promise((resolve, reject) => {
      // Store request for tracking
      this.pendingRequests.set(requestId, { resolve, reject });
      
      // Set up progress callback
      if (options.onProgress) {
        this.progressCallbacks.set(requestId, options.onProgress);
      }

      // Send conversion request to worker
      this.worker.postMessage({
        type: 'convert',
        id: requestId,
        data: {
          imageData: file,
          outputFormat: outputFormat.toLowerCase(),
          quality,
          options: {
            width: options.width,
            height: options.height,
            maxWidth: options.maxWidth,
            maxHeight: options.maxHeight,
            maintainAspectRatio: options.maintainAspectRatio !== false,
            backgroundColor: options.backgroundColor || '#FFFFFF'
          }
        }
      });
    }).then(async (result) => {
      // Automatic download if requested
      if (options.autoDownload !== false) {
        // Determine actual format from blob type for correct filename
        const actualFormat = this.getFormatFromMimeType(result.blob.type) || outputFormat;
        await this.downloadBlob(
          result.blob,
          this.generateFileName(file.name || 'converted', actualFormat),
          actualFormat
        );
      }
      
      return {
        ...result,
        originalSize: file.size,
        originalName: file.name,
        size: result.size || result.blob?.size || 0,
        compressionRatio: file.size > 0 && result.size > 0 ? result.size / file.size : 1
      };
    });
  }

  /**
   * Determine if we should use modern processor for this file
   */
  shouldUseModernProcessor(file) {
    // Use modern processor for files larger than 10MB or if worker not available
    return file.size > 10 * 1024 * 1024 || !this.worker;
  }

  /**
   * Apply filter to image
   */
  async applyFilter(file, filterType, intensity = 1, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Image processing service not initialized');
    }

    // Use modern processor if worker failed or for large files
    if (this.useModernProcessor || this.shouldUseModernProcessor(file)) {
      // Ensure modern processor is available
      if (!this.modernProcessor) {
        console.warn('Modern processor not available for filter, attempting to initialize...');
        await this.initializeModernProcessor();
      }
      
      if (!this.modernProcessor) {
        throw new Error('Modern processor initialization failed - filter service unavailable');
      }

      const result = await this.modernProcessor.applyFilter(
        file,
        filterType,
        intensity,
        {
          onProgress: options.onProgress
        }
      );

      if (options.autoDownload !== false) {
        await this.downloadBlob(
          result.blob,
          this.generateFileName(file.name || 'filtered', 'png'),
          'png'
        );
      }
      
      return result;
    }

    // Use Web Worker
    const requestId = ++this.requestCounter;
    
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
      
      if (options.onProgress) {
        this.progressCallbacks.set(requestId, options.onProgress);
      }

      this.worker.postMessage({
        type: 'filter',
        id: requestId,
        data: {
          imageData: file,
          filterType,
          intensity
        }
      });
    }).then(async (result) => {
      if (options.autoDownload !== false) {
        await this.downloadBlob(
          result.blob,
          this.generateFileName(file.name || 'filtered', 'png'),
          'png'
        );
      }
      
      return result;
    });
  }

  /**
   * Get available quality presets
   */
  async getQualityPresets() {
    if (!this.isInitialized) {
      throw new Error('Image processing service not initialized');
    }

    if (this.useModernProcessor) {
      if (!this.modernProcessor) {
        await this.initializeModernProcessor();
      }
      return this.modernProcessor.getQualityPresets();
    }

    const requestId = ++this.requestCounter;
    
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
      
      this.worker.postMessage({
        type: 'getQualityPresets',
        id: requestId,
        data: {}
      });
    });
  }

  /**
   * Get supported output formats
   */
  async getSupportedFormats() {
    if (!this.isInitialized) {
      throw new Error('Image processing service not initialized');
    }

    if (this.useModernProcessor) {
      if (!this.modernProcessor) {
        await this.initializeModernProcessor();
      }
      return this.modernProcessor.getSupportedFormats();
    }

    const requestId = ++this.requestCounter;
    
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
      
      this.worker.postMessage({
        type: 'getSupportedFormats',
        id: requestId,
        data: {}
      });
    });
  }

  /**
   * Download blob as file with automatic filename
   */
  async downloadBlob(blob, filename, format) {
    try {
      // Create object URL
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      // Add to DOM and trigger download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      
      // Revoke object URL after a short delay to ensure download starts
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
      
      return {
        filename,
        size: blob.size,
        format,
        downloadedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Download failed:', error);
      throw new Error('Failed to download converted image');
    }
  }

  /**
   * Generate appropriate filename for converted image
   */
  generateFileName(originalName, outputFormat) {
    // Remove existing extension
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    
    // Add timestamp for uniqueness
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    
    // Return with new extension
    return `${nameWithoutExt}_converted_${timestamp}.${outputFormat.toLowerCase()}`;
  }

  /**
   * Get format name from MIME type
   */
  getFormatFromMimeType(mimeType) {
    const mimeToFormat = {
      'image/jpeg': 'jpeg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/avif': 'avif',
      'image/bmp': 'bmp',
      'image/gif': 'gif'
    };
    
    return mimeToFormat[mimeType];
  }

  /**
   * Batch convert multiple images
   */
  async batchConvert(files, outputFormat, quality = 'medium', options = {}) {
    // Use modern processor for batch operations for better memory management
    if (this.useModernProcessor || files.some(f => f.size > 5 * 1024 * 1024)) {
      if (!this.modernProcessor) {
        await this.initializeModernProcessor();
      }
      return this.modernProcessor.batchConvert(files, outputFormat, quality, options);
    }

    const results = [];
    const errors = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Update batch progress
        if (options.onBatchProgress) {
          options.onBatchProgress(i, files.length, `Converting ${file.name}...`);
        }
        
        const result = await this.convertImage(file, outputFormat, quality, {
          ...options,
          onProgress: (progress, message) => {
            if (options.onProgress) {
              // Scale progress to current file
              const overallProgress = ((i / files.length) * 100) + ((progress / 100) * (100 / files.length));
              options.onProgress(overallProgress, `File ${i + 1}/${files.length}: ${message}`);
            }
          }
        });
        
        results.push({
          originalFile: file,
          result,
          success: true
        });
        
      } catch (error) {
        console.error(`Failed to convert ${file.name}:`, error);
        errors.push({
          originalFile: file,
          error: error.message,
          success: false
        });
      }
    }
    
    return {
      results,
      errors,
      successCount: results.length,
      errorCount: errors.length,
      totalCount: files.length
    };
  }

  /**
   * Estimate output file size based on input and quality
   */
  estimateOutputSize(inputSize, inputFormat, outputFormat, quality) {
    const qualityMultipliers = {
      high: 1.2,
      medium: 0.8,
      low: 0.4
    };
    
    const formatMultipliers = {
      jpeg: 0.6,
      webp: 0.4,
      avif: 0.3,
      png: 1.5,
      bmp: 3.0,
      gif: 0.8,
      tiff: 2.5
    };
    
    const qualityMultiplier = qualityMultipliers[quality] || qualityMultipliers.medium;
    const formatMultiplier = formatMultipliers[outputFormat.toLowerCase()] || 1;
    
    return Math.round(inputSize * formatMultiplier * qualityMultiplier);
  }

  /**
   * Get processing performance stats
   */
  getPerformanceStats() {
    const baseStats = {
      isInitialized: this.isInitialized,
      pendingRequests: this.pendingRequests.size,
      workerReady: this.worker && this.worker.onmessage,
      usingModernProcessor: this.useModernProcessor,
      memoryUsage: this.getMemoryUsage()
    };

    if (this.useModernProcessor && this.modernProcessor) {
      return {
        ...baseStats,
        modernProcessorStats: this.modernProcessor.getPerformanceStats()
      };
    }

    return baseStats;
  }

  getMemoryUsage() {
    if ('memory' in performance) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      };
    }
    
    return null;
  }

  /**
   * Clean up resources and terminate worker
   */
  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    // Clean up modern processor
    if (this.modernProcessor) {
      this.modernProcessor = null;
    }
    
    // Reject all pending requests
    for (const [, request] of this.pendingRequests) {
      request.reject(new Error('Service destroyed'));
    }
    
    this.pendingRequests.clear();
    this.progressCallbacks.clear();
    this.isInitialized = false;
    this.useModernProcessor = false;
  }
}

// Create singleton instance
let processingService = null;

export const getImageProcessingService = () => {
  if (!processingService) {
    processingService = new ImageProcessingService();
  }
  return processingService;
};

export const destroyImageProcessingService = () => {
  if (processingService) {
    processingService.destroy();
    processingService = null;
  }
};

export default ImageProcessingService;