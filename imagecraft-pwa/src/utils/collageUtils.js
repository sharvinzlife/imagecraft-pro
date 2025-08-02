/**
 * Collage Utility Functions
 * Helper functions for collage functionality
 */

// Generate unique ID
export const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Validate image file
export const validateImageFile = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    minWidth = 100,
    minHeight = 100,
    maxWidth = 8192,
    maxHeight = 8192
  } = options;

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} not supported. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds maximum ${(maxSize / 1024 / 1024).toFixed(1)}MB`
    };
  }

  return { isValid: true };
};

// Compress image file
export const compressImage = async (file, options = {}) => {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 0.9,
    type = file.type
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Create new File object with original name
            const compressedFile = new File([blob], file.name, {
              type: blob.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Canvas to blob conversion failed'));
          }
        },
        type,
        quality
      );
    };

    img.onerror = () => reject(new Error('Image load failed'));
    img.src = URL.createObjectURL(file);
  });
};

// Get image dimensions
export const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: `${img.naturalWidth}:${img.naturalHeight}`
      });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

// Calculate aspect ratio
export const calculateAspectRatio = (width, height) => {
  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
};

// Resize image to fit container
export const calculateImageFit = (imageWidth, imageHeight, containerWidth, containerHeight, fitMode = 'cover') => {
  const imageAspect = imageWidth / imageHeight;
  const containerAspect = containerWidth / containerHeight;

  let width, height, x = 0, y = 0;

  if (fitMode === 'cover') {
    if (imageAspect > containerAspect) {
      // Image is wider, fit to height
      height = containerHeight;
      width = height * imageAspect;
      x = (containerWidth - width) / 2;
    } else {
      // Image is taller, fit to width
      width = containerWidth;
      height = width / imageAspect;
      y = (containerHeight - height) / 2;
    }
  } else if (fitMode === 'contain') {
    if (imageAspect > containerAspect) {
      // Image is wider, fit to width
      width = containerWidth;
      height = width / imageAspect;
      y = (containerHeight - height) / 2;
    } else {
      // Image is taller, fit to height
      height = containerHeight;
      width = height * imageAspect;
      x = (containerWidth - width) / 2;
    }
  } else {
    // fitMode === 'fill'
    width = containerWidth;
    height = containerHeight;
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
    x: Math.round(x),
    y: Math.round(y)
  };
};

// Convert color formats
export const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Debounce function
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

// Throttle function
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Deep clone object
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

// Check if device is mobile
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Check if device supports touch
export const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Get optimal image quality based on device and network
export const getOptimalImageQuality = () => {
  // Check for slow connection
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const isSlowConnection = connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
  
  // Check for mobile device
  const isMobile = isMobileDevice();
  
  if (isSlowConnection) return 0.6;
  if (isMobile) return 0.8;
  return 0.9;
};

// Create thumbnail from image
export const createThumbnail = async (file, size = 150) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate square crop
      const minDimension = Math.min(img.width, img.height);
      const cropX = (img.width - minDimension) / 2;
      const cropY = (img.height - minDimension) / 2;

      canvas.width = size;
      canvas.height = size;

      ctx.drawImage(
        img,
        cropX, cropY, minDimension, minDimension,
        0, 0, size, size
      );

      canvas.toBlob(resolve, 'image/jpeg', 0.8);
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

// Performance monitoring
export const performanceMonitor = {
  marks: {},
  
  start(name) {
    this.marks[name] = performance.now();
  },
  
  end(name) {
    if (this.marks[name]) {
      const duration = performance.now() - this.marks[name];
      console.log(`${name}: ${duration.toFixed(2)}ms`);
      delete this.marks[name];
      return duration;
    }
  },
  
  measure(name, fn) {
    this.start(name);
    const result = fn();
    this.end(name);
    return result;
  }
};

// Memory usage tracking
export const memoryMonitor = {
  getUsage() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      };
    }
    return null;
  },
  
  logUsage(label = 'Memory Usage') {
    const usage = this.getUsage();
    if (usage) {
      console.log(`${label}: ${usage.used}MB / ${usage.total}MB (limit: ${usage.limit}MB)`);
    }
  }
};

// Cleanup object URLs
export const cleanupObjectUrls = (urls) => {
  if (Array.isArray(urls)) {
    urls.forEach(url => URL.revokeObjectURL(url));
  } else if (typeof urls === 'string') {
    URL.revokeObjectURL(urls);
  }
};

// Local storage helpers
export const storage = {
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
      return false;
    }
  },
  
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return defaultValue;
    }
  },
  
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
      return false;
    }
  },
  
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
      return false;
    }
  }
};