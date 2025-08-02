/**
 * Format Notification Display Component
 * Shows user-friendly notifications for format conversion issues and successes
 */

import React, { useEffect, useState } from 'react';
import { X, Info, CheckCircle, AlertTriangle, XCircle, ExternalLink } from 'lucide-react';
import { getFormatNotificationService } from '../utils/formatNotificationService';

const FormatNotificationDisplay = () => {
  const [notifications, setNotifications] = useState([]);
  const [notificationService] = useState(() => getFormatNotificationService());

  useEffect(() => {
    // Subscribe to notifications
    const unsubscribe = notificationService.subscribe((notification) => {
      setNotifications(prev => [...prev, notification]);

      // Auto-remove notifications after their duration
      if (notification.duration && notification.duration > 0) {
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, notification.duration);
      }
    });

    return unsubscribe;
  }, [notificationService]);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleAction = (action, data) => {
    switch (action) {
      case 'convert_format':
        // Trigger format conversion with new format
        window.dispatchEvent(new CustomEvent('format-conversion-requested', {
          detail: { format: data.format }
        }));
        break;
      
      case 'adjust_quality':
        // Trigger quality adjustment
        window.dispatchEvent(new CustomEvent('quality-adjustment-requested', {
          detail: { quality: data.quality }
        }));
        break;
      
      case 'resize_image':
        // Trigger image resize
        window.dispatchEvent(new CustomEvent('image-resize-requested', {
          detail: { maxDimension: data.maxDimension }
        }));
        break;
      
      case 'show_format_info':
        // Show format information modal
        window.dispatchEvent(new CustomEvent('format-info-requested', {
          detail: { format: data.format }
        }));
        break;
      
      case 'open_url':
        // Open external URL
        window.open(data.url, '_blank', 'noopener,noreferrer');
        break;
      
      default:
        console.log('Unknown action:', action, data);
    }
  };

  const getNotificationIcon = (level) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationStyle = (level) => {
    const baseStyle = "glass border-l-4 shadow-lg";
    
    switch (level) {
      case 'success':
        return `${baseStyle} border-l-green-500 bg-green-50/80`;
      case 'warning':
        return `${baseStyle} border-l-yellow-500 bg-yellow-50/80`;
      case 'error':
        return `${baseStyle} border-l-red-500 bg-red-50/80`;
      case 'info':
      default:
        return `${baseStyle} border-l-blue-500 bg-blue-50/80`;
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${getNotificationStyle(notification.level)} p-4 rounded-lg animate-in slide-in-from-right duration-300`}
        >
          <div className="flex items-start gap-3">
            {getNotificationIcon(notification.level)}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {notification.title}
                  </h4>
                  <p className="text-gray-700 text-sm mt-1">
                    {notification.message}
                  </p>
                </div>
                
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="ml-2 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Show statistics for successful conversions */}
              {notification.showStats && notification.details?.stats && (
                <div className="mt-2 text-xs text-gray-600 space-y-1">
                  {notification.details.stats.originalSize && notification.details.stats.finalSize && (
                    <div>
                      Size: {Math.round(notification.details.stats.originalSize / 1024)}KB → {Math.round(notification.details.stats.finalSize / 1024)}KB
                      {notification.details.stats.compressionRatio && (
                        <span className="ml-2">
                          ({Math.round((1 - notification.details.stats.compressionRatio) * 100)}% smaller)
                        </span>
                      )}
                    </div>
                  )}
                  {notification.details.stats.processingTime && (
                    <div>
                      Processing time: {Math.round(notification.details.stats.processingTime)}ms
                    </div>
                  )}
                  {notification.details.stats.method && (
                    <div>
                      Method: {notification.details.stats.method}
                    </div>
                  )}
                </div>
              )}

              {/* Action buttons */}
              {notification.actionable && notification.actions && notification.actions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {notification.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleAction(action.action, action.data)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-white/60 hover:bg-white/80 
                               border border-gray-200 rounded-md transition-colors"
                    >
                      {action.label}
                      {action.action === 'open_url' && <ExternalLink className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              )}

              {/* Technical details for errors */}
              {notification.level === 'error' && notification.details?.technicalMessage && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                    Technical Details
                  </summary>
                  <div className="mt-1 text-xs text-gray-600 font-mono bg-gray-100/50 p-2 rounded border">
                    {notification.details.technicalMessage}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Format Info Modal Component
 * Shows detailed information about image formats
 */
export const FormatInfoModal = ({ format, isOpen, onClose }) => {
  const [notificationService] = useState(() => getFormatNotificationService());
  const [formatInfo, setFormatInfo] = useState(null);

  useEffect(() => {
    if (format && isOpen) {
      const info = notificationService.getFormatHelp(format);
      setFormatInfo(info);
    }
  }, [format, isOpen, notificationService]);

  if (!isOpen || !formatInfo) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="glass bg-white/90 rounded-xl p-6 max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {format.toUpperCase()} Format Information
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Description</h4>
            <p className="text-gray-700">{formatInfo.description}</p>
          </div>

          {formatInfo.browserSupport && (
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Browser Support</h4>
              <p className="text-gray-700">{formatInfo.browserSupport}</p>
            </div>
          )}

          {formatInfo.alternatives && formatInfo.alternatives.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Alternatives</h4>
              <div className="flex flex-wrap gap-2">
                {formatInfo.alternatives.map((alt) => (
                  <span
                    key={alt}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                  >
                    {alt.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="font-medium text-gray-900 mb-1">Recommendation</h4>
            <p className="text-gray-700">{formatInfo.recommendation}</p>
          </div>

          {formatInfo.learnMoreUrl && (
            <div className="pt-2 border-t border-gray-200">
              <a
                href={formatInfo.learnMoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
              >
                Learn More <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormatNotificationDisplay;