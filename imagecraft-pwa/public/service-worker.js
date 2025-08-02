// ImageCraft Pro Service Worker
// Handles caching, offline functionality, and background sync

const CACHE_NAME = 'imagecraft-pro-v1.0.0';
const API_CACHE_NAME = 'imagecraft-api-v1.0.0';
const IMAGES_CACHE_NAME = 'imagecraft-images-v1.0.0';

// Files to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  // Add other static assets
];

// API endpoints that should be cached
const CACHEABLE_API_PATTERNS = [
  /\/api\/templates\/collage/,
  /\/api\/presets\/filters/,
  /\/api\/auth\/me/,
];

// API endpoints that should never be cached
const NON_CACHEABLE_API_PATTERNS = [
  /\/api\/auth\/login/,
  /\/api\/auth\/register/,
  /\/api\/auth\/logout/,
  /\/api\/files\/upload/,
  /\/api\/webhooks\/clerk/, // Clerk webhooks
  /\/clerk/, // Any Clerk-specific endpoints
];

// Network-first strategy with fallback to cache
const networkFirstStrategy = async (request, cacheName) => {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
};

// Cache-first strategy with network fallback
const cacheFirstStrategy = async (request, cacheName) => {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return offline fallback if available
    return getOfflineFallback(request);
  }
};

// Get offline fallback response
const getOfflineFallback = (request) => {
  if (request.destination === 'document') {
    return caches.match('/offline.html') || new Response(
      '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your internet connection.</p></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  if (request.destination === 'image') {
    return new Response(
      '<svg width="200" height="150" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6b7280">Image unavailable offline</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }

  return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
};

// Check if API request should be cached
const shouldCacheApiRequest = (url) => {
  return CACHEABLE_API_PATTERNS.some(pattern => pattern.test(url)) &&
         !NON_CACHEABLE_API_PATTERNS.some(pattern => pattern.test(url));
};

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('ServiceWorker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching static resources');
      return cache.addAll(STATIC_CACHE_URLS);
    }).then(() => {
      // Skip waiting to activate immediately
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('ServiceWorker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== API_CACHE_NAME && 
              cacheName !== IMAGES_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    // Never cache Clerk-related API calls
    if (url.pathname.includes('clerk') || url.pathname.includes('auth')) {
      // Always go to network for authentication requests
      return;
    }

    if (shouldCacheApiRequest(url.pathname)) {
      // Cache API responses that don't change frequently
      event.respondWith(
        cacheFirstStrategy(request, API_CACHE_NAME)
      );
    } else {
      // Network-first for dynamic API endpoints
      event.respondWith(
        networkFirstStrategy(request, API_CACHE_NAME)
      );
    }
    return;
  }

  // Handle image requests
  if (request.destination === 'image') {
    event.respondWith(
      cacheFirstStrategy(request, IMAGES_CACHE_NAME)
    );
    return;
  }

  // Handle navigation requests (pages)
  if (request.destination === 'document') {
    event.respondWith(
      networkFirstStrategy(request, CACHE_NAME)
    );
    return;
  }

  // Handle static assets
  event.respondWith(
    cacheFirstStrategy(request, CACHE_NAME)
  );
});

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-upload') {
    event.waitUntil(retryFailedUploads());
  }

  if (event.tag === 'background-api-sync') {
    event.waitUntil(syncPendingApiRequests());
  }
});

// Retry failed uploads when back online
const retryFailedUploads = async () => {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['failed-uploads'], 'readonly');
    const store = transaction.objectStore('failed-uploads');
    const failedUploads = await getAllFromStore(store);

    for (const upload of failedUploads) {
      try {
        const formData = new FormData();
        formData.append('file', upload.file);

        const response = await fetch('/api/files/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${upload.token}`
          },
          body: formData
        });

        if (response.ok) {
          // Remove from failed uploads
          const deleteTransaction = db.transaction(['failed-uploads'], 'readwrite');
          const deleteStore = deleteTransaction.objectStore('failed-uploads');
          await deleteStore.delete(upload.id);

          // Notify clients of successful upload
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'UPLOAD_RETRY_SUCCESS',
                payload: { uploadId: upload.id, response: await response.json() }
              });
            });
          });
        }
      } catch (error) {
        console.error('Failed to retry upload:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
};

// Sync pending API requests
const syncPendingApiRequests = async () => {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['pending-requests'], 'readonly');
    const store = transaction.objectStore('pending-requests');
    const pendingRequests = await getAllFromStore(store);

    for (const pendingRequest of pendingRequests) {
      try {
        const response = await fetch(pendingRequest.url, {
          method: pendingRequest.method,
          headers: pendingRequest.headers,
          body: pendingRequest.body
        });

        if (response.ok) {
          // Remove from pending requests
          const deleteTransaction = db.transaction(['pending-requests'], 'readwrite');
          const deleteStore = deleteTransaction.objectStore('pending-requests');
          await deleteStore.delete(pendingRequest.id);

          // Notify clients
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'REQUEST_SYNC_SUCCESS',
                payload: { requestId: pendingRequest.id, response: await response.json() }
              });
            });
          });
        }
      } catch (error) {
        console.error('Failed to sync request:', error);
      }
    }
  } catch (error) {
    console.error('API sync failed:', error);
  }
};

// IndexedDB helpers
const openIndexedDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ImageCraftPro', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object stores
      if (!db.objectStoreNames.contains('failed-uploads')) {
        const uploadStore = db.createObjectStore('failed-uploads', { keyPath: 'id' });
        uploadStore.createIndex('timestamp', 'timestamp');
      }

      if (!db.objectStoreNames.contains('pending-requests')) {
        const requestStore = db.createObjectStore('pending-requests', { keyPath: 'id' });
        requestStore.createIndex('timestamp', 'timestamp');
      }

      if (!db.objectStoreNames.contains('offline-data')) {
        const dataStore = db.createObjectStore('offline-data', { keyPath: 'key' });
        dataStore.createIndex('timestamp', 'timestamp');
      }
    };
  });
};

const getAllFromStore = (store) => {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      data: data.data,
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false,
      tag: data.tag || 'default'
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error('Push notification error:', error);
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // If app is already open, focus it
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          // Send message to handle the notification action
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            payload: data
          });
          return;
        }
      }
      
      // Otherwise, open a new window
      return self.clients.openWindow(data.url || '/');
    })
  );
});

// Message handling from clients
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CACHE_API_RESPONSE':
      cacheApiResponse(payload.request, payload.response);
      break;

    case 'STORE_FAILED_UPLOAD':
      storeFailedUpload(payload);
      break;

    case 'CLEAR_CACHE':
      clearCache(payload.cacheName);
      break;

    case 'CLERK_SESSION_UPDATED':
      handleClerkSessionUpdate(payload);
      break;

    case 'CLERK_SESSION_ENDED':
      handleClerkSessionEnd();
      break;

    default:
      console.log('Unknown message type:', type);
  }
});

// Helper functions
const cacheApiResponse = async (request, response) => {
  try {
    const cache = await caches.open(API_CACHE_NAME);
    await cache.put(request, response);
  } catch (error) {
    console.error('Failed to cache API response:', error);
  }
};

const storeFailedUpload = async (uploadData) => {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['failed-uploads'], 'readwrite');
    const store = transaction.objectStore('failed-uploads');
    
    await store.add({
      id: Date.now(),
      ...uploadData,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Failed to store failed upload:', error);
  }
};

const clearCache = async (cacheName) => {
  try {
    await caches.delete(cacheName || CACHE_NAME);
    console.log('Cache cleared:', cacheName);
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
};

// Clerk session management
const handleClerkSessionUpdate = async (sessionData) => {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['offline-data'], 'readwrite');
    const store = transaction.objectStore('offline-data');
    
    // Store session data for offline use
    await store.put({
      key: 'clerk-session',
      data: {
        userId: sessionData.userId,
        sessionId: sessionData.sessionId,
        token: sessionData.token,
        expiresAt: sessionData.expiresAt
      },
      timestamp: new Date()
    });

    console.log('Clerk session cached for offline use');
  } catch (error) {
    console.error('Failed to cache Clerk session:', error);
  }
};

const handleClerkSessionEnd = async () => {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['offline-data'], 'readwrite');
    const store = transaction.objectStore('offline-data');
    
    // Remove cached session data
    await store.delete('clerk-session');
    
    // Clear user-specific caches
    const cacheNames = await caches.keys();
    for (const cacheName of cacheNames) {
      if (cacheName.includes('user-') || cacheName.includes('auth-')) {
        await caches.delete(cacheName);
      }
    }

    console.log('Clerk session data cleared');
  } catch (error) {
    console.error('Failed to clear Clerk session:', error);
  }
};

// Enhanced request retry with Clerk token refresh
const retryFailedUploads = async () => {
  try {
    const db = await openIndexedDB();
    
    // Get cached session data
    const sessionTransaction = db.transaction(['offline-data'], 'readonly');
    const sessionStore = sessionTransaction.objectStore('offline-data');
    const sessionRequest = sessionStore.get('clerk-session');
    
    const sessionData = await new Promise((resolve, reject) => {
      sessionRequest.onsuccess = () => resolve(sessionRequest.result);
      sessionRequest.onerror = () => reject(sessionRequest.error);
    });

    if (!sessionData || !sessionData.data.token) {
      console.log('No valid session for retry');
      return;
    }

    const transaction = db.transaction(['failed-uploads'], 'readonly');
    const store = transaction.objectStore('failed-uploads');
    const failedUploads = await getAllFromStore(store);

    for (const upload of failedUploads) {
      try {
        const formData = new FormData();
        formData.append('file', upload.file);

        const response = await fetch('/api/files/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionData.data.token}`
          },
          body: formData
        });

        if (response.ok) {
          // Remove from failed uploads
          const deleteTransaction = db.transaction(['failed-uploads'], 'readwrite');
          const deleteStore = deleteTransaction.objectStore('failed-uploads');
          await deleteStore.delete(upload.id);

          // Notify clients of successful upload
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'UPLOAD_RETRY_SUCCESS',
                payload: { uploadId: upload.id, response: response.json() }
              });
            });
          });
        }
      } catch (error) {
        console.error('Failed to retry upload:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
};

console.log('ImageCraft Pro ServiceWorker with Clerk integration loaded');