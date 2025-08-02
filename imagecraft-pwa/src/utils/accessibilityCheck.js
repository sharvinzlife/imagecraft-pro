/**
 * Accessibility Checker Utility
 * Validates color contrast ratios and accessibility compliance
 */

/**
 * Calculate the relative luminance of a color
 * @param {string} color - Hex color string
 * @returns {number} Relative luminance (0-1)
 */
function getLuminance(color) {
  // Remove # if present
  const hex = color.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  // Apply gamma correction
  const sRGB = [r, g, b].map(c => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  // Calculate relative luminance
  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

/**
 * Calculate contrast ratio between two colors
 * @param {string} color1 - First color (hex)
 * @param {string} color2 - Second color (hex)
 * @returns {number} Contrast ratio (1-21)
 */
export function getContrastRatio(color1, color2) {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color combination meets WCAG guidelines
 * @param {string} foreground - Foreground color (hex)
 * @param {string} background - Background color (hex)
 * @param {string} level - WCAG level ('AA' or 'AAA')
 * @param {string} size - Text size ('normal' or 'large')
 * @returns {Object} Compliance result
 */
export function checkWCAGCompliance(foreground, background, level = 'AA', size = 'normal') {
  const ratio = getContrastRatio(foreground, background);
  
  // WCAG requirements
  const requirements = {
    'AA': {
      'normal': 4.5,
      'large': 3.0
    },
    'AAA': {
      'normal': 7.0,
      'large': 4.5
    }
  };
  
  const required = requirements[level][size];
  const passes = ratio >= required;
  
  return {
    ratio: Math.round(ratio * 100) / 100,
    required,
    passes,
    level,
    size,
    grade: passes ? (ratio >= requirements.AAA[size] ? 'AAA' : 'AA') : 'Fail'
  };
}

/**
 * Test glass morphism color combinations used in the app
 */
export function testGlassMorphismColors() {
  const testCombinations = [
    {
      name: 'Dark text on glass cream background',
      foreground: '#1e293b', // slate-800
      background: '#ffffff66', // white with 40% opacity (glass effect)
      context: 'Main text on glass cards'
    },
    {
      name: 'Dark text on glass white background',
      foreground: '#334155', // slate-700
      background: '#ffffff33', // white with 20% opacity
      context: 'Secondary text on glass'
    },
    {
      name: 'Orange text on glass background',
      foreground: '#ea580c', // orange-600
      background: '#ffffff66',
      context: 'Interactive elements'
    },
    {
      name: 'White text on orange background',
      foreground: '#ffffff',
      background: '#f97316', // orange-500
      context: 'Primary buttons'
    },
    {
      name: 'Success text on glass',
      foreground: '#059669', // emerald-600
      background: '#ffffff66',
      context: 'Success messages'
    },
    {
      name: 'Error text on glass',
      foreground: '#dc2626', // red-600
      background: '#ffffff66',
      context: 'Error messages'
    }
  ];
  
  return testCombinations.map(combo => ({
    ...combo,
    wcag: {
      AA_normal: checkWCAGCompliance(combo.foreground, combo.background, 'AA', 'normal'),
      AA_large: checkWCAGCompliance(combo.foreground, combo.background, 'AA', 'large'),
      AAA_normal: checkWCAGCompliance(combo.foreground, combo.background, 'AAA', 'normal'),
      AAA_large: checkWCAGCompliance(combo.foreground, combo.background, 'AAA', 'large')
    }
  }));
}

/**
 * Generate accessibility report for batch upload components
 */
export function generateAccessibilityReport() {
  const colorTests = testGlassMorphismColors();
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: colorTests.length,
      passing: {
        AA_normal: colorTests.filter(t => t.wcag.AA_normal.passes).length,
        AA_large: colorTests.filter(t => t.wcag.AA_large.passes).length,
        AAA_normal: colorTests.filter(t => t.wcag.AAA_normal.passes).length,
        AAA_large: colorTests.filter(t => t.wcag.AAA_large.passes).length
      }
    },
    tests: colorTests,
    recommendations: []
  };
  
  // Generate recommendations
  colorTests.forEach(test => {
    if (!test.wcag.AA_normal.passes) {
      report.recommendations.push({
        severity: 'high',
        component: test.context,
        issue: `Text contrast ratio of ${test.wcag.AA_normal.ratio} does not meet WCAG AA standards (requires ${test.wcag.AA_normal.required})`,
        suggestion: 'Consider darkening the text color or increasing background opacity'
      });
    } else if (!test.wcag.AAA_normal.passes) {
      report.recommendations.push({
        severity: 'medium',
        component: test.context,
        issue: `Text contrast ratio of ${test.wcag.AAA_normal.ratio} meets AA but not AAA standards`,
        suggestion: 'Consider further improving contrast for better accessibility'
      });
    }
  });
  
  return report;
}

/**
 * Check keyboard navigation accessibility
 */
export function checkKeyboardAccessibility() {
  const recommendations = [];
  
  // Check for common accessibility patterns
  const elements = {
    buttons: document.querySelectorAll('button'),
    inputs: document.querySelectorAll('input'),
    links: document.querySelectorAll('a'),
    interactive: document.querySelectorAll('[role="button"], [role="checkbox"], [tabindex]')
  };
  
  // Check for proper tab indices
  elements.buttons.forEach((button, index) => {
    if (button.tabIndex < 0 && !button.disabled) {
      recommendations.push({
        element: `Button ${index + 1}`,
        issue: 'Button has negative tabIndex but is not disabled',
        suggestion: 'Ensure interactive elements are keyboard accessible'
      });
    }
  });
  
  // Check for ARIA labels
  elements.interactive.forEach((element, index) => {
    if (!element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby') && !element.textContent.trim()) {
      recommendations.push({
        element: `Interactive element ${index + 1}`,
        issue: 'Interactive element lacks accessible name',
        suggestion: 'Add aria-label or ensure element has descriptive text content'
      });
    }
  });
  
  return {
    elementsChecked: Object.values(elements).reduce((sum, arr) => sum + arr.length, 0),
    recommendations
  };
}

/**
 * Comprehensive accessibility check for batch upload features
 */
export function checkBatchUploadAccessibility() {
  const colorReport = generateAccessibilityReport();
  const keyboardReport = checkKeyboardAccessibility();
  
  return {
    colorContrast: colorReport,
    keyboardNavigation: keyboardReport,
    overallScore: calculateAccessibilityScore(colorReport, keyboardReport),
    complianceLevel: determineComplianceLevel(colorReport)
  };
}

function calculateAccessibilityScore(colorReport, keyboardReport) {
  const colorScore = (colorReport.summary.passing.AA_normal / colorReport.summary.totalTests) * 70;
  const keyboardScore = keyboardReport.recommendations.length === 0 ? 30 : Math.max(0, 30 - keyboardReport.recommendations.length * 5);
  
  return Math.round(colorScore + keyboardScore);
}

function determineComplianceLevel(colorReport) {
  const { passing, totalTests } = colorReport.summary;
  
  if (passing.AAA_normal === totalTests) return 'AAA';
  if (passing.AA_normal === totalTests) return 'AA';
  return 'Non-compliant';
}

export default {
  getContrastRatio,
  checkWCAGCompliance,
  testGlassMorphismColors,
  generateAccessibilityReport,
  checkKeyboardAccessibility,
  checkBatchUploadAccessibility
};