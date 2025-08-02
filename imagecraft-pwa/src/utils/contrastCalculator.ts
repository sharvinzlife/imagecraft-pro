/**
 * WCAG 2.1 Contrast Ratio Calculator
 * 
 * Calculates precise contrast ratios for glass morphism designs with semi-transparent backgrounds.
 * Based on WCAG 2.1 standards and formulas from W3C documentation.
 */

export interface ColorRGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export interface ColorRGBA extends ColorRGB {
  a: number; // 0-1
}

export interface ContrastResult {
  contrastRatio: number;
  wcagAA: boolean; // >= 4.5:1 for normal text, >= 3:1 for large text
  wcagAAA: boolean; // >= 7:1 for normal text, >= 4.5:1 for large text
  finalBackgroundColor: ColorRGB;
  finalForegroundColor: ColorRGB;
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): ColorRGB {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return { r, g, b };
}

/**
 * Convert RGBA string to ColorRGBA object
 */
export function parseRgba(rgba: string): ColorRGBA {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) throw new Error(`Invalid RGBA format: ${rgba}`);
  
  return {
    r: parseInt(match[1]),
    g: parseInt(match[2]),
    b: parseInt(match[3]),
    a: match[4] ? parseFloat(match[4]) : 1
  };
}

/**
 * Blend semi-transparent color with background using alpha compositing
 * Formula: final = (foreground * alpha) + (background * (1 - alpha))
 */
export function blendColors(foreground: ColorRGBA, background: ColorRGB): ColorRGB {
  const alpha = foreground.a;
  const invAlpha = 1 - alpha;
  
  return {
    r: Math.round(foreground.r * alpha + background.r * invAlpha),
    g: Math.round(foreground.g * alpha + background.g * invAlpha),
    b: Math.round(foreground.b * alpha + background.b * invAlpha)
  };
}

/**
 * Calculate relative luminance using WCAG formula
 * L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 * Where R, G, B are linearized sRGB values
 */
export function getRelativeLuminance(color: ColorRGB): number {
  // Convert 8-bit values to sRGB (0-1)
  const sR = color.r / 255;
  const sG = color.g / 255;
  const sB = color.b / 255;
  
  // Linearize sRGB values
  const linearR = sR <= 0.04045 ? sR / 12.92 : Math.pow((sR + 0.055) / 1.055, 2.4);
  const linearG = sG <= 0.04045 ? sG / 12.92 : Math.pow((sG + 0.055) / 1.055, 2.4);
  const linearB = sB <= 0.04045 ? sB / 12.92 : Math.pow((sB + 0.055) / 1.055, 2.4);
  
  // Calculate relative luminance
  return 0.2126 * linearR + 0.7152 * linearG + 0.0722 * linearB;
}

/**
 * Calculate contrast ratio between two colors
 * Formula: (L1 + 0.05) / (L2 + 0.05) where L1 > L2
 */
export function getContrastRatio(color1: ColorRGB, color2: ColorRGB): number {
  const l1 = getRelativeLuminance(color1);
  const l2 = getRelativeLuminance(color2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calculate contrast ratio for glass morphism design
 * Handles semi-transparent backgrounds properly
 */
export function calculateGlassContrast(
  foregroundColor: string | ColorRGB,
  backgroundColorRgba: string | ColorRGBA,
  underlyingBackground: ColorRGB = { r: 255, g: 255, b: 255 }, // Default white
  isLargeText: boolean = false
): ContrastResult {
  // Parse colors
  const foreground = typeof foregroundColor === 'string' 
    ? hexToRgb(foregroundColor) 
    : foregroundColor;
    
  const backgroundRgba = typeof backgroundColorRgba === 'string'
    ? parseRgba(backgroundColorRgba)
    : backgroundColorRgba;
  
  // Blend semi-transparent background with underlying background
  const finalBackground = blendColors(backgroundRgba, underlyingBackground);
  
  // Calculate contrast ratio
  const contrastRatio = getContrastRatio(foreground, finalBackground);
  
  // WCAG compliance thresholds
  const aaThreshold = isLargeText ? 3.0 : 4.5;
  const aaaThreshold = isLargeText ? 4.5 : 7.0;
  
  return {
    contrastRatio: Math.round(contrastRatio * 100) / 100,
    wcagAA: contrastRatio >= aaThreshold,
    wcagAAA: contrastRatio >= aaaThreshold,
    finalBackgroundColor: finalBackground,
    finalForegroundColor: foreground
  };
}

/**
 * Format color as RGB string for display
 */
export function formatRgb(color: ColorRGB): string {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

/**
 * Format color as hex string for display
 */
export function rgbToHex(color: ColorRGB): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}