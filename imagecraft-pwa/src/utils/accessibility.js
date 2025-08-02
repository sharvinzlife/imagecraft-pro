/**
 * Accessibility Utilities
 * WCAG 2.1 AA compliance helpers for collage system
 */

// Announce changes to screen readers
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Generate unique IDs for accessibility
export const generateAccessibleId = (prefix = 'collage') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Check color contrast ratio
export const checkContrastRatio = (foreground, background) => {
  const getLuminance = (color) => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    // Calculate relative luminance
    const toLinear = (c) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };
  
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

// Validate text contrast meets WCAG standards
export const validateTextContrast = (foreground, background, level = 'AA', size = 'normal') => {
  const ratio = checkContrastRatio(foreground, background);
  
  const requirements = {
    'AA': { normal: 4.5, large: 3 },
    'AAA': { normal: 7, large: 4.5 }
  };
  
  const required = requirements[level][size];
  return {
    ratio: ratio.toFixed(2),
    passes: ratio >= required,
    required,
    level,
    size
  };
};

// Focus management utilities
export const focusManager = {
  // Store previous focus
  previousFocus: null,
  
  // Trap focus within container
  trapFocus(container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    firstFocusable?.focus();
    
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  },
  
  // Save current focus
  saveFocus() {
    this.previousFocus = document.activeElement;
  },
  
  // Restore previous focus
  restoreFocus() {
    if (this.previousFocus && typeof this.previousFocus.focus === 'function') {
      this.previousFocus.focus();
      this.previousFocus = null;
    }
  },
  
  // Find next focusable element
  findNextFocusable(container, direction = 'forward') {
    const focusableElements = Array.from(container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ));
    
    const currentIndex = focusableElements.indexOf(document.activeElement);
    
    if (direction === 'forward') {
      return focusableElements[currentIndex + 1] || focusableElements[0];
    } else {
      return focusableElements[currentIndex - 1] || focusableElements[focusableElements.length - 1];
    }
  }
};

// Keyboard navigation helpers
export const keyboardNavigation = {
  // Handle arrow key navigation in grids
  handleGridNavigation(e, container, columns) {
    const items = Array.from(container.querySelectorAll('[role="gridcell"], [role="button"]'));
    const currentIndex = items.indexOf(document.activeElement);
    
    if (currentIndex === -1) return;
    
    let nextIndex = currentIndex;
    
    switch (e.key) {
      case 'ArrowRight':
        nextIndex = Math.min(currentIndex + 1, items.length - 1);
        break;
      case 'ArrowLeft':
        nextIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'ArrowDown':
        nextIndex = Math.min(currentIndex + columns, items.length - 1);
        break;
      case 'ArrowUp':
        nextIndex = Math.max(currentIndex - columns, 0);
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = items.length - 1;
        break;
      default:
        return;
    }
    
    e.preventDefault();
    items[nextIndex]?.focus();
  },
  
  // Handle list navigation
  handleListNavigation(e, container) {
    const items = Array.from(container.querySelectorAll('[role="option"], [role="menuitem"], [role="button"]'));
    const currentIndex = items.indexOf(document.activeElement);
    
    if (currentIndex === -1) return;
    
    let nextIndex = currentIndex;
    
    switch (e.key) {
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % items.length;
        break;
      case 'ArrowUp':
        nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = items.length - 1;
        break;
      default:
        return;
    }
    
    e.preventDefault();
    items[nextIndex]?.focus();
  }
};

// Screen reader utilities
export const screenReader = {
  // Describe image for screen readers
  describeImage(photo, slot) {
    const aspectRatio = slot.aspectRatio ? ` in ${slot.aspectRatio} format` : '';
    const size = photo.dimensions ? ` (${photo.dimensions.width}×${photo.dimensions.height} pixels)` : '';
    return `Image: ${photo.name}${aspectRatio}${size}`;
  },
  
  // Describe template for screen readers
  describeTemplate(template) {
    const slots = template.photoSlots.length;
    const platforms = template.platforms.join(', ');
    return `${template.name} template with ${slots} photo slots for ${platforms}`;
  },
  
  // Describe canvas state
  describeCanvasState(state) {
    const { template, slotAssignments } = state;
    if (!template) return 'No template selected';
    
    const filledSlots = slotAssignments.filter(a => a.photoId).length;
    const totalSlots = template.photoSlots.length;
    
    return `${template.name}: ${filledSlots} of ${totalSlots} photo slots filled`;
  }
};

// High contrast mode detection
export const highContrastMode = {
  // Check if high contrast mode is enabled
  isEnabled() {
    return window.matchMedia('(prefers-contrast: high)').matches;
  },
  
  // Listen for high contrast mode changes
  onChange(callback) {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    mediaQuery.addEventListener('change', callback);
    
    return () => {
      mediaQuery.removeEventListener('change', callback);
    };
  },
  
  // Apply high contrast styles
  applyStyles(element) {
    if (this.isEnabled()) {
      element.classList.add('high-contrast');
    } else {
      element.classList.remove('high-contrast');
    }
  }
};

// Reduced motion detection
export const reducedMotion = {
  // Check if reduced motion is preferred
  isPreferred() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
  
  // Listen for reduced motion preference changes
  onChange(callback) {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', callback);
    
    return () => {
      mediaQuery.removeEventListener('change', callback);
    };
  },
  
  // Apply reduced motion styles
  applyStyles(element) {
    if (this.isPreferred()) {
      element.classList.add('reduce-motion');
    } else {
      element.classList.remove('reduce-motion');
    }
  }
};

// Touch accessibility helpers
export const touchAccessibility = {
  // Check if device supports touch
  isTouch() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },
  
  // Ensure minimum touch target size (44px)
  ensureTouchTargetSize(element) {
    if (this.isTouch()) {
      const rect = element.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        element.style.minWidth = '44px';
        element.style.minHeight = '44px';
      }
    }
  },
  
  // Add touch-friendly spacing
  addTouchSpacing(container) {
    if (this.isTouch()) {
      container.classList.add('touch-spacing');
    }
  }
};

// Accessibility validator
export const accessibilityValidator = {
  // Validate component accessibility
  validateComponent(element) {
    const issues = [];
    
    // Check for missing alt text on images
    const images = element.querySelectorAll('img');
    images.forEach(img => {
      if (!img.alt && !img.getAttribute('aria-label')) {
        issues.push(`Image missing alt text: ${img.src}`);
      }
    });
    
    // Check for missing labels on form controls
    const inputs = element.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      const hasLabel = input.labels?.length > 0 || 
                     input.getAttribute('aria-label') || 
                     input.getAttribute('aria-labelledby');
      if (!hasLabel) {
        issues.push(`Form control missing label: ${input.name || input.id}`);
      }
    });
    
    // Check for buttons without accessible names
    const buttons = element.querySelectorAll('button');
    buttons.forEach(button => {
      const hasName = button.textContent?.trim() || 
                     button.getAttribute('aria-label') || 
                     button.getAttribute('aria-labelledby');
      if (!hasName) {
        issues.push('Button missing accessible name');
      }
    });
    
    // Check for proper heading hierarchy
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.slice(1));
      if (level > lastLevel + 1) {
        issues.push(`Heading level skipped: ${heading.tagName} after H${lastLevel}`);
      }
      lastLevel = level;
    });
    
    return issues;
  },
  
  // Log accessibility issues
  logIssues(element, componentName = 'Component') {
    const issues = this.validateComponent(element);
    if (issues.length > 0) {
      console.warn(`Accessibility issues in ${componentName}:`, issues);
    }
    return issues.length === 0;
  }
};

// Export all utilities
export default {
  announceToScreenReader,
  generateAccessibleId,
  checkContrastRatio,
  validateTextContrast,
  focusManager,
  keyboardNavigation,
  screenReader,
  highContrastMode,
  reducedMotion,
  touchAccessibility,
  accessibilityValidator
};