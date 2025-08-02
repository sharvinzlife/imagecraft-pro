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

import { createRawDetector, validateRawConversion, isRawFormat } from '../utils/formatDetection';
import { validateImageFile, validateImageDimensions } from '../utils/validationUtils';
import { getEnhancedFormatHandler } from '../utils/enhancedFormatSupport';
import { getFormatNotificationService } from '../utils/formatNotificationService';
import imageMagickService from './imageMagickService.js';

class ModernImageProcessor {
  constructor() {
    this.supportedFormats = new Set(['jpeg', 'jpg', 'png', 'webp', 'avif', 'bmp', 'gif', 'raw', 'cr2', 'cr3', 'nef', 'arw', 'dng', 'orf', 'rw2', 'raf', 'pef', 'srw', 'x3f']);
    this.rawFormats = new Set(['raw', 'cr2', 'cr3', 'nef', 'arw', 'dng', 'orf', 'rw2', 'raf', 'pef', 'srw', 'x3f']); // Enhanced RAW formats
    this.rawMimeTypes = new Set(['image/x-canon-cr2', 'image/x-canon-cr3', 'image/x-nikon-nef', 'image/x-sony-arw', 'image/x-adobe-dng', 'image/x-olympus-orf', 'image/x-panasonic-rw2', 'image/x-fuji-raf', 'image/x-pentax-pef', 'image/x-samsung-srw', 'image/x-sigma-x3f']);
    this.maxChunkSize = 50 * 1024 * 1024; // 50MB chunks for progressive processing
    this.qualitySettings = this.initializeQualitySettings();
    this.formatCapabilities = null;
    
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
  }

  /**
   * Initialize quality settings for different formats
   * Fixed to prevent JPEG quantization grid artifacts
   */
  initializeQualitySettings() {
    return {
      high: {
        description: 'Maximum quality, larger file size',
        jpeg: 0.98, // Increased from 0.95 to prevent quantization artifacts
        webp: 0.92, // Slightly increased for consistency
        avif: 0.88, // Slightly increased for consistency
        png: null, // PNG is lossless
      },
      medium: {
        description: 'Balanced quality and file size',
        jpeg: 0.88, // Increased from 0.8 to prevent visible grid lines
        webp: 0.80, // Slightly increased for consistency
        avif: 0.70, // Slightly increased for consistency
        png: null,
      },
      low: {
        description: 'Smaller file size, reasonable quality',
        jpeg: 0.75, // Increased from 0.6 to maintain acceptable quality
        webp: 0.60, // Slightly increased
        avif: 0.50, // Slightly increased
        png: null,
      }
    };
  }

  /**
   * Detect browser format support capabilities with comprehensive testing
   */
  async initializeCapabilities() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    // Fill canvas with test pattern
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(0, 0, 1, 1);
    
    // Check both Canvas and ImageMagick capabilities
    const canvasWebP = await this.testFormatSupport(canvas, 'image/webp');
    const canvasAVIF = await this.testFormatSupport(canvas, 'image/avif');
    const canvasBMP = await this.testFormatSupport(canvas, 'image/bmp');
    const canvasGIF = await this.testFormatSupport(canvas, 'image/gif');
    
    // Check if ImageMagick service is available
    const imageMagickAvailable = await this.checkImageMagickAvailability();
    
    this.formatCapabilities = {
      webp: canvasWebP || imageMagickAvailable,
      avif: canvasAVIF || imageMagickAvailable, // ImageMagick supports AVIF
      jpeg: true, // Always supported
      png: true,  // Always supported
      bmp: canvasBMP || imageMagickAvailable,
      gif: canvasGIF || imageMagickAvailable,
      tiff: imageMagickAvailable // Only ImageMagick supports TIFF
    };

    console.log('Format capabilities detected:', this.formatCapabilities);
  }

  /**
   * Check if ImageMagick service is available
   */
  async checkImageMagickAvailability() {
    try {
      // Check if ImageMagick service is ready (including fallback mode)
      if (imageMagickService.isReady()) {
        return true; // Even fallback mode provides some enhanced capabilities
      }
      
      // Try to initialize it (this will return quickly if already initialized)
      await imageMagickService.initialize();
      
      return imageMagickService.isReady();
    } catch (error) {
      console.warn('ImageMagick service not available:', error.message);
      return false;
    }
  }

  /**
   * Test if browser supports specific image format with comprehensive checks
   */
  async testFormatSupport(canvas, mimeType) {
    try {
      // First check if the MIME type is recognized
      if (!this.isMimeTypeSupported(mimeType)) {
        console.log(`MIME type ${mimeType} not recognized as supported`);
        return false;
      }
      
      return new Promise((resolve) => {
        try {
          canvas.toBlob((blob) => {
            if (!blob || blob.size === 0) {
              console.log(`${mimeType} format test failed: no blob created`);
              resolve(false);
              return;
            }
            
            // Critical check: Does the browser actually return the requested format?
            const actualType = blob.type;
            const supported = actualType === mimeType;
            
            if (!supported) {
              console.log(`${mimeType} format not supported: browser returned ${actualType} instead`);
              
              // Use enhanced format handler for better error messaging
              const format = mimeType.replace('image/', '');
              const fallbackFormat = actualType.replace('image/', '');
              
              // Notify about format fallback
              this.notificationService.notifyFormatUnsupported(
                format, 
                fallbackFormat, 
                'Browser Canvas API does not support encoding to this format'
              );
            } else {
              console.log(`${mimeType} format fully supported by browser`);
            }
            
            resolve(supported);
          }, mimeType, 0.8);
        } catch (blobError) {
          console.warn(`Blob creation failed for ${mimeType}:`, blobError);
          resolve(false);
        }
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
        // AVIF support requires modern Canvas API and is browser-dependent
        return typeof HTMLCanvasElement !== 'undefined' && 
               HTMLCanvasElement.prototype.toBlob;
      case 'image/webp':
        // WebP support is common but not universal
        return typeof HTMLCanvasElement !== 'undefined' && 
               HTMLCanvasElement.prototype.toBlob;
      case 'image/jpeg':
      case 'image/png':
        // Always supported by Canvas API
        return true;
      case 'image/bmp':
        // BMP support varies significantly
        return typeof HTMLCanvasElement !== 'undefined';
      case 'image/gif':
        // GIF input is supported, but output support is very limited
        // Most browsers don't support GIF encoding via Canvas
        return typeof HTMLCanvasElement !== 'undefined';
      case 'image/tiff':
        // TIFF is generally not supported by Canvas API
        return false;
      default:
        return false;
    }
  }

  /**
   * Convert image with progressive processing for large files
   * SECURITY: Includes comprehensive validation and sanitization
   */
  async convertImage(file, outputFormat, quality = 'medium', options = {}) {
    const startTime = performance.now();
    
    try {
      // SECURITY: Comprehensive file validation and sanitization
      if (this.securityConfig.enableSecurityValidation) {
        if (options.onProgress) {
          options.onProgress(1, 'Performing security validation...');
        }
        
        const validationResult = await validateImageFile(file, {
          skipRateLimiting: options.skipRateLimiting || false
        });
        
        if (!validationResult.valid) {
          this.stats.securityThreatsBlocked++;
          throw new Error(`Security validation failed: ${validationResult.errors.join('; ')}`);
        }
        
        // Use the sanitized file
        file = validationResult.file;
        
        if (validationResult.warnings.length > 0) {
          console.warn('Security warnings:', validationResult.warnings);
          this.stats.metadataStripped++;
        }
      }
      
      // Enhanced RAW format detection and validation
      if (options.onProgress) {
        options.onProgress(3, 'Detecting file format...');
      }
      
      const formatDetectionResult = await this.rawDetector.detectFormat(file);
      const rawValidationResult = await this.rawDetector.validateRawFile(file);
      
      if (options.onProgress) {
        options.onProgress(5, 'Validating format conversion...');
      }
      
      // Handle RAW format conversion
      let actualOutputFormat = outputFormat;
      let isRawToStandardConversion = false;
      
      if (outputFormat.toLowerCase() === 'raw') {
        // RAW format selected means convert RAW to JPEG
        if (!rawValidationResult.isRawFile) {
          throw new Error('RAW conversion selected but file is not a RAW format. Please select a different output format.');
        }
        actualOutputFormat = rawValidationResult.recommendedOutputFormat;
        isRawToStandardConversion = true;
        
        if (options.onProgress) {
          options.onProgress(8, `Converting ${rawValidationResult.detectedRawFormat?.toUpperCase()} to ${actualOutputFormat.toUpperCase()}...`);
        }
      } else if (rawValidationResult.isRawFile) {
        // RAW file but non-RAW output format selected
        const conversionValidation = await validateRawConversion(file, outputFormat);
        if (!conversionValidation.isValid) {
          throw new Error(`RAW file conversion error: ${conversionValidation.errors.join('; ')}`);
        }
        isRawToStandardConversion = true;
        
        // Conversion validation passed
        
        if (options.onProgress) {
          options.onProgress(8, `Converting RAW (${rawValidationResult.detectedRawFormat?.toUpperCase()}) to ${actualOutputFormat.toUpperCase()}...`);
        }
      }
      
      // Additional validation for format detection errors
      if (!formatDetectionResult.isValid && formatDetectionResult.errors.length > 0) {
        throw new Error(`Format validation failed: ${formatDetectionResult.errors.join('; ')}`);
      }
      
      // Validate input with enhanced security checks
      this.validateInputSecurity(file, actualOutputFormat, {
        isRawFile: rawValidationResult.isRawFile,
        detectedFormat: formatDetectionResult.detectedFormat,
        isRawConversion: isRawToStandardConversion
      });
      
      // Report initial progress  
      if (options.onProgress) {
        options.onProgress(10, 'Analyzing image...');
      }

      // Check if we should use enhanced format handling
      const formatSupport = await this.enhancedFormatHandler.checkFormatSupport(actualOutputFormat);
      
      if (!formatSupport.supported && formatSupport.fallbacks && formatSupport.fallbacks.length > 0) {
        // Use enhanced format handler for unsupported formats
        if (options.onProgress) {
          options.onProgress(15, `Using enhanced format handling for ${actualOutputFormat}...`);
        }
        
        return await this.convertWithEnhancedHandler(file, actualOutputFormat, quality, options, {
          isRawConversion: isRawToStandardConversion,
          rawValidationResult,
          formatDetectionResult
        });
      }

      // Create image bitmap with optimal settings and security checks
      const imageBitmap = await this.createOptimizedImageBitmap(file);
      
      // SECURITY: Validate image dimensions to prevent memory exhaustion attacks
      const dimensionValidation = validateImageDimensions(imageBitmap.width, imageBitmap.height);
      if (!dimensionValidation.valid) {
        imageBitmap.close();
        throw new Error(`Security validation failed: ${dimensionValidation.errors.join('; ')}`);
      }
      
      if (options.onProgress) {
        options.onProgress(20, 'Processing image...');
      }

      // Calculate optimal dimensions with security constraints
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
          actualOutputFormat,
          quality,
          options
        );
      } else {
        result = await this.processImageDirect(
          imageBitmap,
          dimensions,
          actualOutputFormat,
          quality,
          options
        );
      }

      // Clean up
      imageBitmap.close();

      // Update statistics
      const processingTime = performance.now() - startTime;
      this.updateStats(processingTime, result.blob?.size || 0);

      if (options.onProgress) {
        options.onProgress(100, 'Conversion complete!');
      }

      // Notify about successful conversion
      this.notificationService.notifyConversionSuccess(
        file.name.split('.').pop()?.toLowerCase() || 'unknown',
        actualOutputFormat,
        true, // was direct conversion
        {
          originalSize: file.size,
          finalSize: result.blob?.size || result.size || 0,
          compressionRatio: file.size > 0 && result.blob?.size > 0 ? result.blob.size / file.size : 1,
          processingTime
        }
      );

      return {
        ...result,
        originalSize: file.size,
        originalName: file.name,
        size: result.blob?.size || result.size || 0,
        compressionRatio: file.size > 0 && result.blob?.size > 0 ? result.blob.size / file.size : 1,
        processingTime,
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
    
    // Use precise integer coordinates to prevent interpolation artifacts
    const targetWidth = Math.round(dimensions.width);
    const targetHeight = Math.round(dimensions.height);
    
    // Draw image with high-quality scaling
    ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
    
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
      originalFormat: blobResult.originalFormat,
      wasFallback: blobResult.wasFallback || false
    };
  }

  /**
   * Process large images progressively to avoid memory issues
   * Fixed to eliminate tile boundary artifacts and grid lines
   */
  async processImageProgressively(imageBitmap, dimensions, outputFormat, quality, options) {
    const tileSize = 1536; // Reduced from 2048 to minimize boundary effects
    const overlap = 32; // Add overlap between tiles to eliminate seams
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', {
      // Optimized context options to prevent artifacts
      alpha: !this.requiresBackground(outputFormat),
      colorSpace: 'srgb',
      willReadFrequently: false
    });
    
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Configure context for artifact-free rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    // Set composite mode to ensure smooth blending at tile boundaries
    ctx.globalCompositeOperation = 'source-over';

    // Apply background for formats that don't support transparency
    if (this.requiresBackground(outputFormat)) {
      ctx.fillStyle = options.backgroundColor || '#FFFFFF';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    }

    const scaleX = dimensions.width / imageBitmap.width;
    const scaleY = dimensions.height / imageBitmap.height;

    // Calculate tiles with overlap to prevent boundary artifacts
    const effectiveTileSize = tileSize - overlap;
    const tilesX = Math.ceil(imageBitmap.width / effectiveTileSize);
    const tilesY = Math.ceil(imageBitmap.height / effectiveTileSize);
    const totalTiles = tilesX * tilesY;

    for (let tileY = 0; tileY < tilesY; tileY++) {
      for (let tileX = 0; tileX < tilesX; tileX++) {
        const currentTile = tileY * tilesX + tileX + 1;
        
        if (options.onProgress) {
          const progress = 20 + (currentTile / totalTiles) * 50;
          options.onProgress(progress, `Processing tile ${currentTile}/${totalTiles}...`);
        }

        // Source coordinates with overlap
        const sx = Math.max(0, tileX * effectiveTileSize - (tileX > 0 ? overlap / 2 : 0));
        const sy = Math.max(0, tileY * effectiveTileSize - (tileY > 0 ? overlap / 2 : 0));
        const sw = Math.min(
          tileSize, 
          imageBitmap.width - sx,
          (tileX === tilesX - 1) ? imageBitmap.width - sx : tileSize
        );
        const sh = Math.min(
          tileSize, 
          imageBitmap.height - sy,
          (tileY === tilesY - 1) ? imageBitmap.height - sy : tileSize
        );

        // Destination coordinates with precise alignment
        const dx = sx * scaleX;
        const dy = sy * scaleY;
        const dw = sw * scaleX;
        const dh = sh * scaleY;

        // Use sub-pixel rendering to prevent grid artifacts
        ctx.save();
        
        // Enable anti-aliasing for smooth tile edges
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw tile with precise coordinates to prevent gaps
        ctx.drawImage(imageBitmap, sx, sy, sw, sh, Math.round(dx), Math.round(dy), Math.round(dw), Math.round(dh));
        
        ctx.restore();

        // Allow browser to breathe between tiles
        if (currentTile % 3 === 0) { // Reduced frequency for better performance
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    }

    if (options.onProgress) {
      options.onProgress(80, 'Converting to target format...');
    }

    // Convert to blob with fallback support
    const blobResult = await this.canvasToBlobWithFallback(canvas, outputFormat, quality);

    return {
      blob: blobResult.blob || blobResult,
      width: dimensions.width,
      height: dimensions.height,
      format: blobResult.actualFormat || outputFormat,
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
              resolve(blob);
              return;
            }
            
            // Browser fell back to a different format
            console.warn(`Expected ${mimeType}, got ${blob.type}`);
            
            // Handle common fallback scenarios gracefully
            const formatLower = format.toLowerCase();
            const actualFormat = this.getFormatFromMimeType(blob.type);
            
            if (actualFormat) {
              console.log(`Browser automatically converted ${formatLower} to ${actualFormat}`);
              
              // Accept common fallbacks that preserve quality
              if (
                // Modern formats falling back to PNG (acceptable)
                (['avif', 'webp'].includes(formatLower) && actualFormat === 'png') ||
                // GIF falling back to PNG (acceptable, preserves transparency)
                (formatLower === 'gif' && actualFormat === 'png') ||
                // BMP falling back to PNG (acceptable, preserves quality)
                (formatLower === 'bmp' && actualFormat === 'png') ||
                // Any format falling back to JPEG (acceptable for photos)
                (actualFormat === 'jpeg')
              ) {
                console.log(`Accepting fallback from ${formatLower} to ${actualFormat}`);
                resolve(blob);
                return;
              }
            }
            
            // Unexpected format conversion - this shouldn't happen with our capability detection
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
   * Convert canvas to blob with automatic fallback on format failure
   */
  async canvasToBlobWithFallback(canvas, requestedFormat, quality, options = {}) {
    try {
      // For AVIF, try ImageMagick first if available
      if (requestedFormat.toLowerCase() === 'avif' && imageMagickService.isReady() && !imageMagickService.isFallbackMode()) {
        try {
          return await this.convertWithImageMagick(canvas, requestedFormat, quality);
        } catch (imageMagickError) {
          console.warn('ImageMagick AVIF conversion failed, trying Canvas API:', imageMagickError.message);
          // Continue to Canvas API fallback
        }
      }
      
      // Try the requested format with Canvas API
      return await this.canvasToBlob(canvas, requestedFormat, quality);
    } catch (error) {
      console.warn(`Failed to convert to ${requestedFormat}:`, error.message);
      
      // For AVIF specifically, try ImageMagick if we haven't already
      if (requestedFormat.toLowerCase() === 'avif' && imageMagickService.isReady() && !imageMagickService.isFallbackMode()) {
        try {
          console.log('Attempting AVIF conversion with ImageMagick as fallback...');
          return await this.convertWithImageMagick(canvas, requestedFormat, quality);
        } catch (imageMagickError) {
          console.warn('ImageMagick AVIF fallback also failed:', imageMagickError.message);
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
            ...fallbackBlob,
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
                ...pngBlob,
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
   */
  async batchConvert(files, outputFormat, quality = 'medium', options = {}) {
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