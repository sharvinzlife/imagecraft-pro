/**
 * Modern Browser-Side Image Processor
 * Eliminates server dependencies and 100MB memory limits
 * Uses efficient Canvas API with progressive processing strategies
 */

class ModernImageProcessor {
  constructor() {
    this.supportedFormats = new Set(['jpeg', 'jpg', 'png', 'webp', 'avif', 'bmp', 'gif']);
    this.maxChunkSize = 50 * 1024 * 1024; // 50MB chunks for progressive processing
    this.qualitySettings = this.initializeQualitySettings();
    this.formatCapabilities = null;
    
    // Performance tracking
    this.stats = {
      totalProcessed: 0,
      averageProcessingTime: 0,
      memoryPeakUsage: 0
    };
    
    this.initializeCapabilities();
  }

  /**
   * Initialize quality settings for different formats
   */
  initializeQualitySettings() {
    return {
      high: {
        description: 'Maximum quality, larger file size',
        jpeg: 0.95,
        webp: 0.9,
        avif: 0.85,
        png: null, // PNG is lossless
      },
      medium: {
        description: 'Balanced quality and file size',
        jpeg: 0.8,
        webp: 0.75,
        avif: 0.65,
        png: null,
      },
      low: {
        description: 'Smaller file size, reasonable quality',
        jpeg: 0.6,
        webp: 0.5,
        avif: 0.4,
        png: null,
      }
    };
  }

  /**
   * Detect browser format support capabilities
   */
  async initializeCapabilities() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    this.formatCapabilities = {
      webp: await this.testFormatSupport(canvas, 'image/webp'),
      avif: await this.testFormatSupport(canvas, 'image/avif'),
      jpeg: true, // Always supported
      png: true,  // Always supported
      bmp: await this.testFormatSupport(canvas, 'image/bmp'),
      gif: true   // Always supported for input
    };

    console.log('Format capabilities detected:', this.formatCapabilities);
  }

  /**
   * Test if browser supports specific image format with comprehensive checks
   */
  async testFormatSupport(canvas, mimeType) {
    try {
      // First check if the MIME type is recognized
      if (!this.isMimeTypeSupported(mimeType)) {
        return false;
      }
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          // Check if blob was created, has size, and correct type
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
    // Additional checks for specific formats
    switch (mimeType) {
      case 'image/avif':
        // AVIF support requires modern Canvas API
        return typeof HTMLCanvasElement !== 'undefined' && 
               HTMLCanvasElement.prototype.toBlob;
      case 'image/webp':
        // WebP is widely supported
        return true;
      case 'image/jpeg':
      case 'image/png':
        // Always supported
        return true;
      case 'image/bmp':
        // BMP support varies
        return typeof HTMLCanvasElement !== 'undefined';
      default:
        return false;
    }
  }

  /**
   * Convert image with progressive processing for large files
   */
  async convertImage(file, outputFormat, quality = 'medium', options = {}) {
    const startTime = performance.now();
    
    try {
      // Validate input
      this.validateInput(file, outputFormat);
      
      // Report initial progress
      if (options.onProgress) {
        options.onProgress(5, 'Analyzing image...');
      }

      // Create image bitmap with optimal settings
      const imageBitmap = await this.createOptimizedImageBitmap(file);
      
      if (options.onProgress) {
        options.onProgress(20, 'Processing image...');
      }

      // Calculate optimal dimensions
      const dimensions = this.calculateOptimalDimensions(
        imageBitmap.width,
        imageBitmap.height,
        options
      );

      // Check if we need progressive processing
      const needsProgressive = this.shouldUseProgressiveProcessing(
        imageBitmap.width,
        imageBitmap.height,
        dimensions.width,
        dimensions.height
      );

      let result;
      if (needsProgressive) {
        result = await this.processImageProgressively(
          imageBitmap,
          dimensions,
          outputFormat,
          quality,
          options
        );
      } else {
        result = await this.processImageDirect(
          imageBitmap,
          dimensions,
          outputFormat,
          quality,
          options
        );
      }

      // Clean up
      imageBitmap.close();

      // Update statistics
      const processingTime = performance.now() - startTime;
      this.updateStats(processingTime, result.blob.size);

      if (options.onProgress) {
        options.onProgress(100, 'Conversion complete!');
      }

      return {
        ...result,
        originalSize: file.size,
        originalName: file.name,
        size: result.blob?.size || result.size || 0,
        compressionRatio: file.size > 0 && result.blob?.size > 0 ? result.blob.size / file.size : 1,
        processingTime
      };

    } catch (error) {
      console.error('Image conversion failed:', error);
      throw new Error(`Image conversion failed: ${error.message}`);
    }
  }

  /**
   * Validate input parameters
   */
  validateInput(file, outputFormat) {
    if (!file || !(file instanceof File || file instanceof Blob)) {
      throw new Error('Invalid file input');
    }

    if (!this.supportedFormats.has(outputFormat.toLowerCase())) {
      throw new Error(`Unsupported output format: ${outputFormat}`);
    }

    if (!this.formatCapabilities) {
      throw new Error('Format capabilities not initialized');
    }

    const formatKey = outputFormat.toLowerCase();
    if (!this.formatCapabilities[formatKey]) {
      throw new Error(`Browser does not support ${outputFormat} format`);
    }
  }

  /**
   * Create optimized image bitmap with proper settings
   */
  async createOptimizedImageBitmap(file) {
    const options = {
      colorSpaceConversion: 'default',
      imageOrientation: 'from-image',
      premultiplyAlpha: 'default',
      resizeQuality: 'high'
    };

    try {
      return await createImageBitmap(file, options);
    } catch (error) {
      // Fallback without options for older browsers
      return await createImageBitmap(file);
    }
  }

  /**
   * Calculate optimal dimensions with memory constraints
   */
  calculateOptimalDimensions(originalWidth, originalHeight, options = {}) {
    let { width, height, maxWidth, maxHeight, maintainAspectRatio = true } = options;
    
    const aspectRatio = originalWidth / originalHeight;
    
    // If no dimensions specified, use original but check memory constraints
    if (!width && !height && !maxWidth && !maxHeight) {
      const memoryUsage = this.estimateMemoryUsage(originalWidth, originalHeight);
      
      // If original would exceed safe memory limit, scale down
      if (memoryUsage > this.maxChunkSize) {
        const scaleFactor = Math.sqrt(this.maxChunkSize / memoryUsage);
        width = Math.floor(originalWidth * scaleFactor);
        height = Math.floor(originalHeight * scaleFactor);
      } else {
        width = originalWidth;
        height = originalHeight;
      }
    } else {
      // Apply constraints
      if (!width && !height) {
        width = originalWidth;
        height = originalHeight;
      } else if (!width) {
        width = maintainAspectRatio ? height * aspectRatio : originalWidth;
      } else if (!height) {
        height = maintainAspectRatio ? width / aspectRatio : originalHeight;
      }

      // Apply max constraints
      if (maxWidth && width > maxWidth) {
        width = maxWidth;
        if (maintainAspectRatio) {
          height = width / aspectRatio;
        }
      }

      if (maxHeight && height > maxHeight) {
        height = maxHeight;
        if (maintainAspectRatio) {
          width = height * aspectRatio;
        }
      }
    }

    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  /**
   * Determine if progressive processing is needed
   */
  shouldUseProgressiveProcessing(originalWidth, originalHeight, targetWidth, targetHeight) {
    const originalMemory = this.estimateMemoryUsage(originalWidth, originalHeight);
    const targetMemory = this.estimateMemoryUsage(targetWidth, targetHeight);
    
    return originalMemory > this.maxChunkSize || targetMemory > this.maxChunkSize;
  }

  /**
   * Process image directly for smaller images
   */
  async processImageDirect(imageBitmap, dimensions, outputFormat, quality, options) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', {
      willReadFrequently: false,
      alpha: !this.requiresBackground(outputFormat)
    });

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Configure context for high quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Apply background for formats that don't support transparency
    if (this.requiresBackground(outputFormat)) {
      ctx.fillStyle = options.backgroundColor || '#FFFFFF';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    }

    // Draw image
    ctx.drawImage(imageBitmap, 0, 0, dimensions.width, dimensions.height);

    if (options.onProgress) {
      options.onProgress(70, 'Converting to target format...');
    }

    // Convert to blob
    const blob = await this.canvasToBlob(canvas, outputFormat, quality);

    return {
      blob,
      width: dimensions.width,
      height: dimensions.height,
      format: outputFormat
    };
  }

  /**
   * Process large images progressively to avoid memory issues
   */
  async processImageProgressively(imageBitmap, dimensions, outputFormat, quality, options) {
    const tileSize = 2048; // Process in 2048x2048 tiles
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Configure context
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Apply background for formats that don't support transparency
    if (this.requiresBackground(outputFormat)) {
      ctx.fillStyle = options.backgroundColor || '#FFFFFF';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    }

    const scaleX = dimensions.width / imageBitmap.width;
    const scaleY = dimensions.height / imageBitmap.height;

    // Process in tiles
    const tilesX = Math.ceil(imageBitmap.width / tileSize);
    const tilesY = Math.ceil(imageBitmap.height / tileSize);
    const totalTiles = tilesX * tilesY;

    for (let tileY = 0; tileY < tilesY; tileY++) {
      for (let tileX = 0; tileX < tilesX; tileX++) {
        const currentTile = tileY * tilesX + tileX + 1;
        
        if (options.onProgress) {
          const progress = 20 + (currentTile / totalTiles) * 50;
          options.onProgress(progress, `Processing tile ${currentTile}/${totalTiles}...`);
        }

        // Source coordinates
        const sx = tileX * tileSize;
        const sy = tileY * tileSize;
        const sw = Math.min(tileSize, imageBitmap.width - sx);
        const sh = Math.min(tileSize, imageBitmap.height - sy);

        // Destination coordinates
        const dx = sx * scaleX;
        const dy = sy * scaleY;
        const dw = sw * scaleX;
        const dh = sh * scaleY;

        // Draw tile
        ctx.drawImage(imageBitmap, sx, sy, sw, sh, dx, dy, dw, dh);

        // Allow browser to breathe between tiles
        if (currentTile % 4 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    }

    if (options.onProgress) {
      options.onProgress(80, 'Converting to target format...');
    }

    // Convert to blob
    const blob = await this.canvasToBlob(canvas, outputFormat, quality);

    return {
      blob,
      width: dimensions.width,
      height: dimensions.height,
      format: outputFormat
    };
  }

  /**
   * Convert canvas to blob with better error handling and format validation
   */
  async canvasToBlob(canvas, format, quality) {
    const mimeType = this.getMimeType(format);
    const qualityValue = this.getQualityValue(format, quality);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size > 0) {
            // Check if we got the format we requested
            if (blob.type === mimeType) {
              // Perfect - got exactly what we wanted
              resolve(blob);
              return;
            }
            
            // Browser fell back to a different format
            console.warn(`Expected ${mimeType}, got ${blob.type}`);
            
            // For modern formats, browsers often fall back to PNG when not supported
            if (['avif', 'webp'].includes(format.toLowerCase()) && blob.type === 'image/png') {
              console.warn(`${format.toUpperCase()} not supported by browser, fell back to PNG`);
              resolve(blob);
              return;
            }
            
            // For other cases, this is an unexpected error
            reject(new Error(`Format conversion failed - browser returned ${blob.type} instead of ${mimeType}. This format may not be supported by your browser.`));
          } else {
            reject(new Error(`Failed to convert to ${format.toUpperCase()} format - no data generated. This format may not be supported by your browser.`));
          }
        },
        mimeType,
        qualityValue
      );
    });
  }

  /**
   * Apply image filters with memory efficiency
   */
  async applyFilter(file, filterType, intensity = 1, options = {}) {
    try {
      if (options.onProgress) {
        options.onProgress(10, 'Loading image for filtering...');
      }

      const imageBitmap = await this.createOptimizedImageBitmap(file);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = imageBitmap.width;
      canvas.height = imageBitmap.height;

      ctx.drawImage(imageBitmap, 0, 0);

      if (options.onProgress) {
        options.onProgress(50, `Applying ${filterType} filter...`);
      }

      // Apply filter
      this.applyCanvasFilter(ctx, canvas.width, canvas.height, filterType, intensity);

      if (options.onProgress) {
        options.onProgress(80, 'Converting filtered image...');
      }

      const blob = await this.canvasToBlob(canvas, 'png', 'high');

      imageBitmap.close();

      if (options.onProgress) {
        options.onProgress(100, 'Filter applied successfully!');
      }

      return {
        blob,
        width: canvas.width,
        height: canvas.height,
        format: 'png'
      };

    } catch (error) {
      throw new Error(`Filter application failed: ${error.message}`);
    }
  }

  /**
   * Apply filter to canvas image data
   */
  applyCanvasFilter(ctx, width, height, filterType, intensity) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

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
        // Use CSS filter for blur as it's more efficient
        ctx.filter = `blur(${intensity}px)`;
        ctx.drawImage(ctx.canvas, 0, 0);
        ctx.filter = 'none';
        return; // Skip putImageData
      default:
        throw new Error(`Unknown filter type: ${filterType}`);
    }

    ctx.putImageData(imageData, 0, 0);
  }

  // Filter implementations
  adjustBrightness(data, factor) {
    const adjustment = (factor - 1) * 255;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, data[i] + adjustment));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + adjustment));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + adjustment));
    }
  }

  adjustContrast(data, factor) {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, (data[i] - 128) * factor + 128));
      data[i + 1] = Math.max(0, Math.min(255, (data[i + 1] - 128) * factor + 128));
      data[i + 2] = Math.max(0, Math.min(255, (data[i + 2] - 128) * factor + 128));
    }
  }

  adjustSaturation(data, factor) {
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
      data[i] = Math.max(0, Math.min(255, gray + factor * (data[i] - gray)));
      data[i + 1] = Math.max(0, Math.min(255, gray + factor * (data[i + 1] - gray)));
      data[i + 2] = Math.max(0, Math.min(255, gray + factor * (data[i + 2] - gray)));
    }
  }

  convertToGrayscale(data) {
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
  }

  applySepia(data) {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
      data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
      data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
    }
  }

  /**
   * Batch convert multiple images with progress tracking
   */
  async batchConvert(files, outputFormat, quality = 'medium', options = {}) {
    const results = [];
    const errors = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        if (options.onBatchProgress) {
          options.onBatchProgress(i, files.length, `Converting ${file.name}...`);
        }
        
        const result = await this.convertImage(file, outputFormat, quality, {
          ...options,
          onProgress: (progress, message) => {
            if (options.onProgress) {
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
   * Get supported formats based on browser capabilities
   */
  getSupportedFormats() {
    if (!this.formatCapabilities) {
      return ['jpeg', 'png']; // Safe fallback
    }

    return Object.entries(this.formatCapabilities)
      .filter(([format, supported]) => supported)
      .map(([format]) => format);
  }

  /**
   * Get quality presets
   */
  getQualityPresets() {
    return this.qualitySettings;
  }

  /**
   * Estimate memory usage for image dimensions
   */
  estimateMemoryUsage(width, height) {
    // RGBA = 4 bytes per pixel + overhead
    return width * height * 4 * 1.2;
  }

  /**
   * Check if format requires background (no transparency)
   */
  requiresBackground(format) {
    return ['jpeg', 'jpg', 'bmp'].includes(format.toLowerCase());
  }

  /**
   * Get MIME type for format
   */
  getMimeType(format) {
    const mimeTypes = {
      jpeg: 'image/jpeg',
      jpg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      avif: 'image/avif',
      bmp: 'image/bmp',
      gif: 'image/gif'
    };
    
    return mimeTypes[format.toLowerCase()] || 'image/png';
  }

  /**
   * Get quality value for format and quality preset
   */
  getQualityValue(format, quality) {
    const preset = this.qualitySettings[quality] || this.qualitySettings.medium;
    return preset[format.toLowerCase()] || 0.8;
  }

  /**
   * Update performance statistics
   */
  updateStats(processingTime, outputSize) {
    this.stats.totalProcessed++;
    this.stats.averageProcessingTime = 
      (this.stats.averageProcessingTime * (this.stats.totalProcessed - 1) + processingTime) / 
      this.stats.totalProcessed;
    
    if (outputSize > this.stats.memoryPeakUsage) {
      this.stats.memoryPeakUsage = outputSize;
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    return {
      ...this.stats,
      formatCapabilities: this.formatCapabilities,
      maxChunkSize: this.maxChunkSize
    };
  }

  /**
   * Estimate output file size
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
      gif: 0.8
    };
    
    const qualityMultiplier = qualityMultipliers[quality] || qualityMultipliers.medium;
    const formatMultiplier = formatMultipliers[outputFormat.toLowerCase()] || 1;
    
    return Math.round(inputSize * formatMultiplier * qualityMultiplier);
  }
}

// Create singleton instance
let modernProcessor = null;

export const getModernImageProcessor = () => {
  if (!modernProcessor) {
    modernProcessor = new ModernImageProcessor();
  }
  return modernProcessor;
};

export const destroyModernImageProcessor = () => {
  if (modernProcessor) {
    modernProcessor = null;
  }
};

export default ModernImageProcessor;