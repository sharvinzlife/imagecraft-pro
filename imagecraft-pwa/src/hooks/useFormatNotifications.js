/**
 * Format Notifications Hook
 * Provides easy access to format notification system
 */

import { useEffect, useState, useCallback } from 'react';
import { getFormatNotificationService } from '../utils/formatNotificationService';

/**
 * Hook for managing format notifications
 */
export const useFormatNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [notificationService] = useState(() => getFormatNotificationService());

  useEffect(() => {
    // Subscribe to notifications
    const unsubscribe = notificationService.subscribe((notification) => {
      setNotifications(prev => [...prev, notification]);
    });

    // Load existing notifications
    setNotifications(notificationService.getNotifications());

    return unsubscribe;
  }, [notificationService]);

  const clearNotifications = useCallback(() => {
    notificationService.clearNotifications();
    setNotifications([]);
  }, [notificationService]);

  const clearNotificationsByType = useCallback((type) => {
    notificationService.clearNotificationsByType(type);
    setNotifications(notificationService.getNotifications());
  }, [notificationService]);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const getStats = useCallback(() => {
    return notificationService.getNotificationStats();
  }, [notificationService]);

  const getFormatHelp = useCallback((format) => {
    return notificationService.getFormatHelp(format);
  }, [notificationService]);

  return {
    notifications,
    clearNotifications,
    clearNotificationsByType,
    removeNotification,
    getStats,
    getFormatHelp,
    notificationService
  };
};

/**
 * Hook for format conversion status
 */
export const useFormatConversionStatus = () => {
  const [conversionStatus, setConversionStatus] = useState({
    isConverting: false,
    currentFormat: null,
    targetFormat: null,
    progress: 0,
    message: '',
    error: null
  });

  const [notificationService] = useState(() => getFormatNotificationService());

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((notification) => {
      if (notification.type === 'conversion_success') {
        setConversionStatus({
          isConverting: false,
          currentFormat: notification.details.originalFormat,
          targetFormat: notification.details.targetFormat,
          progress: 100,
          message: 'Conversion completed successfully',
          error: null
        });
      } else if (notification.type === 'conversion_error') {
        setConversionStatus({
          isConverting: false,
          currentFormat: null,
          targetFormat: notification.details.requestedFormat,
          progress: 0,
          message: notification.message,
          error: notification.details.error
        });
      } else if (notification.type === 'format_fallback') {
        setConversionStatus(prev => ({
          ...prev,
          targetFormat: notification.details.fallbackFormat,
          message: `Converting to ${notification.details.fallbackFormat.toUpperCase()} instead`
        }));
      }
    });

    return unsubscribe;
  }, [notificationService]);

  const startConversion = useCallback((currentFormat, targetFormat) => {
    setConversionStatus({
      isConverting: true,
      currentFormat,
      targetFormat,
      progress: 0,
      message: `Converting to ${targetFormat.toUpperCase()}...`,
      error: null
    });
  }, []);

  const updateProgress = useCallback((progress, message) => {
    setConversionStatus(prev => ({
      ...prev,
      progress,
      message
    }));
  }, []);

  const resetStatus = useCallback(() => {
    setConversionStatus({
      isConverting: false,
      currentFormat: null,
      targetFormat: null,
      progress: 0,
      message: '',
      error: null
    });
  }, []);

  return {
    conversionStatus,
    startConversion,
    updateProgress,
    resetStatus
  };
};

/**
 * Hook for format support information
 */
export const useFormatSupport = () => {
  const [supportInfo, setSupportInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkFormatSupport = useCallback(async (formats) => {
    setLoading(true);
    try {
      // This would typically call the enhanced format handler
      // For now, we'll provide a basic implementation
      const results = {};
      
      for (const format of formats) {
        // Basic browser format support check
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, 1, 1);

        try {
          const supported = await new Promise((resolve) => {
            canvas.toBlob((blob) => {
              resolve(blob && blob.type.includes(format));
            }, `image/${format}`, 0.8);
          });

          results[format] = {
            supported,
            method: supported ? 'canvas' : 'none',
            fallbacks: supported ? [] : ['jpeg', 'png']
          };
        } catch (error) {
          results[format] = {
            supported: false,
            method: 'none',
            error: error.message,
            fallbacks: ['jpeg', 'png']
          };
        }
      }

      setSupportInfo(results);
    } catch (error) {
      console.error('Format support check failed:', error);
      setSupportInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const getRecommendations = useCallback((useCase) => {
    const recommendations = {
      photos: {
        recommended: ['jpeg', 'webp'],
        alternative: ['avif'],
        avoid: ['png', 'bmp', 'tiff'],
        reason: 'JPEG and WebP provide excellent compression for photographic content'
      },
      graphics: {
        recommended: ['png', 'webp'],
        alternative: ['svg'],
        avoid: ['jpeg', 'bmp'],
        reason: 'PNG and WebP preserve sharp edges and transparency in graphics'
      },
      animations: {
        recommended: ['webp', 'mp4'],
        alternative: ['gif'],
        avoid: ['png', 'jpeg'],
        reason: 'WebP and MP4 provide better compression than GIF for animations'
      },
      printing: {
        recommended: ['png', 'tiff'],
        alternative: ['jpeg'],
        avoid: ['webp', 'gif'],
        reason: 'PNG and TIFF provide high quality suitable for printing'
      }
    };

    return recommendations[useCase] || recommendations.photos;
  }, []);

  return {
    supportInfo,
    loading,
    checkFormatSupport,
    getRecommendations
  };
};

export default useFormatNotifications;