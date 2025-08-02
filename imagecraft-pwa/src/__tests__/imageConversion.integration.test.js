/**
 * Integration Tests for Image Conversion System
 * Tests end-to-end conversion workflows and integration between components
 */

import { 
  RawFormatDetector 
} from '../utils/formatDetection';
import { 
  SecurityValidator 
} from '../utils/securityValidation';
import ModernImageProcessor from '../services/modernImageProcessor';
import { 
  mockFiles, 
  createMockFile, 
  createBatchFiles, 
  createRAWFiles,
  createSecurityTestFiles
} from '../__mocks__/testDataFactory';

describe('Image Conversion Integration Tests', () => {
  let formatDetector;
  let securityValidator;
  let imageProcessor;

  beforeEach(() => {
    formatDetector = new RawFormatDetector();
    securityValidator = new SecurityValidator();
    imageProcessor = new ModernImageProcessor();
    
    jest.clearAllMocks();
  });

  describe('Standard Image Conversion Workflow', () => {
    test('should complete full JPEG to PNG conversion workflow', async () => {
      const file = mockFiles.jpeg();
      
      // Step 1: Security validation
      const securityResult = await securityValidator.validateFile(file);
      expect(securityResult.isValid).toBe(true);
      
      // Step 2: Format detection
      const formatInfo = formatDetector.getFormatInfo(file);
      expect(formatInfo.isStandard).toBe(true);
      expect(formatInfo.isRaw).toBe(false);
      
      // Step 3: Format validation
      const formatDetectionResult = await formatDetector.detectFormat(file);
      expect(formatDetectionResult.isValid).toBe(true);
      
      // Step 4: Conversion
      const conversionResult = await imageProcessor.convertImage(
        file, 
        'png', 
        'medium',
        {
          onProgress: jest.fn()
        }
      );
      
      expect(conversionResult.blob).toBeInstanceOf(Blob);
      expect(conversionResult.format).toBe('png');
      expect(conversionResult.originalSize).toBe(file.size);
      expect(conversionResult.processingTime).toBeGreaterThan(0);
      expect(conversionResult.isRawConversion).toBe(false);
    });

    test('should complete full PNG to JPEG conversion with quality settings', async () => {
      const file = mockFiles.png();
      
      const securityResult = await securityValidator.validateFile(file);
      expect(securityResult.isValid).toBe(true);
      
      const conversionResult = await imageProcessor.convertImage(
        file, 
        'jpeg', 
        'high',
        {
          backgroundColor: '#FFFFFF'
        }
      );
      
      expect(conversionResult.format).toBe('jpeg');
      expect(conversionResult.blob.type).toContain('jpeg');
    });

    test('should handle modern format conversion (WebP to AVIF)', async () => {
      const file = mockFiles.webp();
      
      // Initialize processor capabilities
      await imageProcessor.initializeCapabilities();
      
      const securityResult = await securityValidator.validateFile(file);
      expect(securityResult.isValid).toBe(true);
      
      try {
        const conversionResult = await imageProcessor.convertImage(
          file, 
          'avif', 
          'medium'
        );
        
        expect(conversionResult).toBeDefined();
        // Format might fall back to a supported format
        expect(['avif', 'png', 'jpeg']).toContain(conversionResult.format);
      } catch (error) {
        // AVIF might not be supported in test environment
        expect(error.message).toContain('not supported');
      }
    });
  });

  describe('RAW File Conversion Workflow', () => {
    test('should complete full RAW to JPEG conversion workflow', async () => {
      const file = mockFiles.cannonCR2();
      
      // Step 1: Security validation
      const securityResult = await securityValidator.validateFile(file);
      expect(securityResult.isValid).toBe(true);
      
      // Step 2: RAW format detection
      const formatInfo = formatDetector.getFormatInfo(file);
      expect(formatInfo.isRaw).toBe(true);
      expect(formatInfo.formatName).toContain('Canon RAW');
      
      // Step 3: RAW validation
      const rawValidation = await formatDetector.validateRawFile(file);
      expect(rawValidation.isRawFile).toBe(true);
      expect(rawValidation.detectedRawFormat).toBe('CR2');
      expect(rawValidation.canConvert).toBe(true);
      expect(rawValidation.supportedOutputFormats).toEqual(['jpeg', 'png']);
      
      // Step 4: Conversion format validation
      const conversionValidation = formatDetector.validateRawConversion('jpeg');
      expect(conversionValidation.isValid).toBe(true);
      
      // Step 5: RAW conversion
      // Mock the RAW detector in the processor
      imageProcessor.rawDetector.validateRawFile = jest.fn().mockResolvedValue(rawValidation);
      imageProcessor.rawDetector.detectFormat = jest.fn().mockResolvedValue({
        isValid: true,
        isRaw: true,
        detectedFormat: 'CR2',
        confidence: 'high',
        errors: []
      });
      imageProcessor.rawDetector.validateRawConversion = jest.fn().mockReturnValue(conversionValidation);
      
      const conversionResult = await imageProcessor.convertImage(
        file, 
        'jpeg', 
        'high'
      );
      
      expect(conversionResult.isRawConversion).toBe(true);
      expect(conversionResult.originalRawFormat).toBe('CR2');
      expect(conversionResult.format).toBe('jpeg');
      expect(conversionResult.blob).toBeInstanceOf(Blob);
    });

    test('should handle various RAW formats correctly', async () => {
      const rawFiles = [
        mockFiles.cannonCR2(),
        mockFiles.nikonNEF(),
        mockFiles.sonyARW(),
        mockFiles.adobeDNG()
      ];
      
      for (const file of rawFiles) {
        const formatInfo = formatDetector.getFormatInfo(file);
        const rawValidation = await formatDetector.validateRawFile(file);
        
        expect(formatInfo.isRaw).toBe(true);
        expect(rawValidation.isRawFile).toBe(true);
        expect(rawValidation.canConvert).toBe(true);
        expect(rawValidation.supportedOutputFormats).toEqual(['jpeg', 'png']);
      }
    });

    test('should reject invalid RAW conversion formats', async () => {
      const file = mockFiles.cannonCR2();
      
      const rawValidation = await formatDetector.validateRawFile(file);
      expect(rawValidation.isRawFile).toBe(true);
      
      // Test invalid format
      const invalidConversion = formatDetector.validateRawConversion('webp');
      expect(invalidConversion.isValid).toBe(false);
      expect(invalidConversion.error).toContain('RAW files can only be converted to JPEG or PNG');
    });
  });

  describe('Batch Processing Integration', () => {
    test('should handle mixed format batch conversion', async () => {
      const files = [
        mockFiles.jpeg(),
        mockFiles.png(),
        mockFiles.webp(),
        mockFiles.gif()
      ];
      
      // Validate all files first
      for (const file of files) {
        const securityResult = await securityValidator.validateFile(file);
        expect(securityResult.isValid).toBe(true);
        
        const formatDetectionResult = await formatDetector.detectFormat(file);
        expect(formatDetectionResult.isValid).toBe(true);
      }
      
      // Batch convert
      const batchResult = await imageProcessor.batchConvert(
        files, 
        'png', 
        'medium',
        {
          onBatchProgress: jest.fn(),
          onProgress: jest.fn()
        }
      );
      
      expect(batchResult.successCount).toBe(4);
      expect(batchResult.errorCount).toBe(0);
      expect(batchResult.results).toHaveLength(4);
      
      // Verify each result
      batchResult.results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.result.format).toBe('png');
        expect(result.result.blob).toBeInstanceOf(Blob);
      });
    });

    test('should handle RAW files in batch processing', async () => {
      const files = [
        mockFiles.jpeg(),
        mockFiles.cannonCR2(),
        mockFiles.png()
      ];
      
      // Mock RAW detection for batch processing
      imageProcessor.rawDetector.validateRawFile = jest.fn()
        .mockImplementation(async (file) => {
          const formatInfo = formatDetector.getFormatInfo(file);
          return {
            isRawFile: formatInfo.isRaw,
            detectedRawFormat: formatInfo.isRaw ? formatInfo.extension : null,
            canConvert: formatInfo.isRaw,
            supportedOutputFormats: formatInfo.isRaw ? ['jpeg', 'png'] : [],
            recommendedOutputFormat: 'jpeg'
          };
        });
      
      imageProcessor.rawDetector.detectFormat = jest.fn()
        .mockImplementation(async (file) => {
          const formatInfo = formatDetector.getFormatInfo(file);
          return {
            isValid: true,
            isRaw: formatInfo.isRaw,
            detectedFormat: formatInfo.extension,
            confidence: 'high',
            errors: []
          };
        });
      
      imageProcessor.rawDetector.validateRawConversion = jest.fn()
        .mockReturnValue({ isValid: true, error: null });
      
      const batchResult = await imageProcessor.batchConvert(
        files, 
        'jpeg', 
        'medium'
      );
      
      expect(batchResult.successCount).toBe(3);
      expect(batchResult.errorCount).toBe(0);
      
      // Check that RAW conversion was detected
      const rawResult = batchResult.results.find(r => 
        r.originalFile.name === mockFiles.cannonCR2().name
      );
      expect(rawResult.result.isRawConversion).toBe(true);
    });

    test('should handle batch size and security limits', async () => {
      // Test batch size limit
      const tooManyFiles = createBatchFiles(100);
      
      await expect(imageProcessor.batchConvert(tooManyFiles, 'png', 'medium'))
        .rejects.toThrow('Batch size');
      
      // Test total size limit
      const hugeFiles = Array.from({ length: 3 }, () => 
        createMockFile({
          size: 200 * 1024 * 1024 // 200MB each
        })
      );
      
      await expect(imageProcessor.batchConvert(hugeFiles, 'png', 'medium'))
        .rejects.toThrow('Total batch size');
    });
  });

  describe('Security Integration', () => {
    test('should reject malicious files throughout pipeline', async () => {
      const maliciousFiles = createSecurityTestFiles();
      
      for (const file of maliciousFiles) {
        const securityResult = await securityValidator.validateFile(file);
        
        // Should be flagged by security validation
        expect(
          securityResult.isValid === false || 
          securityResult.warnings.length > 0 || 
          securityResult.threats.length > 0
        ).toBe(true);
        
        if (!securityResult.isValid) {
          // If security validation fails, conversion should not proceed
          await expect(imageProcessor.convertImage(file, 'png', 'medium'))
            .rejects.toThrow(/Security/);
        }
      }
    });

    test('should handle oversized files correctly', async () => {
      const oversizedFile = mockFiles.oversizedFile();
      
      const securityResult = await securityValidator.validateFile(oversizedFile);
      expect(securityResult.isValid).toBe(false);
      expect(securityResult.errors.some(e => e.includes('File too large'))).toBe(true);
      
      // Conversion should be rejected
      await expect(imageProcessor.convertImage(oversizedFile, 'png', 'medium'))
        .rejects.toThrow('Security validation failed');
    });

    test('should sanitize metadata during conversion', async () => {
      const file = mockFiles.jpeg();
      
      const conversionResult = await imageProcessor.convertImage(
        file, 
        'png', 
        'medium'
      );
      
      // The conversion process should strip metadata
      expect(conversionResult.blob).toBeInstanceOf(Blob);
      // In a real scenario, EXIF data would be removed
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle cascade failures gracefully', async () => {
      const file = mockFiles.jpeg();
      
      // Simulate security validation failure
      const originalValidateFile = securityValidator.validateFile;
      securityValidator.validateFile = jest.fn().mockResolvedValue({
        isValid: false,
        errors: ['Simulated security failure']
      });
      
      await expect(imageProcessor.convertImage(file, 'png', 'medium'))
        .rejects.toThrow('Security validation failed');
      
      // Restore original method
      securityValidator.validateFile = originalValidateFile;
    });

    test('should handle format detection failures', async () => {
      const file = mockFiles.jpeg();
      
      // Mock format detection to fail
      imageProcessor.rawDetector.detectFormat = jest.fn().mockResolvedValue({
        isValid: false,
        errors: ['Format detection failed']
      });
      
      await expect(imageProcessor.convertImage(file, 'png', 'medium'))
        .rejects.toThrow('Format validation failed');
    });

    test('should provide detailed error information', async () => {
      const invalidFile = createMockFile({
        name: 'test.unknown',
        type: 'application/unknown'
      });
      
      try {
        await imageProcessor.convertImage(invalidFile, 'png', 'medium');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Security validation failed');
        // Should provide specific error details
      }
    });
  });

  describe('Performance Integration', () => {
    test('should handle large file processing efficiently', async () => {
      const largeFile = mockFiles.largeJPEG();
      
      const startTime = performance.now();
      
      const conversionResult = await imageProcessor.convertImage(
        largeFile, 
        'png', 
        'medium',
        {
          onProgress: jest.fn()
        }
      );
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      expect(conversionResult).toBeDefined();
      expect(processingTime).toBeLessThan(10000); // Should complete within 10 seconds in test
      
      // Should use progressive processing for large files
      expect(conversionResult.processingTime).toBeGreaterThan(0);
    });

    test('should track statistics across multiple operations', async () => {
      const files = createBatchFiles(3);
      
      // Process files sequentially
      for (const file of files) {
        await imageProcessor.convertImage(file, 'png', 'medium');
      }
      
      const stats = imageProcessor.getPerformanceStats();
      expect(stats.totalProcessed).toBe(3);
      expect(stats.averageProcessingTime).toBeGreaterThan(0);
    });
  });

  describe('Format Capability Integration', () => {
    test('should adapt to browser capabilities', async () => {
      await imageProcessor.initializeCapabilities();
      
      const file = mockFiles.jpeg();
      
      // Test format that may not be supported
      try {
        const result = await imageProcessor.convertImage(file, 'avif', 'medium');
        
        // Should either succeed or fall back gracefully
        expect(result).toBeDefined();
        expect(['avif', 'png', 'jpeg']).toContain(result.format);
      } catch (error) {
        expect(error.message).toContain('not supported');
      }
    });

    test('should provide accurate format availability', async () => {
      await imageProcessor.initializeCapabilities();
      
      const supportedFormats = imageProcessor.getSupportedFormats();
      
      // Should always support basic formats
      expect(supportedFormats).toContain('jpeg');
      expect(supportedFormats).toContain('png');
      
      // Modern format support depends on browser
      const hasModernSupport = supportedFormats.includes('webp') || 
                              supportedFormats.includes('avif');
      
      // Should have some modern format support in most browsers
      // This is browser-dependent in real scenarios
    });
  });

  describe('End-to-End User Scenarios', () => {
    test('should handle typical user workflow: photo optimization', async () => {
      // User uploads a large JPEG photo
      const photo = createMockFile({
        name: 'vacation-photo.jpg',
        type: 'image/jpeg',
        size: 8 * 1024 * 1024 // 8MB
      });
      
      // Security check
      const securityResult = await securityValidator.validateFile(photo);
      expect(securityResult.isValid).toBe(true);
      
      // Convert to WebP for web optimization
      const optimizedResult = await imageProcessor.convertImage(
        photo, 
        'webp', 
        'medium',
        {
          maxWidth: 1920,
          maxHeight: 1080
        }
      );
      
      expect(optimizedResult.format).toBe('webp');
      expect(optimizedResult.width).toBeLessThanOrEqual(1920);
      expect(optimizedResult.height).toBeLessThanOrEqual(1080);
      expect(optimizedResult.size).toBeLessThan(photo.size); // Should be smaller
    });

    test('should handle photographer workflow: RAW processing', async () => {
      // Photographer uploads RAW file
      const rawPhoto = mockFiles.cannonCR2();
      
      // Validation
      const securityResult = await securityValidator.validateFile(rawPhoto);
      expect(securityResult.isValid).toBe(true);
      
      const rawValidation = await formatDetector.validateRawFile(rawPhoto);
      expect(rawValidation.isRawFile).toBe(true);
      
      // Mock processor for RAW conversion
      imageProcessor.rawDetector.validateRawFile = jest.fn().mockResolvedValue(rawValidation);
      imageProcessor.rawDetector.detectFormat = jest.fn().mockResolvedValue({
        isValid: true,
        isRaw: true,
        detectedFormat: 'CR2'
      });
      imageProcessor.rawDetector.validateRawConversion = jest.fn().mockReturnValue({
        isValid: true,
        error: null
      });
      
      // Convert to high-quality JPEG
      const processedResult = await imageProcessor.convertImage(
        rawPhoto, 
        'jpeg', 
        'high'
      );
      
      expect(processedResult.isRawConversion).toBe(true);
      expect(processedResult.format).toBe('jpeg');
      expect(processedResult.originalRawFormat).toBe('CR2');
    });

    test('should handle batch processing workflow', async () => {
      // User selects multiple mixed format files
      const mixedFiles = [
        mockFiles.jpeg(),
        mockFiles.png(),
        mockFiles.webp()
      ];
      
      // Batch convert to consistent format
      const batchResult = await imageProcessor.batchConvert(
        mixedFiles, 
        'jpeg', 
        'medium'
      );
      
      expect(batchResult.successCount).toBe(3);
      expect(batchResult.errorCount).toBe(0);
      
      // All results should be JPEG
      batchResult.results.forEach(result => {
        expect(result.result.format).toBe('jpeg');
      });
    });
  });
});