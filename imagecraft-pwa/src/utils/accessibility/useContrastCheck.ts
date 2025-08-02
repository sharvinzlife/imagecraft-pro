/**
 * React Hook for Real-time Contrast Checking in Development
 * Helps ensure WCAG compliance during component development
 */

import { useMemo, useEffect } from 'react';
import { 
  testGlassContrast, 
  ContrastResult, 
  getAccessibleTextColor,
  ColorRGB 
} from './contrastChecker';

export interface UseContrastCheckOptions {
  textColor: string;
  glassColor: string;
  glassOpacity: number;
  backgroundColor?: ColorRGB;
  warnInDevelopment?: boolean;
  logResults?: boolean;
}

export interface ContrastCheckResult extends ContrastResult {
  isAccessible: boolean;
  recommendation: string;
  suggestedTextColor?: string;
  suggestedOpacity?: number;
}

/**
 * Hook to check contrast ratios for glass morphism components
 */
export const useContrastCheck = ({
  textColor,
  glassColor,
  glassOpacity,
  backgroundColor = { r: 255, g: 255, b: 255 },
  warnInDevelopment = true,
  logResults = false
}: UseContrastCheckOptions): ContrastCheckResult => {
  
  const contrastResult = useMemo(() => {
    try {
      const result = testGlassContrast(textColor, glassColor, glassOpacity, backgroundColor);
      const isAccessible = result.wcagAA.normal;
      
      let recommendation = '';
      let suggestedTextColor: string | undefined;
      let suggestedOpacity: number | undefined;
      
      if (!isAccessible) {
        // Try to find better text color
        const betterTextColor = getAccessibleTextColor(glassColor, glassOpacity, backgroundColor);
        if (betterTextColor.contrast >= 4.5) {
          suggestedTextColor = betterTextColor.color;
          recommendation = `Use ${betterTextColor.color} for better contrast (${betterTextColor.contrast.toFixed(1)}:1)`;
        } else {
          // Suggest higher opacity
          const opacityOptions = [0.85, 0.9, 0.95];
          for (const opacity of opacityOptions) {
            const testResult = testGlassContrast(textColor, glassColor, opacity, backgroundColor);
            if (testResult.wcagAA.normal) {
              suggestedOpacity = opacity;
              recommendation = `Increase opacity to ${opacity} for WCAG AA compliance (${testResult.ratio.toFixed(1)}:1)`;
              break;
            }
          }
          
          if (!suggestedOpacity) {
            recommendation = 'Consider using a different color combination or adding text shadow';
          }
        }
      } else if (result.grade === 'Good') {
        recommendation = 'Meets WCAG AA standards';
      } else if (result.grade === 'Excellent') {
        recommendation = 'Exceeds WCAG AAA standards';
      }
      
      return {
        ...result,
        isAccessible,
        recommendation,
        suggestedTextColor,
        suggestedOpacity
      };
    } catch (error) {
      console.error('Contrast check error:', error);
      return {
        ratio: 0,
        wcagAA: { normal: false, large: false },
        wcagAAA: { normal: false, large: false },
        grade: 'Fail' as const,
        isAccessible: false,
        recommendation: 'Error calculating contrast ratio'
      };
    }
  }, [textColor, glassColor, glassOpacity, backgroundColor]);
  
  // Development warnings
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && warnInDevelopment) {
      if (!contrastResult.isAccessible) {
        console.warn(`🔴 Accessibility Issue: Low contrast ratio (${contrastResult.ratio.toFixed(1)}:1)`, {
          textColor,
          glassColor,
          glassOpacity,
          recommendation: contrastResult.recommendation
        });
      } else if (logResults) {
        console.log(`✅ Accessibility: Good contrast ratio (${contrastResult.ratio.toFixed(1)}:1)`, {
          textColor,
          glassColor,
          glassOpacity,
          grade: contrastResult.grade
        });
      }
    }
  }, [contrastResult, textColor, glassColor, glassOpacity, warnInDevelopment, logResults]);
  
  return contrastResult;
};

/**
 * Hook to get recommended glass styles based on content type
 */
export const useAccessibleGlassStyles = (
  contentType: 'primary' | 'secondary' | 'accent' | 'warning' | 'error' | 'success',
  theme: 'light' | 'dark' | 'auto' = 'auto'
) => {
  return useMemo(() => {
    const isDark = theme === 'dark' || (theme === 'auto' && window?.matchMedia('(prefers-color-scheme: dark)').matches);
    
    const styles = {
      primary: isDark 
        ? { backgroundColor: 'rgba(17, 24, 39, 0.95)', color: '#ffffff' }
        : { backgroundColor: 'rgba(255, 255, 255, 0.95)', color: '#111827' },
      
      secondary: isDark
        ? { backgroundColor: 'rgba(17, 24, 39, 0.85)', color: '#e5e7eb' }
        : { backgroundColor: 'rgba(255, 255, 255, 0.85)', color: '#374151' },
      
      accent: {
        backgroundColor: 'rgba(234, 88, 12, 0.92)',
        color: '#ffffff'
      },
      
      warning: isDark
        ? { backgroundColor: 'rgba(217, 119, 6, 0.9)', color: '#ffffff' }
        : { backgroundColor: 'rgba(254, 243, 199, 0.95)', color: '#92400e' },
      
      error: isDark
        ? { backgroundColor: 'rgba(220, 38, 38, 0.9)', color: '#ffffff' }
        : { backgroundColor: 'rgba(254, 226, 226, 0.95)', color: '#991b1b' },
      
      success: isDark
        ? { backgroundColor: 'rgba(5, 150, 105, 0.9)', color: '#ffffff' }
        : { backgroundColor: 'rgba(209, 250, 229, 0.95)', color: '#047857' }
    };
    
    return {
      ...styles[contentType],
      backdropFilter: 'blur(12px)',
      border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.3)'
    };
  }, [contentType, theme]);
};

/**
 * Hook to validate an entire component's color scheme
 */
export const useComponentContrastValidation = (
  colorCombinations: Array<{
    name: string;
    textColor: string;
    backgroundColor: string;
    opacity?: number;
  }>
) => {
  return useMemo(() => {
    return colorCombinations.map(({ name, textColor, backgroundColor, opacity = 1 }) => {
      const result = useContrastCheck({
        textColor,
        glassColor: backgroundColor,
        glassOpacity: opacity,
        warnInDevelopment: false
      });
      
      return {
        name,
        ...result,
        severity: result.isAccessible ? 'pass' : (result.ratio >= 3.0 ? 'warning' : 'error')
      };
    });
  }, [colorCombinations]);
};

/**
 * Development-only component to display contrast information
 */
export const ContrastDebugInfo: React.FC<{
  textColor: string;
  glassColor: string;
  glassOpacity: number;
  show?: boolean;
}> = ({ textColor, glassColor, glassOpacity, show = process.env.NODE_ENV === 'development' }) => {
  const result = useContrastCheck({
    textColor,
    glassColor,
    glassOpacity,
    warnInDevelopment: false
  });
  
  if (!show) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      border: `2px solid ${result.isAccessible ? '#10b981' : '#ef4444'}`
    }}>
      <div>Contrast: {result.ratio.toFixed(1)}:1</div>
      <div>WCAG AA: {result.wcagAA.normal ? '✅' : '❌'}</div>
      <div>Grade: {result.grade}</div>
      {result.suggestedTextColor && (
        <div>Suggested: {result.suggestedTextColor}</div>
      )}
    </div>
  );
};