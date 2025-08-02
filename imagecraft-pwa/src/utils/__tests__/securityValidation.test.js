/**
 * Unit Tests for Security Validation Utility
 * Tests comprehensive security validation for image uploads
 */

import { 
  SecurityValidator, 
  securityValidator, 
  validateImageFile, 
  validateImageDimensions, 
  getRateLimitStatus 
} from '../securityValidation';
import { 
  mockFiles, 
  createMockFile, 
  createSecurityTestFiles 
} from '../../__mocks__/testDataFactory';

describe('SecurityValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new SecurityValidator();
    // Clear rate limit store between tests
    jest.clearAllMocks();
  });

  describe('Constructor and Configuration', () => {
    test('should initialize with correct default values', () => {
      expect(validator.maxFileSize).toBe(50 * 1024 * 1024); // 50MB
      expect(validator.maxDimensions.width).toBe(8192);
      expect(validator.maxDimensions.height).toBe(8192);
      expect(validator.maxPixels).toBe(32 * 1024 * 1024);
    });

    test('should have comprehensive allowed MIME types', () => {
      const expectedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/avif',
        'image/bmp',
        'image/svg+xml',
        'image/tiff'
      ];
      
      expectedTypes.forEach(type => {
        expect(validator.allowedMimeTypes.has(type)).toBe(true);
      });
    });

    test('should have rate limiting configuration', () => {
      expect(validator.rateLimits.filesPerMinute).toBe(20);
      expect(validator.rateLimits.filesPerHour).toBe(100);
      expect(validator.rateLimits.bytesPerHour).toBe(500 * 1024 * 1024);
    });
  });

  describe('validateFile - Basic File Validation', () => {
    test('should validate a standard JPEG file', async () => {
      const file = mockFiles.jpeg();
      const result = await validator.validateFile(file);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata.originalName).toBe(file.name);
      expect(result.metadata.size).toBe(file.size);
      expect(result.metadata.mimeType).toBe(file.type);
    });

    test('should validate a standard PNG file', async () => {
      const file = mockFiles.png();
      const result = await validator.validateFile(file);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject null/undefined files', async () => {
      const result = await validator.validateFile(null);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('No file provided');
    });

    test('should reject invalid file types', async () => {
      const invalidFile = { name: 'test.txt', type: 'text/plain' };
      const result = await validator.validateFile(invalidFile);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid file type');
    });

    test('should handle files without MIME type', async () => {
      const file = mockFiles.noMimeType();
      const result = await validator.validateFile(file);
      
      expect(result.warnings).toContain('No MIME type specified');
    });
  });

  describe('MIME Type Validation', () => {
    test('should accept all standard image MIME types', async () => {
      const testTypes = [
        { file: mockFiles.jpeg(), type: 'image/jpeg' },
        { file: mockFiles.png(), type: 'image/png' },
        { file: mockFiles.webp(), type: 'image/webp' },
        { file: mockFiles.gif(), type: 'image/gif' },
        { file: mockFiles.bmp(), type: 'image/bmp' }
      ];
      
      for (const { file, type } of testTypes) {
        const result = await validator.validateFile(file);
        expect(result.metadata.validatedMimeType).toBe(type);
        expect(result.errors).toHaveLength(0);
      }
    });

    test('should reject unsupported MIME types', async () => {
      const file = mockFiles.invalidMimeType();
      const result = await validator.validateFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Unsupported MIME type'))).toBe(true);
    });

    test('should be case insensitive for MIME types', async () => {
      const file = createMockFile({
        name: 'test.jpg',
        type: 'IMAGE/JPEG'
      });
      
      const result = await validator.validateFile(file);
      expect(result.metadata.validatedMimeType).toBe('image/jpeg');
    });
  });

  describe('File Signature Validation', () => {
    test('should detect MIME type mismatch', async () => {
      // Mock readFileHeader to return JPEG signature for PNG file
      const originalReadFileHeader = validator.readFileHeader;
      validator.readFileHeader = jest.fn().mockResolvedValue(
        new Uint8Array([0xff, 0xd8, 0xff, 0xe0]) // JPEG signature
      );
      
      const file = createMockFile({
        name: 'test.png',
        type: 'image/png'
      });
      
      const result = await validator.validateFile(file);
      
      expect(result.warnings.some(warning => 
        warning.includes('MIME type mismatch')
      )).toBe(true);
      
      // Restore original method
      validator.readFileHeader = originalReadFileHeader;
    });

    test('should handle file signature read errors gracefully', async () => {
      const originalReadFileHeader = validator.readFileHeader;
      validator.readFileHeader = jest.fn().mockRejectedValue(new Error('Read error'));
      
      const file = mockFiles.jpeg();
      const result = await validator.validateFile(file);
      
      expect(result.warnings.some(warning => 
        warning.includes('Could not validate file signature')
      )).toBe(true);
      
      validator.readFileHeader = originalReadFileHeader;
    });
  });

  describe('File Size Validation', () => {
    test('should accept files within size limits', async () => {
      const file = createMockFile({
        name: 'normal.jpg',
        type: 'image/jpeg',
        size: 10 * 1024 * 1024 // 10MB
      });
      
      const result = await validator.validateFile(file);
      expect(result.isValid).toBe(true);
    });

    test('should reject oversized files', async () => {
      const file = mockFiles.oversizedFile();
      const result = await validator.validateFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => 
        error.includes('File too large')
      )).toBe(true);
    });

    test('should reject empty files', async () => {
      const file = mockFiles.emptyFile();
      const result = await validator.validateFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File is empty');
    });
  });

  describe('Filename Validation', () => {
    test('should detect dangerous characters', async () => {
      const file = createMockFile({
        name: 'test<script>.jpg',
        type: 'image/jpeg'
      });
      
      const result = await validator.validateFile(file);
      expect(result.threats.some(threat => 
        threat.includes('dangerous characters')
      )).toBe(true);
    });

    test('should detect path traversal attempts', async () => {
      const file = mockFiles.maliciousFilename();
      const result = await validator.validateFile(file);
      
      expect(result.threats.some(threat => 
        threat.includes('path traversal')
      )).toBe(true);
    });

    test('should reject extremely long filenames', async () => {
      const longName = 'a'.repeat(300) + '.jpg';
      const file = createMockFile({
        name: longName,
        type: 'image/jpeg'
      });
      
      const result = await validator.validateFile(file);
      expect(result.errors.some(error => 
        error.includes('Filename too long')
      )).toBe(true);
    });

    test('should sanitize filenames', async () => {
      const file = createMockFile({
        name: 'test<>file.jpg',
        type: 'image/jpeg'
      });
      
      const result = await validator.validateFile(file);
      expect(result.metadata.sanitizedFilename).toBe('testfile.jpg');
    });
  });

  describe('Image Dimensions Validation', () => {
    test('should validate normal image dimensions', async () => {
      // Mock getImageDimensions to return normal dimensions
      const originalGetImageDimensions = validator.getImageDimensions;
      validator.getImageDimensions = jest.fn().mockResolvedValue({
        width: 1920,
        height: 1080
      });
      
      const file = mockFiles.jpeg();
      const result = await validator.validateFile(file);
      
      expect(result.metadata.dimensions).toEqual({
        width: 1920,
        height: 1080
      });
      expect(result.errors).toHaveLength(0);
      
      validator.getImageDimensions = originalGetImageDimensions;
    });

    test('should reject images with excessive dimensions', async () => {
      const originalGetImageDimensions = validator.getImageDimensions;
      validator.getImageDimensions = jest.fn().mockResolvedValue({
        width: 10000,
        height: 10000
      });
      
      const file = mockFiles.jpeg();
      const result = await validator.validateFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => 
        error.includes('Image dimensions too large')
      )).toBe(true);
      
      validator.getImageDimensions = originalGetImageDimensions;
    });

    test('should reject images with too many pixels', async () => {
      const originalGetImageDimensions = validator.getImageDimensions;
      validator.getImageDimensions = jest.fn().mockResolvedValue({
        width: 8000,
        height: 8000 // 64 megapixels
      });
      
      const file = mockFiles.jpeg();
      const result = await validator.validateFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => 
        error.includes('Too many pixels')
      )).toBe(true);
      
      validator.getImageDimensions = originalGetImageDimensions;
    });

    test('should handle dimension detection errors gracefully', async () => {
      const originalGetImageDimensions = validator.getImageDimensions;
      validator.getImageDimensions = jest.fn().mockRejectedValue(new Error('Dimension error'));
      
      const file = mockFiles.jpeg();
      const result = await validator.validateFile(file);
      
      expect(result.warnings.some(warning => 
        warning.includes('Could not validate image dimensions')
      )).toBe(true);
      
      validator.getImageDimensions = originalGetImageDimensions;
    });
  });

  describe('Rate Limiting', () => {
    test('should allow files within rate limits', async () => {
      const file = mockFiles.jpeg();
      const result = await validator.validateFile(file);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should track rate limiting properly', async () => {
      // Test multiple rapid requests
      const files = Array.from({ length: 5 }, () => mockFiles.jpeg());
      
      for (const file of files) {
        const result = await validator.validateFile(file);
        expect(result.isValid).toBe(true);
      }
    });

    // Note: Testing actual rate limit enforcement would require 
    // manipulating the rate limit store or mocking time
  });

  describe('Utility Methods', () => {
    test('readFileHeader should read correct number of bytes', async () => {
      const file = mockFiles.jpeg();
      const header = await validator.readFileHeader(file, 4);
      
      expect(header).toBeInstanceOf(Uint8Array);
      expect(header.length).toBeLessThanOrEqual(4);
    });

    test('bytesToHex should convert correctly', () => {
      const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
      const hex = validator.bytesToHex(bytes);
      
      expect(hex).toBe('ffd8ffe0');
    });

    test('formatBytes should format sizes correctly', () => {
      expect(validator.formatBytes(0)).toBe('0 Bytes');
      expect(validator.formatBytes(1024)).toBe('1 KB');
      expect(validator.formatBytes(1024 * 1024)).toBe('1 MB');
      expect(validator.formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    });

    test('getImageDimensions should return dimensions', async () => {
      const file = mockFiles.jpeg();
      
      // Mock Image load
      const mockImage = {
        naturalWidth: 1920,
        naturalHeight: 1080,
        onload: null,
        onerror: null,
        src: ''
      };
      
      global.Image = jest.fn(() => mockImage);
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      global.URL.revokeObjectURL = jest.fn();
      
      const dimensionsPromise = validator.getImageDimensions(file);
      
      // Simulate image load
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);
      
      const dimensions = await dimensionsPromise;
      
      expect(dimensions).toEqual({
        width: 1920,
        height: 1080
      });
    });
  });

  describe('Image Sanitization', () => {
    test('should sanitize image metadata', async () => {
      const file = mockFiles.jpeg();
      
      // Mock canvas operations
      const mockCanvas = {
        width: 0,
        height: 0,
        toBlob: jest.fn((callback, type, quality) => {
          const blob = new Blob(['sanitized'], { type: type || 'image/jpeg' });
          callback(blob);
        }),
        getContext: jest.fn(() => ({
          drawImage: jest.fn()
        }))
      };
      
      const mockImage = {
        naturalWidth: 1920,
        naturalHeight: 1080,
        onload: null,
        onerror: null,
        src: ''
      };
      
      global.document.createElement = jest.fn((tag) => {
        if (tag === 'canvas') return mockCanvas;
        return {};
      });
      global.Image = jest.fn(() => mockImage);
      
      const sanitizePromise = validator.sanitizeImage(file);
      
      // Simulate image load
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);
      
      const sanitizedFile = await sanitizePromise;
      
      expect(sanitizedFile).toBeInstanceOf(File);
      expect(sanitizedFile.name).toBe(file.name);
    });
  });

  describe('Security Summary', () => {
    test('should generate accurate security summary', async () => {
      const file = mockFiles.jpeg();
      const validationResult = await validator.validateFile(file);
      const summary = validator.getSecuritySummary(validationResult);
      
      expect(summary.securityLevel).toBe('secure');
      expect(summary.isSecure).toBe(true);
      expect(summary.totalIssues).toBe(0);
      expect(summary.criticalIssues).toBe(0);
    });

    test('should calculate correct security level for risky files', async () => {
      const file = mockFiles.maliciousFilename();
      const validationResult = await validator.validateFile(file);
      const summary = validator.getSecuritySummary(validationResult);
      
      expect(summary.securityLevel).toBe('high-risk');
      expect(summary.isSecure).toBe(false);
      expect(summary.threats).toBeGreaterThan(0);
    });
  });
});

describe('Utility Functions', () => {
  test('validateImageFile should work with singleton', async () => {
    const file = mockFiles.jpeg();
    const result = await validateImageFile(file);
    
    expect(result.isValid).toBe(true);
  });

  test('validateImageDimensions should validate dimensions', async () => {
    const file = mockFiles.jpeg();
    
    // Mock the validator method
    const originalValidator = securityValidator.validateImageDimensions;
    securityValidator.validateImageDimensions = jest.fn().mockResolvedValue(undefined);
    
    const result = await validateImageDimensions(file);
    
    // Should not throw errors
    expect(result).toBeDefined();
    
    securityValidator.validateImageDimensions = originalValidator;
  });

  test('getRateLimitStatus should return rate limit info', () => {
    const status = getRateLimitStatus();
    
    expect(status.allowed).toBe(true);
    expect(status.remaining).toBe(100);
  });
});

describe('Edge Cases and Error Handling', () => {
  test('should handle corrupted file objects', async () => {
    const corruptedFile = {
      name: null,
      type: undefined,
      size: NaN
    };
    
    const result = await validator.validateFile(corruptedFile);
    expect(result.isValid).toBe(false);
  });

  test('should handle very large dimension numbers', async () => {
    const originalGetImageDimensions = validator.getImageDimensions;
    validator.getImageDimensions = jest.fn().mockResolvedValue({
      width: Number.MAX_SAFE_INTEGER,
      height: Number.MAX_SAFE_INTEGER
    });
    
    const file = mockFiles.jpeg();
    const result = await validator.validateFile(file);
    
    expect(result.isValid).toBe(false);
    
    validator.getImageDimensions = originalGetImageDimensions;
  });

  test('should handle promise rejections in validation chain', async () => {
    const file = mockFiles.jpeg();
    
    // Mock a method to reject
    const originalReadFileHeader = validator.readFileHeader;
    validator.readFileHeader = jest.fn().mockRejectedValue(new Error('Network error'));
    
    const result = await validator.validateFile(file);
    
    // Should still complete validation with warnings
    expect(result).toBeDefined();
    expect(result.warnings.length).toBeGreaterThan(0);
    
    validator.readFileHeader = originalReadFileHeader;
  });

  test('should handle security test files appropriately', async () => {
    const testFiles = createSecurityTestFiles();
    
    for (const file of testFiles) {
      const result = await validator.validateFile(file);
      
      // All security test files should be flagged as invalid or have warnings
      expect(result.isValid === false || result.warnings.length > 0 || result.threats.length > 0).toBe(true);
    }
  });

  test('should handle files with unusual properties', async () => {
    const weirdFile = createMockFile({
      name: '',
      type: '',
      size: -1
    });
    
    const result = await validator.validateFile(weirdFile);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});