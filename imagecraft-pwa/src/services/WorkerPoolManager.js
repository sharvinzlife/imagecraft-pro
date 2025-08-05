/**
 * Enhanced Worker Pool Manager for ImageCraft Pro PWA
 * 
 * Addresses single worker bottleneck with:
 * - Dynamic worker pool management (4-6 workers based on CPU cores)
 * - Advanced load balancing and task distribution
 * - Robust error handling with automatic worker recovery
 * - Memory usage tracking and optimization
 * - Priority-based queue management
 * - Comprehensive health monitoring and metrics
 * - Graceful shutdown and cleanup
 * - Memory leak prevention
 * 
 * @version 2.0.0
 */

class WorkerPoolManager {
  constructor(options = {}) {
    // Event emitter setup
    this.events = new Map();
    // Core configuration
    this.maxWorkers = options.maxWorkers || this.calculateOptimalWorkerCount();
    this.minWorkers = options.minWorkers || Math.max(1, Math.floor(this.maxWorkers / 2));
    this.workers = new Map(); // workerId -> WorkerInfo
    this.availableWorkers = new Set(); // Set of available worker IDs
    this.busyWorkers = new Map(); // workerId -> TaskInfo
    
    // Enhanced queue management with priorities
    this.taskQueue = {
      high: [],
      normal: [],
      low: []
    };
    this.activeTasks = new Map(); // taskId -> TaskInfo
    this.completedTasks = new Map(); // taskId -> Result (for recent history)
    
    // Performance and health tracking
    this.workerStats = new Map(); // workerId -> WorkerStats
    this.globalStats = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      avgProcessingTime: 0,
      peakWorkerUsage: 0,
      memoryUsage: 0,
      uptime: Date.now(),
      restartCount: 0
    };
    
    // Configuration options
    this.taskTimeout = options.taskTimeout || 300000; // 5 minutes
    this.maxRetries = options.maxRetries || 2;
    this.healthCheckInterval = options.healthCheckInterval || 30000; // 30 seconds
    this.maxMemoryPerWorker = options.maxMemoryPerWorker || 256 * 1024 * 1024; // 256MB
    this.memoryCleanupThreshold = options.memoryCleanupThreshold || 0.8; // 80%
    this.circuitBreakerThreshold = options.circuitBreakerThreshold || 5;
    this.workerIdleTimeout = options.workerIdleTimeout || 300000; // 5 minutes
    
    // State management
    this.isInitialized = false;
    this.isShuttingDown = false;
    this.initPromise = null;
    this.circuitBreaker = {
      isOpen: false,
      failureCount: 0,
      lastFailureTime: 0,
      halfOpenTime: 60000 // 1 minute
    };
    
    // Event handling
    this.eventHandlers = new Map();
    this.abortController = new AbortController();
    
    // Bind methods for proper context
    this.handleWorkerMessage = this.handleWorkerMessage.bind(this);
    this.handleWorkerError = this.handleWorkerError.bind(this);
    
    // Start monitoring
    this.startHealthMonitoring();
    this.startMemoryMonitoring();
    
    console.log(`WorkerPoolManager initialized with ${this.maxWorkers} max workers`);
  }

  /**
   * Calculate optimal worker count based on system capabilities
   */
  calculateOptimalWorkerCount() {
    const cores = navigator.hardwareConcurrency || 4;
    const availableMemoryMB = this.estimateAvailableMemory();
    
    // Memory-based limit: each worker needs ~256MB
    const memoryBasedLimit = Math.floor(availableMemoryMB / 256);
    
    // Conservative CPU-based limit: use cores-1 but max 6 workers
    const cpuBasedLimit = Math.min(Math.max(1, cores - 1), 6);
    
    // Use the more restrictive limit
    const optimalCount = Math.min(cpuBasedLimit, memoryBasedLimit, 6);
    
    console.log(`Calculated optimal worker count: ${optimalCount} 
      (cores: ${cores}, cpu-limit: ${cpuBasedLimit}, memory-limit: ${memoryBasedLimit})`);
    
    return Math.max(2, optimalCount); // Minimum 2 workers
  }

  /**
   * Enhanced memory estimation with device detection
   */
  estimateAvailableMemory() {
    if ('memory' in performance) {
      const memory = performance.memory;
      const totalHeap = memory.totalJSHeapSize || 0;
      const usedHeap = memory.usedJSHeapSize;
      const heapLimit = memory.jsHeapSizeLimit || totalHeap * 2;
      
      // Calculate available memory with safety buffer
      const availableHeap = Math.max(0, heapLimit - usedHeap);
      const availableMB = (availableHeap / 1024 / 1024) * 0.6; // 60% safety margin
      
      return Math.max(512, availableMB); // Minimum 512MB assumption
    }
    
    // Device-based fallback estimates
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform?.toLowerCase() || '';
    
    if (userAgent.includes('mobile') || userAgent.includes('android') || 
        userAgent.includes('iphone') || userAgent.includes('ipad')) {
      return 1024; // Conservative mobile estimate
    }
    
    if (platform.includes('mac') || platform.includes('win') || platform.includes('linux')) {
      return 2048; // Desktop estimate
    }
    
    return 1024; // Default fallback
  }

  /**
   * Initialize the worker pool with enhanced error handling
   */
  async initialize() {
    if (this.isInitialized) return true;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  async doInitialize() {
    if (this.isShuttingDown) {
      throw new Error('Cannot initialize during shutdown');
    }

    console.log(`Initializing enhanced worker pool with ${this.maxWorkers} workers...`);
    
    try {
      // Initialize workers in batches to prevent overwhelming the system
      const batchSize = 2;
      let successfulWorkers = 0;
      const errors = [];

      for (let batch = 0; batch < Math.ceil(this.maxWorkers / batchSize); batch++) {
        const batchStart = batch * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, this.maxWorkers);
        
        const batchPromises = [];
        for (let i = batchStart; i < batchEnd; i++) {
          batchPromises.push(this.createWorker(i));
        }
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        // eslint-disable-next-line no-loop-func
        batchResults.forEach((result, index) => {
          const workerId = batchStart + index;
          if (result.status === 'fulfilled') {
            successfulWorkers++;
          } else {
            errors.push({ workerId, error: result.reason });
            console.error(`Worker ${workerId} initialization failed:`, result.reason);
          }
        });
        
        // Small delay between batches to prevent resource contention
        if (batch < Math.ceil(this.maxWorkers / batchSize) - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      if (successfulWorkers < this.minWorkers) {
        throw new Error(`Insufficient workers initialized: ${successfulWorkers}/${this.minWorkers} minimum required`);
      }
      
      this.isInitialized = true;
      
      const initResult = {
        totalWorkers: this.maxWorkers,
        successfulWorkers,
        failedWorkers: this.maxWorkers - successfulWorkers,
        errors: errors.length > 0 ? errors : undefined
      };
      
      console.log(`Worker pool initialized successfully:`, initResult);
      this.emit('initialized', initResult);
      
      return true;
      
    } catch (error) {
      console.error('Worker pool initialization failed:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Create a single worker with enhanced monitoring
   */
  async createWorker(workerId) {
    return new Promise((resolve, reject) => {
      if (this.isShuttingDown) {
        reject(new Error('Cannot create worker during shutdown'));
        return;
      }

      try {
        // Create the worker
        const worker = new Worker(`/workers/avif-encoder-worker.js?v=${Date.now()}`);
        
        // Create worker info structure
        const workerInfo = {
          id: workerId,
          worker,
          capabilities: null,
          fallbackMode: false,
          createdAt: Date.now(),
          lastUsed: Date.now(),
          lastHealthCheck: Date.now(),
          state: 'initializing',
          memoryUsage: 0,
          errorCount: 0,
          restartCount: 0
        };
        
        // Set up event handlers with proper cleanup
        const messageHandler = (event) => {
          this.handleWorkerMessage(workerId, event);
        };
        
        const errorHandler = (error) => {
          console.error(`Worker ${workerId} error:`, error);
          this.handleWorkerError(workerId, error);
        };
        
        worker.addEventListener('message', messageHandler);
        worker.addEventListener('error', errorHandler);
        
        // Store cleanup functions
        workerInfo.cleanup = () => {
          worker.removeEventListener('message', messageHandler);
          worker.removeEventListener('error', errorHandler);
        };
        
        // Initialization timeout with cleanup
        const initTimeout = setTimeout(() => {
          workerInfo.cleanup();
          worker.terminate();
          reject(new Error(`Worker ${workerId} initialization timeout`));
        }, 30000);
        
        // Wait for ready signal
        const readyHandler = (event) => {
          if (event.data.type === 'ready') {
            clearTimeout(initTimeout);
            worker.removeEventListener('message', readyHandler);
            
            // Update worker info
            workerInfo.capabilities = event.data.capabilities;
            workerInfo.fallbackMode = event.data.fallbackMode || false;
            workerInfo.state = 'idle';
            
            // Store worker
            this.workers.set(workerId, workerInfo);
            this.availableWorkers.add(workerId);
            
            // Initialize worker statistics
            this.workerStats.set(workerId, {
              tasksCompleted: 0,
              tasksErrored: 0,
              avgProcessingTime: 0,
              totalProcessingTime: 0,
              memoryUsage: 0,
              lastActivity: Date.now(),
              healthScore: 100
            });
            
            console.log(`Worker ${workerId} ready (fallback: ${workerInfo.fallbackMode})`);
            resolve(workerInfo);
          }
        };
        
        worker.addEventListener('message', readyHandler);
        
        // Send initialization message
        worker.postMessage({ type: 'init' });
        
      } catch (error) {
        console.error(`Failed to create worker ${workerId}:`, error);
        reject(error);
      }
    });
  }

  /**
   * Enhanced message handling with performance tracking
   */
  handleWorkerMessage(workerId, event) {
    const { type, id, ...data } = event.data;
    const workerInfo = this.workers.get(workerId);
    
    if (workerInfo) {
      workerInfo.lastUsed = Date.now();
      workerInfo.lastHealthCheck = Date.now();
    }
    
    switch (type) {
      case 'progress':
        this.handleTaskProgress(id, data.progress, data.message);
        break;
        
      case 'success':
        this.handleTaskSuccess(workerId, id, data.result);
        break;
        
      case 'error':
        this.handleTaskError(workerId, id, data.error, data.details);
        break;
        
      case 'ready':
        // Handled during initialization
        break;
        
      case 'memory-usage':
        this.updateWorkerMemoryUsage(workerId, data.usage);
        break;
        
      default:
        console.warn(`Unknown message type from worker ${workerId}:`, type);
    }
  }

  /**
   * Enhanced error handling with circuit breaker pattern
   */
  handleWorkerError(workerId, error) {
    console.error(`Worker ${workerId} error:`, error);
    
    const workerInfo = this.workers.get(workerId);
    if (workerInfo) {
      workerInfo.errorCount++;
      workerInfo.state = 'error';
    }
    
    // Update circuit breaker
    this.circuitBreaker.failureCount++;
    this.circuitBreaker.lastFailureTime = Date.now();
    
    if (this.circuitBreaker.failureCount >= this.circuitBreakerThreshold) {
      this.circuitBreaker.isOpen = true;
      console.warn('Circuit breaker opened due to excessive failures');
      this.emit('circuit-breaker-open', { failureCount: this.circuitBreaker.failureCount });
    }
    
    // Handle any active task on this worker
    const taskInfo = Array.from(this.busyWorkers.entries())
      .find(([wId, task]) => wId === workerId)?.[1];
    
    if (taskInfo) {
      this.handleTaskError(workerId, taskInfo.taskId, 'Worker error', { workerError: true });
    }
    
    // Mark worker as failed and restart
    this.markWorkerAsFailed(workerId);
    this.scheduleWorkerRestart(workerId);
  }

  /**
   * Enhanced task processing with priority queue and load balancing
   */
  async processTask(task, options = {}) {
    console.log('🎯 WorkerPoolManager.processTask called:', {
      hasTask: !!task,
      taskSize: task.imageData ? task.imageData.length : 'no imageData',
      format: task.outputFormat,
      isInitialized: this.isInitialized,
      circuitBreakerOpen: this.circuitBreaker.isOpen,
      activeWorkers: Array.from(this.workers.values()).filter(w => w.isReady).length,
      activeTasks: this.activeTasks.size
    });
    
    if (this.circuitBreaker.isOpen) {
      // Check if we can half-open the circuit breaker
      if (Date.now() - this.circuitBreaker.lastFailureTime > this.circuitBreaker.halfOpenTime) {
        this.circuitBreaker.isOpen = false;
        this.circuitBreaker.failureCount = 0;
        console.log('Circuit breaker half-opened, allowing limited requests');
      } else {
        throw new Error('Circuit breaker is open - too many recent failures');
      }
    }
    
    if (!this.isInitialized) {
      console.log('🔄 Worker pool not initialized, calling initialize...');
      await this.initialize();
    }
    
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const priority = options.priority || 'normal';
    
    console.log('🆔 Generated task ID:', taskId, 'with priority:', priority);
    
    return new Promise((resolve, reject) => {
      console.log('📝 Creating task promise for:', taskId);
      
      const taskInfo = {
        taskId,
        task,
        priority,
        resolve,
        reject,
        startTime: Date.now(),
        retryCount: 0,
        options,
        timeoutId: null,
        abortController: new AbortController()
      };
      
      console.log('⏱️ Setting up task timeout for:', taskId);
      // Set up task timeout
      taskInfo.timeoutId = setTimeout(() => {
        console.log('⏰ Task timeout triggered for:', taskId);
        this.cancelTask(taskId, 'timeout');
      }, this.taskTimeout);
      
      console.log('💾 Storing task in activeTasks:', taskId);
      // Store task
      this.activeTasks.set(taskId, taskInfo);
      this.globalStats.totalTasks++;
      
      console.log('🎯 Trying to assign task to worker:', taskId);
      // Try to assign immediately or queue
      if (!this.assignTaskToWorker(taskInfo)) {
        console.log('📋 No workers available, queueing task:', taskId);
        this.queueTask(taskInfo);
      } else {
        console.log('✅ Task assigned to worker:', taskId);
      }
    });
  }

  /**
   * Intelligent task assignment with load balancing
   */
  assignTaskToWorker(taskInfo) {
    console.log('🎯 assignTaskToWorker called for task:', taskInfo.taskId);
    console.log('📊 Worker pool state:', {
      availableWorkers: this.availableWorkers.size,
      busyWorkers: this.busyWorkers.size,
      totalWorkers: this.workers.size,
      availableWorkerIds: Array.from(this.availableWorkers),
      allWorkerStates: Array.from(this.workers.entries()).map(([id, info]) => ({
        id,
        state: info.state,
        isReady: info.isReady
      }))
    });
    
    if (this.availableWorkers.size === 0) {
      console.log('❌ No workers available');
      return false; // No workers available
    }
    
    // Find the best worker using load balancing algorithm
    console.log('🔍 Selecting best worker...');
    const bestWorkerId = this.selectBestWorker();
    console.log('✅ Selected worker:', bestWorkerId);
    
    // Fix: Check for null explicitly, not falsy (worker ID 0 is valid!)
    if (bestWorkerId === null || bestWorkerId === undefined) {
      console.log('❌ No best worker found');
      return false;
    }
    
    const workerInfo = this.workers.get(bestWorkerId);
    console.log('📋 Worker info for', bestWorkerId, ':', {
      exists: !!workerInfo,
      state: workerInfo?.state,
      isReady: workerInfo?.isReady
    });
    
    if (!workerInfo || workerInfo.state !== 'idle') {
      console.log('❌ Worker not available or not idle');
      return false;
    }
    
    console.log('🔄 Assigning task to worker', bestWorkerId);
    
    // Assign task to worker
    this.availableWorkers.delete(bestWorkerId);
    this.busyWorkers.set(bestWorkerId, {
      taskId: taskInfo.taskId,
      startTime: Date.now(),
      workerId: bestWorkerId
    });
    
    workerInfo.state = 'busy';
    workerInfo.lastUsed = Date.now();
    
    // Update peak usage
    this.globalStats.peakWorkerUsage = Math.max(
      this.globalStats.peakWorkerUsage,
      this.busyWorkers.size
    );
    
    try {
      // Send task to worker with transferable objects for better performance
      const transferList = taskInfo.task.transferList || [];
      
      console.log('📤 Sending task to worker:', { 
        workerId: bestWorkerId, 
        taskId: taskInfo.taskId, 
        format: taskInfo.task.outputFormat,
        hasImageData: !!taskInfo.task.imageData,
        imageDataSize: taskInfo.task.imageData ? taskInfo.task.imageData.byteLength || taskInfo.task.imageData.length : 'undefined'
      });
      
      workerInfo.worker.postMessage({
        type: 'convert',
        data: {
          id: taskInfo.taskId,
          imageData: taskInfo.task.imageData,
          outputFormat: taskInfo.task.outputFormat,
          options: taskInfo.task.options || {}
        }
      }, transferList);
      
      console.log('✅ Task sent to worker successfully');
      return true;
      
    } catch (error) {
      console.error(`Failed to send task to worker ${bestWorkerId}:`, error);
      this.handleTaskError(bestWorkerId, taskInfo.taskId, error.message, { sendError: true });
      return false;
    }
  }

  /**
   * Smart worker selection based on performance metrics
   */
  selectBestWorker() {
    console.log('🔍 selectBestWorker called');
    console.log('📋 Available workers:', Array.from(this.availableWorkers));
    
    if (this.availableWorkers.size === 0) {
      console.log('❌ No available workers');
      return null;
    }
    
    let bestWorker = null;
    let bestScore = -1;
    
    for (const workerId of this.availableWorkers) {
      console.log('🔍 Checking worker:', workerId);
      const workerInfo = this.workers.get(workerId);
      const workerStats = this.workerStats.get(workerId);
      
      console.log('📊 Worker info:', {
        workerId,
        workerInfo: !!workerInfo,
        workerStats: !!workerStats,
        state: workerInfo?.state,
        isReady: workerInfo?.isReady
      });
      
      if (!workerInfo || !workerStats || workerInfo.state !== 'idle') {
        console.log('❌ Worker', workerId, 'not suitable:', {
          hasWorkerInfo: !!workerInfo,
          hasWorkerStats: !!workerStats,
          state: workerInfo?.state
        });
        continue;
      }
      
      // Calculate worker score based on multiple factors
      const score = this.calculateWorkerScore(workerInfo, workerStats);
      console.log('📊 Worker', workerId, 'score:', score);
      
      if (score > bestScore) {
        bestScore = score;
        bestWorker = workerId;
        console.log('✅ New best worker:', workerId, 'with score:', score);
      }
    }
    
    console.log('🎯 Final best worker:', bestWorker, 'with score:', bestScore);
    return bestWorker;
  }

  /**
   * Calculate worker performance score
   */
  calculateWorkerScore(workerInfo, workerStats) {
    const now = Date.now();
    const idleTime = now - workerInfo.lastUsed;
    const errorRate = workerStats.tasksCompleted > 0 ? 
      workerStats.tasksErrored / (workerStats.tasksCompleted + workerStats.tasksErrored) : 0;
    
    // Factors contributing to score (higher is better)
    const healthScore = workerStats.healthScore || 100;
    const idleScore = Math.min(100, idleTime / 1000); // Prefer workers that have been idle longer
    const errorScore = Math.max(0, 100 - (errorRate * 200)); // Penalize high error rates
    const memoryScore = Math.max(0, 100 - (workerInfo.memoryUsage / this.maxMemoryPerWorker * 100));
    
    // Weighted average
    return (healthScore * 0.4) + (idleScore * 0.2) + (errorScore * 0.3) + (memoryScore * 0.1);
  }

  /**
   * Queue task with priority handling
   */
  queueTask(taskInfo) {
    const queue = this.taskQueue[taskInfo.priority] || this.taskQueue.normal;
    queue.push(taskInfo);
    
    this.emit('task-queued', {
      taskId: taskInfo.taskId,
      priority: taskInfo.priority,
      queueLength: this.getTotalQueueLength()
    });
  }

  /**
   * Process next queued task with priority handling
   */
  processNextQueuedTask() {
    if (this.availableWorkers.size === 0) {
      return false;
    }
    
    // Process in priority order: high -> normal -> low
    const priorities = ['high', 'normal', 'low'];
    
    for (const priority of priorities) {
      const queue = this.taskQueue[priority];
      if (queue.length > 0) {
        const taskInfo = queue.shift();
        if (this.assignTaskToWorker(taskInfo)) {
          return true;
        } else {
          // Re-queue if assignment failed
          queue.unshift(taskInfo);
        }
      }
    }
    
    return false;
  }

  /**
   * Enhanced task success handling with performance tracking
   */
  handleTaskSuccess(workerId, taskId, result) {
    const taskInfo = this.activeTasks.get(taskId);
    // const workerInfo = this.workers.get(workerId); // Unused - kept for future use
    const workerStats = this.workerStats.get(workerId);
    
    if (!taskInfo) {
      console.warn(`Task ${taskId} not found in active tasks`);
      return;
    }
    
    // Clear timeout
    if (taskInfo.timeoutId) {
      clearTimeout(taskInfo.timeoutId);
    }
    
    // Calculate processing time
    const processingTime = Date.now() - taskInfo.startTime;
    
    // Update worker statistics
    if (workerStats) {
      workerStats.tasksCompleted++;
      workerStats.totalProcessingTime += processingTime;
      workerStats.avgProcessingTime = workerStats.totalProcessingTime / workerStats.tasksCompleted;
      workerStats.lastActivity = Date.now();
      
      // Improve health score for successful tasks
      workerStats.healthScore = Math.min(100, workerStats.healthScore + 1);
    }
    
    // Update global statistics
    this.globalStats.completedTasks++;
    this.globalStats.avgProcessingTime = 
      (this.globalStats.avgProcessingTime * (this.globalStats.completedTasks - 1) + processingTime) 
      / this.globalStats.completedTasks;
    
    // Reset circuit breaker on success
    if (this.circuitBreaker.failureCount > 0) {
      this.circuitBreaker.failureCount = Math.max(0, this.circuitBreaker.failureCount - 0.5);
    }
    
    // Store result for recent history
    this.completedTasks.set(taskId, {
      result,
      processingTime,
      workerId,
      completedAt: Date.now()
    });
    
    // Clean up old completed tasks (keep last 100)
    if (this.completedTasks.size > 100) {
      const oldestKey = this.completedTasks.keys().next().value;
      this.completedTasks.delete(oldestKey);
    }
    
    // Resolve the task
    taskInfo.resolve({
      ...result,
      processingTime,
      workerId,
      taskId
    });
    
    // Clean up task
    this.cleanupTask(taskId, workerId);
    
    // Process next queued task
    this.processNextQueuedTask();
    
    this.emit('task-completed', {
      taskId,
      workerId,
      processingTime,
      queueLength: this.getTotalQueueLength()
    });
  }

  /**
   * Handle task progress updates
   */
  handleTaskProgress(taskId, progress, message) {
    const taskInfo = this.activeTasks.get(taskId);
    
    if (!taskInfo) {
      console.warn(`Task ${taskId} not found for progress update`);
      return;
    }
    
    // Update task progress
    taskInfo.progress = progress;
    taskInfo.lastUpdate = Date.now();
    
    // Call progress callback if provided
    if (taskInfo.onProgress) {
      try {
        taskInfo.onProgress(progress, message);
      } catch (error) {
        console.error('Error in progress callback:', error);
      }
    }
    
    // Emit progress event
    this.emit('task-progress', {
      taskId,
      progress,
      message,
      elapsed: Date.now() - taskInfo.startTime
    });
  }

  /**
   * Enhanced error handling with retry logic and fallback strategies
   */
  handleTaskError(workerId, taskId, error, details = {}) {
    const taskInfo = this.activeTasks.get(taskId);
    const workerStats = this.workerStats.get(workerId);
    
    if (!taskInfo) {
      console.warn(`Task ${taskId} not found in active tasks during error handling`);
      return;
    }
    
    // Clear timeout
    if (taskInfo.timeoutId) {
      clearTimeout(taskInfo.timeoutId);
    }
    
    // Update statistics
    if (workerStats) {
      workerStats.tasksErrored++;
      workerStats.healthScore = Math.max(0, workerStats.healthScore - 10);
    }
    
    this.globalStats.failedTasks++;
    
    // Determine if we should retry
    const shouldRetry = this.shouldRetryTask(taskInfo, error, details);
    
    if (shouldRetry) {
      console.log(`Retrying task ${taskId} (attempt ${taskInfo.retryCount + 1}/${this.maxRetries})`);
      
      taskInfo.retryCount++;
      taskInfo.startTime = Date.now(); // Reset start time for retry
      
      // Use exponential backoff for retries
      const retryDelay = Math.min(30000, 1000 * Math.pow(2, taskInfo.retryCount - 1));
      
      setTimeout(() => {
        if (!this.assignTaskToWorker(taskInfo)) {
          this.queueTask(taskInfo);
        }
      }, retryDelay);
      
    } else {
      // Max retries reached or non-retryable error
      const errorMessage = `Task failed after ${taskInfo.retryCount} retries: ${error}`;
      taskInfo.reject(new Error(errorMessage));
      
      this.emit('task-failed', {
        taskId,
        workerId,
        error: errorMessage,
        retryCount: taskInfo.retryCount,
        details
      });
      
      // Clean up task
      this.activeTasks.delete(taskId);
    }
    
    // Clean up worker assignment
    this.cleanupTask(taskId, workerId);
    
    // Process next queued task
    this.processNextQueuedTask();
  }

  /**
   * Determine if a task should be retried
   */
  shouldRetryTask(taskInfo, error, details) {
    // Don't retry if already at max retries
    if (taskInfo.retryCount >= this.maxRetries) {
      return false;
    }
    
    // Don't retry fatal errors
    if (details.fatal) {
      return false;
    }
    
    // Don't retry if task was explicitly cancelled
    if (taskInfo.abortController.signal.aborted) {
      return false;
    }
    
    // Don't retry certain error types
    const nonRetryableErrors = [
      'invalid input',
      'unsupported format',
      'file too large',
      'out of memory'
    ];
    
    const errorLower = error.toLowerCase();
    if (nonRetryableErrors.some(pattern => errorLower.includes(pattern))) {
      return false;
    }
    
    return true;
  }

  /**
   * Clean up task and worker assignment
   */
  cleanupTask(taskId, workerId) {
    // Remove from active tasks
    this.activeTasks.delete(taskId);
    
    // Remove from busy workers
    this.busyWorkers.delete(workerId);
    
    // Return worker to available pool
    const workerInfo = this.workers.get(workerId);
    if (workerInfo && workerInfo.state === 'busy') {
      workerInfo.state = 'idle';
      this.availableWorkers.add(workerId);
    }
  }

  /**
   * Cancel a specific task
   */
  cancelTask(taskId, reason = 'cancelled') {
    const taskInfo = this.activeTasks.get(taskId);
    if (!taskInfo) {
      return false;
    }
    
    // Signal cancellation
    taskInfo.abortController.abort();
    
    // Clear timeout
    if (taskInfo.timeoutId) {
      clearTimeout(taskInfo.timeoutId);
    }
    
    // Reject the task
    taskInfo.reject(new Error(`Task ${reason}: ${taskId}`));
    
    // Find and clean up worker assignment
    for (const [workerId, busyInfo] of this.busyWorkers) {
      if (busyInfo.taskId === taskId) {
        this.cleanupTask(taskId, workerId);
        break;
      }
    }
    
    this.emit('task-cancelled', { taskId, reason });
    return true;
  }

  /**
   * Cancel all queued and active tasks
   */
  cancelAllTasks() {
    const cancelledTasks = [];
    
    // Cancel queued tasks
    Object.values(this.taskQueue).forEach(queue => {
      while (queue.length > 0) {
        const taskInfo = queue.shift();
        taskInfo.reject(new Error('Task cancelled: system shutdown'));
        cancelledTasks.push(taskInfo.taskId);
      }
    });
    
    // Cancel active tasks
    for (const [taskId] of this.activeTasks) {
      if (this.cancelTask(taskId, 'system shutdown')) {
        cancelledTasks.push(taskId);
      }
    }
    
    console.log(`Cancelled ${cancelledTasks.length} tasks`);
    return cancelledTasks;
  }

  /**
   * Mark worker as failed and remove from active pool
   */
  markWorkerAsFailed(workerId) {
    const workerInfo = this.workers.get(workerId);
    if (!workerInfo) {
      return;
    }
    
    console.log(`Marking worker ${workerId} as failed`);
    
    // Update worker state
    workerInfo.state = 'failed';
    workerInfo.errorCount++;
    
    // Remove from available workers
    this.availableWorkers.delete(workerId);
    
    // Handle any active task
    const busyInfo = this.busyWorkers.get(workerId);
    if (busyInfo) {
      this.handleTaskError(workerId, busyInfo.taskId, 'Worker marked as failed', { workerFailure: true });
    }
    
    // Clean up event listeners
    if (workerInfo.cleanup) {
      workerInfo.cleanup();
    }
    
    // Terminate worker
    try {
      workerInfo.worker.terminate();
    } catch (error) {
      console.error(`Error terminating worker ${workerId}:`, error);
    }
    
    // Remove from workers map
    this.workers.delete(workerId);
    this.workerStats.delete(workerId);
    
    this.emit('worker-failed', { workerId, totalWorkers: this.workers.size });
  }

  /**
   * Schedule worker restart with exponential backoff
   */
  scheduleWorkerRestart(workerId) {
    if (this.isShuttingDown) {
      return;
    }
    
    const workerInfo = this.workers.get(workerId);
    const restartCount = workerInfo ? workerInfo.restartCount : 0;
    
    // Calculate restart delay with exponential backoff (max 30 seconds)
    const delay = Math.min(30000, 1000 * Math.pow(2, restartCount));
    
    console.log(`Scheduling restart for worker ${workerId} in ${delay}ms (restart #${restartCount + 1})`);
    
    setTimeout(async () => {
      if (this.isShuttingDown || this.workers.size >= this.maxWorkers) {
        return;
      }
      
      try {
        const newWorkerInfo = await this.createWorker(workerId);
        newWorkerInfo.restartCount = restartCount + 1;
        this.globalStats.restartCount++;
        
        console.log(`Worker ${workerId} restarted successfully`);
        this.emit('worker-restarted', { workerId, restartCount: newWorkerInfo.restartCount });
        
        // Process any queued tasks
        this.processNextQueuedTask();
        
      } catch (error) {
        console.error(`Failed to restart worker ${workerId}:`, error);
        
        // If we can't restart and we're below minimum workers, try again later
        if (this.workers.size < this.minWorkers) {
          this.scheduleWorkerRestart(workerId);
        }
      }
    }, delay);
  }

  /**
   * Start comprehensive health monitoring
   */
  startHealthMonitoring() {
    if (this.healthMonitorInterval) {
      return; // Already started
    }
    
    this.healthMonitorInterval = setInterval(() => {
      if (!this.isShuttingDown) {
        this.performHealthCheck();
      }
    }, this.healthCheckInterval);
    
    console.log('Health monitoring started');
  }

  /**
   * Comprehensive health check for all workers
   */
  performHealthCheck() {
    const now = Date.now();
    const stuckWorkers = [];
    const idleWorkers = [];
    
    // Check busy workers for stuck tasks
    for (const [workerId, busyInfo] of this.busyWorkers) {
      const taskDuration = now - busyInfo.startTime;
      
      if (taskDuration > this.taskTimeout * 1.2) {
        stuckWorkers.push(workerId);
        console.warn(`Worker ${workerId} appears stuck (task duration: ${taskDuration}ms)`);
      }
    }
    
    // Check for workers that have been idle too long
    for (const [workerId, workerInfo] of this.workers) {
      const idleTime = now - workerInfo.lastUsed;
      
      if (workerInfo.state === 'idle' && idleTime > this.workerIdleTimeout) {
        idleWorkers.push(workerId);
      }
    }
    
    // Handle stuck workers
    stuckWorkers.forEach(workerId => {
      const busyInfo = this.busyWorkers.get(workerId);
      if (busyInfo) {
        this.handleTaskError(workerId, busyInfo.taskId, 'Health check timeout', { healthCheckTimeout: true });
        this.markWorkerAsFailed(workerId);
        this.scheduleWorkerRestart(workerId);
      }
    });
    
    // Optionally restart some idle workers to prevent memory leaks
    if (idleWorkers.length > 0 && Math.random() < 0.1) { // 10% chance
      const workerToRestart = idleWorkers[Math.floor(Math.random() * idleWorkers.length)];
      console.log(`Proactively restarting idle worker ${workerToRestart} for memory cleanup`);
      this.markWorkerAsFailed(workerToRestart);
      this.scheduleWorkerRestart(workerToRestart);
    }
    
    // Update memory usage
    this.updateMemoryUsage();
    
    // Emit health status
    this.emit('health-check', {
      totalWorkers: this.workers.size,
      availableWorkers: this.availableWorkers.size,
      busyWorkers: this.busyWorkers.size,
      queuedTasks: this.getTotalQueueLength(),
      stuckWorkers: stuckWorkers.length,
      memoryUsage: this.globalStats.memoryUsage
    });
  }

  /**
   * Start memory monitoring
   */
  startMemoryMonitoring() {
    if (this.memoryMonitorInterval) {
      return;
    }
    
    this.memoryMonitorInterval = setInterval(() => {
      if (!this.isShuttingDown) {
        this.performMemoryCleanup();
      }
    }, 60000); // Every minute
    
    console.log('Memory monitoring started');
  }

  /**
   * Perform memory cleanup and optimization
   */
  performMemoryCleanup() {
    if ('memory' in performance) {
      const memory = performance.memory;
      const usedHeap = memory.usedJSHeapSize;
      const totalHeap = memory.totalJSHeapSize;
      const heapLimit = memory.jsHeapSizeLimit;
      
      this.globalStats.memoryUsage = usedHeap;
      
      const memoryPressure = usedHeap / heapLimit;
      
      if (memoryPressure > this.memoryCleanupThreshold) {
        console.warn(`High memory pressure detected: ${(memoryPressure * 100).toFixed(1)}%`);
        
        // Clean up completed tasks history
        this.completedTasks.clear();
        
        // Force garbage collection if available
        if (window.gc) {
          window.gc();
        }
        
        // Consider restarting some workers if memory pressure is very high
        if (memoryPressure > 0.9 && this.workers.size > this.minWorkers) {
          const oldestWorker = this.findOldestWorker();
          if (oldestWorker) {
            console.log(`Restarting worker ${oldestWorker} due to memory pressure`);
            this.markWorkerAsFailed(oldestWorker);
            this.scheduleWorkerRestart(oldestWorker);
          }
        }
        
        this.emit('memory-pressure', {
          memoryPressure,
          usedHeap,
          totalHeap,
          heapLimit
        });
      }
    }
  }

  /**
   * Find the oldest worker for potential restart
   */
  findOldestWorker() {
    let oldestWorker = null;
    let oldestTime = Date.now();
    
    for (const [workerId, workerInfo] of this.workers) {
      if (workerInfo.state === 'idle' && workerInfo.createdAt < oldestTime) {
        oldestTime = workerInfo.createdAt;
        oldestWorker = workerId;
      }
    }
    
    return oldestWorker;
  }

  /**
   * Update memory usage for a specific worker
   */
  updateWorkerMemoryUsage(workerId, usage) {
    const workerInfo = this.workers.get(workerId);
    const workerStats = this.workerStats.get(workerId);
    
    if (workerInfo) {
      workerInfo.memoryUsage = usage;
    }
    
    if (workerStats) {
      workerStats.memoryUsage = usage;
    }
  }

  /**
   * Update global memory usage statistics
   */
  updateMemoryUsage() {
    if (typeof performance !== 'undefined' && performance.memory) {
      const memInfo = performance.memory;
      this.globalStats.memoryUsage = memInfo.usedJSHeapSize;
      
      // Calculate total worker memory usage
      let totalWorkerMemory = 0;
      // eslint-disable-next-line no-unused-vars
      for (const [workerId, workerInfo] of this.workers) {
        totalWorkerMemory += workerInfo.memoryUsage || 0;
      }
      
      // Check for memory pressure
      const totalMemory = this.globalStats.memoryUsage + totalWorkerMemory;
      const memoryLimit = memInfo.jsHeapSizeLimit;
      
      if (memoryLimit && totalMemory > memoryLimit * 0.8) {
        console.warn('WorkerPool: High memory pressure detected', {
          usage: totalMemory,
          limit: memoryLimit,
          percentage: (totalMemory / memoryLimit * 100).toFixed(2) + '%'
        });
      }
    }
  }

  /**
   * Get total queue length across all priorities
   */
  getTotalQueueLength() {
    return Object.values(this.taskQueue).reduce((total, queue) => total + queue.length, 0);
  }

  /**
   * Get comprehensive pool statistics
   */
  getStats() {
    const queueStats = {
      high: this.taskQueue.high.length,
      normal: this.taskQueue.normal.length,
      low: this.taskQueue.low.length,
      total: this.getTotalQueueLength()
    };
    
    const workerBreakdown = {
      idle: 0,
      busy: 0,
      failed: 0,
      initializing: 0
    };
    
    for (const workerInfo of this.workers.values()) {
      workerBreakdown[workerInfo.state] = (workerBreakdown[workerInfo.state] || 0) + 1;
    }
    
    return {
      ...this.globalStats,
      uptime: Date.now() - this.globalStats.uptime,
      workers: {
        total: this.workers.size,
        maxWorkers: this.maxWorkers,
        minWorkers: this.minWorkers,
        available: this.availableWorkers.size,
        busy: this.busyWorkers.size,
        breakdown: workerBreakdown
      },
      queue: queueStats,
      activeTasks: this.activeTasks.size,
      circuitBreaker: {
        isOpen: this.circuitBreaker.isOpen,
        failureCount: this.circuitBreaker.failureCount
      },
      workerStats: Object.fromEntries(this.workerStats),
      performance: {
        tasksPerSecond: this.globalStats.completedTasks / ((Date.now() - this.globalStats.uptime) / 1000),
        successRate: this.globalStats.totalTasks > 0 ? 
          (this.globalStats.completedTasks / this.globalStats.totalTasks) * 100 : 0,
        avgQueueWaitTime: this.calculateAvgQueueWaitTime()
      }
    };
  }

  /**
   * Calculate average queue wait time (estimation)
   */
  calculateAvgQueueWaitTime() {
    if (this.availableWorkers.size > 0 || this.getTotalQueueLength() === 0) {
      return 0; // No wait time if workers available or no queue
    }
    
    const avgProcessingTime = this.globalStats.avgProcessingTime || 30000; // 30s default
    const totalQueuedTasks = this.getTotalQueueLength();
    const totalWorkers = this.workers.size;
    
    return totalWorkers > 0 ? (totalQueuedTasks * avgProcessingTime) / totalWorkers : 0;
  }

  /**
   * Enhanced batch processing with parallel execution
   */
  async processBatch(tasks, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (!Array.isArray(tasks) || tasks.length === 0) {
      throw new Error('Invalid tasks array provided');
    }
    
    const batchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const batchOptions = {
      maxConcurrency: Math.min(options.maxConcurrency || this.workers.size, tasks.length),
      priority: options.priority || 'normal',
      onProgress: options.onProgress,
      onTaskComplete: options.onTaskComplete,
      onTaskError: options.onTaskError,
      abortOnFirstError: options.abortOnFirstError || false,
      ...options
    };
    
    console.log(`Starting batch ${batchId} with ${tasks.length} tasks (concurrency: ${batchOptions.maxConcurrency})`);
    
    const startTime = Date.now();
    const results = [];
    const errors = [];
    const abortController = new AbortController();
    
    try {
      await new Promise((resolve, reject) => {
        let completedTasks = 0;
        let activeTasks = 0;
        let taskIndex = 0;
        let hasError = false;
        
        const processNextTask = async () => {
          // Check if we should stop processing
          if (taskIndex >= tasks.length || (hasError && batchOptions.abortOnFirstError)) {
            if (activeTasks === 0) {
              resolve();
            }
            return;
          }
          
          if (abortController.signal.aborted) {
            if (activeTasks === 0) {
              reject(new Error('Batch processing aborted'));
            }
            return;
          }
          
          const task = tasks[taskIndex++];
          activeTasks++;
          
          try {
            const taskPromise = this.processTask(task, {
              priority: batchOptions.priority,
              onProgress: (progress, message) => {
                if (batchOptions.onProgress) {
                  const overallProgress = ((completedTasks + (progress / 100)) / tasks.length) * 100;
                  batchOptions.onProgress(overallProgress, message, completedTasks, tasks.length);
                }
              }
            });
            
            const result = await taskPromise;
            results.push({ task, result, success: true });
            
            if (batchOptions.onTaskComplete) {
              batchOptions.onTaskComplete(task, result);
            }
            
          } catch (error) {
            hasError = true;
            const errorInfo = { task, error: error.message, success: false };
            errors.push(errorInfo);
            
            console.error(`Task failed in batch ${batchId}:`, error);
            
            if (batchOptions.onTaskError) {
              batchOptions.onTaskError(task, error);
            }
            
            if (batchOptions.abortOnFirstError) {
              abortController.abort();
            }
          } finally {
            activeTasks--;
            completedTasks++;
            
            // Continue processing if not aborted
            if (!abortController.signal.aborted) {
              setImmediate(processNextTask);
            } else if (activeTasks === 0) {
              reject(new Error('Batch processing aborted due to error'));
            }
          }
        };
        
        // Start processing with controlled concurrency
        const concurrency = Math.min(batchOptions.maxConcurrency, tasks.length);
        for (let i = 0; i < concurrency; i++) {
          setImmediate(processNextTask);
        }
      });
      
      const batchResult = {
        batchId,
        results,
        errors,
        successCount: results.length,
        errorCount: errors.length,
        totalCount: tasks.length,
        processingTime: Date.now() - startTime,
        avgTaskTime: results.length > 0 ? 
          results.reduce((sum, r) => sum + (r.result.processingTime || 0), 0) / results.length : 0
      };
      
      console.log(`Batch ${batchId} completed:`, {
        success: batchResult.successCount,
        errors: batchResult.errorCount,
        time: batchResult.processingTime
      });
      
      this.emit('batch-completed', batchResult);
      return batchResult;
      
    } catch (error) {
      console.error(`Batch ${batchId} failed:`, error);
      
      const batchResult = {
        batchId,
        results,
        errors,
        successCount: results.length,
        errorCount: errors.length,
        totalCount: tasks.length,
        processingTime: Date.now() - startTime,
        error: error.message
      };
      
      this.emit('batch-failed', batchResult);
      throw error;
    }
  }

  /**
   * Event handling methods
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Graceful shutdown with proper cleanup
   */
  async shutdown(options = {}) {
    if (this.isShuttingDown) {
      return;
    }
    
    console.log('Initiating worker pool shutdown...');
    this.isShuttingDown = true;
    this.emit('shutdown-started');
    
    const timeout = options.timeout || 30000; // 30 second timeout
    const force = options.force || false;
    
    try {
      // Stop monitoring
      if (this.healthMonitorInterval) {
        clearInterval(this.healthMonitorInterval);
        this.healthMonitorInterval = null;
      }
      
      if (this.memoryMonitorInterval) {
        clearInterval(this.memoryMonitorInterval);
        this.memoryMonitorInterval = null;
      }
      
      if (!force) {
        // Graceful shutdown: wait for active tasks to complete
        console.log(`Waiting for ${this.activeTasks.size} active tasks to complete...`);
        
        const shutdownPromise = new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (this.activeTasks.size === 0) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 100);
        });
        
        await Promise.race([
          shutdownPromise,
          new Promise((_, reject) => setTimeout(() => 
            reject(new Error('Shutdown timeout')), timeout))
        ]);
      } else {
        // Force shutdown: cancel all tasks
        this.cancelAllTasks();
      }
      
      // Terminate all workers
      console.log(`Terminating ${this.workers.size} workers...`);
      
      const terminationPromises = [];
      for (const [workerId, workerInfo] of this.workers) {
        terminationPromises.push(new Promise((resolve) => {
          try {
            if (workerInfo.cleanup) {
              workerInfo.cleanup();
            }
            workerInfo.worker.terminate();
            resolve();
          } catch (error) {
            console.error(`Error terminating worker ${workerId}:`, error);
            resolve(); // Continue with other workers
          }
        }));
      }
      
      await Promise.allSettled(terminationPromises);
      
      // Clean up data structures
      this.workers.clear();
      this.availableWorkers.clear();
      this.busyWorkers.clear();
      this.activeTasks.clear();
      this.completedTasks.clear();
      this.workerStats.clear();
      
      Object.values(this.taskQueue).forEach(queue => queue.length = 0);
      
      // Signal abort to any remaining operations
      this.abortController.abort();
      
      this.isInitialized = false;
      
      console.log('Worker pool shutdown completed successfully');
      this.emit('shutdown-completed');
      
    } catch (error) {
      console.error('Error during worker pool shutdown:', error);
      this.emit('shutdown-error', error);
      throw error;
    }
  }

}

export default WorkerPoolManager;