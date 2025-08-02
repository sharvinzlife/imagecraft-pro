/**
 * Collage Components Export
 * Main export file for all collage-related components
 */

export { default as CollageEditor } from './CollageEditor';
export { default as TemplateSelector } from './TemplateSelector';
export { default as CollageCanvas } from './CollageCanvas';
export { default as PhotoSlot } from './PhotoSlot';
export { default as TextOverlay } from './TextOverlay';
export { default as PhotoUploader } from './PhotoUploader';
export { default as ExportPanel } from './ExportPanel';
export { default as BackgroundSelector } from './BackgroundSelector';
export { default as BackgroundOverlay } from './BackgroundOverlay';

// Re-export utilities for convenience
export { 
  exportCollage, 
  exportMultipleFormats, 
  downloadBlob 
} from '../../utils/collageExport';

export { 
  generateUniqueId,
  validateImageFile,
  compressImage,
  formatFileSize,
  storage
} from '../../utils/collageUtils';

// Re-export constants and types
export {
  PLATFORM_SPECS,
  COLLAGE_TEMPLATES,
  TEMPLATE_CATEGORIES,
  POPULAR_TEMPLATES,
  RESPONSIVE_BREAKPOINTS,
  getTemplatesByCategory,
  getTemplatesByPlatform,
  getTemplateById,
  searchTemplates
} from '../../constants/collageTemplates';

export * from '../../types/collage';