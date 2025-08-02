import React, { useState, useCallback, useEffect } from 'react';
import { X, ZoomIn, FileImage, Info, Download, Loader2 } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent } from './ui/dialog';
import { cn } from '../lib/utils';

const ImagePreview = ({ files = [], onRemove, className = '' }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [imageMetadata, setImageMetadata] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [errorStates, setErrorStates] = useState({});

  // Load image metadata
  useEffect(() => {
    files.forEach((file) => {
      if (file && file.type && file.type.startsWith('image/') && !imageMetadata[file.name]) {
        const reader = new FileReader();
        
        setLoadingStates(prev => ({ ...prev, [file.name]: true }));
        
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            setImageMetadata(prev => ({
              ...prev,
              [file.name]: {
                width: img.width,
                height: img.height,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified,
                url: e.target.result
              }
            }));
            setLoadingStates(prev => ({ ...prev, [file.name]: false }));
          };
          
          img.onerror = () => {
            setErrorStates(prev => ({ ...prev, [file.name]: true }));
            setLoadingStates(prev => ({ ...prev, [file.name]: false }));
          };
          
          img.src = e.target.result;
        };
        
        reader.onerror = () => {
          setErrorStates(prev => ({ ...prev, [file.name]: true }));
          setLoadingStates(prev => ({ ...prev, [file.name]: false }));
        };
        
        reader.readAsDataURL(file);
      }
    });
  }, [files, imageMetadata]);

  // Format file size
  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Format image type
  const formatImageType = useCallback((type) => {
    const typeMap = {
      'image/jpeg': 'JPEG',
      'image/png': 'PNG',
      'image/webp': 'WebP',
      'image/gif': 'GIF',
      'image/svg+xml': 'SVG',
    };
    return typeMap[type] || type.split('/')[1]?.toUpperCase() || 'Unknown';
  }, []);

  // Download image
  const handleDownload = useCallback((file) => {
    const metadata = imageMetadata[file.name];
    if (metadata?.url) {
      const link = document.createElement('a');
      link.href = metadata.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [imageMetadata]);

  // Modern Lightbox component using shadcn/ui Dialog
  const Lightbox = ({ image, open, onClose }) => {
    const metadata = imageMetadata[image?.name];

    if (!metadata?.url) return null;

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent 
          className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 border-0 bg-transparent shadow-none"
          showCloseButton={false}
        >
          {/* Custom close button - positioned outside image area */}
          <Button
            variant="ghost"
            size="lg"
            className="fixed top-4 right-4 z-[10001] bg-black/70 backdrop-blur-md hover:bg-black/90 text-white hover:text-orange-400 transition-all duration-300 hover:scale-110 border border-white/30 shadow-2xl rounded-full w-12 h-12 p-0"
            onClick={onClose}
            aria-label="Close preview"
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Image container with mobile-first responsive design */}
          <div className="relative flex items-center justify-center w-full h-full min-h-[50vh] max-h-[95vh]">
            <img 
              src={metadata.url} 
              alt={image.name}
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              style={{ 
                maxWidth: '100%',
                maxHeight: '95vh',
                objectFit: 'contain'
              }}
            />
            
            {/* Metadata overlay - responsive design */}
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent rounded-b-xl">
              <div className="text-white space-y-1">
                <h3 className="font-semibold text-sm sm:text-lg truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {image.name}
                </h3>
                <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-200 flex-wrap" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <span>{metadata.width} × {metadata.height}px</span>
                  <span>{formatFileSize(metadata.size)}</span>
                  <span>{formatImageType(metadata.type)}</span>
                </div>
              </div>
              
              {/* Action buttons in lightbox */}
              <div className="flex items-center justify-end gap-2 mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white border border-white/30"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(image);
                  }}
                  aria-label="Download image"
                >
                  <Download className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (!files || files.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          Image Preview {files.length > 1 && `(${files.length} files)`}
        </h3>
      </div>

      {/* Preview Grid - Mobile-first responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {files.map((file, index) => {
          const metadata = imageMetadata[file.name];
          const isLoading = loadingStates[file.name];
          const hasError = errorStates[file.name];
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={`${file.name}-${index}`}
              className="relative group"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <Card 
                variant="glass" 
                className={cn(
                  "relative overflow-hidden cursor-pointer transition-all duration-300",
                  "hover:scale-105 hover:shadow-2xl",
                  isHovered && "ring-2 ring-orange-500/50"
                )}
                onClick={() => !isLoading && !hasError && setSelectedImage(file)}
              >
                <div className="relative aspect-square">
                  {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50">
                      <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                    </div>
                  ) : hasError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/50 p-4">
                      <FileImage className="w-8 h-8 text-red-400 mb-2" />
                      <span className="text-xs text-red-600 text-center">Failed to load</span>
                    </div>
                  ) : metadata?.url ? (
                    <>
                      <img
                        src={metadata.url}
                        alt={file.name}
                        className="w-full h-full object-cover transition-transform duration-300"
                        style={{
                          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                        }}
                      />
                      
                      {/* Hover overlay - Mobile-first design */}
                      <div className={cn(
                        "absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent",
                        "opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300",
                        "flex flex-col justify-end p-2 sm:p-3"
                      )}>
                        <div className="text-white space-y-1">
                          <p className="text-xs font-medium truncate">{file.name}</p>
                          <p className="text-xs opacity-90">
                            {metadata.width} × {metadata.height}
                          </p>
                          <p className="text-xs opacity-90">
                            {formatFileSize(metadata.size)}
                          </p>
                        </div>
                        
                        {/* Action buttons - Smaller, refined design */}
                        <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-6 h-6 p-0 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white rounded-md transition-all duration-200 hover:scale-110"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImage(file);
                            }}
                            aria-label="View full size"
                          >
                            <ZoomIn className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-6 h-6 p-0 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white rounded-md transition-all duration-200 hover:scale-110"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(file);
                            }}
                            aria-label="Download image"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          {onRemove && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-6 h-6 p-0 bg-red-600/50 backdrop-blur-sm hover:bg-red-600/70 text-white rounded-md transition-all duration-200 hover:scale-110"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemove(index);
                              }}
                              aria-label="Remove image"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50">
                      <FileImage className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
              </Card>

              {/* Metadata tooltip on hover - Hidden on mobile to avoid clutter */}
              {isHovered && metadata && !isLoading && !hasError && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10 pointer-events-none hidden sm:block">
                  <div className="bg-gray-900/90 backdrop-blur-md text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Info className="w-3 h-3" />
                      <span>{formatImageType(metadata.type)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modern Lightbox */}
      <Lightbox 
        image={selectedImage} 
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)} 
      />
    </div>
  );
};

export default ImagePreview;