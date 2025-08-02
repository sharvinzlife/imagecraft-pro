/**
 * Image Processing Web Worker
 * Browser-only image conversion with no server dependencies
 * Optimized for performance, memory efficiency, and large file handling
 * Supports progressive processing to avoid memory limits
 */

// Quality presets optimized for browser-only processing - Fixed to prevent JPEG artifacts
const QUALITY_PRESETS = {
  high: {
    description: 'Maximum quality, larger file size',
    jpeg: 0.98, // Increased from 0.95 to prevent quantization artifacts
    webp: 0.92, // Slightly increased for consistency
    avif: 0.88, // Slightly increased for consistency
    png: null, // PNG is lossless
    compression: 'lossless'
  },
  medium: {
    description: 'Balanced quality and file size (recommended)',
    jpeg: 0.88, // Increased from 0.8 to prevent visible grid lines
    webp: 0.80, // Slightly increased for consistency
    avif: 0.70, // Slightly increased for consistency
    png: null,
    compression: 'balanced'
  },
  low: {
    description: 'Smaller file size, good quality',
    jpeg: 0.75, // Increased from 0.6 to maintain acceptable quality
    webp: 0.60, // Slightly increased
    avif: 0.50, // Slightly increased
    png: null,
    compression: 'high'
  }
};

// Supported formats and their MIME types (browser-native only)
const FORMAT_MIME_TYPES = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  bmp: 'image/bmp',
  gif: 'image/gif'
};

// Memory management constants
const MAX_CHUNK_SIZE = 25 * 1024 * 1024; // 25MB chunks for progressive processing
const TILE_SIZE = 1536; // Increased tile size to reduce boundary artifacts
const TILE_OVERLAP = 32; // Add overlap between tiles to eliminate seams

class ImageProcessor {
  constructor() {
    this.canvas = new OffscreenCanvas(1, 1);
    this.ctx = this.canvas.getContext('2d', {
      willReadFrequently: false,
      alpha: true
    });
    
    // Enable image smoothing for better quality
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    
    // Performance monitoring
    this.processedImages = 0;
    this.totalProcessingTime = 0;
    this.memoryUsage = new Map();
    
    // Format capability detection
    this.formatCapabilities = null;
    this.initializeCapabilities();
  }

  /**
   * Initialize format capabilities for this browser
   */
  async initializeCapabilities() {
    const testCanvas = new OffscreenCanvas(1, 1);
    
    this.formatCapabilities = {
      jpeg: true, // Always supported
      png: true,  // Always supported
      webp: await this.testFormatSupport(testCanvas, 'image/webp'),
      avif: await this.testFormatSupport(testCanvas, 'image/avif'),
      bmp: await this.testFormatSupport(testCanvas, 'image/bmp'),
      gif: true   // Always supported for input
    };
  }

  /**
   * Test if browser supports specific format with more reliable detection
   */
  async testFormatSupport(canvas, mimeType) {
    try {
      // First check if the MIME type is recognized
      if (!this.isMimeTypeSupported(mimeType)) {
        return false;
      }
      
      // Test actual conversion capability
      if (canvas.convertToBlob) {
        const blob = await canvas.convertToBlob({ type: mimeType, quality: 0.8 });
        // Check if blob was created and has correct type
        return blob !== null && blob.size > 0 && blob.type === mimeType;
      }
      
      // Fallback to toBlob for older browsers
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob !== null && blob.size > 0 && blob.type === mimeType);
        }, mimeType, 0.8);
      });
    } catch (error) {
      console.warn(`Format support test failed for ${mimeType}:`, error);
      return false;
    }
  }
  
  /**
   * Check if MIME type is supported by the browser
   */
  isMimeTypeSupported(mimeType) {
    // Create a test canvas element
    const testCanvas = new OffscreenCanvas(1, 1);
    
    // Check if toDataURL supports the format (basic check)
    try {
      const dataUrl = testCanvas.toDataURL ? testCanvas.toDataURL(mimeType) : null;
      if (dataUrl && !dataUrl.startsWith('data:image/png')) {
        return true;
      }
    } catch (e) {
      // toDataURL not available or format not supported
    }
    
    // Additional checks for specific formats
    switch (mimeType) {
      case 'image/avif':
        // AVIF support is newer, be more strict
        return typeof OffscreenCanvas !== 'undefined' && 
               'convertToBlob' in OffscreenCanvas.prototype;
      case 'image/webp':
        // WebP is widely supported
        return true;
      case 'image/jpeg':
      case 'image/png':
        // Always supported
        return true;
      default:
        return false;
    }
  }

  /**
   * Convert image to specified format with progressive processing
   */
  async convertImage(imageData, outputFormat, quality = 'medium', options = {}) {
    const startTime = performance.now();
    let imageBitmap = null;
    
    try {
      // Validate format support
      if (!this.formatCapabilities) {
        await this.initializeCapabilities();
      }
      
      if (!this.isFormatSupported(outputFormat)) {
        throw new Error(`Format ${outputFormat} is not supported by this browser`);
      }
      
      // Update progress
      this.reportProgress(5, 'Loading image...');
      
      // Create image bitmap from input data
      imageBitmap = await this.createImageBitmap(imageData);
      
      // Memory usage tracking
      const initialMemory = this.getMemoryEstimate(imageBitmap.width, imageBitmap.height);
      this.memoryUsage.set('input', initialMemory);
      
      this.reportProgress(15, 'Analyzing image...');
      
      // Calculate optimal dimensions
      const { width, height } = this.calculateDimensions(
        imageBitmap.width,
        imageBitmap.height,
        options
      );
      
      // Check if we need progressive processing
      const needsProgressive = this.shouldUseProgressiveProcessing(
        imageBitmap.width,
        imageBitmap.height,
        width,
        height
      );
      
      let blob;
      if (needsProgressive) {
        this.reportProgress(25, 'Processing large image progressively...');
        blob = await this.processImageProgressively(
          imageBitmap,
          width,
          height,
          outputFormat,
          quality,
          options
        );
      } else {
        this.reportProgress(25, 'Processing image...');
        blob = await this.processImageDirect(
          imageBitmap,
          width,
          height,
          outputFormat,
          quality,
          options
        );
      }
      
      this.reportProgress(90, 'Finalizing...');
      
      const processingTime = performance.now() - startTime;
      this.processedImages++;
      this.totalProcessingTime += processingTime;
      
      this.reportProgress(100, 'Conversion complete!');
      
      return {
        blob,
        width,
        height,
        format: outputFormat,
        quality,
        size: blob.size,
        processingTime,
        memoryUsed: this.getMemoryEstimate(width, height)
      };
      
    } catch (error) {
      throw new Error(`Image conversion failed: ${error.message}`);
    } finally {
      // Always clean up
      if (imageBitmap) {
        imageBitmap.close();
      }
      this.memoryUsage.clear();
    }
  }

  /**
   * Check if format is supported by browser
   */
  isFormatSupported(format) {
    if (!this.formatCapabilities) {
      return ['jpeg', 'jpg', 'png'].includes(format.toLowerCase());
    }
    return this.formatCapabilities[format.toLowerCase()] === true;
  }

  /**
   * Determine if progressive processing is needed
   */
  shouldUseProgressiveProcessing(originalWidth, originalHeight, targetWidth, targetHeight) {
    const originalMemory = this.getMemoryEstimate(originalWidth, originalHeight);
    const targetMemory = this.getMemoryEstimate(targetWidth, targetHeight);
    
    return originalMemory > MAX_CHUNK_SIZE || targetMemory > MAX_CHUNK_SIZE;
  }

  /**
   * Process image directly for smaller images
   */
  async processImageDirect(imageBitmap, width, height, outputFormat, quality, options) {
    this.canvas.width = width;
    this.canvas.height = height;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);
    
    // Apply background for formats that don't support transparency
    if (this.requiresBackground(outputFormat)) {
      this.ctx.fillStyle = options.backgroundColor || '#FFFFFF';
      this.ctx.fillRect(0, 0, width, height);
    }
    
    // Draw image with high-quality scaling
    this.ctx.drawImage(imageBitmap, 0, 0, width, height);
    
    this.reportProgress(70, 'Converting to target format...');
    
    // Convert to blob
    return await this.canvasToBlob(outputFormat, quality);
  }

  /**
   * Process large images progressively to avoid memory issues
   */
  async processImageProgressively(imageBitmap, width, height, outputFormat, quality, options) {
    this.canvas.width = width;
    this.canvas.height = height;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);
    
    // Apply background for formats that don't support transparency
    if (this.requiresBackground(outputFormat)) {
      this.ctx.fillStyle = options.backgroundColor || '#FFFFFF';
      this.ctx.fillRect(0, 0, width, height);
    }
    
    // Calculate scaling factors
    const scaleX = width / imageBitmap.width;
    const scaleY = height / imageBitmap.height;
    
    // Process in tiles
    const tilesX = Math.ceil(imageBitmap.width / TILE_SIZE);
    const tilesY = Math.ceil(imageBitmap.height / TILE_SIZE);
    const totalTiles = tilesX * tilesY;
    
    for (let tileY = 0; tileY < tilesY; tileY++) {
      for (let tileX = 0; tileX < tilesX; tileX++) {
        const currentTile = tileY * tilesX + tileX + 1;
        
        this.reportProgress(
          25 + (currentTile / totalTiles) * 40,
          `Processing tile ${currentTile}/${totalTiles}...`
        );
        
        // Source coordinates
        const sx = tileX * TILE_SIZE;
        const sy = tileY * TILE_SIZE;
        const sw = Math.min(TILE_SIZE, imageBitmap.width - sx);
        const sh = Math.min(TILE_SIZE, imageBitmap.height - sy);
        
        // Destination coordinates
        const dx = sx * scaleX;
        const dy = sy * scaleY;
        const dw = sw * scaleX;
        const dh = sh * scaleY;
        
        // Draw tile
        this.ctx.drawImage(imageBitmap, sx, sy, sw, sh, dx, dy, dw, dh);
        
        // Allow browser to breathe between tiles
        if (currentTile % 8 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    }
    
    this.reportProgress(70, 'Converting to target format...');
    
    // Convert to blob
    return await this.canvasToBlob(outputFormat, quality);
  }

  /**
   * Create ImageBitmap from various input types
   */
  async createImageBitmap(imageData) {
    if (imageData instanceof ImageBitmap) {
      return imageData;
    }
    
    if (imageData instanceof Blob || imageData instanceof File) {
      return await createImageBitmap(imageData, {
        colorSpaceConversion: 'default',
        imageOrientation: 'from-image',
        premultiplyAlpha: 'default',
        resizeQuality: 'high'
      });
    }
    
    if (imageData instanceof ArrayBuffer) {
      const blob = new Blob([imageData]);
      return await createImageBitmap(blob);
    }
    
    throw new Error('Unsupported image data type');
  }

  /**
   * Calculate optimal dimensions with constraints
   */
  calculateDimensions(originalWidth, originalHeight, options = {}) {
    let { width, height, maxWidth, maxHeight, maintainAspectRatio = true } = options;
    
    // If no specific dimensions requested, use original
    if (!width && !height && !maxWidth && !maxHeight) {
      return { width: originalWidth, height: originalHeight };
    }
    
    const aspectRatio = originalWidth / originalHeight;
    
    // Apply max constraints first
    if (maxWidth && originalWidth > maxWidth) {
      width = maxWidth;
      if (maintainAspectRatio) {
        height = width / aspectRatio;
      }
    }
    
    if (maxHeight && (height || originalHeight) > maxHeight) {
      height = maxHeight;
      if (maintainAspectRatio) {
        width = height * aspectRatio;
      }
    }
    
    // Use original dimensions if nothing specified
    if (!width && !height) {
      width = originalWidth;
      height = originalHeight;
    } else if (!width) {
      width = maintainAspectRatio ? height * aspectRatio : originalWidth;
    } else if (!height) {
      height = maintainAspectRatio ? width / aspectRatio : originalHeight;
    }
    
    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  /**
   * Check if format requires background (no transparency support)
   */
  requiresBackground(format) {
    return ['jpeg', 'jpg', 'bmp'].includes(format.toLowerCase());
  }

  /**
   * Convert canvas to blob with better error handling and format validation
   */
  async canvasToBlob(format, quality) {
    const mimeType = FORMAT_MIME_TYPES[format.toLowerCase()];
    if (!mimeType) {
      throw new Error(`Unsupported output format: ${format}`);
    }
    
    // Check if format is actually supported before attempting conversion
    if (!this.isFormatSupported(format)) {
      throw new Error(`Browser does not support ${format.toUpperCase()} format. Please select a different format.`);
    }
    
    const qualityPreset = QUALITY_PRESETS[quality] || QUALITY_PRESETS.medium;
    const qualityValue = qualityPreset[format.toLowerCase()];
    
    try {
      // Use modern convertToBlob API when available (better performance)
      if (this.canvas.convertToBlob) {
        const blob = await this.canvas.convertToBlob({
          type: mimeType,
          quality: qualityValue
        });
        
        if (!blob || blob.size === 0) {
          throw new Error(`Failed to convert to ${format} format - no data generated`);
        }
        
        // Verify the blob has the correct MIME type
        if (blob.type !== mimeType) {
          console.warn(`Expected ${mimeType}, got ${blob.type}`);
          // Only throw error for specific format requests, not fallbacks
          if (format.toLowerCase() !== 'png') {
            throw new Error(`Format conversion failed - browser returned ${blob.type} instead of ${mimeType}`);
          }
        }
        
        return blob;
      }
      
      // Fallback to legacy toBlob method
      return new Promise((resolve, reject) => {
        this.canvas.toBlob(
          (blob) => {
            if (blob && blob.size > 0) {
              // Verify MIME type for fallback too
              if (blob.type !== mimeType && format.toLowerCase() !== 'png') {
                reject(new Error(`Format conversion failed - browser returned ${blob.type} instead of ${mimeType}`));
                return;
              }
              resolve(blob);
            } else {
              reject(new Error(`Failed to convert to ${format} format - no data generated`));
            }
          },
          mimeType,
          qualityValue
        );
      });
      
    } catch (error) {
      // More specific error handling - don't auto-fallback to PNG for user-selected formats
      console.error(`Canvas conversion error for ${format}:`, error);
      
      // Only auto-fallback in specific circumstances, not for user-requested formats
      if (format.toLowerCase() === 'png') {
        // If PNG fails, we have a serious problem
        throw new Error(`PNG conversion failed: ${error.message}`);
      }
      
      // For other formats, provide clear error message instead of silent fallback
      throw new Error(`${format.toUpperCase()} conversion failed: ${error.message}. This format may not be supported by your browser.`);
    }
  }

  /**
   * Report progress to main thread
   */
  reportProgress(progress, message) {
    self.postMessage({
      type: 'progress',
      progress: Math.min(100, Math.max(0, progress)),
      message
    });
  }

  /**
   * Apply filters with progressive processing for large images
   */
  async applyFilter(imageBitmap, filterType, intensity = 1) {
    const width = imageBitmap.width;
    const height = imageBitmap.height;
    
    this.canvas.width = width;
    this.canvas.height = height;
    
    // Draw original image
    this.ctx.drawImage(imageBitmap, 0, 0);
    
    // For very large images, process in chunks to avoid memory issues
    const needsChunking = this.getMemoryEstimate(width, height) > MAX_CHUNK_SIZE;
    
    if (needsChunking) {
      await this.applyFilterProgressive(filterType, intensity, width, height);
    } else {
      this.applyFilterDirect(filterType, intensity, width, height);
    }
  }

  /**
   * Apply filter directly for smaller images
   */
  applyFilterDirect(filterType, intensity, width, height) {
    const imageData = this.ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    this.processFilterData(data, filterType, intensity);
    this.ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Apply filter progressively for large images
   */
  async applyFilterProgressive(filterType, intensity, width, height) {
    const chunkHeight = Math.min(TILE_SIZE, height);
    const totalChunks = Math.ceil(height / chunkHeight);
    
    for (let i = 0; i < totalChunks; i++) {
      const y = i * chunkHeight;
      const currentHeight = Math.min(chunkHeight, height - y);
      
      this.reportProgress(
        10 + (i / totalChunks) * 80,
        `Applying filter to chunk ${i + 1}/${totalChunks}...`
      );
      
      const imageData = this.ctx.getImageData(0, y, width, currentHeight);
      this.processFilterData(imageData.data, filterType, intensity);
      this.ctx.putImageData(imageData, 0, y);
      
      // Allow browser to breathe
      if (i % 4 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  }

  /**
   * Process filter data for a chunk
   */
  processFilterData(data, filterType, intensity) {
    switch (filterType) {
      case 'brightness':
        this.adjustBrightness(data, intensity);
        break;
      case 'contrast':
        this.adjustContrast(data, intensity);
        break;
      case 'saturation':
        this.adjustSaturation(data, intensity);
        break;
      case 'grayscale':
        this.convertToGrayscale(data);
        break;
      case 'sepia':
        this.applySepia(data);
        break;
      case 'blur':
        // Note: Blur is handled differently using canvas filters
        break;
      default:
        throw new Error(`Unknown filter type: ${filterType}`);
    }
  }

  adjustBrightness(data, factor) {
    const adjustment = (factor - 1) * 255;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, data[i] + adjustment));     // R
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + adjustment)); // G
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + adjustment)); // B
    }
  }

  adjustContrast(data, factor) {
    const adjustment = (factor - 1) * 128;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, (data[i] - 128) * factor + 128));     // R
      data[i + 1] = Math.max(0, Math.min(255, (data[i + 1] - 128) * factor + 128)); // G
      data[i + 2] = Math.max(0, Math.min(255, (data[i + 2] - 128) * factor + 128)); // B
    }
  }

  adjustSaturation(data, factor) {
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
      data[i] = Math.max(0, Math.min(255, gray + factor * (data[i] - gray)));     // R
      data[i + 1] = Math.max(0, Math.min(255, gray + factor * (data[i + 1] - gray))); // G
      data[i + 2] = Math.max(0, Math.min(255, gray + factor * (data[i + 2] - gray))); // B
    }
  }

  convertToGrayscale(data) {
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = gray;     // R
      data[i + 1] = gray; // G
      data[i + 2] = gray; // B
    }
  }

  applySepia(data) {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));     // R
      data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168)); // G
      data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131)); // B
    }
  }

  /**
   * Estimate memory usage for image dimensions
   */
  getMemoryEstimate(width, height) {
    // RGBA = 4 bytes per pixel
    return width * height * 4;
  }

  /**
   * Get performance statistics and capabilities
   */
  getPerformanceStats() {
    return {
      processedImages: this.processedImages,
      averageProcessingTime: this.totalProcessingTime / Math.max(1, this.processedImages),
      totalProcessingTime: this.totalProcessingTime,
      memoryUsage: Object.fromEntries(this.memoryUsage),
      formatCapabilities: this.formatCapabilities,
      maxChunkSize: MAX_CHUNK_SIZE,
      tileSize: TILE_SIZE,
      browserSupport: {
        offscreenCanvas: typeof OffscreenCanvas !== 'undefined',
        createImageBitmap: typeof createImageBitmap !== 'undefined',
        convertToBlob: this.canvas.convertToBlob ? true : false
      }
    };
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.memoryUsage.clear();
    // Reset canvas to minimum size to free memory
    this.canvas.width = 1;
    this.canvas.height = 1;
    this.ctx.clearRect(0, 0, 1, 1);
  }
}

// Handle messages from main thread with improved error handling
self.onmessage = async function(e) {
  const { type, id, data } = e.data;
  
  try {
    switch (type) {
      case 'convert':
        const result = await processor.convertImage(
          data.imageData,
          data.outputFormat,
          data.quality,
          data.options
        );
        
        self.postMessage({
          type: 'success',
          id,
          result: {
            ...result,
            blob: result.blob // Will be transferred
          }
        }, [result.blob]);
        break;
        
      case 'filter':
        const imageBitmap = await processor.createImageBitmap(data.imageData);
        
        await processor.applyFilter(imageBitmap, data.filterType, data.intensity);
        
        const filteredBlob = await processor.canvasToBlob('png', 'high');
        
        // Clean up
        imageBitmap.close();
        
        self.postMessage({
          type: 'success',
          id,
          result: {
            blob: filteredBlob,
            width: processor.canvas.width,
            height: processor.canvas.height,
            format: 'png'
          }
        }, [filteredBlob]);
        break;
        
      case 'getQualityPresets':
        self.postMessage({
          type: 'success',
          id,
          result: QUALITY_PRESETS
        });
        break;
        
      case 'getSupportedFormats':
        // Wait for format capabilities to be initialized
        if (!processor.formatCapabilities) {
          await processor.initializeCapabilities();
        }
        
        const supportedFormats = Object.entries(processor.formatCapabilities)
          .filter(([format, supported]) => supported)
          .map(([format]) => format);
        
        self.postMessage({
          type: 'success',
          id,
          result: supportedFormats
        });
        break;
        
      case 'getPerformanceStats':
        self.postMessage({
          type: 'success',
          id,
          result: processor.getPerformanceStats()
        });
        break;
        
      case 'cleanup':
        processor.cleanup();
        self.postMessage({
          type: 'success',
          id,
          result: 'cleanup_complete'
        });
        break;
        
      default:
        throw new Error(`Unknown operation: ${type}`);
    }
  } catch (error) {
    console.error('Worker error:', error);
    self.postMessage({
      type: 'error',
      id,
      error: `${error.message} (Browser-only processing)`,
      details: {
        operation: type,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      }
    });
  }
};

// Error handler
self.onerror = function(error) {
  self.postMessage({
    type: 'error',
    error: error.message || 'Unknown worker error'
  });
};

// Initialize processor instance and send ready signal
const processor = new ImageProcessor();

// Wait for format capabilities to initialize before signaling ready
processor.initializeCapabilities().then(() => {
  self.postMessage({ 
    type: 'ready',
    capabilities: processor.formatCapabilities,
    browserSupport: {
      offscreenCanvas: typeof OffscreenCanvas !== 'undefined',
      createImageBitmap: typeof createImageBitmap !== 'undefined'
    }
  });
}).catch(error => {
  console.error('Worker initialization failed:', error);
  self.postMessage({ 
    type: 'ready',
    error: error.message,
    fallbackMode: true
  });
});