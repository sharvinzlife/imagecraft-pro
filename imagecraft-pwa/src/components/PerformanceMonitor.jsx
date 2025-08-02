/**
 * Performance Monitor Component
 * Shows real-time performance statistics for image processing
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Activity, Clock, MemoryStick, Zap, TrendingUp, X } from 'lucide-react';
import { getImageProcessingService } from '../services/imageProcessingService';

const PerformanceMonitor = ({ onClose }) => {
  const [stats, setStats] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    const updateStats = async () => {
      try {
        const service = getImageProcessingService();
        const performanceStats = service.getPerformanceStats();
        
        // Get browser memory info if available
        const memoryInfo = performanceStats.memoryUsage;
        
        setStats({
          ...performanceStats,
          browserMemory: memoryInfo,
          timestamp: new Date().toLocaleTimeString()
        });
      } catch (error) {
        console.warn('Failed to get performance stats:', error);
      }
    };

    // Initial update
    updateStats();

    // Set up refresh interval
    const interval = setInterval(updateStats, 2000); // Update every 2 seconds
    setRefreshInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    onClose?.();
  };

  const formatMemory = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatTime = (ms) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${Math.round(ms)} ms`;
    return `${(ms / 1000).toFixed(1)} s`;
  };

  if (!isVisible || !stats) {
    return null;
  }

  return (
    <Card 
      variant="glassCream" 
      className="fixed bottom-4 right-4 w-80 z-50 shadow-2xl border-2 border-orange-200/50 animate-in slide-in-from-bottom-4 duration-300"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-orange-600" />
            <h3 className="font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Performance Monitor
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-xs text-gray-500">{stats.timestamp}</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="w-6 h-6 p-0 hover:bg-red-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Processing Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Images Processed</span>
            </div>
            <span className="text-sm font-bold text-gray-900">
              {stats.processedImages || 0}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Avg Processing</span>
            </div>
            <span className="text-sm font-bold text-gray-900">
              {formatTime(stats.averageProcessingTime)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium">Total Time</span>
            </div>
            <span className="text-sm font-bold text-gray-900">
              {formatTime(stats.totalProcessingTime)}
            </span>
          </div>
        </div>

        {/* Memory Usage */}
        {stats.browserMemory && (
          <div className="border-t border-white/20 pt-3 space-y-3">
            <div className="flex items-center space-x-2 mb-2">
              <MemoryStick className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium">Browser Memory</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Used</span>
                <span className="font-medium">{stats.browserMemory.used || 'N/A'} MB</span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Total</span>
                <span className="font-medium">{stats.browserMemory.total || 'N/A'} MB</span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Limit</span>
                <span className="font-medium">{stats.browserMemory.limit || 'N/A'} MB</span>
              </div>
              
              {stats.browserMemory.used && stats.browserMemory.total && (
                <div className="w-full bg-gray-200/50 rounded-full h-2 mt-2">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(100, (stats.browserMemory.used / stats.browserMemory.total) * 100)}%` 
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Service Status */}
        <div className="border-t border-white/20 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Service Status</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                stats.isInitialized ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`} />
              <span className="text-xs text-gray-600">
                {stats.isInitialized ? 'Ready' : 'Initializing'}
              </span>
            </div>
          </div>
          
          {stats.pendingRequests > 0 && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-medium">Pending Tasks</span>
              <span className="text-sm font-bold text-orange-600">
                {stats.pendingRequests}
              </span>
            </div>
          )}
        </div>

        {/* Performance Tips */}
        {stats.browserMemory?.used > 500 && (
          <div className="border-t border-white/20 pt-3">
            <div className="bg-yellow-50/80 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <div className="w-4 h-4 bg-yellow-400 rounded-full flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-yellow-800">Performance Tip</div>
                  <div className="text-xs text-yellow-700 mt-1">
                    High memory usage detected. Consider processing smaller images or refreshing the page.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PerformanceMonitor;