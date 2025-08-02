/**
 * Accessibility Utilities for ImageCraft Pro
 * Glass Morphism WCAG Compliance Tools
 */

export {
  hexToRgb,
  getLuminance,
  getContrastRatio,
  blendWithBackground,
  testGlassContrast,
  getAccessibleTextColor,
  validateGlassPalette,
  generateAccessibleGlassVariations,
  ACCESSIBLE_GLASS_COMBINATIONS
} from './contrastChecker';

export type {
  ColorRGB,
  ContrastResult
} from './contrastChecker';

export {
  useContrastCheck,
  useAccessibleGlassStyles,
  useComponentContrastValidation,
  ContrastDebugInfo
} from './useContrastCheck';

export type {
  UseContrastCheckOptions,
  ContrastCheckResult
} from './useContrastCheck';

// Predefined accessible color combinations for quick use
export const GLASS_COLORS = {
  // White glass backgrounds
  WHITE_GLASS_95: 'rgba(255, 255, 255, 0.95)',
  WHITE_GLASS_85: 'rgba(255, 255, 255, 0.85)',
  WHITE_GLASS_75: 'rgba(255, 255, 255, 0.75)',
  
  // Dark glass backgrounds
  DARK_GLASS_95: 'rgba(17, 24, 39, 0.95)',
  DARK_GLASS_85: 'rgba(17, 24, 39, 0.85)',
  
  // Accent glass backgrounds
  ORANGE_GLASS_92: 'rgba(234, 88, 12, 0.92)',
  BLUE_GLASS_90: 'rgba(37, 99, 235, 0.90)',
  GREEN_GLASS_90: 'rgba(5, 150, 105, 0.90)',
  RED_GLASS_90: 'rgba(220, 38, 38, 0.90)'
} as const;

export const TEXT_COLORS = {
  // For white/light backgrounds
  DARK_PRIMARY: '#111827',
  DARK_SECONDARY: '#374151',
  DARK_MUTED: '#4b5563',
  
  // For dark backgrounds
  LIGHT_PRIMARY: '#ffffff',
  LIGHT_SECONDARY: '#e5e7eb',
  LIGHT_MUTED: '#d1d5db',
  
  // Accent colors
  BLUE_LINK: '#1d4ed8',
  BLUE_LINK_LIGHT: '#60a5fa',
  
  // Status colors
  SUCCESS_DARK: '#047857',
  SUCCESS_LIGHT: '#6ee7b7',
  ERROR_DARK: '#991b1b',
  ERROR_LIGHT: '#fca5a5',
  WARNING_DARK: '#92400e',
  WARNING_LIGHT: '#fbbf24'
} as const;

// Quick accessibility check function
export const quickContrastCheck = (
  textColor: keyof typeof TEXT_COLORS,
  backgroundColor: keyof typeof GLASS_COLORS
): boolean => {
  const textHex = TEXT_COLORS[textColor];
  const bgRgba = GLASS_COLORS[backgroundColor];
  
  // Extract opacity from rgba string
  const opacityMatch = bgRgba.match(/[\d.]+(?=\))/);
  const opacity = opacityMatch ? parseFloat(opacityMatch[0]) : 1;
  
  // Extract RGB values
  const rgbMatch = bgRgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!rgbMatch) return false;
  
  const bgHex = `#${parseInt(rgbMatch[1]).toString(16).padStart(2, '0')}${parseInt(rgbMatch[2]).toString(16).padStart(2, '0')}${parseInt(rgbMatch[3]).toString(16).padStart(2, '0')}`;
  
  try {
    const result = testGlassContrast(textHex, bgHex, opacity);
    return result.wcagAA.normal;
  } catch {
    return false;
  }
};