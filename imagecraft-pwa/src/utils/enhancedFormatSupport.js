/**
 * Enhanced Format Support Module
 * Provides comprehensive image format handling with smart fallbacks
 * Integrates multiple libraries for maximum browser compatibility
 */

import imageCompression from 'browser-image-compression';
import imageMagickService from '../services/imageMagickService';

/**
 * Enhanced Format Handler with multiple library support
 */
class EnhancedFormatHandler {
  constructor() {
    this.supportedFormats = new Map();
    this.fallbackChain = new Map();
    this.libraryPreferences = new Map();
    
    this.initializeFormatSupport();
    this.initializeFallbackChains();
  }

  /**
   * Initialize format support capabilities
   */
  initializeFormatSupport() {
    // Canvas native support (always available)
    this.supportedFormats.set('jpeg', { 
      canvas: true, 
      compression: true,
      imagemagick: true,
      quality: 'excellent'
    });
    this.supportedFormats.set('png', { 
      canvas: true, 
      compression: true,
      imagemagick: true,
      quality: 'excellent'
    });
    this.supportedFormats.set('webp', { 
      canvas: 'detect', 
      compression: true,
      imagemagick: true,
      quality: 'good'
    });
    
    // Enhanced support with ImageMagick
    this.supportedFormats.set('avif', { 
      canvas: 'limited', 
      compression: false,
      imagemagick: true,
      quality: 'excellent',
      note: 'AVIF encoding via ImageMagick WASM'
    });
    this.supportedFormats.set('tiff', { 
      canvas: false, 
      compression: false,
      imagemagick: true,
      quality: 'excellent',
      note: 'TIFF support via ImageMagick WASM'
    });
    
    // Limited support formats
    this.supportedFormats.set('gif', { 
      canvas: 'limited', 
      compression: false,
      imagemagick: true,
      quality: 'good',
      note: 'GIF processing via ImageMagick'
    });
    this.supportedFormats.set('bmp', { 
      canvas: 'detect', 
      compression: false,
      imagemagick: true,
      quality: 'good'
    });
  }

  /**
   * Initialize smart fallback chains for each format
   */
  initializeFallbackChains() {
    // AVIF fallback chain: AVIF -> WebP -> JPEG
    this.fallbackChain.set('avif', [
      { format: 'webp', reason: 'Better compression than JPEG, wide support' },
      { format: 'jpeg', reason: 'Universal compatibility' }
    ]);

    // TIFF fallback chain: TIFF -> PNG -> JPEG
    this.fallbackChain.set('tiff', [
      { format: 'png', reason: 'Lossless quality preservation' },
      { format: 'jpeg', reason: 'Smaller file size for photos' }
    ]);

    // GIF fallback chain: GIF -> PNG -> JPEG
    this.fallbackChain.set('gif', [
      { format: 'png', reason: 'Preserves transparency and quality' },
      { format: 'jpeg', reason: 'Smaller file size, no transparency' }
    ]);

    // BMP fallback chain: BMP -> PNG -> JPEG
    this.fallbackChain.set('bmp', [
      { format: 'png', reason: 'Maintains quality with compression' },
      { format: 'jpeg', reason: 'Significant size reduction' }
    ]);
  }

  /**
   * Check comprehensive format support
   */
  async checkFormatSupport(format) {
    const formatLower = format.toLowerCase();
    const support = this.supportedFormats.get(formatLower);
    
    if (!support) {
      return {
        supported: false,
        method: 'none',
        quality: 'none',
        recommendation: this.getFormatRecommendation(formatLower)
      };
    }

    // For formats marked as 'detect', test actual browser support
    if (support.canvas === 'detect') {
      const canvasSupport = await this.testCanvasSupport(formatLower);
      return {
        supported: canvasSupport || support.imagemagick,
        method: canvasSupport ? 'canvas' : (support.imagemagick ? 'imagemagick' : 'none'),
        quality: support.quality,
        fallbacks: this.fallbackChain.get(formatLower) || []
      };
    }

    return {
      supported: support.canvas || support.compression || support.imagemagick,
      method: this.selectBestMethod(support),
      quality: support.quality,
      note: support.note,
      fallbacks: this.fallbackChain.get(formatLower) || []
    };
  }

  /**
   * Initialize ImageMagick service
   */
  async initializeImageMagick() {
    try {
      if (!imageMagickService.isReady()) {
        await imageMagickService.initialize();
      }
      return true;
    } catch (error) {
      console.warn('ImageMagick initialization failed:', error);
      return false;
    }
  }

  /**
   * Select the best processing method for a format
   */
  selectBestMethod(support) {
    if (support.canvas === true) return 'canvas';
    if (support.compression) return 'compression';
    if (support.imagemagick) return 'imagemagick';
    return 'none';
  }

  /**
   * Test actual browser support for a format
   */
  async testCanvasSupport(format) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, 0, 1, 1);

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob && blob.type.includes(format)) {
            resolve(true);
          } else {
            resolve(false);
          }
        }, `image/${format}`, 0.8);
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Convert image using the best available method
   */
  async convertWithFallback(file, targetFormat, quality = 'medium', options = {}) {
    const targetFormatLower = targetFormat.toLowerCase();
    const support = await this.checkFormatSupport(targetFormatLower);
    
    if (options.onProgress) {
      options.onProgress(5, `Checking ${targetFormat} support...`);
    }

    // If format is supported, try direct conversion
    if (support.supported) {
      try {
        if (options.onProgress) {
          options.onProgress(15, `Converting to ${targetFormat} using ${support.method}...`);
        }

        const result = await this.convertUsingMethod(file, targetFormatLower, quality, support.method, options);
        
        if (result) {
          return {
            ...result,
            wasDirectConversion: true,
            method: support.method,
            originalFormat: targetFormat
          };
        }
      } catch (error) {
        console.warn(`Direct conversion to ${targetFormat} failed:`, error.message);
        
        if (options.onProgress) {
          options.onProgress(20, `Direct conversion failed, trying fallback...`);
        }
      }
    }

    // Try fallback conversion
    return await this.convertWithFallbackChain(file, targetFormatLower, quality, options);
  }

  /**
   * Convert using fallback chain
   */
  async convertWithFallbackChain(file, originalTargetFormat, quality, options = {}) {
    const fallbacks = this.fallbackChain.get(originalTargetFormat) || [];
    
    if (fallbacks.length === 0) {
      // No fallbacks available, use safe default
      const defaultFormat = this.hasTransparency(file) ? 'png' : 'jpeg';
      
      if (options.onProgress) {
        options.onProgress(30, `No fallbacks available, using ${defaultFormat}...`);
      }

      const result = await this.convertUsingMethod(file, defaultFormat, quality, 'canvas', options);
      
      return {
        ...result,
        wasDirectConversion: false,
        wasFallback: true,
        originalFormat: originalTargetFormat,
        actualFormat: defaultFormat,
        fallbackReason: `${originalTargetFormat.toUpperCase()} not supported by browser`
      };
    }

    // Try each fallback in order
    for (let i = 0; i < fallbacks.length; i++) {
      const fallback = fallbacks[i];
      const fallbackSupport = await this.checkFormatSupport(fallback.format);
      
      if (options.onProgress) {
        options.onProgress(30 + (i * 20), `Trying fallback: ${fallback.format}...`);
      }

      if (fallbackSupport.supported) {
        try {
          const result = await this.convertUsingMethod(file, fallback.format, quality, fallbackSupport.method, options);
          
          if (result) {
            return {
              ...result,
              wasDirectConversion: false,
              wasFallback: true,
              originalFormat: originalTargetFormat,
              actualFormat: fallback.format,
              fallbackReason: fallback.reason,
              method: fallbackSupport.method
            };
          }
        } catch (error) {
          console.warn(`Fallback to ${fallback.format} failed:`, error.message);
          continue;
        }
      }
    }

    // All fallbacks failed, use final safe fallback
    const safeFormat = 'jpeg';
    
    if (options.onProgress) {
      options.onProgress(80, `All fallbacks failed, using safe format: ${safeFormat}...`);
    }

    const result = await this.convertUsingMethod(file, safeFormat, quality, 'canvas', options);
    
    return {
      ...result,
      wasDirectConversion: false,
      wasFallback: true,
      originalFormat: originalTargetFormat,
      actualFormat: safeFormat,
      fallbackReason: `All conversion methods failed, using universal ${safeFormat.toUpperCase()}`,
      method: 'canvas'
    };
  }

  /**
   * Convert using specific method
   */
  async convertUsingMethod(file, format, quality, method, options = {}) {
    switch (method) {
      case 'canvas':
        return await this.convertUsingCanvas(file, format, quality, options);
      
      case 'compression':
        return await this.convertUsingCompression(file, format, quality, options);
      
      case 'imagemagick':
        return await this.convertUsingImageMagick(file, format, quality, options);
      
      default:
        throw new Error(`Unknown conversion method: ${method}`);
    }
  }

  /**
   * Convert using Canvas API
   */
  async convertUsingCanvas(file, format, quality, options = {}) {
    const imageBitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;

    // Handle background for formats that don't support transparency
    if (['jpeg', 'bmp'].includes(format)) {
      ctx.fillStyle = options.backgroundColor || '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(imageBitmap, 0, 0);
    imageBitmap.close();

    const mimeType = `image/${format}`;
    const qualityValue = this.getQualityValue(quality, format);

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob && blob.size > 0) {
          resolve({
            blob,
            width: canvas.width,
            height: canvas.height,
            format: format,
            size: blob.size
          });
        } else {
          reject(new Error(`Canvas conversion to ${format} failed`));
        }
      }, mimeType, qualityValue);
    });
  }

  /**
   * Convert using browser-image-compression
   */
  async convertUsingCompression(file, format, quality, options = {}) {
    const compressionOptions = {
      maxSizeMB: this.getMaxSizeMB(quality),
      maxWidthOrHeight: options.maxDimension || 4096,
      useWebWorker: true,
      fileType: `image/${format}`,
      preserveExif: false
    };

    if (options.onProgress) {
      compressionOptions.onProgress = (progress) => {
        options.onProgress(30 + (progress * 0.4), 'Compressing image...');
      };
    }

    try {
      const compressedFile = await imageCompression(file, compressionOptions);
      
      return {
        blob: compressedFile,
        width: null, // Compression library doesn't provide dimensions
        height: null,
        format: format,
        size: compressedFile.size
      };
    } catch (error) {
      throw new Error(`Compression conversion to ${format} failed: ${error.message}`);
    }
  }

  /**
   * Convert using ImageMagick WASM
   */
  async convertUsingImageMagick(file, format, quality, options = {}) {
    try {
      // Initialize ImageMagick if not already done
      const initialized = await this.initializeImageMagick();
      if (!initialized) {
        throw new Error('ImageMagick initialization failed');
      }

      // Prepare conversion options
      const conversionOptions = {
        width: options.width,
        height: options.height,
        quality: this.getImageMagickQuality(quality, format),
        crop: options.crop,
        rotate: options.rotate
      };

      // Convert using ImageMagick service
      const result = await imageMagickService.convertImage(
        file,
        format,
        conversionOptions,
        options.onProgress
      );

      return {
        blob: result.blob,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.size
      };

    } catch (error) {
      throw new Error(`ImageMagick conversion to ${format} failed: ${error.message}`);
    }
  }

  /**
   * Get ImageMagick quality value
   */
  getImageMagickQuality(quality, format) {
    // For lossless formats, quality doesn't apply
    if (['png', 'bmp', 'tiff'].includes(format)) {
      return undefined;
    }

    const qualityMap = {
      high: 95,
      medium: 80,
      low: 60
    };

    return qualityMap[quality] || 80;
  }

  /**
   * Get quality value for different formats
   */
  getQualityValue(quality, format) {
    const qualityMap = {
      high: { jpeg: 0.95, webp: 0.9, avif: 0.85 },
      medium: { jpeg: 0.8, webp: 0.75, avif: 0.65 },
      low: { jpeg: 0.6, webp: 0.5, avif: 0.4 }
    };

    const formatQuality = qualityMap[quality] || qualityMap.medium;
    return formatQuality[format] || 0.8;
  }


  /**
   * Get max file size for compression
   */
  getMaxSizeMB(quality) {
    const sizeMap = {
      high: 10,
      medium: 5,
      low: 2
    };

    return sizeMap[quality] || 5;
  }

  /**
   * Check if image has transparency
   */
  hasTransparency(file) {
    const fileName = file.name.toLowerCase();
    return fileName.endsWith('.png') || fileName.endsWith('.gif') || fileName.includes('transparency');
  }

  /**
   * Get format recommendation for unsupported formats
   */
  getFormatRecommendation(format) {
    const recommendations = {
      'avif': 'Use WebP for better compression or JPEG for universal compatibility',
      'tiff': 'Use PNG for lossless quality or JPEG for smaller file size',
      'gif': 'Use PNG for static images with transparency or MP4/WebM for animations',
      'bmp': 'Use PNG for lossless compression or JPEG for smaller file size',
      'svg': 'SVG is vector-based, consider PNG for raster conversion',
      'ico': 'Use PNG for icon conversion'
    };

    return recommendations[format] || 'Consider using JPEG for photos or PNG for graphics';
  }

  /**
   * Get supported formats list
   */
  getSupportedFormats() {
    return Array.from(this.supportedFormats.keys());
  }

  /**
   * Get format support details
   */
  getFormatDetails(format) {
    return this.supportedFormats.get(format.toLowerCase());
  }

  /**
   * Get fallback chain for a format
   */
  getFallbackChain(format) {
    return this.fallbackChain.get(format.toLowerCase()) || [];
  }

  /**
   * Generate format support report
   */
  async generateSupportReport() {
    const report = {
      nativeSupport: [],
      limitedSupport: [],
      unsupported: [],
      fallbacksAvailable: {}
    };

    for (const [format] of this.supportedFormats.entries()) {
      const actualSupport = await this.checkFormatSupport(format);
      
      if (actualSupport.supported && actualSupport.quality === 'excellent') {
        report.nativeSupport.push(format);
      } else if (actualSupport.supported) {
        report.limitedSupport.push(format);
      } else {
        report.unsupported.push(format);
      }

      if (actualSupport.fallbacks && actualSupport.fallbacks.length > 0) {
        report.fallbacksAvailable[format] = actualSupport.fallbacks;
      }
    }

    return report;
  }
}

// Create singleton instance
let enhancedFormatHandler = null;

export const getEnhancedFormatHandler = () => {
  if (!enhancedFormatHandler) {
    enhancedFormatHandler = new EnhancedFormatHandler();
  }
  return enhancedFormatHandler;
};

export const destroyEnhancedFormatHandler = () => {
  if (enhancedFormatHandler) {
    enhancedFormatHandler = null;
  }
};

export default EnhancedFormatHandler;