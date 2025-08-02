import React, { useState, useCallback } from 'react';
import { 
  Download, 
  Archive, 
  CheckCircle, 
  FileImage,
  Folder,
  X,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { useNotifications } from '../store/appStore';
import { downloadAsZip, estimateBatchSize } from '../utils/zipDownload';



const BatchDownloadPanel = ({ 
  completedItems = [], 
  onDownloadAll,
  onClearResults,
  className = ''
}) => {
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadingItem, setDownloadingItem] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const { addNotification } = useNotifications();

  // Select/deselect items
  const toggleSelection = useCallback((itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedItems(new Set(completedItems.map(item => item.id)));
  }, [completedItems]);

  const selectNone = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  // Download individual file
  const downloadIndividual = useCallback(async (item) => {
    if (!item.result || !item.result.url) {
      addNotification({
        type: 'error',
        title: 'Download Failed',
        message: 'File URL not available for download.',
      });
      return;
    }

    setDownloadingItem(item.id);
    
    try {
      const a = document.createElement('a');
      a.href = item.result.url;
      a.download = item.fileName || 'processed-image';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      addNotification({
        type: 'success',
        title: 'Download Started',
        message: `Downloading ${item.fileName}`,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Download Failed',
        message: error.message || 'Failed to download file.',
      });
    } finally {
      setDownloadingItem(null);
    }
  }, [addNotification]);

  // Download selected files as ZIP
  const downloadSelected = useCallback(async () => {
    const selectedFiles = completedItems.filter(item => selectedItems.has(item.id));
    
    if (selectedFiles.length === 0) {
      addNotification({
        type: 'warning',
        title: 'No Files Selected',
        message: 'Please select files to download.',
      });
      return;
    }

    setDownloadingAll(true);
    
    try {
      if (selectedFiles.length === 1) {
        // Single file - direct download
        await downloadIndividual(selectedFiles[0]);
      } else {
        // Multiple files - ZIP download
        addNotification({
          type: 'info',
          title: 'Creating ZIP Archive',
          message: `Preparing ${selectedFiles.length} files for download...`,
        });

        const result = await downloadAsZip(selectedFiles, 'selected-images.zip');
        
        if (!result.success) {
          throw new Error(result.message || 'Download failed');
        }
        
        addNotification({
          type: 'success',
          title: 'Batch Download Complete',
          message: `Downloaded ${selectedFiles.length} files.`,
        });
      }
      
      if (onDownloadAll) {
        onDownloadAll(selectedFiles);
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Batch Download Failed',
        message: error.message || 'Failed to download selected files.',
      });
    } finally {
      setDownloadingAll(false);
    }
  }, [completedItems, selectedItems, downloadIndividual, onDownloadAll, addNotification]);

  // Download all files
  const downloadAllFiles = useCallback(async () => {
    if (completedItems.length === 0) return;

    setDownloadingAll(true);
    
    try {
      if (completedItems.length === 1) {
        // Single file - direct download
        await downloadIndividual(completedItems[0]);
      } else {
        // Multiple files - ZIP download
        addNotification({
          type: 'info',
          title: 'Creating ZIP Archive',
          message: `Preparing ${completedItems.length} files for download...`,
        });

        const result = await downloadAsZip(completedItems, 'batch-processed-images.zip');
        
        if (!result.success) {
          throw new Error(result.message || 'Download failed');
        }
        
        addNotification({
          type: 'success',
          title: 'Batch Download Complete',
          message: `Downloaded all ${completedItems.length} files.`,
        });
      }
      
      if (onDownloadAll) {
        onDownloadAll(completedItems);
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Batch Download Failed',
        message: error.message || 'Failed to download all files.',
      });
    } finally {
      setDownloadingAll(false);
    }
  }, [completedItems, downloadIndividual, onDownloadAll, addNotification]);

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getProcessingTypeLabel = (type) => {
    switch (type) {
      case 'convert':
        return 'Format Conversion';
      case 'edit':
        return 'Image Enhancement';
      case 'ai-style':
        return 'AI Style Transfer';
      default:
        return 'Image Processing';
    }
  };

  if (completedItems.length === 0) {
    return null;
  }

  const selectedCount = selectedItems.size;
  const allSelected = selectedCount === completedItems.length;
  const batchSizeInfo = estimateBatchSize(completedItems);
  const selectedSizeInfo = selectedCount > 0 ? estimateBatchSize(completedItems.filter(item => selectedItems.has(item.id))) : null;

  return (
    <Card variant="glassCream" className={`${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-lg font-bold text-slate-800 mb-1" 
                style={{ fontFamily: 'Poppins, sans-serif', textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)' }}>
              <CheckCircle className="w-5 h-5 inline mr-2 text-emerald-600" />
              Processing Complete
            </h4>
            <div className="space-y-1">
              <p className="text-sm text-slate-600 font-medium">
                {completedItems.length} file{completedItems.length === 1 ? '' : 's'} ready for download
              </p>
              {batchSizeInfo.totalSize > 0 && (
                <p className="text-xs text-slate-500">
                  Total size: {batchSizeInfo.formattedSize}
                </p>
              )}
            </div>
          </div>
          
          <Button
            variant="glassSecondary"
            size="sm"
            onClick={onClearResults}
            className="flex items-center space-x-2"
            aria-label="Clear results and start over"
          >
            <X className="w-4 h-4" />
            <span>Clear</span>
          </Button>
        </div>

        {/* Selection Controls */}
        <div className="flex items-center justify-between mb-4 p-3 bg-white/25 border border-white/30 rounded-lg backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={allSelected ? selectNone : selectAll}
                className="text-xs px-2 py-1 h-6"
              >
                {allSelected ? 'Select None' : 'Select All'}
              </Button>
              <div className="text-xs text-slate-600 space-y-1">
                <div>{selectedCount} of {completedItems.length} selected</div>
                {selectedSizeInfo && selectedSizeInfo.totalSize > 0 && (
                  <div>Selected size: {selectedSizeInfo.formattedSize}</div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {selectedCount > 0 && (
              <Button
                variant="glassPrimary"
                size="sm"
                onClick={downloadSelected}
                disabled={downloadingAll}
                className="flex items-center space-x-2"
              >
                {downloadingAll ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : selectedCount === 1 ? (
                  <Download className="w-4 h-4" />
                ) : (
                  <Archive className="w-4 h-4" />
                )}
                <span>
                  Download {selectedCount === 1 ? 'Selected' : `${selectedCount} as ZIP`}
                  {selectedSizeInfo && selectedCount > 1 && (
                    <span className="ml-1 text-xs opacity-75">({selectedSizeInfo.formattedSize})</span>
                  )}
                </span>
              </Button>
            )}
            
            <Button
              variant="glassSecondary"
              size="sm"
              onClick={downloadAllFiles}
              disabled={downloadingAll || completedItems.length === 0}
              className="flex items-center space-x-2"
            >
              {downloadingAll ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : completedItems.length === 1 ? (
                <Download className="w-4 h-4" />
              ) : (
                <Archive className="w-4 h-4" />
              )}
              <span>
              Download All {completedItems.length > 1 ? 'as ZIP' : ''}
                {completedItems.length > 1 && batchSizeInfo.totalSize > 0 && (
                    <span className="ml-1 text-xs opacity-75">({batchSizeInfo.formattedSize})</span>
                  )}
                </span>
            </Button>
          </div>
        </div>

        {/* Files List */}
        <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
          {completedItems.map((item) => {
            const isSelected = selectedItems.has(item.id);
            const isDownloading = downloadingItem === item.id;
            
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between p-4 rounded-lg border backdrop-blur-sm transition-all duration-200 cursor-pointer ${
                  isSelected 
                    ? 'bg-orange-50/60 border-orange-200 shadow-sm' 
                    : 'bg-white/25 border-white/30 hover:bg-white/35 hover:border-white/40'
                }`}
                onClick={() => toggleSelection(item.id)}
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleSelection(item.id);
                  }
                }}
              >
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  {/* Selection Checkbox */}
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                    isSelected 
                      ? 'bg-orange-500 border-orange-500' 
                      : 'border-slate-300 hover:border-orange-400'
                  }`}>
                    {isSelected && (
                      <CheckCircle className="w-3 h-3 text-white" />
                    )}
                  </div>
                  
                  {/* File Icon */}
                  <div className="flex-shrink-0 p-2 rounded-lg bg-gradient-to-br from-white/20 to-white/10">
                    <FileImage className="w-5 h-5 text-slate-600" />
                  </div>
                  
                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate" 
                       style={{ fontFamily: 'Inter, sans-serif', textShadow: '0 1px 1px rgba(255, 255, 255, 0.6)' }}>
                      {item.fileName}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-slate-600 mt-1">
                      <span>{getProcessingTypeLabel(item.type)}</span>
                      {item.result && item.result.size && (
                        <>
                          <span>•</span>
                          <span>{formatFileSize(item.result.size)}</span>
                        </>
                      )}
                      {item.result && item.result.format && (
                        <>
                          <span>•</span>
                          <span className="uppercase">{item.result.format}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Preview/Info */}
                  {item.result && item.result.thumbnailUrl && (
                    <div className="flex-shrink-0">
                      <img
                        src={item.result.thumbnailUrl}
                        alt={`Preview of ${item.fileName}`}
                        className="w-12 h-12 object-cover rounded-lg border border-white/40"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
                
                {/* Individual Download Button */}
                <div className="flex items-center space-x-2 ml-4">
                  {item.result && item.result.url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadIndividual(item);
                      }}
                      disabled={isDownloading}
                      className="p-2 h-8 w-8 text-slate-600 hover:text-orange-600 hover:bg-orange-100/50"
                      aria-label={`Download ${item.fileName}`}
                    >
                      {isDownloading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                  
                  {item.result && item.result.url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(item.result.url, '_blank');
                      }}
                      className="p-2 h-8 w-8 text-slate-600 hover:text-blue-600 hover:bg-blue-100/50"
                      aria-label={`Open ${item.fileName} in new tab`}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Download Info */}
        <div className="mt-6 p-3 bg-blue-50/60 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <Folder className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                Batch Download Options
              </p>
              <ul className="text-xs text-blue-700 mt-1 space-y-1">
                <li>• Single files: Direct download</li>
                <li>• Multiple files: Downloaded as ZIP archive</li>
                <li>• Select specific files or download all at once</li>
                <li>• Files are processed and ready for immediate download</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BatchDownloadPanel;