/**
 * Security Validation Utility
 * Provides comprehensive security validation for image uploads
 */

// File signature validation
const FILE_SIGNATURES = {
  // JPEG signatures
  'ffd8ffe0': 'image/jpeg',
  'ffd8ffe1': 'image/jpeg', 
  'ffd8ffe2': 'image/jpeg',
  'ffd8ffe3': 'image/jpeg',
  'ffd8ffe8': 'image/jpeg',
  'ffd8ffed': 'image/jpeg',
  'ffd8ffee': 'image/jpeg',

  // PNG signature
  '89504e47': 'image/png',

  // GIF signatures
  '47494638': 'image/gif',

  // WebP signature
  '52494646': 'image/webp', // RIFF header, need to check WEBP at offset 8

  // BMP signature
  '424d': 'image/bmp',

  // TIFF signatures
  '49492a00': 'image/tiff', // Little endian
  '4d4d002a': 'image/tiff', // Big endian
};

// Rate limiting storage
const rateLimitStore = new Map();

/**
 * Security Validator Class
 * Comprehensive security validation for image uploads
 */
class SecurityValidator {
  constructor() {
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
    this.maxDimensions = { width: 8192, height: 8192 }; // 8K max
    this.maxPixels = 32 * 1024 * 1024; // 32 megapixels
    this.allowedMimeTypes = new Set([
      'image/jpeg',
      'image/jpg',
      'image/png', 
      'image/gif',
      'image/webp',
      'image/avif',
      'image/bmp',
      'image/svg+xml',
      'image/tiff'
    ]);
    
    // Rate limiting configuration
    this.rateLimits = {
      filesPerMinute: 20,
      filesPerHour: 100,
      bytesPerHour: 500 * 1024 * 1024 // 500MB per hour
    };
  }

  /**
   * Comprehensive file validation
   * @param {File} file - File to validate
   * @returns {Promise<Object>} - Validation result
   */
  async validateFile(file) {
    const results = {
      isValid: true,
      errors: [],
      warnings: [],
      threats: [],
      metadata: {}
    };

    try {
      // Basic file validation
      this.validateBasicFile(file, results);
      
      // MIME type validation
      await this.validateMimeType(file, results);
      
      // File signature validation
      await this.validateFileSignature(file, results);
      
      // Rate limiting check
      this.validateRateLimit(results);
      
      // Filename validation
      this.validateFilename(file.name, results);
      
      // File size validation
      this.validateFileSize(file.size, results);
      
      // Image dimensions validation (if possible)
      await this.validateImageDimensions(file, results);

    } catch (error) {
      results.isValid = false;
      results.errors.push(`Security validation failed: ${error.message}`);
    }

    results.isValid = results.errors.length === 0;
    return results;
  }

  /**
   * Basic file validation
   */
  validateBasicFile(file, results) {
    if (!file) {
      results.errors.push('No file provided');
      return;
    }

    if (!(file instanceof File) && !(file instanceof Blob)) {
      results.errors.push('Invalid file type');
      return;
    }

    results.metadata.originalName = file.name;
    results.metadata.size = file.size;
    results.metadata.mimeType = file.type;
    results.metadata.lastModified = file.lastModified;
  }

  /**
   * MIME type validation
   */
  async validateMimeType(file, results) {
    const mimeType = file.type.toLowerCase();
    
    if (!mimeType) {
      results.warnings.push('No MIME type specified');
      return;
    }

    if (!this.allowedMimeTypes.has(mimeType)) {
      results.errors.push(`Unsupported MIME type: ${mimeType}`);
      return;
    }

    results.metadata.validatedMimeType = mimeType;
  }

  /**
   * File signature validation
   */
  async validateFileSignature(file, results) {
    try {
      const header = await this.readFileHeader(file, 12);
      const signature = this.bytesToHex(header).toLowerCase();
      
      // Check common signatures
      let detectedType = null;
      
      // Check exact signatures first
      for (const [sig, type] of Object.entries(FILE_SIGNATURES)) {
        if (signature.startsWith(sig)) {
          detectedType = type;
          break;
        }
      }
      
      // Special case for WebP (RIFF + WEBP)
      if (signature.startsWith('52494646') && signature.includes('57454250')) {
        detectedType = 'image/webp';
      }
      
      if (detectedType) {
        results.metadata.detectedMimeType = detectedType;
        
        // Check if detected type matches declared type
        if (file.type && detectedType !== file.type.toLowerCase()) {
          results.warnings.push(
            `MIME type mismatch: declared ${file.type}, detected ${detectedType}`
          );
        }
      } else {
        results.warnings.push('Could not detect file type from signature');
      }
      
    } catch (error) {
      results.warnings.push(`Could not validate file signature: ${error.message}`);
    }
  }

  /**
   * Rate limiting validation
   */
  validateRateLimit(results) {
    const now = Date.now();
    const clientId = 'default'; // In production, use actual client identification
    
    if (!rateLimitStore.has(clientId)) {
      rateLimitStore.set(clientId, {
        filesLastMinute: [],
        filesLastHour: [],
        bytesLastHour: 0,
        lastReset: now
      });
    }
    
    const limits = rateLimitStore.get(clientId);
    
    // Clean old entries
    limits.filesLastMinute = limits.filesLastMinute.filter(
      timestamp => now - timestamp < 60000
    );
    limits.filesLastHour = limits.filesLastHour.filter(
      timestamp => now - timestamp < 3600000
    );
    
    // Reset bytes counter every hour
    if (now - limits.lastReset > 3600000) {
      limits.bytesLastHour = 0;
      limits.lastReset = now;
    }
    
    // Check limits
    if (limits.filesLastMinute.length >= this.rateLimits.filesPerMinute) {
      results.errors.push('Rate limit exceeded: too many files per minute');
    }
    
    if (limits.filesLastHour.length >= this.rateLimits.filesPerHour) {
      results.errors.push('Rate limit exceeded: too many files per hour');
    }
    
    if (limits.bytesLastHour >= this.rateLimits.bytesPerHour) {
      results.errors.push('Rate limit exceeded: too many bytes per hour');
    }
    
    // Update counters if validation passes
    if (results.errors.length === 0) {
      limits.filesLastMinute.push(now);
      limits.filesLastHour.push(now);
    }
  }

  /**
   * Filename validation
   */
  validateFilename(filename, results) {
    if (!filename) {
      results.errors.push('No filename provided');
      return;
    }

    // Check for dangerous characters
    // eslint-disable-next-line no-control-regex
    const dangerousChars = /[<>:"|?*\x00-\x1f]/;
    if (dangerousChars.test(filename)) {
      results.threats.push('Filename contains potentially dangerous characters');
    }

    // Check for path traversal attempts
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      results.threats.push('Potential path traversal attempt detected');
    }

    // Check filename length
    if (filename.length > 255) {
      results.errors.push('Filename too long (max 255 characters)');
    }

    // Sanitize filename
    // eslint-disable-next-line no-control-regex
    const sanitized = filename.replace(/[<>:"|?*\x00-\x1f]/g, '')
                              .replace(/\.\./g, '')
                              .replace(/[/\\]/g, '');
    
    results.metadata.sanitizedFilename = sanitized;
  }

  /**
   * File size validation
   */
  validateFileSize(size, results) {
    if (size > this.maxFileSize) {
      results.errors.push(
        `File too large: ${this.formatBytes(size)} (max: ${this.formatBytes(this.maxFileSize)})`
      );
    }

    if (size === 0) {
      results.errors.push('File is empty');
    }
  }

  /**
   * Image dimensions validation
   */
  async validateImageDimensions(file, results) {
    try {
      const dimensions = await this.getImageDimensions(file);
      
      if (dimensions) {
        results.metadata.dimensions = dimensions;
        
        const { width, height } = dimensions;
        const pixels = width * height;
        
        if (width > this.maxDimensions.width || height > this.maxDimensions.height) {
          results.errors.push(
            `Image dimensions too large: ${width}x${height} (max: ${this.maxDimensions.width}x${this.maxDimensions.height})`
          );
        }
        
        if (pixels > this.maxPixels) {
          results.errors.push(
            `Too many pixels: ${pixels.toLocaleString()} (max: ${this.maxPixels.toLocaleString()})`
          );
        }
      }
    } catch (error) {
      results.warnings.push(`Could not validate image dimensions: ${error.message}`);
    }
  }

  /**
   * Read file header bytes
   */
  async readFileHeader(file, numBytes = 12) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const arrayBuffer = reader.result;
        const bytes = new Uint8Array(arrayBuffer);
        resolve(bytes);
      };
      
      reader.onerror = () => reject(new Error('Failed to read file header'));
      
      const blob = file.slice(0, numBytes);
      reader.readAsArrayBuffer(blob);
    });
  }

  /**
   * Convert bytes to hex string
   */
  bytesToHex(bytes) {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Get image dimensions
   */
  async getImageDimensions(file) {
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
        URL.revokeObjectURL(img.src);
      };
      
      img.onerror = () => resolve(null);
      
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Format bytes for display
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Sanitize image metadata (remove EXIF data)
   */
  async sanitizeImage(file) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        // Draw image to canvas (strips metadata)
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            // Create new file with sanitized data
            const sanitizedFile = new File([blob], file.name, {
              type: blob.type,
              lastModified: Date.now()
            });
            resolve(sanitizedFile);
          } else {
            reject(new Error('Failed to sanitize image'));
          }
        }, file.type, 0.95);
        
        URL.revokeObjectURL(img.src);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image for sanitization'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Get security report summary
   */
  getSecuritySummary(validationResult) {
    const { errors, warnings, threats, metadata } = validationResult;
    
    return {
      securityLevel: this.calculateSecurityLevel(errors, warnings, threats),
      totalIssues: errors.length + warnings.length + threats.length,
      criticalIssues: errors.length,
      warnings: warnings.length,
      threats: threats.length,
      isSecure: errors.length === 0 && threats.length === 0,
      metadata
    };
  }

  /**
   * Calculate security level
   */
  calculateSecurityLevel(errors, warnings, threats) {
    if (errors.length > 0 || threats.length > 0) {
      return 'high-risk';
    }
    if (warnings.length > 2) {
      return 'medium-risk';
    }
    if (warnings.length > 0) {
      return 'low-risk';
    }
    return 'secure';
  }
}

// Create singleton instance
const securityValidator = new SecurityValidator();

// Additional utility functions for compatibility
export const validateImageFile = (file, options = {}) => securityValidator.validateFile(file);
export const validateImageDimensions = (file) => securityValidator.validateImageDimensions(file, { errors: [], warnings: [], threats: [], metadata: {} });
export const getRateLimitStatus = () => ({ allowed: true, remaining: 100 });

// Export
export { securityValidator, SecurityValidator };
export default securityValidator;