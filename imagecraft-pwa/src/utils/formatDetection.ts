/**
 * Comprehensive RAW Format Detection and Validation Utilities
 * Provides type-safe, robust detection of RAW camera formats with fallback mechanisms
 */

import type {
  AllImageFormats,
  RawImageFormat,
  SupportedImageFormat,
  FileFormatDetectionResult,
  RawValidationResult,
  FormatValidationConfig,
  FormatInfo,
  FormatCapabilities,
  RawConversionOptions,
  ImageMimeType
} from '../types/imageFormats';

import {
  isRawFormat,
  isSupportedFormat,
  isValidImageFormat,
  RAW_FILE_EXTENSIONS,
  RAW_MIME_TYPES,
  STANDARD_MIME_TYPES,
  DEFAULT_VALIDATION_CONFIG
} from '../types/imageFormats';

/**
 * Comprehensive RAW format detector with multiple validation methods
 */
export class RawFormatDetector {
  private readonly config: FormatValidationConfig;

  constructor(config: Partial<FormatValidationConfig> = {}) {
    this.config = { ...DEFAULT_VALIDATION_CONFIG, ...config };
  }

  /**
   * Detect if a file is a RAW format with comprehensive validation
   */
  public async detectFormat(file: File): Promise<FileFormatDetectionResult> {
    const warnings: string[] = [];
    const errors: string[] = [];
    
    try {
      // Security validation
      if (this.config.securityValidation) {
        const securityResult = this.validateFileSecurity(file);
        if (!securityResult.isValid) {
          return {
            isValid: false,
            isRaw: false,
            detectedFormat: null,
            confidence: 'low',
            detectionMethod: 'unknown',
            warnings: securityResult.warnings,
            errors: securityResult.errors
          };
        }
        warnings.push(...securityResult.warnings);
      }

      // Method 1: MIME type detection (most reliable when available)
      const mimeResult = this.detectByMimeType(file);
      if (mimeResult.detectedFormat) {
        return {
          isValid: true,
          isRaw: isRawFormat(mimeResult.detectedFormat),
          detectedFormat: mimeResult.detectedFormat,
          confidence: 'high',
          detectionMethod: 'mime-type',
          warnings,
          errors
        };
      }

      // Method 2: File extension detection (fallback for RAW files)
      if (this.config.allowExtensionFallback) {
        const extensionResult = this.detectByExtension(file);
        if (extensionResult.detectedFormat) {
          if (mimeResult.detectedFormat && mimeResult.detectedFormat !== extensionResult.detectedFormat) {
            warnings.push(
              `MIME type suggests ${mimeResult.detectedFormat} but extension suggests ${extensionResult.detectedFormat}. Using extension-based detection.`
            );
          }
          
          return {
            isValid: true,
            isRaw: isRawFormat(extensionResult.detectedFormat),
            detectedFormat: extensionResult.detectedFormat,
            confidence: mimeResult.detectedFormat ? 'medium' : 'high',
            detectionMethod: 'extension',
            warnings,
            errors
          };
        }
      }

      // Method 3: File signature detection (future enhancement)
      if (this.config.requireFileSignature) {
        const signatureResult = await this.detectByFileSignature(file);
        if (signatureResult.detectedFormat) {
          return {
            isValid: true,
            isRaw: isRawFormat(signatureResult.detectedFormat),
            detectedFormat: signatureResult.detectedFormat,
            confidence: 'high',
            detectionMethod: 'signature',
            warnings,
            errors
          };
        }
      }

      // No valid format detected
      errors.push('Unable to detect valid image format');
      return {
        isValid: false,
        isRaw: false,
        detectedFormat: null,
        confidence: 'low',
        detectionMethod: 'unknown',
        warnings,
        errors
      };

    } catch (error) {
      errors.push(`Format detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        isValid: false,
        isRaw: false,
        detectedFormat: null,
        confidence: 'low',
        detectionMethod: 'unknown',
        warnings,
        errors
      };
    }
  }

  /**
   * Specific RAW format validation with conversion options
   */
  public async validateRawFile(file: File): Promise<RawValidationResult> {
    const formatResult = await this.detectFormat(file);
    
    if (!formatResult.isValid) {
      return {
        isRawFile: false,
        detectedRawFormat: null,
        canConvert: false,
        supportedOutputFormats: [],
        recommendedOutputFormat: 'jpeg',
        validationErrors: formatResult.errors,
        securityWarnings: formatResult.warnings
      };
    }

    const isRaw = formatResult.isRaw && formatResult.detectedFormat;
    const rawFormat = isRaw ? formatResult.detectedFormat as RawImageFormat : null;

    return {
      isRawFile: isRaw,
      detectedRawFormat: rawFormat,
      canConvert: isRaw, // RAW files can always be converted to JPEG/PNG
      supportedOutputFormats: isRaw ? ['jpeg', 'png'] : [],
      recommendedOutputFormat: isRaw ? 'jpeg' : 'jpeg', // JPEG is usually best for photos
      validationErrors: formatResult.errors,
      securityWarnings: formatResult.warnings
    };
  }

  /**
   * Get available output formats for a given input file
   */
  public async getAvailableOutputFormats(file: File): Promise<SupportedImageFormat[]> {
    const formatResult = await this.detectFormat(file);
    
    if (!formatResult.isValid) {
      return [];
    }

    // Standard formats (all browsers support these)
    const baseFormats: SupportedImageFormat[] = ['jpeg', 'png'];
    
    // Add modern formats based on browser support
    const modernFormats: SupportedImageFormat[] = ['webp', 'avif'];
    
    // Add other formats
    const additionalFormats: SupportedImageFormat[] = ['bmp', 'gif', 'tiff'];
    
    return [...baseFormats, ...modernFormats, ...additionalFormats];
  }

  /**
   * Check if format conversion is valid
   */
  public validateFormatConversion(
    inputFile: File, 
    outputFormat: string,
    formatResult?: FileFormatDetectionResult
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate output format
    if (!isSupportedFormat(outputFormat)) {
      errors.push(`Unsupported output format: ${outputFormat}`);
      return { isValid: false, errors, warnings };
    }

    // If we have format detection result, use it
    if (formatResult) {
      if (formatResult.isRaw) {
        // RAW files can only convert to JPEG or PNG
        if (outputFormat !== 'jpeg' && outputFormat !== 'png') {
          errors.push(`RAW files can only be converted to JPEG or PNG. ${outputFormat.toUpperCase()} is not supported.`);
          return { isValid: false, errors, warnings };
        }
        
        if (outputFormat === 'png') {
          warnings.push('Converting RAW to PNG may result in larger file sizes. JPEG is recommended for RAW photos.');
        }
      }
    }

    return { isValid: true, errors, warnings };
  }

  /**
   * Detect format by MIME type
   */
  private detectByMimeType(file: File): { detectedFormat: AllImageFormats | null } {
    const mimeType = file.type.toLowerCase() as ImageMimeType;
    
    // Check RAW MIME types first
    if (RAW_MIME_TYPES.includes(mimeType as any)) {
      // Map MIME type to format
      const rawMimeMap: Record<string, RawImageFormat> = {
        'image/x-canon-cr2': 'cr2',
        'image/x-canon-cr3': 'cr3',
        'image/x-canon-crw': 'cr2',
        'image/x-nikon-nef': 'nef',
        'image/x-sony-arw': 'arw',
        'image/x-adobe-dng': 'dng',
        'image/x-olympus-orf': 'orf',
        'image/x-panasonic-rw2': 'rw2',
        'image/x-panasonic-raw': 'rw2',
        'image/x-fuji-raf': 'raf',
        'image/x-pentax-pef': 'pef',
        'image/x-samsung-srw': 'srw',
        'image/x-sigma-x3f': 'x3f'
      };
      
      return { detectedFormat: rawMimeMap[mimeType] || null };
    }
    
    // Check standard MIME types
    if (STANDARD_MIME_TYPES.includes(mimeType as any)) {
      const standardMimeMap: Record<string, SupportedImageFormat> = {
        'image/jpeg': 'jpeg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/avif': 'avif',
        'image/bmp': 'bmp',
        'image/gif': 'gif',
        'image/tiff': 'tiff',
        'image/tif': 'tif'
      };
      
      return { detectedFormat: standardMimeMap[mimeType] || null };
    }
    
    return { detectedFormat: null };
  }

  /**
   * Detect format by file extension
   */
  private detectByExtension(file: File): { detectedFormat: AllImageFormats | null } {
    const fileName = file.name || '';
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    if (isValidImageFormat(extension)) {
      return { detectedFormat: extension };
    }
    
    return { detectedFormat: null };
  }

  /**
   * Detect format by file signature (binary header)
   * This is a placeholder for future implementation
   */
  private async detectByFileSignature(file: File): Promise<{ detectedFormat: AllImageFormats | null }> {
    // This would read the first few bytes of the file to detect format
    // Implementation would require reading file as ArrayBuffer and checking binary signatures
    // For now, return null to indicate signature detection is not implemented
    return { detectedFormat: null };
  }

  /**
   * Validate file security constraints
   */
  private validateFileSecurity(file: File): { 
    isValid: boolean; 
    warnings: string[]; 
    errors: string[] 
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // File size validation
    if (file.size > this.config.maxFileSize) {
      errors.push(
        `File size ${Math.round(file.size / 1024 / 1024)}MB exceeds maximum allowed ${Math.round(this.config.maxFileSize / 1024 / 1024)}MB`
      );
    }

    // File name validation
    if (!file.name || file.name.length === 0) {
      warnings.push('File has no name - format detection may be limited');
    }

    // Suspicious file name patterns
    const suspiciousPatterns = ['.exe', '.scr', '.bat', '.cmd', '.com'];
    const fileName = file.name?.toLowerCase() || '';
    
    for (const pattern of suspiciousPatterns) {
      if (fileName.includes(pattern)) {
        errors.push(`File name contains suspicious pattern: ${pattern}`);
      }
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }
}

/**
 * Get format information for display purposes
 */
export function getFormatInfo(format: AllImageFormats): FormatInfo {
  const formatInfoMap: Record<AllImageFormats, FormatInfo> = {
    // Standard formats
    jpeg: {
      id: 'jpeg',
      name: 'JPEG',
      description: 'Best for photos, smaller file sizes',
      details: 'Ideal for photographs and images with many colors. Compressed format.',
      icon: '📷',
      popular: true,
      capabilities: {
        supportsTransparency: false,
        supportsAnimation: false,
        supportsQuality: true,
        compressionType: 'lossy',
        isRawFormat: false,
        canConvertTo: ['png', 'webp', 'avif', 'bmp', 'gif'],
        browserSupport: 'universal'
      },
      fileExtensions: ['jpg', 'jpeg'],
      mimeTypes: ['image/jpeg']
    },
    jpg: {
      id: 'jpg',
      name: 'JPEG',
      description: 'Best for photos, smaller file sizes',
      details: 'Ideal for photographs and images with many colors. Compressed format.',
      icon: '📷',
      popular: true,
      capabilities: {
        supportsTransparency: false,
        supportsAnimation: false,
        supportsQuality: true,
        compressionType: 'lossy',
        isRawFormat: false,
        canConvertTo: ['png', 'webp', 'avif', 'bmp', 'gif'],
        browserSupport: 'universal'
      },
      fileExtensions: ['jpg', 'jpeg'],
      mimeTypes: ['image/jpeg']
    },
    png: {
      id: 'png',
      name: 'PNG',
      description: 'Best for graphics, supports transparency',
      details: 'Perfect for logos, graphics, and images needing transparent backgrounds.',
      icon: '🖼️',
      popular: true,
      capabilities: {
        supportsTransparency: true,
        supportsAnimation: false,
        supportsQuality: false,
        compressionType: 'lossless',
        isRawFormat: false,
        canConvertTo: ['jpeg', 'webp', 'avif', 'bmp', 'gif'],
        browserSupport: 'universal'
      },
      fileExtensions: ['png'],
      mimeTypes: ['image/png']
    },
    webp: {
      id: 'webp',
      name: 'WebP',
      description: 'Modern web format, great compression',
      details: 'Google\'s format with excellent compression and quality balance.',
      icon: '🌐',
      popular: true,
      capabilities: {
        supportsTransparency: true,
        supportsAnimation: true,
        supportsQuality: true,
        compressionType: 'both',
        isRawFormat: false,
        canConvertTo: ['jpeg', 'png', 'avif'],
        browserSupport: 'modern'
      },
      fileExtensions: ['webp'],
      mimeTypes: ['image/webp']
    },
    avif: {
      id: 'avif',
      name: 'AVIF',
      description: 'Next-gen format, superior compression',
      details: 'Latest format with the best compression and quality available.',
      icon: '⚡',
      popular: false,
      capabilities: {
        supportsTransparency: true,
        supportsAnimation: true,
        supportsQuality: true,
        compressionType: 'both',
        isRawFormat: false,
        canConvertTo: ['jpeg', 'png', 'webp'],
        browserSupport: 'modern'
      },
      fileExtensions: ['avif'],
      mimeTypes: ['image/avif']
    },
    bmp: {
      id: 'bmp',
      name: 'BMP',
      description: 'Uncompressed bitmap format',
      details: 'Large file sizes but no quality loss. Rarely used today.',
      icon: '💾',
      popular: false,
      capabilities: {
        supportsTransparency: false,
        supportsAnimation: false,
        supportsQuality: false,
        compressionType: 'none',
        isRawFormat: false,
        canConvertTo: ['jpeg', 'png', 'webp'],
        browserSupport: 'universal'
      },
      fileExtensions: ['bmp'],
      mimeTypes: ['image/bmp']
    },
    gif: {
      id: 'gif',
      name: 'GIF',
      description: 'For simple animations',
      details: 'Limited to 256 colors, mainly used for simple animations.',
      icon: '🎭',
      popular: false,
      capabilities: {
        supportsTransparency: true,
        supportsAnimation: true,
        supportsQuality: false,
        compressionType: 'lossless',
        isRawFormat: false,
        canConvertTo: ['jpeg', 'png', 'webp'],
        browserSupport: 'universal'
      },
      fileExtensions: ['gif'],
      mimeTypes: ['image/gif']
    },
    tiff: {
      id: 'tiff',
      name: 'TIFF',
      description: 'Professional archival quality',
      details: 'Uncompressed or lossless format used in professional photography.',
      icon: '🎯',
      popular: false,
      capabilities: {
        supportsTransparency: true,
        supportsAnimation: false,
        supportsQuality: false,
        compressionType: 'lossless',
        isRawFormat: false,
        canConvertTo: ['jpeg', 'png', 'webp'],
        browserSupport: 'limited'
      },
      fileExtensions: ['tiff', 'tif'],
      mimeTypes: ['image/tiff']
    },
    tif: {
      id: 'tif',
      name: 'TIFF',
      description: 'Professional archival quality',
      details: 'Uncompressed or lossless format used in professional photography.',
      icon: '🎯',
      popular: false,
      capabilities: {
        supportsTransparency: true,
        supportsAnimation: false,
        supportsQuality: false,
        compressionType: 'lossless',
        isRawFormat: false,
        canConvertTo: ['jpeg', 'png', 'webp'],
        browserSupport: 'limited'
      },
      fileExtensions: ['tiff', 'tif'],
      mimeTypes: ['image/tiff']
    },
    // RAW formats
    cr2: {
      id: 'cr2',
      name: 'Canon RAW (CR2)',
      description: 'Canon Digital Camera RAW format',
      details: 'Canon\'s RAW format containing unprocessed sensor data with maximum image quality.',
      icon: '📸',
      popular: false,
      capabilities: {
        supportsTransparency: false,
        supportsAnimation: false,
        supportsQuality: false,
        compressionType: 'none',
        isRawFormat: true,
        canConvertTo: ['jpeg', 'png'],
        browserSupport: 'none'
      },
      fileExtensions: ['cr2'],
      mimeTypes: ['image/x-canon-cr2']
    },
    cr3: {
      id: 'cr3',
      name: 'Canon RAW (CR3)',
      description: 'Canon Digital Camera RAW format v3',
      details: 'Canon\'s newer RAW format with improved compression and features.',
      icon: '📸',
      popular: false,
      capabilities: {
        supportsTransparency: false,
        supportsAnimation: false,
        supportsQuality: false,
        compressionType: 'none',
        isRawFormat: true,
        canConvertTo: ['jpeg', 'png'],
        browserSupport: 'none'
      },
      fileExtensions: ['cr3'],
      mimeTypes: ['image/x-canon-cr3']
    },
    nef: {
      id: 'nef',
      name: 'Nikon RAW (NEF)',
      description: 'Nikon Electronic Format RAW',
      details: 'Nikon\'s RAW format preserving all original sensor information.',
      icon: '📸',
      popular: false,
      capabilities: {
        supportsTransparency: false,
        supportsAnimation: false,
        supportsQuality: false,
        compressionType: 'none',
        isRawFormat: true,
        canConvertTo: ['jpeg', 'png'],
        browserSupport: 'none'
      },
      fileExtensions: ['nef'],
      mimeTypes: ['image/x-nikon-nef']
    },
    arw: {
      id: 'arw',
      name: 'Sony RAW (ARW)',
      description: 'Sony Alpha RAW format',
      details: 'Sony\'s RAW format used in Alpha series cameras.',
      icon: '📸',
      popular: false,
      capabilities: {
        supportsTransparency: false,
        supportsAnimation: false,
        supportsQuality: false,
        compressionType: 'none',
        isRawFormat: true,
        canConvertTo: ['jpeg', 'png'],
        browserSupport: 'none'
      },
      fileExtensions: ['arw'],
      mimeTypes: ['image/x-sony-arw']
    },
    dng: {
      id: 'dng',
      name: 'Adobe DNG',
      description: 'Adobe Digital Negative',
      details: 'Adobe\'s open standard RAW format, widely supported.',
      icon: '📸',
      popular: false,
      capabilities: {
        supportsTransparency: false,
        supportsAnimation: false,
        supportsQuality: false,
        compressionType: 'none',
        isRawFormat: true,
        canConvertTo: ['jpeg', 'png'],
        browserSupport: 'none'
      },
      fileExtensions: ['dng'],
      mimeTypes: ['image/x-adobe-dng']
    },
    orf: {
      id: 'orf',
      name: 'Olympus RAW (ORF)',
      description: 'Olympus RAW Format',
      details: 'Olympus cameras\' RAW format with high image quality.',
      icon: '📸',
      popular: false,
      capabilities: {
        supportsTransparency: false,
        supportsAnimation: false,
        supportsQuality: false,
        compressionType: 'none',
        isRawFormat: true,
        canConvertTo: ['jpeg', 'png'],
        browserSupport: 'none'
      },
      fileExtensions: ['orf'],
      mimeTypes: ['image/x-olympus-orf']
    },
    rw2: {
      id: 'rw2',
      name: 'Panasonic RAW (RW2)',
      description: 'Panasonic RAW format',
      details: 'Panasonic Lumix cameras\' RAW format.',
      icon: '📸',
      popular: false,
      capabilities: {
        supportsTransparency: false,
        supportsAnimation: false,
        supportsQuality: false,
        compressionType: 'none',
        isRawFormat: true,
        canConvertTo: ['jpeg', 'png'],
        browserSupport: 'none'
      },
      fileExtensions: ['rw2'],
      mimeTypes: ['image/x-panasonic-rw2']
    },
    raf: {
      id: 'raf',
      name: 'Fujifilm RAW (RAF)',
      description: 'Fujifilm RAW format',
      details: 'Fujifilm cameras\' RAW format with unique color science.',
      icon: '📸',
      popular: false,
      capabilities: {
        supportsTransparency: false,
        supportsAnimation: false,
        supportsQuality: false,
        compressionType: 'none',
        isRawFormat: true,
        canConvertTo: ['jpeg', 'png'],
        browserSupport: 'none'
      },
      fileExtensions: ['raf'],
      mimeTypes: ['image/x-fuji-raf']
    },
    pef: {
      id: 'pef',
      name: 'Pentax RAW (PEF)',
      description: 'Pentax Electronic Format',
      details: 'Pentax cameras\' RAW format.',
      icon: '📸',
      popular: false,
      capabilities: {
        supportsTransparency: false,
        supportsAnimation: false,
        supportsQuality: false,
        compressionType: 'none',
        isRawFormat: true,
        canConvertTo: ['jpeg', 'png'],
        browserSupport: 'none'
      },
      fileExtensions: ['pef'],
      mimeTypes: ['image/x-pentax-pef']
    },
    srw: {
      id: 'srw',
      name: 'Samsung RAW (SRW)',
      description: 'Samsung RAW format',
      details: 'Samsung cameras\' RAW format.',
      icon: '📸',
      popular: false,
      capabilities: {
        supportsTransparency: false,
        supportsAnimation: false,
        supportsQuality: false,
        compressionType: 'none',
        isRawFormat: true,
        canConvertTo: ['jpeg', 'png'],
        browserSupport: 'none'
      },
      fileExtensions: ['srw'],
      mimeTypes: ['image/x-samsung-srw']
    },
    x3f: {
      id: 'x3f',
      name: 'Sigma RAW (X3F)',
      description: 'Sigma X3F RAW format',
      details: 'Sigma cameras\' unique RAW format.',
      icon: '📸',
      popular: false,
      capabilities: {
        supportsTransparency: false,
        supportsAnimation: false,
        supportsQuality: false,
        compressionType: 'none',
        isRawFormat: true,
        canConvertTo: ['jpeg', 'png'],
        browserSupport: 'none'
      },
      fileExtensions: ['x3f'],
      mimeTypes: ['image/x-sigma-x3f']
    },
    raw: {
      id: 'raw',
      name: 'Generic RAW',
      description: 'Generic RAW image format',
      details: 'Generic RAW format that may need specific handling.',
      icon: '📸',
      popular: false,
      capabilities: {
        supportsTransparency: false,
        supportsAnimation: false,
        supportsQuality: false,
        compressionType: 'none',
        isRawFormat: true,
        canConvertTo: ['jpeg', 'png'],
        browserSupport: 'none'
      },
      fileExtensions: ['raw'],
      mimeTypes: []
    }
  };

  return formatInfoMap[format];
}

/**
 * Create a default RAW format detector instance
 */
export const createRawDetector = (config?: Partial<FormatValidationConfig>): RawFormatDetector => {
  return new RawFormatDetector(config);
};

/**
 * Quick utility functions for common use cases
 */
export const isFileRawFormat = async (file: File): Promise<boolean> => {
  const detector = createRawDetector();
  const result = await detector.detectFormat(file);
  return result.isRaw;
};

export const getRawConversionOptions = (rawFormat: RawImageFormat): RawConversionOptions => {
  return {
    outputFormat: 'jpeg', // Default to JPEG for best compatibility
    quality: 0.9, // High quality for RAW conversions
    preserveMetadata: true,
    colorSpace: 'sRGB' // sRGB for web compatibility
  };
};

export const validateRawConversion = async (
  file: File, 
  outputFormat: string
): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> => {
  const detector = createRawDetector();
  return detector.validateFormatConversion(file, outputFormat);
};