/**
 * Test Data Factory
 * Generates mock data for testing image processing functionality
 */

/**
 * Create a mock File object for testing
 * @param {Object} options - File options
 * @returns {File} Mock file object
 */
export const createMockFile = (options = {}) => {
  const {
    name = 'test-image.jpg',
    type = 'image/jpeg',
    size = 1024 * 1024, // 1MB default
    content = 'mock file content'
  } = options;

  const file = new File([content], name, { type });
  
  // Override size property
  Object.defineProperty(file, 'size', {
    value: size,
    writable: false
  });

  return file;
};

/**
 * Create mock files for various image formats
 */
export const mockFiles = {
  jpeg: () => createMockFile({
    name: 'test.jpg',
    type: 'image/jpeg',
    size: 2 * 1024 * 1024 // 2MB
  }),

  png: () => createMockFile({
    name: 'test.png',
    type: 'image/png',
    size: 3 * 1024 * 1024 // 3MB
  }),

  webp: () => createMockFile({
    name: 'test.webp',
    type: 'image/webp',
    size: 1.5 * 1024 * 1024 // 1.5MB
  }),

  gif: () => createMockFile({
    name: 'test.gif',
    type: 'image/gif',
    size: 5 * 1024 * 1024 // 5MB
  }),

  bmp: () => createMockFile({
    name: 'test.bmp',
    type: 'image/bmp',
    size: 10 * 1024 * 1024 // 10MB
  }),

  avif: () => createMockFile({
    name: 'test.avif',
    type: 'image/avif',
    size: 800 * 1024 // 800KB
  }),

  tiff: () => createMockFile({
    name: 'test.tiff',
    type: 'image/tiff',
    size: 15 * 1024 * 1024 // 15MB
  }),

  // RAW format files
  cannonCR2: () => createMockFile({
    name: 'IMG_001.CR2',
    type: 'image/x-canon-cr2',
    size: 25 * 1024 * 1024 // 25MB
  }),

  cannonCR3: () => createMockFile({
    name: 'IMG_002.CR3',
    type: 'image/x-canon-cr3',
    size: 35 * 1024 * 1024 // 35MB
  }),

  nikonNEF: () => createMockFile({
    name: 'DSC_001.NEF',
    type: 'image/x-nikon-nef',
    size: 30 * 1024 * 1024 // 30MB
  }),

  sonyARW: () => createMockFile({
    name: 'DSC00001.ARW',
    type: 'image/x-sony-arw',
    size: 40 * 1024 * 1024 // 40MB
  }),

  olympusORF: () => createMockFile({
    name: 'P1000001.ORF',
    type: 'image/x-olympus-orf',
    size: 20 * 1024 * 1024 // 20MB
  }),

  panasonicRW2: () => createMockFile({
    name: 'P1000001.RW2',
    type: 'image/x-panasonic-rw2',
    size: 18 * 1024 * 1024 // 18MB
  }),

  fujiRAF: () => createMockFile({
    name: 'DSCF0001.RAF',
    type: 'image/x-fuji-raf',
    size: 32 * 1024 * 1024 // 32MB
  }),

  pentaxPEF: () => createMockFile({
    name: 'IMGP0001.PEF',
    type: 'image/x-pentax-pef',
    size: 28 * 1024 * 1024 // 28MB
  }),

  samsungSRW: () => createMockFile({
    name: 'SAM_0001.SRW',
    type: 'image/x-samsung-srw',
    size: 22 * 1024 * 1024 // 22MB
  }),

  adobeDNG: () => createMockFile({
    name: 'IMG_001.DNG',
    type: 'image/x-adobe-dng',
    size: 45 * 1024 * 1024 // 45MB
  }),

  sigmaX3F: () => createMockFile({
    name: 'SDIM0001.X3F',
    type: 'image/x-sigma-x3f',
    size: 15 * 1024 * 1024 // 15MB
  }),

  // Generic RAW with application/octet-stream MIME type
  genericRAW: () => createMockFile({
    name: 'IMG_001.RAW',
    type: 'application/octet-stream',
    size: 50 * 1024 * 1024 // 50MB
  }),

  // Large files for performance testing
  largeJPEG: () => createMockFile({
    name: 'large-image.jpg',
    type: 'image/jpeg',
    size: 45 * 1024 * 1024 // 45MB (close to limit)
  }),

  hugePNG: () => createMockFile({
    name: 'huge-image.png',
    type: 'image/png',
    size: 49 * 1024 * 1024 // 49MB (close to limit)
  }),

  // Invalid/malicious files for security testing
  invalidMimeType: () => createMockFile({
    name: 'fake.jpg',
    type: 'text/plain',
    size: 1024
  }),

  oversizedFile: () => createMockFile({
    name: 'oversized.jpg',
    type: 'image/jpeg',
    size: 60 * 1024 * 1024 // 60MB (over limit)
  }),

  emptyFile: () => createMockFile({
    name: 'empty.jpg',
    type: 'image/jpeg',
    size: 0
  }),

  maliciousFilename: () => createMockFile({
    name: '../../../etc/passwd.jpg',
    type: 'image/jpeg',
    size: 1024
  }),

  // Files with no MIME type
  noMimeType: () => createMockFile({
    name: 'unknown.dat',
    type: '',
    size: 1024
  })
};

/**
 * Create multiple files for batch testing
 * @param {number} count - Number of files to create
 * @param {Function} fileFactory - Factory function to create files
 * @returns {Array<File>} Array of mock files
 */
export const createBatchFiles = (count = 5, fileFactory = mockFiles.jpeg) => {
  return Array.from({ length: count }, (_, index) => {
    const file = fileFactory();
    // Make each file unique
    const parts = file.name.split('.');
    const extension = parts.pop();
    const baseName = parts.join('.');
    const uniqueName = `${baseName}_${index + 1}.${extension}`;
    
    return createMockFile({
      name: uniqueName,
      type: file.type,
      size: file.size
    });
  });
};

/**
 * Create mixed format files for comprehensive testing
 * @returns {Array<File>} Array of different format files
 */
export const createMixedFormatFiles = () => [
  mockFiles.jpeg(),
  mockFiles.png(),
  mockFiles.webp(),
  mockFiles.cannonCR2(),
  mockFiles.nikonNEF(),
  mockFiles.gif(),
  mockFiles.bmp()
];

/**
 * Create RAW files collection
 * @returns {Array<File>} Array of RAW format files
 */
export const createRAWFiles = () => [
  mockFiles.cannonCR2(),
  mockFiles.cannonCR3(),
  mockFiles.nikonNEF(),
  mockFiles.sonyARW(),
  mockFiles.olympusORF(),
  mockFiles.panasonicRW2(),
  mockFiles.fujiRAF(),
  mockFiles.pentaxPEF(),
  mockFiles.samsungSRW(),
  mockFiles.adobeDNG(),
  mockFiles.sigmaX3F(),
  mockFiles.genericRAW()
];

/**
 * Create security test files
 * @returns {Array<File>} Array of files for security testing
 */
export const createSecurityTestFiles = () => [
  mockFiles.invalidMimeType(),
  mockFiles.oversizedFile(),
  mockFiles.emptyFile(),
  mockFiles.maliciousFilename(),
  mockFiles.noMimeType()
];

/**
 * Mock ImageBitmap for testing
 * @param {Object} options - ImageBitmap options
 * @returns {Object} Mock ImageBitmap
 */
export const createMockImageBitmap = (options = {}) => {
  const { width = 1920, height = 1080 } = options;
  
  return {
    width,
    height,
    close: jest.fn()
  };
};

/**
 * Mock Canvas for testing
 * @param {Object} options - Canvas options
 * @returns {Object} Mock Canvas element
 */
export const createMockCanvas = (options = {}) => {
  const { width = 1920, height = 1080 } = options;
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  return canvas;
};

/**
 * Mock conversion result
 * @param {Object} options - Result options
 * @returns {Object} Mock conversion result
 */
export const createMockConversionResult = (options = {}) => {
  const {
    originalSize = 2 * 1024 * 1024,
    size = 1.5 * 1024 * 1024,
    format = 'jpeg',
    width = 1920,
    height = 1080,
    isRawConversion = false,
    originalRawFormat = null
  } = options;

  return {
    blob: new Blob(['converted data'], { type: `image/${format}` }),
    size,
    originalSize,
    compressionRatio: size / originalSize,
    width,
    height,
    format,
    processingTime: 1500,
    isRawConversion,
    originalRawFormat,
    formatDetectionResult: {
      isValid: true,
      isRaw: isRawConversion,
      detectedFormat: isRawConversion ? originalRawFormat : format,
      confidence: 'high'
    },
    rawValidationResult: {
      isRawFile: isRawConversion,
      detectedRawFormat: originalRawFormat,
      canConvert: true
    }
  };
};

/**
 * Mock batch conversion result
 * @param {Object} options - Batch result options
 * @returns {Object} Mock batch result
 */
export const createMockBatchResult = (options = {}) => {
  const {
    successCount = 5,
    errorCount = 0,
    totalCount = 5
  } = options;

  const results = Array.from({ length: successCount }, (_, index) => ({
    originalFile: createMockFile({ name: `file_${index + 1}.jpg` }),
    result: createMockConversionResult(),
    success: true
  }));

  const errors = Array.from({ length: errorCount }, (_, index) => ({
    originalFile: createMockFile({ name: `error_file_${index + 1}.jpg` }),
    error: 'Conversion failed',
    success: false
  }));

  return {
    results,
    errors,
    successCount,
    errorCount,
    totalCount,
    securityReport: {
      filesValidated: totalCount,
      threatsBlocked: 0,
      metadataStripped: 2
    }
  };
};

/**
 * Mock progress callback
 * @returns {Function} Mock progress callback
 */
export const createMockProgressCallback = () => jest.fn();

/**
 * Mock error for testing error scenarios
 * @param {string} message - Error message
 * @param {string} type - Error type
 * @returns {Error} Mock error
 */
export const createMockError = (message = 'Test error', type = 'ProcessingError') => {
  const error = new Error(message);
  error.name = type;
  return error;
};

export default {
  createMockFile,
  mockFiles,
  createBatchFiles,
  createMixedFormatFiles,
  createRAWFiles,
  createSecurityTestFiles,
  createMockImageBitmap,
  createMockCanvas,
  createMockConversionResult,
  createMockBatchResult,
  createMockProgressCallback,
  createMockError
};