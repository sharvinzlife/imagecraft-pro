/**
 * PhotoUploader Component
 * Glass morphism photo upload and management interface
 */

import React, { useCallback, useRef, useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { formatFileSize } from '../../utils/collageUtils';

const PhotoUploader = ({ 
  photos,
  maxPhotos,
  uploadProgress,
  onPhotoUpload,
  onDragStart,
  onDragEnd,
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Handle file input change
  const handleFileChange = useCallback((e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onPhotoUpload(files);
    }
    // Reset input value to allow re-uploading the same file
    e.target.value = '';
  }, [onPhotoUpload]);

  // Handle drag over
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  // Handle drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onPhotoUpload(files);
    }
  }, [onPhotoUpload]);

  // Handle click to open file dialog
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle photo drag start
  const handlePhotoDragStart = useCallback((e, photoId) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', photoId);
    onDragStart(photoId);
  }, [onDragStart]);

  // Handle photo drag end
  const handlePhotoDragEnd = useCallback(() => {
    onDragEnd();
  }, [onDragEnd]);

  const canUploadMore = photos.length < maxPhotos;

  return (
    <Card variant="glassSubtle" className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Photos
          </h3>
          <div className="text-sm text-gray-600">
            {photos.length} / {maxPhotos}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Upload Area */}
        {canUploadMore && (
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 cursor-pointer ${
              isDragOver
                ? 'border-orange-500 bg-orange-50/50 scale-[1.02]'
                : 'border-orange-500/30 hover:border-orange-500/50 hover:bg-white/30'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleUploadClick}
            role="button"
            tabIndex={0}
            aria-label="Upload photos"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleUploadClick();
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              aria-describedby="upload-instructions"
            />

            <div className="flex flex-col items-center space-y-3">
              <div 
                className={`p-4 rounded-full transition-all duration-300 ${
                  isDragOver ? 'scale-110' : 'hover:scale-105'
                }`}
                style={{
                  background: isDragOver 
                    ? 'linear-gradient(135deg, #f97316, #fb923c)'
                    : 'linear-gradient(135deg, rgba(249, 115, 22, 0.8), rgba(251, 146, 60, 0.8))'
                }}
              >
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>

              <div>
                <p className="text-gray-800 font-medium mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {isDragOver ? 'Drop photos here' : 'Add Photos'}
                </p>
                <p id="upload-instructions" className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Drag & drop or click to browse<br />
                  JPG, PNG, WebP up to 10MB each
                </p>
              </div>
            </div>

            {/* Upload Progress */}
            {uploadProgress > 0 && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 relative">
                    <svg className="w-12 h-12 text-orange-500 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <p className="text-gray-700 font-medium">Uploading... {Math.round(uploadProgress)}%</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Photo Grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {photos.map((photo) => (
              <PhotoThumbnail
                key={photo.id}
                photo={photo}
                onDragStart={(e) => handlePhotoDragStart(e, photo.id)}
                onDragEnd={handlePhotoDragEnd}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {photos.length === 0 && !canUploadMore && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No photos uploaded</p>
            <p className="text-gray-400 text-sm mt-1">Add some photos to get started</p>
          </div>
        )}

        {/* Upload Limit Reached */}
        {!canUploadMore && (
          <div className="text-center py-4 px-4 bg-orange-50/50 border border-orange-200/50 rounded-lg">
            <p className="text-orange-600 text-sm font-medium">
              Maximum {maxPhotos} photos reached
            </p>
            <p className="text-orange-500 text-xs mt-1">
              Remove photos to add new ones
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Individual Photo Thumbnail Component
const PhotoThumbnail = ({ photo, onDragStart, onDragEnd }) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageError(false);
  }, []);

  return (
    <div
      className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing transition-all duration-300 hover:scale-105"
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="img"
      aria-label={`Photo: ${photo.name}`}
    >
      {!imageError ? (
        <img
          src={photo.url}
          alt={photo.name}
          className="w-full h-full object-cover"
          onError={handleImageError}
          onLoad={handleImageLoad}
          draggable={false}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-200">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      )}

      {/* Overlay with photo info */}
      <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
          <p className="text-xs font-medium truncate" title={photo.name}>
            {photo.name}
          </p>
          <p className="text-xs opacity-75">
            {formatFileSize(photo.size)}
          </p>
          <p className="text-xs opacity-75">
            {photo.dimensions.width}×{photo.dimensions.height}
          </p>
        </div>

        {/* Drag indicator */}
        <div className="absolute top-2 right-2 p-1 bg-white/20 rounded">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </div>
      </div>

      {/* Selection border for accessibility */}
      <div className="absolute inset-0 ring-2 ring-transparent group-focus:ring-orange-500 rounded-lg transition-all duration-200" />
    </div>
  );
};

export default PhotoUploader;