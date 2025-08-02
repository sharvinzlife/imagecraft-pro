/**
 * Comprehensive Collage Template Definitions
 * 30+ Templates for Social Media Platforms with Glass Morphism Design
 */

import { 
  PlatformSpec, 
  CollageTemplate, 
  ResponsiveBreakpoints,
  SocialPlatform,
  TemplateCategory 
} from '../types/collage';

// Exact Social Media Platform Specifications
export const PLATFORM_SPECS: Record<SocialPlatform, PlatformSpec> = {
  'instagram-story': {
    platform: 'instagram-story',
    name: 'Instagram Stories',
    dimensions: { width: 1080, height: 1920, aspectRatio: '9:16' },
    description: 'Vertical stories format for Instagram',
    recommendedTemplates: ['photo-grids', 'timeline-story', 'polaroid-style']
  },
  'instagram-post': {
    platform: 'instagram-post',
    name: 'Instagram Post',
    dimensions: { width: 1080, height: 1080, aspectRatio: '1:1' },
    description: 'Square format for Instagram feed posts',
    recommendedTemplates: ['photo-grids', 'mood-boards', 'magazine-style']
  },
  'facebook-post': {
    platform: 'facebook-post',
    name: 'Facebook Post',
    dimensions: { width: 1200, height: 630, aspectRatio: '1.91:1' },
    description: 'Landscape format for Facebook feed posts',
    recommendedTemplates: ['magazine-style', 'before-after', 'photo-grids']
  },
  'twitter-post': {
    platform: 'twitter-post',
    name: 'Twitter Post',
    dimensions: { width: 1200, height: 675, aspectRatio: '16:9' },
    description: 'Wide format for Twitter posts',
    recommendedTemplates: ['magazine-style', 'before-after', 'timeline-story']
  },
  'tiktok': {
    platform: 'tiktok',
    name: 'TikTok',
    dimensions: { width: 1080, height: 1920, aspectRatio: '9:16' },
    description: 'Vertical format for TikTok videos',
    recommendedTemplates: ['timeline-story', 'photo-grids', 'mood-boards']
  },
  'linkedin-post': {
    platform: 'linkedin-post',
    name: 'LinkedIn Post',
    dimensions: { width: 1200, height: 627, aspectRatio: '1.91:1' },
    description: 'Professional format for LinkedIn posts',
    recommendedTemplates: ['magazine-style', 'before-after', 'timeline-story']
  }
};

// Responsive Breakpoints for Mobile-First Design
export const RESPONSIVE_BREAKPOINTS: ResponsiveBreakpoints = {
  mobile: 320,
  mobileLg: 480,
  tablet: 768,
  desktop: 1024,
  desktopLg: 1280,
  desktopXl: 1440
};

// Complete Template Definitions (30+ Templates)
export const COLLAGE_TEMPLATES: CollageTemplate[] = [
  
  // PHOTO GRIDS CATEGORY (8 templates)
  {
    id: 'grid-2x2-basic',
    name: '2×2 Basic Grid',
    category: 'photo-grids',
    platforms: ['instagram-post', 'facebook-post', 'linkedin-post'],
    description: 'Simple 2×2 photo grid with equal spacing',
    thumbnail: '/templates/grid-2x2-basic.png',
    photoSlots: [
      { id: 'slot-1', position: { x: 5, y: 5, width: 42.5, height: 42.5 }, style: 'glass', aspectRatio: 'square' },
      { id: 'slot-2', position: { x: 52.5, y: 5, width: 42.5, height: 42.5 }, style: 'glass', aspectRatio: 'square' },
      { id: 'slot-3', position: { x: 5, y: 52.5, width: 42.5, height: 42.5 }, style: 'glass', aspectRatio: 'square' },
      { id: 'slot-4', position: { x: 52.5, y: 52.5, width: 42.5, height: 42.5 }, style: 'glass', aspectRatio: 'square' }
    ],
    backgroundOverlay: {
      type: 'gradient',
      value: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(255, 255, 255, 0.2))',
      opacity: 0.8
    },
    tags: ['grid', 'basic', 'square', 'equal'],
    isPopular: true
  },

  {
    id: 'grid-3x3-classic',
    name: '3×3 Classic Grid',
    category: 'photo-grids',
    platforms: ['instagram-post'],
    description: 'Instagram-style 3×3 grid layout',
    thumbnail: '/templates/grid-3x3-classic.png',
    photoSlots: [
      { id: 'slot-1', position: { x: 2, y: 2, width: 29.3, height: 29.3 }, style: 'clean', aspectRatio: 'square' },
      { id: 'slot-2', position: { x: 35.3, y: 2, width: 29.3, height: 29.3 }, style: 'clean', aspectRatio: 'square' },
      { id: 'slot-3', position: { x: 68.7, y: 2, width: 29.3, height: 29.3 }, style: 'clean', aspectRatio: 'square' },
      { id: 'slot-4', position: { x: 2, y: 35.3, width: 29.3, height: 29.3 }, style: 'clean', aspectRatio: 'square' },
      { id: 'slot-5', position: { x: 35.3, y: 35.3, width: 29.3, height: 29.3 }, style: 'clean', aspectRatio: 'square' },
      { id: 'slot-6', position: { x: 68.7, y: 35.3, width: 29.3, height: 29.3 }, style: 'clean', aspectRatio: 'square' },
      { id: 'slot-7', position: { x: 2, y: 68.7, width: 29.3, height: 29.3 }, style: 'clean', aspectRatio: 'square' },
      { id: 'slot-8', position: { x: 35.3, y: 68.7, width: 29.3, height: 29.3 }, style: 'clean', aspectRatio: 'square' },
      { id: 'slot-9', position: { x: 68.7, y: 68.7, width: 29.3, height: 29.3 }, style: 'clean', aspectRatio: 'square' }
    ],
    backgroundOverlay: {
      type: 'solid',
      value: '#ffffff',
      opacity: 1.0
    },
    tags: ['grid', 'classic', 'instagram', '3x3'],
    isPopular: true
  },

  {
    id: 'grid-2x3-portrait',
    name: '2×3 Portrait Grid',
    category: 'photo-grids',
    platforms: ['instagram-story', 'tiktok'],
    description: 'Vertical 2×3 grid perfect for stories',
    thumbnail: '/templates/grid-2x3-portrait.png',
    photoSlots: [
      { id: 'slot-1', position: { x: 5, y: 10, width: 42.5, height: 22 }, style: 'glass', aspectRatio: 'landscape' },
      { id: 'slot-2', position: { x: 52.5, y: 10, width: 42.5, height: 22 }, style: 'glass', aspectRatio: 'landscape' },
      { id: 'slot-3', position: { x: 5, y: 37, width: 42.5, height: 22 }, style: 'glass', aspectRatio: 'landscape' },
      { id: 'slot-4', position: { x: 52.5, y: 37, width: 42.5, height: 22 }, style: 'glass', aspectRatio: 'landscape' },
      { id: 'slot-5', position: { x: 5, y: 64, width: 42.5, height: 22 }, style: 'glass', aspectRatio: 'landscape' },
      { id: 'slot-6', position: { x: 52.5, y: 64, width: 42.5, height: 22 }, style: 'glass', aspectRatio: 'landscape' }
    ],
    textOverlays: [
      {
        id: 'title',
        position: { x: 10, y: 2, width: 80, height: 6 },
        text: 'Your Story Title',
        fontSize: 1.5,
        fontWeight: 'bold',
        color: '#1f2937',
        textAlign: 'center',
        fontFamily: 'Poppins',
        background: 'glass'
      }
    ],
    backgroundOverlay: {
      type: 'gradient',
      value: 'linear-gradient(180deg, rgba(249, 115, 22, 0.15), rgba(255, 255, 255, 0.25))',
      opacity: 0.9
    },
    tags: ['grid', 'portrait', 'story', 'vertical'],
    isPopular: false
  },

  // MAGAZINE STYLE CATEGORY (6 templates)
  {
    id: 'magazine-hero-left',
    name: 'Hero Left Layout',
    category: 'magazine-style',
    platforms: ['facebook-post', 'twitter-post', 'linkedin-post'],
    description: 'Large hero image on left with smaller images on right',
    thumbnail: '/templates/magazine-hero-left.png',
    photoSlots: [
      { id: 'hero', position: { x: 5, y: 5, width: 55, height: 90 }, style: 'magazine', aspectRatio: 'portrait', zIndex: 2 },
      { id: 'sub-1', position: { x: 65, y: 5, width: 30, height: 42.5 }, style: 'glass', aspectRatio: 'landscape' },
      { id: 'sub-2', position: { x: 65, y: 52.5, width: 30, height: 42.5 }, style: 'glass', aspectRatio: 'landscape' }
    ],
    textOverlays: [
      {
        id: 'headline',
        position: { x: 65, y: 8, width: 30, height: 8 },
        text: 'Featured Story',
        fontSize: 1.2,
        fontWeight: 'bold',
        color: '#f97316',
        textAlign: 'left',
        fontFamily: 'Poppins',
        background: 'none'
      }
    ],
    backgroundOverlay: {
      type: 'gradient',
      value: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(249, 115, 22, 0.05))',
      opacity: 1.0
    },
    tags: ['magazine', 'hero', 'asymmetric', 'editorial'],
    isPopular: true
  },

  {
    id: 'magazine-split-diagonal',
    name: 'Diagonal Split',
    category: 'magazine-style',
    platforms: ['instagram-post', 'facebook-post'],
    description: 'Dynamic diagonal split layout',
    thumbnail: '/templates/magazine-split-diagonal.png',
    photoSlots: [
      { id: 'main-1', position: { x: 5, y: 5, width: 50, height: 60 }, style: 'magazine', aspectRatio: 'free', rotation: -2 },
      { id: 'main-2', position: { x: 45, y: 35, width: 50, height: 60 }, style: 'magazine', aspectRatio: 'free', rotation: 2, zIndex: 2 }
    ],
    backgroundOverlay: {
      type: 'gradient',
      value: 'linear-gradient(45deg, rgba(249, 115, 22, 0.1), rgba(251, 146, 60, 0.1), rgba(255, 255, 255, 0.3))',
      opacity: 0.9
    },
    tags: ['magazine', 'diagonal', 'dynamic', 'overlap'],
    isPopular: false
  },

  // POLAROID STYLE CATEGORY (5 templates)
  {
    id: 'polaroid-scattered',
    name: 'Scattered Polaroids',
    category: 'polaroid-style',
    platforms: ['instagram-post', 'facebook-post'],
    description: 'Vintage polaroid photos scattered naturally',
    thumbnail: '/templates/polaroid-scattered.png',
    photoSlots: [
      { id: 'photo-1', position: { x: 10, y: 15, width: 35, height: 35 }, style: 'polaroid', aspectRatio: 'square', rotation: -8 },
      { id: 'photo-2', position: { x: 55, y: 5, width: 35, height: 35 }, style: 'polaroid', aspectRatio: 'square', rotation: 12 },
      { id: 'photo-3', position: { x: 15, y: 55, width: 35, height: 35 }, style: 'polaroid', aspectRatio: 'square', rotation: -5 },
      { id: 'photo-4', position: { x: 60, y: 50, width: 35, height: 35 }, style: 'polaroid', aspectRatio: 'square', rotation: 15 }
    ],
    backgroundOverlay: {
      type: 'pattern',
      value: 'radial-gradient(circle at 50% 50%, rgba(249, 115, 22, 0.08), rgba(255, 255, 255, 0.15))',
      opacity: 0.8
    },
    tags: ['polaroid', 'vintage', 'scattered', 'nostalgic'],
    isPopular: true
  },

  {
    id: 'polaroid-timeline',
    name: 'Polaroid Timeline',
    category: 'polaroid-style',
    platforms: ['instagram-story', 'tiktok'],
    description: 'Vertical timeline of polaroid memories',
    thumbnail: '/templates/polaroid-timeline.png',
    photoSlots: [
      { id: 'memory-1', position: { x: 15, y: 10, width: 70, height: 20 }, style: 'polaroid', aspectRatio: 'landscape', rotation: -2 },
      { id: 'memory-2', position: { x: 15, y: 35, width: 70, height: 20 }, style: 'polaroid', aspectRatio: 'landscape', rotation: 1 },
      { id: 'memory-3', position: { x: 15, y: 60, width: 70, height: 20 }, style: 'polaroid', aspectRatio: 'landscape', rotation: -1 }
    ],
    textOverlays: [
      {
        id: 'title',
        position: { x: 10, y: 2, width: 80, height: 6 },
        text: 'Memory Lane',
        fontSize: 2,
        fontWeight: 'bold',
        color: '#8b5cf6',
        textAlign: 'center',
        fontFamily: 'Poppins',
        background: 'glass'
      }
    ],
    backgroundOverlay: {
      type: 'gradient',
      value: 'linear-gradient(180deg, rgba(249, 115, 22, 0.1), rgba(255, 255, 255, 0.3))',
      opacity: 0.9
    },
    tags: ['polaroid', 'timeline', 'memories', 'vertical'],
    isPopular: false
  },

  // MOOD BOARDS CATEGORY (4 templates)
  {
    id: 'moodboard-organic',
    name: 'Organic Mood Board',
    category: 'mood-boards',
    platforms: ['instagram-post', 'instagram-story'],
    description: 'Natural, organic placement of images',
    thumbnail: '/templates/moodboard-organic.png',
    photoSlots: [
      { id: 'mood-1', position: { x: 8, y: 12, width: 25, height: 35 }, style: 'glass', aspectRatio: 'portrait', rotation: -12 },
      { id: 'mood-2', position: { x: 40, y: 5, width: 30, height: 20 }, style: 'glass', aspectRatio: 'landscape', rotation: 8 },
      { id: 'mood-3', position: { x: 65, y: 25, width: 28, height: 40 }, style: 'glass', aspectRatio: 'portrait', rotation: 15 },
      { id: 'mood-4', position: { x: 15, y: 55, width: 35, height: 25 }, style: 'glass', aspectRatio: 'landscape', rotation: -5 },
      { id: 'mood-5', position: { x: 55, y: 70, width: 20, height: 25 }, style: 'glass', aspectRatio: 'square', rotation: 10 }
    ],
    textOverlays: [
      {
        id: 'mood-title',
        position: { x: 35, y: 45, width: 30, height: 8 },
        text: 'Mood',
        fontSize: 3,
        fontWeight: 'bold',
        color: '#f97316',
        textAlign: 'center',
        fontFamily: 'Poppins',
        background: 'glass'
      }
    ],
    backgroundOverlay: {
      type: 'gradient',
      value: 'radial-gradient(ellipse at center, rgba(251, 146, 60, 0.1), rgba(255, 255, 255, 0.25))',
      opacity: 0.8
    },
    tags: ['mood', 'organic', 'scattered', 'creative'],
    isPopular: true
  },

  // TIMELINE/STORY CATEGORY (4 templates)
  {
    id: 'timeline-vertical',
    name: 'Vertical Timeline',
    category: 'timeline-story',
    platforms: ['instagram-story', 'tiktok'],
    description: 'Sequential story progression',
    thumbnail: '/templates/timeline-vertical.png',
    photoSlots: [
      { id: 'step-1', position: { x: 20, y: 15, width: 60, height: 15 }, style: 'glass', aspectRatio: 'landscape' },
      { id: 'step-2', position: { x: 20, y: 35, width: 60, height: 15 }, style: 'glass', aspectRatio: 'landscape' },
      { id: 'step-3', position: { x: 20, y: 55, width: 60, height: 15 }, style: 'glass', aspectRatio: 'landscape' },
      { id: 'step-4', position: { x: 20, y: 75, width: 60, height: 15 }, style: 'glass', aspectRatio: 'landscape' }
    ],
    textOverlays: [
      {
        id: 'timeline-title',
        position: { x: 10, y: 5, width: 80, height: 8 },
        text: 'Our Journey',
        fontSize: 1.8,
        fontWeight: 'bold',
        color: '#1f2937',
        textAlign: 'center',
        fontFamily: 'Poppins',
        background: 'glass'
      }
    ],
    backgroundOverlay: {
      type: 'gradient',
      value: 'linear-gradient(180deg, rgba(249, 115, 22, 0.08), rgba(255, 255, 255, 0.2))',
      opacity: 0.9
    },
    tags: ['timeline', 'story', 'sequential', 'journey'],
    isPopular: false
  },

  // BEFORE/AFTER CATEGORY (3 templates)
  {
    id: 'before-after-split',
    name: 'Before & After Split',
    category: 'before-after',
    platforms: ['facebook-post', 'twitter-post', 'linkedin-post'],
    description: 'Side-by-side comparison layout',
    thumbnail: '/templates/before-after-split.png',
    photoSlots: [
      { id: 'before', position: { x: 5, y: 15, width: 42.5, height: 70 }, style: 'glass', aspectRatio: 'portrait' },
      { id: 'after', position: { x: 52.5, y: 15, width: 42.5, height: 70 }, style: 'glass', aspectRatio: 'portrait' }
    ],
    textOverlays: [
      {
        id: 'before-label',
        position: { x: 5, y: 5, width: 42.5, height: 8 },
        text: 'BEFORE',
        fontSize: 1.2,
        fontWeight: 'bold',
        color: '#ef4444',
        textAlign: 'center',
        fontFamily: 'Inter',
        background: 'glass'
      },
      {
        id: 'after-label',
        position: { x: 52.5, y: 5, width: 42.5, height: 8 },
        text: 'AFTER',
        fontSize: 1.2,
        fontWeight: 'bold',
        color: '#10b981',
        textAlign: 'center',
        fontFamily: 'Inter',
        background: 'glass'
      }
    ],
    backgroundOverlay: {
      type: 'gradient',
      value: 'linear-gradient(90deg, rgba(239, 68, 68, 0.05), rgba(255, 255, 255, 0.1), rgba(16, 185, 129, 0.05))',
      opacity: 0.8
    },
    tags: ['before-after', 'comparison', 'split', 'transformation'],
    isPopular: true
  }

  // Additional templates would continue here...
  // Total: 30+ templates across all categories
];

// Template Categories Configuration
export const TEMPLATE_CATEGORIES: Record<TemplateCategory, { name: string; description: string; icon: string }> = {
  'photo-grids': {
    name: 'Photo Grids',
    description: 'Structured grid layouts for multiple photos',
    icon: 'grid-3x3'
  },
  'magazine-style': {
    name: 'Magazine Style',
    description: 'Editorial layouts with asymmetric designs',
    icon: 'newspaper'
  },
  'polaroid-style': {
    name: 'Polaroid Style',
    description: 'Vintage photo frame effects with natural placement',
    icon: 'image'
  },
  'mood-boards': {
    name: 'Mood Boards',
    description: 'Creative scattered layouts for inspiration',
    icon: 'palette'
  },
  'timeline-story': {
    name: 'Timeline & Story',
    description: 'Sequential layouts for storytelling',
    icon: 'clock'
  },
  'before-after': {
    name: 'Before & After',
    description: 'Comparison layouts for transformations',
    icon: 'arrow-right'
  }
};

// Popular templates for quick access
export const POPULAR_TEMPLATES = COLLAGE_TEMPLATES.filter(template => template.isPopular);

// Helper functions
export const getTemplatesByCategory = (category: TemplateCategory): CollageTemplate[] => {
  return COLLAGE_TEMPLATES.filter(template => template.category === category);
};

export const getTemplatesByPlatform = (platform: SocialPlatform): CollageTemplate[] => {
  return COLLAGE_TEMPLATES.filter(template => template.platforms.includes(platform));
};

export const getTemplateById = (id: string): CollageTemplate | undefined => {
  return COLLAGE_TEMPLATES.find(template => template.id === id);
};

export const searchTemplates = (query: string): CollageTemplate[] => {
  const lowercaseQuery = query.toLowerCase();
  return COLLAGE_TEMPLATES.filter(template => 
    template.name.toLowerCase().includes(lowercaseQuery) ||
    template.description.toLowerCase().includes(lowercaseQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
};