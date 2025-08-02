/**
 * ImageMagick Service
 * Manages ImageMagick WASM worker for advanced image processing
 * Provides AVIF conversion and other advanced formats not supported by Canvas API
 */

class ImageMagickService {
  constructor() {
    this.worker = null;
    this.initialized = false;
    this.requestCounter = 0;
    this.pendingRequests = new Map();
    this.capabilities = null;
    this.fallbackMode = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      console.log('Initializing ImageMagick Service with WASM worker...');
      
      // Create the new WASM worker
      this.worker = new Worker('/workers/imagemagick-wasm-worker.js');

      // Set up message handler
      this.worker.onmessage = (event) => {
        this.handleWorkerMessage(event.data);
      };

      this.worker.onerror = (error) => {
        console.error('ImageMagick WASM Worker Error:', error);
        this.handleWorkerError(error);
      };

      // Send initialization message
      this.worker.postMessage({ type: 'init' });

      // Wait for ready signal
      await this.waitForReady();
      
      this.initialized = true;
      console.log('ImageMagick Service initialized successfully', {
        fallbackMode: this.fallbackMode,
        capabilities: this.capabilities
      });
      
    } catch (error) {
      console.error('Failed to initialize ImageMagick Service:', error);
      this.fallbackMode = true;
      this.initialized = true; // Still mark as initialized so service can be used
      throw error;
    }
  }

  waitForReady() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('ImageMagick initialization timeout'));
      }, 45000); // 45 second timeout for WASM loading

      const handler = (data) => {
        if (data.type === 'ready') {
          clearTimeout(timeout);
          this.capabilities = data.capabilities;
          this.fallbackMode = data.fallbackMode || false;
          
          if (data.error) {
            console.warn('ImageMagick initialized with warnings:', data.error);
          }
          
          resolve();
        } else if (data.type === 'error') {
          clearTimeout(timeout);
          reject(new Error(data.error));
        }
      };

      // Add temporary handler for initialization
      this.tempHandler = handler;
    });
  }

  handleWorkerMessage(data) {
    const { type, id, result, error, progress, message } = data;

    // Handle initialization messages
    if (this.tempHandler && (type === 'ready' || type === 'error')) {
      this.tempHandler(data);
      this.tempHandler = null;
      return;
    }

    // Handle request-specific messages
    const request = this.pendingRequests.get(id);
    if (!request) {
      console.warn('Received message for unknown request ID:', id);
      return;
    }

    switch (type) {
      case 'progress':
        if (request.onProgress) {
          request.onProgress(progress, message);
        }
        break;

      case 'success':
        this.pendingRequests.delete(id);
        request.resolve(result);
        break;

      case 'error':
        this.pendingRequests.delete(id);
        request.reject(new Error(error));
        break;
        
      default:
        console.warn('Unknown worker message type:', type);
        break;
    }
  }

  handleWorkerError(error) {
    console.error('Worker error occurred:', error);
    
    // Reject all pending requests
    for (const [, request] of this.pendingRequests) {
      request.reject(new Error(`Worker error: ${error.message || 'Unknown error'}`));
    }
    
    this.pendingRequests.clear();
    
    // Set fallback mode
    this.fallbackMode = true;
  }

  /**
   * Convert image using ImageMagick WASM with advanced format support
   */
  async convertImage(
    file, 
    outputFormat, 
    options = {},
    onProgress = null
  ) {
    if (!this.initialized) {
      throw new Error('ImageMagick Service not initialized');
    }

    const requestId = ++this.requestCounter;
    
    try {
      // Convert file to array buffer
      const arrayBuffer = await file.arrayBuffer();
      const imageData = new Uint8Array(arrayBuffer);

      // Validate format support
      if (!this.supportsFormat(outputFormat)) {
        throw new Error(`Format ${outputFormat} is not supported. Supported formats: ${this.getSupportedFormats().join(', ')}`);
      }

      // Create promise for conversion
      const conversionPromise = new Promise((resolve, reject) => {
        this.pendingRequests.set(requestId, { 
          resolve, 
          reject, 
          onProgress 
        });

        // Send conversion request to worker
        this.worker.postMessage({
          type: 'convert',
          data: {
            id: requestId,
            imageData,
            outputFormat: outputFormat.toLowerCase(),
            options: {
              width: options.width,
              height: options.height,
              quality: options.quality || 'medium',
              maintainAspectRatio: options.maintainAspectRatio !== false,
              backgroundColor: options.backgroundColor || '#FFFFFF',
              crop: options.crop,
              rotate: options.rotate,
              blur: options.blur,
              brightness: options.brightness,
              contrast: options.contrast
            }
          }
        });
      });

      return await conversionPromise;

    } catch (error) {
      this.pendingRequests.delete(requestId);
      throw error;
    }
  }

  /**
   * Check if ImageMagick supports a format
   */
  supportsFormat(format) {
    if (!this.capabilities) return false;
    
    const formatLower = format.toLowerCase();
    
    // Check output formats specifically
    if (this.capabilities.formats && this.capabilities.formats.output) {
      return this.capabilities.formats.output.includes(formatLower);
    }
    
    // Fallback to legacy format list
    if (this.capabilities.formats && Array.isArray(this.capabilities.formats)) {
      return this.capabilities.formats.includes(formatLower);
    }
    
    return false;
  }

  /**
   * Get supported output formats
   */
  getSupportedFormats() {
    if (!this.capabilities) return [];
    
    // New format structure
    if (this.capabilities.formats && this.capabilities.formats.output) {
      return this.capabilities.formats.output;
    }
    
    // Legacy format structure
    if (this.capabilities.formats && Array.isArray(this.capabilities.formats)) {
      return this.capabilities.formats;
    }
    
    return [];
  }

  /**
   * Get supported input formats
   */
  getSupportedInputFormats() {
    if (!this.capabilities) return [];
    
    if (this.capabilities.formats && this.capabilities.formats.input) {
      return this.capabilities.formats.input;
    }
    
    // Fallback - assume input formats are more extensive than output
    return this.getSupportedFormats();
  }

  /**
   * Check if AVIF is supported
   */
  supportsAVIF() {
    return this.supportsFormat('avif');
  }

  /**
   * Check if HEIC/HEIF is supported
   */
  supportsHEIC() {
    return this.supportsFormat('heic') || this.supportsFormat('heif');
  }

  /**
   * Check if RAW formats are supported
   */
  supportsRAW() {
    const rawFormats = ['raw', 'cr2', 'cr3', 'nef', 'arw', 'dng'];
    return rawFormats.some(format => this.supportsFormat(format));
  }

  /**
   * Get available operations
   */
  getAvailableOperations() {
    return this.capabilities ? this.capabilities.operations || [] : [];
  }

  /**
   * Check if service is ready
   */
  isReady() {
    return this.initialized;
  }

  /**
   * Check if service is in fallback mode (using Canvas API instead of ImageMagick)
   */
  isFallbackMode() {
    return this.fallbackMode;
  }

  /**
   * Get detailed capabilities information
   */
  async getCapabilities() {
    if (!this.initialized) {
      throw new Error('Service not initialized');
    }

    const requestId = ++this.requestCounter;

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });

      this.worker.postMessage({
        type: 'getCapabilities',
        data: { id: requestId }
      });
    });
  }

  /**
   * Batch process multiple images with progress tracking
   */
  async processBatch(files, outputFormat, options = {}, batchSize = 2, onProgress = null) {
    const results = [];
    const errors = [];
    const totalFiles = files.length;

    // Validate batch size for memory management
    if (batchSize > 5) {
      console.warn('Reducing batch size to prevent memory issues');
      batchSize = 5;
    }

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      
      // Process batch in parallel
      const batchPromises = batch.map(async (file, batchIndex) => {
        const overallIndex = i + batchIndex;
        
        try {
          const result = await this.convertImage(file, outputFormat, options, (progress, message) => {
            if (onProgress) {
              const overallProgress = ((overallIndex / totalFiles) * 100) + (progress / totalFiles);
              onProgress(Math.min(overallProgress, 100), `Processing ${overallIndex + 1}/${totalFiles}: ${message}`);
            }
          });

          return {
            success: true,
            file,
            result,
            index: overallIndex
          };

        } catch (error) {
          console.error(`Failed to process ${file.name}:`, error);
          
          return {
            success: false,
            file,
            error: error.message,
            index: overallIndex
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      // Separate successful results from errors
      batchResults.forEach(item => {
        if (item.success) {
          results.push(item);
        } else {
          errors.push(item);
        }
      });

      // Small delay between batches to prevent memory issues
      if (i + batchSize < files.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return {
      results,
      errors,
      successCount: results.length,
      errorCount: errors.length,
      totalCount: totalFiles
    };
  }

  /**
   * Convert multiple images to AVIF format specifically
   */
  async convertToAVIF(files, options = {}, onProgress = null) {
    if (!this.supportsAVIF()) {
      throw new Error('AVIF format is not supported. Please ensure ImageMagick WASM is properly loaded.');
    }

    return this.processBatch(files, 'avif', {
      quality: options.quality || 'medium',
      width: options.width,
      height: options.height,
      maintainAspectRatio: options.maintainAspectRatio !== false,
      ...options
    }, 2, onProgress);
  }

  /**
   * Convert RAW images to standard formats
   */
  async convertRAWImages(files, outputFormat = 'jpeg', options = {}, onProgress = null) {
    if (!this.supportsRAW()) {
      throw new Error('RAW format conversion is not supported. Please ensure ImageMagick WASM is properly loaded.');
    }

    return this.processBatch(files, outputFormat, {
      quality: options.quality || 'high', // Use high quality for RAW conversions
      ...options
    }, 1, onProgress); // Process RAW files one at a time due to memory requirements
  }

  /**
   * Get format recommendations based on input
   */
  getFormatRecommendations(inputFormat, useCase = 'general') {
    const recommendations = {
      photos: {
        web: ['avif', 'webp', 'jpeg'],
        print: ['tiff', 'png', 'jpeg'],
        archive: ['png', 'tiff']
      },
      graphics: {
        web: ['webp', 'png', 'avif'],
        print: ['png', 'tiff'],
        archive: ['png', 'tiff']
      },
      raw: {
        web: ['jpeg', 'webp', 'avif'],
        print: ['tiff', 'jpeg'],
        archive: ['tiff', 'png']
      }
    };

    const inputLower = inputFormat.toLowerCase();
    const isRaw = ['raw', 'cr2', 'cr3', 'nef', 'arw', 'dng'].includes(inputLower);
    const isPhoto = ['jpeg', 'jpg', 'heic', 'heif'].includes(inputLower) || isRaw;
    
    let category = 'graphics';
    if (isRaw) category = 'raw';
    else if (isPhoto) category = 'photos';

    const suggested = recommendations[category][useCase] || recommendations[category]['web'];
    
    // Filter by what's actually supported
    return suggested.filter(format => this.supportsFormat(format));
  }

  /**
   * Estimate conversion time based on file size and format
   */
  estimateProcessingTime(fileSize, outputFormat) {
    // Base time per MB
    const baseTimePerMB = {
      'avif': 2000,   // AVIF is slower to encode
      'heic': 1500,
      'webp': 800,
      'jpeg': 400,
      'png': 600,
      'tiff': 1000
    };

    const fileSizeMB = fileSize / (1024 * 1024);
    const baseTime = baseTimePerMB[outputFormat.toLowerCase()] || 500;
    
    return Math.max(1000, fileSizeMB * baseTime); // Minimum 1 second
  }

  /**
   * Destroy service and cleanup
   */
  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    // Reject all pending requests
    for (const [, request] of this.pendingRequests) {
      request.reject(new Error('Service destroyed'));
    }
    
    this.pendingRequests.clear();
    this.initialized = false;
    this.capabilities = null;
    this.fallbackMode = false;
    
    console.log('ImageMagick Service destroyed');
  }
}

// Export singleton instance
const imageMagickService = new ImageMagickService();

// Auto-initialize the service
imageMagickService.initialize().catch(error => {
  console.warn('ImageMagick Service auto-initialization failed:', error);
  // Service will still be available in fallback mode
});

export default imageMagickService;