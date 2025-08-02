/**
 * CollageCanvas Component
 * Responsive rendering area with glass morphism photo slots
 */

import React, { forwardRef, useCallback, useMemo } from 'react';
import { PLATFORM_SPECS } from '../../constants/collageTemplates';
import { PhotoSlot } from './PhotoSlot';
import { TextOverlay } from './TextOverlay';

const CollageCanvas = forwardRef(({ 
  state,
  selectedSlotId,
  draggedPhoto,
  onSlotSelect,
  onSlotDrop,
  onDragEnd,
  eventHandlers,
  className = ''
}, ref) => {
  const { template, platform, slotAssignments, textAssignments, backgroundOverlay, canvasScale } = state;

  // Get platform specifications
  const platformSpec = PLATFORM_SPECS[platform];
  
  // Calculate canvas dimensions
  const canvasDimensions = useMemo(() => {
    if (!platformSpec) return { width: 400, height: 400 };
    
    const { width, height } = platformSpec.dimensions;
    return {
      width: width * canvasScale,
      height: height * canvasScale,
      originalWidth: width,
      originalHeight: height
    };
  }, [platformSpec, canvasScale]);

  // Background overlay styles
  const backgroundStyles = useMemo(() => {
    const baseStyles = {
      width: canvasDimensions.width,
      height: canvasDimensions.height,
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '12px',
      margin: '0 auto'
    };

    if (backgroundOverlay) {
      return {
        ...baseStyles,
        background: backgroundOverlay.value,
        opacity: backgroundOverlay.opacity || 1,
        mixBlendMode: backgroundOverlay.blendMode || 'normal'
      };
    }

    // Default glass morphism background
    return {
      ...baseStyles,
      background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(255, 255, 255, 0.2))',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(249, 115, 22, 0.2)'
    };
  }, [canvasDimensions, backgroundOverlay]);

  // Handle canvas drop
  const handleCanvasDrop = useCallback((e) => {
    e.preventDefault();
    onDragEnd();
  }, [onDragEnd]);

  const handleCanvasDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  // Convert percentage positions to pixel positions
  const getPixelPosition = useCallback((position) => {
    return {
      x: (position.x / 100) * canvasDimensions.width,
      y: (position.y / 100) * canvasDimensions.height,
      width: (position.width / 100) * canvasDimensions.width,
      height: (position.height / 100) * canvasDimensions.height,
      rotation: position.rotation || 0,
      zIndex: position.zIndex || 1
    };
  }, [canvasDimensions]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!selectedSlotId) return;

    const currentIndex = template.photoSlots.findIndex(slot => slot.id === selectedSlotId);
    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowRight':
      case 'Tab':
        e.preventDefault();
        nextIndex = (currentIndex + 1) % template.photoSlots.length;
        break;
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : template.photoSlots.length - 1;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        // Trigger photo selection for current slot
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        eventHandlers.onPhotoRemove(selectedSlotId);
        break;
      default:
        return;
    }

    if (nextIndex !== currentIndex) {
      onSlotSelect(template.photoSlots[nextIndex].id);
    }
  }, [selectedSlotId, template, onSlotSelect, eventHandlers]);

  if (!template) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-lg ${className}`} style={{ height: '400px' }}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">Select a template to get started</p>
          <p className="text-gray-400 text-sm mt-1">Choose from our collection of social media templates</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`collage-canvas-container ${className}`}
      role="application"
      aria-label="Collage canvas"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Canvas Wrapper */}
      <div className="flex justify-center">
        <div
          ref={ref}
          className="collage-canvas relative"
          style={backgroundStyles}
          onDrop={handleCanvasDrop}
          onDragOver={handleCanvasDragOver}
          aria-label={`${template.name} canvas - ${platformSpec.dimensions.width}x${platformSpec.dimensions.height} pixels`}
        >
          {/* Background Pattern Overlay */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23f97316" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              opacity: 0.3
            }}
          />

          {/* Photo Slots */}
          {template.photoSlots.map(slot => {
            const pixelPosition = getPixelPosition(slot.position);
            const assignment = slotAssignments.find(a => a.slotId === slot.id);
            
            return (
              <PhotoSlot
                key={slot.id}
                slot={slot}
                position={pixelPosition}
                assignment={assignment}
                isSelected={selectedSlotId === slot.id}
                isDragOver={draggedPhoto && selectedSlotId === slot.id}
                canvasScale={canvasScale}
                onSelect={() => onSlotSelect(slot.id)}
                onDrop={() => onSlotDrop(slot.id)}
                onRemove={() => eventHandlers.onPhotoRemove(slot.id)}
              />
            );
          })}

          {/* Text Overlays */}
          {template.textOverlays?.map(overlay => {
            const pixelPosition = getPixelPosition(overlay.position);
            const assignment = textAssignments.find(a => a.overlayId === overlay.id);
            
            return (
              <TextOverlay
                key={overlay.id}
                overlay={overlay}
                position={pixelPosition}
                assignment={assignment}
                canvasScale={canvasScale}
                onUpdate={(content) => eventHandlers.onTextUpdate(overlay.id, content)}
              />
            );
          })}

          {/* Canvas Info Overlay */}
          <div className="absolute top-2 left-2 px-2 py-1 bg-black/20 backdrop-blur-sm rounded text-white text-xs font-medium">
            {platformSpec.dimensions.width}×{platformSpec.dimensions.height}
          </div>

          {/* Scale Indicator */}
          <div className="absolute top-2 right-2 px-2 py-1 bg-black/20 backdrop-blur-sm rounded text-white text-xs font-medium">
            {Math.round(canvasScale * 100)}%
          </div>

          {/* Drop Zone Indicator */}
          {draggedPhoto && (
            <div className="absolute inset-0 bg-orange-500/10 border-2 border-dashed border-orange-500/50 rounded-lg flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div 
                  className="w-12 h-12 mx-auto mb-2 rounded-full bg-orange-500 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="text-orange-600 font-medium text-sm">Drop photo into any slot</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Canvas Controls */}
      <div className="mt-4 flex items-center justify-center space-x-4">
        {/* Zoom Controls */}
        <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm border border-orange-500/30 rounded-lg p-2">
          <button
            onClick={() => {/* Implement zoom out */}}
            className="p-1 text-gray-600 hover:text-orange-500 transition-colors duration-200"
            aria-label="Zoom out"
            disabled={canvasScale <= 0.5}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          
          <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-center">
            {Math.round(canvasScale * 100)}%
          </span>
          
          <button
            onClick={() => {/* Implement zoom in */}}
            className="p-1 text-gray-600 hover:text-orange-500 transition-colors duration-200"
            aria-label="Zoom in"
            disabled={canvasScale >= 2}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Canvas Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onSlotSelect(null)}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors duration-200"
            disabled={!selectedSlotId}
          >
            Clear Selection
          </button>
        </div>
      </div>

      {/* Accessibility Instructions */}
      <div className="sr-only" aria-live="polite">
        {selectedSlotId && (
          `Selected slot ${selectedSlotId}. Use arrow keys to navigate, Enter to select photo, Delete to remove photo.`
        )}
      </div>
    </div>
  );
});

CollageCanvas.displayName = 'CollageCanvas';

export default CollageCanvas;