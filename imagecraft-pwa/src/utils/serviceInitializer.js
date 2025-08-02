/**
 * Service Initializer
 * Ensures critical services are initialized early in the app lifecycle
 */

import { getImageProcessingService } from '../services/imageProcessingService';
import imageMagickService from '../services/imageMagickService';

class ServiceInitializer {
  constructor() {
    this.initialized = false;
    this.initializationPromise = null;
    this.services = {
      imageProcessing: null,
      imageMagick: null
    };
  }

  /**
   * Initialize all critical services
   */
  async initializeServices() {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._doInitialization();
    return this.initializationPromise;
  }

  async _doInitialization() {
    if (this.initialized) return true;

    console.log('ServiceInitializer: Starting service initialization...');
    
    try {
      // Initialize image processing service early
      console.log('ServiceInitializer: Initializing image processing service...');
      this.services.imageProcessing = getImageProcessingService();
      
      // Initialize ImageMagick service for advanced format support
      console.log('ServiceInitializer: Initializing ImageMagick service...');
      this.services.imageMagick = imageMagickService;
      
      // Wait for the services to be fully initialized
      await Promise.all([
        this._waitForImageProcessingService(),
        this._waitForImageMagickService()
      ]);
      
      console.log('ServiceInitializer: All services initialized successfully');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('ServiceInitializer: Service initialization failed:', error);
      // Don't prevent app from starting, but log the error
      this.initialized = true; // Mark as initialized to prevent retries
      return false;
    }
  }

  /**
   * Wait for image processing service to be ready
   */
  async _waitForImageProcessingService() {
    const service = this.services.imageProcessing;
    if (!service) return false;

    // Poll until service is initialized
    const maxRetries = 50; // 10 seconds with 200ms intervals
    let retries = 0;

    while (retries < maxRetries) {
      if (service.isInitialized) {
        console.log('ServiceInitializer: Image processing service is ready');
        return true;
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
      retries++;
    }

    console.warn('ServiceInitializer: Image processing service initialization timeout');
    return false;
  }

  /**
   * Wait for ImageMagick service to be ready
   */
  async _waitForImageMagickService() {
    try {
      // Initialize ImageMagick service
      await this.services.imageMagick.initialize();
      console.log('ServiceInitializer: ImageMagick service is ready');
      return true;
    } catch (error) {
      console.warn('ServiceInitializer: ImageMagick service initialization failed:', error);
      // Don't fail the entire initialization if ImageMagick fails
      return false;
    }
  }

  /**
   * Get initialization status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      services: {
        imageProcessing: this.services.imageProcessing?.isInitialized || false,
        imageMagick: this.services.imageMagick?.isReady() || false
      }
    };
  }

  /**
   * Force retry service initialization
   */
  async retryInitialization() {
    this.initialized = false;
    this.initializationPromise = null;
    this.services = { imageProcessing: null };
    
    return this.initializeServices();
  }
}

// Create singleton instance
const serviceInitializer = new ServiceInitializer();

export default serviceInitializer;