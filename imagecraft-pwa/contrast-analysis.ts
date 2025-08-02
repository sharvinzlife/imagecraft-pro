/**
 * Glass Morphism Contrast Analysis
 * Analyzing all color combinations for WCAG 2.1 AA/AAA compliance
 */

import {
  calculateGlassContrast,
  hexToRgb,
  parseRgba,
  formatRgb,
  rgbToHex,
  type ContrastResult
} from './src/utils/contrastCalculator';

// Test color combinations
const testCombinations = [
  {
    name: "Modal Background with Text",
    description: "Main modal text on semi-transparent white background",
    foregroundColor: "#111827", // gray-900
    backgroundColorRgba: "rgba(255, 255, 255, 0.96)",
    isLargeText: false
  },
  {
    name: "Primary Button",
    description: "White text on semi-transparent orange button",
    foregroundColor: "#ffffff",
    backgroundColorRgba: "rgba(234, 88, 12, 0.97)", // #ea580c with 97% opacity
    isLargeText: false
  },
  {
    name: "Input Fields - Text",
    description: "Input text on semi-transparent white background",
    foregroundColor: "#111827", // gray-900
    backgroundColorRgba: "rgba(255, 255, 255, 0.95)",
    isLargeText: false
  },
  {
    name: "Input Fields - Placeholder",
    description: "Placeholder text on semi-transparent white background",
    foregroundColor: "#525862", // Custom gray
    backgroundColorRgba: "rgba(255, 255, 255, 0.95)",
    isLargeText: false
  },
  {
    name: "Error Text",
    description: "Red error text on modal background",
    foregroundColor: "#dc2626", // red-600
    backgroundColorRgba: "rgba(255, 255, 255, 0.96)",
    isLargeText: false
  },
  {
    name: "Links",
    description: "Orange links on modal background",
    foregroundColor: "#c2410c", // orange-700
    backgroundColorRgba: "rgba(255, 255, 255, 0.96)",
    isLargeText: false
  },
  {
    name: "Focus Indicators",
    description: "Orange focus ring visibility assessment",
    foregroundColor: "#ea580c", // For visibility assessment
    backgroundColorRgba: "rgba(255, 255, 255, 0.96)",
    isLargeText: false,
    special: "focus-indicator"
  }
];

console.log("🔍 WCAG 2.1 AA/AAA Contrast Analysis for Glass Morphism Design");
console.log("=" .repeat(80));
console.log();

testCombinations.forEach((combo, index) => {
  console.log(`${index + 1}. ${combo.name}`);
  console.log(`   ${combo.description}`);
  console.log(`   Foreground: ${combo.foregroundColor}`);
  console.log(`   Background: ${combo.backgroundColorRgba}`);
  
  const result = calculateGlassContrast(
    combo.foregroundColor,
    combo.backgroundColorRgba,
    { r: 255, g: 255, b: 255 }, // White underlying background
    combo.isLargeText
  );
  
  console.log(`   Final Background: ${formatRgb(result.finalBackgroundColor)} (${rgbToHex(result.finalBackgroundColor)})`);
  console.log(`   Contrast Ratio: ${result.contrastRatio}:1`);
  console.log(`   WCAG AA (${combo.isLargeText ? '3:1' : '4.5:1'}): ${result.wcagAA ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   WCAG AAA (${combo.isLargeText ? '4.5:1' : '7:1'}): ${result.wcagAAA ? '✅ PASS' : '❌ FAIL'}`);
  
  // Recommendations
  if (!result.wcagAA) {
    console.log(`   🔧 RECOMMENDATION: Insufficient contrast for AA compliance`);
    if (combo.name.includes("Button")) {
      console.log(`      • Increase background opacity to 0.98 or higher`);
      console.log(`      • Or darken background color to #d97706 (orange-600)`);
    } else if (combo.name.includes("Text") || combo.name.includes("Error") || combo.name.includes("Links")) {
      console.log(`      • Darken text color for better contrast`);
      console.log(`      • Or increase background opacity to 0.98+`);
    } else if (combo.name.includes("Placeholder")) {
      console.log(`      • Darken placeholder to #374151 (gray-700) or darker`);
    }
  } else if (!result.wcagAAA) {
    console.log(`   ⚠️  AAA Enhancement: Consider darkening text for premium accessibility`);
  } else {
    console.log(`   🌟 EXCELLENT: Meets both AA and AAA standards`);
  }
  
  console.log();
});

// Special analysis for focus indicators
console.log("🎯 FOCUS INDICATOR VISIBILITY ANALYSIS");
console.log("=" .repeat(50));
console.log();

const focusRingColor = parseRgba("rgba(234, 88, 12, 0.6)"); // 60% opacity orange
const modalBackground = parseRgba("rgba(255, 255, 255, 0.96)");

// Blend focus ring with modal background
const blendedFocusRing = {
  r: Math.round(focusRingColor.r * focusRingColor.a + modalBackground.r * modalBackground.a * (1 - focusRingColor.a)),
  g: Math.round(focusRingColor.g * focusRingColor.a + modalBackground.g * modalBackground.a * (1 - focusRingColor.a)),
  b: Math.round(focusRingColor.b * focusRingColor.a + modalBackground.b * modalBackground.a * (1 - focusRingColor.a))
};

const focusContrast = calculateGlassContrast(
  rgbToHex(blendedFocusRing),
  "rgba(255, 255, 255, 0.96)"
);

console.log(`Focus Ring Color: rgba(234, 88, 12, 0.6)`);
console.log(`Against Modal Background: rgba(255, 255, 255, 0.96)`);
console.log(`Effective Ring Color: ${formatRgb(blendedFocusRing)} (${rgbToHex(blendedFocusRing)})`);
console.log(`Visibility Contrast: ${focusContrast.contrastRatio}:1`);
console.log(`Focus Indicator Standard (3:1): ${focusContrast.contrastRatio >= 3 ? '✅ PASS' : '❌ FAIL'}`);

if (focusContrast.contrastRatio < 3) {
  console.log(`🔧 RECOMMENDATION: Increase focus ring opacity to 0.8+ or use darker orange`);
} else {
  console.log(`🌟 Focus indicators meet visibility requirements`);
}

console.log();
console.log("📋 SUMMARY & RECOMMENDATIONS");
console.log("=" .repeat(40));
console.log();

// Calculate overall compliance
const totalTests = testCombinations.length;
const results = testCombinations.map(combo => 
  calculateGlassContrast(combo.foregroundColor, combo.backgroundColorRgba, { r: 255, g: 255, b: 255 }, combo.isLargeText)
);

const aaCompliant = results.filter(r => r.wcagAA).length;
const aaaCompliant = results.filter(r => r.wcagAAA).length;

console.log(`WCAG AA Compliance: ${aaCompliant}/${totalTests} (${Math.round(aaCompliant/totalTests*100)}%)`);
console.log(`WCAG AAA Compliance: ${aaaCompliant}/${totalTests} (${Math.round(aaaCompliant/totalTests*100)}%)`);
console.log();

console.log("🎨 GLASS MORPHISM ACCESSIBILITY BEST PRACTICES:");
console.log("• Always calculate final blended colors, don't rely on alpha values alone");
console.log("• Test against multiple background scenarios (white, gradients, images)");
console.log("• Use minimum 96% opacity for text backgrounds in glass morphism");
console.log("• Implement fallback solid colors for users who disable transparency");
console.log("• Test with actual background images, not just solid colors");
console.log("• Consider prefers-contrast: high media query for enhanced accessibility");