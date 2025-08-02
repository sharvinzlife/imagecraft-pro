/**
 * TypeScript definitions for ImageCraft Pro format detection and conversion
 * This file provides type definitions that can be consumed by JavaScript files
 */

// Basic type definitions
export type ImageFormat = 'jpeg' | 'jpg' | 'png' | 'gif' | 'webp' | 'avif' | 'bmp' | 'svg' | 'tiff';
export type RawFormat = 'cr2' | 'cr3' | 'nef' | 'arw' | 'orf' | 'rw2' | 'raf' | 'pef' | 'srw' | 'dng' | 'x3f' | 'raw';
export type AllImageFormats = ImageFormat | RawFormat;
export type SupportedFormat = ImageFormat | RawFormat;

// Conversion result interface for JavaScript consumption
export interface ConversionResult {
  success?: boolean;
  blob?: Blob;
  outputFormat?: string;
  originalSize?: number;
  outputSize?: number;
  size?: number;
  compressionRatio?: number;
  processingTime?: number;
  error?: string;
  originalName?: string;
  width?: number;
  height?: number;
  format?: string;
  actualFormat?: string;
  wasFallback?: boolean;
  isRawConversion?: boolean;
  originalRawFormat?: string | null;
  formatDetectionResult?: any;
  rawValidationResult?: any;
}

// RAW validation result for JavaScript consumption
export interface RawValidationResult {
  isRawFile: boolean;
  detectedRawFormat: string | null;
  canConvert: boolean;
  supportedOutputFormats: string[];
  recommendedOutputFormat: string;
  validationErrors: string[];
  securityWarnings: string[];
}

// Format detection result for JavaScript consumption
export interface FileFormatDetectionResult {
  isValid: boolean;
  isRaw: boolean;
  detectedFormat: string | null;
  confidence: 'low' | 'medium' | 'high';
  detectionMethod: 'mime-type' | 'extension' | 'signature' | 'unknown';
  warnings: string[];
  errors: string[];
}

// Validation functions
export interface ValidationResult {
  valid: boolean;
  file?: File | null;
  errors: string[];
  warnings: string[];
}

export interface DimensionValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Function type definitions for JavaScript imports
export declare function validateImageFile(file: File, options?: { maxSize?: number; skipRateLimiting?: boolean }): Promise<ValidationResult>;
export declare function validateImageDimensions(width: number, height: number): DimensionValidationResult;

// Format detection functions
export declare function createRawDetector(config?: any): any;
export declare function getFormatInfo(format: string): any;
export declare function validateRawConversion(file: File, outputFormat: string): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }>;
export declare function isRawFormat(format: string): boolean;