/**
 * Format Detection Utility - JavaScript Compatible Version
 * Provides comprehensive image format detection and validation with TypeScript compatibility
 */

// Import type guards from the compiled TypeScript
import { 
  isRawFormat as tsIsRawFormat, 
  isStandardFormat as tsIsStandardFormat,
  isSupportedFormat as tsIsSupportedFormat 
} from '../types/imageFormats.ts';

// RAW format MIME types (browsers may not always set these correctly)
const RAW_MIME_TYPES = new Set([
  'image/x-canon-cr2',
  'image/x-canon-cr3', 
  'image/x-canon-crw',
  'image/x-nikon-nef',
  'image/x-sony-arw',
  'image/x-sony-srf',
  'image/x-olympus-orf',
  'image/x-panasonic-rw2',
  'image/x-fuji-raf',
  'image/x-pentax-pef',
  'image/x-samsung-srw',
  'image/x-adobe-dng',
  'image/x-sigma-x3f',
  'image/raw',
  'application/octet-stream' // Fallback for unknown RAW files
]);

// RAW format file extensions
const RAW_EXTENSIONS = new Set([
  'cr2', 'cr3', 'crw',  // Canon
  'nef', 'nrw',         // Nikon
  'arw', 'srf', 'sr2',  // Sony
  'orf',                // Olympus
  'rw2',                // Panasonic
  'raf',                // Fujifilm
  'pef', 'ptx',         // Pentax
  'srw',                // Samsung
  'dng',                // Adobe Digital Negative
  'x3f',                // Sigma
  'raw',                // Generic RAW
  'rwl',                // Leica
  '3fr',                // Hasselblad
  'ari',                // ARRI
  'bay',                // Casio
  'braw',               // Blackmagic
  'cri',                // Cintel
  'crw',                // Canon (old)
  'dcr',                // Kodak
  'dcs',                // Kodak
  'erf',                // Epson
  'fff',                // Imacon
  'gpr',                // GoPro
  'iiq',                // Phase One
  'kdc',                // Kodak
  'mdc',                // Minolta
  'mef',                // Mamiya
  'mos',                // Leaf
  'mrw',                // Minolta
  'nksc',               // Nikon
  'r3d',                // RED
  'raf',                // Fujifilm
  'raw',                // Panasonic/Leica
  'rdc',                // Ricoh
  'rwz'                 // Rawzor
]);

// Standard image format MIME types
const STANDARD_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/bmp',
  'image/svg+xml',
  'image/tiff',
  'image/x-icon'
]);

/**
 * RAW Format Detector Class
 * Provides comprehensive RAW file detection and validation
 */
class RawFormatDetector {
  constructor() {
    this.rawMimeTypes = RAW_MIME_TYPES;
    this.rawExtensions = RAW_EXTENSIONS;
    this.standardMimeTypes = STANDARD_MIME_TYPES;
  }

  /**
   * Check if a file is a RAW format
   * @param {File} file - The file to check
   * @returns {boolean} - True if the file is a RAW format
   */
  isRawFile(file) {
    if (!file) return false;

    // Check MIME type first
    if (this.isRawMimeType(file.type)) {
      return true;
    }

    // Fallback to file extension check
    const extension = this.getFileExtension(file.name);
    return this.isRawExtension(extension);
  }

  /**
   * Check if a MIME type indicates a RAW format
   * @param {string} mimeType - The MIME type to check
   * @returns {boolean} - True if the MIME type is for a RAW format
   */
  isRawMimeType(mimeType) {
    if (!mimeType) return false;
    return this.rawMimeTypes.has(mimeType.toLowerCase());
  }

  /**
   * Check if a file extension indicates a RAW format
   * @param {string} extension - The file extension to check (without dot)
   * @returns {boolean} - True if the extension is for a RAW format
   */
  isRawExtension(extension) {
    if (!extension) return false;
    return this.rawExtensions.has(extension.toLowerCase());
  }

  /**
   * Get file extension from filename
   * @param {string} filename - The filename
   * @returns {string} - The file extension (without dot)
   */
  getFileExtension(filename) {
    if (!filename) return '';
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.slice(lastDot + 1) : '';
  }

  /**
   * Check if a file is a standard image format
   * @param {File} file - The file to check
   * @returns {boolean} - True if the file is a standard image format
   */
  isStandardImageFile(file) {
    if (!file) return false;
    return this.standardMimeTypes.has(file.type.toLowerCase());
  }

  /**
   * Get detailed format information for a file
   * @param {File} file - The file to analyze
   * @returns {Object} - Detailed format information
   */
  getFormatInfo(file) {
    if (!file) {
      return {
        isRaw: false,
        isStandard: false,
        mimeType: null,
        extension: null,
        formatName: 'unknown'
      };
    }

    const extension = this.getFileExtension(file.name);
    const isRaw = this.isRawFile(file);
    const isStandard = this.isStandardImageFile(file);

    return {
      isRaw,
      isStandard,
      mimeType: file.type,
      extension,
      formatName: this.getFormatName(file, isRaw, isStandard),
      size: file.size,
      lastModified: file.lastModified
    };
  }

  /**
   * Get human-readable format name
   * @param {File} file - The file
   * @param {boolean} isRaw - Whether the file is RAW
   * @param {boolean} isStandard - Whether the file is standard image
   * @returns {string} - Human-readable format name
   */
  getFormatName(file, isRaw, isStandard) {
    if (isRaw) {
      const extension = this.getFileExtension(file.name).toLowerCase();
      const rawFormats = {
        'cr2': 'Canon RAW (CR2)',
        'cr3': 'Canon RAW (CR3)',
        'nef': 'Nikon RAW (NEF)',
        'arw': 'Sony RAW (ARW)',
        'orf': 'Olympus RAW (ORF)',
        'rw2': 'Panasonic RAW (RW2)',
        'raf': 'Fujifilm RAW (RAF)',
        'pef': 'Pentax RAW (PEF)',
        'srw': 'Samsung RAW (SRW)',
        'dng': 'Adobe Digital Negative (DNG)',
        'x3f': 'Sigma RAW (X3F)'
      };
      return rawFormats[extension] || `RAW (${extension.toUpperCase()})`;
    }

    if (isStandard) {
      const mimeType = file.type.toLowerCase();
      const standardFormats = {
        'image/jpeg': 'JPEG',
        'image/jpg': 'JPEG',
        'image/png': 'PNG',
        'image/gif': 'GIF',
        'image/webp': 'WebP',
        'image/avif': 'AVIF',
        'image/bmp': 'BMP',
        'image/svg+xml': 'SVG',
        'image/tiff': 'TIFF'
      };
      return standardFormats[mimeType] || 'Standard Image';
    }

    return 'Unknown Format';
  }

  /**
   * Validate RAW file and provide conversion options
   * @param {File} file - The file to validate
   * @returns {Promise<Object>} - RAW validation result
   */
  async validateRawFile(file) {
    if (!file) {
      return {
        isRawFile: false,
        detectedRawFormat: null,
        canConvert: false,
        supportedOutputFormats: [],
        recommendedOutputFormat: 'jpeg',
        validationErrors: ['No file provided'],
        securityWarnings: []
      };
    }

    const formatInfo = this.getFormatInfo(file);
    const isRaw = formatInfo.isRaw;
    const rawFormat = isRaw ? formatInfo.extension : null;

    return {
      isRawFile: isRaw,
      detectedRawFormat: rawFormat,
      canConvert: isRaw,
      supportedOutputFormats: isRaw ? ['jpeg', 'png'] : [],
      recommendedOutputFormat: isRaw ? 'jpeg' : 'jpeg',
      validationErrors: [],
      securityWarnings: []
    };
  }

  /**
   * Detect format with comprehensive analysis
   * @param {File} file - The file to analyze
   * @returns {Promise<Object>} - Format detection result
   */
  async detectFormat(file) {
    if (!file) {
      return {
        isValid: false,
        isRaw: false,
        detectedFormat: null,
        confidence: 'low',
        detectionMethod: 'unknown',
        warnings: ['No file provided'],
        errors: ['No file provided']
      };
    }

    const formatInfo = this.getFormatInfo(file);
    const isValid = formatInfo.isRaw || formatInfo.isStandard;
    
    return {
      isValid,
      isRaw: formatInfo.isRaw,
      detectedFormat: formatInfo.extension,
      confidence: isValid ? 'high' : 'low',
      detectionMethod: formatInfo.mimeType ? 'mime-type' : 'extension',
      warnings: [],
      errors: isValid ? [] : ['Unsupported file format']
    };
  }

  /**
   * Get available output formats for a file
   * @param {File} file - The input file
   * @returns {Promise<Array>} - Available output formats
   */
  async getAvailableOutputFormats(file) {
    if (!file) return [];
    
    const formatInfo = this.getFormatInfo(file);
    
    if (formatInfo.isRaw) {
      // RAW files can only convert to JPEG and PNG
      return ['jpeg', 'png'];
    }
    
    // Standard formats can convert to all supported formats
    return ['jpeg', 'png', 'webp', 'avif', 'bmp', 'gif', 'tiff'];
  }

  /**
   * Validate that a RAW file can be converted to specified output format
   * @param {string} outputFormat - The desired output format
   * @returns {Object} - Validation result with errors if any
   */
  validateRawConversion(outputFormat) {
    const validOutputFormats = ['jpeg', 'jpg', 'png'];
    
    if (!outputFormat) {
      return {
        isValid: false,
        error: 'No output format specified for RAW conversion.',
        suggestedFormats: validOutputFormats,
        message: 'Output format is required for RAW conversion'
      };
    }
    
    const isValid = validOutputFormats.includes(outputFormat.toLowerCase());

    return {
      isValid,
      error: isValid ? null : `RAW files can only be converted to JPEG or PNG formats. ${outputFormat} is not supported for RAW conversion.`,
      suggestedFormats: validOutputFormats,
      message: isValid ? 'Valid RAW conversion format' : 'Invalid output format for RAW files'
    };
  }

  /**
   * Get list of supported RAW formats
   * @returns {Array} - Array of supported RAW format information
   */
  getSupportedRawFormats() {
    return [
      { extension: 'cr2', name: 'Canon RAW (CR2)', manufacturer: 'Canon' },
      { extension: 'cr3', name: 'Canon RAW (CR3)', manufacturer: 'Canon' },
      { extension: 'nef', name: 'Nikon RAW (NEF)', manufacturer: 'Nikon' },
      { extension: 'arw', name: 'Sony RAW (ARW)', manufacturer: 'Sony' },
      { extension: 'orf', name: 'Olympus RAW (ORF)', manufacturer: 'Olympus' },
      { extension: 'rw2', name: 'Panasonic RAW (RW2)', manufacturer: 'Panasonic' },
      { extension: 'raf', name: 'Fujifilm RAW (RAF)', manufacturer: 'Fujifilm' },
      { extension: 'pef', name: 'Pentax RAW (PEF)', manufacturer: 'Pentax' },
      { extension: 'srw', name: 'Samsung RAW (SRW)', manufacturer: 'Samsung' },
      { extension: 'dng', name: 'Adobe Digital Negative (DNG)', manufacturer: 'Adobe' },
      { extension: 'x3f', name: 'Sigma RAW (X3F)', manufacturer: 'Sigma' }
    ];
  }
}

// Create singleton instance
const rawFormatDetector = new RawFormatDetector();

// Additional utility functions for compatibility
export const createRawDetector = () => rawFormatDetector;
export const getFormatInfo = (format) => {
  // Simple format info for string inputs
  if (typeof format === 'string') {
    const formatData = {
      'cr2': { name: 'Canon RAW (CR2)' },
      'cr3': { name: 'Canon RAW (CR3)' },
      'nef': { name: 'Nikon RAW (NEF)' },
      'arw': { name: 'Sony RAW (ARW)' },
      'orf': { name: 'Olympus RAW (ORF)' },
      'rw2': { name: 'Panasonic RAW (RW2)' },
      'raf': { name: 'Fujifilm RAW (RAF)' },
      'pef': { name: 'Pentax RAW (PEF)' },
      'srw': { name: 'Samsung RAW (SRW)' },
      'dng': { name: 'Adobe Digital Negative (DNG)' },
      'x3f': { name: 'Sigma RAW (X3F)' },
      'raw': { name: 'Generic RAW' },
      'jpeg': { name: 'JPEG' },
      'jpg': { name: 'JPEG' },
      'png': { name: 'PNG' },
      'webp': { name: 'WebP' },
      'avif': { name: 'AVIF' },
      'gif': { name: 'GIF' },
      'bmp': { name: 'BMP' },
      'tiff': { name: 'TIFF' }
    };
    return formatData[format.toLowerCase()] || { name: format.toUpperCase() };
  }
  return rawFormatDetector.getFormatInfo(format);
};

export const validateRawConversion = async (file, outputFormat) => {
  const detector = createRawDetector();
  const validation = detector.validateRawConversion(outputFormat);
  
  return {
    isValid: validation.isValid,
    errors: validation.isValid ? [] : [validation.error],
    warnings: []
  };
};

// Type guard functions with fallback to TypeScript versions
export const isRawFormat = (format) => {
  try {
    return tsIsRawFormat(format);
  } catch (error) {
    // Fallback implementation
    return RAW_EXTENSIONS.has(format.toLowerCase());
  }
};

export const isStandardFormat = (format) => {
  try {
    return tsIsStandardFormat(format);
  } catch (error) {
    // Fallback implementation
    const standardFormats = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'avif', 'bmp', 'svg', 'tiff'];
    return standardFormats.includes(format.toLowerCase());
  }
};

export const isSupportedFormat = (format) => {
  try {
    return tsIsSupportedFormat(format);
  } catch (error) {
    // Fallback implementation
    return isStandardFormat(format) || isRawFormat(format);
  }
};

// Export utilities
export { rawFormatDetector, RawFormatDetector };

// Default export
export default rawFormatDetector;