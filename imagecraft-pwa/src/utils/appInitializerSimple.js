/**
 * Simplified Application Initializer
 * Minimal initialization without external dependencies
 */

import serviceInitializer from './serviceInitializer';

class SimpleAppInitializer {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return true;

    try {
      console.log('Starting simple initialization...');
      
      // Basic setup without external API calls
      this._setupBasicErrorReporting();
      this._setupLocalStorage();
      
      // Initialize critical services
      console.log('Initializing critical services...');
      await serviceInitializer.initializeServices();
      
      this.initialized = true;
      console.log('Simple initialization completed');
      
      return true;
    } catch (error) {
      console.error('Simple initialization failed:', error);
      // Don't throw - allow app to start anyway
      this.initialized = true;
      return true;
    }
  }

  _setupBasicErrorReporting() {
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
    });
  }

  _setupLocalStorage() {
    try {
      // Test localStorage availability
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      console.log('LocalStorage available');
    } catch (error) {
      console.warn('LocalStorage not available:', error);
    }
  }

  getInitializationStatus() {
    return {
      initialized: this.initialized,
      simplified: true,
      timestamp: new Date().toISOString()
    };
  }
}

// Create and export singleton instance
const simpleAppInitializer = new SimpleAppInitializer();

export default simpleAppInitializer;