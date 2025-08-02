/**
 * Batch Queue Manager
 * Handles batch upload and processing operations with queue management
 */

import { v4 as uuidv4 } from 'uuid';

class BatchQueueManager {
  constructor() {
    this.uploadQueue = new Map();
    this.processingQueue = new Map();
    this.completedItems = new Map();
    this.activeOperations = new Map();
    this.listeners = new Map();
    this.maxConcurrentUploads = 3;
    this.maxConcurrentProcessing = 2;
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
  }

  // Event system
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  emit(event, data) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in queue manager listener:', error);
        }
      });
    }
  }

  // Add files to upload queue
  addFilesToQueue(files, options = {}) {
    const queueItems = [];
    
    files.forEach(file => {
      const queueItem = {
        id: uuidv4(),
        file,
        status: 'pending',
        progress: 0,
        error: null,
        result: null,
        retryCount: 0,
        createdAt: new Date(),
        options: {
          priority: 'normal',
          ...options
        }
      };
      
      this.uploadQueue.set(queueItem.id, queueItem);
      queueItems.push(queueItem);
    });

    this.emit('queue-updated', {
      type: 'upload',
      action: 'added',
      items: queueItems,
      totalCount: this.uploadQueue.size
    });

    return queueItems;
  }

  // Add processing jobs to queue
  addProcessingJobs(jobs) {
    const queueItems = [];
    
    jobs.forEach(job => {
      const queueItem = {
        id: uuidv4(),
        fileId: job.fileId,
        fileName: job.fileName,
        type: job.type,
        parameters: job.parameters || {},
        status: 'pending',
        progress: 0,
        error: null,
        result: null,
        jobId: null,
        retryCount: 0,
        createdAt: new Date(),
        options: {
          priority: 'normal',
          ...job.options
        }
      };
      
      this.processingQueue.set(queueItem.id, queueItem);
      queueItems.push(queueItem);
    });

    this.emit('queue-updated', {
      type: 'processing',
      action: 'added',
      items: queueItems,
      totalCount: this.processingQueue.size
    });

    return queueItems;
  }

  // Start batch upload processing
  async startBatchUpload(uploadFunction, options = {}) {
    const { maxConcurrent = this.maxConcurrentUploads, onProgress } = options;
    
    const pendingItems = Array.from(this.uploadQueue.values())
      .filter(item => item.status === 'pending')
      .sort((a, b) => {
        // Priority sorting: high -> normal -> low
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        return priorityOrder[b.options.priority] - priorityOrder[a.options.priority];
      });

    if (pendingItems.length === 0) {
      return [];
    }

    this.emit('batch-started', {
      type: 'upload',
      totalItems: pendingItems.length
    });

    const activeUploads = new Set();
    const results = [];
    let currentIndex = 0;

    const processNextUpload = async () => {
      if (currentIndex >= pendingItems.length) {
        return;
      }

      const item = pendingItems[currentIndex++];
      activeUploads.add(item.id);

      try {
        // Update status to uploading
        this.updateQueueItem('upload', item.id, {
          status: 'uploading',
          progress: 0
        });

        // Perform upload with progress tracking
        const result = await uploadFunction(item.file, (progress) => {
          this.updateQueueItem('upload', item.id, { progress });
          
          if (onProgress) {
            onProgress({
              itemId: item.id,
              fileName: item.file.name,
              progress,
              currentIndex: currentIndex - 1,
              totalItems: pendingItems.length
            });
          }
        });

        // Update with success
        this.updateQueueItem('upload', item.id, {
          status: 'completed',
          progress: 100,
          result
        });

        results.push({ ...item, result });

        this.emit('item-completed', {
          type: 'upload',
          item: { ...item, result }
        });

      } catch (error) {
        console.error(`Upload failed for ${item.file.name}:`, error);
        
        // Handle retry logic
        if (item.retryCount < this.retryAttempts) {
          this.updateQueueItem('upload', item.id, {
            status: 'retrying',
            retryCount: item.retryCount + 1,
            error: error.message
          });

          // Retry after delay
          setTimeout(() => {
            this.updateQueueItem('upload', item.id, {
              status: 'pending',
              progress: 0
            });
            processNextUpload();
          }, this.retryDelay * (item.retryCount + 1));
        } else {
          this.updateQueueItem('upload', item.id, {
            status: 'failed',
            error: error.message
          });

          this.emit('item-failed', {
            type: 'upload',
            item,
            error: error.message
          });
        }
      } finally {
        activeUploads.delete(item.id);
        
        // Process next upload if there are more items
        if (currentIndex < pendingItems.length) {
          processNextUpload();
        } else if (activeUploads.size === 0) {
          // All uploads completed
          this.emit('batch-completed', {
            type: 'upload',
            results,
            totalItems: pendingItems.length,
            completedItems: results.length,
            failedItems: pendingItems.length - results.length
          });
        }
      }
    };

    // Start concurrent uploads
    const concurrentUploads = Math.min(maxConcurrent, pendingItems.length);
    for (let i = 0; i < concurrentUploads; i++) {
      processNextUpload();
    }

    return results;
  }

  // Start batch processing
  async startBatchProcessing(processingFunction, options = {}) {
    const { maxConcurrent = this.maxConcurrentProcessing, onProgress } = options;
    
    const pendingItems = Array.from(this.processingQueue.values())
      .filter(item => item.status === 'pending')
      .sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        return priorityOrder[b.options.priority] - priorityOrder[a.options.priority];
      });

    if (pendingItems.length === 0) {
      return [];
    }

    this.emit('batch-started', {
      type: 'processing',
      totalItems: pendingItems.length
    });

    const activeProcessing = new Set();
    const results = [];
    let currentIndex = 0;

    const processNextJob = async () => {
      if (currentIndex >= pendingItems.length) {
        return;
      }

      const item = pendingItems[currentIndex++];
      activeProcessing.add(item.id);

      try {
        // Update status to processing
        this.updateQueueItem('processing', item.id, {
          status: 'processing',
          progress: 0
        });

        // Start processing job
        const jobResult = await processingFunction(item.type, {
          fileId: item.fileId,
          ...item.parameters
        });

        // Update with job info
        this.updateQueueItem('processing', item.id, {
          jobId: jobResult.id,
          status: 'processing'
        });

        // Monitor job progress
        this.monitorProcessingJob(item.id, jobResult.id, onProgress);

      } catch (error) {
        console.error(`Processing failed for ${item.fileName}:`, error);
        
        // Handle retry logic
        if (item.retryCount < this.retryAttempts) {
          this.updateQueueItem('processing', item.id, {
            status: 'retrying',
            retryCount: item.retryCount + 1,
            error: error.message
          });

          setTimeout(() => {
            this.updateQueueItem('processing', item.id, {
              status: 'pending',
              progress: 0
            });
            processNextJob();
          }, this.retryDelay * (item.retryCount + 1));
        } else {
          this.updateQueueItem('processing', item.id, {
            status: 'failed',
            error: error.message
          });

          this.emit('item-failed', {
            type: 'processing',
            item,
            error: error.message
          });
        }
      } finally {
        activeProcessing.delete(item.id);
        
        if (currentIndex < pendingItems.length) {
          processNextJob();
        } else if (activeProcessing.size === 0) {
          this.emit('batch-completed', {
            type: 'processing',
            results,
            totalItems: pendingItems.length,
            completedItems: results.length,
            failedItems: pendingItems.length - results.length
          });
        }
      }
    };

    // Start concurrent processing
    const concurrentJobs = Math.min(maxConcurrent, pendingItems.length);
    for (let i = 0; i < concurrentJobs; i++) {
      processNextJob();
    }

    return results;
  }

  // Monitor processing job progress
  monitorProcessingJob(queueItemId, jobId, onProgress) {
    // This would typically integrate with the job monitoring system
    // For now, we'll use a simulated progress update
    const updateProgress = async () => {
      try {
        // This would call the actual job status API
        // const jobStatus = await getJobStatus(jobId);
        
        // Simulated progress for demonstration
        const item = this.processingQueue.get(queueItemId);
        if (!item) return;

        if (item.status === 'processing') {
          const newProgress = Math.min(item.progress + Math.random() * 20, 100);
          
          this.updateQueueItem('processing', queueItemId, {
            progress: newProgress
          });

          if (onProgress) {
            onProgress({
              itemId: queueItemId,
              fileName: item.fileName,
              progress: newProgress,
              jobId
            });
          }

          if (newProgress < 100) {
            setTimeout(updateProgress, 1000 + Math.random() * 2000);
          } else {
            // Mark as completed
            this.updateQueueItem('processing', queueItemId, {
              status: 'completed',
              progress: 100,
              result: {
                url: `https://example.com/processed/${jobId}`,
                thumbnailUrl: `https://example.com/thumbnails/${jobId}`,
                format: 'png',
                size: Math.floor(Math.random() * 1000000) + 100000
              }
            });

            this.emit('item-completed', {
              type: 'processing',
              item: this.processingQueue.get(queueItemId)
            });
          }
        }
      } catch (error) {
        console.error('Error monitoring job progress:', error);
        this.updateQueueItem('processing', queueItemId, {
          status: 'failed',
          error: error.message
        });
      }
    };

    setTimeout(updateProgress, 1000);
  }

  // Update queue item
  updateQueueItem(queueType, itemId, updates) {
    const queue = queueType === 'upload' ? this.uploadQueue : this.processingQueue;
    const item = queue.get(itemId);
    
    if (item) {
      const updatedItem = { ...item, ...updates, updatedAt: new Date() };
      queue.set(itemId, updatedItem);

      this.emit('item-updated', {
        type: queueType,
        itemId,
        item: updatedItem,
        updates
      });

      return updatedItem;
    }
    
    return null;
  }

  // Remove item from queue
  removeQueueItem(queueType, itemId) {
    const queue = queueType === 'upload' ? this.uploadQueue : this.processingQueue;
    const item = queue.get(itemId);
    
    if (item) {
      queue.delete(itemId);
      
      this.emit('queue-updated', {
        type: queueType,
        action: 'removed',
        itemId,
        totalCount: queue.size
      });
      
      return item;
    }
    
    return null;
  }

  // Get queue status
  getQueueStatus(queueType) {
    const queue = queueType === 'upload' ? this.uploadQueue : this.processingQueue;
    const items = Array.from(queue.values());
    
    return {
      total: items.length,
      pending: items.filter(item => item.status === 'pending').length,
      processing: items.filter(item => ['uploading', 'processing'].includes(item.status)).length,
      completed: items.filter(item => item.status === 'completed').length,
      failed: items.filter(item => item.status === 'failed').length,
      retrying: items.filter(item => item.status === 'retrying').length
    };
  }

  // Clear completed items
  clearCompleted(queueType) {
    const queue = queueType === 'upload' ? this.uploadQueue : this.processingQueue;
    const completedItems = [];
    
    for (const [id, item] of queue.entries()) {
      if (item.status === 'completed') {
        completedItems.push(item);
        queue.delete(id);
      }
    }
    
    this.emit('queue-updated', {
      type: queueType,
      action: 'cleared-completed',
      clearedCount: completedItems.length,
      totalCount: queue.size
    });
    
    return completedItems;
  }

  // Clear all items
  clearAll(queueType) {
    const queue = queueType === 'upload' ? this.uploadQueue : this.processingQueue;
    const clearedCount = queue.size;
    
    queue.clear();
    
    this.emit('queue-updated', {
      type: queueType,
      action: 'cleared-all',
      clearedCount,
      totalCount: 0
    });
  }

  // Pause/Resume operations
  pauseQueue(queueType) {
    this.emit('queue-paused', { type: queueType });
  }

  resumeQueue(queueType) {
    this.emit('queue-resumed', { type: queueType });
  }

  // Get queue items
  getQueueItems(queueType, filter = null) {
    const queue = queueType === 'upload' ? this.uploadQueue : this.processingQueue;
    let items = Array.from(queue.values());
    
    if (filter) {
      if (typeof filter === 'function') {
        items = items.filter(filter);
      } else if (typeof filter === 'string') {
        items = items.filter(item => item.status === filter);
      }
    }
    
    return items.sort((a, b) => a.createdAt - b.createdAt);
  }

  // Cleanup
  destroy() {
    this.uploadQueue.clear();
    this.processingQueue.clear();
    this.completedItems.clear();
    this.activeOperations.clear();
    this.listeners.clear();
  }
}

// Export singleton instance
export const batchQueueManager = new BatchQueueManager();
export default batchQueueManager;