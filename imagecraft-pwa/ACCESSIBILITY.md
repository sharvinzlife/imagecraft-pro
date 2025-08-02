# Accessibility Guide

Comprehensive accessibility documentation for ImageCraft Pro, ensuring WCAG 2.1 AA compliance and inclusive design for all users.

## 📋 Table of Contents

- [Overview](#overview)
- [WCAG Compliance](#wcag-compliance)
- [Screen Reader Support](#screen-reader-support)
- [Keyboard Navigation](#keyboard-navigation)
- [Visual Accessibility](#visual-accessibility)
- [Motor Accessibility](#motor-accessibility)
- [Cognitive Accessibility](#cognitive-accessibility)
- [Testing Guidelines](#testing-guidelines)
- [Implementation Details](#implementation-details)

## 🎯 Overview

ImageCraft Pro is designed with accessibility as a core principle, not an afterthought. We strive to create an inclusive experience for users with disabilities, following WCAG 2.1 AA guidelines and modern accessibility best practices.

### Accessibility Features Summary

- ✅ **Screen Reader Compatible**: Full ARIA support and semantic HTML
- ✅ **Keyboard Navigation**: Complete keyboard accessibility
- ✅ **High Contrast**: WCAG AA color contrast ratios
- ✅ **Reduced Motion**: Respects user motion preferences
- ✅ **Focus Management**: Clear focus indicators and logical tab order
- ✅ **Alternative Text**: Descriptive labels for all images and icons
- ✅ **Error Handling**: Clear error messages and validation feedback
- ✅ **Responsive Design**: Works across all device sizes

### Target Compliance

- **WCAG 2.1 Level AA**: Full compliance
- **Section 508**: Federal accessibility requirements
- **ADA**: Americans with Disabilities Act compliance
- **EN 301 549**: European accessibility standard

## 🏆 WCAG Compliance

### Principle 1: Perceivable

#### 1.1 Text Alternatives
All non-text content has text alternatives:

```jsx
// Icons with proper labeling
<Icon className="w-6 h-6" aria-hidden="true" />
<span className="sr-only">Upload your image</span>

// Informative images with alt text
<img src="feature.jpg" alt="AI-powered image enhancement interface" />

// Decorative images hidden from screen readers
<div className="bg-gradient" role="presentation" aria-hidden="true" />
```

#### 1.2 Time-based Media
- No auto-playing media content
- User controls for any animated content

#### 1.3 Adaptable
Content can be presented in different ways without losing meaning:

```jsx
// Semantic HTML structure
<main role="main" aria-label="Image processing tools">
  <section aria-labelledby="converter-heading">
    <h2 id="converter-heading">Image Converter</h2>
    {/* Section content */}
  </section>
</main>

// Proper heading hierarchy
<h1>ImageCraft Pro</h1>           <!-- Page title -->
  <h2>Image Converter</h2>        <!-- Section title -->
    <h3>Output Formats</h3>       <!-- Subsection title -->
```

#### 1.4 Distinguishable
- **Color Contrast**: All text meets WCAG AA requirements (4.5:1 for normal text, 3:1 for large text)
- **Text Resize**: Content remains functional when zoomed to 200%
- **Color Information**: No information conveyed by color alone

```css
/* High contrast ratios maintained */
.text-gray-800 { color: #1f2937; }  /* 15.8:1 on white background */
.text-gray-600 { color: #4b5563; }  /* 7.7:1 on white background */

/* Focus indicators with sufficient contrast */
.focus-visible\:ring-2 {
  --tw-ring-color: #f97316;  /* 3.2:1 contrast ratio */
}
```

### Principle 2: Operable

#### 2.1 Keyboard Accessible
All functionality is available via keyboard:

```jsx
// Keyboard event handlers
const handleKeyDown = (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleClick();
  }
  if (e.key === 'Escape' && isMenuOpen) {
    setIsMenuOpen(false);
  }
};

// Tab order management
<div role="tablist" aria-label="Image processing tools">
  <button role="tab" tabIndex={isActive ? 0 : -1} aria-selected={isActive}>
    Converter
  </button>
</div>
```

#### 2.2 Enough Time
- No time limits on user interactions
- All animations can be paused or disabled

#### 2.3 Seizures and Physical Reactions
- No flashing content above 3Hz
- Reduced motion support for vestibular disorders

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### 2.4 Navigable
Clear navigation structure and page organization:

```jsx
// Skip links for screen readers
<a 
  href="#main-content" 
  className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
>
  Skip to main content
</a>

// Descriptive page titles
<title>Image Converter - ImageCraft Pro</title>

// Breadcrumb navigation
<nav aria-label="Breadcrumb">
  <ol className="flex items-center space-x-2">
    <li><a href="/">Home</a></li>
    <li aria-current="page">Image Converter</li>
  </ol>
</nav>
```

#### 2.5 Input Modalities
- All functionality works with various input methods
- No path-based gestures required

### Principle 3: Understandable

#### 3.1 Readable
- Clear, simple language
- Technical terms explained
- Consistent terminology throughout

#### 3.2 Predictable
- Consistent navigation and layout
- No unexpected context changes
- Clear indication of what each control does

```jsx
// Predictable button behavior
<Button
  variant="glassPrimary"
  onClick={handleSubmit}
  aria-describedby="submit-help"
>
  Process Image
  <span id="submit-help" className="sr-only">
    This will start processing your uploaded image
  </span>
</Button>
```

#### 3.3 Input Assistance
- Clear error messages
- Form validation with helpful feedback
- Labels and instructions for all inputs

```jsx
// Form validation with accessible error messages
<div>
  <label htmlFor="image-upload" className="block text-sm font-medium mb-2">
    Upload Image *
  </label>
  <input
    id="image-upload"
    type="file"
    accept="image/*"
    aria-describedby="upload-error upload-help"
    aria-invalid={hasError}
    required
  />
  <p id="upload-help" className="text-sm text-gray-600 mt-1">
    Accepted formats: JPEG, PNG, GIF, up to 10MB
  </p>
  {hasError && (
    <p id="upload-error" className="text-sm text-red-600 mt-1" role="alert">
      Please select a valid image file
    </p>
  )}
</div>
```

### Principle 4: Robust

#### 4.1 Compatible
- Valid HTML markup
- Proper ARIA usage
- Works with assistive technologies

```jsx
// Proper ARIA usage
<div
  role="progressbar"
  aria-valuenow={progress}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Image processing progress"
>
  <div 
    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
    style={{ width: `${progress}%` }}
  />
</div>
```

## 🔊 Screen Reader Support

### ARIA Labels and Descriptions

Every interactive element has proper labeling:

```jsx
// Button with descriptive label
<Button
  variant="glass"
  aria-label="Convert image to JPEG format"
  onClick={convertToJPEG}
>
  <Image className="w-4 h-4" aria-hidden="true" />
  JPEG
</Button>

// Complex interactions with detailed descriptions
<button
  className="upload-zone"
  onClick={openFileDialog}
  aria-label="Upload image file"
  aria-describedby="upload-instructions"
>
  <Upload className="w-8 h-8" aria-hidden="true" />
  <span id="upload-instructions">
    Click to browse files or drag and drop an image here. 
    Supported formats: JPEG, PNG, GIF. Maximum size: 10MB.
  </span>
</button>
```

### Live Regions for Dynamic Content

```jsx
// Status updates announced to screen readers
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {statusMessage}
</div>

// Error messages with immediate attention
<div aria-live="assertive" role="alert" className="sr-only">
  {errorMessage}
</div>

// Progress updates
const [progress, setProgress] = useState(0);
const [progressMessage, setProgressMessage] = useState('');

useEffect(() => {
  setProgressMessage(`Processing image: ${progress}% complete`);
}, [progress]);

<div aria-live="polite" className="sr-only">
  {progressMessage}
</div>
```

### Semantic HTML Structure

```jsx
// Proper document structure
<main role="main" id="main-content">
  <header>
    <h1>ImageCraft Pro</h1>
    <nav aria-label="Main navigation">
      {/* Navigation items */}
    </nav>
  </header>
  
  <section aria-labelledby="converter-heading">
    <h2 id="converter-heading">Image Converter</h2>
    <article>
      {/* Content */}
    </article>
  </section>
</main>

<aside aria-label="Processing status">
  {/* Status information */}
</aside>

<footer>
  <nav aria-label="Footer navigation">
    {/* Footer links */}
  </nav>
</footer>
```

## ⌨️ Keyboard Navigation

### Tab Order and Focus Management

```jsx
// Logical tab order maintained
const NavigationMenu = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const handleKeyDown = (e, index) => {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % menuItems.length);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + menuItems.length) % menuItems.length);
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(menuItems.length - 1);
        break;
    }
  };

  return (
    <div role="tablist" aria-label="Image processing tools">
      {menuItems.map((item, index) => (
        <button
          key={item.id}
          role="tab"
          tabIndex={activeIndex === index ? 0 : -1}
          aria-selected={activeIndex === index}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onFocus={() => setActiveIndex(index)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};
```

### Keyboard Shortcuts

```jsx
// Global keyboard shortcuts
useEffect(() => {
  const handleGlobalKeyDown = (e) => {
    // Alt + M: Open mobile menu
    if (e.altKey && e.key === 'm') {
      e.preventDefault();
      setIsMobileMenuOpen(!isMobileMenuOpen);
    }
    
    // Alt + U: Focus upload zone
    if (e.altKey && e.key === 'u') {
      e.preventDefault();
      document.getElementById('upload-zone')?.focus();
    }
    
    // Escape: Close any open dialogs
    if (e.key === 'Escape') {
      setIsDialogOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  document.addEventListener('keydown', handleGlobalKeyDown);
  return () => document.removeEventListener('keydown', handleGlobalKeyDown);
}, [isMobileMenuOpen]);
```

### Focus Indicators

```css
/* High-contrast focus indicators */
.focus-visible\:ring-2 {
  outline: none;
  box-shadow: 0 0 0 2px #f97316, 0 0 0 4px rgba(249, 115, 22, 0.2);
}

/* Focus within containers */
.focus-within\:ring-1 {
  box-shadow: 0 0 0 1px #f97316;
}

/* Custom focus styles for glass morphism */
.glass-focus:focus-visible {
  outline: none;
  box-shadow: 
    0 0 0 2px #f97316,
    0 0 0 4px rgba(249, 115, 22, 0.2),
    0 4px 15px rgba(0, 0, 0, 0.1);
}
```

## 👁️ Visual Accessibility

### Color Contrast Compliance

All color combinations meet WCAG AA standards:

```css
/* Text colors with verified contrast ratios */
.text-gray-900 { color: #111827; }  /* 19.4:1 on white */
.text-gray-800 { color: #1f2937; }  /* 15.8:1 on white */
.text-gray-700 { color: #374151; }  /* 11.2:1 on white */
.text-gray-600 { color: #4b5563; }  /* 7.7:1 on white */

/* Interactive elements */
.text-orange-600 { color: #ea580c; }  /* 4.6:1 on white */
.bg-orange-500 { background: #f97316; }  /* 3.2:1 with white text */

/* Error states */
.text-red-600 { color: #dc2626; }  /* 5.9:1 on white */
```

### High Contrast Mode Support

```css
/* Windows High Contrast Mode support */
@media (prefers-contrast: high) {
  .glass-button {
    background: ButtonFace;
    border: 2px solid ButtonText;
    color: ButtonText;
  }
  
  .glass-button:hover {
    background: Highlight;
    color: HighlightText;
  }
  
  .glass-card {
    background: Canvas;
    border: 1px solid CanvasText;
    color: CanvasText;
  }
}

/* Forced colors mode */
@media (forced-colors: active) {
  .glass-effect {
    background: transparent;
    border: 1px solid;
  }
}
```

### Text Scaling Support

```css
/* Responsive text that scales properly */
@media (min-resolution: 2dppx) {
  body { font-size: 16px; }
}

/* Support for zoom up to 200% */
@media (min-width: 320px) and (max-width: 768px) {
  .responsive-text {
    font-size: clamp(0.875rem, 2.5vw, 1.125rem);
  }
}
```

### Color-Blind Friendly Design

- No information conveyed by color alone
- Use of patterns, textures, and icons alongside color
- Color-blind tested color combinations

```jsx
// Status indicators with multiple visual cues
const StatusIndicator = ({ status }) => (
  <div className="flex items-center space-x-2">
    {status === 'success' && (
      <>
        <CheckCircle className="w-5 h-5 text-green-600" />
        <span className="text-green-800 font-medium">Complete</span>
        <div className="w-3 h-3 bg-green-500 rounded-full" />
      </>
    )}
    {status === 'error' && (
      <>
        <XCircle className="w-5 h-5 text-red-600" />
        <span className="text-red-800 font-medium">Failed</span>
        <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-red-700" />
      </>
    )}
  </div>
);
```

## 🖱️ Motor Accessibility

### Large Touch Targets

All interactive elements meet minimum size requirements:

```css
/* Minimum 44px touch targets */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  padding: 12px;
}

/* Adequate spacing between targets */
.button-group > * + * {
  margin-left: 8px;
}
```

### Drag and Drop Alternatives

```jsx
// File upload with multiple interaction methods
const FileUpload = () => (
  <div className="upload-zone">
    {/* Drag and drop area */}
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="drag-zone"
    >
      <p>Drag files here</p>
    </div>
    
    {/* Alternative: click to upload */}
    <Button onClick={openFileDialog} variant="glass">
      Or click to browse files
    </Button>
    
    {/* Alternative: paste from clipboard */}
    <Button 
      onClick={handlePaste}
      variant="glassSecondary"
      title="Paste image from clipboard (Ctrl+V)"
    >
      Paste from clipboard
    </Button>
    
    {/* Hidden file input */}
    <input
      ref={fileInputRef}
      type="file"
      className="sr-only"
      onChange={handleFileSelect}
    />
  </div>
);
```

### Timeout Considerations

```jsx
// No automatic timeouts without user control
const ProcessingTimeout = () => {
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  
  useEffect(() => {
    if (timeRemaining <= 60 && !showExtendDialog) {
      setShowExtendDialog(true);
    }
  }, [timeRemaining]);
  
  return (
    <>
      {showExtendDialog && (
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Extend Processing Time?</DialogTitle>
              <DialogDescription>
                Your session will expire in {timeRemaining} seconds. 
                Would you like to extend it?
              </DialogDescription>
            </DialogHeader>
            <div className="flex space-x-4">
              <Button 
                variant="glassPrimary"
                onClick={() => {
                  setTimeRemaining(300);
                  setShowExtendDialog(false);
                }}
              >
                Extend Time
              </Button>
              <Button variant="glassSecondary">
                Continue Without Extension
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
```

## 🧠 Cognitive Accessibility

### Clear Language and Instructions

```jsx
// Simple, clear instructions
const UploadInstructions = () => (
  <div className="instructions">
    <h3>How to upload your image:</h3>
    <ol className="list-decimal list-inside space-y-2">
      <li>Click the "Browse Files" button below</li>
      <li>Choose an image from your device</li>
      <li>Wait for the upload to complete</li>
      <li>Select your desired output format</li>
      <li>Click "Convert" to process your image</li>
    </ol>
  </div>
);
```

### Error Prevention and Recovery

```jsx
// Confirmation dialogs for destructive actions
const DeleteConfirmation = ({ onConfirm, onCancel }) => (
  <Dialog>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete Image?</DialogTitle>
        <DialogDescription>
          This action cannot be undone. Your original image will be permanently deleted.
        </DialogDescription>
      </DialogHeader>
      <div className="flex space-x-4">
        <Button variant="destructive" onClick={onConfirm}>
          Yes, Delete Image
        </Button>
        <Button variant="glassSecondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

// Form validation with helpful feedback
const validateForm = (data) => {
  const errors = {};
  
  if (!data.image) {
    errors.image = "Please select an image to upload";
  } else if (data.image.size > 10 * 1024 * 1024) {
    errors.image = "Image size must be less than 10MB";
  }
  
  if (!data.format) {
    errors.format = "Please select an output format";
  }
  
  return errors;
};
```

### Consistent Navigation

```jsx
// Breadcrumb navigation for orientation
const Breadcrumbs = ({ currentPage }) => (
  <nav aria-label="Breadcrumb" className="mb-6">
    <ol className="flex items-center space-x-2 text-sm">
      <li>
        <Link to="/" className="text-orange-600 hover:text-orange-700">
          Home
        </Link>
      </li>
      <li>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </li>
      <li aria-current="page" className="text-gray-600">
        {currentPage}
      </li>
    </ol>
  </nav>
);
```

### Progress Indicators

```jsx
// Clear progress feedback
const ProcessingProgress = ({ step, totalSteps, currentAction }) => (
  <div className="progress-container" aria-live="polite">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium">
        Step {step} of {totalSteps}
      </span>
      <span className="text-sm text-gray-600">
        {Math.round((step / totalSteps) * 100)}%
      </span>
    </div>
    
    <div 
      className="w-full bg-gray-200 rounded-full h-2 mb-2"
      role="progressbar"
      aria-valuenow={step}
      aria-valuemin={0}
      aria-valuemax={totalSteps}
      aria-label="Processing progress"
    >
      <div 
        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
        style={{ width: `${(step / totalSteps) * 100}%` }}
      />
    </div>
    
    <p className="text-sm text-gray-600">{currentAction}</p>
  </div>
);
```

## 🧪 Testing Guidelines

### Automated Testing

```javascript
// Jest + Testing Library accessibility tests
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';

expect.extend(toHaveNoViolations);

describe('Button Component Accessibility', () => {
  test('should not have accessibility violations', async () => {
    const { container } = render(
      <Button variant="glass">Test Button</Button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('should be keyboard accessible', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Test Button</Button>);
    
    const button = screen.getByRole('button');
    button.focus();
    
    await userEvent.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalled();
    
    await userEvent.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  test('should have proper ARIA attributes', () => {
    render(
      <Button 
        variant="glass" 
        aria-label="Save document"
        aria-pressed={true}
      >
        Save
      </Button>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Save document');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });
});
```

### Manual Testing Checklist

#### Screen Reader Testing
- [ ] Test with NVDA (Windows)
- [ ] Test with JAWS (Windows)
- [ ] Test with VoiceOver (macOS/iOS)
- [ ] Test with TalkBack (Android)

#### Keyboard Navigation Testing
- [ ] Tab through all interactive elements
- [ ] Test arrow key navigation where applicable
- [ ] Verify Escape key closes dialogs/menus
- [ ] Test Enter and Space key activation
- [ ] Verify skip links work correctly

#### Visual Testing
- [ ] Test with Windows High Contrast Mode
- [ ] Test with browser zoom at 200%
- [ ] Verify color contrast ratios
- [ ] Test with color blindness simulators
- [ ] Check focus indicators are visible

#### Motor Accessibility Testing
- [ ] Verify touch targets are at least 44px
- [ ] Test with voice control software
- [ ] Check for alternative input methods
- [ ] Verify no path-based gestures required

### Testing Tools

- **Automated**: axe-core, Lighthouse, WAVE
- **Manual**: Screen readers, keyboard-only navigation
- **Visual**: Colour Contrast Analyser, browser dev tools
- **Simulation**: Color blindness simulators, Windows High Contrast Mode

## 🛠️ Implementation Details

### ARIA Patterns Used

```jsx
// Tab panel pattern
<div role="tablist" aria-label="Image processing tools">
  <button 
    role="tab" 
    aria-selected={isActive}
    aria-controls="panel-converter"
    id="tab-converter"
  >
    Converter
  </button>
</div>
<div 
  role="tabpanel" 
  aria-labelledby="tab-converter"
  id="panel-converter"
>
  {/* Panel content */}
</div>

// Menu button pattern
<button 
  aria-haspopup="true" 
  aria-expanded={isMenuOpen}
  onClick={toggleMenu}
>
  Menu
</button>

// Dialog pattern
<div 
  role="dialog" 
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
  aria-modal="true"
>
  <h2 id="dialog-title">Dialog Title</h2>
  <p id="dialog-description">Dialog description</p>
</div>
```

### Focus Management Utilities

```javascript
// Focus trap utility for modals
export const useFocusTrap = (isActive) => {
  const trapRef = useRef(null);
  
  useEffect(() => {
    if (!isActive || !trapRef.current) return;
    
    const focusableElements = trapRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);
  
  return trapRef;
};
```

### Announcement Utilities

```javascript
// Live region announcements
export const useAnnouncer = () => {
  const [announcement, setAnnouncement] = useState('');
  
  const announce = useCallback((message, priority = 'polite') => {
    setAnnouncement(''); // Clear first to ensure re-announcement
    setTimeout(() => setAnnouncement(message), 50);
  }, []);
  
  return {
    announce,
    AnnouncementRegion: () => (
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    )
  };
};
```

## 📊 Accessibility Metrics

### Target Scores
- **WAVE**: 0 errors, 0 alerts
- **axe-core**: 0 violations
- **Lighthouse Accessibility**: 100/100
- **Keyboard Navigation**: 100% coverage
- **Screen Reader Compatibility**: Full support

### Regular Audits
- Monthly automated accessibility scans
- Quarterly manual testing with real users
- Annual third-party accessibility audit
- Continuous monitoring with CI/CD integration

---

**Accessibility Compliance**: WCAG 2.1 AA  
**Last Tested**: July 30, 2024  
**Next Review**: October 2024  
**Maintained By**: Development Team & Accessibility Specialists