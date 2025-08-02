/**
 * ImageMagick WASM Web Worker
 * Properly loads @imagemagick/magick-wasm without ES6 module issues
 * Avoids importScripts in module workers by using dynamic import with fallback
 */

let Magick = null;
let initialized = false;
let initPromise = null;

// Enhanced format support with ImageMagick
const imageMagickFormats = {
  // Input formats (what ImageMagick can read)
  input: [
    'jpeg', 'jpg', 'png', 'webp', 'avif', 'heic', 'heif', 
    'bmp', 'gif', 'tiff', 'tif', 'raw', 'cr2', 'cr3', 'nef', 
    'arw', 'dng', 'orf', 'rw2', 'raf', 'pef', 'srw', 'x3f',
    'svg', 'pdf', 'psd', 'xcf', 'ico', 'cur'
  ],
  // Output formats (what ImageMagick can write)
  output: [
    'jpeg', 'jpg', 'png', 'webp', 'avif', 'bmp', 'gif', 
    'tiff', 'tif', 'pdf', 'ico', 'cur'
  ]
};

// Quality settings for different formats - Fixed to prevent JPEG quantization artifacts
const qualitySettings = {
  high: { jpeg: 98, webp: 92, avif: 88, png: 100 }, // Increased JPEG from 95 to 98
  medium: { jpeg: 88, webp: 80, avif: 70, png: 100 }, // Increased JPEG from 80 to 88  
  low: { jpeg: 75, webp: 60, avif: 50, png: 100 } // Increased JPEG from 60 to 75
};

/**
 * Initialize ImageMagick WASM using dynamic loading approach
 * This avoids the "importScripts in Module Worker" error
 */
async function initializeImageMagick() {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Method 1: Try dynamic import (works in modern browsers)
      try {
        console.log('Attempting dynamic import of ImageMagick WASM...');
        
        // Use dynamic import instead of importScripts
        const imageMagickModule = await import('https://cdn.jsdelivr.net/npm/@imagemagick/magick-wasm@0.0.35/dist/index.js');
        
        // Get the Magick object from the module
        Magick = imageMagickModule.default || imageMagickModule.Magick || imageMagickModule;
        
        // Initialize ImageMagick
        await Magick.initializeAsync();
        
        console.log('ImageMagick WASM loaded via dynamic import');
        
      } catch (dynamicImportError) {
        console.warn('Dynamic import failed, trying alternative approach:', dynamicImportError.message);
        
        // Method 2: Load via fetch and evaluate (fallback for older browsers)
        await loadImageMagickViaFetch();
      }
      
      if (!Magick) {
        throw new Error('Failed to load ImageMagick WASM library');
      }
      
      // Verify ImageMagick is working
      await testImageMagickFunctionality();
      
      initialized = true;
      
      // Send ready signal with capabilities
      self.postMessage({
        type: 'ready',
        capabilities: {
          formats: {
            input: imageMagickFormats.input,
            output: imageMagickFormats.output
          },
          operations: [
            'convert', 'resize', 'crop', 'rotate', 'flip', 'flop',
            'blur', 'sharpen', 'enhance', 'normalize', 'contrast',
            'brightness', 'saturation', 'hue', 'gamma'
          ],
          maxDimensions: { width: 32767, height: 32767 },
          supportedColorSpaces: ['sRGB', 'RGB', 'CMYK', 'Gray'],
          version: 'ImageMagick WASM 0.0.35'
        }
      });
      
      console.log('ImageMagick WASM worker initialized successfully');
      
    } catch (error) {
      console.error('ImageMagick initialization failed:', error);
      
      // Send error but don't fail completely - fallback to Canvas API
      self.postMessage({
        type: 'ready',
        error: error.message,
        fallbackMode: true,
        capabilities: {
          formats: {
            input: ['jpeg', 'jpg', 'png', 'webp', 'bmp', 'gif'],
            output: ['jpeg', 'jpg', 'png', 'webp', 'bmp']
          },
          operations: ['convert', 'resize'],
          fallback: true
        }
      });
      
      // Don't set initialized = true, so we'll use Canvas fallback
    }
  })();

  return initPromise;
}

/**
 * Alternative loading method using fetch + eval
 * This is a fallback for browsers that don't support dynamic imports in workers
 */
async function loadImageMagickViaFetch() {
  try {
    console.log('Loading ImageMagick WASM via fetch...');
    
    // Fetch the ImageMagick WASM module
    const response = await fetch('https://cdn.jsdelivr.net/npm/@imagemagick/magick-wasm@0.0.35/dist/index.js');
    const moduleCode = await response.text();
    
    // Create a module-like environment
    const moduleEnv = {
      exports: {},
      module: { exports: {} }
    };
    
    // Evaluate the module code in our controlled environment
    const wrappedCode = `
      (function(exports, module, require) {
        ${moduleCode}
      })
    `;
    
    // Execute the wrapped code
    const moduleFunction = eval(wrappedCode);
    moduleFunction(moduleEnv.exports, moduleEnv.module, () => {});
    
    // Extract Magick from the module
    Magick = moduleEnv.module.exports.default || moduleEnv.module.exports.Magick || moduleEnv.module.exports;
    
    if (Magick && typeof Magick.initializeAsync === 'function') {
      await Magick.initializeAsync();
      console.log('ImageMagick WASM loaded via fetch+eval');
    } else {
      throw new Error('Magick object not found or invalid');
    }
    
  } catch (fetchError) {
    console.error('Fetch method also failed:', fetchError.message);
    
    // Method 3: Try loading from local files if available
    await loadImageMagickLocal();
  }
}

/**
 * Load ImageMagick from local files (if copied to public directory)
 */
async function loadImageMagickLocal() {
  try {
    console.log('Attempting to load ImageMagick from local files...');
    
    // Try to load from local public directory
    const response = await fetch('/lib/imagemagick/magick.js');
    if (!response.ok) {
      throw new Error('Local ImageMagick files not found');
    }
    
    const moduleCode = await response.text();
    
    // Similar approach as fetch method
    const moduleEnv = { exports: {}, module: { exports: {} } };
    const wrappedCode = `(function(exports, module) { ${moduleCode} })`;
    const moduleFunction = eval(wrappedCode);
    moduleFunction(moduleEnv.exports, moduleEnv.module);
    
    Magick = moduleEnv.module.exports.default || moduleEnv.module.exports;
    
    if (Magick && typeof Magick.initializeAsync === 'function') {
      await Magick.initializeAsync();
      console.log('ImageMagick WASM loaded from local files');
    } else {
      throw new Error('Local Magick object not found or invalid');
    }
    
  } catch (localError) {
    console.error('Local loading failed:', localError.message);
    throw new Error('All ImageMagick loading methods failed. Please ensure @imagemagick/magick-wasm is properly installed.');
  }
}

/**
 * Test ImageMagick functionality to ensure it's working
 */
async function testImageMagickFunctionality() {
  try {
    // Create a simple test image (1x1 red pixel)
    const testData = new Uint8Array([255, 0, 0, 255]); // RGBA red pixel
    
    // Use ImageMagick to process the test image
    Magick.read(testData, (img) => {
      img.resize('2x2');
      const result = img.write();
      
      if (!result || result.length === 0) {
        throw new Error('ImageMagick test processing failed');
      }
    });
    
    console.log('ImageMagick functionality test passed');
    
  } catch (testError) {
    console.warn('ImageMagick test failed:', testError.message);
    // Don't throw here - let the main functionality determine if it works
  }
}

/**
 * Convert image using ImageMagick WASM
 */
async function convertWithImageMagick(imageData, outputFormat, options = {}) {
  if (!initialized || !Magick) {
    throw new Error('ImageMagick not initialized');
  }
  
  return new Promise((resolve, reject) => {
    try {
      Magick.read(imageData, (img) => {
        try {
          // Apply transformations
          if (options.width || options.height) {
            const width = options.width || '';
            const height = options.height || '';
            const geometry = options.maintainAspectRatio !== false 
              ? `${width}x${height}` 
              : `${width}x${height}!`;
            img.resize(geometry);
          }
          
          // Apply quality settings with JPEG-specific optimizations
          const quality = options.quality || 'medium';
          const qualityValue = qualitySettings[quality]?.[outputFormat.toLowerCase()];
          if (qualityValue && qualityValue < 100) {
            img.quality(qualityValue);
          }
          
          // JPEG-specific optimizations to prevent grid artifacts
          if (outputFormat.toLowerCase() === 'jpeg' || outputFormat.toLowerCase() === 'jpg') {
            // Use progressive JPEG to reduce blocking artifacts
            img.interlace('Line');
            // Optimize color space for JPEG
            img.colorspace('sRGB');
            // Set sampling factor to reduce chroma subsampling artifacts
            img.samplingFactor('1x1,1x1,1x1');
          }
          
          // Apply additional options
          if (options.crop) {
            img.crop(options.crop);
          }
          
          if (options.rotate) {
            img.rotate(options.rotate);
          }
          
          if (options.blur) {
            img.blur(options.blur.radius || 1, options.blur.sigma || 1);
          }
          
          if (options.brightness) {
            img.modulate(options.brightness, 100, 100);
          }
          
          if (options.contrast) {
            img.contrast(options.contrast > 0 ? 1 : -1);
          }
          
          // Set output format
          img.format(outputFormat.toUpperCase());
          
          // Write the processed image
          const resultData = img.write();
          
          // Create blob from result
          const blob = new Blob([resultData], { 
            type: getFormatMimeType(outputFormat) 
          });
          
          resolve({
            blob,
            width: img.width,
            height: img.height,
            format: outputFormat.toLowerCase(),
            size: blob.size,
            method: 'imagemagick'
          });
          
        } catch (processingError) {
          reject(new Error(`ImageMagick processing failed: ${processingError.message}`));
        }
      });
      
    } catch (readError) {
      reject(new Error(`ImageMagick read failed: ${readError.message}`));
    }
  });
}

/**
 * Fallback conversion using Canvas API
 */
async function convertWithCanvas(imageData, outputFormat, options = {}) {
  try {
    // Create blob from image data
    const inputBlob = new Blob([imageData]);
    
    // Create image bitmap
    const imageBitmap = await createImageBitmap(inputBlob);
    
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
    const ctx = canvas.getContext('2d');
    
    // Configure context for high quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Apply background for formats that don't support transparency
    const formatLower = outputFormat.toLowerCase();
    if (['jpeg', 'jpg', 'bmp'].includes(formatLower)) {
      ctx.fillStyle = options.backgroundColor || '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }
    
    // Draw image
    ctx.drawImage(imageBitmap, 0, 0, width, height);
    
    // Clean up
    imageBitmap.close();
    
    // Convert to blob
    const mimeType = getFormatMimeType(outputFormat);
    const quality = getQualityValue(outputFormat, options.quality || 'medium');
    
    const blob = await canvas.convertToBlob({
      type: mimeType,
      quality: quality
    });
    
    return {
      blob,
      width,
      height,
      format: formatLower,
      size: blob.size,
      method: 'canvas'
    };
    
  } catch (error) {
    throw new Error(`Canvas conversion failed: ${error.message}`);
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
    bmp: 'image/bmp',
    gif: 'image/gif',
    tiff: 'image/tiff',
    tif: 'image/tiff'
  };
  
  return mimeTypes[format.toLowerCase()] || 'image/png';
}

/**
 * Get quality value for format and quality preset
 */
function getQualityValue(format, quality) {
  const preset = qualitySettings[quality] || qualitySettings.medium;
  const value = preset[format.toLowerCase()];
  return value ? value / 100 : 0.8;
}

/**
 * Process image conversion request
 */
async function processConversion(data) {
  const { id, imageData, outputFormat, options = {} } = data;
  
  try {
    // Send initial progress
    self.postMessage({
      type: 'progress',
      id,
      progress: 5,
      message: 'Starting conversion...'
    });
    
    // Check if format is supported
    const formatLower = outputFormat.toLowerCase();
    const canUseImageMagick = initialized && 
      Magick && 
      imageMagickFormats.output.includes(formatLower);
    
    let result;
    
    if (canUseImageMagick) {
      // Send progress
      self.postMessage({
        type: 'progress',
        id,
        progress: 15,
        message: 'Processing with ImageMagick WASM...'
      });
      
      // Use ImageMagick for advanced format support
      result = await convertWithImageMagick(imageData, outputFormat, options);
      
    } else {
      // Send progress
      self.postMessage({
        type: 'progress',
        id,
        progress: 15,
        message: 'Processing with Canvas API fallback...'
      });
      
      // Fallback to Canvas API
      result = await convertWithCanvas(imageData, outputFormat, options);
    }
    
    // Send progress
    self.postMessage({
      type: 'progress',
      id,
      progress: 90,
      message: 'Finalizing conversion...'
    });
    
    // Send success result
    self.postMessage({
      type: 'success',
      id,
      result: {
        ...result,
        supportAdvancedFormats: canUseImageMagick,
        processingMethod: result.method
      }
    }, [result.blob]); // Transfer the blob
    
  } catch (error) {
    console.error('Conversion error:', error);
    
    self.postMessage({
      type: 'error',
      id,
      error: error.message,
      details: {
        imageMagickAvailable: initialized && !!Magick,
        requestedFormat: outputFormat,
        fallbackAttempted: !initialized
      }
    });
  }
}

/**
 * Get supported formats based on current capabilities
 */
function getSupportedFormats() {
  if (initialized && Magick) {
    return {
      input: imageMagickFormats.input,
      output: imageMagickFormats.output,
      advanced: true
    };
  } else {
    // Canvas API fallback formats
    return {
      input: ['jpeg', 'jpg', 'png', 'webp', 'bmp', 'gif'],
      output: ['jpeg', 'jpg', 'png', 'webp', 'bmp'],
      advanced: false
    };
  }
}

/**
 * Handle messages from main thread
 */
self.onmessage = async function(event) {
  const { type, data } = event.data;
  
  try {
    switch (type) {
      case 'init':
        await initializeImageMagick();
        break;
        
      case 'convert':
        await processConversion(data);
        break;
        
      case 'getSupportedFormats':
        self.postMessage({
          type: 'success',
          id: data.id,
          result: getSupportedFormats()
        });
        break;
        
      case 'getCapabilities':
        self.postMessage({
          type: 'success',
          id: data.id,
          result: {
            imageMagickLoaded: initialized && !!Magick,
            supportedFormats: getSupportedFormats(),
            version: initialized ? 'ImageMagick WASM 0.0.35' : 'Canvas API Fallback'
          }
        });
        break;
        
      default:
        self.postMessage({
          type: 'error',
          id: data.id || 'unknown',
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

// Handle worker errors
self.onerror = function(error) {
  console.error('Worker error:', error);
  
  self.postMessage({
    type: 'error',
    error: `Worker error: ${error.message || 'Unknown error'}`
  });
};

// Initialize ImageMagick when worker starts
initializeImageMagick().catch(error => {
  console.error('Auto-initialization failed:', error);
  // Worker will still function with Canvas API fallback
});