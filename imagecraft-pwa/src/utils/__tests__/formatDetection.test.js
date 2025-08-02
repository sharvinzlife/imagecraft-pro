/**
 * Unit Tests for Format Detection Utility
 * Tests RAW format detection, validation, and conversion logic
 */

import { 
  RawFormatDetector, 
  rawFormatDetector, 
  createRawDetector, 
  getFormatInfo, 
  validateRawConversion, 
  isRawFormat 
} from '../formatDetection';
import { mockFiles, createMockFile } from '../../__mocks__/testDataFactory';

describe('RawFormatDetector', () => {
  let detector;

  beforeEach(() => {
    detector = new RawFormatDetector();
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with correct default values', () => {
      expect(detector.rawMimeTypes).toBeDefined();
      expect(detector.rawExtensions).toBeDefined();
      expect(detector.standardMimeTypes).toBeDefined();
    });

    test('should include all expected RAW MIME types', () => {
      const expectedMimeTypes = [
        'image/x-canon-cr2',
        'image/x-canon-cr3',
        'image/x-nikon-nef',
        'image/x-sony-arw',
        'image/x-adobe-dng'
      ];
      
      expectedMimeTypes.forEach(mimeType => {
        expect(detector.rawMimeTypes.has(mimeType)).toBe(true);
      });
    });

    test('should include all expected RAW extensions', () => {
      const expectedExtensions = [
        'cr2', 'cr3', 'nef', 'arw', 'dng', 'orf', 'rw2', 'raf', 'pef', 'srw', 'x3f'
      ];
      
      expectedExtensions.forEach(extension => {
        expect(detector.rawExtensions.has(extension)).toBe(true);
      });
    });

    test('should include all expected standard MIME types', () => {
      const expectedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/bmp'
      ];
      
      expectedMimeTypes.forEach(mimeType => {
        expect(detector.standardMimeTypes.has(mimeType)).toBe(true);
      });
    });
  });

  describe('isRawFile', () => {
    test('should detect Canon CR2 files by MIME type', () => {
      const file = mockFiles.cannonCR2();
      expect(detector.isRawFile(file)).toBe(true);
    });

    test('should detect Canon CR3 files by MIME type', () => {
      const file = mockFiles.cannonCR3();
      expect(detector.isRawFile(file)).toBe(true);
    });

    test('should detect Nikon NEF files by MIME type', () => {
      const file = mockFiles.nikonNEF();
      expect(detector.isRawFile(file)).toBe(true);
    });

    test('should detect Sony ARW files by MIME type', () => {
      const file = mockFiles.sonyARW();
      expect(detector.isRawFile(file)).toBe(true);
    });

    test('should detect Adobe DNG files by MIME type', () => {
      const file = mockFiles.adobeDNG();
      expect(detector.isRawFile(file)).toBe(true);
    });

    test('should detect RAW files by extension when MIME type is generic', () => {
      const file = createMockFile({
        name: 'test.cr2',
        type: 'application/octet-stream'
      });
      expect(detector.isRawFile(file)).toBe(true);
    });

    test('should detect RAW files with uppercase extensions', () => {
      const file = createMockFile({
        name: 'test.CR2',
        type: 'application/octet-stream'
      });
      expect(detector.isRawFile(file)).toBe(true);
    });

    test('should not detect standard image files as RAW', () => {
      const jpegFile = mockFiles.jpeg();
      const pngFile = mockFiles.png();
      const webpFile = mockFiles.webp();
      
      expect(detector.isRawFile(jpegFile)).toBe(false);
      expect(detector.isRawFile(pngFile)).toBe(false);
      expect(detector.isRawFile(webpFile)).toBe(false);
    });

    test('should handle null/undefined files gracefully', () => {
      expect(detector.isRawFile(null)).toBe(false);
      expect(detector.isRawFile(undefined)).toBe(false);
    });

    test('should handle files with no name', () => {
      const file = createMockFile({
        name: '',
        type: 'image/x-canon-cr2'
      });
      expect(detector.isRawFile(file)).toBe(true);
    });

    test('should handle files with no extension', () => {
      const file = createMockFile({
        name: 'noextension',
        type: 'image/jpeg'
      });
      expect(detector.isRawFile(file)).toBe(false);
    });
  });

  describe('isRawMimeType', () => {
    test('should correctly identify RAW MIME types', () => {
      expect(detector.isRawMimeType('image/x-canon-cr2')).toBe(true);
      expect(detector.isRawMimeType('image/x-nikon-nef')).toBe(true);
      expect(detector.isRawMimeType('image/x-sony-arw')).toBe(true);
    });

    test('should be case insensitive', () => {
      expect(detector.isRawMimeType('IMAGE/X-CANON-CR2')).toBe(true);
      expect(detector.isRawMimeType('Image/X-Nikon-NEF')).toBe(true);
    });

    test('should reject standard image MIME types', () => {
      expect(detector.isRawMimeType('image/jpeg')).toBe(false);
      expect(detector.isRawMimeType('image/png')).toBe(false);
      expect(detector.isRawMimeType('image/webp')).toBe(false);
    });

    test('should handle null/undefined MIME types', () => {
      expect(detector.isRawMimeType(null)).toBe(false);
      expect(detector.isRawMimeType(undefined)).toBe(false);
      expect(detector.isRawMimeType('')).toBe(false);
    });
  });

  describe('isRawExtension', () => {
    test('should correctly identify RAW extensions', () => {
      expect(detector.isRawExtension('cr2')).toBe(true);
      expect(detector.isRawExtension('nef')).toBe(true);
      expect(detector.isRawExtension('arw')).toBe(true);
      expect(detector.isRawExtension('dng')).toBe(true);
    });

    test('should be case insensitive', () => {
      expect(detector.isRawExtension('CR2')).toBe(true);
      expect(detector.isRawExtension('NeF')).toBe(true);
      expect(detector.isRawExtension('ARW')).toBe(true);
    });

    test('should reject standard image extensions', () => {
      expect(detector.isRawExtension('jpg')).toBe(false);
      expect(detector.isRawExtension('png')).toBe(false);
      expect(detector.isRawExtension('webp')).toBe(false);
    });

    test('should handle null/undefined extensions', () => {
      expect(detector.isRawExtension(null)).toBe(false);
      expect(detector.isRawExtension(undefined)).toBe(false);
      expect(detector.isRawExtension('')).toBe(false);
    });
  });

  describe('getFileExtension', () => {
    test('should extract extension from filename', () => {
      expect(detector.getFileExtension('image.jpg')).toBe('jpg');
      expect(detector.getFileExtension('photo.CR2')).toBe('CR2');
      expect(detector.getFileExtension('test.file.png')).toBe('png');
    });

    test('should handle files without extensions', () => {
      expect(detector.getFileExtension('noextension')).toBe('');
      expect(detector.getFileExtension('file.')).toBe('');
    });

    test('should handle null/undefined filenames', () => {
      expect(detector.getFileExtension(null)).toBe('');
      expect(detector.getFileExtension(undefined)).toBe('');
      expect(detector.getFileExtension('')).toBe('');
    });

    test('should handle filenames starting with dot', () => {
      expect(detector.getFileExtension('.hidden')).toBe('');
      expect(detector.getFileExtension('.hidden.txt')).toBe('txt');
    });
  });

  describe('isStandardImageFile', () => {
    test('should identify standard image files', () => {
      const jpegFile = mockFiles.jpeg();
      const pngFile = mockFiles.png();
      const webpFile = mockFiles.webp();
      
      expect(detector.isStandardImageFile(jpegFile)).toBe(true);
      expect(detector.isStandardImageFile(pngFile)).toBe(true);
      expect(detector.isStandardImageFile(webpFile)).toBe(true);
    });

    test('should not identify RAW files as standard', () => {
      const rawFile = mockFiles.cannonCR2();
      expect(detector.isStandardImageFile(rawFile)).toBe(false);
    });

    test('should handle null/undefined files', () => {
      expect(detector.isStandardImageFile(null)).toBe(false);
      expect(detector.isStandardImageFile(undefined)).toBe(false);
    });
  });

  describe('getFormatInfo', () => {
    test('should return complete format info for RAW files', () => {
      const rawFile = mockFiles.cannonCR2();
      const info = detector.getFormatInfo(rawFile);
      
      expect(info.isRaw).toBe(true);
      expect(info.isStandard).toBe(false);
      expect(info.mimeType).toBe('image/x-canon-cr2');
      expect(info.extension).toBe('CR2');
      expect(info.formatName).toContain('Canon RAW');
      expect(info.size).toBeDefined();
      expect(info.lastModified).toBeDefined();
    });

    test('should return complete format info for standard files', () => {
      const jpegFile = mockFiles.jpeg();
      const info = detector.getFormatInfo(jpegFile);
      
      expect(info.isRaw).toBe(false);
      expect(info.isStandard).toBe(true);
      expect(info.mimeType).toBe('image/jpeg');
      expect(info.extension).toBe('jpg');
      expect(info.formatName).toBe('JPEG');
    });

    test('should handle null/undefined files', () => {
      const info = detector.getFormatInfo(null);
      
      expect(info.isRaw).toBe(false);
      expect(info.isStandard).toBe(false);
      expect(info.mimeType).toBe(null);
      expect(info.extension).toBe(null);
      expect(info.formatName).toBe('unknown');
    });
  });

  describe('getFormatName', () => {
    test('should return correct names for RAW formats', () => {
      const cr2File = mockFiles.cannonCR2();
      const nefFile = mockFiles.nikonNEF();
      const arwFile = mockFiles.sonyARW();
      
      expect(detector.getFormatName(cr2File, true, false)).toBe('Canon RAW (CR2)');
      expect(detector.getFormatName(nefFile, true, false)).toBe('Nikon RAW (NEF)');
      expect(detector.getFormatName(arwFile, true, false)).toBe('Sony RAW (ARW)');
    });

    test('should return correct names for standard formats', () => {
      const jpegFile = mockFiles.jpeg();
      const pngFile = mockFiles.png();
      const webpFile = mockFiles.webp();
      
      expect(detector.getFormatName(jpegFile, false, true)).toBe('JPEG');
      expect(detector.getFormatName(pngFile, false, true)).toBe('PNG');
      expect(detector.getFormatName(webpFile, false, true)).toBe('WebP');
    });

    test('should return unknown for unrecognized formats', () => {
      const unknownFile = createMockFile({
        name: 'test.unknown',
        type: 'application/unknown'
      });
      
      expect(detector.getFormatName(unknownFile, false, false)).toBe('Unknown Format');
    });
  });

  describe('validateRawFile', () => {
    test('should validate RAW files correctly', async () => {
      const rawFile = mockFiles.cannonCR2();
      const result = await detector.validateRawFile(rawFile);
      
      expect(result.isRawFile).toBe(true);
      expect(result.detectedRawFormat).toBe('CR2');
      expect(result.canConvert).toBe(true);
      expect(result.supportedOutputFormats).toEqual(['jpeg', 'png']);
      expect(result.recommendedOutputFormat).toBe('jpeg');
      expect(result.validationErrors).toHaveLength(0);
    });

    test('should handle non-RAW files', async () => {
      const jpegFile = mockFiles.jpeg();
      const result = await detector.validateRawFile(jpegFile);
      
      expect(result.isRawFile).toBe(false);
      expect(result.detectedRawFormat).toBe(null);
      expect(result.canConvert).toBe(false);
      expect(result.supportedOutputFormats).toHaveLength(0);
    });

    test('should handle null/undefined files', async () => {
      const result = await detector.validateRawFile(null);
      
      expect(result.isRawFile).toBe(false);
      expect(result.validationErrors).toContain('No file provided');
    });
  });

  describe('detectFormat', () => {
    test('should detect RAW format with high confidence', async () => {
      const rawFile = mockFiles.cannonCR2();
      const result = await detector.detectFormat(rawFile);
      
      expect(result.isValid).toBe(true);
      expect(result.isRaw).toBe(true);
      expect(result.detectedFormat).toBe('CR2');
      expect(result.confidence).toBe('high');
      expect(result.detectionMethod).toBe('mime-type');
      expect(result.errors).toHaveLength(0);
    });

    test('should detect standard format with high confidence', async () => {
      const jpegFile = mockFiles.jpeg();
      const result = await detector.detectFormat(jpegFile);
      
      expect(result.isValid).toBe(true);
      expect(result.isRaw).toBe(false);
      expect(result.detectedFormat).toBe('jpg');
      expect(result.confidence).toBe('high');
    });

    test('should handle invalid files', async () => {
      const invalidFile = createMockFile({
        name: 'test.unknown',
        type: 'application/unknown'
      });
      const result = await detector.detectFormat(invalidFile);
      
      expect(result.isValid).toBe(false);
      expect(result.confidence).toBe('low');
      expect(result.errors).toContain('Unsupported file format');
    });

    test('should handle null/undefined files', async () => {
      const result = await detector.detectFormat(null);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('No file provided');
    });
  });

  describe('getAvailableOutputFormats', () => {
    test('should return limited formats for RAW files', async () => {
      const rawFile = mockFiles.cannonCR2();
      const formats = await detector.getAvailableOutputFormats(rawFile);
      
      expect(formats).toEqual(['jpeg', 'png']);
    });

    test('should return all formats for standard files', async () => {
      const jpegFile = mockFiles.jpeg();
      const formats = await detector.getAvailableOutputFormats(jpegFile);
      
      expect(formats).toContain('jpeg');
      expect(formats).toContain('png');
      expect(formats).toContain('webp');
      expect(formats.length).toBeGreaterThan(2);
    });

    test('should return empty array for null files', async () => {
      const formats = await detector.getAvailableOutputFormats(null);
      expect(formats).toEqual([]);
    });
  });

  describe('validateRawConversion', () => {
    test('should validate JPEG conversion', () => {
      const result = detector.validateRawConversion('jpeg');
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
      expect(result.message).toBe('Valid RAW conversion format');
    });

    test('should validate PNG conversion', () => {
      const result = detector.validateRawConversion('png');
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    test('should reject invalid formats', () => {
      const result = detector.validateRawConversion('webp');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('RAW files can only be converted to JPEG or PNG');
      expect(result.suggestedFormats).toEqual(['jpeg', 'jpg', 'png']);
    });

    test('should be case insensitive', () => {
      expect(detector.validateRawConversion('JPEG').isValid).toBe(true);
      expect(detector.validateRawConversion('PNG').isValid).toBe(true);
      expect(detector.validateRawConversion('JPG').isValid).toBe(true);
    });
  });

  describe('getSupportedRawFormats', () => {
    test('should return comprehensive list of supported RAW formats', () => {
      const formats = detector.getSupportedRawFormats();
      
      expect(formats).toBeInstanceOf(Array);
      expect(formats.length).toBeGreaterThan(10);
      
      // Check for key formats
      const extensions = formats.map(f => f.extension);
      expect(extensions).toContain('cr2');
      expect(extensions).toContain('nef');
      expect(extensions).toContain('arw');
      expect(extensions).toContain('dng');
      
      // Check format structure
      formats.forEach(format => {
        expect(format).toHaveProperty('extension');
        expect(format).toHaveProperty('name');
        expect(format).toHaveProperty('manufacturer');
      });
    });
  });
});

describe('Singleton and Factory Functions', () => {
  test('createRawDetector should return singleton instance', () => {
    const detector1 = createRawDetector();
    const detector2 = createRawDetector();
    
    expect(detector1).toBe(detector2);
    expect(detector1).toBe(rawFormatDetector);
  });

  test('getFormatInfo should work with singleton', () => {
    const file = mockFiles.cannonCR2();
    const info = getFormatInfo(file);
    
    expect(info.isRaw).toBe(true);
    expect(info.formatName).toContain('Canon RAW');
  });

  test('validateRawConversion should work with singleton', () => {
    const result = validateRawConversion('jpeg');
    expect(result.isValid).toBe(true);
  });

  test('isRawFormat should correctly identify RAW formats', () => {
    expect(isRawFormat('cr2')).toBe(true);
    expect(isRawFormat('nef')).toBe(true);
    expect(isRawFormat('jpg')).toBe(false);
    expect(isRawFormat('png')).toBe(false);
  });
});

describe('Edge Cases and Error Handling', () => {
  test('should handle files with unusual extensions', () => {
    const file = createMockFile({
      name: 'test.file.with.dots.cr2',
      type: 'image/x-canon-cr2'
    });
    
    expect(rawFormatDetector.isRawFile(file)).toBe(true);
    expect(rawFormatDetector.getFileExtension(file.name)).toBe('cr2');
  });

  test('should handle very long filenames', () => {
    const longName = 'a'.repeat(200) + '.cr2';
    const file = createMockFile({
      name: longName,
      type: 'image/x-canon-cr2'
    });
    
    expect(rawFormatDetector.isRawFile(file)).toBe(true);
  });

  test('should handle special characters in filenames', () => {
    const file = createMockFile({
      name: 'test-file_with@special#chars.cr2',
      type: 'image/x-canon-cr2'
    });
    
    expect(rawFormatDetector.isRawFile(file)).toBe(true);
  });

  test('should handle inconsistent MIME type and extension', () => {
    const file = createMockFile({
      name: 'test.cr2',
      type: 'image/jpeg' // Wrong MIME type
    });
    
    // Should still detect as RAW based on extension
    expect(rawFormatDetector.isRawFile(file)).toBe(true);
  });

  test('should handle promise rejections gracefully', async () => {
    // Mock a method to throw an error in detectFormat
    const originalMethod = rawFormatDetector.getFormatInfo;
    rawFormatDetector.getFormatInfo = jest.fn(() => {
      throw new Error('Test error');
    });
    
    try {
      const result = await rawFormatDetector.detectFormat(mockFiles.cannonCR2());
      
      // Should handle the error gracefully if it doesn't throw
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    } catch (error) {
      // Or it might throw the error, which is also acceptable behavior
      expect(error.message).toBe('Test error');
    }
    
    // Restore original method
    rawFormatDetector.getFormatInfo = originalMethod;
  });
});