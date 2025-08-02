/**
 * Format Notification Service
 * Provides user-friendly notifications for format conversion processes
 */

/**
 * Format Notification Manager
 * Handles user notifications for format conversions, fallbacks, and errors
 */
class FormatNotificationService {
  constructor() {
    this.notifications = [];
    this.subscribers = new Set();
  }

  /**
   * Subscribe to notifications
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Emit notification to all subscribers
   */
  emit(notification) {
    this.notifications.push({
      ...notification,
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString()
    });

    this.subscribers.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Notification subscriber error:', error);
      }
    });
  }

  /**
   * Notify about format support issues
   */
  notifyFormatUnsupported(requestedFormat, fallbackFormat, reason) {
    this.emit({
      type: 'format_fallback',
      level: 'warning',
      title: `${requestedFormat.toUpperCase()} Format Not Supported`,
      message: `Your browser doesn't support ${requestedFormat.toUpperCase()} format. Converting to ${fallbackFormat.toUpperCase()} instead.`,
      details: {
        requestedFormat,
        fallbackFormat,
        reason,
        action: 'fallback_conversion'
      },
      duration: 6000,
      actionable: true,
      actions: [{
        label: 'Learn More',
        action: 'show_format_info',
        data: { format: requestedFormat }
      }]
    });
  }

  /**
   * Notify about successful format conversion
   */
  notifyConversionSuccess(originalFormat, targetFormat, wasDirectConversion, stats = {}) {
    const title = wasDirectConversion 
      ? `Converted to ${targetFormat.toUpperCase()}`
      : `Converted via Fallback to ${targetFormat.toUpperCase()}`;

    const message = wasDirectConversion
      ? `Successfully converted your image to ${targetFormat.toUpperCase()} format.`
      : `Successfully converted using fallback to ${targetFormat.toUpperCase()} format.`;

    this.emit({
      type: 'conversion_success',
      level: 'success',
      title,
      message,
      details: {
        originalFormat,
        targetFormat,
        wasDirectConversion,
        stats,
        action: 'conversion_complete'
      },
      duration: 4000,
      showStats: true
    });
  }

  /**
   * Notify about conversion errors
   */
  notifyConversionError(requestedFormat, error, suggestedActions = []) {
    this.emit({
      type: 'conversion_error',
      level: 'error',
      title: `${requestedFormat.toUpperCase()} Conversion Failed`,
      message: `Unable to convert to ${requestedFormat.toUpperCase()} format. ${error.message}`,
      details: {
        requestedFormat,
        error: error.message,
        suggestedActions,
        action: 'conversion_failed'
      },
      duration: 8000,
      actionable: true,
      actions: suggestedActions.map(action => ({
        label: action.label,
        action: action.action,
        data: action.data
      }))
    });
  }

  /**
   * Notify about format limitations
   */
  notifyFormatLimitation(format, limitation, workaround = null) {
    this.emit({
      type: 'format_limitation',
      level: 'info',
      title: `${format.toUpperCase()} Format Limitation`,
      message: `${limitation}${workaround ? ` ${workaround}` : ''}`,
      details: {
        format,
        limitation,
        workaround,
        action: 'format_limitation'
      },
      duration: 5000,
      actionable: !!workaround
    });
  }

  /**
   * Notify about quality adjustments
   */
  notifyQualityAdjustment(format, originalQuality, adjustedQuality, reason) {
    this.emit({
      type: 'quality_adjustment',
      level: 'info',
      title: 'Quality Settings Adjusted',
      message: `Quality adjusted from ${originalQuality} to ${adjustedQuality} for ${format.toUpperCase()} format.`,
      details: {
        format,
        originalQuality,
        adjustedQuality,
        reason,
        action: 'quality_adjusted'
      },
      duration: 4000
    });
  }

  /**
   * Notify about progressive processing
   */
  notifyProgressiveProcessing(fileName, reason) {
    this.emit({
      type: 'progressive_processing',
      level: 'info',
      title: 'Using Progressive Processing',
      message: `Processing ${fileName} in chunks for optimal performance.`,
      details: {
        fileName,
        reason,
        action: 'progressive_processing'
      },
      duration: 3000
    });
  }

  /**
   * Notify about RAW conversion
   */
  notifyRawConversion(rawFormat, outputFormat, isRecommended) {
    const message = isRecommended
      ? `Converting ${rawFormat.toUpperCase()} to recommended ${outputFormat.toUpperCase()} format.`
      : `Converting ${rawFormat.toUpperCase()} to ${outputFormat.toUpperCase()} format.`;

    this.emit({
      type: 'raw_conversion',
      level: isRecommended ? 'success' : 'info',
      title: 'RAW Format Conversion',
      message,
      details: {
        rawFormat,
        outputFormat,
        isRecommended,
        action: 'raw_conversion'
      },
      duration: 4000
    });
  }

  /**
   * Get format-specific help information
   */
  getFormatHelp(format) {
    const formatHelp = {
      'avif': {
        description: 'AVIF offers excellent compression but has limited browser encoding support.',
        browserSupport: 'Chrome 85+, Firefox 93+, Safari 16+',
        alternatives: ['WebP', 'JPEG'],
        recommendation: 'Use WebP for better compatibility or JPEG for universal support.',
        learnMoreUrl: 'https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types#avif'
      },
      'tiff': {
        description: 'TIFF is a high-quality format but not supported by browser Canvas API.',
        browserSupport: 'Limited to Safari for viewing, no Canvas encoding support',
        alternatives: ['PNG', 'JPEG'],
        recommendation: 'Use PNG for lossless quality or JPEG for smaller file sizes.',
        learnMoreUrl: 'https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types#tiff'
      },
      'gif': {
        description: 'GIF reading is supported but encoding via Canvas is limited.',
        browserSupport: 'Universal reading, limited encoding',
        alternatives: ['PNG', 'WebP', 'MP4'],
        recommendation: 'Use PNG for static images or WebP/MP4 for animations.',
        learnMoreUrl: 'https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types#gif'
      },
      'webp': {
        description: 'WebP offers excellent compression with good browser support.',
        browserSupport: 'Chrome 23+, Firefox 65+, Safari 14+, Edge 18+',
        alternatives: ['JPEG', 'PNG'],
        recommendation: 'Excellent choice for modern web applications.',
        learnMoreUrl: 'https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types#webp'
      },
      'bmp': {
        description: 'BMP is an uncompressed format with limited web usage.',
        browserSupport: 'Varies by browser for Canvas encoding',
        alternatives: ['PNG', 'JPEG'],
        recommendation: 'Use PNG for lossless compression or JPEG for photos.',
        learnMoreUrl: 'https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types#bmp'
      }
    };

    return formatHelp[format.toLowerCase()] || {
      description: `${format.toUpperCase()} format information not available.`,
      recommendation: 'Consider using JPEG for photos or PNG for graphics.'
    };
  }

  /**
   * Generate user-friendly error messages
   */
  generateErrorMessage(error, context = {}) {
    const { requestedFormat, fallbackFormat, operation } = context;

    // Browser compatibility errors
    if (error.message.includes('not supported') || error.message.includes('unsupported')) {
      return {
        userMessage: `Your browser doesn't support ${requestedFormat?.toUpperCase() || 'this'} format.`,
        technicalMessage: error.message,
        suggestion: fallbackFormat 
          ? `We'll convert to ${fallbackFormat.toUpperCase()} instead.`
          : 'Please try a different format like JPEG or PNG.',
        actions: this.getSuggestedActions(requestedFormat, error)
      };
    }

    // Memory/size errors
    if (error.message.includes('memory') || error.message.includes('too large')) {
      return {
        userMessage: 'The image is too large to process.',
        technicalMessage: error.message,
        suggestion: 'Try reducing the image size or using a different quality setting.',
        actions: [
          { label: 'Use Lower Quality', action: 'adjust_quality', data: { quality: 'low' } },
          { label: 'Resize Image', action: 'resize_image', data: { maxDimension: 2048 } }
        ]
      };
    }

    // Format-specific errors
    if (error.message.includes('RAW')) {
      return {
        userMessage: 'RAW files require special handling.',
        technicalMessage: error.message,
        suggestion: 'RAW files can only be converted to JPEG or PNG formats.',
        actions: [
          { label: 'Convert to JPEG', action: 'convert_format', data: { format: 'jpeg' } },
          { label: 'Convert to PNG', action: 'convert_format', data: { format: 'png' } }
        ]
      };
    }

    // Generic error
    return {
      userMessage: `${operation || 'Image processing'} failed.`,
      technicalMessage: error.message,
      suggestion: 'Please try again or use a different format.',
      actions: [
        { label: 'Try JPEG', action: 'convert_format', data: { format: 'jpeg' } },
        { label: 'Try PNG', action: 'convert_format', data: { format: 'png' } }
      ]
    };
  }

  /**
   * Get suggested actions for errors
   */
  getSuggestedActions(requestedFormat, error) {
    const actions = [];

    if (requestedFormat) {
      const help = this.getFormatHelp(requestedFormat);
      
      help.alternatives?.forEach(alt => {
        actions.push({
          label: `Try ${alt.toUpperCase()}`,
          action: 'convert_format',
          data: { format: alt.toLowerCase() }
        });
      });

      if (help.learnMoreUrl) {
        actions.push({
          label: 'Learn More',
          action: 'open_url',
          data: { url: help.learnMoreUrl }
        });
      }
    }

    return actions;
  }

  /**
   * Get all notifications
   */
  getNotifications() {
    return [...this.notifications];
  }

  /**
   * Clear all notifications
   */
  clearNotifications() {
    this.notifications = [];
  }

  /**
   * Clear notifications by type
   */
  clearNotificationsByType(type) {
    this.notifications = this.notifications.filter(n => n.type !== type);
  }

  /**
   * Get statistics about notifications
   */
  getNotificationStats() {
    const stats = {
      total: this.notifications.length,
      byType: {},
      byLevel: {},
      recent: 0
    };

    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    this.notifications.forEach(notification => {
      // Count by type
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
      
      // Count by level
      stats.byLevel[notification.level] = (stats.byLevel[notification.level] || 0) + 1;
      
      // Count recent notifications
      if (new Date(notification.timestamp).getTime() > oneHourAgo) {
        stats.recent++;
      }
    });

    return stats;
  }
}

// Create singleton instance
let formatNotificationService = null;

export const getFormatNotificationService = () => {
  if (!formatNotificationService) {
    formatNotificationService = new FormatNotificationService();
  }
  return formatNotificationService;
};

export const destroyFormatNotificationService = () => {
  if (formatNotificationService) {
    formatNotificationService = null;
  }
};

export default FormatNotificationService;