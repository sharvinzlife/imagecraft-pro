import React from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Clock, 
  X, 
  RefreshCw,
  FileImage,
  Wand2,
  Image as ImageIcon,
  Palette
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';

const BatchProgressDisplay = ({ 
  uploadQueue = [], 
  processingQueue = [], 
  currentOperation = 'idle',
  isPaused = false,
  onRemoveFile,
  onRetryFile,
  className = ''
}) => {
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status, isProcessing = false) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'uploading':
      case 'processing':
        return <Loader2 className="w-5 h-5 text-orange-600 animate-spin" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-slate-400" />;
      default:
        return isProcessing ? <Wand2 className="w-5 h-5 text-slate-500" /> : <FileImage className="w-5 h-5 text-slate-500" />;
    }
  };

  const getProcessingTypeIcon = (type) => {
    switch (type) {
      case 'convert':
        return <ImageIcon className="w-4 h-4" />;
      case 'edit':
        return <Palette className="w-4 h-4" />;
      case 'ai-style':
        return <Wand2 className="w-4 h-4" />;
      default:
        return <FileImage className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-700 bg-emerald-50/60 border-emerald-200';
      case 'failed':
        return 'text-red-700 bg-red-50/60 border-red-200';
      case 'uploading':
      case 'processing':
        return 'text-orange-700 bg-orange-50/60 border-orange-200';
      case 'pending':
        return 'text-slate-600 bg-slate-50/60 border-slate-200';
      default:
        return 'text-slate-600 bg-white/30 border-white/40';
    }
  };

  const totalItems = uploadQueue.length + processingQueue.length;
  const completedUploads = uploadQueue.filter(item => item.status === 'completed').length;
  const completedProcessing = processingQueue.filter(item => item.status === 'completed').length;
  const failedItems = [...uploadQueue, ...processingQueue].filter(item => item.status === 'failed').length;

  const overallProgress = totalItems > 0 
    ? Math.round(((completedUploads + completedProcessing) / totalItems) * 100)
    : 0;

  if (totalItems === 0) {
    return null;
  }

  return (
    <Card variant="glassCream" className={`${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-lg font-bold text-slate-800 mb-1" 
                style={{ fontFamily: 'Poppins, sans-serif', textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)' }}>
              Batch Progress
            </h4>
            <div className="flex items-center space-x-4 text-sm text-slate-600">
              <span>Total: {totalItems}</span>
              <span>Completed: {completedUploads + completedProcessing}</span>
              {failedItems > 0 && <span className="text-red-600">Failed: {failedItems}</span>}
            </div>
          </div>
          
          {/* Overall Progress */}
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-800 mb-1">
              {overallProgress}%
            </div>
            <div className="text-xs text-slate-600 uppercase tracking-wide font-medium">
              {isPaused ? 'Paused' : currentOperation === 'idle' ? 'Complete' : currentOperation}
            </div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-white/30 backdrop-blur-sm rounded-full h-3 overflow-hidden border border-white/40">
            <div 
              className="bg-gradient-to-r from-orange-500 to-orange-600 h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
              style={{ width: `${overallProgress}%` }}
            >
              {currentOperation !== 'idle' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              )}
            </div>
          </div>
        </div>

        {/* Upload Queue */}
        {uploadQueue.length > 0 && (
          <div className="mb-6">
            <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
              <FileImage className="w-4 h-4 mr-2" />
              Upload Queue ({uploadQueue.length})
            </h5>
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {uploadQueue.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-lg border backdrop-blur-sm transition-all duration-200 ${getStatusColor(item.status)}`}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {item.file.name}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-slate-600">
                        <span>{formatFileSize(item.file.size)}</span>
                        <span>•</span>
                        <span className="capitalize">{item.status}</span>
                        {item.progress > 0 && item.status === 'uploading' && (
                          <>
                            <span>•</span>
                            <span>{Math.round(item.progress)}%</span>
                          </>
                        )}
                      </div>
                      {item.error && (
                        <p className="text-xs text-red-600 mt-1 font-medium">
                          {item.error}
                        </p>
                      )}
                    </div>
                    
                    {/* Progress bar for individual uploads */}
                    {item.status === 'uploading' && item.progress > 0 && (
                      <div className="w-16 bg-white/30 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-orange-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-3">
                    {item.status === 'failed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRetryFile(item.id)}
                        className="p-1 h-6 w-6 text-orange-600 hover:text-orange-700 hover:bg-orange-100/50"
                        aria-label={`Retry uploading ${item.file.name}`}
                      >
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                    )}
                    
                    {item.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveFile(item.id)}
                        className="p-1 h-6 w-6 text-slate-400 hover:text-red-500 hover:bg-red-100/50"
                        aria-label={`Remove ${item.file.name} from queue`}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Processing Queue */}
        {processingQueue.length > 0 && (
          <div>
            <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
              <Wand2 className="w-4 h-4 mr-2" />
              Processing Queue ({processingQueue.length})
            </h5>
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {processingQueue.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-lg border backdrop-blur-sm transition-all duration-200 ${getStatusColor(item.status)}`}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {getStatusIcon(item.status, true)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {item.fileName}
                        </p>
                        <div className="flex items-center space-x-1 text-slate-500">
                          {getProcessingTypeIcon(item.type)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-slate-600">
                        <span className="capitalize">{item.type} processing</span>
                        <span>•</span>
                        <span className="capitalize">{item.status}</span>
                        {item.progress > 0 && item.status === 'processing' && (
                          <>
                            <span>•</span>
                            <span>{Math.round(item.progress)}%</span>
                          </>
                        )}
                      </div>
                      {item.error && (
                        <p className="text-xs text-red-600 mt-1 font-medium">
                          {item.error}
                        </p>
                      )}
                      {item.result && item.status === 'completed' && (
                        <p className="text-xs text-emerald-600 mt-1 font-medium">
                          Processing completed successfully
                        </p>
                      )}
                    </div>
                    
                    {/* Progress bar for individual processing */}
                    {item.status === 'processing' && item.progress > 0 && (
                      <div className="w-16 bg-white/30 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Messages */}
        {isPaused && (
          <div className="mt-4 p-3 bg-yellow-50/60 border border-yellow-200 rounded-lg" role="status">
            <p className="text-sm font-medium text-yellow-800" style={{ fontFamily: 'Inter, sans-serif' }}>
              <Clock className="w-4 h-4 inline mr-2" />
              Batch processing is paused. Click Resume to continue.
            </p>
          </div>
        )}

        {currentOperation === 'idle' && totalItems > 0 && overallProgress === 100 && (
          <div className="mt-4 p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg" role="status">
            <p className="text-sm font-medium text-emerald-800" style={{ fontFamily: 'Inter, sans-serif' }}>
              <CheckCircle className="w-4 h-4 inline mr-2" />
              All files have been processed successfully!
            </p>
          </div>
        )}

        {failedItems > 0 && currentOperation === 'idle' && (
          <div className="mt-4 p-3 bg-red-50/60 border border-red-200 rounded-lg" role="alert">
            <p className="text-sm font-medium text-red-800" style={{ fontFamily: 'Inter, sans-serif' }}>
              <AlertCircle className="w-4 h-4 inline mr-2" />
              {failedItems} item{failedItems === 1 ? '' : 's'} failed to process. Check the details above and retry if needed.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default BatchProgressDisplay;