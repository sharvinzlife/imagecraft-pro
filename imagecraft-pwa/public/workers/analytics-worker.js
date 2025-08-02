/**
 * Analytics Web Worker - Background processing for analytics events
 * Handles event processing, compression, and batch operations without blocking the main thread
 */

// Worker state
let eventQueue = [];
let processingConfig = {
  batchSize: 10,
  compressionEnabled: true,
  aggregationEnabled: true,
  retryAttempts: 3,
  retryDelay: 1000
};

// Performance optimization
let aggregationCache = new Map();
let compressionBuffer = new Map();

// Message handler
self.addEventListener('message', function(event) {
  const { type, data } = event.data;
  
  switch (type) {
    case 'PING':
      self.postMessage({ type: 'PONG', timestamp: Date.now() });
      break;
      
    case 'CONFIGURE':
      handleConfiguration(data);
      break;
      
    case 'PROCESS_EVENTS':
      handleProcessEvents(data.events);
      break;
      
    case 'FLUSH_QUEUE':
      handleFlushQueue();
      break;
      
    case 'GET_STATS':
      handleGetStats();
      break;
      
    case 'CLEAR_CACHE':
      handleClearCache();
      break;
      
    default:
      self.postMessage({ 
        type: 'ERROR', 
        data: { error: `Unknown message type: ${type}` } 
      });
  }
});

/**
 * Handle worker configuration updates
 */
function handleConfiguration(config) {
  processingConfig = { ...processingConfig, ...config };
  
  self.postMessage({
    type: 'CONFIGURATION_UPDATED',
    data: { config: processingConfig }
  });
}

/**
 * Process analytics events
 */
function handleProcessEvents(events) {
  try {
    const startTime = performance.now();
    
    // Add events to queue
    eventQueue.push(...events);
    
    // Process events in batches
    const processedBatches = [];
    
    while (eventQueue.length > 0) {
      const batchSize = Math.min(processingConfig.batchSize, eventQueue.length);
      const batch = eventQueue.splice(0, batchSize);
      
      const processedBatch = processBatch(batch);
      if (processedBatch) {
        processedBatches.push(processedBatch);
      }
    }
    
    const processingTime = performance.now() - startTime;
    
    // Send processed events back to main thread
    self.postMessage({
      type: 'EVENTS_PROCESSED',\n      data: {\n        batches: processedBatches,\n        processingTime,\n        eventsProcessed: events.length\n      }\n    });\n    \n  } catch (error) {\n    self.postMessage({\n      type: 'ERROR',\n      data: {\n        error: error.message,\n        stack: error.stack,\n        context: 'handleProcessEvents'\n      }\n    });\n  }\n}\n\n/**\n * Process a batch of events\n */\nfunction processBatch(events) {\n  if (!events || events.length === 0) return null;\n  \n  try {\n    let processedEvents = [...events];\n    \n    // Apply privacy filters\n    processedEvents = processedEvents.map(applyPrivacyFilters);\n    \n    // Apply aggregation if enabled\n    if (processingConfig.aggregationEnabled) {\n      processedEvents = applyAggregation(processedEvents);\n    }\n    \n    // Apply compression if enabled\n    if (processingConfig.compressionEnabled) {\n      processedEvents = applyCompression(processedEvents);\n    }\n    \n    // Validate events\n    processedEvents = processedEvents.filter(validateEvent);\n    \n    return {\n      events: processedEvents,\n      originalCount: events.length,\n      processedCount: processedEvents.length,\n      batchId: generateBatchId(),\n      timestamp: Date.now()\n    };\n    \n  } catch (error) {\n    self.postMessage({\n      type: 'ERROR',\n      data: {\n        error: error.message,\n        context: 'processBatch',\n        eventsCount: events.length\n      }\n    });\n    return null;\n  }\n}\n\n/**\n * Apply privacy filters to events\n */\nfunction applyPrivacyFilters(event) {\n  const filteredEvent = { ...event };\n  \n  // Remove or anonymize sensitive data\n  if (filteredEvent.properties) {\n    // Remove PII\n    delete filteredEvent.properties.email;\n    delete filteredEvent.properties.phone;\n    delete filteredEvent.properties.fullName;\n    \n    // Anonymize IP addresses\n    if (filteredEvent.properties.ipAddress) {\n      filteredEvent.properties.ipAddress = anonymizeIP(filteredEvent.properties.ipAddress);\n    }\n    \n    // Generalize user agent\n    if (filteredEvent.properties.userAgent) {\n      filteredEvent.properties.userAgent = generalizeUserAgent(filteredEvent.properties.userAgent);\n    }\n    \n    // Minimize URL data\n    if (filteredEvent.properties.url) {\n      filteredEvent.properties.url = minimizeURL(filteredEvent.properties.url);\n    }\n  }\n  \n  return filteredEvent;\n}\n\n/**\n * Apply event aggregation for similar events\n */\nfunction applyAggregation(events) {\n  const aggregated = new Map();\n  const nonAggregatable = [];\n  \n  events.forEach(event => {\n    if (isAggregatableEvent(event)) {\n      const key = generateAggregationKey(event);\n      \n      if (aggregated.has(key)) {\n        const existing = aggregated.get(key);\n        existing.count += 1;\n        existing.totalValue += (event.properties.value || 1);\n        existing.lastTimestamp = Math.max(existing.lastTimestamp, event.timestamp);\n      } else {\n        aggregated.set(key, {\n          ...event,\n          count: 1,\n          totalValue: event.properties.value || 1,\n          firstTimestamp: event.timestamp,\n          lastTimestamp: event.timestamp,\n          aggregated: true\n        });\n      }\n    } else {\n      nonAggregatable.push(event);\n    }\n  });\n  \n  return [...Array.from(aggregated.values()), ...nonAggregatable];\n}\n\n/**\n * Apply compression to reduce event payload size\n */\nfunction applyCompression(events) {\n  if (events.length === 0) return events;\n  \n  // Create shared context for the batch\n  const sharedContext = extractSharedContext(events);\n  \n  // Compress individual events\n  const compressedEvents = events.map(event => {\n    const compressed = { ...event };\n    \n    // Remove shared context from individual events\n    if (sharedContext.deviceInfo && compressed.deviceInfo) {\n      delete compressed.deviceInfo;\n    }\n    \n    if (sharedContext.browserInfo && compressed.browserInfo) {\n      delete compressed.browserInfo;\n    }\n    \n    // Compress properties\n    if (compressed.properties) {\n      compressed.properties = compressProperties(compressed.properties);\n    }\n    \n    return compressed;\n  });\n  \n  return {\n    sharedContext,\n    events: compressedEvents,\n    compressed: true\n  };\n}\n\n/**\n * Validate event structure and data\n */\nfunction validateEvent(event) {\n  try {\n    // Required fields\n    if (!event.eventId || !event.timestamp || !event.eventType) {\n      return false;\n    }\n    \n    // Validate timestamp\n    if (typeof event.timestamp !== 'number' || event.timestamp <= 0) {\n      return false;\n    }\n    \n    // Validate event type\n    if (typeof event.eventType !== 'string' || event.eventType.length === 0) {\n      return false;\n    }\n    \n    // Validate category\n    const validCategories = [\n      'user_interaction',\n      'feature_usage',\n      'performance',\n      'error',\n      'business',\n      'accessibility',\n      'glass_morphism'\n    ];\n    \n    if (event.category && !validCategories.includes(event.category)) {\n      return false;\n    }\n    \n    return true;\n    \n  } catch (error) {\n    return false;\n  }\n}\n\n/**\n * Handle queue flush request\n */\nfunction handleFlushQueue() {\n  if (eventQueue.length > 0) {\n    const events = [...eventQueue];\n    eventQueue = [];\n    \n    handleProcessEvents(events);\n  } else {\n    self.postMessage({\n      type: 'QUEUE_FLUSHED',\n      data: { eventsProcessed: 0 }\n    });\n  }\n}\n\n/**\n * Handle stats request\n */\nfunction handleGetStats() {\n  const stats = {\n    queueSize: eventQueue.length,\n    cacheSize: aggregationCache.size,\n    compressionBufferSize: compressionBuffer.size,\n    processingConfig,\n    memoryUsage: getMemoryUsage(),\n    uptime: performance.now()\n  };\n  \n  self.postMessage({\n    type: 'STATS',\n    data: stats\n  });\n}\n\n/**\n * Handle cache clearing\n */\nfunction handleClearCache() {\n  aggregationCache.clear();\n  compressionBuffer.clear();\n  eventQueue = [];\n  \n  self.postMessage({\n    type: 'CACHE_CLEARED',\n    data: { timestamp: Date.now() }\n  });\n}\n\n// Helper functions\n\nfunction anonymizeIP(ip) {\n  // Simple IP anonymization (remove last octet)\n  const parts = ip.split('.');\n  if (parts.length === 4) {\n    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;\n  }\n  return '[anonymized]';\n}\n\nfunction generalizeUserAgent(userAgent) {\n  // Extract browser name and major version only\n  const browserRegex = /(Chrome|Firefox|Safari|Edge|Opera)\\/(\\d+)/i;\n  const match = userAgent.match(browserRegex);\n  \n  if (match) {\n    return `${match[1]}/${match[2]}.x`;\n  }\n  \n  return '[browser]';\n}\n\nfunction minimizeURL(url) {\n  try {\n    const urlObj = new URL(url);\n    \n    // Keep only essential URL parts\n    const cleanParams = new URLSearchParams();\n    \n    // Preserve only analytics-relevant parameters\n    const allowedParams = ['utm_source', 'utm_medium', 'utm_campaign'];\n    allowedParams.forEach(param => {\n      const value = urlObj.searchParams.get(param);\n      if (value) {\n        cleanParams.set(param, value);\n      }\n    });\n    \n    return `${urlObj.origin}${urlObj.pathname}${\n      cleanParams.toString() ? '?' + cleanParams.toString() : ''\n    }`;\n    \n  } catch (error) {\n    return '[url]';\n  }\n}\n\nfunction isAggregatableEvent(event) {\n  // Events that can be aggregated\n  const aggregatableTypes = [\n    'page_view',\n    'button_click',\n    'scroll_event',\n    'hover_event',\n    'glass_interaction'\n  ];\n  \n  return aggregatableTypes.includes(event.eventType);\n}\n\nfunction generateAggregationKey(event) {\n  // Create aggregation key based on event characteristics\n  const keyParts = [\n    event.eventType,\n    event.category,\n    event.properties?.elementType || 'unknown',\n    event.properties?.elementId || 'no-id'\n  ];\n  \n  return keyParts.join('|');\n}\n\nfunction extractSharedContext(events) {\n  if (events.length === 0) return {};\n  \n  const firstEvent = events[0];\n  const sharedContext = {};\n  \n  // Extract device info if consistent across events\n  if (firstEvent.deviceInfo) {\n    const deviceInfoConsistent = events.every(event => \n      JSON.stringify(event.deviceInfo) === JSON.stringify(firstEvent.deviceInfo)\n    );\n    \n    if (deviceInfoConsistent) {\n      sharedContext.deviceInfo = firstEvent.deviceInfo;\n    }\n  }\n  \n  // Extract browser info if consistent across events\n  if (firstEvent.browserInfo) {\n    const browserInfoConsistent = events.every(event => \n      JSON.stringify(event.browserInfo) === JSON.stringify(firstEvent.browserInfo)\n    );\n    \n    if (browserInfoConsistent) {\n      sharedContext.browserInfo = firstEvent.browserInfo;\n    }\n  }\n  \n  return sharedContext;\n}\n\nfunction compressProperties(properties) {\n  const compressed = {};\n  \n  Object.entries(properties).forEach(([key, value]) => {\n    // Compress boolean values\n    if (typeof value === 'boolean') {\n      compressed[key] = value ? 1 : 0;\n    }\n    // Compress commonly repeated strings\n    else if (typeof value === 'string') {\n      compressed[key] = compressString(value);\n    }\n    // Keep numbers as-is\n    else if (typeof value === 'number') {\n      compressed[key] = value;\n    }\n    // Skip complex objects to avoid issues\n    else if (value !== null && typeof value !== 'object') {\n      compressed[key] = value;\n    }\n  });\n  \n  return compressed;\n}\n\nfunction compressString(str) {\n  // Common string compression patterns\n  const compressionMap = {\n    'user_interaction': 'ui',\n    'feature_usage': 'fu',\n    'performance': 'perf',\n    'glass_morphism': 'glass',\n    'image_processing': 'img_proc',\n    'subscription_started': 'sub_start',\n    'payment_completed': 'pay_done'\n  };\n  \n  return compressionMap[str] || str;\n}\n\nfunction generateBatchId() {\n  return 'batch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);\n}\n\nfunction getMemoryUsage() {\n  // Estimate memory usage (simplified)\n  return {\n    queueMemory: eventQueue.length * 1024, // Rough estimate\n    cacheMemory: aggregationCache.size * 512,\n    totalEstimate: (eventQueue.length * 1024) + (aggregationCache.size * 512)\n  };\n}\n\n// Error handling\nself.addEventListener('error', function(error) {\n  self.postMessage({\n    type: 'ERROR',\n    data: {\n      error: error.message,\n      filename: error.filename,\n      lineno: error.lineno,\n      colno: error.colno,\n      context: 'worker_error'\n    }\n  });\n});\n\n// Initialization\nself.postMessage({\n  type: 'WORKER_READY',\n  data: {\n    timestamp: Date.now(),\n    config: processingConfig\n  }\n});"