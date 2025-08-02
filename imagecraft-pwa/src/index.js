import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import appInitializer from './utils/appInitializerSimple';
import { Loading } from './components/ui/spinner.jsx';
// SECURITY: Import security initialization
import { initializeSecurity } from './utils/cspHeaders.js';

// Initialize the app asynchronously
const initializeAndRender = async () => {
  console.log('Starting app initialization...');
  const root = ReactDOM.createRoot(document.getElementById('root'));
  
  // Show loading screen while initializing
  root.render(
    <React.StrictMode>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-blue-50">
        <Loading 
          text="Initializing ImageCraft Pro..." 
          size="large" 
          className="text-center"
        />
      </div>
    </React.StrictMode>
  );

  try {
    // SECURITY: Initialize security measures first
    console.log('Initializing security measures...');
    initializeSecurity();
    
    console.log('Starting app initializer...');
    // Initialize the application with timeout
    await Promise.race([
      appInitializer.initialize(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('App initialization timeout')), 10000)
      )
    ]);
    
    console.log('App initialization completed, rendering main app...');
    
    // Render the main app
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log('Main app rendered successfully');
  } catch (error) {
    console.error('App initialization failed:', error);
    
    // Render error fallback
    root.render(
      <React.StrictMode>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-red-800 mb-4">Initialization Failed</h1>
            <p className="text-red-600 mb-6">ImageCraft Pro failed to start properly.</p>
            <p className="text-sm text-red-500 mb-4">Error: {error.message}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      </React.StrictMode>
    );
  }
};

// Start initialization
initializeAndRender();

// Register service worker with custom configuration
serviceWorkerRegistration.register({
  onSuccess: (registration) => {
    console.log('SW registered successfully');
    
    // Setup periodic background sync if supported
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      // Register background sync events
      registration.sync?.register('background-api-sync');
    }
  },
  onUpdate: (registration) => {
    console.log('SW updated, new content available');
    
    // Notify user of update
    if (window.confirm('New version available! Click OK to refresh.')) {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    }
  }
});

// Handle service worker messages
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    const { type, payload } = event.data;
    
    switch (type) {
      case 'UPLOAD_RETRY_SUCCESS':
        console.log('Background upload retry succeeded:', payload);
        // Could dispatch to global state or show notification
        break;
        
      case 'REQUEST_SYNC_SUCCESS':
        console.log('Background API sync succeeded:', payload);
        break;
        
      case 'NOTIFICATION_CLICK':
        console.log('Notification clicked:', payload);
        // Handle notification click actions
        break;
        
      default:
        console.log('Unknown SW message:', type, payload);
    }
  });
}

// Global error handling - simplified for browser-only app
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});