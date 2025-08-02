/**
 * Main Collage Editor Component
 * Integrates with ImageCraft Pro's Glass Morphism Design System
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { 
  CollageState, 
  CollageEventHandlers, 
  SocialPlatform, 
  UserPhoto,
  ExportConfig,
  CollageTemplate,
  SlotAssignment,
  TextAssignment,
  BackgroundOverlay 
} from '../../types/collage';
import { PLATFORM_SPECS, COLLAGE_TEMPLATES } from '../../constants/collageTemplates';
import { TemplateSelector } from './TemplateSelector';
import { CollageCanvas } from './CollageCanvas';
import { PhotoUploader } from './PhotoUploader';
import { ExportPanel } from './ExportPanel';
import { generateUniqueId, validateImageFile, compressImage } from '../../utils/collageUtils';
import { exportCollage } from '../../utils/collageExport';

// Default initial state
const createInitialState = (platform = 'instagram-post') => ({
  template: null,
  platform,
  photos: [],
  slotAssignments: [],
  textAssignments: [],
  backgroundOverlay: undefined,
  canvasScale: 1,
  isExporting: false,
  isDirty: false
});

const CollageEditor = ({ 
  initialPlatform = 'instagram-post',
  onExport,
  onSave,
  onShare,
  className = '',
  showExportPanel = true,
  showTemplateSelector = true,
  maxPhotos = 20,
  ...props 
}) => {
  // Core state management
  const [state, setState] = useState(() => createInitialState(initialPlatform));
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [draggedPhoto, setDraggedPhoto] = useState(null);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Refs for DOM interactions
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Responsive state for mobile-first design
  const [viewportSize, setViewportSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Handle viewport resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate optimal canvas scale based on viewport
  const calculateCanvasScale = useCallback(() => {
    if (!state.template) return 1;
    
    const { width: screenWidth } = viewportSize;
    const platformSpec = PLATFORM_SPECS[state.platform];
    const { width: templateWidth } = platformSpec.dimensions;
    
    // Mobile-first scaling
    if (screenWidth <= 480) {
      return Math.min(0.8, (screenWidth - 40) / templateWidth);
    } else if (screenWidth <= 768) {
      return Math.min(1.0, (screenWidth - 80) / templateWidth);
    } else if (screenWidth <= 1024) {
      return Math.min(1.2, (screenWidth - 120) / templateWidth);
    }
    
    return Math.min(1.5, (screenWidth - 200) / templateWidth);
  }, [viewportSize, state.template, state.platform]);

  // Update canvas scale when viewport or template changes
  useEffect(() => {
    const newScale = calculateCanvasScale();
    if (newScale !== state.canvasScale) {
      setState(prev => ({ ...prev, canvasScale: newScale }));
    }
  }, [calculateCanvasScale, state.canvasScale]);

  // Template selection handler
  const handleTemplateSelect = useCallback((template) => {
    setState(prev => ({
      ...prev,
      template,
      slotAssignments: template.photoSlots.map(slot => ({
        slotId: slot.id,
        photoId: null,
        photo: undefined,
        transform: {
          scale: 1,
          x: 0,
          y: 0,
          rotation: 0
        }
      })),
      textAssignments: template.textOverlays?.map(overlay => ({
        overlayId: overlay.id,
        content: overlay.text,
        customStyle: {}
      })) || [],
      backgroundOverlay: template.backgroundOverlay,
      isDirty: true
    }));
    
    setSelectedSlotId(null);
    setError(null);
  }, []);

  // Platform change handler
  const handlePlatformChange = useCallback((platform) => {
    setState(prev => ({
      ...prev,
      platform,
      template: null, // Reset template when platform changes
      slotAssignments: [],
      textAssignments: [],
      isDirty: true
    }));
  }, []);

  // Photo upload handler with validation and compression
  const handlePhotoUpload = useCallback(async (files) => {
    if (!files || files.length === 0) return;
    
    setUploadProgress(0);
    const validFiles = [];
    
    try {
      for (let i = 0; i < files.length && state.photos.length + validFiles.length < maxPhotos; i++) {
        const file = files[i];
        
        // Validate file
        const validation = validateImageFile(file);
        if (!validation.isValid) {
          setError(`Invalid file: ${file.name} - ${validation.error}`);
          continue;
        }

        // Compress if needed
        const compressedFile = await compressImage(file, {
          maxWidth: 2048,
          maxHeight: 2048,
          quality: 0.9
        });

        // Create photo object
        const photo = {
          id: generateUniqueId(),
          file: compressedFile,
          url: URL.createObjectURL(compressedFile),
          name: file.name,
          size: compressedFile.size,
          dimensions: await getImageDimensions(compressedFile),
          uploadedAt: new Date()
        };
        
        validFiles.push(photo);
        setUploadProgress(((i + 1) / files.length) * 100);
      }

      if (validFiles.length > 0) {
        setState(prev => ({
          ...prev,
          photos: [...prev.photos, ...validFiles],
          isDirty: true
        }));
        setError(null);
      }
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploadProgress(0);
    }
  }, [state.photos.length, maxPhotos]);

  // Photo assignment to slot
  const handlePhotoAssign = useCallback((slotId, photoId) => {
    setState(prev => ({
      ...prev,
      slotAssignments: prev.slotAssignments.map(assignment =>
        assignment.slotId === slotId
          ? {
              ...assignment,
              photoId,
              photo: prev.photos.find(p => p.id === photoId)
            }
          : assignment
      ),
      isDirty: true
    }));
    
    setSelectedSlotId(null);
  }, []);

  // Photo removal from slot
  const handlePhotoRemove = useCallback((slotId) => {
    setState(prev => ({
      ...prev,
      slotAssignments: prev.slotAssignments.map(assignment =>
        assignment.slotId === slotId
          ? { ...assignment, photoId: null, photo: undefined }
          : assignment
      ),
      isDirty: true
    }));
  }, []);

  // Text update handler
  const handleTextUpdate = useCallback((overlayId, content) => {
    setState(prev => ({
      ...prev,
      textAssignments: prev.textAssignments.map(assignment =>
        assignment.overlayId === overlayId
          ? { ...assignment, content }
          : assignment
      ),
      isDirty: true
    }));
  }, []);

  // Background change handler
  const handleBackgroundChange = useCallback((overlay) => {
    setState(prev => ({
      ...prev,
      backgroundOverlay: overlay,
      isDirty: true
    }));
  }, []);

  // Export handler
  const handleExport = useCallback(async (config) => {
    if (!state.template) {
      setError('Please select a template first');
      return;
    }

    setState(prev => ({ ...prev, isExporting: true }));
    
    try {
      const exportData = {
        template: state.template,
        platform: state.platform,
        slotAssignments: state.slotAssignments,
        textAssignments: state.textAssignments,
        backgroundOverlay: state.backgroundOverlay,
        platformSpec: PLATFORM_SPECS[state.platform]
      };

      const result = await exportCollage(exportData, config);
      
      if (onExport) {
        await onExport(result);
      }
      
      setError(null);
      return result;
    } catch (err) {
      setError(`Export failed: ${err.message}`);
      throw err;
    } finally {
      setState(prev => ({ ...prev, isExporting: false }));
    }
  }, [state, onExport]);

  // Save handler
  const handleSave = useCallback(async () => {
    try {
      if (onSave) {
        await onSave(state);
      }
      setState(prev => ({ ...prev, isDirty: false }));
      setError(null);
    } catch (err) {
      setError(`Save failed: ${err.message}`);
    }
  }, [state, onSave]);

  // Reset handler
  const handleReset = useCallback(() => {
    setState(createInitialState(state.platform));
    setSelectedSlotId(null);
    setDraggedPhoto(null);
    setError(null);
    
    // Clean up object URLs
    state.photos.forEach(photo => {
      URL.revokeObjectURL(photo.url);
    });
  }, [state.platform]);

  // Drag and drop handlers
  const handleDragStart = useCallback((photoId) => {
    const photo = state.photos.find(p => p.id === photoId);
    setDraggedPhoto(photo);
  }, [state.photos]);

  const handleDragEnd = useCallback(() => {
    setDraggedPhoto(null);
  }, []);

  const handleSlotDrop = useCallback((slotId) => {
    if (draggedPhoto) {
      handlePhotoAssign(slotId, draggedPhoto.id);
    }
  }, [draggedPhoto, handlePhotoAssign]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setSelectedSlotId(null);
      setDraggedPhoto(null);
    }
  }, []);

  // Event handlers object for child components
  const eventHandlers = {
    onTemplateSelect: handleTemplateSelect,
    onPhotoUpload: handlePhotoUpload,
    onPhotoAssign: handlePhotoAssign,
    onPhotoRemove: handlePhotoRemove,
    onTextUpdate: handleTextUpdate,
    onBackgroundChange: handleBackgroundChange,
    onExport: handleExport,
    onSave: handleSave,
    onReset: handleReset
  };

  // Calculate responsive layout classes
  const getLayoutClasses = () => {
    const { width } = viewportSize;
    if (width <= 768) {
      return 'flex flex-col space-y-4'; // Mobile: stack vertically
    }
    return 'grid grid-cols-12 gap-6'; // Desktop: grid layout
  };

  const getCanvasContainerClasses = () => {
    const { width } = viewportSize;
    if (width <= 768) {
      return 'order-2'; // Mobile: canvas below controls
    }
    return 'col-span-8'; // Desktop: main area
  };

  const getSidebarClasses = () => {
    const { width } = viewportSize;
    if (width <= 768) {
      return 'order-1'; // Mobile: controls above canvas
    }
    return 'col-span-4'; // Desktop: sidebar
  };

  return (
    <div 
      className={`collage-editor w-full h-full ${className}`}
      onKeyDown={handleKeyDown}
      role="application"
      aria-label="Collage Editor"
      {...props}
    >
      {/* Error Display */}
      {error && (
        <Card variant="glass" className="mb-4 border-red-500/30 bg-red-50/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0" />
              <p className="text-red-700 text-sm font-medium">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Layout */}
      <div className={getLayoutClasses()}>
        {/* Canvas Area */}
        <div className={getCanvasContainerClasses()}>
          <Card variant="glass" className="h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {state.template ? state.template.name : 'Select a Template'}
                </h2>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>{PLATFORM_SPECS[state.platform].name}</span>
                  <span>•</span>
                  <span>{PLATFORM_SPECS[state.platform].dimensions.aspectRatio}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CollageCanvas
                ref={canvasRef}
                state={state}
                selectedSlotId={selectedSlotId}
                draggedPhoto={draggedPhoto}
                onSlotSelect={setSelectedSlotId}
                onSlotDrop={handleSlotDrop}
                onDragEnd={handleDragEnd}
                eventHandlers={eventHandlers}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Controls */}
        <div className={getSidebarClasses()}>
          <div className="space-y-4">
            {/* Template Selector */}
            {showTemplateSelector && (
              <TemplateSelector
                currentPlatform={state.platform}
                selectedTemplate={state.template}
                onPlatformChange={handlePlatformChange}
                onTemplateSelect={handleTemplateSelect}
              />
            )}

            {/* Photo Uploader */}
            <PhotoUploader
              photos={state.photos}
              maxPhotos={maxPhotos}
              uploadProgress={uploadProgress}
              onPhotoUpload={handlePhotoUpload}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />

            {/* Export Panel */}
            {showExportPanel && (
              <ExportPanel
                isExporting={state.isExporting}
                canExport={!!state.template && state.slotAssignments.some(a => a.photoId)}
                isDirty={state.isDirty}
                onExport={handleExport}
                onSave={handleSave}
                onReset={handleReset}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get image dimensions
const getImageDimensions = (file) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: `${img.naturalWidth}:${img.naturalHeight}`
      });
    };
    img.src = URL.createObjectURL(file);
  });
};

export default CollageEditor;