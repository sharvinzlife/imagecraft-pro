/**
 * PhotoSlot Component
 * Glass morphism photo containers with drag & drop support
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';

const PhotoSlot = ({ 
  slot,
  position,
  assignment,
  isSelected,
  isDragOver,
  canvasScale,
  onSelect,
  onDrop,
  onRemove
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [imageError, setImageError] = useState(false);
  const slotRef = useRef(null);

  // Handle drag over
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  }, []);

  // Handle drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    onDrop();
  }, [onDrop]);

  // Handle click
  const handleClick = useCallback((e) => {
    e.stopPropagation();
    onSelect();
  }, [onSelect]);

  // Handle double click for photo selection
  const handleDoubleClick = useCallback((e) => {
    e.stopPropagation();
    // Trigger photo selection modal/picker
    // This would be implemented based on your photo selection UI
  }, []);

  // Calculate glass morphism styles based on slot style
  const getSlotStyles = useCallback(() => {
    const baseStyles = {
      position: 'absolute',
      left: position.x,
      top: position.y,
      width: position.width,
      height: position.height,
      transform: `rotate(${position.rotation}deg)`,
      zIndex: position.zIndex,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      borderRadius: '12px',
      overflow: 'hidden'
    };

    // Style variations based on slot.style
    switch (slot.style) {
      case 'glass':
        return {
          ...baseStyles,
          background: isSelected || isDragOver || isDraggingOver
            ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.3), rgba(255, 255, 255, 0.4))'
            : isHovered
            ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.25), rgba(255, 255, 255, 0.35))'
            : 'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(255, 255, 255, 0.3))',
          backdropFilter: 'blur(10px)',
          border: isSelected 
            ? '2px solid rgba(249, 115, 22, 0.8)'
            : isDragOver || isDraggingOver
            ? '2px dashed rgba(249, 115, 22, 0.6)'
            : '2px solid rgba(249, 115, 22, 0.3)',
          boxShadow: isSelected || isHovered
            ? '0 8px 32px rgba(249, 115, 22, 0.3)'
            : '0 4px 16px rgba(249, 115, 22, 0.1)'
        };

      case 'polaroid':
        return {
          ...baseStyles,
          background: '#ffffff',
          border: '8px solid #ffffff',
          boxShadow: isSelected || isHovered
            ? '0 8px 32px rgba(0, 0, 0, 0.3)'
            : '0 4px 16px rgba(0, 0, 0, 0.15)',
          borderRadius: '4px'
        };

      case 'magazine':
        return {
          ...baseStyles,
          background: '#ffffff',
          border: isSelected 
            ? '3px solid #f97316'
            : '1px solid rgba(0, 0, 0, 0.1)',
          boxShadow: isSelected || isHovered
            ? '0 12px 48px rgba(0, 0, 0, 0.2)'
            : '0 2px 8px rgba(0, 0, 0, 0.1)',
          borderRadius: '8px'
        };

      case 'clean':
      default:
        return {
          ...baseStyles,
          background: '#f9fafb',
          border: isSelected 
            ? '2px solid #f97316'
            : isDragOver || isDraggingOver
            ? '2px dashed #f97316'
            : '1px solid #e5e7eb',
          borderRadius: '8px'
        };
    }
  }, [position, slot.style, isSelected, isDragOver, isDraggingOver, isHovered]);

  // Get aspect ratio constraint styles
  const getAspectRatioStyles = useCallback(() => {
    if (!slot.aspectRatio || slot.aspectRatio === 'free') {
      return {};
    }

    const aspectRatios = {
      'square': '1/1',
      'portrait': '3/4',
      'landscape': '4/3'
    };

    return {
      aspectRatio: aspectRatios[slot.aspectRatio] || '1/1'
    };
  }, [slot.aspectRatio]);

  // Handle image load error
  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  // Handle image load success
  const handleImageLoad = useCallback(() => {
    setImageError(false);
  }, []);

  // Focus management for accessibility
  useEffect(() => {
    if (isSelected && slotRef.current) {
      slotRef.current.focus();
    }
  }, [isSelected]);

  return (
    <div
      ref={slotRef}
      style={getSlotStyles()}
      className="photo-slot group"
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
      role="button"
      aria-label={`Photo slot ${slot.id}${assignment?.photo ? ` with ${assignment.photo.name}` : ' - empty'}`}
      aria-selected={isSelected}
    >
      {/* Photo Content */}
      {assignment?.photo && !imageError ? (
        <div className="relative w-full h-full">
          <img
            src={assignment.photo.url}
            alt={assignment.photo.name}
            className="w-full h-full object-cover"
            style={getAspectRatioStyles()}
            onError={handleImageError}
            onLoad={handleImageLoad}
            draggable={false}
          />
          
          {/* Photo Transform Controls */}
          {isSelected && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="flex space-x-2">
                <button
                  className="p-2 bg-white/90 rounded-full text-gray-700 hover:bg-white transition-colors duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Implement photo adjustment
                  }}
                  aria-label="Adjust photo"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </button>
                
                <button
                  className="p-2 bg-red-500/90 rounded-full text-white hover:bg-red-500 transition-colors duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  aria-label="Remove photo"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty Slot Placeholder */
        <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
          {/* Drop Zone Icon */}
          <div 
            className={`p-3 rounded-full mb-3 transition-all duration-300 ${
              isDragOver || isDraggingOver
                ? 'bg-orange-500 scale-110'
                : isHovered
                ? 'bg-orange-500/80'
                : 'bg-orange-500/60'
            }`}
            style={{
              background: isDragOver || isDraggingOver || isHovered
                ? 'linear-gradient(135deg, #f97316, #fb923c)'
                : 'linear-gradient(135deg, rgba(249, 115, 22, 0.6), rgba(251, 146, 60, 0.6))'
            }}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>

          {/* Placeholder Text */}
          <div className="text-gray-600">
            <p className="text-sm font-medium mb-1">
              {isDragOver || isDraggingOver ? 'Drop photo here' : 'Add photo'}
            </p>
            <p className="text-xs opacity-75">
              {slot.aspectRatio && slot.aspectRatio !== 'free' 
                ? `${slot.aspectRatio} ratio`
                : 'Any size'
              }
            </p>
          </div>

          {/* Required Indicator */}
          {slot.required && (
            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></div>
          )}
        </div>
      )}

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Drag Over Indicator */}
      {(isDragOver || isDraggingOver) && (
        <div className="absolute inset-0 bg-orange-500/20 border-2 border-dashed border-orange-500 rounded-lg flex items-center justify-center">
          <div className="text-orange-600 text-center">
            <div 
              className="w-8 h-8 mx-auto mb-2 rounded-full bg-orange-500 flex items-center justify-center"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-xs font-medium">Drop here</p>
          </div>
        </div>
      )}

      {/* Touch Indicators for Mobile */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Corner resize handles for touch devices */}
        {isSelected && (
          <>
            <div className="absolute top-0 left-0 w-3 h-3 bg-orange-500 rounded-full -translate-x-1/2 -translate-y-1/2 md:hidden"></div>
            <div className="absolute top-0 right-0 w-3 h-3 bg-orange-500 rounded-full translate-x-1/2 -translate-y-1/2 md:hidden"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 bg-orange-500 rounded-full -translate-x-1/2 translate-y-1/2 md:hidden"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-orange-500 rounded-full translate-x-1/2 translate-y-1/2 md:hidden"></div>
          </>
        )}
      </div>
    </div>
  );
};

export default PhotoSlot;