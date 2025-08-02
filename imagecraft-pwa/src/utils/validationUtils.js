// Standalone validation functions for image processing

/**
 * Validate image file for processing
 * @param {File} file - The file to validate
 * @param {Object} options - Validation options
 * @param {number} options.maxSize - Maximum file size in bytes
 * @param {boolean} options.skipRateLimiting - Skip rate limiting checks
 * @returns {Promise<Object>} Validation result
 */
export const validateImageFile = async (file, options = {}) => {
  // Basic file validation for security
  const maxSize = options.maxSize || 100 * 1024 * 1024; // 100MB default
  
  if (!file || !(file instanceof File)) {
    return {
      valid: false,
      file: null,
      errors: ['Invalid file object'],
      warnings: []
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      file: null,
      errors: [`File size ${Math.round(file.size/1024/1024)}MB exceeds maximum ${Math.round(maxSize/1024/1024)}MB`],
      warnings: []
    };
  }
  
  return {
    valid: true,
    file: file,
    errors: [],
    warnings: []
  };
};

/**
 * Validate image dimensions for security and performance
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @returns {Object} Validation result with valid flag and any errors
 */
export const validateImageDimensions = (width, height) => {
  const maxDimension = 8192; // 8K max dimension
  const maxPixels = 50 * 1024 * 1024; // 50 megapixels max
  
  const errors = [];
  
  if (width > maxDimension || height > maxDimension) {
    errors.push(`Image dimensions ${width}x${height} exceed maximum ${maxDimension}x${maxDimension}`);
  }
  
  if (width * height > maxPixels) {
    errors.push(`Image has ${Math.round(width * height / 1024 / 1024)} megapixels, exceeding maximum ${Math.round(maxPixels / 1024 / 1024)}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings: []
  };
};