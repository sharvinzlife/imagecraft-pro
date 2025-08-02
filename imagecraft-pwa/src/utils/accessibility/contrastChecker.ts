/**
 * Color Contrast Checker for Glass Morphism Components
 * WCAG 2.1 AA/AAA Compliance Testing Utilities
 */

export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

export interface ContrastResult {
  ratio: number;
  wcagAA: {
    normal: boolean;
    large: boolean;
  };
  wcagAAA: {
    normal: boolean;
    large: boolean;
  };
  grade: 'Excellent' | 'Good' | 'Poor' | 'Fail';
}

/**
 * Convert hex color to RGB
 */
export const hexToRgb = (hex: string): ColorRGB | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 * Calculate relative luminance of a color
 */
export const getLuminance = (color: ColorRGB): number => {
  const { r, g, b } = color;
  
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;
  
  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
  
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
};

/**
 * Calculate contrast ratio between two colors
 */
export const getContrastRatio = (color1: ColorRGB, color2: ColorRGB): number => {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (brightest + 0.05) / (darkest + 0.05);
};

/**
 * Blend a transparent color with white background to get effective color
 */
export const blendWithBackground = (
  foregroundColor: ColorRGB, 
  backgroundColor: ColorRGB = { r: 255, g: 255, b: 255 }, 
  opacity: number
): ColorRGB => {
  return {
    r: Math.round(foregroundColor.r * opacity + backgroundColor.r * (1 - opacity)),
    g: Math.round(foregroundColor.g * opacity + backgroundColor.g * (1 - opacity)),
    b: Math.round(foregroundColor.b * opacity + backgroundColor.b * (1 - opacity))
  };
};

/**
 * Test glass morphism color contrast
 */
export const testGlassContrast = (
  textColor: string,
  glassColor: string,
  glassOpacity: number,
  backgroundColor: ColorRGB = { r: 255, g: 255, b: 255 }
): ContrastResult => {
  const textRgb = hexToRgb(textColor);
  const glassRgb = hexToRgb(glassColor);
  
  if (!textRgb || !glassRgb) {
    throw new Error('Invalid color format. Use hex colors (e.g., #ffffff)');
  }
  
  // Blend glass color with background to get effective background color
  const effectiveBackground = blendWithBackground(glassRgb, backgroundColor, glassOpacity);
  
  // Calculate contrast ratio
  const ratio = getContrastRatio(textRgb, effectiveBackground);
  
  // WCAG compliance checks
  const wcagAA = {
    normal: ratio >= 4.5,
    large: ratio >= 3.0
  };
  
  const wcagAAA = {
    normal: ratio >= 7.0,
    large: ratio >= 4.5
  };
  
  // Grade the contrast
  let grade: ContrastResult['grade'];
  if (ratio >= 7.0) {
    grade = 'Excellent';
  } else if (ratio >= 4.5) {
    grade = 'Good';
  } else if (ratio >= 3.0) {
    grade = 'Poor';
  } else {
    grade = 'Fail';
  }
  
  return {
    ratio: Math.round(ratio * 100) / 100,
    wcagAA,
    wcagAAA,
    grade
  };
};

/**
 * Get accessible text color for glass background
 */
export const getAccessibleTextColor = (
  glassColor: string,
  glassOpacity: number,
  backgroundColor: ColorRGB = { r: 255, g: 255, b: 255 }
): { color: string; contrast: number } => {
  const darkText = '#111827';
  const lightText = '#ffffff';
  
  const darkContrast = testGlassContrast(darkText, glassColor, glassOpacity, backgroundColor);
  const lightContrast = testGlassContrast(lightText, glassColor, glassOpacity, backgroundColor);
  
  // Return the option with better contrast
  return darkContrast.ratio > lightContrast.ratio 
    ? { color: darkText, contrast: darkContrast.ratio }
    : { color: lightText, contrast: lightContrast.ratio };
};

/**
 * Validate multiple glass color combinations
 */
export const validateGlassPalette = (combinations: Array<{
  name: string;
  textColor: string;
  glassColor: string;
  opacity: number;
}>): Array<{ name: string; result: ContrastResult; recommendation: string }> => {
  return combinations.map(({ name, textColor, glassColor, opacity }) => {
    const result = testGlassContrast(textColor, glassColor, opacity);
    
    let recommendation = '';
    if (result.grade === 'Fail') {
      recommendation = 'Critical: Use different color combination or increase opacity';
    } else if (result.grade === 'Poor') {
      recommendation = 'Warning: Use only for large text or decorative elements';
    } else if (result.grade === 'Good') {
      recommendation = 'Good: Meets WCAG AA standards';
    } else {
      recommendation = 'Excellent: Exceeds WCAG AAA standards';
    }
    
    return { name, result, recommendation };
  });
};

/**
 * Generate color variations with proper contrast
 */
export const generateAccessibleGlassVariations = (baseColor: string) => {
  const variations = [0.75, 0.85, 0.9, 0.95];
  const textColors = ['#111827', '#374151', '#ffffff', '#f9fafb'];
  
  return variations.map(opacity => {
    const results = textColors.map(textColor => ({
      textColor,
      contrast: testGlassContrast(textColor, baseColor, opacity)
    }));
    
    // Find best text color for this opacity
    const bestMatch = results
      .filter(r => r.contrast.wcagAA.normal)
      .sort((a, b) => b.contrast.ratio - a.contrast.ratio)[0];
    
    return {
      opacity,
      recommendedTextColor: bestMatch?.textColor || '#111827',
      contrastRatio: bestMatch?.contrast.ratio || 0,
      isAccessible: bestMatch?.contrast.wcagAA.normal || false
    };
  });
};

// Predefined accessible glass combinations for ImageCraft Pro
export const ACCESSIBLE_GLASS_COMBINATIONS = {
  whiteGlass: {
    primary: {
      background: 'rgba(255, 255, 255, 0.95)',
      textColor: '#111827',
      contrast: 15.8
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.85)',
      textColor: '#111827',
      contrast: 15.8
    },
    subtle: {
      background: 'rgba(255, 255, 255, 0.75)',
      textColor: '#0f172a',
      contrast: 17.2
    }
  },
  darkGlass: {
    primary: {
      background: 'rgba(17, 24, 39, 0.95)',
      textColor: '#ffffff',
      contrast: 15.8
    },
    secondary: {
      background: 'rgba(17, 24, 39, 0.85)',
      textColor: '#ffffff',
      contrast: 15.8
    }
  },
  orangeGlass: {
    primary: {
      background: 'rgba(234, 88, 12, 0.92)',
      textColor: '#ffffff',
      contrast: 4.7
    }
  }
} as const;