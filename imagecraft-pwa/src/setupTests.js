/**
 * Test Setup Configuration
 * Sets up testing environment for ImageCraft Pro
 */

import '@testing-library/jest-dom';
import 'jest-canvas-mock';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-object-url');
global.URL.revokeObjectURL = jest.fn();

// Mock createImageBitmap
global.createImageBitmap = jest.fn(() => 
  Promise.resolve({
    width: 100,
    height: 100,
    close: jest.fn()
  })
);

// Mock File and Blob APIs
global.File = class File extends Blob {
  constructor(fileBits, fileName, options = {}) {
    super(fileBits, options);
    this.name = fileName;
    this.lastModified = options.lastModified || Date.now();
  }
};

// Mock FileReader
global.FileReader = class FileReader {
  constructor() {
    this.readyState = 0;
    this.result = null;
    this.error = null;
    this.onload = null;
    this.onerror = null;
    this.onabort = null;
    this.onloadstart = null;
    this.onloadend = null;
    this.onprogress = null;
  }

  readAsArrayBuffer(file) {
    this.readyState = 2;
    this.result = new ArrayBuffer(8);
    setTimeout(() => {
      if (this.onload) this.onload({ target: this });
    }, 0);
  }

  readAsDataURL(file) {
    this.readyState = 2;
    this.result = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD';
    setTimeout(() => {
      if (this.onload) this.onload({ target: this });
    }, 0);
  }

  readAsText(file) {
    this.readyState = 2;
    this.result = 'test content';
    setTimeout(() => {
      if (this.onload) this.onload({ target: this });
    }, 0);
  }

  abort() {
    this.readyState = 0;
    if (this.onabort) this.onabort({ target: this });
  }
};

// Mock Canvas toBlob method
HTMLCanvasElement.prototype.toBlob = jest.fn(function(callback, type, quality) {
  const canvas = this;
  setTimeout(() => {
    const blob = new Blob(['mocked canvas data'], { type: type || 'image/png' });
    callback(blob);
  }, 0);
});

// Mock Canvas getContext to return a mock context
const mockContext = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '10px sans-serif',
  textAlign: 'start',
  textBaseline: 'alphabetic',
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'low',
  filter: 'none',
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  lineCap: 'butt',
  lineJoin: 'miter',
  miterLimit: 10,
  shadowBlur: 0,
  shadowColor: 'rgba(0, 0, 0, 0)',
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  
  // Methods
  arc: jest.fn(),
  arcTo: jest.fn(),
  beginPath: jest.fn(),
  bezierCurveTo: jest.fn(),
  clearRect: jest.fn(),
  clip: jest.fn(),
  closePath: jest.fn(),
  createImageData: jest.fn(() => ({
    data: new Uint8ClampedArray(400), // 10x10 RGBA
    width: 10,
    height: 10
  })),
  createLinearGradient: jest.fn(),
  createPattern: jest.fn(),
  createRadialGradient: jest.fn(),
  drawImage: jest.fn(),
  fill: jest.fn(),
  fillRect: jest.fn(),
  fillText: jest.fn(),
  getImageData: jest.fn(() => ({
    data: new Uint8ClampedArray(400), // 10x10 RGBA
    width: 10,
    height: 10
  })),
  getLineDash: jest.fn(() => []),
  isPointInPath: jest.fn(),
  isPointInStroke: jest.fn(),
  lineTo: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  moveTo: jest.fn(),
  putImageData: jest.fn(),
  quadraticCurveTo: jest.fn(),
  rect: jest.fn(),
  restore: jest.fn(),
  rotate: jest.fn(),
  save: jest.fn(),
  scale: jest.fn(),
  setLineDash: jest.fn(),
  setTransform: jest.fn(),
  stroke: jest.fn(),
  strokeRect: jest.fn(),
  strokeText: jest.fn(),
  transform: jest.fn(),
  translate: jest.fn()
};

HTMLCanvasElement.prototype.getContext = jest.fn((contextType) => {
  if (contextType === '2d') {
    return mockContext;
  }
  return null;
});

// Mock performance API
global.performance = global.performance || {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
};

// Mock Web Workers
global.Worker = class Worker {
  constructor(url) {
    this.url = url;
    this.onmessage = null;
    this.onerror = null;
    this.onmessageerror = null;
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({ data: 'worker response' });
      }
    }, 0);
  }
  
  postMessage(data) {
    // Mock worker response
  }
  
  terminate() {
    // Mock termination
  }
};

// Mock console methods for cleaner test output
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' && 
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
  
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' && 
      (args[0].includes('componentWillReceiveProps') ||
       args[0].includes('componentWillUpdate'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Enhanced error handling for tests
global.testUtils = {
  createMockFile: (name = 'test.jpg', type = 'image/jpeg', size = 1024) => {
    const file = new File(['test content'], name, { type, lastModified: Date.now() });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  },
  
  createMockRAWFile: (name = 'test.cr2', type = 'image/x-canon-cr2', size = 25 * 1024 * 1024) => {
    const file = new File(['RAW test content'], name, { type, lastModified: Date.now() });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  },
  
  createMockImageBitmap: (width = 100, height = 100) => ({
    width,
    height,
    close: jest.fn()
  }),
  
  waitForPromises: () => new Promise(resolve => setImmediate(resolve)),
  
  mockConsoleMethod: (method) => {
    const originalMethod = console[method];
    console[method] = jest.fn();
    return () => {
      console[method] = originalMethod;
    };
  }
};