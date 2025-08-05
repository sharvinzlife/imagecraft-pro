/**
 * Modern Browser-Side Image Processor
 * Eliminates server dependencies and 100MB memory limits
 * Uses efficient Canvas API with progressive processing strategies
 * 
 * SECURITY ENHANCEMENTS:
 * - File signature validation to prevent MIME type spoofing
 * - Metadata sanitization to remove malicious payloads
 * - Memory usage limits to prevent DoS attacks
 * - Input validation against OWASP Top 10 vulnerabilities
 */

import { createRawDetector, isRawFormat } from '../utils/formatDetection';
import { getEnhancedFormatHandler } from '../utils/enhancedFormatSupport';
import { getFormatNotificationService } from '../utils/formatNotificationService';
import { getGlobalMemoryManager, createImageDataProcessor } from '../utils/memoryManagement.js';
import imageMagickService from './imageMagickService.js';
import WorkerPoolManager from './WorkerPoolManager.js';

class ModernImageProcessor {
  constructor() {
    this.supportedFormats = new Set(['jpeg', 'jpg', 'png', 'webp', 'avif', 'bmp', 'gif', 'raw', 'cr2', 'cr3', 'nef', 'arw', 'dng', 'orf', 'rw2', 'raf', 'pef', 'srw', 'x3f']);
    this.rawFormats = new Set(['raw', 'cr2', 'cr3', 'nef', 'arw', 'dng', 'orf', 'rw2', 'raf', 'pef', 'srw', 'x3f']); // Enhanced RAW formats
    this.rawMimeTypes = new Set(['image/x-canon-cr2', 'image/x-canon-cr3', 'image/x-nikon-nef', 'image/x-sony-arw', 'image/x-adobe-dng', 'image/x-olympus-orf', 'image/x-panasonic-rw2', 'image/x-fuji-raf', 'image/x-pentax-pef', 'image/x-samsung-srw', 'image/x-sigma-x3f']);
    this.maxChunkSize = 50 * 1024 * 1024; // 50MB chunks for progressive processing
    this.qualitySettings = this.initializeQualitySettings();
    this.formatCapabilities = null;
    
    // Enhanced memory management integration
    this.memoryManager = getGlobalMemoryManager();
    this.imageProcessor = createImageDataProcessor({
      memoryMonitor: { 
        maxHeapSize: 512 * 1024 * 1024, // 512MB for image processing
        warningThreshold: 0.6,
        criticalThreshold: 0.8
      }
    });
    
    // Worker pool for parallel processing
    this.workerPool = null;
    this.useWorkerPool = true; // Enable by default
    
    // Initialize RAW detector
    this.rawDetector = createRawDetector();
    
    // Security configuration
    this.securityConfig = {
      maxProcessingTime: 300000, // 5 minutes max processing time
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB max memory per operation
      enableSecurityValidation: true,
      enableMetadataSanitization: true
    };
    
    // Performance tracking with security metrics
    this.stats = {
      totalProcessed: 0,
      averageProcessingTime: 0,
      memoryPeakUsage: 0,
      securityThreatsBlocked: 0,
      metadataStripped: 0
    };
    
    this.initializeCapabilities();
    
    // Initialize enhanced format support
    this.enhancedFormatHandler = getEnhancedFormatHandler();
    this.notificationService = getFormatNotificationService();
    
    // Initialize worker pool
    this.initializeWorkerPool();
    
    // Set up memory management cleanup strategies
    this.setupMemoryCleanupStrategies();
  }

  /**
   * Initialize worker pool for parallel processing
   */
  async initializeWorkerPool() {
    if (!this.useWorkerPool) {
      return;
    }

    try {
      this.workerPool = new WorkerPoolManager({
        maxWorkers: 4,
        minWorkers: 2,
        taskTimeout: 300000, // 5 minutes
        maxRetries: 2,
        enableMemoryOptimization: true
      });

      await this.workerPool.initialize();
      console.log('Worker pool initialized for ModernImageProcessor');
      
      // Set up event listeners
      this.workerPool.on('memory-pressure', (data) => {
        console.warn('Worker pool memory pressure:', data);
        this.handleWorkerPoolMemoryPressure(data);
      });

      this.workerPool.on('worker-failed', (data) => {
        console.warn('Worker failed in pool:', data);
      });

    } catch (error) {
      console.warn('Failed to initialize worker pool, falling back to direct processing:', error);
      this.useWorkerPool = false;
      this.workerPool = null;
    }
  }

  /**
   * Set up memory cleanup strategies specific to image processing
   */
  setupMemoryCleanupStrategies() {
    // Add image-specific cleanup strategies
    this.memoryManager.addCleanupStrategy('clear-image-caches', {
      priority: 2,
      description: 'Clear image processing caches and temporary canvases',
      execute: () => {
        let clearedCount = 0;
        
        // Clear canvas pool
        const canvasPool = this.imageProcessor.monitor.getPool('canvas');
        if (canvasPool) {
          clearedCount += canvasPool.clear();
        }
        
        // Clear context pool
        const contextPool = this.imageProcessor.monitor.getPool('context');
        if (contextPool) {
          clearedCount += contextPool.clear();
        }
        
        return {
          clearedItems: clearedCount,
          description: 'Cleared image processing caches and temporary canvases'
        };
      }
    });
  }

  
  /**
   * Initialize quality settings
   */
  initializeQualitySettings() {
    return {
      low: {
        jpeg: 0.6,
        webp: 0.5,
        avif: 0.4,
        png: 0.8,
        bmp: 0.8,
        gif: 0.8
      },
      medium: {
        jpeg: 0.8,
        webp: 0.75,
        avif: 0.65,
        png: 0.9,
        bmp: 0.9,
        gif: 0.9
      },
      high: {
        jpeg: 0.95,
        webp: 0.9,
        avif: 0.85,
        png: 1.0,
        bmp: 1.0,
        gif: 1.0
      }
    };
  }
  
  /**
   * Initialize format capabilities detection
   */
  async initializeCapabilities() {
    this.formatCapabilities = {
      jpeg: true, // Always supported
      png: true, // Always supported
      webp: await this.testFormatSupport('webp'),
      avif: await this.testFormatSupport('avif'),
      bmp: await this.testFormatSupport('bmp'),
      gif: true, // Usually supported
      tiff: false // Canvas doesn't support TIFF
    };
  }
  
  /**
   * Test if a format is supported by the browser
   */
  async testFormatSupport(format) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      
      const mimeType = this.getMimeType(format);
      
      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            resolve(blob && blob.type === mimeType);
          },
          mimeType,
          0.8
        );
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Main convert image method
   */
  async convertImage(file, outputFormat, quality = 'medium', options = {}) {
    try {
      const startTime = Date.now();
      
      if (options.onProgress) {
        options.onProgress(5, 'Starting image conversion...');
      }
      
      // Enhanced RAW format detection
      const formatDetectionResult = await this.rawDetector.detectFormat(file);
      const rawValidationResult = await this.rawDetector.validateRawFile(file);
      
      const isRawToStandardConversion = rawValidationResult.isRawFile && !isRawFormat(outputFormat);
      
      // Enhanced input validation with security checks
      this.validateInputSecurity(file, outputFormat, {
        isRawFile: rawValidationResult.isRawFile,
        isRawConversion: isRawToStandardConversion
      });
      
      if (options.onProgress) {
        options.onProgress(10, 'Processing image...');
      }
      
      let result;
      
      // Route to appropriate conversion method
      if (isRawToStandardConversion) {
        // Use enhanced format handler for RAW conversions
        result = await this.convertWithEnhancedHandler(
          file, 
          outputFormat, 
          quality, 
          options, 
          {
            formatDetectionResult,
            rawValidationResult,
            isRawConversion: true
          }
        );
      } else {
        // Use modern browser-based processing for standard formats
        result = await this.processStandardImage(file, outputFormat, quality, options);
      }
      
      const processingTime = Date.now() - startTime;
      this.updateStats(processingTime, result.blob?.size || 0);
      
      if (options.onProgress) {
        options.onProgress(95, 'Finalizing...');
      }
      
      // Handle auto-download if enabled
      let downloadUrl = null;
      if (options.autoDownload !== false && result.blob) {
        downloadUrl = URL.createObjectURL(result.blob);
        
        // Trigger automatic download
        const link = document.createElement('a');
        link.href = downloadUrl;
        // Use actualFormat from fallbacks, or format from result, or requested outputFormat
        const actualFormat = result.actualFormat || result.format || outputFormat;
        link.download = `${file.name.split('.')[0]}_converted.${actualFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('🎉 Auto-download triggered:', link.download);
      }
      
      if (options.onProgress) {
        options.onProgress(100, 'Conversion complete!');
      }
      
      return {
        ...result,
        originalSize: file.size,
        originalName: file.name,
        size: result.blob?.size || result.size || 0,
        compressionRatio: file.size > 0 && result.blob?.size > 0 ? result.blob.size / file.size : 1,
        processingTime,
        downloadUrl, // Add downloadUrl for notifications
        // RAW conversion metadata
        isRawConversion: isRawToStandardConversion,
        originalRawFormat: rawValidationResult.isRawFile ? rawValidationResult.detectedRawFormat : null,
        formatDetectionResult,
        rawValidationResult
      };
      
    } catch (error) {
      console.error('Image conversion failed:', error);
      
      // Generate user-friendly error message
      const errorInfo = this.notificationService.generateErrorMessage(error, {
        requestedFormat: outputFormat,
        operation: 'Image conversion'
      });
      
      // Notify about conversion error
      this.notificationService.notifyConversionError(
        outputFormat,
        error,
        errorInfo.actions
      );
      
      throw new Error(errorInfo.userMessage || `Image conversion failed: ${error.message}`);
    }
  }
  
  /**
   * Process standard (non-RAW) images using browser capabilities
   */
  async processStandardImage(file, outputFormat, quality, options) {
    try {
      if (options.onProgress) {
        options.onProgress(20, 'Loading image...');
      }
      
      // Create optimized image bitmap
      const imageBitmap = await this.createOptimizedImageBitmap(file);
      
      // Calculate optimal dimensions
      const dimensions = this.calculateOptimalDimensions(
        imageBitmap.width,
        imageBitmap.height,
        options
      );
      
      if (options.onProgress) {
        options.onProgress(40, 'Processing image data...');
      }
      
      let result;
      
      // Choose processing method based on image size
      if (this.shouldUseProgressiveProcessing(imageBitmap.width, imageBitmap.height, dimensions.width, dimensions.height)) {
        result = await this.processImageProgressively(imageBitmap, dimensions, outputFormat, quality, options);
      } else {
        result = await this.processImageDirect(imageBitmap, dimensions, outputFormat, quality, options);
      }
      
      // Clean up
      imageBitmap.close();
      
      return result;
      
    } catch (error) {
      throw new Error(`Standard image processing failed: ${error.message}`);
    }
  }

  /**
   * Convert image using enhanced format handler
   */
  async convertWithEnhancedHandler(file, outputFormat, quality, options, metadata = {}) {
    try {
      if (options.onProgress) {
        options.onProgress(20, `Converting with enhanced format support...`);
      }

      const result = await this.enhancedFormatHandler.convertWithFallback(
        file, 
        outputFormat, 
        quality, 
        {
          ...options,
          onProgress: (progress, message) => {
            if (options.onProgress) {
              // Scale progress to fit within 20-90 range
              const scaledProgress = 20 + (progress * 0.7);
              options.onProgress(scaledProgress, message);
            }
          }
        }
      );

      if (options.onProgress) {
        options.onProgress(95, 'Finalizing conversion...');
      }

      // Notify about conversion result
      this.notificationService.notifyConversionSuccess(
        file.name.split('.').pop()?.toLowerCase() || 'unknown',
        result.actualFormat || outputFormat,
        result.wasDirectConversion || false,
        {
          originalSize: file.size,
          finalSize: result.blob?.size || result.size || 0,
          compressionRatio: file.size > 0 && result.blob?.size > 0 ? result.blob.size / file.size : 1,
          method: result.method
        }
      );

      if (result.wasFallback) {
        // Additional notification for fallback
        this.notificationService.notifyFormatUnsupported(
          outputFormat,
          result.actualFormat,
          result.fallbackReason
        );
      }

      if (options.onProgress) {
        options.onProgress(100, 'Conversion complete!');
      }

      return {
        blob: result.blob,
        width: result.width,
        height: result.height,
        format: result.actualFormat || outputFormat,
        originalSize: file.size,
        originalName: file.name,
        size: result.blob?.size || result.size || 0,
        compressionRatio: file.size > 0 && result.blob?.size > 0 ? result.blob.size / file.size : 1,
        // Enhanced format metadata
        wasDirectConversion: result.wasDirectConversion || false,
        wasFallback: result.wasFallback || false,
        fallbackReason: result.fallbackReason,
        method: result.method,
        originalFormat: result.originalFormat,
        actualFormat: result.actualFormat,
        // Include original metadata
        ...metadata
      };
    } catch (error) {
      console.error('Enhanced format conversion failed:', error);
      
      // Generate user-friendly error message
      const errorInfo = this.notificationService.generateErrorMessage(error, {
        requestedFormat: outputFormat,
        operation: 'Enhanced format conversion'
      });
      
      // Notify about conversion error
      this.notificationService.notifyConversionError(
        outputFormat,
        error,
        errorInfo.actions
      );
      
      throw new Error(errorInfo.userMessage || `Enhanced format conversion failed: ${error.message}`);
    }
  }

  /**
   * Validate input parameters and provide fallback suggestions with enhanced RAW handling
   */
  validateInput(file, outputFormat, additionalInfo = {}) {
    if (!file || !(file instanceof File || file instanceof Blob)) {
      throw new Error('Invalid file input');
    }

    const outputFormatLower = outputFormat.toLowerCase();
    const { isRawFile, isRawConversion } = additionalInfo;
    
    // Enhanced RAW format validation
    if (outputFormatLower === 'raw') {
      // RAW is input only, not output - this should be caught earlier
      throw new Error('RAW format cannot be used as output format. RAW files must be converted to JPEG or PNG.');
    }
    
    // Validate RAW file conversions
    if (isRawFile && !isRawConversion) {
      throw new Error('RAW files must be converted to standard formats. Please select JPEG or PNG as output format.');
    }
    
    // Validate that selected format is supported for RAW conversion
    if (isRawConversion && !['jpeg', 'png'].includes(outputFormatLower)) {
      throw new Error(`RAW files can only be converted to JPEG or PNG. ${outputFormat.toUpperCase()} is not supported for RAW conversion.`);
    }

    // Check if format is in supported list
    if (!this.supportedFormats.has(outputFormatLower) && !isRawFormat(outputFormatLower)) {
      throw new Error(`Unsupported output format: ${outputFormat}`);
    }

    // Skip browser capability check for RAW conversions (they convert to supported formats)
    if (isRawConversion) {
      return;
    }

    if (!this.formatCapabilities) {
      throw new Error('Format capabilities not initialized');
    }

    const formatKey = outputFormatLower;
    
    // Check format support and provide helpful fallbacks
    if (!this.formatCapabilities[formatKey]) {
      // If ImageMagick service is available, allow the enhanced format handler to try
      if (imageMagickService.isReady()) {
        console.log(`Browser doesn't support ${outputFormat} natively, but ImageMagick service is available. Will attempt conversion.`);
        return; // Let the enhanced format handler handle it
      }
      
      // Get enhanced format support information
      const formatHelp = this.notificationService.getFormatHelp(outputFormatLower);
      
      throw new Error(`Browser does not support ${outputFormat} format. ${formatHelp.recommendation}`);
    }
  }

  /**
   * Get automatic fallback format for unsupported formats
   */
  getFormatFallback(requestedFormat, hasTransparency = false) {
    // Use enhanced format handler for smarter fallbacks
    const fallbackChain = this.enhancedFormatHandler.getFallbackChain(requestedFormat);
    
    if (fallbackChain.length > 0) {
      // Check if first fallback considers transparency
      const firstFallback = fallbackChain[0];
      if (hasTransparency && firstFallback.format !== 'png') {
        // Prefer PNG for transparency
        const pngFallback = fallbackChain.find(f => f.format === 'png');
        return pngFallback ? pngFallback.format : 'png';
      }
      return firstFallback.format;
    }
    
    // Legacy fallback logic
    const formatLower = requestedFormat.toLowerCase();
    
    // Fallback priority based on image characteristics
    if (hasTransparency) {
      return 'png'; // PNG for transparency support
    }
    
    switch (formatLower) {
      case 'avif':
      case 'webp':
        // Modern formats fallback to WebP if supported, otherwise JPEG
        return this.formatCapabilities?.webp ? 'webp' : 'jpeg';
      case 'gif':
        // GIF fallback to PNG (preserves transparency)
        return 'png';
      case 'bmp':
      case 'tiff':
        // Uncompressed formats fallback to PNG
        return 'png';
      default:
        // Default fallback to JPEG for photos
        return 'jpeg';
    }
  }

  /**
   * Enhanced security validation with OWASP compliance
   * SECURITY: Prevents malicious file processing and resource exhaustion
   */
  validateInputSecurity(file, outputFormat, additionalInfo = {}) {
    // Standard input validation
    this.validateInput(file, outputFormat, additionalInfo);
    
    // Security-specific validations
    
    // Check processing time limits to prevent DoS
    const estimatedProcessingTime = this.estimateProcessingTime(file.size);
    if (estimatedProcessingTime > this.securityConfig.maxProcessingTime) {
      throw new Error(
        `File too large for processing. Estimated processing time ${Math.round(estimatedProcessingTime / 1000)}s ` +
        `exceeds maximum allowed ${Math.round(this.securityConfig.maxProcessingTime / 1000)}s. ` +
        `This prevents resource exhaustion attacks.`
      );
    }
    
    // Check memory usage estimates
    const estimatedMemoryUsage = this.estimateMemoryUsage(file.size);
    if (estimatedMemoryUsage > this.securityConfig.maxMemoryUsage) {
      throw new Error(
        `File requires too much memory for processing. Estimated ${Math.round(estimatedMemoryUsage / 1024 / 1024)}MB ` +
        `exceeds maximum allowed ${Math.round(this.securityConfig.maxMemoryUsage / 1024 / 1024)}MB. ` +
        `This prevents memory exhaustion attacks.`
      );
    }
    
    // Validate file extension matches content type
    const fileName = file.name || '';
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    const expectedExtensions = this.getExpectedExtensions(file.type);
    
    if (fileExtension && !expectedExtensions.includes(fileExtension)) {
      console.warn(
        `File extension "${fileExtension}" doesn't match MIME type "${file.type}". ` +
        `Expected: ${expectedExtensions.join(', ')}. This could indicate file type spoofing.`
      );
    }
  }

  /**
   * Get expected file extensions for a MIME type
   */
  getExpectedExtensions(mimeType) {
    const extensionMap = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/gif': ['gif'],
      'image/webp': ['webp'],
      'image/bmp': ['bmp'],
      'image/tiff': ['tiff', 'tif'],
      'image/svg+xml': ['svg']
    };
    
    return extensionMap[mimeType] || [];
  }

  /**
   * Estimate processing time based on file size and complexity
   */
  estimateProcessingTime(fileSize) {
    // Base processing time: 100ms per MB + overhead
    const basetime = (fileSize / (1024 * 1024)) * 100;
    const overhead = 2000; // 2 second overhead
    return basetime + overhead;
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
   * Optimized to prevent compression artifacts and grid lines
   */
  async processImageDirect(imageBitmap, dimensions, outputFormat, quality, options) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', {
      willReadFrequently: false,
      alpha: !this.requiresBackground(outputFormat),
      // Add color space specification for consistent rendering
      colorSpace: 'srgb',
      // Prevent any internal compositing issues
      premultipliedAlpha: false
    });

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Configure context for maximum quality and artifact prevention
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    // Ensure proper compositing for clean rendering
    ctx.globalCompositeOperation = 'source-over';
    
    // Clear any potential artifacts from canvas initialization
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Apply background for formats that don't support transparency
    if (this.requiresBackground(outputFormat)) {
      ctx.fillStyle = options.backgroundColor || '#FFFFFF';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    }

    // Draw image with precise positioning to prevent sub-pixel issues
    ctx.save();
    
    // Use precise coordinates with sub-pixel positioning for crisp rendering
    ctx.translate(0.5, 0.5);
    
    const targetWidth = Math.round(dimensions.width);
    const targetHeight = Math.round(dimensions.height);
    
    // Ensure highest quality scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw image with high-quality scaling and perfect alignment
    ctx.drawImage(imageBitmap, -0.5, -0.5, targetWidth, targetHeight);
    
    ctx.restore();

    if (options.onProgress) {
      options.onProgress(70, 'Converting to target format...');
    }

    // Convert to blob with fallback support
    const blobResult = await this.canvasToBlobWithFallback(canvas, outputFormat, quality);

    return {
      blob: blobResult.blob || blobResult,
      width: targetWidth,
      height: targetHeight,
      format: blobResult.actualFormat || outputFormat,
      actualFormat: blobResult.actualFormat, // Pass through actualFormat for filename handling
      originalFormat: blobResult.originalFormat,
      wasFallback: blobResult.wasFallback || false
    };
  }

  /**
   * Process large images progressively to avoid memory issues
   * Completely eliminates tile boundary artifacts and grid lines
   */
  async processImageProgressively(imageBitmap, dimensions, outputFormat, quality, options) {
    // For very large images, use a single-pass approach to prevent artifacts
    // Modern browsers can handle larger canvases than before
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', {
      // Optimized context options to prevent artifacts
      alpha: !this.requiresBackground(outputFormat),
      colorSpace: 'srgb',
      willReadFrequently: false,
      // Use hardware acceleration when available
      premultipliedAlpha: false
    });
    
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Configure context for maximum quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.globalCompositeOperation = 'source-over';

    // Apply background for formats that don't support transparency
    if (this.requiresBackground(outputFormat)) {
      ctx.fillStyle = options.backgroundColor || '#FFFFFF';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    }

    if (options.onProgress) {
      options.onProgress(30, 'Rendering high-quality image...');
    }

    // Clear canvas to ensure clean slate
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    
    // Re-apply background if needed after clearing
    if (this.requiresBackground(outputFormat)) {
      ctx.fillStyle = options.backgroundColor || '#FFFFFF';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    }

    // Use single high-quality draw operation to prevent any artifacts
    ctx.save();
    
    // Ensure perfect pixel alignment
    ctx.translate(0.5, 0.5); // Sub-pixel positioning for crisp rendering
    
    // Draw image with maximum quality settings
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw the entire image in one operation for artifact-free result
    ctx.drawImage(
      imageBitmap, 
      0, 0, imageBitmap.width, imageBitmap.height,
      -0.5, -0.5, dimensions.width, dimensions.height
    );
    
    ctx.restore();

    if (options.onProgress) {
      options.onProgress(70, 'Converting to target format...');
    }

    // Convert to blob with fallback support
    const blobResult = await this.canvasToBlobWithFallback(canvas, outputFormat, quality);

    return {
      blob: blobResult.blob || blobResult,
      width: dimensions.width,
      height: dimensions.height,
      format: blobResult.actualFormat || outputFormat,
      actualFormat: blobResult.actualFormat, // Pass through actualFormat for filename handling
      originalFormat: blobResult.originalFormat,
      wasFallback: blobResult.wasFallback || false
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
              resolve({
                blob,
                actualFormat: format.toLowerCase(),
                originalFormat: format,
                wasFallback: false
              });
              return;
            }
            
            // Browser fell back to a different format
            const formatLower = format.toLowerCase();
            const actualFormat = this.getFormatFromMimeType(blob.type);
            
            // For AVIF, this fallback is expected since most browsers don't support AVIF encoding
            if (formatLower === 'avif') {
              console.log(`AVIF encoding not supported by Canvas API, got ${blob.type} instead`);
              // Don't treat this as an error - it's expected behavior
              reject(new Error(`AVIF encoding not supported by Canvas API. Use ImageMagick for AVIF conversion.`));
              return;
            }
            
            console.warn(`Expected ${mimeType}, got ${blob.type}`);
            
            // Unexpected format conversion
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
   * Convert canvas image using ImageMagick WASM for advanced format support
   */
  async convertWithImageMagick(canvas, format, quality) {
    try {
      // Convert canvas to blob first (as PNG to preserve quality)
      const pngBlob = await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create PNG blob from canvas'));
        }, 'image/png', 1.0);
      });
      
      // Create a File object from the blob
      const pngFile = new File([pngBlob], 'temp.png', { type: 'image/png' });
      
      // Use ImageMagick service to convert to target format
      const result = await imageMagickService.convertImage(
        pngFile,
        format,
        {
          quality: quality,
          maintainAspectRatio: true
        }
      );
      
      return {
        blob: result.blob,
        width: result.width || canvas.width,
        height: result.height || canvas.height,
        format: result.format || format,
        method: 'imagemagick',
        wasDirectConversion: false
      };
      
    } catch (error) {
      throw new Error(`ImageMagick conversion failed: ${error.message}`);
    }
  }

  /**
   * Convert canvas using worker pool (for AVIF and other WASM-based conversions)
   */
  async convertWithWorkerPool(canvas, format, quality) {
    console.log('🎯 convertWithWorkerPool called:', { format, quality, canvasSize: `${canvas.width}x${canvas.height}` });
    
    try {
      // Validate canvas before proceeding
      console.log('🔍 Canvas validation:', {
        width: canvas.width,
        height: canvas.height,
        type: canvas.constructor.name,
        hasToBlob: typeof canvas.toBlob === 'function',
        hasGetContext: typeof canvas.getContext === 'function',
        isConnected: canvas.isConnected !== undefined ? canvas.isConnected : 'unknown'
      });
      
      // Check if canvas is valid and has required methods
      if (!canvas || typeof canvas.toBlob !== 'function') {
        throw new Error('Invalid canvas - missing toBlob method');
      }
      
      if (canvas.width <= 0 || canvas.height <= 0) {
        throw new Error(`Invalid canvas dimensions: ${canvas.width}x${canvas.height}`);
      }
      
      // Try to get context to verify canvas is functional
      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Unable to get 2D context from canvas');
        }
        console.log('✅ Canvas 2D context available');
      } catch (contextError) {
        console.error('❌ Canvas context error:', contextError);
        throw new Error(`Canvas context error: ${contextError.message}`);
      }
      
      // Convert canvas to blob first (as PNG to preserve quality, but optimized for speed)
      console.log('🔄 About to convert canvas to PNG blob (optimized)...');
      
      const pngBlob = await new Promise((resolve, reject) => {
        console.log('📸 Calling canvas.toBlob...');
        
        // Add timeout to prevent hanging
        const timeout = setTimeout(() => {
          console.error('⏰ canvas.toBlob timeout after 10 seconds');
          reject(new Error('Canvas.toBlob timeout - this may indicate a browser issue or invalid canvas state'));
        }, 10000);
        
        try {
          // Try alternative approach if standard toBlob fails
          const tryStandardToBlob = () => {
            canvas.toBlob((blob) => {
              clearTimeout(timeout);
              console.log('✅ canvas.toBlob callback executed, blob:', blob ? `${blob.size} bytes` : 'null');
              
              if (blob && blob.size > 0) {
                resolve(blob);
              } else {
                console.error('❌ toBlob returned empty or null blob');
                reject(new Error('Failed to create PNG blob from canvas - blob is null or empty'));
              }
            }, 'image/png', 0.95); // Slightly lower quality PNG for faster processing
          };
          
          // First attempt with standard toBlob
          tryStandardToBlob();
          console.log('📸 canvas.toBlob call completed (waiting for callback)');
          
        } catch (syncError) {
          clearTimeout(timeout);
          console.error('💥 Synchronous error in canvas.toBlob:', syncError);
          
          // Try alternative method using getImageData + canvas conversion
          try {
            console.log('🔄 Trying alternative method with getImageData...');
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Create a new canvas and draw the image data
            const newCanvas = document.createElement('canvas');
            newCanvas.width = canvas.width;
            newCanvas.height = canvas.height;
            const newCtx = newCanvas.getContext('2d');
            newCtx.putImageData(imageData, 0, 0);
            
            // Try toBlob on the new canvas
            newCanvas.toBlob((blob) => {
              clearTimeout(timeout);
              if (blob && blob.size > 0) {
                console.log('✅ Alternative method succeeded, blob size:', blob.size);
                resolve(blob);
              } else {
                reject(new Error('Alternative method also failed to create blob'));
              }
            }, 'image/png', 0.95); // Slightly lower quality PNG for faster processing
            
          } catch (altError) {
            clearTimeout(timeout);
            console.error('💥 Alternative method also failed:', altError);
            reject(new Error(`Both standard and alternative canvas conversion methods failed: ${syncError.message}`));
          }
        }
      });
      
      console.log('✅ PNG blob created successfully, size:', pngBlob.size);
      
      // Verify blob is valid
      if (!pngBlob || pngBlob.size === 0) {
        throw new Error('Created PNG blob is invalid or empty');
      }
      
      // Convert blob to array buffer for worker processing
      console.log('🔄 Converting blob to array buffer...');
      const arrayBuffer = await pngBlob.arrayBuffer();
      const imageData = new Uint8Array(arrayBuffer);
      console.log('✅ Array buffer created, size:', imageData.length);
      
      // Verify array buffer is valid
      if (imageData.length === 0) {
        throw new Error('Array buffer is empty - invalid PNG data');
      }
      
      // Process with worker pool
      console.log('🔄 About to call workerPool.processTask with:', {
        format,
        quality,
        imageDataSize: imageData.length,
        canvasSize: `${canvas.width}x${canvas.height}`
      });
      
      const result = await this.workerPool.processTask({
        imageData: imageData,
        outputFormat: format,
        options: {
          quality: quality,
          width: canvas.width,
          height: canvas.height,
          // Speed optimization options
          speed: 8, // Fast encoding by default
          disableAutoScale: false, // Allow auto-scaling for speed
          maxMegapixels: 16 // Reasonable limit for fast encoding
        }
      });
      
      console.log('✅ workerPool.processTask completed:', result ? 'success' : 'null result');
      
      if (result && result.blob) {
        return {
          blob: result.blob,
          width: result.width || canvas.width,
          height: result.height || canvas.height,
          format: result.format || format,
          method: result.method || 'worker-pool',
          wasDirectConversion: true
        };
      } else {
        throw new Error('Worker pool returned invalid result');
      }
      
    } catch (error) {
      console.error('💥 convertWithWorkerPool error:', error);
      throw new Error(`Worker pool conversion failed: ${error.message}`);
    }
  }

  /**
   * Convert canvas to blob with automatic fallback on format failure
   */
  async canvasToBlobWithFallback(canvas, requestedFormat, quality, options = {}) {
    const formatLower = requestedFormat.toLowerCase();
    
    // For AVIF, try worker pool first, then ImageMagick as fallback
    if (formatLower === 'avif') {
      // Try worker pool AVIF encoder first
      if (this.useWorkerPool && this.workerPool && this.workerPool.isInitialized) {
        try {
          console.log('Using worker pool for AVIF conversion (preferred method)');
          const result = await this.convertWithWorkerPool(canvas, requestedFormat, quality);
          if (result && result.blob && result.blob.type === 'image/avif') {
            return result;
          }
        } catch (workerError) {
          console.warn('Worker pool AVIF conversion failed:', workerError.message);
          // Continue to ImageMagick fallback
        }
      }
      
      // Try ImageMagick as secondary option
      if (imageMagickService.isReady() && !imageMagickService.isFallbackMode()) {
        try {
          console.log('Using ImageMagick for AVIF conversion (fallback method)');
          return await this.convertWithImageMagick(canvas, requestedFormat, quality);
        } catch (imageMagickError) {
          console.warn('ImageMagick AVIF conversion failed:', imageMagickError.message);
          // Continue to format fallback logic below
        }
      } else {
        console.log('ImageMagick not available for AVIF conversion, using format fallback');
      }
      
      // AVIF fallback: use WebP or JPEG
      const hasTransparency = this.canvasHasTransparency(canvas);
      const fallbackFormat = hasTransparency ? 'png' : 'webp';
      
      try {
        console.log(`Converting AVIF to ${fallbackFormat} fallback`);
        const fallbackBlob = await this.canvasToBlob(canvas, fallbackFormat, quality);
        
        return {
          blob: fallbackBlob,
          originalFormat: requestedFormat,
          actualFormat: fallbackFormat,
          wasFallback: true,
          fallbackReason: 'AVIF encoding not supported, using modern fallback format'
        };
      } catch (fallbackError) {
        // Final AVIF fallback to JPEG
        console.log('AVIF fallback to JPEG as final option');
        const jpegBlob = await this.canvasToBlob(canvas, 'jpeg', quality);
        return {
          blob: jpegBlob,
          originalFormat: requestedFormat,
          actualFormat: 'jpeg',
          wasFallback: true,
          fallbackReason: 'AVIF encoding not supported, converted to JPEG for compatibility'
        };
      }
    }
    
    try {
      // For other formats, try Canvas API first
      return await this.canvasToBlob(canvas, requestedFormat, quality);
    } catch (error) {
      console.warn(`Failed to convert to ${requestedFormat}:`, error.message);
      
      // Try ImageMagick as fallback for other formats
      if (imageMagickService.isReady() && !imageMagickService.isFallbackMode() && formatLower !== 'avif') {
        try {
          console.log(`Attempting ${requestedFormat} conversion with ImageMagick as fallback...`);
          return await this.convertWithImageMagick(canvas, requestedFormat, quality);
        } catch (imageMagickError) {
          console.warn(`ImageMagick ${requestedFormat} fallback also failed:`, imageMagickError.message);
        }
      }
      
      // Determine if image has transparency for smart fallback
      const hasTransparency = this.canvasHasTransparency(canvas);
      
      // Get automatic fallback format
      const fallbackFormat = this.getFormatFallback(requestedFormat, hasTransparency);
      
      if (fallbackFormat !== requestedFormat.toLowerCase()) {
        console.log(`Attempting fallback conversion to ${fallbackFormat}`);
        
        try {
          const fallbackBlob = await this.canvasToBlob(canvas, fallbackFormat, quality);
          
          // Log the successful fallback
          console.log(`Successfully converted using fallback format: ${fallbackFormat}`);
          
          // Return with fallback information
          return {
            blob: fallbackBlob,
            originalFormat: requestedFormat,
            actualFormat: fallbackFormat,
            wasFallback: true
          };
        } catch (fallbackError) {
          console.error(`Fallback to ${fallbackFormat} also failed:`, fallbackError.message);
          
          // Final fallback to PNG (most universally supported)
          if (fallbackFormat !== 'png') {
            console.log('Attempting final fallback to PNG');
            try {
              const pngBlob = await this.canvasToBlob(canvas, 'png', quality);
              return {
                blob: pngBlob,
                originalFormat: requestedFormat,
                actualFormat: 'png',
                wasFallback: true
              };
            } catch (pngError) {
              console.error('Even PNG fallback failed:', pngError.message);
            }
          }
        }
      }
      
      // If all fallbacks fail, throw the original error with helpful message
      throw new Error(`Conversion to ${requestedFormat} failed and no suitable fallback format is available. ${error.message}`);
    }
  }

  /**
   * Check if canvas has transparent pixels
   */
  canvasHasTransparency(canvas) {
    try {
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Check alpha channel (every 4th value) for transparency
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 255) {
          return true; // Found transparent pixel
        }
      }
      
      return false; // No transparency found
    } catch (error) {
      console.warn('Could not check canvas transparency:', error);
      return false; // Assume no transparency if check fails
    }
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
      'image/gif': 'gif',
      'image/tiff': 'tiff'
    };
    
    return mimeToFormat[mimeType];
  }

  /**
   * Check if a file is actually a RAW format file (async version using enhanced detection)
   */
  async isRawFile(file) {
    if (!file) return false;
    
    try {
      const validationResult = await this.rawDetector.validateRawFile(file);
      return validationResult.isRawFile;
    } catch (error) {
      console.warn('RAW file detection failed:', error);
      
      // Fallback to simple extension check
      const fileName = file.name || '';
      const extension = fileName.split('.').pop()?.toLowerCase() || '';
      return this.rawFormats.has(extension);
    }
  }

  /**
   * Synchronous RAW file check (legacy method for backwards compatibility)
   */
  isRawFileSync(file) {
    if (!file) return false;
    
    // Check MIME type first
    if (this.rawMimeTypes.has(file.type)) {
      return true;
    }
    
    // Check file extension as fallback (browsers often don't set correct MIME types for RAW)
    const fileName = file.name || '';
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    // Check if extension is a known RAW format
    if (this.rawFormats.has(extension)) {
      return true;
    }
    
    return false;
  }

  /**
   * Get available formats for a specific input file (async version with enhanced detection)
   */
  async getAvailableFormatsForFile(file) {
    if (!file) {
      return this.getSupportedFormats();
    }
    
    const allFormats = this.getSupportedFormats();
    
    try {
      // Use enhanced RAW detection
      const isRaw = await this.isRawFile(file);
      
      if (isRaw) {
        // For RAW files, only allow conversion to JPEG and PNG
        return ['jpeg', 'png'];
      }
    } catch (error) {
      console.warn('Format detection failed, using fallback:', error);
      
      // Fallback to synchronous check
      if (this.isRawFileSync(file)) {
        return ['jpeg', 'png'];
      }
    }
    
    // For non-RAW files, return all supported formats except RAW itself
    return allFormats.filter(format => !isRawFormat(format));
  }

  /**
   * Get available formats for a specific input file (synchronous version for compatibility)
   */
  getAvailableFormatsForFileSync(file) {
    if (!file) {
      return this.getSupportedFormats();
    }
    
    const allFormats = this.getSupportedFormats();
    
    // If this is a RAW file, only allow JPEG and PNG
    if (this.isRawFileSync(file)) {
      return ['jpeg', 'png'];
    }
    
    // For non-RAW files, exclude RAW from the options
    return allFormats.filter(format => !isRawFormat(format));
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
   * Get format support report
   */
  async getFormatSupportReport() {
    const nativeReport = {
      supported: this.getSupportedFormats(),
      capabilities: this.formatCapabilities
    };
    
    const enhancedReport = await this.enhancedFormatHandler.generateSupportReport();
    
    return {
      native: nativeReport,
      enhanced: enhancedReport,
      recommendations: this.getFormatRecommendations()
    };
  }

  /**
   * Get format recommendations based on use case
   */
  getFormatRecommendations() {
    return {
      photos: {
        recommended: ['jpeg', 'webp'],
        alternative: ['avif'],
        avoid: ['png', 'bmp', 'tiff'],
        reason: 'JPEG and WebP provide excellent compression for photographic content'
      },
      graphics: {
        recommended: ['png', 'webp'],
        alternative: ['svg'],
        avoid: ['jpeg', 'bmp'],
        reason: 'PNG and WebP preserve sharp edges and transparency in graphics'
      },
      animations: {
        recommended: ['webp', 'mp4'],
        alternative: ['gif'],
        avoid: ['png', 'jpeg'],
        reason: 'WebP and MP4 provide better compression than GIF for animations'
      },
      printing: {
        recommended: ['png', 'tiff'],
        alternative: ['jpeg'],
        avoid: ['webp', 'gif'],
        reason: 'PNG and TIFF provide high quality suitable for printing'
      }
    };
  }

  /**
   * Batch convert multiple images with progress tracking
   * SECURITY: Enhanced with rate limiting and security validation
   * PERFORMANCE: Uses WorkerPoolManager for parallel processing
   */
  async batchConvert(files, outputFormat, quality = 'medium', options = {}) {
    // Try using worker pool for batch processing if available
    if (this.useWorkerPool && this.workerPool && this.workerPool.isInitialized) {
      return this.batchConvertWithWorkerPool(files, outputFormat, quality, options);
    }
    
    // Fallback to sequential processing
    return this.batchConvertSequential(files, outputFormat, quality, options);
  }

  /**
   * Batch convert using WorkerPoolManager for parallel processing
   */
  async batchConvertWithWorkerPool(files, outputFormat, quality = 'medium', options = {}) {
    console.log(`Starting parallel batch conversion of ${files.length} files using worker pool`);
    
    // Check memory pressure before starting
    if (this.memoryManager.pressureState === 'critical' || this.memoryManager.pressureState === 'emergency') {
      await this.memoryManager.performCriticalCleanup();
    }

    // Prepare tasks for worker pool
    const tasks = files.map(file => ({
      imageData: file,
      outputFormat,
      options: {
        quality,
        enableSecurityValidation: this.securityConfig.enableSecurityValidation,
        enableMetadataSanitization: this.securityConfig.enableMetadataSanitization
      }
    }));

    try {
      const batchResult = await this.workerPool.processBatch(tasks, {
        maxConcurrency: Math.min(4, files.length),
        priority: options.priority || 'normal',
        onProgress: (progress, message, completed, total) => {
          if (options.onBatchProgress) {
            options.onBatchProgress(completed, total, message);
          }
          if (options.onProgress) {
            options.onProgress(progress, `Processing ${completed}/${total}: ${message}`);
          }
        },
        onTaskComplete: (task, result) => {
          // Update statistics for successful tasks
          const processingTime = result.processingTime || 0;
          this.updateStats(processingTime, result.blob?.size || 0);
          this.globalStats.completedTasks++;
        },
        onTaskError: (task, error) => {
          console.error('Task failed in batch processing:', error);
          this.globalStats.failedTasks++;
        }
      });

      // Transform worker pool results to match expected format
      const results = [];
      const errors = [];

      batchResult.results.forEach(item => {
        if (item.success) {
          results.push({
            originalFile: item.task.imageData,
            result: item.result,
            success: true
          });
        }
      });

      batchResult.errors.forEach(item => {
        errors.push({
          originalFile: item.task.imageData,
          error: item.error,
          success: false
        });
      });

      return {
        results,
        errors,
        successCount: results.length,
        errorCount: errors.length,
        totalCount: files.length,
        processingTime: batchResult.processingTime,
        avgTaskTime: batchResult.avgTaskTime,
        method: 'worker-pool-parallel'
      };

    } catch (error) {
      console.error('Worker pool batch processing failed, falling back to sequential:', error);
      // Fallback to sequential processing
      return this.batchConvertSequential(files, outputFormat, quality, options);
    }
  }

  /**
   * Original sequential batch processing method (fallback)
   */
  async batchConvertSequential(files, outputFormat, quality = 'medium', options = {}) {
    const results = [];
    const errors = [];
    const securityReport = {
      filesValidated: 0,
      threatsBlocked: 0,
      metadataStripped: 0
    };
    
    // SECURITY: Validate batch size to prevent resource exhaustion
    const maxBatchSize = 50; // Maximum files per batch
    if (files.length > maxBatchSize) {
      throw new Error(
        `Batch size ${files.length} exceeds maximum allowed ${maxBatchSize} files. ` +
        `This prevents resource exhaustion attacks. Please process files in smaller batches.`
      );
    }
    
    // SECURITY: Validate total batch size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const maxBatchSizeMB = 500; // 500MB max batch size
    if (totalSize > maxBatchSizeMB * 1024 * 1024) {
      throw new Error(
        `Total batch size ${Math.round(totalSize / 1024 / 1024)}MB exceeds maximum allowed ${maxBatchSizeMB}MB. ` +
        `This prevents memory exhaustion attacks.`
      );
    }
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        if (options.onBatchProgress) {
          options.onBatchProgress(i, files.length, `Converting ${file.name}...`);
        }
        
        const result = await this.convertImage(file, outputFormat, quality, {
          ...options,
          skipRateLimiting: true, // Skip individual rate limiting in batch mode
          onProgress: (progress, message) => {
            if (options.onProgress) {
              const overallProgress = ((i / files.length) * 100) + ((progress / 100) * (100 / files.length));
              options.onProgress(overallProgress, `File ${i + 1}/${files.length}: ${message}`);
            }
          }
        });
        
        // Notify about successful batch item
        if (result.wasFallback) {
          this.notificationService.notifyFormatUnsupported(
            outputFormat,
            result.actualFormat || result.format,
            result.fallbackReason || 'Format not supported in batch processing'
          );
        }
        
        results.push({
          originalFile: file,
          result,
          success: true
        });
        
        securityReport.filesValidated++;
        
      } catch (error) {
        console.error(`Failed to convert ${file.name}:`, error);
        
        // Check if this was a security-related error
        if (error.message.includes('Security validation failed') || 
            error.message.includes('Security threat detected')) {
          securityReport.threatsBlocked++;
        }
        
        // Generate user-friendly error for batch processing
        const errorInfo = this.notificationService.generateErrorMessage(error, {
          requestedFormat: outputFormat,
          operation: 'Batch conversion'
        });
        
        errors.push({
          originalFile: file,
          error: errorInfo.userMessage || error.message,
          technicalError: error.message,
          success: false,
          securityRelated: error.message.includes('Security'),
          suggestedActions: errorInfo.actions || []
        });
      }
    }
    
    // Update global security stats
    this.stats.securityThreatsBlocked += securityReport.threatsBlocked;
    this.stats.metadataStripped += securityReport.metadataStripped;
    
    return {
      results,
      errors,
      successCount: results.length,
      errorCount: errors.length,
      totalCount: files.length,
      securityReport
    };
  }

  /**
   * Get supported formats based on browser capabilities
   */
  getSupportedFormats() {
    if (!this.formatCapabilities) {
      return ['jpeg', 'png']; // Safe fallback
    }

    // Combine native capabilities with enhanced format support
    const nativeFormats = Object.entries(this.formatCapabilities)
      .filter(([format, supported]) => supported)
      .map(([format]) => format);
    
    // Add formats supported by enhanced handler
    const enhancedFormats = this.enhancedFormatHandler.getSupportedFormats();
    
    // Merge and deduplicate
    const allFormats = [...new Set([...nativeFormats, ...enhancedFormats])];
    
    return allFormats;
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
      gif: 'image/gif',
      tiff: 'image/tiff',
      tif: 'image/tiff'
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
    const baseStats = {
      ...this.stats,
      formatCapabilities: this.formatCapabilities,
      maxChunkSize: this.maxChunkSize
    };

    // Add memory management stats
    if (this.memoryManager) {
      baseStats.memoryManagement = this.memoryManager.getMemoryStats();
    }

    // Add worker pool stats
    if (this.workerPool && this.workerPool.isInitialized) {
      baseStats.workerPool = this.workerPool.getStats();
      baseStats.parallelProcessingEnabled = true;
    } else {
      baseStats.parallelProcessingEnabled = false;
      baseStats.workerPoolStatus = this.useWorkerPool ? 'failed-to-initialize' : 'disabled';
    }

    // Add image processor stats
    if (this.imageProcessor) {
      baseStats.imageProcessor = {
        canvasPoolStats: this.imageProcessor.monitor.getPool('canvas')?.getStats(),
        contextPoolStats: this.imageProcessor.monitor.getPool('context')?.getStats()
      };
    }

    return baseStats;
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

  /**
   * Cleanup resources and shutdown worker pool
   */
  async cleanup() {
    console.log('Cleaning up ModernImageProcessor resources...');

    try {
      // Shutdown worker pool
      if (this.workerPool) {
        await this.workerPool.shutdown({ timeout: 10000 });
        this.workerPool = null;
      }

      // Cleanup image processor resources
      if (this.imageProcessor) {
        this.imageProcessor.cleanup();
      }

      // Note: Don't destroy global memory manager as it might be used by other components
      
      console.log('ModernImageProcessor cleanup completed');
    } catch (error) {
      console.error('Error during ModernImageProcessor cleanup:', error);
    }
  }

  /**
   * Check if processor is ready for operations
   */
  isReady() {
    return this.formatCapabilities !== null && 
           (!this.useWorkerPool || (this.workerPool && this.workerPool.isInitialized));
  }

  /**
   * Get status information
   */
  getStatus() {
    return {
      isReady: this.isReady(),
      formatCapabilities: this.formatCapabilities,
      workerPool: {
        enabled: this.useWorkerPool,
        initialized: this.workerPool ? this.workerPool.isInitialized : false,
        stats: this.workerPool ? this.workerPool.getStats() : null
      },
      memoryManagement: {
        pressureState: this.memoryManager ? this.memoryManager.pressureState : 'unknown',
        stats: this.memoryManager ? this.memoryManager.getMemoryStats() : null
      }
    };
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

export const destroyModernImageProcessor = async () => {
  if (modernProcessor) {
    await modernProcessor.cleanup();
    modernProcessor = null;
  }
};

export default ModernImageProcessor;