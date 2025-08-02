/**
 * Image Format Type Definitions
 * TypeScript definitions for image format detection and validation
 */

// Supported image formats
export type ImageFormat = 'jpeg' | 'jpg' | 'png' | 'gif' | 'webp' | 'avif' | 'bmp' | 'svg' | 'tiff';

// RAW image formats
export type RawFormat = 'cr2' | 'cr3' | 'nef' | 'arw' | 'orf' | 'rw2' | 'raf' | 'pef' | 'srw' | 'dng' | 'x3f' | 'raw';

// All supported formats
export type SupportedFormat = ImageFormat | RawFormat;

// Format categories
export type FormatCategory = 'standard' | 'raw' | 'modern' | 'legacy';

// MIME type definitions
export interface MimeTypeMapping {
  [key: string]: string;
}

// Legacy format capabilities (keeping for backward compatibility)
export interface LegacyFormatCapabilities {
  supportsTransparency: boolean;
  supportsAnimation: boolean;
  supportsQuality: boolean;
  isLossless: boolean;
  maxDimensions?: {
    width: number;
    height: number;
  };
  supportedBrowsers: string[];
}

// Legacy format information interface
export interface LegacyFormatInfo {
  id: string;
  name: string;
  description: string;
  mimeType: string;
  extensions: string[];
  category: FormatCategory;
  capabilities: LegacyFormatCapabilities;
  popular: boolean;
}

// File validation result
export interface FileValidationResult {
  isValid: boolean;
  format: SupportedFormat | null;
  isRaw: boolean;
  isStandard: boolean;
  errors: string[];
  warnings: string[];
  metadata: FileMetadata;
}

// File metadata interface
export interface FileMetadata {
  originalName: string;
  sanitizedName: string;
  size: number;
  mimeType: string;
  detectedMimeType?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  lastModified: number;
}

// RAW format detection interface
export interface RawDetectionResult {
  isRaw: boolean;
  format: RawFormat | null;
  manufacturer: string | null;
  formatName: string;
  canConvert: boolean;
  suggestedOutputFormats: ImageFormat[];
}

// Format conversion interface
export interface FormatConversionOptions {
  outputFormat: SupportedFormat;
  quality?: number | 'low' | 'medium' | 'high';
  maintainAspectRatio?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  backgroundColor?: string;
}

// Conversion result interface
export interface ConversionResult {
  success?: boolean;
  blob?: Blob;
  outputFormat?: SupportedFormat;
  originalSize?: number;
  outputSize?: number;
  size?: number;
  compressionRatio?: number;
  processingTime?: number;
  error?: string;
  // Extended properties for enhanced conversion results
  originalName?: string;
  width?: number;
  height?: number;
  format?: string;
  actualFormat?: string;
  wasFallback?: boolean;
  isRawConversion?: boolean;
  originalRawFormat?: RawImageFormat | null;
  formatDetectionResult?: FileFormatDetectionResult;
  rawValidationResult?: RawValidationResult;
}

// Security validation interface
export interface SecurityValidationResult {
  isSecure: boolean;
  securityLevel: 'secure' | 'low-risk' | 'medium-risk' | 'high-risk';
  errors: string[];
  warnings: string[];
  threats: string[];
  metadata: SecurityMetadata;
}

// Security metadata interface
export interface SecurityMetadata {
  fileSignatureValid: boolean;
  mimeTypeConsistent: boolean;  
  containsMetadata: boolean;
  hasTransparency: boolean;
  dimensionsValid: boolean;
  sizeValid: boolean;
}

// Browser format support interface
export interface BrowserFormatSupport {
  jpeg: boolean;
  png: boolean;
  gif: boolean;
  webp: boolean;
  avif: boolean;
  bmp: boolean;
  svg: boolean;
  tiff: boolean;
}

// Format detection configuration
export interface FormatDetectionConfig {
  enableSignatureValidation: boolean;
  enableMimeTypeValidation: boolean;
  enableExtensionFallback: boolean;
  strictMode: boolean;
}

// RAW format manufacturer mapping
export interface RawManufacturerMapping {
  [format: string]: {
    manufacturer: string;
    fullName: string;
    commonExtensions: string[];
  };
}

// Additional type definitions needed for enhanced TypeScript support

// All image formats including RAW
export type AllImageFormats = ImageFormat | RawFormat;

// RAW-specific image format type
export type RawImageFormat = RawFormat;

// Supported image format type for standard formats
export type SupportedImageFormat = ImageFormat;

// Image MIME type definitions
export type ImageMimeType = 
  | 'image/jpeg'
  | 'image/jpg'
  | 'image/png'
  | 'image/gif'
  | 'image/webp'
  | 'image/avif'
  | 'image/bmp'
  | 'image/svg+xml'
  | 'image/tiff'
  | 'image/x-canon-cr2'
  | 'image/x-canon-cr3'
  | 'image/x-canon-crw'
  | 'image/x-nikon-nef'
  | 'image/x-sony-arw'
  | 'image/x-adobe-dng'
  | 'image/x-olympus-orf'
  | 'image/x-panasonic-rw2'
  | 'image/x-panasonic-raw'
  | 'image/x-fuji-raf'
  | 'image/x-pentax-pef'
  | 'image/x-samsung-srw'
  | 'image/x-sigma-x3f';

// File format detection result
export interface FileFormatDetectionResult {
  isValid: boolean;
  isRaw: boolean;
  detectedFormat: AllImageFormats | null;
  confidence: 'low' | 'medium' | 'high';
  detectionMethod: 'mime-type' | 'extension' | 'signature' | 'unknown';
  warnings: string[];
  errors: string[];
}

// RAW validation result
export interface RawValidationResult {
  isRawFile: boolean;
  detectedRawFormat: RawImageFormat | null;
  canConvert: boolean;
  supportedOutputFormats: SupportedImageFormat[];
  recommendedOutputFormat: SupportedImageFormat;
  validationErrors: string[];
  securityWarnings: string[];
}

// Format validation configuration
export interface FormatValidationConfig {
  securityValidation: boolean;
  allowExtensionFallback: boolean;
  requireFileSignature: boolean;
  maxFileSize: number;
}

// Enhanced format info interface
export interface FormatInfo {
  id: string;
  name: string;
  description: string;
  details: string;
  icon: string;
  popular: boolean;
  capabilities: FormatCapabilities;
  fileExtensions: string[];
  mimeTypes: string[];
}

// Enhanced format capabilities
export interface FormatCapabilities {
  supportsTransparency: boolean;
  supportsAnimation: boolean;
  supportsQuality: boolean;
  isLossless?: boolean;
  compressionType: 'lossy' | 'lossless' | 'both' | 'none';
  isRawFormat: boolean;
  canConvertTo: string[];
  browserSupport: 'universal' | 'modern' | 'latest' | 'limited' | 'none';
  supportedBrowsers?: string[];
}

// RAW conversion options
export interface RawConversionOptions {
  outputFormat: SupportedImageFormat;
  quality: number;
  preserveMetadata: boolean;
  colorSpace: string;
}

// Constants arrays
export const RAW_FILE_EXTENSIONS = [
  'cr2', 'cr3', 'crw', 'nef', 'nrw', 'arw', 'srf', 'sr2', 'orf', 'rw2',
  'raf', 'pef', 'ptx', 'srw', 'dng', 'x3f', 'raw', 'rwl', '3fr', 'ari',
  'bay', 'braw', 'cri', 'dcr', 'dcs', 'erf', 'fff', 'gpr', 'iiq', 'kdc',
  'mdc', 'mef', 'mos', 'mrw', 'nksc', 'r3d', 'rdc', 'rwz'
] as const;

export const RAW_MIME_TYPES = [
  'image/x-canon-cr2', 'image/x-canon-cr3', 'image/x-canon-crw',
  'image/x-nikon-nef', 'image/x-sony-arw', 'image/x-sony-srf',
  'image/x-olympus-orf', 'image/x-panasonic-rw2', 'image/x-panasonic-raw',
  'image/x-fuji-raf', 'image/x-pentax-pef', 'image/x-samsung-srw',
  'image/x-adobe-dng', 'image/x-sigma-x3f', 'image/raw',
  'application/octet-stream'
] as const;

export const STANDARD_MIME_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'image/avif', 'image/bmp', 'image/svg+xml', 'image/tiff', 'image/x-icon'
] as const;

// Default validation configuration
export const DEFAULT_VALIDATION_CONFIG: FormatValidationConfig = {
  securityValidation: true,
  allowExtensionFallback: true,
  requireFileSignature: false,
  maxFileSize: 100 * 1024 * 1024 // 100MB
};

// Export constants
export const STANDARD_IMAGE_FORMATS: readonly ImageFormat[] = [
  'jpeg', 'jpg', 'png', 'gif', 'webp', 'avif', 'bmp', 'svg', 'tiff'
] as const;

export const RAW_IMAGE_FORMATS: readonly RawFormat[] = [
  'cr2', 'cr3', 'nef', 'arw', 'orf', 'rw2', 'raf', 'pef', 'srw', 'dng', 'x3f', 'raw'
] as const;

export const MIME_TYPE_MAPPINGS: MimeTypeMapping = {
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg', 
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/bmp': 'bmp',
  'image/svg+xml': 'svg',
  'image/tiff': 'tiff',
  // RAW formats
  'image/x-canon-cr2': 'cr2',
  'image/x-canon-cr3': 'cr3',
  'image/x-nikon-nef': 'nef',
  'image/x-sony-arw': 'arw',
  'image/x-olympus-orf': 'orf',
  'image/x-panasonic-rw2': 'rw2',
  'image/x-fuji-raf': 'raf',
  'image/x-pentax-pef': 'pef',
  'image/x-samsung-srw': 'srw',
  'image/x-adobe-dng': 'dng',
  'image/x-sigma-x3f': 'x3f'
};

export const RAW_MANUFACTURER_MAP: RawManufacturerMapping = {
  cr2: { manufacturer: 'Canon', fullName: 'Canon RAW (CR2)', commonExtensions: ['cr2'] },
  cr3: { manufacturer: 'Canon', fullName: 'Canon RAW (CR3)', commonExtensions: ['cr3'] },
  nef: { manufacturer: 'Nikon', fullName: 'Nikon Electronic Format (NEF)', commonExtensions: ['nef'] },
  arw: { manufacturer: 'Sony', fullName: 'Sony RAW (ARW)', commonExtensions: ['arw'] },
  orf: { manufacturer: 'Olympus', fullName: 'Olympus RAW Format (ORF)', commonExtensions: ['orf'] },
  rw2: { manufacturer: 'Panasonic', fullName: 'Panasonic RAW (RW2)', commonExtensions: ['rw2'] },
  raf: { manufacturer: 'Fujifilm', fullName: 'Fujifilm RAW (RAF)', commonExtensions: ['raf'] },
  pef: { manufacturer: 'Pentax', fullName: 'Pentax Electronic Format (PEF)', commonExtensions: ['pef'] },
  srw: { manufacturer: 'Samsung', fullName: 'Samsung RAW (SRW)', commonExtensions: ['srw'] },
  dng: { manufacturer: 'Adobe', fullName: 'Digital Negative (DNG)', commonExtensions: ['dng'] },
  x3f: { manufacturer: 'Sigma', fullName: 'Sigma RAW (X3F)', commonExtensions: ['x3f'] }
};

// Default format capabilities
export const DEFAULT_FORMAT_CAPABILITIES: { [key in ImageFormat]: LegacyFormatCapabilities } = {
  jpeg: {
    supportsTransparency: false,
    supportsAnimation: false,
    supportsQuality: true,
    isLossless: false,
    supportedBrowsers: ['all']
  },
  jpg: {
    supportsTransparency: false,
    supportsAnimation: false,
    supportsQuality: true,
    isLossless: false,
    supportedBrowsers: ['all']
  },
  png: {
    supportsTransparency: true,
    supportsAnimation: false,
    supportsQuality: false,
    isLossless: true,
    supportedBrowsers: ['all']
  },
  gif: {
    supportsTransparency: true,
    supportsAnimation: true,
    supportsQuality: false,
    isLossless: false,
    supportedBrowsers: ['all']
  },
  webp: {
    supportsTransparency: true,
    supportsAnimation: true,
    supportsQuality: true,
    isLossless: false,
    supportedBrowsers: ['modern']
  },
  avif: {
    supportsTransparency: true,
    supportsAnimation: false,
    supportsQuality: true,
    isLossless: false,
    supportedBrowsers: ['latest']
  },
  bmp: {
    supportsTransparency: false,
    supportsAnimation: false,
    supportsQuality: false,
    isLossless: true,
    supportedBrowsers: ['all']
  },
  svg: {
    supportsTransparency: true,
    supportsAnimation: true,
    supportsQuality: false,
    isLossless: true,
    supportedBrowsers: ['all']
  },
  tiff: {
    supportsTransparency: true,
    supportsAnimation: false,
    supportsQuality: false,
    isLossless: true,
    supportedBrowsers: ['limited']
  }
};

// Type guards
export function isStandardFormat(format: string): format is ImageFormat {
  return STANDARD_IMAGE_FORMATS.includes(format as ImageFormat);
}

export function isRawFormat(format: string): format is RawFormat {
  return RAW_IMAGE_FORMATS.includes(format as RawFormat);
}

export function isSupportedFormat(format: string): format is SupportedFormat {
  return isStandardFormat(format) || isRawFormat(format);
}

// Enhanced type guards
export function isValidImageFormat(format: string): format is AllImageFormats {
  return isStandardFormat(format) || isRawFormat(format);
}

export function isRawImageFormat(format: string): format is RawImageFormat {
  return RAW_IMAGE_FORMATS.includes(format as RawImageFormat);
}

export function isSupportedImageFormat(format: string): format is SupportedImageFormat {
  return STANDARD_IMAGE_FORMATS.includes(format as SupportedImageFormat);
}

export function isImageMimeType(mimeType: string): mimeType is ImageMimeType {
  return [...STANDARD_MIME_TYPES, ...RAW_MIME_TYPES].includes(mimeType as ImageMimeType);
}

export function isRawMimeType(mimeType: string): boolean {
  return RAW_MIME_TYPES.includes(mimeType as any);
}

export function isStandardMimeType(mimeType: string): boolean {
  return STANDARD_MIME_TYPES.includes(mimeType as any);
}