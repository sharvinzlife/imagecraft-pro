/**
 * Collage Template System Type Definitions
 * Designed for ImageCraft Pro's Glass Morphism Design System
 */

// Social Media Platform Types
export type SocialPlatform = 
  | 'instagram-story' 
  | 'instagram-post' 
  | 'facebook-post' 
  | 'twitter-post' 
  | 'tiktok' 
  | 'linkedin-post';

// Template Category Types
export type TemplateCategory = 
  | 'photo-grids' 
  | 'magazine-style' 
  | 'polaroid-style' 
  | 'mood-boards' 
  | 'timeline-story' 
  | 'before-after';

// Dimensions for exact social media specifications
export interface Dimensions {
  width: number;
  height: number;
  aspectRatio: string;
}

// Platform specifications with exact pixel dimensions
export interface PlatformSpec {
  platform: SocialPlatform;
  name: string;
  dimensions: Dimensions;
  description: string;
  recommendedTemplates: TemplateCategory[];
}

// Position and size for photo slots
export interface SlotPosition {
  x: number; // Percentage (0-100)
  y: number; // Percentage (0-100)
  width: number; // Percentage (0-100)
  height: number; // Percentage (0-100)
  rotation?: number; // Degrees (-45 to 45)
  zIndex?: number; // Layering order
}

// Photo slot configuration
export interface PhotoSlot {
  id: string;
  position: SlotPosition;
  aspectRatio?: 'square' | 'portrait' | 'landscape' | 'free';
  style: 'glass' | 'polaroid' | 'magazine' | 'clean';
  placeholder?: string;
  required?: boolean;
}

// Text overlay configuration
export interface TextOverlay {
  id: string;
  position: SlotPosition;
  text: string;
  fontSize: number; // rem units
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
  color: string;
  textAlign: 'left' | 'center' | 'right';
  fontFamily?: 'Poppins' | 'Inter' | 'system';
  background?: 'glass' | 'solid' | 'none';
  maxLines?: number;
}

// Background overlay configuration
export interface BackgroundOverlay {
  type: 'gradient' | 'solid' | 'pattern' | 'glass';
  value: string; // CSS value
  opacity: number; // 0-1
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay';
}

// Complete template definition
export interface CollageTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  platforms: SocialPlatform[];
  description: string;
  thumbnail: string; // Preview image URL
  photoSlots: PhotoSlot[];
  textOverlays?: TextOverlay[];
  backgroundOverlay?: BackgroundOverlay;
  tags: string[];
  isPopular?: boolean;
  isPremium?: boolean;
}

// User photo data
export interface UserPhoto {
  id: string;
  file: File;
  url: string; // Object URL
  name: string;
  size: number;
  dimensions: Dimensions;
  uploadedAt: Date;
}

// Photo slot assignment
export interface SlotAssignment {
  slotId: string;
  photoId: string | null;
  photo?: UserPhoto;
  transform?: {
    scale: number;
    x: number; // Offset in pixels
    y: number; // Offset in pixels
    rotation: number;
  };
}

// Text content assignment
export interface TextAssignment {
  overlayId: string;
  content: string;
  customStyle?: Partial<TextOverlay>;
}

// Export configuration
export interface ExportConfig {
  format: 'png' | 'jpeg' | 'webp';
  quality: number; // 0.1-1.0
  scale: number; // Export scale multiplier
  includedWatermark?: boolean;
  backgroundColor?: string;
}

// Export result
export interface ExportResult {
  blob: Blob;
  url: string;
  filename: string;
  dimensions: Dimensions;
  size: number; // File size in bytes
}

// Collage state for the editor
export interface CollageState {
  template: CollageTemplate | null;
  platform: SocialPlatform;
  photos: UserPhoto[];
  slotAssignments: SlotAssignment[];
  textAssignments: TextAssignment[];
  backgroundOverlay?: BackgroundOverlay;
  canvasScale: number; // UI scale for responsive display
  isExporting: boolean;
  isDirty: boolean; // Has unsaved changes
}

// Template filter options
export interface TemplateFilters {
  category?: TemplateCategory;
  platform?: SocialPlatform;
  tags?: string[];
  isPopular?: boolean;
  isPremium?: boolean;
  searchQuery?: string;
}

// Responsive breakpoints for mobile-first design
export interface ResponsiveBreakpoints {
  mobile: number; // 320px
  mobileLg: number; // 480px
  tablet: number; // 768px
  desktop: number; // 1024px
  desktopLg: number; // 1280px
  desktopXl: number; // 1440px
}

// Touch interaction types for mobile
export type TouchInteraction = 
  | 'drag' 
  | 'pinch' 
  | 'rotate' 
  | 'tap' 
  | 'long-press';

// Accessibility configuration
export interface AccessibilityConfig {
  announceChanges: boolean;
  keyboardNavigation: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderSupport: boolean;
  focusManagement: boolean;
}

// Component event handlers
export interface CollageEventHandlers {
  onTemplateSelect: (template: CollageTemplate) => void;
  onPhotoUpload: (files: FileList) => void;
  onPhotoAssign: (slotId: string, photoId: string) => void;
  onPhotoRemove: (slotId: string) => void;
  onTextUpdate: (overlayId: string, content: string) => void;
  onBackgroundChange: (overlay: BackgroundOverlay) => void;
  onExport: (config: ExportConfig) => Promise<ExportResult>;
  onSave: () => void;
  onReset: () => void;
}

// Performance optimization types
export interface PerformanceConfig {
  lazyLoadImages: boolean;
  maxImageSize: number; // Max file size in bytes
  imageCompression: boolean;
  thumbnailGeneration: boolean;
  memoryLimit: number; // Max memory usage in MB
}

// Error types for better error handling
export type CollageError = 
  | 'TEMPLATE_LOAD_FAILED'
  | 'IMAGE_UPLOAD_FAILED'
  | 'IMAGE_TOO_LARGE'
  | 'EXPORT_FAILED'
  | 'SAVE_FAILED'
  | 'INVALID_DIMENSIONS'
  | 'UNSUPPORTED_FORMAT';

export interface CollageErrorInfo {
  type: CollageError;
  message: string;
  details?: string;
  recovery?: string;
}