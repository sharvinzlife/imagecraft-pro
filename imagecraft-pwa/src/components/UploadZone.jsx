import React, { useState, useCallback } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
// Hybrid API removed - using direct browser processing
import { useNotifications } from '../store/appStore';
import ImagePreview from './ImagePreview';

const UploadZone = ({ 
  title = 'Upload Your Image', 
  subtitle = 'Choose a photo to get started with editing, converting, or creating', 
  onFileUpload, 
  className = '', 
  accept = 'image/*', 
  multiple = false,
  id = 'upload-zone'
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState(''); // For live region announcements
  const [validationMessage, setValidationMessage] = useState('');
  // Direct file handling without API upload
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  
  // Reset function for clearing state
  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
    setUploadedFile(null);
    setSelectedFiles([]);
    setValidationMessage('');
    setUploadStatus('');
  }, []);
  
  // API mode placeholder (browser-only now)
  const apiMode = 'browser';
  const { addNotification } = useNotifications();
  
  // Generate unique IDs for accessibility
  const uploadZoneId = `${id}-dropzone`;
  const statusId = `${id}-status`;
  const helpId = `${id}-help`;
  const instructionsId = `${id}-instructions`;
  
  // Show mode indicator
  const isOfflineMode = apiMode === 'offline';

  // File validation
  const validateFile = useCallback((file) => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 50MB' };
    }
    
    if (!validTypes.includes(file.type)) {
      return { valid: false, error: 'Please select a valid image file (JPEG, PNG, WebP, GIF, or SVG)' };
    }
    
    return { valid: true };
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(async (files) => {
    const fileList = Array.from(files);
    const validFiles = [];
    const errors = [];
    
    setUploadStatus('Validating files...');
    setValidationMessage('');

    // Validate each file
    fileList.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    // Show validation errors
    if (errors.length > 0) {
      const errorMessage = errors.join(', ');
      setValidationMessage(errorMessage);
      setUploadStatus(`Validation failed: ${errorMessage}`);
      addNotification({
        type: 'error',
        title: 'File Validation Error',
        message: errorMessage,
      });
    }

    if (validFiles.length === 0) {
      setUploadStatus('No valid files selected');
      return;
    }

    setSelectedFiles(validFiles);
    setUploadStatus(`${validFiles.length} file${validFiles.length === 1 ? '' : 's'} selected and ready for upload`);

    // Process files directly (no upload needed - browser processing)
    for (const file of validFiles) {
      try {
        setUploading(true);
        setProgress(50);
        setUploadStatus(`Processing ${file.name}...`);
        
        // Create a simple file result object
        const result = {
          file: file,
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file)
        };
        
        setUploadedFile(result);
        setProgress(100);
        setUploadStatus(`${file.name} ready for processing`);
        
        addNotification({
          type: 'success',
          title: 'File Ready',
          message: `${file.name} is ready for image processing`,
        });

        // Call the parent callback with the file info
        if (onFileUpload) {
          onFileUpload(result, file);
        }
        
        setUploading(false);
      } catch (error) {
        const errorMsg = `Failed to process ${file.name}: ${error.message}`;
        setUploadStatus(errorMsg);
        setError(error);
        setUploading(false);
        addNotification({
          type: 'error',
          title: 'Processing Failed',
          message: errorMsg,
        });
      }
    }
  }, [validateFile, onFileUpload, addNotification]);

  // Handle file input change
  const handleInputChange = useCallback((e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  // Drag and drop handlers
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

  // Remove selected file
  const removeFile = useCallback((index) => {
    const fileName = selectedFiles[index]?.name;
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setUploadStatus(`Removed ${fileName} from selection`);
    reset();
  }, [selectedFiles, reset]);

  // Clear all files
  const clearAll = useCallback(() => {
    const fileCount = selectedFiles.length;
    setSelectedFiles([]);
    setUploadStatus(`Cleared all ${fileCount} selected files`);
    setValidationMessage('');
    reset();
  }, [selectedFiles.length, reset]);

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card 
      variant="glassCream" 
      floatingElements 
      className={`transition-all duration-300 hover:shadow-lg ${className}`}
      role="region"
      aria-labelledby={`${id}-title`}
      aria-describedby={helpId}
    >
      <div className="p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Mode Indicator */}
          {isOfflineMode && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-orange-100/50 border border-orange-200 rounded-full text-xs text-orange-700">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span>Offline Mode - Local Storage</span>
            </div>
          )}
          
          {/* Upload Icon */}
          <div className="relative">
            {/* Subtle decoration ring */}
            <div className="absolute -inset-3 rounded-full border border-orange-200/20 animate-gentle-breathe" />
            
            <div 
              className={`relative p-6 rounded-full shadow-lg transition-all duration-300 ease-out group ${
                uploading ? 'animate-gentle-pulse' : 'hover:shadow-xl'
              }`}
              style={{
                background: uploading 
                  ? 'linear-gradient(135deg, #64748b, #94a3b8)' 
                  : isOfflineMode
                    ? 'linear-gradient(135deg, #f59e0b, #fbbf24, #f97316)'
                    : 'linear-gradient(135deg, #f97316, #fb923c, #ea580c)'
              }}
            >
              {uploading ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-white transition-transform duration-300 group-hover:scale-105" />
              )}
            </div>
          </div>

          {/* Title and Subtitle */}
          <div className="text-center space-y-3">
            <h3 
              id={`${id}-title`}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900" 
              style={{ fontFamily: 'Poppins, sans-serif', textShadow: '0 2px 4px rgba(255, 255, 255, 0.8)' }}
            >
              {title}
            </h3>
            <p 
              id={helpId}
              className="text-base sm:text-lg lg:text-xl text-slate-700 font-semibold px-4 sm:px-0 max-w-lg mx-auto" 
              style={{ fontFamily: 'Inter, sans-serif', textShadow: '0 1px 2px rgba(255, 255, 255, 0.6)' }}
            >
              {subtitle}
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-600 font-medium">
              <span className="bg-white/30 px-2 py-1 rounded-full border border-white/40">Convert Formats</span>
              <span className="bg-white/30 px-2 py-1 rounded-full border border-white/40">Edit & Enhance</span>
              <span className="bg-white/30 px-2 py-1 rounded-full border border-white/40">Create Collages</span>
              <span className="bg-white/30 px-2 py-1 rounded-full border border-white/40">AI Effects</span>
            </div>
          </div>

          {/* Upload Area */}
          <div
            className={`w-full max-w-2xl transition-all duration-300 ease-out ${
              dragActive ? 'scale-[1.01]' : ''
            }`}
          >
            <div className="relative">
              <label 
                htmlFor={uploadZoneId}
                className={`relative w-full h-32 sm:h-36 md:h-40 border-2 border-dashed rounded-2xl flex items-center justify-center transition-all duration-300 cursor-pointer backdrop-blur-sm ${
                  dragActive 
                    ? 'border-orange-500/80 bg-orange-50/60 scale-[1.01] shadow-lg' 
                    : 'border-orange-400/50 bg-white/20 hover:border-orange-500/70 hover:bg-white/25 hover:shadow-md'
                } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
                style={{
                  background: dragActive 
                    ? 'rgba(249, 115, 22, 0.15)' 
                    : 'rgba(255, 255, 255, 0.15)'
                }}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                role="button"
                aria-label={uploading ? 'Uploading files, please wait' : `Upload images. ${multiple ? 'Multiple files allowed.' : 'Single file only.'} Drag and drop or click to select.`}
                aria-describedby={`${instructionsId} ${statusId}`}
                tabIndex={uploading ? -1 : 0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    document.getElementById(uploadZoneId)?.click();
                  }
                }}
              >
                <input
                  id={uploadZoneId}
                  type="file"
                  className="sr-only"
                  accept={accept}
                  multiple={multiple}
                  onChange={handleInputChange}
                  disabled={uploading}
                  aria-describedby={`${instructionsId} ${statusId}`}
                  aria-label={`File input for ${title}. ${multiple ? 'Multiple files allowed.' : 'Single file only.'} Accepted formats: ${accept}`}
                />
                <div className="flex flex-col items-center space-y-3 px-6">
                  <span 
                    id={instructionsId}
                    className="text-slate-800 text-sm sm:text-base font-bold text-center" 
                    style={{ fontFamily: 'Inter, sans-serif', textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)' }}
                    aria-live="polite"
                  >
                    {dragActive ? 'Drop your image here' : 'Click to choose image or drag & drop'}
                  </span>
                  {!uploading && (
                    <div className="space-y-1">
                      <span className="text-sm text-slate-700 text-center font-semibold block" style={{ textShadow: '0 1px 1px rgba(255, 255, 255, 0.6)' }}>
                        Supports: JPEG, PNG, WebP, GIF, SVG files
                      </span>
                      <span className="text-xs text-slate-600 text-center font-medium block" style={{ textShadow: '0 1px 1px rgba(255, 255, 255, 0.6)' }}>
                        Maximum file size: 50MB{isOfflineMode && ' • Working offline'}
                      </span>
                    </div>
                  )}
                </div>
              </label>
            </div>

            {/* Live Region for Status Updates */}
            <div 
              id={statusId}
              className="sr-only" 
              aria-live="polite" 
              aria-atomic="true"
            >
              {uploadStatus}
            </div>
            
            {/* Validation Messages */}
            {validationMessage && (
              <div className="mt-4 p-3 bg-red-50/60 backdrop-blur-sm border border-red-300/60 rounded-xl" role="alert">
                <p className="text-sm font-medium text-red-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {validationMessage}
                </p>
              </div>
            )}
            
            {/* Progress Bar */}
            {uploading && progress > 0 && (
              <div className="mt-6 w-full" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100" aria-describedby={`${id}-progress-label`}>
                <div className="flex justify-between text-sm text-slate-700 font-medium mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <span id={`${id}-progress-label`}>Uploading...</span>
                  <span className="text-orange-600" aria-label={`${Math.round(progress)} percent complete`}>{Math.round(progress)}%</span>
                </div>
                <div className="relative w-full bg-white/30 backdrop-blur-sm rounded-full h-3 overflow-hidden border border-white/40">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-orange-600 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="w-full max-w-2xl space-y-4" role="region" aria-labelledby={`${id}-files-heading`}>
              <div className="flex items-center justify-between">
                <h4 
                  id={`${id}-files-heading`}
                  className="text-base font-bold text-slate-800" 
                  style={{ fontFamily: 'Poppins, sans-serif', textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)' }}
                >
                  Selected Files ({selectedFiles.length})
                </h4>
                <Button
                  variant="glassCream"
                  size="sm"
                  onClick={clearAll}
                  disabled={uploading}
                  className="transition-all duration-300"
                  aria-label={`Clear all ${selectedFiles.length} selected files`}
                >
                  Clear All
                </Button>
              </div>
              
              <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar" role="list" aria-label="Selected files list">
                {selectedFiles.map((file, index) => (
                  <div 
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between p-3 bg-white/25 border border-white/30 rounded-xl backdrop-blur-md transition-all duration-200 hover:bg-white/30 hover:border-white/40 hover:shadow-md group"
                    role="listitem"
                    aria-label={`File ${index + 1} of ${selectedFiles.length}: ${file.name}, ${formatFileSize(file.size)}`}
                  >
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className="flex-shrink-0 p-2 rounded-lg bg-gradient-to-br from-white/20 to-white/10">
                        {uploadedFile ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        ) : error ? (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        ) : uploading ? (
                          <Loader2 className="w-5 h-5 text-orange-600 animate-spin" />
                        ) : (
                          <Upload className="w-5 h-5 text-slate-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate" style={{ fontFamily: 'Inter, sans-serif', textShadow: '0 1px 1px rgba(255, 255, 255, 0.6)' }}>
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-600 font-medium">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    
                    {!uploading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="flex-shrink-0 ml-3 p-2 transition-all duration-200 opacity-0 group-hover:opacity-100 hover:bg-red-100/80 hover:text-red-600 rounded-lg"
                        aria-label={`Remove ${file.name} from selection`}
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="w-full max-w-2xl p-4 bg-red-50/60 backdrop-blur-sm border border-red-300/60 rounded-xl shadow-lg" role="alert" aria-live="assertive">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100/80 rounded-lg" aria-hidden="true">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Upload Error: {error.message || 'Upload failed. Please try again.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {uploadedFile && !error && (
            <div className="w-full max-w-2xl p-4 bg-emerald-50/60 backdrop-blur-sm border border-emerald-300/60 rounded-xl shadow-lg" role="status" aria-live="polite">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100/80 rounded-lg" aria-hidden="true">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Success: File uploaded successfully! Ready for processing.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Image Preview Section */}
      {selectedFiles.length > 0 && (
        <div className="mt-8 px-6 sm:px-8 lg:px-10 pb-6 sm:pb-8 lg:pb-10" role="region" aria-labelledby={`${id}-preview-heading`}>
          <h4 id={`${id}-preview-heading`} className="sr-only">Image Preview Section</h4>
          <ImagePreview 
            files={selectedFiles} 
            onRemove={removeFile}
            className="w-full"
          />
        </div>
      )}
    </Card>
  );
};

export default UploadZone;