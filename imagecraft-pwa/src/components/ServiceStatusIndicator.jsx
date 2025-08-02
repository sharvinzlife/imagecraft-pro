/**
 * Service Status Indicator Component
 * Shows the status of browser-based image processing services
 * No longer dependent on server connectivity
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle, XCircle, Loader2, RefreshCw, ChevronDown, ChevronUp, Monitor, Cpu } from 'lucide-react';
import { getImageProcessingService } from '../services/imageProcessingService';

const ServiceStatusIndicator = () => {
  const [status, setStatus] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [formatSupport, setFormatSupport] = useState(null);

  const updateStatus = async () => {
    try {
      const imageService = getImageProcessingService();
      const perfStats = imageService.getPerformanceStats();
      
      // Get format support if using modern processor
      let supportedFormats = [];
      if (imageService.useModernProcessor && imageService.modernProcessor) {
        supportedFormats = imageService.modernProcessor.getSupportedFormats();
      } else if (imageService.isInitialized) {
        try {
          supportedFormats = await imageService.getSupportedFormats();
        } catch (error) {
          console.warn('Could not get supported formats:', error);
        }
      }
      
      setStatus({
        initialized: imageService.isInitialized,
        usingModernProcessor: imageService.useModernProcessor,
        imageProcessingDetails: {
          initialized: imageService.isInitialized,
          workerReady: imageService.worker && imageService.worker.onmessage,
          pendingRequests: imageService.pendingRequests?.size || 0,
          usingModernProcessor: imageService.useModernProcessor,
          supportedFormats: supportedFormats.length,
          memoryUsage: perfStats.memoryUsage,
          modernProcessorStats: perfStats.modernProcessorStats
        }
      });
      
      setFormatSupport(supportedFormats);
    } catch (error) {
      console.error('Failed to update status:', error);
      setStatus({
        initialized: false,
        usingModernProcessor: false,
        imageProcessingDetails: {
          initialized: false,
          workerReady: false,
          pendingRequests: 0,
          error: error.message
        }
      });
    }
  };

  useEffect(() => {
    updateStatus();
    
    // Update status every 3 seconds (less frequent since it's browser-only)
    const interval = setInterval(updateStatus, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Destroy and recreate the service
      const imageService = getImageProcessingService();
      imageService.destroy();
      
      // Wait a moment then update status
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateStatus();
    } catch (error) {
      console.error('Service retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  if (!status) {
    return null;
  }

  const overallHealthy = status.initialized && status.imageProcessingDetails.initialized;

  return (
    <Card 
      variant="glassCream" 
      className={`fixed top-4 right-4 w-80 z-40 shadow-lg border transition-all duration-300 ${
        overallHealthy 
          ? 'border-green-200/50' 
          : 'border-orange-200/50'
      }`}
    >
      <CardHeader className="pb-2">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-2">
            {overallHealthy ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-orange-600" />
            )}
            <h3 className="font-bold text-gray-900 text-sm">
              {status.usingModernProcessor ? 'Browser Processing' : 'Worker Processing'}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              overallHealthy ? 'bg-green-500 animate-pulse' : 'bg-orange-500'
            }`} />
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            )}
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0 space-y-3">
          {/* Processing Method */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {status.usingModernProcessor ? (
                <Monitor className="w-4 h-4 text-blue-600" />
              ) : (
                <Cpu className="w-4 h-4 text-purple-600" />
              )}
              <span className="text-sm font-medium">
                {status.usingModernProcessor ? 'Canvas API' : 'Web Worker'}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              {status.initialized ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span className="text-xs text-gray-600">
                {status.initialized ? 'Ready' : 'Failed'}
              </span>
            </div>
          </div>

          {/* Format Support */}
          <div className="border-t border-white/20 pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Format Support</span>
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-xs text-gray-600">
                  {status.imageProcessingDetails.supportedFormats || 0} formats
                </span>
              </div>
            </div>
            
            {formatSupport && formatSupport.length > 0 && (
              <div className="text-xs text-gray-600">
                Supported: {formatSupport.join(', ').toUpperCase()}
              </div>
            )}

          </div>

          {/* Performance Stats */}
          <div className="border-t border-white/20 pt-3 space-y-2">
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Processing Method:</span>
                <span className="text-blue-600">
                  {status.usingModernProcessor ? 'Browser Canvas' : 'Web Worker'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Pending Requests:</span>
                <span>{status.imageProcessingDetails.pendingRequests}</span>
              </div>
              
              {status.imageProcessingDetails.memoryUsage && (
                <div className="flex justify-between">
                  <span>Memory Usage:</span>
                  <span>{status.imageProcessingDetails.memoryUsage.used}MB / {status.imageProcessingDetails.memoryUsage.limit}MB</span>
                </div>
              )}
              
              {status.imageProcessingDetails.modernProcessorStats && (
                <>
                  <div className="flex justify-between">
                    <span>Images Processed:</span>
                    <span>{status.imageProcessingDetails.modernProcessorStats.totalProcessed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Processing Time:</span>
                    <span>{Math.round(status.imageProcessingDetails.modernProcessorStats.averageProcessingTime)}ms</span>
                  </div>
                </>
              )}
              
              {status.imageProcessingDetails.error && (
                <div className="text-red-600 text-xs mt-2">
                  Error: {status.imageProcessingDetails.error}
                </div>
              )}
            </div>
          </div>

          {/* Retry Button */}
          {!overallHealthy && (
            <div className="border-t border-white/20 pt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetry}
                disabled={isRetrying}
                className="w-full text-xs hover:bg-orange-100/50"
              >
                {isRetrying ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    Reinitializing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 mr-2" />
                    Reinitialize Service
                  </>
                )}
              </Button>
            </div>
          )}
          
          {/* Info about browser-only processing */}
          <div className="border-t border-white/20 pt-2">
            <div className="text-xs text-gray-500 text-center">
              ✓ No server required - Fully offline processing
            </div>
          </div>

          {/* Debug Info */}
          <div className="border-t border-white/20 pt-2">
            <div className="text-xs text-gray-500 text-center">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ServiceStatusIndicator;