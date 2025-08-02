/**
 * Accessibility Testing Utilities for ImageCraft Pro
 * Run these tests to validate WCAG 2.1 AA compliance
 */

// Color contrast testing utility
export const testColorContrast = (foreground, background) => {
  // Convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Calculate relative luminance
  const getLuminance = (rgb) => {
    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);

  if (!fg || !bg) return null;

  const l1 = getLuminance(fg);
  const l2 = getLuminance(bg);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  return {
    ratio: Math.round(ratio * 100) / 100,
    aa: ratio >= 4.5,
    aaa: ratio >= 7,
    level: ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'FAIL'
  };
};

// Keyboard navigation testing
export const testKeyboardNavigation = () => {
  const focusableElements = document.querySelectorAll(
    'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
  );

  const results = {
    totalFocusable: focusableElements.length,
    missingFocusIndicators: [],
    inaccessibleElements: []
  };

  focusableElements.forEach((element, index) => {
    // Check for focus indicators
    const computedStyle = window.getComputedStyle(element, ':focus');
    if (!computedStyle.outline && !computedStyle.boxShadow) {
      results.missingFocusIndicators.push({
        element: element.tagName,
        index,
        text: element.textContent?.slice(0, 50) || 'No text'
      });
    }

    // Check for accessible names
    const hasAccessibleName = element.getAttribute('aria-label') ||
                             element.getAttribute('aria-labelledby') ||
                             element.textContent?.trim() ||
                             element.getAttribute('alt') ||
                             element.getAttribute('title');

    if (!hasAccessibleName) {
      results.inaccessibleElements.push({
        element: element.tagName,
        index,
        classes: element.className
      });
    }
  });

  return results;
};

// ARIA attributes testing
export const testAriaAttributes = () => {
  const results = {
    missingAriaLabels: [],
    invalidAriaAttributes: [],
    missingAriaDescriptions: []
  };

  // Check buttons without labels
  document.querySelectorAll('button').forEach((button, index) => {
    const hasLabel = button.getAttribute('aria-label') ||
                    button.getAttribute('aria-labelledby') ||
                    button.textContent?.trim();

    if (!hasLabel) {
      results.missingAriaLabels.push({
        element: 'button',
        index,
        classes: button.className
      });
    }
  });

  // Check interactive elements without descriptions
  document.querySelectorAll('[role="button"], [role="tab"], [role="menuitem"]').forEach((element, index) => {
    const hasDescription = element.getAttribute('aria-describedby');
    if (!hasDescription) {
      results.missingAriaDescriptions.push({
        element: element.tagName,
        role: element.getAttribute('role'),
        index
      });
    }
  });

  return results;
};

// Test for motion preferences
export const testMotionPreferences = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animatedElements = document.querySelectorAll('.animate-pulse, .animate-float1, .animate-float2, .animate-float3, .animate-wave');

  return {
    prefersReducedMotion,
    animatedElementsCount: animatedElements.length,
    respectsPreference: prefersReducedMotion ? 
      Array.from(animatedElements).every(el => 
        window.getComputedStyle(el).animationDuration === '0.01ms'
      ) : true
  };
};

// Comprehensive accessibility audit
export const runAccessibilityAudit = () => {
  console.group('🔍 Accessibility Audit Results');

  // Test color contrast for known combinations
  console.group('🎨 Color Contrast Testing');
  const contrastTests = [
    { name: 'Glass Button Text', fg: '#111827', bg: '#ffffff' }, // text-gray-900 on white/35
    { name: 'Orange Primary Button', fg: '#ffffff', bg: '#f97316' }, // white on orange-500
    { name: 'Body Text', fg: '#374151', bg: '#ffffff' } // text-gray-700 on white
  ];

  contrastTests.forEach(test => {
    const result = testColorContrast(test.fg, test.bg);
    console.log(`${test.name}: ${result.level} (${result.ratio}:1)`);
  });
  console.groupEnd();

  // Test keyboard navigation
  console.group('⌨️ Keyboard Navigation');
  const keyboardResults = testKeyboardNavigation();
  console.log('Total focusable elements:', keyboardResults.totalFocusable);
  console.log('Missing focus indicators:', keyboardResults.missingFocusIndicators.length);
  console.log('Elements without accessible names:', keyboardResults.inaccessibleElements.length);
  console.groupEnd();

  // Test ARIA attributes
  console.group('🏷️ ARIA Attributes');
  const ariaResults = testAriaAttributes();
  console.log('Missing ARIA labels:', ariaResults.missingAriaLabels.length);
  console.log('Missing ARIA descriptions:', ariaResults.missingAriaDescriptions.length);
  console.groupEnd();

  // Test motion preferences
  console.group('🎬 Motion Preferences');
  const motionResults = testMotionPreferences();
  console.log('Prefers reduced motion:', motionResults.prefersReducedMotion);
  console.log('Respects motion preference:', motionResults.respectsPreference);
  console.groupEnd();

  console.groupEnd();

  return {
    contrast: contrastTests.map(test => ({
      ...test,
      result: testColorContrast(test.fg, test.bg)
    })),
    keyboard: keyboardResults,
    aria: ariaResults,
    motion: motionResults
  };
};

// Export for manual testing
window.runAccessibilityAudit = runAccessibilityAudit;