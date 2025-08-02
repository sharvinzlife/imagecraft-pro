import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Loader2, 
  Play, 
  Pause, 
  Square,
  RotateCcw,
  Archive,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
// Import the real image processing hooks
import { useNotifications } from '../store/appStore';
import { useImageProcessing } from '../hooks/useOptimizedImageProcessing';
import BatchProgressDisplay from './BatchProgressDisplay';
import BatchDownloadPanel from './BatchDownloadPanel';
// SECURITY: Import security validation utilities
import { validateImageFile, getRateLimitStatus } from '../utils/securityValidation';

// Simple file upload utility for batch processing
const useFileUpload = () => ({
  uploading: false,
  progress: 0,
  error: null,
  reset: () => {},
  apiMode: 'offline',
  uploadFile: (file) => Promise.resolve({ 
    id: `file-${Date.now()}-${Math.random()}`,
    file, 
    name: file.name, 
    url: URL.createObjectURL(file),
    size: file.size,
    type: file.type
  })
});

const BatchUploadZone = ({ 
  title = 'Batch Upload Images', 
  subtitle = 'Upload multiple images for processing together', 
  onBatchComplete,
  onFileProcessed,
  className = '', 
  id = 'batch-upload-zone',
  maxFiles = 20,
  processingType = null // 'convert', 'edit', 'ai-style'
}) => {
  // States for batch upload
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadQueue, setUploadQueue] = useState([]); // {file, status, progress, error, result}
  const [processingQueue, setProcessingQueue] = useState([]); // {fileId, type, params, status, progress, result}
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentOperation, setCurrentOperation] = useState('idle'); // 'uploading', 'processing', 'idle'
  const [completedItems, setCompletedItems] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // Status tracking
  const [uploadStatus, setUploadStatus] = useState('');
  const [batchStats, setBatchStats] = useState({
    total: 0,
    uploaded: 0,
    processed: 0,
    failed: 0,
    skipped: 0
  });

  // SECURITY: Security monitoring states
  const [securityStatus, setSecurityStatus] = useState({
    threatsBlocked: 0,
    rateLimitActive: false,
    lastThreatTime: null
  });
  const [rateLimitInfo, setRateLimitInfo] = useState(null);

  // Hooks
  const { uploadFile, reset, apiMode } = useFileUpload();
  const { batchConvert } = useImageProcessing();
  const { addNotification } = useNotifications();

  // Refs
  const abortControllerRef = useRef(null);
  const currentIndexRef = useRef(0);

  // Generate unique IDs for accessibility
  const batchZoneId = `${id}-batch-zone`;
  const statusId = `${id}-batch-status`;
  const instructionsId = `${id}-instructions`;
  const helpId = `${id}-help`;
  // Queue management handled by the queueManager

  // SECURITY: Enhanced file validation with comprehensive security checks
  const validateFile = useCallback(async (file) => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    
    // Basic validation first
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 50MB' };
    }
    
    if (!validTypes.includes(file.type)) {
      return { valid: false, error: 'Please select a valid image file (JPEG, PNG, WebP, GIF, or SVG)' };
    }
    
    // SECURITY: Comprehensive security validation
    try {
      const validationResult = await validateImageFile(file);
      
      if (!validationResult.valid) {
        // Security threat detected
        setSecurityStatus(prev => ({
          ...prev,
          threatsBlocked: prev.threatsBlocked + 1,
          lastThreatTime: Date.now()
        }));
        
        return { 
          valid: false, 
          error: `Security validation failed: ${validationResult.errors.join('; ')}`,
          securityThreat: true
        };
      }
      
      // File passed security validation
      return { 
        valid: true, 
        sanitizedFile: validationResult.file,
        warnings: validationResult.warnings
      };
      
    } catch (error) {
      console.error('Security validation error:', error);
      return { 
        valid: false, 
        error: `Security validation failed: ${error.message}`,
        securityThreat: true
      };
    }
  }, []);

  // Handle file selection for batch upload
  const handleFileSelect = useCallback(async (files) => {
    const fileList = Array.from(files);
    
    // SECURITY: Check rate limits before processing files
    const rateLimitStatus = getRateLimitStatus();
    setRateLimitInfo(rateLimitStatus);
    
    if (rateLimitStatus.blockedUntil) {
      const remainingTime = Math.ceil((rateLimitStatus.blockedUntil - Date.now()) / 1000);
      addNotification({
        type: 'error',
        title: 'Rate Limit Active',
        message: `Upload temporarily blocked. Please wait ${remainingTime} seconds before trying again.`,
      });
      return;
    }
    
    // Check file limit
    if (fileList.length > maxFiles) {
      addNotification({
        type: 'warning',
        title: 'Too Many Files',
        message: `Please select no more than ${maxFiles} files at once.`,
      });
      return;
    }

    const validFiles = [];
    const errors = [];
    const securityThreats = [];

    // SECURITY: Validate each file with comprehensive security checks
    for (let index = 0; index < fileList.length; index++) {
      const file = fileList[index];
      
      try {
        const validation = await validateFile(file);
        
        if (validation.valid) {
          validFiles.push({
            id: `file-${Date.now()}-${index}`,
            file: validation.sanitizedFile || file,
            originalFile: file,
            status: 'pending',
            progress: 0,
            error: null,
            result: null,
            securityWarnings: validation.warnings || []
          });
        } else {
          if (validation.securityThreat) {
            securityThreats.push(`${file.name}: ${validation.error}`);
          } else {
            errors.push(`${file.name}: ${validation.error}`);
          }
        }
      } catch (error) {
        console.error(`Validation error for ${file.name}:`, error);
        errors.push(`${file.name}: Validation failed - ${error.message}`);
      }
    }

    // SECURITY: Show security threats with high priority
    if (securityThreats.length > 0) {
      addNotification({
        type: 'error',
        title: 'Security Threats Blocked',
        message: `${securityThreats.length} potentially malicious files were blocked. ${securityThreats.slice(0, 2).join('. ')}${securityThreats.length > 2 ? '...' : ''}`,
      });
      
      // Update security status
      setSecurityStatus(prev => ({
        ...prev,
        threatsBlocked: prev.threatsBlocked + securityThreats.length,
        lastThreatTime: Date.now()
      }));
    }

    // Show validation errors
    if (errors.length > 0) {
      addNotification({
        type: 'warning',
        title: 'File Validation Errors',
        message: `${errors.length} files were rejected. ${errors.slice(0, 3).join('. ')}${errors.length > 3 ? '...' : ''}`,
      });
    }

    if (validFiles.length === 0) {
      if (securityThreats.length > 0) {
        addNotification({
          type: 'info',
          title: 'All Files Blocked',
          message: 'All selected files were blocked due to security concerns. Please try uploading different files.',
        });
      }
      return;
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setUploadQueue(prev => [...prev, ...validFiles]);
    setBatchStats(prev => ({ ...prev, total: prev.total + validFiles.length }));

    setUploadStatus(`${validFiles.length} files added to batch (${validFiles.length} total)`);
    
    addNotification({
      type: 'success',
      title: 'Files Added',
      message: `${validFiles.length} files added to batch upload queue.`,
    });
  }, [validateFile, maxFiles, addNotification]);

  // Start batch upload process
  const startBatchUpload = useCallback(async () => {
    if (uploadQueue.length === 0) return;

    setCurrentOperation('uploading');
    setIsProcessing(true);
    setIsPaused(false);
    abortControllerRef.current = new AbortController();
    currentIndexRef.current = 0;

    const pendingFiles = uploadQueue.filter(item => item.status === 'pending');
    
    for (let i = 0; i < pendingFiles.length && !abortControllerRef.current?.signal.aborted; i++) {
      if (isPaused) {
        await new Promise(resolve => {
          const checkPause = () => {
            if (!isPaused || abortControllerRef.current?.signal.aborted) {
              resolve();
            } else {
              setTimeout(checkPause, 100);
            }
          };
          checkPause();
        });
      }

      const fileItem = pendingFiles[i];
      currentIndexRef.current = i;
      
      try {
        // Update status to uploading
        setUploadQueue(prev => prev.map(item => 
          item.id === fileItem.id 
            ? { ...item, status: 'uploading', progress: 0 }
            : item
        ));

        setUploadStatus(`Uploading ${fileItem.file.name} (${i + 1}/${pendingFiles.length})`);

        // Upload file with progress tracking
        const result = await uploadFile(fileItem.file);

        // Update with success
        setUploadQueue(prev => prev.map(item => 
          item.id === fileItem.id 
            ? { ...item, status: 'completed', progress: 100, result }
            : item
        ));

        setBatchStats(prev => ({ ...prev, uploaded: prev.uploaded + 1 }));

        // Add to processing queue if processing type is specified
        if (processingType && result) {
          setProcessingQueue(prev => [...prev, {
            id: `process-${result.id}-${Date.now()}`,
            fileId: result.id,
            fileName: fileItem.file.name,
            type: processingType,
            params: {},
            status: 'pending',
            progress: 0,
            result: null
          }]);
        }

      } catch (uploadError) {
        // Update with error
        setUploadQueue(prev => prev.map(item => 
          item.id === fileItem.id 
            ? { ...item, status: 'failed', error: uploadError.message }
            : item
        ));

        setBatchStats(prev => ({ ...prev, failed: prev.failed + 1 }));
        
        console.error(`Upload failed for ${fileItem.file.name}:`, uploadError);
      }
    }

    setCurrentOperation('idle');
    
    if (!abortControllerRef.current?.signal.aborted) {
      const uploadedCount = uploadQueue.filter(item => item.status === 'completed').length;
      
      addNotification({
        type: 'success',
        title: 'Batch Upload Complete',
        message: `${uploadedCount} files uploaded successfully.`,
      });

      // Auto-start processing if type is specified
      if (processingType) {
        setTimeout(() => startBatchProcessing('jpeg', 'medium'), 1000);
      }
    }
  }, [uploadQueue, uploadFile, processingType, processingQueue.length, isPaused, addNotification]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start batch processing
  const startBatchProcessing = useCallback(async (outputFormat = 'jpeg', quality = 'medium') => {
    const uploadedFiles = uploadQueue.filter(item => item.status === 'completed' && item.result?.file);
    
    if (uploadedFiles.length === 0) {
      addNotification({
        type: 'warning',
        title: 'No Files to Process',
        message: 'Please upload files first before starting batch processing.',
      });
      return;
    }

    setCurrentOperation('processing');
    setIsProcessing(true);
    setIsPaused(false);

    try {
      // Use the batch convert functionality
      const files = uploadedFiles.map(item => item.result.file);
      
      setUploadStatus(`Processing ${files.length} files...`);
      
      const batchResult = await batchConvert(files, outputFormat, quality, {
        onBatchProgress: (current, total, message) => {
          setUploadStatus(`Processing ${current + 1}/${total}: ${message}`);
          
          // Update processing queue with individual results
          setProcessingQueue(prev => prev.map((item, index) => {
            if (index < current + 1) {
              return { ...item, status: 'completed', progress: 100 };
            } else if (index === current + 1) {
              return { ...item, status: 'processing', progress: 50 };
            }
            return item;
          }));
        }
      });

      // Update completed items with results
      setCompletedItems(batchResult.results.map((result, index) => ({
        id: `completed-${Date.now()}-${index}`,
        fileName: files[index].name,
        originalFileId: uploadedFiles[index].id,
        result: result,
        type: outputFormat
      })));

      setBatchStats(prev => ({
        ...prev,
        processed: batchResult.successCount,
        failed: batchResult.errorCount
      }));

      setShowResults(true);

    } catch (error) {
      console.error('Batch processing failed:', error);
      setBatchStats(prev => ({ ...prev, failed: prev.failed + uploadedFiles.length }));
      
      addNotification({
        type: 'error',
        title: 'Batch Processing Failed',
        message: error.message || 'An error occurred during batch processing.',
      });
    } finally {
      setCurrentOperation('idle');
      setIsProcessing(false);
    }
  }, [uploadQueue, batchConvert, addNotification]);

  // Auto-start processing after upload if processing type is specified
  useEffect(() => {
    const uploadedCount = uploadQueue.filter(item => item.status === 'completed').length;
    const totalFiles = uploadQueue.length;
    
    // If all files are uploaded and we have a processing type, start processing
    if (processingType && uploadedCount === totalFiles && totalFiles > 0 && !isProcessing && currentOperation === 'idle') {
      // Create processing queue entries for uploaded files
      const uploadedFiles = uploadQueue.filter(item => item.status === 'completed');
      const processingItems = uploadedFiles.map(file => ({
        id: `process-${file.id}-${Date.now()}`,
        fileId: file.result?.id || file.id,
        fileName: file.file.name,
        type: processingType,
        params: {},
        status: 'pending',
        progress: 0,
        result: null
      }));
      
      setProcessingQueue(processingItems);
      
      // Start processing with default settings
      setTimeout(() => startBatchProcessing('jpeg', 'medium'), 1000);
    }
  }, [uploadQueue, processingType, isProcessing, currentOperation, startBatchProcessing]);

  // Check if batch is complete
  useEffect(() => {
    const totalUploaded = uploadQueue.filter(item => item.status === 'completed').length;
    const totalProcessed = processingQueue.filter(item => item.status === 'completed').length;
    const hasProcessing = processingType && processingQueue.length > 0;
    
    if (totalUploaded === uploadQueue.length && 
        (!hasProcessing || totalProcessed === processingQueue.length) &&
        uploadQueue.length > 0) {
      setIsProcessing(false);
      setCurrentOperation('idle');
      setShowResults(true);
      
      if (onBatchComplete) {
        onBatchComplete({
          uploaded: totalUploaded,
          processed: totalProcessed,
          failed: batchStats.failed,
          completedItems
        });
      }
    }
  }, [uploadQueue, processingQueue, processingType, batchStats.failed, completedItems, onBatchComplete]);

  // Control functions
  const pauseBatch = useCallback(() => {
    setIsPaused(true);
    setUploadStatus('Batch processing paused');
  }, []);

  const resumeBatch = useCallback(() => {
    setIsPaused(false);
    setUploadStatus('Batch processing resumed');
  }, []);

  const stopBatch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsProcessing(false);
    setIsPaused(false);
    setCurrentOperation('idle');
    setUploadStatus('Batch processing stopped');
    
    addNotification({
      type: 'info',
      title: 'Batch Stopped',
      message: 'Batch processing has been stopped.',
    });
  }, [addNotification]);

  const clearBatch = useCallback(() => {
    setSelectedFiles([]);
    setUploadQueue([]);
    setProcessingQueue([]);
    setCompletedItems([]);
    setBatchStats({ total: 0, uploaded: 0, processed: 0, failed: 0, skipped: 0 });
    setShowResults(false);
    setUploadStatus('Batch cleared');
    reset();
  }, [reset]);

  const removeFile = useCallback((fileId) => {
    setSelectedFiles(prev => prev.filter(item => item.id !== fileId));
    setUploadQueue(prev => prev.filter(item => item.id !== fileId));
    setBatchStats(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
  }, []);

  // Drag handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  // File size formatting moved to utils if needed

  return (
    <Card 
      variant="glassCream" 
      floatingElements 
      className={`transition-all duration-300 hover:shadow-lg ${className}`}
      role="region"
      aria-labelledby={`${id}-title`}
    >
      <div className="p-6 sm:p-8 lg:p-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-6 mb-8">
          {/* Mode and Security Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {apiMode === 'offline' && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-orange-100/50 border border-orange-200 rounded-full text-xs text-orange-700">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span>Offline Mode - Local Processing</span>
              </div>
            )}
            
            {/* SECURITY: Security status indicator */}
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-100/50 border border-green-200 rounded-full text-xs text-green-700">
              <Shield className="w-3 h-3" />
              <span>Security Active</span>
            </div>
            
            {securityStatus.threatsBlocked > 0 && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-red-100/50 border border-red-200 rounded-full text-xs text-red-700">
                <AlertTriangle className="w-3 h-3" />
                <span>{securityStatus.threatsBlocked} threats blocked</span>
              </div>
            )}
            
            {rateLimitInfo && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100/50 border border-blue-200 rounded-full text-xs text-blue-700">
                <span>Rate: {rateLimitInfo.uploadsThisMinute}/{rateLimitInfo.limits.maxPerMinute}/min</span>
              </div>
            )}
          </div>

          {/* Upload Icon */}
          <div className="relative">
            <div className="absolute -inset-3 rounded-full border border-orange-200/20 animate-gentle-breathe" />
            <div 
              className={`relative p-6 rounded-full shadow-lg transition-all duration-300 ease-out ${
                isProcessing ? 'animate-gentle-pulse' : 'hover:shadow-xl'
              }`}
              style={{
                background: isProcessing 
                  ? 'linear-gradient(135deg, #64748b, #94a3b8)' 
                  : 'linear-gradient(135deg, #f97316, #fb923c, #ea580c)'
              }}
            >
              {isProcessing ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : (
                <Archive className="w-8 h-8 text-white" />
              )}
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-3">
            <h3 
              id={`${id}-title`}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900" 
              style={{ fontFamily: 'Poppins, sans-serif', textShadow: '0 2px 4px rgba(255, 255, 255, 0.8)' }}
            >
              {title}
            </h3>
            <p className="text-base sm:text-lg lg:text-xl text-slate-700 font-semibold px-4 sm:px-0 max-w-lg mx-auto" 
               style={{ fontFamily: 'Inter, sans-serif', textShadow: '0 1px 2px rgba(255, 255, 255, 0.6)' }}>
              {subtitle}
            </p>
            <div className="text-sm text-slate-600 font-medium">
              <span className="bg-white/30 px-3 py-1 rounded-full border border-white/40">
                Max {maxFiles} files • 50MB each
              </span>
            </div>
          </div>
        </div>

        {/* Drop Zone */}
        <div className="w-full max-w-4xl mx-auto space-y-6">
          <div
            className={`relative w-full h-48 border-2 border-dashed rounded-2xl transition-all duration-300 backdrop-blur-sm ${
              dragActive 
                ? 'border-orange-500/80 bg-orange-50/60 scale-[1.01] shadow-lg' 
                : 'border-orange-400/50 bg-white/20 hover:border-orange-500/70 hover:bg-white/25 hover:shadow-md'
            } ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              id={batchZoneId}
              type="file"
              className="sr-only"
              accept="image/*"
              multiple
              onChange={handleInputChange}
              disabled={isProcessing}
              aria-describedby={`${instructionsId} ${statusId} ${helpId}`}
            />
            
            {/* Clickable label that covers the entire drop zone */}
            <label
              htmlFor={batchZoneId}
              className="absolute inset-0 flex items-center justify-center cursor-pointer rounded-2xl focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-opacity-75 focus-within:outline-none"
              role="button"
              aria-label={`Batch upload zone. Drop multiple files or click to select. Maximum ${maxFiles} files.`}
              aria-describedby={`${instructionsId} ${statusId} ${helpId}`}
              tabIndex={isProcessing ? -1 : 0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  document.getElementById(batchZoneId)?.click();
                }
              }}
            >
              <div className="flex flex-col items-center space-y-6 px-6 py-8 text-center w-full">
                {/* Clickable Upload Icon */}
                <div className="relative group">
                  <div className="absolute -inset-3 rounded-full border border-orange-200/30 animate-gentle-breathe opacity-70 group-hover:opacity-100 transition-opacity" />
                  <div 
                    className="relative p-6 rounded-full shadow-lg transition-all duration-300 ease-out group-hover:shadow-xl group-hover:scale-105 cursor-pointer"
                    style={{
                      background: isProcessing 
                        ? 'linear-gradient(135deg, #64748b, #94a3b8)' 
                        : 'linear-gradient(135deg, #f97316, #fb923c, #ea580c)'
                    }}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    ) : (
                      <Archive className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                    )}
                  </div>
                </div>
                
                {/* Text Content */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <span 
                      id={instructionsId}
                      className="text-slate-800 text-xl font-bold block" 
                      style={{ fontFamily: 'Inter, sans-serif', textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)' }}
                    >
                      {dragActive ? 'Drop your images here' : 'Select Multiple Images'}
                    </span>
                    <span 
                      id={helpId}
                      className="text-sm text-slate-600 font-medium block"
                    >
                      Drag & drop or click anywhere to browse
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-sm text-slate-700 font-semibold block" style={{ textShadow: '0 1px 1px rgba(255, 255, 255, 0.6)' }}>
                      Supports: JPEG, PNG, WebP, GIF, SVG files
                    </span>
                    <span className="text-xs text-slate-600 font-medium block" style={{ textShadow: '0 1px 1px rgba(255, 255, 255, 0.6)' }}>
                      Maximum {maxFiles} files • 50MB each
                    </span>
                  </div>
                </div>
              </div>
            </label>
          </div>

          {/* Batch Controls */}
          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap items-center gap-4 p-4 bg-white/25 border border-white/30 rounded-xl backdrop-blur-md">
              <div className="flex items-center space-x-4 flex-1">
                <span className="text-sm font-bold text-slate-800" 
                      style={{ fontFamily: 'Inter, sans-serif', textShadow: '0 1px 1px rgba(255, 255, 255, 0.6)' }}>
                  {selectedFiles.length} files selected
                </span>
                
                {/* Batch Stats */}
                <div className="flex items-center space-x-4 text-xs text-slate-600">
                  <span>Uploaded: {batchStats.uploaded}</span>
                  <span>Processed: {batchStats.processed}</span>
                  {batchStats.failed > 0 && <span className="text-red-600">Failed: {batchStats.failed}</span>}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {!isProcessing ? (
                  <Button
                    variant="glassPrimary"
                    size="sm"
                    onClick={() => {
                      if (uploadQueue.filter(item => item.status === 'completed').length > 0) {
                        startBatchProcessing('jpeg', 'medium');
                      } else {
                        startBatchUpload();
                      }
                    }}
                    disabled={selectedFiles.length === 0}
                    className="flex items-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>{uploadQueue.filter(item => item.status === 'completed').length > 0 ? 'Process Files' : 'Upload Files'}</span>
                  </Button>
                ) : (
                  <>
                    {!isPaused ? (
                      <Button
                        variant="glassSecondary"
                        size="sm"
                        onClick={pauseBatch}
                        className="flex items-center space-x-2"
                      >
                        <Pause className="w-4 h-4" />
                        <span>Pause</span>
                      </Button>
                    ) : (
                      <Button
                        variant="glassPrimary"
                        size="sm"
                        onClick={resumeBatch}
                        className="flex items-center space-x-2"
                      >
                        <Play className="w-4 h-4" />
                        <span>Resume</span>
                      </Button>
                    )}
                    
                    <Button
                      variant="glassSecondary"
                      size="sm"
                      onClick={stopBatch}
                      className="flex items-center space-x-2"
                    >
                      <Square className="w-4 h-4" />
                      <span>Stop</span>
                    </Button>
                  </>
                )}
                
                <Button
                  variant="glassSecondary"
                  size="sm"
                  onClick={clearBatch}
                  disabled={isProcessing}
                  className="flex items-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Clear</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Progress Display */}
        {(uploadQueue.length > 0 || processingQueue.length > 0) && (
          <div className="mt-8">
            <BatchProgressDisplay
              uploadQueue={uploadQueue}
              processingQueue={processingQueue}
              currentOperation={currentOperation}
              isPaused={isPaused}
              onRemoveFile={removeFile}
              onRetryFile={(fileId) => {
                // Reset file status to pending for retry
                setUploadQueue(prev => prev.map(item => 
                  item.id === fileId 
                    ? { ...item, status: 'pending', error: null, progress: 0 }
                    : item
                ));
              }}
            />
          </div>
        )}

        {/* Results Panel */}
        {showResults && completedItems.length > 0 && (
          <div className="mt-8">
            <BatchDownloadPanel
              completedItems={completedItems}
              onDownloadAll={() => {
                // This will be handled by the download panel
              }}
              onClearResults={() => {
                setCompletedItems([]);
                setShowResults(false);
              }}
            />
          </div>
        )}

        {/* Status Updates */}
        <div 
          id={statusId}
          className="sr-only" 
          aria-live="polite" 
          aria-atomic="true"
        >
          {uploadStatus}
        </div>
      </div>
    </Card>
  );
};

export default BatchUploadZone;