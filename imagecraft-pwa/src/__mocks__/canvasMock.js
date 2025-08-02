/**
 * Canvas Mock for Testing
 * Provides mock Canvas functionality for Jest tests
 */

module.exports = {
  // Mocked canvas creation
  createCanvas: jest.fn((width, height) => {
    const canvas = {
      width: width || 300,
      height: height || 150,
      getContext: jest.fn(() => ({
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        font: '10px sans-serif',
        textAlign: 'start',
        textBaseline: 'alphabetic',
        
        // Drawing methods
        fillRect: jest.fn(),
        strokeRect: jest.fn(),
        clearRect: jest.fn(),
        fillText: jest.fn(),
        strokeText: jest.fn(),
        
        // Path methods
        beginPath: jest.fn(),
        closePath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        arc: jest.fn(),
        
        // Image methods
        drawImage: jest.fn(),
        getImageData: jest.fn(() => ({
          data: new Uint8ClampedArray(width * height * 4),
          width: width || 300,
          height: height || 150
        })),
        putImageData: jest.fn(),
        createImageData: jest.fn(() => ({
          data: new Uint8ClampedArray(width * height * 4),
          width: width || 300,
          height: height || 150
        })),
        
        // Transform methods
        scale: jest.fn(),
        rotate: jest.fn(),
        translate: jest.fn(),
        transform: jest.fn(),
        setTransform: jest.fn(),
        
        // State methods
        save: jest.fn(),
        restore: jest.fn()
      })),
      
      toBuffer: jest.fn(() => Buffer.from('mock canvas data')),
      toDataURL: jest.fn(() => 'data:image/png;base64,mockdata'),
      toBlobURL: jest.fn(() => 'blob:mock-url')
    };
    
    return canvas;
  }),

  // Mocked image loading
  loadImage: jest.fn(() => Promise.resolve({
    width: 100,
    height: 100,
    naturalWidth: 100,
    naturalHeight: 100
  })),

  // Mocked font registration
  registerFont: jest.fn(),

  // Additional canvas utilities
  Image: jest.fn(() => ({
    onload: null,
    onerror: null,
    src: '',
    width: 0,
    height: 0,
    naturalWidth: 0,
    naturalHeight: 0
  }))
};