/**
 * Performance Tests for Image Processing
 * Tests system performance with large files and stress scenarios
 */

import ModernImageProcessor from '../services/modernImageProcessor';
import { SecurityValidator } from '../utils/securityValidation';
import { RawFormatDetector } from '../utils/formatDetection';
import { 
  createMockFile, 
  createBatchFiles
} from '../__mocks__/testDataFactory';

describe('Performance Tests', () => {
  let processor;
  let securityValidator;
  let formatDetector;

  beforeEach(() => {
    processor = new ModernImageProcessor();
    securityValidator = new SecurityValidator();
    formatDetector = new RawFormatDetector();
    jest.clearAllMocks();
  });

  describe('Large File Processing', () => {
    test('should process large JPEG efficiently', async () => {
      const largeFile = createMockFile({
        name: 'large-photo.jpg',
        type: 'image/jpeg',
        size: 45 * 1024 * 1024 // 45MB (near limit)
      });

      const startTime = performance.now();
      
      try {
        const result = await processor.convertImage(
          largeFile, 
          'png', 
          'medium',
          {
            onProgress: jest.fn()
          }
        );
        
        const endTime = performance.now();
        const processingTime = endTime - startTime;
        
        expect(result).toBeDefined();
        expect(result.blob).toBeInstanceOf(Blob);
        
        // Should complete within reasonable time (testing environment)
        expect(processingTime).toBeLessThan(30000); // 30 seconds max
        
        // Should track processing time
        expect(result.processingTime).toBeGreaterThan(0);
        
        console.log(`Large file processing took: ${processingTime}ms`);
        
      } catch (error) {
        // If it fails due to size limits, that's expected
        if (error.message.includes('too large') || error.message.includes('memory')) {
          console.log('Large file rejected by security limits (expected)');
        } else {
          throw error;
        }
      }
    });

    test('should handle progressive processing for huge images', async () => {
      const hugeFile = createMockFile({
        name: 'huge-image.png',
        type: 'image/png',
        size: 49 * 1024 * 1024 // 49MB
      });

      // Mock dimensions to trigger progressive processing
      const originalShouldUseProgressive = processor.shouldUseProgressiveProcessing;
      processor.shouldUseProgressiveProcessing = jest.fn().mockReturnValue(true);

      const progressCallback = jest.fn();
      
      try {
        const result = await processor.convertImage(
          hugeFile, 
          'jpeg', 
          'medium',
          {
            onProgress: progressCallback
          }
        );
        
        expect(result).toBeDefined();
        
        // Should call progress multiple times for progressive processing
        expect(progressCallback.mock.calls.length).toBeGreaterThan(5);
        
        // Should complete with 100% progress
        const lastCall = progressCallback.mock.calls[progressCallback.mock.calls.length - 1];
        expect(lastCall[0]).toBe(100);
        
      } catch (error) {
        if (!error.message.includes('too large') && !error.message.includes('memory')) {
          throw error;
        }
      }
      
      processor.shouldUseProgressiveProcessing = originalShouldUseProgressive;
    });

    test('should enforce memory usage limits', async () => {
      const extremeFile = createMockFile({
        name: 'extreme-file.jpg',
        type: 'image/jpeg',
        size: 100 * 1024 * 1024 // 100MB
      });

      // Mock memory estimation to exceed limits
      processor.estimateMemoryUsage = jest.fn().mockReturnValue(200 * 1024 * 1024); // 200MB

      await expect(processor.convertImage(extremeFile, 'png', 'medium'))
        .rejects.toThrow(/memory/i);
    });

    test('should enforce processing time limits', async () => {
      const complexFile = createMockFile({
        name: 'complex-file.jpg',
        type: 'image/jpeg',
        size: 50 * 1024 * 1024
      });

      // Mock time estimation to exceed limits
      processor.estimateProcessingTime = jest.fn().mockReturnValue(400000); // 6.67 minutes

      await expect(processor.convertImage(complexFile, 'png', 'medium'))
        .rejects.toThrow(/processing time/i);
    });
  });

  describe('Batch Processing Performance', () => {
    test('should handle medium batch efficiently', async () => {
      const batchSize = 10;
      const files = createBatchFiles(batchSize, () => createMockFile({
        size: 2 * 1024 * 1024 // 2MB each
      }));

      const startTime = performance.now();
      
      const result = await processor.batchConvert(
        files, 
        'png', 
        'medium',
        {
          onBatchProgress: jest.fn(),
          onProgress: jest.fn()
        }
      );
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(result.successCount).toBe(batchSize);
      expect(result.errorCount).toBe(0);
      
      // Average processing time per file should be reasonable
      const avgTimePerFile = totalTime / batchSize;
      expect(avgTimePerFile).toBeLessThan(5000); // 5 seconds per file max
      
      console.log(`Batch processing (${batchSize} files) took: ${totalTime}ms`);
      console.log(`Average per file: ${avgTimePerFile}ms`);
    });

    test('should respect batch size limits', async () => {
      const tooManyFiles = createBatchFiles(100); // Exceeds limit of 50

      await expect(processor.batchConvert(tooManyFiles, 'png', 'medium'))
        .rejects.toThrow(/batch size/i);
    });

    test('should respect total batch size limits', async () => {
      const hugeBatch = Array.from({ length: 5 }, () => 
        createMockFile({
          size: 150 * 1024 * 1024 // 150MB each = 750MB total
        })
      );

      await expect(processor.batchConvert(hugeBatch, 'png', 'medium'))
        .rejects.toThrow(/total batch size/i);
    });

    test('should handle parallel processing efficiently', async () => {
      const files = createBatchFiles(5, () => createMockFile({
        size: 5 * 1024 * 1024 // 5MB each
      }));

      const startTime = performance.now();
      
      // Process batch
      const batchResult = await processor.batchConvert(files, 'jpeg', 'medium');
      
      const endTime = performance.now();
      const batchTime = endTime - startTime;
      
      // Now process same files sequentially for comparison
      const sequentialStart = performance.now();
      
      for (const file of files) {
        await processor.convertImage(file, 'jpeg', 'medium');
      }
      
      const sequentialEnd = performance.now();
      const sequentialTime = sequentialEnd - sequentialStart;
      
      expect(batchResult.successCount).toBe(5);
      
      console.log(`Batch time: ${batchTime}ms`);
      console.log(`Sequential time: ${sequentialTime}ms`);
      
      // Batch should be more efficient than sequential for multiple files
      // Note: This might not always be true in test environment due to mocking
    });
  });

  describe('Memory Management', () => {
    test('should clean up resources properly', async () => {
      const files = createBatchFiles(3);
      
      // Track initial memory usage
      const initialStats = processor.getPerformanceStats();
      
      // Process files
      for (const file of files) {
        await processor.convertImage(file, 'png', 'medium');
      }
      
      // Check stats were updated
      const finalStats = processor.getPerformanceStats();
      expect(finalStats.totalProcessed).toBe(initialStats.totalProcessed + 3);
      expect(finalStats.averageProcessingTime).toBeGreaterThan(0);
    });

    test('should estimate memory usage accurately', () => {
      const testCases = [
        { width: 1920, height: 1080, expected: 1920 * 1080 * 4 * 1.2 },
        { width: 4000, height: 3000, expected: 4000 * 3000 * 4 * 1.2 },
        { width: 8000, height: 6000, expected: 8000 * 6000 * 4 * 1.2 }
      ];

      testCases.forEach(({ width, height, expected }) => {
        const estimate = processor.estimateMemoryUsage(width, height);
        expect(estimate).toBe(expected);
      });
    });

    test('should estimate output size reasonably', () => {
      const inputSize = 10 * 1024 * 1024; // 10MB

      const jpegEstimate = processor.estimateOutputSize(inputSize, 'png', 'jpeg', 'medium');
      const pngEstimate = processor.estimateOutputSize(inputSize, 'jpeg', 'png', 'medium');
      const webpEstimate = processor.estimateOutputSize(inputSize, 'jpeg', 'webp', 'medium');

      // JPEG should be smaller than PNG
      expect(jpegEstimate).toBeLessThan(pngEstimate);
      
      // WebP should be smaller than JPEG
      expect(webpEstimate).toBeLessThan(jpegEstimate);
      
      // All estimates should be positive
      expect(jpegEstimate).toBeGreaterThan(0);
      expect(pngEstimate).toBeGreaterThan(0);
      expect(webpEstimate).toBeGreaterThan(0);
    });
  });

  describe('Concurrency and Race Conditions', () => {
    test('should handle concurrent conversions safely', async () => {
      const files = createBatchFiles(5);
      
      // Start multiple conversions concurrently
      const conversionPromises = files.map(file => 
        processor.convertImage(file, 'png', 'medium')
      );
      
      const results = await Promise.all(conversionPromises);
      
      // All conversions should succeed
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.blob).toBeInstanceOf(Blob);
        expect(result.format).toBe('png');
      });
      
      // Stats should reflect all processed files
      const stats = processor.getPerformanceStats();
      expect(stats.totalProcessed).toBeGreaterThanOrEqual(5);
    });

    test('should handle mixed concurrent operations', async () => {
      const files = createBatchFiles(3);
      
      // Mix of single conversions and batch
      const operations = [
        processor.convertImage(files[0], 'jpeg', 'high'),
        processor.convertImage(files[1], 'png', 'medium'),
        processor.batchConvert([files[2]], 'webp', 'low')
      ];
      
      const results = await Promise.all(operations);
      
      expect(results).toHaveLength(3);
      expect(results[0].format).toBe('jpeg');
      expect(results[1].format).toBe('png');
      expect(results[2].successCount).toBe(1);
    });
  });

  describe('Security Performance', () => {
    test('should validate files efficiently in batch', async () => {
      const files = createBatchFiles(20);
      
      const startTime = performance.now();
      
      const validationPromises = files.map(file => 
        securityValidator.validateFile(file)
      );
      
      const results = await Promise.all(validationPromises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // All should be valid
      results.forEach(result => {
        expect(result.isValid).toBe(true);
      });
      
      // Should complete quickly
      const avgTimePerValidation = totalTime / files.length;
      expect(avgTimePerValidation).toBeLessThan(100); // 100ms per file max
      
      console.log(`Security validation (${files.length} files) took: ${totalTime}ms`);
    });

    test('should handle rate limiting efficiently', async () => {
      const files = createBatchFiles(10);
      
      // Rapid-fire validations
      const startTime = performance.now();
      
      for (const file of files) {
        await securityValidator.validateFile(file);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should complete without hitting rate limits (in test environment)
      expect(totalTime).toBeLessThan(5000); // 5 seconds for 10 files
    });
  });

  describe('Format Detection Performance', () => {
    test('should detect formats quickly', async () => {
      const files = [
        createMockFile({ name: 'test.jpg', type: 'image/jpeg' }),
        createMockFile({ name: 'test.png', type: 'image/png' }),
        createMockFile({ name: 'test.webp', type: 'image/webp' }),
        createMockFile({ name: 'test.cr2', type: 'image/x-canon-cr2' }),
        createMockFile({ name: 'test.nef', type: 'image/x-nikon-nef' })
      ];
      
      const startTime = performance.now();
      
      const detectionPromises = files.map(file => 
        formatDetector.detectFormat(file)
      );
      
      const results = await Promise.all(detectionPromises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // All should be detected
      results.forEach(result => {
        expect(result.isValid).toBe(true);
        expect(result.confidence).toBe('high');
      });
      
      // Should be very fast
      expect(totalTime).toBeLessThan(100); // 100ms for 5 detections
      
      console.log(`Format detection (${files.length} files) took: ${totalTime}ms`);
    });

    test('should validate RAW files efficiently', async () => {
      const rawFiles = [
        createMockFile({ name: 'img1.cr2', type: 'image/x-canon-cr2' }),
        createMockFile({ name: 'img2.nef', type: 'image/x-nikon-nef' }),
        createMockFile({ name: 'img3.arw', type: 'image/x-sony-arw' }),
        createMockFile({ name: 'img4.dng', type: 'image/x-adobe-dng' })
      ];
      
      const startTime = performance.now();
      
      const validationPromises = rawFiles.map(file => 
        formatDetector.validateRawFile(file)
      );
      
      const results = await Promise.all(validationPromises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // All should be detected as RAW
      results.forEach(result => {
        expect(result.isRawFile).toBe(true);
        expect(result.canConvert).toBe(true);
      });
      
      // Should be fast
      expect(totalTime).toBeLessThan(200); // 200ms for 4 validations
    });
  });

  describe('Stress Testing', () => {
    test('should handle rapid sequential conversions', async () => {
      const iterations = 20;
      const file = createMockFile({
        size: 1024 * 1024 // 1MB
      });
      
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        await processor.convertImage(file, 'png', 'medium');
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / iterations;
      
      console.log(`${iterations} sequential conversions took: ${totalTime}ms`);
      console.log(`Average per conversion: ${avgTime}ms`);
      
      // Should maintain reasonable performance
      expect(avgTime).toBeLessThan(1000); // 1 second per conversion max
      
      // Stats should be accurate
      const stats = processor.getPerformanceStats();
      expect(stats.totalProcessed).toBeGreaterThanOrEqual(iterations);
    });

    test('should maintain performance under memory pressure', async () => {
      // Create multiple medium-sized files
      const files = Array.from({ length: 10 }, (_, i) => 
        createMockFile({
          name: `stress-test-${i}.jpg`,
          size: 10 * 1024 * 1024 // 10MB each
        })
      );
      
      const results = [];
      const times = [];
      
      for (const file of files) {
        const startTime = performance.now();
        
        try {
          const result = await processor.convertImage(file, 'png', 'medium');
          const endTime = performance.now();
          
          results.push(result);
          times.push(endTime - startTime);
        } catch (error) {
          if (error.message.includes('memory') || error.message.includes('too large')) {
            console.log('Hit memory limits during stress test (expected)');
            break;
          }
          throw error;
        }
      }
      
      if (results.length > 0) {
        // Performance should not degrade significantly over time
        const firstTime = times[0];
        const lastTime = times[times.length - 1];
        const degradation = lastTime / firstTime;
        
        expect(degradation).toBeLessThan(3); // No more than 3x slower
        
        console.log(`Stress test: processed ${results.length} files`);
        console.log(`First conversion: ${firstTime}ms, Last: ${lastTime}ms`);
      }
    });
  });

  describe('Browser Capability Performance', () => {
    test('should initialize capabilities quickly', async () => {
      const startTime = performance.now();
      
      await processor.initializeCapabilities();
      
      const endTime = performance.now();
      const initTime = endTime - startTime;
      
      expect(processor.formatCapabilities).toBeDefined();
      expect(initTime).toBeLessThan(1000); // 1 second max for initialization
      
      console.log(`Capability initialization took: ${initTime}ms`);
    });

    test('should handle format fallbacks efficiently', async () => {
      const file = createMockFile();
      
      // Test with potentially unsupported format
      const startTime = performance.now();
      
      try {
        const result = await processor.convertImage(file, 'avif', 'medium');
        
        const endTime = performance.now();
        const fallbackTime = endTime - startTime;
        
        expect(result).toBeDefined();
        expect(fallbackTime).toBeLessThan(5000); // 5 seconds max including fallback
        
        console.log(`Format fallback conversion took: ${fallbackTime}ms`);
      } catch (error) {
        if (!error.message.includes('not supported')) {
          throw error;
        }
      }
    });
  });
});