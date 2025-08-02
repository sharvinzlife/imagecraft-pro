/**
 * Unit Tests for Modern Image Processor
 * Tests comprehensive image conversion functionality
 */

import ModernImageProcessor, { 
  getModernImageProcessor, 
  destroyModernImageProcessor 
} from '../modernImageProcessor';
import { 
  mockFiles, 
  createMockFile, 
  createBatchFiles, 
  createRAWFiles,
  createMockConversionResult,
  createMockProgressCallback
} from '../../__mocks__/testDataFactory';

// Mock the validation utilities
jest.mock('../../utils/validationUtils', () => ({
  validateImageFile: jest.fn().mockResolvedValue({
    valid: true,
    file: null,
    errors: [],
    warnings: []
  }),
  validateImageDimensions: jest.fn().mockReturnValue({
    valid: true,
    errors: []
  })
}));

// Mock the format detection
jest.mock('../../utils/formatDetection', () => ({
  createRawDetector: jest.fn(() => ({
    detectFormat: jest.fn().mockResolvedValue({
      isValid: true,
      isRaw: false,
      detectedFormat: 'jpg',
      confidence: 'high',
      errors: []
    }),
    validateRawFile: jest.fn().mockResolvedValue({
      isRawFile: false,
      detectedRawFormat: null,
      canConvert: false,
      supportedOutputFormats: [],
      recommendedOutputFormat: 'jpeg',
      validationErrors: []
    }),
    validateRawConversion: jest.fn().mockReturnValue({
      isValid: true,
      error: null
    })
  })),
  validateRawConversion: jest.fn(),
  isRawFormat: jest.fn()
}));

describe('ModernImageProcessor', () => {
  let processor;

  beforeEach(() => {
    processor = new ModernImageProcessor();
    jest.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with correct default values', () => {
      expect(processor.supportedFormats).toBeDefined();
      expect(processor.rawFormats).toBeDefined();
      expect(processor.maxChunkSize).toBe(50 * 1024 * 1024);
      expect(processor.qualitySettings).toBeDefined();
    });

    test('should include all expected supported formats', () => {
      const expectedFormats = ['jpeg', 'jpg', 'png', 'webp', 'avif', 'bmp', 'gif'];
      expectedFormats.forEach(format => {
        expect(processor.supportedFormats.has(format)).toBe(true);
      });
    });

    test('should include RAW formats', () => {
      const expectedRAWFormats = ['cr2', 'cr3', 'nef', 'arw', 'dng'];
      expectedRAWFormats.forEach(format => {
        expect(processor.rawFormats.has(format)).toBe(true);
      });
    });

    test('should initialize quality settings', () => {
      expect(processor.qualitySettings.high).toBeDefined();
      expect(processor.qualitySettings.medium).toBeDefined();
      expect(processor.qualitySettings.low).toBeDefined();
      
      expect(processor.qualitySettings.high.jpeg).toBe(0.95);
      expect(processor.qualitySettings.medium.jpeg).toBe(0.8);
      expect(processor.qualitySettings.low.jpeg).toBe(0.6);
    });

    test('should initialize security configuration', () => {
      expect(processor.securityConfig.maxProcessingTime).toBe(300000);
      expect(processor.securityConfig.maxMemoryUsage).toBe(100 * 1024 * 1024);
      expect(processor.securityConfig.enableSecurityValidation).toBe(true);
    });

    test('should initialize statistics', () => {
      expect(processor.stats.totalProcessed).toBe(0);
      expect(processor.stats.averageProcessingTime).toBe(0);
      expect(processor.stats.securityThreatsBlocked).toBe(0);
    });
  });

  describe('initializeCapabilities', () => {
    test('should detect browser format capabilities', async () => {
      await processor.initializeCapabilities();
      
      expect(processor.formatCapabilities).toBeDefined();
      expect(processor.formatCapabilities.jpeg).toBe(true);
      expect(processor.formatCapabilities.png).toBe(true);
    });

    test('should handle capability detection errors gracefully', async () => {
      // Mock canvas toBlob to fail
      const originalToBlob = HTMLCanvasElement.prototype.toBlob;
      HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
        callback(null); // Simulate failure
      });
      
      await processor.initializeCapabilities();
      
      expect(processor.formatCapabilities).toBeDefined();
      
      HTMLCanvasElement.prototype.toBlob = originalToBlob;
    });
  });

  describe('convertImage - Basic Conversion', () => {
    test('should convert JPEG to PNG successfully', async () => {
      const file = mockFiles.jpeg();
      const onProgress = createMockProgressCallback();
      
      const result = await processor.convertImage(file, 'png', 'medium', {
        onProgress
      });
      
      expect(result).toBeDefined();
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.originalSize).toBe(file.size);
      expect(result.originalName).toBe(file.name);
      expect(result.format).toBe('png');
      expect(result.processingTime).toBeGreaterThan(0);
      expect(onProgress).toHaveBeenCalled();
    });

    test('should convert PNG to JPEG successfully', async () => {
      const file = mockFiles.png();
      const result = await processor.convertImage(file, 'jpeg', 'high');
      
      expect(result.format).toBe('jpeg');
      expect(result.blob).toBeInstanceOf(Blob);
    });

    test('should handle WebP conversion', async () => {
      const file = mockFiles.webp();
      const result = await processor.convertImage(file, 'jpeg', 'medium');
      
      expect(result.format).toBe('jpeg');
    });

    test('should maintain aspect ratio by default', async () => {
      const file = mockFiles.jpeg();
      const result = await processor.convertImage(file, 'png', 'medium', {
        width: 800
      });
      
      expect(result.width).toBe(800);
      expect(result.height).toBeDefined();
    });

    test('should respect custom dimensions', async () => {
      const file = mockFiles.jpeg();
      const result = await processor.convertImage(file, 'png', 'medium', {
        width: 800,
        height: 600,
        maintainAspectRatio: false
      });
      
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });
  });

  describe('convertImage - RAW File Handling', () => {
    test('should handle RAW file conversion', async () => {
      const file = mockFiles.cannonCR2();
      
      // Mock RAW detection to return true
      processor.rawDetector.validateRawFile = jest.fn().mockResolvedValue({
        isRawFile: true,
        detectedRawFormat: 'cr2',
        canConvert: true,
        supportedOutputFormats: ['jpeg', 'png'],
        recommendedOutputFormat: 'jpeg'
      });
      
      const result = await processor.convertImage(file, 'jpeg', 'high');
      
      expect(result.isRawConversion).toBe(true);
      expect(result.originalRawFormat).toBe('cr2');
      expect(result.format).toBe('jpeg');
    });

    test('should validate RAW conversion formats', async () => {
      const file = mockFiles.cannonCR2();
      
      processor.rawDetector.validateRawFile = jest.fn().mockResolvedValue({
        isRawFile: true,
        detectedRawFormat: 'cr2'
      });
      
      processor.rawDetector.validateRawConversion = jest.fn().mockReturnValue({
        isValid: false,
        error: 'Unsupported format for RAW conversion'
      });
      
      await expect(processor.convertImage(file, 'webp', 'medium'))
        .rejects.toThrow('RAW file conversion error');
    });

    test('should handle RAW format selection', async () => {
      const file = mockFiles.cannonCR2();
      
      processor.rawDetector.validateRawFile = jest.fn().mockResolvedValue({
        isRawFile: true,
        detectedRawFormat: 'cr2',
        recommendedOutputFormat: 'jpeg'
      });
      
      const result = await processor.convertImage(file, 'raw', 'medium');
      
      expect(result.format).toBe('jpeg'); // Should convert to recommended format
    });
  });

  describe('convertImage - Quality Settings', () => {
    test('should apply high quality settings', async () => {
      const file = mockFiles.jpeg();
      const result = await processor.convertImage(file, 'jpeg', 'high');
      
      expect(result).toBeDefined();
      // Quality would be reflected in the blob size/quality, but hard to test directly
    });

    test('should apply medium quality settings', async () => {
      const file = mockFiles.jpeg();
      const result = await processor.convertImage(file, 'jpeg', 'medium');
      
      expect(result).toBeDefined();
    });

    test('should apply low quality settings', async () => {
      const file = mockFiles.jpeg();
      const result = await processor.convertImage(file, 'jpeg', 'low');
      
      expect(result).toBeDefined();
    });

    test('should handle invalid quality settings', async () => {
      const file = mockFiles.jpeg();
      const result = await processor.convertImage(file, 'jpeg', 'invalid');
      
      // Should fall back to default quality
      expect(result).toBeDefined();
    });
  });

  describe('convertImage - Error Handling', () => {
    test('should handle security validation failures', async () => {
      const { validateImageFile } = require('../../utils/validationUtils');
      validateImageFile.mockResolvedValueOnce({
        valid: false,
        errors: ['Security threat detected']
      });
      
      const file = mockFiles.jpeg();
      
      await expect(processor.convertImage(file, 'png', 'medium'))
        .rejects.toThrow('Security validation failed');
    });

    test('should handle unsupported output formats', async () => {
      const file = mockFiles.jpeg();
      
      await expect(processor.convertImage(file, 'unsupported', 'medium'))
        .rejects.toThrow('Unsupported output format');
    });

    test('should handle createImageBitmap failures', async () => {
      global.createImageBitmap = jest.fn().mockRejectedValue(new Error('Bitmap creation failed'));
      
      const file = mockFiles.jpeg();
      
      await expect(processor.convertImage(file, 'png', 'medium'))
        .rejects.toThrow('Image conversion failed');
    });

    test('should handle canvas toBlob failures', async () => {
      HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
        callback(null); // Simulate failure
      });
      
      const file = mockFiles.jpeg();
      
      await expect(processor.convertImage(file, 'png', 'medium'))
        .rejects.toThrow();
    });
  });

  describe('convertImage - Progressive Processing', () => {
    test('should use progressive processing for large images', async () => {
      const file = mockFiles.hugePNG();
      
      // Mock dimensions to trigger progressive processing
      const originalCalculateOptimalDimensions = processor.calculateOptimalDimensions;
      processor.calculateOptimalDimensions = jest.fn().mockReturnValue({
        width: 8000,
        height: 6000
      });
      
      const result = await processor.convertImage(file, 'jpeg', 'medium');
      
      expect(result).toBeDefined();
      
      processor.calculateOptimalDimensions = originalCalculateOptimalDimensions;
    });

    test('should report progress during processing', async () => {
      const file = mockFiles.jpeg();
      const onProgress = jest.fn();
      
      await processor.convertImage(file, 'png', 'medium', { onProgress });
      
      expect(onProgress).toHaveBeenCalledWith(expect.any(Number), expect.any(String));
      expect(onProgress).toHaveBeenCalledWith(100, 'Conversion complete!');
    });
  });

  describe('batchConvert', () => {
    test('should convert multiple files successfully', async () => {
      const files = createBatchFiles(3);
      const onProgress = jest.fn();
      const onBatchProgress = jest.fn();
      
      const result = await processor.batchConvert(files, 'png', 'medium', {
        onProgress,
        onBatchProgress
      });
      
      expect(result.successCount).toBe(3);
      expect(result.errorCount).toBe(0);
      expect(result.totalCount).toBe(3);
      expect(result.results).toHaveLength(3);
      expect(onBatchProgress).toHaveBeenCalled();
    });

    test('should handle batch size limits', async () => {
      const files = createBatchFiles(100); // Exceeds limit
      
      await expect(processor.batchConvert(files, 'png', 'medium'))
        .rejects.toThrow('Batch size');
    });

    test('should handle total batch size limits', async () => {
      const files = Array.from({ length: 5 }, () => 
        createMockFile({
          size: 200 * 1024 * 1024 // 200MB each
        })
      );
      
      await expect(processor.batchConvert(files, 'png', 'medium'))
        .rejects.toThrow('Total batch size');
    });

    test('should continue processing after individual failures', async () => {
      const files = createBatchFiles(3);
      
      // Mock one file to fail
      const originalConvertImage = processor.convertImage;
      processor.convertImage = jest.fn()
        .mockImplementationOnce(() => Promise.reject(new Error('Conversion failed')))
        .mockImplementation(originalConvertImage);
      
      const result = await processor.batchConvert(files, 'png', 'medium');
      
      expect(result.successCount).toBe(2);
      expect(result.errorCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      
      processor.convertImage = originalConvertImage;
    });

    test('should track security metrics in batch processing', async () => {
      const files = createBatchFiles(3);
      
      const result = await processor.batchConvert(files, 'png', 'medium');
      
      expect(result.securityReport).toBeDefined();
      expect(result.securityReport.filesValidated).toBe(3);
    });
  });

  describe('applyFilter', () => {
    test('should apply brightness filter', async () => {
      const file = mockFiles.jpeg();
      const result = await processor.applyFilter(file, 'brightness', 1.2);
      
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.format).toBe('png');
    });

    test('should apply contrast filter', async () => {
      const file = mockFiles.jpeg();
      const result = await processor.applyFilter(file, 'contrast', 1.5);
      
      expect(result).toBeDefined();
    });

    test('should apply grayscale filter', async () => {
      const file = mockFiles.jpeg();
      const result = await processor.applyFilter(file, 'grayscale', 1);
      
      expect(result).toBeDefined();
    });

    test('should apply sepia filter', async () => {
      const file = mockFiles.jpeg();
      const result = await processor.applyFilter(file, 'sepia', 1);
      
      expect(result).toBeDefined();
    });

    test('should apply blur filter', async () => {
      const file = mockFiles.jpeg();
      const result = await processor.applyFilter(file, 'blur', 2);
      
      expect(result).toBeDefined();
    });

    test('should handle unknown filter types', async () => {
      const file = mockFiles.jpeg();
      
      await expect(processor.applyFilter(file, 'unknown', 1))
        .rejects.toThrow('Unknown filter type');
    });

    test('should report progress during filter application', async () => {
      const file = mockFiles.jpeg();
      const onProgress = jest.fn();
      
      await processor.applyFilter(file, 'brightness', 1.2, { onProgress });
      
      expect(onProgress).toHaveBeenCalled();
    });
  });

  describe('Utility Methods', () => {
    test('getMimeType should return correct MIME types', () => {
      expect(processor.getMimeType('jpeg')).toBe('image/jpeg');
      expect(processor.getMimeType('png')).toBe('image/png');
      expect(processor.getMimeType('webp')).toBe('image/webp');
      expect(processor.getMimeType('unknown')).toBe('image/png');
    });

    test('getQualityValue should return correct quality values', () => {
      expect(processor.getQualityValue('jpeg', 'high')).toBe(0.95);
      expect(processor.getQualityValue('jpeg', 'medium')).toBe(0.8);
      expect(processor.getQualityValue('jpeg', 'low')).toBe(0.6);
      expect(processor.getQualityValue('png', 'high')).toBeNull();
    });

    test('requiresBackground should identify formats correctly', () => {
      expect(processor.requiresBackground('jpeg')).toBe(true);
      expect(processor.requiresBackground('jpg')).toBe(true);
      expect(processor.requiresBackground('bmp')).toBe(true);
      expect(processor.requiresBackground('png')).toBe(false);
      expect(processor.requiresBackground('webp')).toBe(false);
    });

    test('estimateMemoryUsage should calculate correctly', () => {
      const usage = processor.estimateMemoryUsage(1920, 1080);
      expect(usage).toBe(1920 * 1080 * 4 * 1.2);
    });

    test('estimateOutputSize should provide reasonable estimates', () => {
      const estimate = processor.estimateOutputSize(
        2 * 1024 * 1024, // 2MB input
        'png',
        'jpeg',
        'medium'
      );
      
      expect(estimate).toBeGreaterThan(0);
      expect(estimate).toBeLessThan(2 * 1024 * 1024);
    });

    test('shouldUseProgressiveProcessing should determine correctly', () => {
      const needsProgressive = processor.shouldUseProgressiveProcessing(
        8000, 6000, 4000, 3000
      );
      expect(needsProgressive).toBe(true);
      
      const doesntNeedProgressive = processor.shouldUseProgressiveProcessing(
        800, 600, 400, 300
      );
      expect(doesntNeedProgressive).toBe(false);
    });
  });

  describe('Format Support and Validation', () => {
    test('getSupportedFormats should return available formats', () => {
      const formats = processor.getSupportedFormats();
      expect(formats).toBeInstanceOf(Array);
      expect(formats).toContain('jpeg');
      expect(formats).toContain('png');
    });

    test('getQualityPresets should return quality settings', () => {
      const presets = processor.getQualityPresets();
      expect(presets.high).toBeDefined();
      expect(presets.medium).toBeDefined();
      expect(presets.low).toBeDefined();
    });

    test('should validate input correctly', () => {
      const file = mockFiles.jpeg();
      
      // Should not throw for valid input
      expect(() => {
        processor.validateInput(file, 'png');
      }).not.toThrow();
      
      // Should throw for invalid file
      expect(() => {
        processor.validateInput(null, 'png');
      }).toThrow('Invalid file input');
      
      // Should throw for unsupported format
      expect(() => {
        processor.validateInput(file, 'unsupported');
      }).toThrow('Unsupported output format');
    });

    test('getFormatFallback should provide appropriate fallbacks', () => {
      expect(processor.getFormatFallback('avif')).toBe('jpeg');
      expect(processor.getFormatFallback('webp')).toBe('jpeg');
      expect(processor.getFormatFallback('gif', true)).toBe('png');
      expect(processor.getFormatFallback('bmp')).toBe('png');
    });
  });

  describe('Performance Statistics', () => {
    test('should track performance statistics', async () => {
      const file = mockFiles.jpeg();
      await processor.convertImage(file, 'png', 'medium');
      
      const stats = processor.getPerformanceStats();
      expect(stats.totalProcessed).toBe(1);
      expect(stats.averageProcessingTime).toBeGreaterThan(0);
    });

    test('should update statistics correctly', () => {
      processor.updateStats(1000, 2048);
      
      expect(processor.stats.totalProcessed).toBe(1);
      expect(processor.stats.averageProcessingTime).toBe(1000);
      expect(processor.stats.memoryPeakUsage).toBe(2048);
    });
  });

  describe('Security Features', () => {
    test('should enforce processing time limits', async () => {
      const file = mockFiles.hugePNG();
      
      // Mock estimation to exceed limits
      processor.estimateProcessingTime = jest.fn().mockReturnValue(400000); // 6.67 minutes
      
      await expect(processor.convertImage(file, 'jpeg', 'medium'))
        .rejects.toThrow('processing time');
    });

    test('should enforce memory usage limits', async () => {
      const file = mockFiles.hugePNG();
      
      // Mock estimation to exceed limits
      processor.estimateMemoryUsage = jest.fn().mockReturnValue(200 * 1024 * 1024); // 200MB
      
      await expect(processor.convertImage(file, 'jpeg', 'medium'))
        .rejects.toThrow('memory');
    });

    test('should validate file extensions', () => {
      const extensions = processor.getExpectedExtensions('image/jpeg');
      expect(extensions).toEqual(['jpg', 'jpeg']);
      
      const pngExtensions = processor.getExpectedExtensions('image/png');
      expect(pngExtensions).toEqual(['png']);
    });
  });
});

describe('Factory Functions', () => {
  test('getModernImageProcessor should return singleton', () => {
    const processor1 = getModernImageProcessor();
    const processor2 = getModernImageProcessor();
    
    expect(processor1).toBe(processor2);
    expect(processor1).toBeInstanceOf(ModernImageProcessor);
  });

  test('destroyModernImageProcessor should clear singleton', () => {
    const processor1 = getModernImageProcessor();
    destroyModernImageProcessor();
    const processor2 = getModernImageProcessor();
    
    expect(processor1).not.toBe(processor2);
  });
});

describe('Canvas Operations', () => {
  test('canvasToBlobWithFallback should handle format fallbacks', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    
    // Mock toBlob to fail for initial format
    HTMLCanvasElement.prototype.toBlob = jest.fn((callback, mimeType) => {
      if (mimeType === 'image/avif') {
        callback(null); // Fail for AVIF
      } else {
        callback(new Blob(['test'], { type: mimeType }));
      }
    });
    
    const result = await processor.canvasToBlobWithFallback(canvas, 'avif', 'high');
    
    expect(result.wasFallback).toBe(true);
    expect(result.actualFormat).not.toBe('avif');
  });

  test('canvasHasTransparency should detect transparency', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Mock getImageData to return transparent pixels
    ctx.getImageData = jest.fn(() => ({
      data: new Uint8ClampedArray([255, 255, 255, 128]) // Last value is alpha < 255
    }));
    
    const hasTransparency = processor.canvasHasTransparency(canvas);
    expect(hasTransparency).toBe(true);
  });

  test('should handle canvas transparency check errors', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Mock getImageData to throw error
    ctx.getImageData = jest.fn(() => {
      throw new Error('Canvas error');
    });
    
    const hasTransparency = processor.canvasHasTransparency(canvas);
    expect(hasTransparency).toBe(false);
  });
});

describe('Error Recovery and Edge Cases', () => {
  test('should handle createOptimizedImageBitmap fallback', async () => {
    // Mock createImageBitmap to fail with options, succeed without
    global.createImageBitmap = jest.fn()
      .mockRejectedValueOnce(new Error('Options not supported'))
      .mockResolvedValue({
        width: 100,
        height: 100,
        close: jest.fn()
      });
    
    const file = mockFiles.jpeg();
    const bitmap = await processor.createOptimizedImageBitmap(file);
    
    expect(bitmap).toBeDefined();
    expect(global.createImageBitmap).toHaveBeenCalledTimes(2);
  });

  test('should handle dimension calculation edge cases', () => {
    const dimensions = processor.calculateOptimalDimensions(0, 0, {});
    expect(dimensions.width).toBeGreaterThan(0);
    expect(dimensions.height).toBeGreaterThan(0);
  });

  test('should handle filter application errors', async () => {
    const file = mockFiles.jpeg();
    
    // Mock drawImage to throw error
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      drawImage: jest.fn(() => {
        throw new Error('Canvas error');
      }),
      getImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(400)
      })),
      putImageData: jest.fn()
    }));
    
    await expect(processor.applyFilter(file, 'brightness', 1.2))
      .rejects.toThrow();
    
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });
});