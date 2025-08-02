/**
 * Unit Tests for useOptimizedImageProcessing Hook
 * Tests React hook functionality for image processing
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { 
  useImageProcessing, 
  useQualityPresets, 
  useFormatInfo 
} from '../useOptimizedImageProcessing';
import { 
  mockFiles, 
  createMockConversionResult,
  createBatchFiles,
  createMockProgressCallback
} from '../../__mocks__/testDataFactory';

// Mock the image processing service
const mockService = {
  isInitialized: true,
  convertImage: jest.fn(),
  applyFilter: jest.fn(),
  batchConvert: jest.fn(),
  getQualityPresets: jest.fn(),
  getSupportedFormats: jest.fn(),
  estimateOutputSize: jest.fn(),
  getPerformanceStats: jest.fn()
};

jest.mock('../../services/imageProcessingService', () => ({
  getImageProcessingService: jest.fn(() => mockService)
}));

// Mock the app store
const mockNotifications = {
  addNotification: jest.fn()
};

jest.mock('../../store/appStore', () => ({
  useNotifications: jest.fn(() => mockNotifications)
}));

// Mock the format detection
const mockRawDetector = {
  validateRawFile: jest.fn(),
  getAvailableOutputFormats: jest.fn(),
  getFormatInfo: jest.fn()
};

jest.mock('../../utils/formatDetection', () => ({
  createRawDetector: jest.fn(() => mockRawDetector),
  rawFormatDetector: mockRawDetector,
  getFormatInfo: jest.fn()
}));

describe('useImageProcessing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock implementations
    mockService.getQualityPresets.mockResolvedValue({
      high: { jpeg: 0.95, webp: 0.9 },
      medium: { jpeg: 0.8, webp: 0.75 },
      low: { jpeg: 0.6, webp: 0.5 }
    });
    
    mockService.getSupportedFormats.mockResolvedValue([
      'jpeg', 'png', 'webp', 'avif', 'bmp', 'gif'
    ]);
    
    mockRawDetector.validateRawFile.mockResolvedValue({
      isRawFile: false,
      detectedRawFormat: null,
      canConvert: false
    });
    
    mockRawDetector.getAvailableOutputFormats.mockResolvedValue([
      'jpeg', 'png', 'webp'
    ]);
  });

  describe('Hook Initialization', () => {
    test('should initialize with correct default state', () => {
      const { result } = renderHook(() => useImageProcessing());
      
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.progress).toBe(0);
      expect(result.current.progressMessage).toBe('');
      expect(result.current.error).toBe(null);
      expect(result.current.result).toBe(null);
    });

    test('should load quality presets and supported formats on mount', async () => {
      const { result } = renderHook(() => useImageProcessing());
      
      await waitFor(() => {
        expect(result.current.qualityPresets).toBeDefined();
        expect(result.current.supportedFormats).toBeDefined();
      });
      
      expect(mockService.getQualityPresets).toHaveBeenCalled();
      expect(mockService.getSupportedFormats).toHaveBeenCalled();
    });

    test('should handle service initialization errors', async () => {
      mockService.isInitialized = false;
      
      const { result } = renderHook(() => useImageProcessing());
      
      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
      
      expect(mockNotifications.addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Service Initialization Failed'
        })
      );
    });

    test('should indicate when ready', async () => {
      const { result } = renderHook(() => useImageProcessing());
      
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });
    });
  });

  describe('convertImage', () => {
    test('should convert image successfully', async () => {
      const mockResult = createMockConversionResult();
      mockService.convertImage.mockResolvedValue(mockResult);
      
      const { result } = renderHook(() => useImageProcessing());
      
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });
      
      const file = mockFiles.jpeg();
      
      await act(async () => {
        await result.current.convertImage(file, 'png', 'medium');
      });
      
      expect(result.current.result).toEqual(mockResult);
      expect(result.current.progress).toBe(100);
      expect(result.current.isComplete).toBe(true);
      expect(mockNotifications.addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          title: 'Image Converted!'
        })
      );
    });

    test('should handle RAW file conversion', async () => {
      const file = mockFiles.cannonCR2();
      const mockResult = createMockConversionResult({
        isRawConversion: true,
        originalRawFormat: 'cr2'
      });
      
      mockService.convertImage.mockResolvedValue(mockResult);
      mockRawDetector.validateRawFile.mockResolvedValue({
        isRawFile: true,
        detectedRawFormat: 'cr2',
        canConvert: true
      });
      
      const { result } = renderHook(() => useImageProcessing());
      
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });
      
      await act(async () => {
        await result.current.convertImage(file, 'jpeg', 'high');
      });
      
      expect(result.current.result.isRawConversion).toBe(true);
      expect(mockNotifications.addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
          title: 'RAW File Detected'
        })
      );
    });

    test('should validate RAW conversion formats', async () => {
      const file = mockFiles.cannonCR2();
      
      mockRawDetector.validateRawFile.mockResolvedValue({
        isRawFile: true,
        detectedRawFormat: 'cr2'
      });
      
      const { result } = renderHook(() => useImageProcessing());
      
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });
      
      await act(async () => {
        try {
          await result.current.convertImage(file, 'webp', 'medium');
        } catch (error) {
          expect(error.message).toContain('RAW files can only be converted to JPEG or PNG');
        }
      });
    });

    test('should handle conversion errors', async () => {
      mockService.convertImage.mockRejectedValue(new Error('Conversion failed'));
      
      const { result } = renderHook(() => useImageProcessing());
      
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });
      
      const file = mockFiles.jpeg();
      
      await act(async () => {
        try {
          await result.current.convertImage(file, 'png', 'medium');
        } catch (error) {
          expect(error.message).toBe('Conversion failed');
        }
      });
      
      expect(result.current.error).toBeDefined();
      expect(result.current.hasError).toBe(true);
      expect(mockNotifications.addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Conversion Failed'
        })
      );
    });

    test('should track progress during conversion', async () => {
      let progressCallback;
      mockService.convertImage.mockImplementation((file, format, quality, options) => {
        progressCallback = options.onProgress;
        return Promise.resolve(createMockConversionResult());
      });
      
      const { result } = renderHook(() => useImageProcessing());
      
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });
      
      const file = mockFiles.jpeg();
      
      await act(async () => {
        const conversionPromise = result.current.convertImage(file, 'png', 'medium');
        
        // Simulate progress updates
        if (progressCallback) {
          progressCallback(25, 'Processing...');
          progressCallback(50, 'Converting...');
          progressCallback(75, 'Finalizing...');
        }
        
        await conversionPromise;
      });
      
      expect(result.current.progress).toBe(100);
    });

    test('should reset state before conversion', async () => {
      const { result } = renderHook(() => useImageProcessing());
      
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });
      
      // Set some initial state
      await act(async () => {
        result.current.reset();
      });
      
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.progress).toBe(0);
      expect(result.current.error).toBe(null);
      expect(result.current.result).toBe(null);
    });
  });

  describe('applyFilter', () => {
    test('should apply filter successfully', async () => {
      const mockResult = {
        blob: new Blob(['filtered'], { type: 'image/png' }),
        width: 1920,
        height: 1080,
        format: 'png'
      };
      
      mockService.applyFilter.mockResolvedValue(mockResult);
      
      const { result } = renderHook(() => useImageProcessing());
      
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });
      
      const file = mockFiles.jpeg();
      
      await act(async () => {
        await result.current.applyFilter(file, 'brightness', 1.2);
      });
      
      expect(result.current.result).toEqual(mockResult);
      expect(mockNotifications.addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          title: 'Filter Applied!'
        })
      );
    });

    test('should handle filter application errors', async () => {
      mockService.applyFilter.mockRejectedValue(new Error('Filter failed'));
      
      const { result } = renderHook(() => useImageProcessing());
      
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });
      
      const file = mockFiles.jpeg();
      
      await act(async () => {
        try {
          await result.current.applyFilter(file, 'brightness', 1.2);
        } catch (error) {
          expect(error.message).toBe('Filter failed');
        }
      });
      
      expect(result.current.error).toBeDefined();
      expect(mockNotifications.addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Filter Failed'
        })
      );
    });
  });

  describe('batchConvert', () => {
    test('should batch convert files successfully', async () => {
      const files = createBatchFiles(3);
      const mockBatchResult = {
        results: files.map(file => ({ originalFile: file, result: createMockConversionResult(), success: true })),
        errors: [],
        successCount: 3,
        errorCount: 0,
        totalCount: 3
      };
      
      mockService.batchConvert.mockResolvedValue(mockBatchResult);
      
      const { result } = renderHook(() => useImageProcessing());
      
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });
      
      await act(async () => {
        await result.current.batchConvert(files, 'png', 'medium');
      });
      
      expect(result.current.result).toEqual(mockBatchResult);
      expect(mockNotifications.addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          title: 'Batch Conversion Complete!'
        })
      );
    });

    test('should handle batch conversion with errors', async () => {
      const files = createBatchFiles(3);
      const mockBatchResult = {
        results: [{ originalFile: files[0], result: createMockConversionResult(), success: true }],
        errors: [
          { originalFile: files[1], error: 'Error 1', success: false },
          { originalFile: files[2], error: 'Error 2', success: false }
        ],
        successCount: 1,
        errorCount: 2,
        totalCount: 3
      };
      
      mockService.batchConvert.mockResolvedValue(mockBatchResult);
      
      const { result } = renderHook(() => useImageProcessing());
      
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });
      
      await act(async () => {
        await result.current.batchConvert(files, 'png', 'medium');
      });
      
      expect(mockNotifications.addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          title: 'Batch Conversion Finished'
        })
      );
    });

    test('should handle batch conversion errors', async () => {
      mockService.batchConvert.mockRejectedValue(new Error('Batch failed'));
      
      const { result } = renderHook(() => useImageProcessing());
      
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });
      
      const files = createBatchFiles(2);
      
      await act(async () => {
        try {
          await result.current.batchConvert(files, 'png', 'medium');
        } catch (error) {
          expect(error.message).toBe('Batch failed');
        }
      });
      
      expect(mockNotifications.addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Batch Conversion Failed'
        })
      );
    });
  });

  describe('RAW File Utilities', () => {
    test('should validate RAW files', async () => {
      const file = mockFiles.cannonCR2();
      const mockValidation = {
        isRawFile: true,
        detectedRawFormat: 'cr2',
        canConvert: true
      };
      
      mockRawDetector.validateRawFile.mockResolvedValue(mockValidation);
      
      const { result } = renderHook(() => useImageProcessing());
      
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });
      
      let validationResult;
      await act(async () => {
        validationResult = await result.current.validateRawFile(file);
      });
      
      expect(validationResult).toEqual(mockValidation);
    });

    test('should get available formats for file', async () => {
      const file = mockFiles.cannonCR2();
      const expectedFormats = ['jpeg', 'png'];
      
      mockRawDetector.getAvailableOutputFormats.mockResolvedValue(expectedFormats);
      
      const { result } = renderHook(() => useImageProcessing());
      
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });
      
      let formats;
      await act(async () => {
        formats = await result.current.getAvailableFormatsForFile(file);
      });
      
      expect(formats).toEqual(expectedFormats);
    });

    test('should check if file is RAW', async () => {
      const file = mockFiles.cannonCR2();
      
      mockRawDetector.validateRawFile.mockResolvedValue({
        isRawFile: true
      });
      
      const { result } = renderHook(() => useImageProcessing());
      
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });
      
      let isRaw;
      await act(async () => {
        isRaw = await result.current.isRawFile(file);
      });
      
      expect(isRaw).toBe(true);
    });
  });

  describe('Utility Functions', () => {
    test('should estimate output size', async () => {
      mockService.estimateOutputSize.mockReturnValue(1024 * 1024);
      
      const { result } = renderHook(() => useImageProcessing());
      
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });
      
      const estimate = result.current.estimateOutputSize(
        2 * 1024 * 1024,
        'png',
        'jpeg',
        'medium'
      );
      
      expect(estimate).toBe(1024 * 1024);
    });

    test('should get performance stats', async () => {
      const mockStats = {
        totalProcessed: 5,
        averageProcessingTime: 1500,
        memoryPeakUsage: 1024 * 1024
      };
      
      mockService.getPerformanceStats.mockReturnValue(mockStats);
      
      const { result } = renderHook(() => useImageProcessing());
      
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });
      
      const stats = result.current.getPerformanceStats();
      expect(stats).toEqual(mockStats);
    });

    test('should cancel operations', async () => {
      const { result } = renderHook(() => useImageProcessing());
      
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });
      
      await act(async () => {
        result.current.cancel();
      });
      
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.progressMessage).toBe('Cancelled');
    });
  });

  describe('State Management', () => {
    test('should have correct convenience getters', async () => {
      const { result } = renderHook(() => useImageProcessing());
      
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });
      
      expect(result.current.hasError).toBe(false);
      expect(result.current.isComplete).toBe(false);
      
      // Simulate error state
      mockService.convertImage.mockRejectedValue(new Error('Test error'));
      const file = mockFiles.jpeg();
      
      await act(async () => {
        try {
          await result.current.convertImage(file, 'png', 'medium');
        } catch (error) {
          // Expected
        }
      });
      
      expect(result.current.hasError).toBe(true);
    });

    test('should reset state correctly', async () => {
      const { result } = renderHook(() => useImageProcessing());
      
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });
      
      // Set some state
      await act(async () => {
        try {
          result.current.reset();
        } catch (error) {
          // Set error state
        }
      });
      
      // Reset
      await act(async () => {
        result.current.reset();
      });
      
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.progress).toBe(0);
      expect(result.current.error).toBe(null);
      expect(result.current.result).toBe(null);
    });
  });

  describe('Error Handling', () => {
    test('should handle service unavailability', async () => {
      mockService.isInitialized = false;
      
      const { result } = renderHook(() => useImageProcessing());
      
      const file = mockFiles.jpeg();
      
      await act(async () => {
        try {
          await result.current.convertImage(file, 'png', 'medium');
        } catch (error) {
          expect(error.message).toContain('not available');
        }
      });
    });

    test('should handle RAW detector unavailability', async () => {
      const { result } = renderHook(() => useImageProcessing());
      
      // Simulate RAW detector not being available
      result.current.rawDetectorRef = { current: null };
      
      const file = mockFiles.cannonCR2();
      
      await act(async () => {
        try {
          await result.current.convertImage(file, 'jpeg', 'medium');
        } catch (error) {
          expect(error.message).toContain('RAW detector not available');
        }
      });
    });
  });
});

describe('useQualityPresets', () => {
  test('should load quality presets', async () => {
    const mockPresets = {
      high: { jpeg: 0.95, webp: 0.9 },
      medium: { jpeg: 0.8, webp: 0.75 },
      low: { jpeg: 0.6, webp: 0.5 }
    };
    
    mockService.getQualityPresets.mockResolvedValue(mockPresets);
    
    const { result } = renderHook(() => useQualityPresets());
    
    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.presets).toEqual(mockPresets);
    });
  });

  test('should handle preset loading errors', async () => {
    mockService.getQualityPresets.mockRejectedValue(new Error('Load failed'));
    
    const { result } = renderHook(() => useQualityPresets());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeDefined();
    });
  });
});

describe('useFormatInfo', () => {
  test('should load format information', async () => {
    const mockFormats = ['jpeg', 'png', 'webp'];
    mockService.getSupportedFormats.mockResolvedValue(mockFormats);
    
    const { result } = renderHook(() => useFormatInfo());
    
    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.formats).toEqual(mockFormats);
    });
  });

  test('should provide format metadata', async () => {
    const { result } = renderHook(() => useFormatInfo());
    
    await waitFor(() => {
      expect(result.current.formatInfo).toBeDefined();
    });
    
    const jpegInfo = result.current.getFormatInfo('jpeg');
    expect(jpegInfo.name).toBe('JPEG');
    expect(jpegInfo.compressionType).toBe('lossy');
    expect(jpegInfo.supportsTransparency).toBe(false);
    
    const pngInfo = result.current.getFormatInfo('png');
    expect(pngInfo.name).toBe('PNG');
    expect(pngInfo.compressionType).toBe('lossless');
    expect(pngInfo.supportsTransparency).toBe(true);
  });

  test('should handle unknown formats', async () => {
    const { result } = renderHook(() => useFormatInfo());
    
    await waitFor(() => {
      expect(result.current.formatInfo).toBeDefined();
    });
    
    const unknownInfo = result.current.getFormatInfo('unknown');
    expect(unknownInfo).toBe(null);
  });

  test('should include RAW format information', async () => {
    const { result } = renderHook(() => useFormatInfo());
    
    await waitFor(() => {
      expect(result.current.formatInfo).toBeDefined();
    });
    
    const cr2Info = result.current.getFormatInfo('cr2');
    expect(cr2Info.name).toContain('Canon RAW');
    expect(cr2Info.isRawFormat).toBe(true);
    expect(cr2Info.compressionType).toBe('none');
  });

  test('should handle format loading errors', async () => {
    mockService.getSupportedFormats.mockRejectedValue(new Error('Format load failed'));
    
    const { result } = renderHook(() => useFormatInfo());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeDefined();
    });
  });
});

describe('Hook Integration', () => {
  test('should work together in realistic workflow', async () => {
    const { result: imageProcessing } = renderHook(() => useImageProcessing());
    const { result: qualityPresets } = renderHook(() => useQualityPresets());
    const { result: formatInfo } = renderHook(() => useFormatInfo());
    
    // Wait for all hooks to initialize
    await waitFor(() => {
      expect(imageProcessing.current.isReady).toBe(true);
      expect(qualityPresets.current.loading).toBe(false);
      expect(formatInfo.current.loading).toBe(false);
    });
    
    // Simulate file conversion workflow
    const file = mockFiles.jpeg();
    const mockResult = createMockConversionResult();
    mockService.convertImage.mockResolvedValue(mockResult);
    
    await act(async () => {
      await imageProcessing.current.convertImage(file, 'png', 'high');
    });
    
    expect(imageProcessing.current.isComplete).toBe(true);
    expect(qualityPresets.current.presets).toBeDefined();
    expect(formatInfo.current.getFormatInfo('png')).toBeDefined();
  });
});