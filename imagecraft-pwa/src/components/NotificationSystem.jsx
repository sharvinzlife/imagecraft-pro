import React, { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Toaster } from './ui/sonner';
import { showCelebrationToast } from './CelebrationToast';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  AlertCircle,
  Info, 
  Wifi, 
  WifiOff,
  RefreshCw,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { cn } from '../lib/utils';

// Unused component - keeping for reference
// eslint-disable-next-line no-unused-vars
const NotificationItem = ({ notification, onRemove }) => {
  const { id, type, title, message, autoRemove = true, duration = 5000 } = notification;

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const variants = {
    success: {
      border: 'border-green-200',
      bg: 'bg-green-50/90',
      icon: 'text-green-500',
      title: 'text-green-800',
      message: 'text-green-700',
    },
    error: {
      border: 'border-red-200',
      bg: 'bg-red-50/90',
      icon: 'text-red-500',
      title: 'text-red-800',
      message: 'text-red-700',
    },
    warning: {
      border: 'border-yellow-200',
      bg: 'bg-yellow-50/90',
      icon: 'text-yellow-500',
      title: 'text-yellow-800',
      message: 'text-yellow-700',
    },
    info: {
      border: 'border-blue-200',
      bg: 'bg-blue-50/90',
      icon: 'text-blue-500',
      title: 'text-blue-800',
      message: 'text-blue-700',
    },
  };

  const IconComponent = icons[type] || Info;
  const variant = variants[type] || variants.info;

  useEffect(() => {
    if (autoRemove && duration > 0) {
      const timer = setTimeout(() => {
        onRemove(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, autoRemove, duration, onRemove]);

  return (
    <Card
      className={cn(
        'mb-3 border backdrop-blur-md shadow-lg transition-all duration-300 animate-in slide-in-from-right-5',
        variant.border,
        variant.bg
      )}
    >
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <IconComponent className={cn('w-5 h-5 flex-shrink-0 mt-0.5', variant.icon)} />
          
          <div className="flex-1 min-w-0">
            {title && (
              <h4 
                className={cn('text-sm font-semibold mb-1', variant.title)}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {title}
              </h4>
            )}
            {message && (
              <p 
                className={cn('text-sm', variant.message)}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {message}
              </p>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(id)}
            className="flex-shrink-0 h-6 w-6 p-0 hover:bg-black/10"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress bar for auto-remove */}
        {autoRemove && duration > 0 && (
          <div className="mt-3 h-1 bg-black/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-current opacity-50 rounded-full transition-all ease-linear"
              style={{ 
                width: '100%',
                animation: `shrink ${duration}ms linear forwards`
              }}
            />
          </div>
        )}
      </div>
    </Card>
  );
};

/**
 * Enhanced NotificationSystem - Uses Sonner for modern toast notifications
 * Handles API errors, processing updates, and user feedback
 */
const NotificationSystem = ({ 
  networkStatus,
  processingJobs = [],
  apiErrors = []
}) => {
  
  // Handle network status changes
  useEffect(() => {
    if (networkStatus?.isOnline === false) {
      toast.error('Connection Lost', {
        icon: <WifiOff className="w-4 h-4" />,
        description: 'You are currently offline. Some features may be unavailable.',
        duration: Infinity,
        id: 'offline-status',
        action: {
          label: 'Retry',
          onClick: () => window.location.reload(),
        },
      });
    } else if (networkStatus?.isOnline === true) {
      toast.dismiss('offline-status');
      toast.success('Connection Restored', {
        icon: <Wifi className="w-4 h-4" />,
        description: 'You are back online!',
        duration: 3000,
      });
    }
  }, [networkStatus?.isOnline]);

  // Handle API errors
  useEffect(() => {
    apiErrors.forEach((error) => {
      const getErrorConfig = (error) => {
        switch (error.status || error.code) {
          case 401:
            return {
              title: 'Authentication Required',
              description: 'Please sign in to continue',
              action: { label: 'Sign In', onClick: () => window.location.href = '/login' }
            };
          case 403:
            return {
              title: 'Access Denied',
              description: 'You don\'t have permission to perform this action',
            };
          case 404:
            return {
              title: 'Not Found',
              description: 'The requested resource could not be found',
            };
          case 413:
            return {
              title: 'File Too Large',
              description: 'Please choose a smaller file (max 10MB)',
            };
          case 422:
            return {
              title: 'Invalid File',
              description: error.message || 'Please check your file format and try again',
            };
          case 429:
            return {
              title: 'Rate Limited',
              description: 'Too many requests. Please wait a moment and try again.',
              action: { label: 'Retry', onClick: () => window.location.reload() }
            };
          case 500:
          case 502:
          case 503:
            return {
              title: 'Server Error',
              description: 'Something went wrong on our end. Please try again.',
              action: { label: 'Retry', onClick: () => window.location.reload() }
            };
          default:
            return {
              title: 'Error',
              description: error.message || 'An unexpected error occurred',
            };
        }
      };

      const config = getErrorConfig(error);
      
      toast.error(config.title, {
        icon: <XCircle className="w-4 h-4" />,
        description: config.description,
        duration: 5000,
        ...(config.action && { action: config.action }),
      });
    });
  }, [apiErrors]);

  // Handle processing job updates
  useEffect(() => {
    processingJobs.forEach((job) => {
      const jobId = `job-${job.id}`;
      
      switch (job.status) {
        case 'completed':
          toast.success('Processing Complete!', {
            icon: <CheckCircle className="w-4 h-4" />,
            description: `${job.fileName || 'Your image'} has been processed successfully`,
            duration: 5000,
            id: jobId,
            action: job.result?.url ? {
              label: 'Download',
              onClick: () => window.open(job.result.url, '_blank'),
            } : undefined,
          });
          break;
          
        case 'failed':
          toast.error('Processing Failed', {
            icon: <XCircle className="w-4 h-4" />,
            description: job.error?.message || 'Failed to process your image',
            duration: 5000,
            id: jobId,
            action: {
              label: 'Retry',
              onClick: () => {
                // TODO: Implement retry logic
                console.log('Retrying job:', job.id);
              },
            },
          });
          break;
          
        case 'processing':
          // Show progress toast for long-running jobs
          if (job.progress > 0) {
            toast.loading(`Processing... ${Math.round(job.progress)}%`, {
              description: job.fileName || 'Your image',
              duration: Infinity,
              id: jobId,
            });
          }
          break;
          
        default:
          break;
      }
    });
  }, [processingJobs]);

  return (
    <Toaster 
      position="top-right"
      expand={false}
      richColors
      closeButton
      toastOptions={{
        style: {
          fontFamily: 'Inter, sans-serif',
        },
      }}
    />
  );
};

/**
 * Notification utilities for manual toast triggers
 */
export const notify = {
  success: (title, options = {}) => {
    toast.success(title, {
      icon: <CheckCircle className="w-4 h-4" />,
      duration: 4000,
      ...options,
    });
  },

  error: (title, options = {}) => {
    toast.error(title, {
      icon: <XCircle className="w-4 h-4" />,
      duration: 5000,
      ...options,
    });
  },

  warning: (title, options = {}) => {
    toast.warning(title, {
      icon: <AlertTriangle className="w-4 h-4" />,
      duration: 4000,
      ...options,
    });
  },

  info: (title, options = {}) => {
    toast.info(title, {
      icon: <Info className="w-4 h-4" />,
      duration: 4000,
      ...options,
    });
  },

  loading: (title, options = {}) => {
    return toast.loading(title, {
      icon: <RefreshCw className="w-4 h-4 animate-spin" />,
      duration: Infinity,
      ...options,
    });
  },

  promise: (promise, messages) => {
    return toast.promise(promise, {
      loading: {
        title: messages.loading,
        icon: <RefreshCw className="w-4 h-4 animate-spin" />,
      },
      success: {
        title: messages.success,
        icon: <CheckCircle className="w-4 h-4" />,
      },
      error: {
        title: messages.error,
        icon: <XCircle className="w-4 h-4" />,
      },
    });
  },

  // Specialized notifications for ImageCraft Pro
  fileUploaded: (fileName, size) => {
    toast.success('File Uploaded', {
      icon: <CheckCircle className="w-4 h-4" />,
      description: `${fileName} (${(size / 1024 / 1024).toFixed(1)} MB)`,
      duration: 3000,
    });
  },

  processingStarted: (fileName) => {
    return toast.loading('Processing Started', {
      description: fileName,
      duration: Infinity,
    });
  },

  downloadReady: (fileName, downloadUrl, options = {}) => {
    // Use celebration toast for download ready notifications
    return showCelebrationToast({
      fileName,
      downloadUrl,
      outputFormat: options.outputFormat,
      processingTime: options.processingTime,
      duration: 8000,
      onDownload: () => {
        if (options.onDownload) {
          options.onDownload();
        } else {
          window.open(downloadUrl, '_blank');
        }
      },
    });
  },

  // New celebration method for successful conversions
  conversionComplete: (fileName, downloadUrl, options = {}) => {
    return showCelebrationToast({
      fileName,
      downloadUrl,
      outputFormat: options.outputFormat,
      processingTime: options.processingTime,
      duration: 6000,
      onDownload: () => {
        if (options.onDownload) {
          options.onDownload();
        } else {
          window.open(downloadUrl, '_blank');
        }
      },
    });
  },

  quotaExceeded: (current, limit) => {
    toast.warning('Usage Limit Reached', {
      description: `You've used ${current}/${limit} of your monthly quota`,
      duration: 6000,
      action: {
        label: 'Upgrade',
        onClick: () => window.location.href = '/pricing',
      },
    });
  },

  maintenanceMode: (message) => {
    toast.info('Maintenance Notice', {
      description: message || 'Some features may be temporarily unavailable',
      duration: 10000,
    });
  },
};

/**
 * Hook for managing notifications in components
 */
export const useNotifications = () => {
  const showSuccess = useCallback((title, options) => notify.success(title, options), []);
  const showError = useCallback((title, options) => notify.error(title, options), []);
  const showWarning = useCallback((title, options) => notify.warning(title, options), []);
  const showInfo = useCallback((title, options) => notify.info(title, options), []);
  const showLoading = useCallback((title, options) => notify.loading(title, options), []);

  return {
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
    loading: showLoading,
    promise: notify.promise,
    // Specialized methods
    fileUploaded: notify.fileUploaded,
    processingStarted: notify.processingStarted,
    downloadReady: notify.downloadReady,
    conversionComplete: notify.conversionComplete,
    quotaExceeded: notify.quotaExceeded,
    maintenanceMode: notify.maintenanceMode,
    dismiss: toast.dismiss,
  };
};

export default NotificationSystem;