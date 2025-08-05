/**
 * AVIF Encoder Web Worker
 * Uses @jsquash/avif for proper AVIF encoding support
 * Provides Canvas API fallback for other formats
 */

// Import @jsquash/avif - note: this needs to be handled by the build system
// For now, we'll use importScripts or dynamic import
let avifEncoder = null;
let initialized = false;
let initPromise = null;

// Supported formats with @jsquash/avif
const SUPPORTED_FORMATS = {
  input: [
    'avif', 'bmp', 'gif', 'heic', 'heif', 'ico', 'jpeg', 'jpg', 
    'png', 'svg', 'tiff', 'tif', 'webp', 'pdf'
  ],
  output: [
    'avif', 'bmp', 'gif', 'jpeg', 'jpg', 'png', 'webp'
  ]
};

// Canvas API fallback formats
const CANVAS_FORMATS = {
  input: ['jpeg', 'jpg', 'png', 'webp', 'bmp', 'gif'],
  output: ['jpeg', 'jpg', 'png', 'webp', 'bmp']
};

/**
 * Initialize AVIF encoder
 */
async function initializeAVIFEncoder() {
  if (initialized) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      console.log('🚀 Initializing AVIF encoder worker...');

      // Load the local WASM AVIF encoder with proper error handling
      try {
        // Add cache-busting query parameter to avoid service worker issues
        const scriptUrl = `/lib/wasm-avif/wasm_avif.js?v=${Date.now()}`;
        
        // Add timeout to prevent hanging on script loading
        await Promise.race([
          new Promise((resolve, reject) => {
            try {
              // Load the WASM AVIF library from local files
              importScripts(scriptUrl);
              resolve();
            } catch (error) {
              reject(error);
            }
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Script loading timeout')), 5000)
          )
        ]);
        
        // Wait for WASM module to initialize
        if (typeof self.wasm_avif !== 'undefined') {
          console.log('✅ WASM AVIF library loaded, initializing...');
          
          // Initialize the WASM module with explicit path and timeout
          const wasmAvif = await Promise.race([
            self.wasm_avif({
              locateFile: (path, prefix) => {
                // Ensure WASM files are loaded from the correct path with cache-busting
                if (path.endsWith('.wasm')) {
                  return `/lib/wasm-avif/${path}?v=${Date.now()}`;
                }
                return prefix + path;
              }
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('WASM initialization timeout')), 8000)
            )
          ]);
          
          if (wasmAvif && typeof wasmAvif.encode === 'function') {
            avifEncoder = wasmAvif;
            console.log('✅ @saschazar/wasm-avif initialized successfully');
            console.log('🔍 AVIF encoder ready:', {
              'encode function': typeof wasmAvif.encode,
              'free function': typeof wasmAvif.free,
              'module ready': true
            });
          } else {
            throw new Error('WASM AVIF encoder functions not available');
          }
        } else {
          throw new Error('WASM AVIF library not loaded');
        }
      } catch (wasmError) {
        console.error('Failed to initialize WASM AVIF encoder:', wasmError);
        
        // Complete fallback - no external dependencies
        console.log('📋 Using Canvas API fallback only');
        avifEncoder = null;
      }
      
      initialized = true;
      console.log('✅ AVIF encoder worker initialized');
      console.log(`📋 AVIF support: ${avifEncoder ? 'WASM AVIF Available' : 'Canvas fallback only'}`);
      
      return true;
      
    } catch (error) {
      console.error('❌ AVIF encoder initialization failed:', error);
      initialized = true; // Still mark as initialized for Canvas fallback
      avifEncoder = null; // Ensure fallback mode
      return true;
    }
  })();

  return initPromise;
}

/**
 * Process image conversion using AVIF encoder or Canvas API
 */
async function processImageConversion(imageData, outputFormat, options = {}) {
  const formatLower = outputFormat.toLowerCase();
  
  try {
    // Handle AVIF encoding with @jsquash/avif
    if (formatLower === 'avif' && avifEncoder) {
      console.log('🎯 Processing AVIF encoding with @jsquash/avif');
      return await processWithAVIFEncoder(imageData, options);
    }
    
    // Handle other formats with Canvas API
    console.log(`🎨 Processing ${formatLower} with Canvas API`);
    return await processWithCanvasAPI(imageData, outputFormat, options);
    
  } catch (error) {
    console.error(`Processing failed for ${formatLower}:`, error);
    throw error;
  }
}

/**
 * Process AVIF encoding using @jsquash/avif with speed optimizations
 */
async function processWithAVIFEncoder(imageData, options = {}) {
  console.log('🎯 processWithAVIFEncoder started with imageData size:', imageData ? imageData.byteLength || imageData.length : 'undefined');
  
  try {
    // Create image from input data
    console.log('🔄 Creating blob from imageData...');
    const blob = new Blob([imageData]);
    console.log('✅ Blob created, size:', blob.size);
    const imageBitmap = await createImageBitmap(blob);
    console.log('✅ ImageBitmap created, dimensions:', imageBitmap.width, 'x', imageBitmap.height);
    
    // Speed optimization: Auto-reduce large images before processing
    let targetWidth = options.width || imageBitmap.width;
    let targetHeight = options.height || imageBitmap.height;
    
    // Speed optimization: Auto-reduce large images unless disabled
    const megapixels = (targetWidth * targetHeight) / 1000000;
    const maxRecommendedMP = options.maxMegapixels || 16; // Allow user override, default 16MP
    
    // Auto-scale only if: no explicit dimensions set, auto-scaling not disabled, and image is large
    if (megapixels > maxRecommendedMP && 
        !options.width && 
        !options.height && 
        options.disableAutoScale !== true) {
      
      const scaleFactor = Math.sqrt(maxRecommendedMP / megapixels);
      targetWidth = Math.round(imageBitmap.width * scaleFactor);
      targetHeight = Math.round(imageBitmap.height * scaleFactor);
      
      console.log(`📏 Auto-scaling large image from ${imageBitmap.width}x${imageBitmap.height} (${megapixels.toFixed(1)}MP) to ${targetWidth}x${targetHeight} (${((targetWidth * targetHeight) / 1000000).toFixed(1)}MP) for faster encoding`);
      console.log('💡 To disable auto-scaling, set options.disableAutoScale = true');
      
      // Send progress update about scaling
      if (self.currentTaskId) {
        self.postMessage({
          type: 'progress',
          id: self.currentTaskId,
          progress: 25,
          message: `Auto-scaling for speed: ${megapixels.toFixed(1)}MP → ${((targetWidth * targetHeight) / 1000000).toFixed(1)}MP`
        });
      }
    } else if (megapixels > 25) {
      // Warning for very large images without auto-scaling
      console.warn(`⚠️ Processing very large image (${megapixels.toFixed(1)}MP) - encoding may be slow`);
      if (self.currentTaskId) {
        self.postMessage({
          type: 'progress',
          id: self.currentTaskId,
          progress: 20,
          message: `Processing large image (${megapixels.toFixed(1)}MP) - this may take time...`
        });
      }
    }
    
    // Create canvas with target dimensions
    const canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d');
    
    // Configure context for high quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw image to canvas
    ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
    
    // Get ImageData for WASM processing
    const canvasImageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    
    // Clean up
    imageBitmap.close();
    
    // Use WASM AVIF encoder with speed optimizations
    if (avifEncoder && typeof avifEncoder.encode === 'function') {
    console.log('🎯 Using WASM AVIF encoder with speed optimizations');
    
    // Convert quality setting to 0-100 range for WASM encoder
    const qualityValue = getQualityValue(options.quality || 'medium', 'avif');
    const quality = Math.round(qualityValue * 100);
    
    console.log('🎨 Quality processing:', {
      inputQuality: options.quality,
      qualityValue: qualityValue,
      finalQuality: quality
    });
    
    try {
    console.log('📸 Starting AVIF encoding with params:', {
    width: targetWidth,
    height: targetHeight,
    quality: quality,
    lossless: options.lossless ? 1 : 0,
    dataLength: canvasImageData.data.length
    });
    
    // Send progress update before encoding
    if (self.currentTaskId) {
    self.postMessage({
    type: 'progress',
    id: self.currentTaskId,
    progress: 60,
    message: 'Encoding AVIF (optimized for speed)...'
    });
    }
    
    // Encode using WASM AVIF with speed optimizations
    // AVIF expects: buffer, width, height, channels, config, format
    const channels = 4; // RGBA
    
    // Speed optimization: Adjust encoding settings based on image size
    const pixelCount = targetWidth * targetHeight;
    let speedSetting = options.speed || 8; // Default to faster encoding (was 6)
    let tileConfig = { tileRowsLog2: 0, tileColsLog2: 0 };
    
    // For very large images, use even faster settings and tiling
    if (pixelCount > 4000000) { // >4MP
      speedSetting = Math.max(speedSetting, 9); // Very fast encoding
          // Enable tiling for large images to reduce memory usage and improve speed
          tileConfig = {
            tileRowsLog2: Math.min(2, Math.floor(Math.log2(targetHeight / 512))),
            tileColsLog2: Math.min(2, Math.floor(Math.log2(targetWidth / 512)))
          };
        } else if (pixelCount > 1000000) { // >1MP
          speedSetting = Math.max(speedSetting, 8); // Fast encoding
        }
        
        const encodeConfig = {
          minQuantizer: 0,
          maxQuantizer: Math.max(0, 63 - Math.round(quality * 0.63)), // quality 100 = quantizer 0, quality 0 = quantizer 63
          minQuantizerAlpha: 0,
          maxQuantizerAlpha: Math.max(0, 63 - Math.round(quality * 0.63)),
          ...tileConfig,
          speed: speedSetting, // Optimized speed setting
        };
        
        console.log('⚡ Speed optimizations applied:', {
          speedSetting,
          tileConfig,
          pixelCount: `${(pixelCount / 1000000).toFixed(1)}MP`,
          autoScaled: megapixels > maxRecommendedMP && !options.width && !options.height && options.disableAutoScale !== true
        });
        
        console.log('🚀 About to call avifEncoder.encode...');
        console.log('🔍 Encode arguments:', {
          'canvasImageData.data': canvasImageData.data ? `Uint8ClampedArray(${canvasImageData.data.length})` : 'null/undefined',
          'targetWidth': targetWidth,
          'targetHeight': targetHeight,
          'channels': channels,
          'encodeConfig': encodeConfig,
          'chromaSubsampling': 3
        });
        
        let avifBuffer;
        try {
          // Try with the correct 6-parameter API
          avifBuffer = avifEncoder.encode(
            canvasImageData.data,  // Raw pixel data
            targetWidth,
            targetHeight,
            channels,
            encodeConfig,
            3 // 4:2:0 chroma subsampling (default for AVIF)
          );
        } catch (apiError) {
          console.warn('6-parameter API failed, trying alternative signatures:', apiError.message);
          
          // Fallback: try with just 4 parameters (buffer, width, height, options)
          try {
            avifBuffer = avifEncoder.encode(
              canvasImageData.data,
              targetWidth,
              targetHeight,
              encodeConfig
            );
            console.log('✅ 4-parameter API succeeded');
          } catch (fallbackError) {
            console.error('All API attempts failed:', fallbackError);
            throw new Error(`AVIF encode API mismatch: ${apiError.message}`);
          }
        }
        console.log('🏁 avifEncoder.encode returned, checking result...');
        
        console.log('✅ AVIF encoding complete, buffer size:', avifBuffer ? avifBuffer.length : 0);
        
        if (avifBuffer && avifBuffer.length > 0) {
          // Check if the result is an error object
          if (avifBuffer.error) {
            throw new Error(`WASM AVIF encoding error: ${avifBuffer.error}`);
          }
          
          // Ensure we have a proper Uint8Array for Blob
          const bufferArray = avifBuffer instanceof Uint8Array ? avifBuffer : new Uint8Array(avifBuffer);
          const resultBlob = new Blob([bufferArray], { type: 'image/avif' });
          
          return {
            blob: resultBlob,
            width: targetWidth,
            height: targetHeight,
            format: 'avif',
            size: resultBlob.size,
            method: 'wasm-avif-encoder'
          };
        } else {
          throw new Error('WASM encoder returned empty buffer');
        }
      } catch (wasmError) {
        console.error('WASM AVIF encoding failed:', wasmError);
        throw new Error(`WASM AVIF encoding failed: ${wasmError.message}`);
      }
    }
    
    // Should not reach here if avifEncoder is properly checked
    throw new Error('No AVIF encoder available');
    
  } catch (error) {
    console.error('AVIF encoding failed:', error);
    throw new Error(`AVIF encoding failed: ${error.message}`);
  }
}

/**
 * Process image using Canvas API fallback
 */
async function processWithCanvasAPI(imageData, outputFormat, options = {}) {
  try {
    const formatLower = outputFormat.toLowerCase();
    
    // Check if format is supported by Canvas API
    if (!CANVAS_FORMATS.output.includes(formatLower)) {
      throw new Error(`Format ${formatLower} not supported by Canvas API`);
    }

    // Create image from data
    const blob = new Blob([imageData]);
    const imageBitmap = await createImageBitmap(blob);
    
    // Calculate dimensions
    let { width, height } = imageBitmap;
    
    if (options.width || options.height) {
      const aspectRatio = width / height;
      
      if (options.width && options.height) {
        width = options.width;
        height = options.height;
      } else if (options.width) {
        width = options.width;
        height = options.maintainAspectRatio !== false ? width / aspectRatio : height;
      } else if (options.height) {
        height = options.height;
        width = options.maintainAspectRatio !== false ? height * aspectRatio : width;
      }
    }
    
    // Create canvas
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d', {
      alpha: !['jpeg', 'jpg', 'bmp'].includes(formatLower)
    });
    
    // Configure context
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Clear and draw
    ctx.clearRect(0, 0, width, height);
    
    // Add background for non-transparent formats
    if (['jpeg', 'jpg', 'bmp'].includes(formatLower)) {
      ctx.fillStyle = options.backgroundColor || '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }
    
    // Apply rotation if specified
    if (options.rotate) {
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate((options.rotate * Math.PI) / 180);
      ctx.translate(-width / 2, -height / 2);
    }
    
    ctx.drawImage(imageBitmap, 0, 0, width, height);
    
    if (options.rotate) {
      ctx.restore();
    }
    
    imageBitmap.close();
    
    // Convert to blob
    const mimeType = getFormatMimeType(outputFormat);
    const quality = getQualityValue(options.quality || 'medium', formatLower);
    
    const resultBlob = await canvas.convertToBlob({
      type: mimeType,
      quality: quality
    });
    
    return {
      blob: resultBlob,
      width,
      height,
      format: formatLower,
      size: resultBlob.size,
      method: 'canvas-api'
    };
    
  } catch (error) {
    throw new Error(`Canvas processing failed: ${error.message}`);
  }
}

/**
 * Get MIME type for format
 */
function getFormatMimeType(format) {
  const mimeTypes = {
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    avif: 'image/avif',
    heic: 'image/heic',
    bmp: 'image/bmp',
    gif: 'image/gif',
    tiff: 'image/tiff',
    tif: 'image/tiff'
  };
  
  return mimeTypes[format.toLowerCase()] || 'image/png';
}

/**
 * Convert quality setting to numeric value
 */
function getQualityValue(quality, format) {
  // Handle numeric quality values (0.0 to 1.0 or 0 to 100)
  if (typeof quality === 'number') {
    // If already between 0-1, return as-is
    if (quality >= 0 && quality <= 1) {
      return quality;
    }
    // If between 1-100, convert to 0-1 range
    if (quality > 1 && quality <= 100) {
      return quality / 100;
    }
    // Default fallback for out-of-range numbers
    return 0.65; // medium quality
  }
  
  // Handle string presets
  const qualityMap = {
    low: { jpeg: 60, webp: 50, avif: 40 },
    medium: { jpeg: 85, webp: 75, avif: 65 },
    high: { jpeg: 95, webp: 90, avif: 85 }
  };
  
  const formatQuality = qualityMap[quality] || qualityMap.medium;
  const value = formatQuality[format] || formatQuality.jpeg;
  
  return value / 100;
}

/**
 * Get available output formats
 */
function getAvailableFormats() {
  const baseFormats = [...CANVAS_FORMATS.output];
  
  // Add AVIF if encoder is available
  if (avifEncoder && !baseFormats.includes('avif')) {
    baseFormats.push('avif');
  }
  
  return baseFormats;
}

/**
 * Get capabilities information
 */
function getCapabilities() {
  const availableFormats = getAvailableFormats();
  
  return {
    version: avifEncoder ? 'WASM AVIF Encoder v2.0 (@saschazar/wasm-avif)' : 'Canvas API Fallback v1.0',
    quantumDepth: 8,
    method: avifEncoder ? 'wasm-avif' : 'canvas-api',
    fallbackMode: !avifEncoder,
    formats: {
      input: SUPPORTED_FORMATS.input,
      output: availableFormats
    },
    operations: ['convert', 'resize', 'rotate', 'quality'],
    features: avifEncoder ? ['WASM AVIF', 'High Quality', 'Lossless', 'Canvas'] : ['Canvas', 'WebP', 'Basic Processing'],
    delegates: avifEncoder ? ['wasm-avif', 'canvas'] : ['canvas', 'webp']
  };
}

/**
 * Handle conversion requests
 */
async function handleConversion(data) {
  const { id, imageData, outputFormat, options = {} } = data;
  
  console.log('🎯 handleConversion called with:', { 
    id, 
    outputFormat, 
    imageDataSize: imageData ? imageData.byteLength || imageData.length : 'undefined',
    options 
  });
  
  try {
    // Store current task ID for progress updates
    self.currentTaskId = id;
    
    // Send progress update
    self.postMessage({
      type: 'progress',
      id,
      progress: 10,
      message: 'Starting conversion...'
    });

    const formatLower = outputFormat.toLowerCase();
    
    // Update progress
    self.postMessage({
      type: 'progress',
      id,
      progress: 30,
      message: `Processing ${formatLower.toUpperCase()}...`
    });
    
    // Process the image
    console.log('🔄 About to call processImageConversion...');
    const result = await processImageConversion(imageData, outputFormat, options);
    console.log('✅ processImageConversion completed:', { format: result.format, size: result.size });
    
    // Send progress update
    self.postMessage({
      type: 'progress',
      id,
      progress: 90,
      message: 'Finalizing...'
    });

    // Send success result
    self.postMessage({
      type: 'success',
      id,
      result: {
        ...result,
        processingMethod: result.method,
        avifAvailable: !!avifEncoder
      }
    });

  } catch (error) {
    console.error('Conversion error:', error);
    
    self.postMessage({
      type: 'error',
      id,
      error: error.message,
      details: {
        avifAvailable: !!avifEncoder,
        requestedFormat: outputFormat,
        availableFormats: getAvailableFormats()
      }
    });
  } finally {
    // Clear current task ID
    self.currentTaskId = null;
  }
}

/**
 * Message handler
 */
self.onmessage = async function(event) {
  const { type, data } = event.data;
  
  try {
    switch (type) {
      case 'init':
        try {
          await initializeAVIFEncoder();
          
          // Send ready signal with capabilities
          self.postMessage({
            type: 'ready',
            capabilities: getCapabilities(),
            fallbackMode: !avifEncoder
          });
          
        } catch (initError) {
          console.warn('AVIF encoder initialization failed, using Canvas API fallback:', initError.message);
          
          // Send ready signal in fallback mode
          self.postMessage({
            type: 'ready',
            capabilities: getCapabilities(),
            fallbackMode: true,
            error: initError.message
          });
        }
        break;
        
      case 'convert':
        console.log('🔄 AVIF Worker received convert message:', { 
          id: data.id, 
          format: data.outputFormat,
          hasImageData: !!data.imageData,
          imageDataSize: data.imageData ? data.imageData.length || data.imageData.byteLength : 'undefined',
          options: data.options
        });
        await handleConversion(data);
        break;
        
      case 'getCapabilities':
        self.postMessage({
          type: 'success',
          id: data.id,
          result: getCapabilities()
        });
        break;
        
      default:
        self.postMessage({
          type: 'error',
          id: data?.id || 'unknown',
          error: `Unknown message type: ${type}`
        });
    }
    
  } catch (error) {
    console.error('Worker message handling error:', error);
    
    self.postMessage({
      type: 'error',
      id: data?.id || 'unknown',
      error: error.message
    });
  }
};

// Error handlers
self.onerror = function(error) {
  console.error('Worker error:', error);
  
  self.postMessage({
    type: 'error',
    error: `Worker error: ${error.message || 'Unknown error'}`
  });
};

self.onunhandledrejection = function(event) {
  console.error('Worker unhandled promise rejection:', event.reason);
  
  self.postMessage({
    type: 'error',
    error: `Promise rejection: ${event.reason?.message || event.reason || 'Unknown error'}`
  });
};

// Initialize on worker start
console.log('🚀 AVIF Encoder Worker loaded, ready for initialization...');