/**
 * WCAG 2.1 Contrast Ratio Calculator
 * Implements the official WCAG luminance and contrast ratio formulas
 */

/**
 * Convert sRGB color value to linear RGB
 * @param {number} colorValue - sRGB color value (0-255)
 * @returns {number} Linear RGB value (0-1)
 */
function sRGBToLinear(colorValue) {
  const normalized = colorValue / 255;
  return normalized <= 0.03928 
    ? normalized / 12.92 
    : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

/**
 * Calculate relative luminance using WCAG formula
 * @param {object} rgb - RGB color object {r, g, b}
 * @returns {number} Relative luminance (0-1)
 */
function calculateLuminance(rgb) {
  const rLinear = sRGBToLinear(rgb.r);
  const gLinear = sRGBToLinear(rgb.g);
  const bLinear = sRGBToLinear(rgb.b);
  
  // WCAG luminance formula: L = 0.2126 * R + 0.7152 * G + 0.0722 * B
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Convert hex color to RGB
 * @param {string} hex - Hex color string (e.g., "#ffffff")
 * @returns {object} RGB object {r, g, b}
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Convert RGBA to RGB by compositing over a white background
 * @param {object} rgba - RGBA color {r, g, b, a}
 * @param {object} background - Background RGB color (default: white)
 * @returns {object} Composited RGB color
 */
function rgbaToRgb(rgba, background = {r: 255, g: 255, b: 255}) {
  const alpha = rgba.a;
  return {
    r: Math.round((1 - alpha) * background.r + alpha * rgba.r),
    g: Math.round((1 - alpha) * background.g + alpha * rgba.g),
    b: Math.round((1 - alpha) * background.b + alpha * rgba.b)
  };
}

/**
 * Calculate contrast ratio between two colors
 * @param {object} color1 - First RGB color
 * @param {object} color2 - Second RGB color  
 * @returns {number} Contrast ratio (1:1 to 21:1)
 */
function calculateContrastRatio(color1, color2) {
  const luminance1 = calculateLuminance(color1);
  const luminance2 = calculateLuminance(color2);
  
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check WCAG 2.1 compliance levels
 * @param {number} ratio - Contrast ratio
 * @returns {object} Compliance status for different levels
 */
function checkWCAGCompliance(ratio) {
  return {
    AA_normal: ratio >= 4.5,      // WCAG 2.1 AA for normal text
    AA_large: ratio >= 3.0,       // WCAG 2.1 AA for large text (18pt+ or 14pt+ bold)
    AAA_normal: ratio >= 7.0,     // WCAG 2.1 AAA for normal text
    AAA_large: ratio >= 4.5,      // WCAG 2.1 AAA for large text
    ratio: ratio,
    formatted: `${ratio.toFixed(2)}:1`
  };
}

/**
 * Analyze a color combination and provide recommendations
 * @param {string} description - Description of the color combination
 * @param {object} foreground - Foreground color (text)
 * @param {object} background - Background color
 * @returns {object} Complete analysis
 */
function analyzeColorCombination(description, foreground, background) {
  const ratio = calculateContrastRatio(foreground, background);
  const compliance = checkWCAGCompliance(ratio);
  
  let recommendations = [];
  
  if (!compliance.AA_normal) {
    recommendations.push(`❌ Fails WCAG 2.1 AA for normal text (needs 4.5:1, got ${compliance.formatted})`);
    
    // Calculate needed adjustments
    const targetRatio = 4.5;
    const currentLighter = Math.max(calculateLuminance(foreground), calculateLuminance(background));
    const currentDarker = Math.min(calculateLuminance(foreground), calculateLuminance(background));
    
    if (calculateLuminance(foreground) > calculateLuminance(background)) {
      // Foreground is lighter - suggest making background darker or foreground lighter
      recommendations.push(`💡 Consider darkening background or lightening text`);
    } else {
      // Background is lighter - suggest making foreground darker or background lighter
      recommendations.push(`💡 Consider darkening text or lightening background`);
    }
  } else if (!compliance.AAA_normal) {
    recommendations.push(`⚠️ Passes WCAG 2.1 AA but not AAA (${compliance.formatted})`);
  } else {
    recommendations.push(`✅ Excellent contrast - passes WCAG 2.1 AAA (${compliance.formatted})`);
  }
  
  if (compliance.AA_large && !compliance.AA_normal) {
    recommendations.push(`📏 Acceptable for large text only (18pt+ or 14pt+ bold)`);
  }
  
  return {
    description,
    foreground,
    background,
    contrastRatio: ratio,
    compliance,
    recommendations
  };
}

// Main analysis function for the specific color combinations
function analyzeClerkModalContrasts() {
  console.log('🔍 WCAG 2.1 AA Contrast Analysis for Clerk Authentication Modal\n');
  console.log('=' .repeat(70));
  
  const combinations = [
    {
      description: '1. White text on orange background',
      foreground: hexToRgb('#ffffff'), // White text
      background: rgbaToRgb({r: 234, g: 88, b: 12, a: 0.97}) // Orange background composited
    },
    {
      description: '2. Dark text on white background', 
      foreground: hexToRgb('#0f172a'), // Dark text
      background: rgbaToRgb({r: 255, g: 255, b: 255, a: 0.95}) // White background composited
    },
    {
      description: '3. Orange text on white background',
      foreground: hexToRgb('#ea580c'), // Orange text
      background: rgbaToRgb({r: 255, g: 255, b: 255, a: 0.95}) // White background composited
    },
    {
      description: '4. Gray text on white background',
      foreground: hexToRgb('#374151'), // Gray text
      background: rgbaToRgb({r: 255, g: 255, b: 255, a: 0.95}) // White background composited
    }
  ];
  
  const results = combinations.map(combo => 
    analyzeColorCombination(combo.description, combo.foreground, combo.background)
  );
  
  // Display results
  results.forEach((result, index) => {
    console.log(`\n${result.description}`);
    console.log('-'.repeat(50));
    console.log(`Foreground RGB: rgb(${result.foreground.r}, ${result.foreground.g}, ${result.foreground.b})`);
    console.log(`Background RGB: rgb(${result.background.r}, ${result.background.g}, ${result.background.b})`);
    console.log(`Contrast Ratio: ${result.compliance.formatted}`);
    console.log(`WCAG 2.1 AA Normal Text: ${result.compliance.AA_normal ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`WCAG 2.1 AA Large Text: ${result.compliance.AA_large ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`WCAG 2.1 AAA Normal Text: ${result.compliance.AAA_normal ? '✅ PASS' : '❌ FAIL'}`);
    console.log('\nRecommendations:');
    result.recommendations.forEach(rec => console.log(`  ${rec}`));
  });
  
  // Summary
  const passing = results.filter(r => r.compliance.AA_normal).length;
  const total = results.length;
  
  console.log('\n' + '='.repeat(70));
  console.log(`📊 SUMMARY: ${passing}/${total} combinations pass WCAG 2.1 AA for normal text`);
  
  // Glass morphism specific recommendations
  console.log('\n🪟 GLASS MORPHISM AUTHENTICATION MODAL RECOMMENDATIONS:');
  console.log('-'.repeat(70));
  console.log('1. 🎨 Use solid or high-opacity backgrounds for text areas');
  console.log('2. 🔤 Increase text weight (font-weight: 600-700) for better readability');
  console.log('3. 🌓 Add subtle text shadows: text-shadow: 0 1px 2px rgba(0,0,0,0.1)');
  console.log('4. 📱 Test on various background images/colors');
  console.log('5. ⚡ Consider a backdrop overlay: bg-black/5 for better text contrast');
  console.log('6. 🎯 Use focus rings that work on glass: ring-2 ring-blue-500/50');
  
  // Alternative accessible color combinations
  console.log('\n✨ ALTERNATIVE ACCESSIBLE COLOR COMBINATIONS:');
  console.log('-'.repeat(70));
  
  const alternatives = [
    {
      desc: 'High contrast white on dark glass',
      fg: '#ffffff',
      bg: 'rgba(15, 23, 42, 0.95)', // slate-900 with high opacity
      usage: 'Primary buttons, important text'
    },
    {
      desc: 'Dark text on light glass with backdrop',
      fg: '#0f172a', 
      bg: 'rgba(255, 255, 255, 0.98)', // Nearly opaque white
      usage: 'Form inputs, body text'
    },
    {
      desc: 'Blue accent on white glass',
      fg: '#1e40af', // blue-800
      bg: 'rgba(255, 255, 255, 0.95)',
      usage: 'Links, secondary actions'
    },
    {
      desc: 'Green success on white glass',
      fg: '#166534', // green-800  
      bg: 'rgba(255, 255, 255, 0.95)',
      usage: 'Success messages'
    }
  ];
  
  alternatives.forEach(alt => {
    const fgRgb = hexToRgb(alt.fg);
    const bgRgba = alt.bg.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    const bgRgb = rgbaToRgb({
      r: parseInt(bgRgba[1]), 
      g: parseInt(bgRgba[2]), 
      b: parseInt(bgRgba[3]), 
      a: parseFloat(bgRgba[4])
    });
    
    const ratio = calculateContrastRatio(fgRgb, bgRgb);
    const compliance = checkWCAGCompliance(ratio);
    
    console.log(`\n${alt.desc}:`);
    console.log(`  Colors: ${alt.fg} on ${alt.bg}`);
    console.log(`  Ratio: ${compliance.formatted} ${compliance.AA_normal ? '✅' : '❌'}`);
    console.log(`  Usage: ${alt.usage}`);
  });
  
  return results;
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateContrastRatio,
    checkWCAGCompliance,
    analyzeColorCombination,
    analyzeClerkModalContrasts,
    hexToRgb,
    rgbaToRgb,
    calculateLuminance
  };
}

// Run analysis if called directly
if (typeof window === 'undefined') {
  analyzeClerkModalContrasts();
}