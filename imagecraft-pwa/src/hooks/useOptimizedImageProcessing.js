/**
 * React Hook for Image Processing Service
 * Provides optimized image conversion with Web Workers
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getImageProcessingService } from '../services/imageProcessingService';
import { useNotifications } from '../store/appStore';
import { createRawDetector, getFormatInfo } from '../utils/formatDetection';

export function useImageProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [qualityPresets, setQualityPresets] = useState(null);
  const [supportedFormats, setSupportedFormats] = useState(null);
  
  const { addNotification } = useNotifications();
  const serviceRef = useRef(null);
  const abortControllerRef = useRef(null);
  const rawDetectorRef = useRef(null);

  // Initialize service
  useEffect(() => {
    const initService = async () => {
      try {
        console.log('useImageProcessing: Getting service instance...');
        serviceRef.current = getImageProcessingService();
        
        // Initialize RAW detector
        rawDetectorRef.current = createRawDetector();
        
        // Wait for service to be initialized
        console.log('useImageProcessing: Waiting for service to be ready...');
        let retries = 0;
        const maxRetries = 50; // 10 seconds with 200ms intervals
        
        while (retries < maxRetries && !serviceRef.current.isInitialized) {
          await new Promise(resolve => setTimeout(resolve, 200));
          retries++;
        }
        
        if (!serviceRef.current.isInitialized) {
          throw new Error('Service initialization timeout - worker may have failed to start');
        }
        
        console.log('useImageProcessing: Service ready, loading presets and formats...');
        
        // Load quality presets and supported formats
        const [presets, formats] = await Promise.all([
          serviceRef.current.getQualityPresets(),
          serviceRef.current.getSupportedFormats()
        ]);
        
        setQualityPresets(presets);
        setSupportedFormats(formats);
        
        console.log('useImageProcessing: Initialization complete');
        
      } catch (error) {
        console.error('Failed to initialize image processing service:', error);
        setError(error);
        
        addNotification({
          type: 'error',
          title: 'Service Initialization Failed',
          message: `Image processing service could not be started: ${error.message}`,
          duration: 10000
        });
      }
    };

    initService();
  }, [addNotification]);

  // Progress callback
  const handleProgress = useCallback((progress, message) => {
    setProgress(progress);
    setProgressMessage(message || '');
  }, []);

  // Convert single image with enhanced RAW validation
  const convertImage = useCallback(async (file, outputFormat, quality = 'medium', options = {}) => {
    if (!serviceRef.current) {
      throw new Error('Image processing service not available');
    }

    if (!rawDetectorRef.current) {
      throw new Error('RAW detector not available');
    }

    // Reset state
    setIsProcessing(true);
    setProgress(0);
    setProgressMessage('Starting conversion...');
    setError(null);
    setResult(null);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      // Pre-validate RAW files and format combinations
      setProgressMessage('Validating file format...');
      const rawValidationResult = await rawDetectorRef.current.validateRawFile(file);
      
      // Enhanced validation for RAW files
      if (rawValidationResult.isRawFile) {
        console.log(`RAW file detected: ${rawValidationResult.detectedRawFormat}`);
        
        // Validate RAW conversion options
        if (outputFormat.toLowerCase() !== 'raw' && !['jpeg', 'png'].includes(outputFormat.toLowerCase())) {
          throw new Error(`RAW files can only be converted to JPEG or PNG. ${outputFormat.toUpperCase()} is not supported.`);
        }
        
        // Show RAW-specific progress message
        const rawFormatInfo = rawValidationResult.detectedRawFormat ? 
          getFormatInfo(rawValidationResult.detectedRawFormat) : 
          { name: 'RAW' };
        setProgressMessage(`Processing ${rawFormatInfo.name} file...`);
        
        // Add RAW conversion notification
        addNotification({
          type: 'info',
          title: 'RAW File Detected',
          message: `Processing ${rawFormatInfo.name} file. This may take longer than standard image formats.`,
          duration: 6000
        });
      } else {
        // Validate that RAW conversion isn't selected for non-RAW files
        if (outputFormat.toLowerCase() === 'raw') {
          throw new Error('RAW conversion selected but the uploaded file is not a RAW format. Please select a different output format.');
        }
      }

      const result = await serviceRef.current.convertImage(file, outputFormat, quality, {
        ...options,
        onProgress: handleProgress,
        autoDownload: options.autoDownload !== false // Default to true
      });

      setResult(result);
      setProgress(100);
      setProgressMessage('Conversion complete!');

      // Enhanced success notification for RAW conversions
      const successMessage = result.isRawConversion 
        ? `${result.originalRawFormat?.toUpperCase() || 'RAW'} file converted to ${result.actualFormat?.toUpperCase() || outputFormat.toUpperCase()} and downloaded.`
        : `${file.name} converted to ${result.actualFormat?.toUpperCase() || outputFormat.toUpperCase()} and downloaded automatically.`;

      addNotification({
        type: 'success',
        title: result.isRawConversion ? 'RAW Conversion Complete!' : 'Image Converted!',
        message: successMessage,
        duration: result.isRawConversion ? 7000 : 5000
      });

      return result;
    } catch (error) {
      setError(error);
      setProgressMessage('Conversion failed');
      
      // Enhanced error handling for RAW-specific issues
      const isRawError = error.message.includes('RAW') || error.message.includes('raw');
      
      addNotification({
        type: 'error',
        title: isRawError ? 'RAW Conversion Failed' : 'Conversion Failed',
        message: error.message || 'An error occurred during image conversion.',
        duration: isRawError ? 10000 : 8000
      });
      
      throw error;
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  }, [handleProgress, addNotification]);

  // Apply filter to image
  const applyFilter = useCallback(async (file, filterType, intensity = 1, options = {}) => {
    if (!serviceRef.current) {
      throw new Error('Image processing service not available');
    }

    setIsProcessing(true);
    setProgress(0);
    setProgressMessage(`Applying ${filterType} filter...`);
    setError(null);
    setResult(null);

    try {
      const result = await serviceRef.current.applyFilter(file, filterType, intensity, {
        ...options,
        onProgress: handleProgress,
        autoDownload: options.autoDownload !== false
      });

      setResult(result);
      setProgress(100);
      setProgressMessage('Filter applied!');

      addNotification({
        type: 'success',
        title: 'Filter Applied!',
        message: `${filterType} filter applied to ${file.name} and downloaded.`,
        duration: 5000
      });

      return result;
    } catch (error) {
      setError(error);
      setProgressMessage('Filter application failed');
      
      addNotification({
        type: 'error',
        title: 'Filter Failed',
        message: error.message || 'An error occurred while applying the filter.',
        duration: 8000
      });
      
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [handleProgress, addNotification]);

  // Batch convert multiple images
  const batchConvert = useCallback(async (files, outputFormat, quality = 'medium', options = {}) => {
    if (!serviceRef.current || !files.length) {
      throw new Error('No files to process or service not available');
    }

    setIsProcessing(true);
    setProgress(0);
    setProgressMessage(`Converting ${files.length} files...`);
    setError(null);
    setResult(null);

    try {
      const batchResult = await serviceRef.current.batchConvert(files, outputFormat, quality, {
        ...options,
        onProgress: handleProgress,
        onBatchProgress: (current, total, message) => {
          setProgressMessage(`Processing ${current + 1}/${total}: ${message}`);
        }
      });

      setResult(batchResult);
      setProgress(100);
      setProgressMessage(`Batch conversion complete! ${batchResult.successCount}/${batchResult.totalCount} files processed.`);

      // Batch completion notification
      if (batchResult.errorCount === 0) {
        addNotification({
          type: 'success',
          title: 'Batch Conversion Complete!',
          message: `All ${batchResult.successCount} files converted successfully and downloaded.`,
          duration: 6000
        });
      } else {
        addNotification({
          type: 'warning',
          title: 'Batch Conversion Finished',
          message: `${batchResult.successCount} files converted, ${batchResult.errorCount} failed. Check results for details.`,
          duration: 8000
        });
      }

      return batchResult;
    } catch (error) {
      setError(error);
      setProgressMessage('Batch conversion failed');
      
      addNotification({
        type: 'error',
        title: 'Batch Conversion Failed',
        message: error.message || 'An error occurred during batch conversion.',
        duration: 8000
      });
      
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [handleProgress, addNotification]);

  // Estimate output file size
  const estimateOutputSize = useCallback((inputSize, inputFormat, outputFormat, quality) => {
    if (!serviceRef.current) return inputSize;
    
    return serviceRef.current.estimateOutputSize(inputSize, inputFormat, outputFormat, quality);
  }, []);

  // Get performance statistics
  const getPerformanceStats = useCallback(() => {
    if (!serviceRef.current) return null;
    
    return serviceRef.current.getPerformanceStats();
  }, []);

  // Validate RAW file and get conversion options
  const validateRawFile = useCallback(async (file) => {
    if (!rawDetectorRef.current) {
      throw new Error('RAW detector not available');
    }

    try {
      const validationResult = await rawDetectorRef.current.validateRawFile(file);
      return validationResult;
    } catch (error) {
      console.error('RAW validation failed:', error);
      throw error;
    }
  }, []);

  // Get available output formats for a file
  const getAvailableFormatsForFile = useCallback(async (file) => {
    if (!rawDetectorRef.current) {
      return supportedFormats || [];
    }

    try {
      const availableFormats = await rawDetectorRef.current.getAvailableOutputFormats(file);
      return availableFormats;
    } catch (error) {
      console.warn('Could not determine available formats:', error);
      return supportedFormats || [];
    }
  }, [supportedFormats]);

  // Check if a file is a RAW format
  const isRawFile = useCallback(async (file) => {
    if (!rawDetectorRef.current || !file) return false;

    try {
      const validationResult = await rawDetectorRef.current.validateRawFile(file);
      return validationResult.isRawFile;
    } catch (error) {
      console.warn('RAW file check failed:', error);
      return false;
    }
  }, []);

  // Reset processing state
  const reset = useCallback(() => {
    setIsProcessing(false);
    setProgress(0);
    setProgressMessage('');
    setError(null);
    setResult(null);
  }, []);

  // Cancel current operation
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsProcessing(false);
      setProgressMessage('Cancelled');
      
      addNotification({
        type: 'info',
        title: 'Operation Cancelled',
        message: 'Image processing was cancelled by user.',
        duration: 3000
      });
    }
  }, [addNotification]);

  return {
    // State
    isProcessing,
    progress,
    progressMessage,
    error,
    result,
    qualityPresets,
    supportedFormats,
    
    // Actions
    convertImage,
    applyFilter,
    batchConvert,
    estimateOutputSize,
    getPerformanceStats,
    reset,
    cancel,
    
    // RAW-specific utilities
    validateRawFile,
    getAvailableFormatsForFile,
    isRawFile,
    
    // Convenience getters
    isReady: !!serviceRef.current && !!qualityPresets && !!supportedFormats && !!rawDetectorRef.current,
    hasError: !!error,
    isComplete: !isProcessing && progress === 100 && !error,
  };
}

// Hook for getting quality information
export function useQualityPresets() {
  const [presets, setPresets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPresets = async () => {
      try {
        const service = getImageProcessingService();
        const presetsData = await service.getQualityPresets();
        setPresets(presetsData);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadPresets();
  }, []);

  return { presets, loading, error };
}

// Hook for format information
export function useFormatInfo() {
  const [formats, setFormats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFormats = async () => {
      try {
        const service = getImageProcessingService();
        const formatsData = await service.getSupportedFormats();
        setFormats(formatsData);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadFormats();
  }, []);

  // Format metadata
  const formatInfo = {
    jpeg: {
      name: 'JPEG',
      description: 'Best for photos, compressed',
      extensions: ['jpg', 'jpeg'],
      supportsTransparency: false,
      supportsAnimation: false,
      compressionType: 'lossy'
    },
    png: {
      name: 'PNG',
      description: 'Best for graphics, supports transparency',
      extensions: ['png'],
      supportsTransparency: true,
      supportsAnimation: false,
      compressionType: 'lossless'
    },
    webp: {
      name: 'WebP',
      description: 'Modern web format, excellent compression',
      extensions: ['webp'],
      supportsTransparency: true,
      supportsAnimation: true,
      compressionType: 'both'
    },
    avif: {
      name: 'AVIF',
      description: 'Next-gen format, superior compression',
      extensions: ['avif'],
      supportsTransparency: true,
      supportsAnimation: true,
      compressionType: 'both'
    },
    gif: {
      name: 'GIF',
      description: 'Simple animations, limited colors',
      extensions: ['gif'],
      supportsTransparency: true,
      supportsAnimation: true,
      compressionType: 'lossless'
    },
    bmp: {
      name: 'BMP',
      description: 'Uncompressed bitmap',
      extensions: ['bmp'],
      supportsTransparency: false,
      supportsAnimation: false,
      compressionType: 'none'
    },
    tiff: {
      name: 'TIFF',
      description: 'Professional archival quality',
      extensions: ['tiff', 'tif'],
      supportsTransparency: true,
      supportsAnimation: false,
      compressionType: 'lossless'
    },
    // RAW formats
    cr2: {
      name: 'Canon RAW (CR2)',
      description: 'Canon digital camera RAW format',
      extensions: ['cr2'],
      supportsTransparency: false,
      supportsAnimation: false,
      compressionType: 'none',
      isRawFormat: true
    },
    cr3: {
      name: 'Canon RAW (CR3)',
      description: 'Canon digital camera RAW format v3',
      extensions: ['cr3'],
      supportsTransparency: false,
      supportsAnimation: false,
      compressionType: 'none',
      isRawFormat: true
    },
    nef: {
      name: 'Nikon RAW (NEF)',
      description: 'Nikon Electronic Format RAW',
      extensions: ['nef'],
      supportsTransparency: false,
      supportsAnimation: false,
      compressionType: 'none',
      isRawFormat: true
    },
    arw: {
      name: 'Sony RAW (ARW)',
      description: 'Sony Alpha RAW format',
      extensions: ['arw'],
      supportsTransparency: false,
      supportsAnimation: false,
      compressionType: 'none',
      isRawFormat: true
    },
    dng: {
      name: 'Adobe DNG',
      description: 'Adobe Digital Negative',
      extensions: ['dng'],
      supportsTransparency: false,
      supportsAnimation: false,
      compressionType: 'none',
      isRawFormat: true
    },
    orf: {
      name: 'Olympus RAW (ORF)',
      description: 'Olympus RAW Format',
      extensions: ['orf'],
      supportsTransparency: false,
      supportsAnimation: false,
      compressionType: 'none',
      isRawFormat: true
    },
    rw2: {
      name: 'Panasonic RAW (RW2)',
      description: 'Panasonic RAW format',
      extensions: ['rw2'],
      supportsTransparency: false,
      supportsAnimation: false,
      compressionType: 'none',
      isRawFormat: true
    },
    raf: {
      name: 'Fujifilm RAW (RAF)',
      description: 'Fujifilm RAW format',
      extensions: ['raf'],
      supportsTransparency: false,
      supportsAnimation: false,
      compressionType: 'none',
      isRawFormat: true
    },
    pef: {
      name: 'Pentax RAW (PEF)',
      description: 'Pentax Electronic Format',
      extensions: ['pef'],
      supportsTransparency: false,
      supportsAnimation: false,
      compressionType: 'none',
      isRawFormat: true
    },
    raw: {
      name: 'Generic RAW',
      description: 'Generic RAW image format',
      extensions: ['raw'],
      supportsTransparency: false,
      supportsAnimation: false,
      compressionType: 'none',
      isRawFormat: true
    }
  };

  return { 
    formats, 
    formatInfo, 
    loading, 
    error,
    getFormatInfo: (format) => formatInfo[format.toLowerCase()] || null
  };
}

export default useImageProcessing;