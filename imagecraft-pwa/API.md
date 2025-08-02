# Component API Reference

Complete API reference for all components in ImageCraft Pro, including props, methods, and usage examples.

## 📋 Table of Contents

- [shadcn/ui Components](#shadcnui-components)
- [Custom Components](#custom-components)
- [Utility Functions](#utility-functions)
- [TypeScript Definitions](#typescript-definitions)
- [Event Handlers](#event-handlers)
- [Styling Props](#styling-props)

## 🧩 shadcn/ui Components

### Button

Versatile button component with glass morphism variants.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'destructive' \| 'outline' \| 'secondary' \| 'ghost' \| 'link' \| 'glass' \| 'glassSecondary' \| 'glassPrimary'` | `'default'` | Button visual variant |
| `size` | `'default' \| 'sm' \| 'lg' \| 'icon'` | `'default'` | Button size |
| `asChild` | `boolean` | `false` | Render as child element instead of button |
| `disabled` | `boolean` | `false` | Disable the button |
| `className` | `string` | `''` | Additional CSS classes |
| `children` | `ReactNode` | - | Button content |
| `onClick` | `(event: MouseEvent) => void` | - | Click event handler |

#### Usage Examples

```jsx
import { Button } from './components/ui/button';

// Basic usage
<Button variant="glass" onClick={handleClick}>
  Click me
</Button>

// With icon
<Button variant="glassPrimary" size="lg">
  <Icon className="w-4 h-4 mr-2" />
  Save Document
</Button>

// As link
<Button asChild variant="glassSecondary">
  <Link to="/about">Learn More</Link>
</Button>

// Disabled state
<Button variant="glass" disabled={isLoading}>
  {isLoading ? 'Processing...' : 'Process Image'}
</Button>
```

#### Variant Descriptions

- **`glass`**: Primary glass morphism effect with orange gradient
- **`glassSecondary`**: Subtle white glass effect for secondary actions
- **`glassPrimary`**: Solid orange gradient for primary CTAs
- **`default`**: Standard button appearance
- **`destructive`**: Red styling for dangerous actions
- **`outline`**: Transparent with border
- **`secondary`**: Muted background color
- **`ghost`**: Transparent background, visible on hover
- **`link`**: Styled as a link

### Card

Container component with glass morphism effects and composable structure.

#### Main Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'glass' \| 'glassSubtle'` | `'default'` | Card visual variant |
| `className` | `string` | `''` | Additional CSS classes |
| `children` | `ReactNode` | - | Card content |

#### Sub-components

##### CardHeader

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `children` | `ReactNode` | - | Header content |

##### CardTitle

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `children` | `ReactNode` | - | Title content |

##### CardDescription

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `children` | `ReactNode` | - | Description content |

##### CardContent

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `children` | `ReactNode` | - | Main content |

##### CardFooter

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `children` | `ReactNode` | - | Footer content |

#### Usage Examples

```jsx
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from './components/ui/card';

// Complete card structure
<Card variant="glass">
  <CardHeader>
    <CardTitle>Feature Title</CardTitle>
    <CardDescription>
      Brief description of the feature
    </CardDescription>
  </CardHeader>
  <CardContent>
    <p>Main content area with detailed information.</p>
  </CardContent>
  <CardFooter>
    <Button variant="glassPrimary">Take Action</Button>
  </CardFooter>
</Card>

// Simple card
<Card variant="glassSubtle">
  <CardContent className="p-6">
    <h3 className="text-lg font-semibold mb-2">Quick Note</h3>
    <p>Some brief content.</p>
  </CardContent>
</Card>
```

### Dialog

Modal dialog component with focus management and accessibility features.

#### Main Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | - | Control dialog visibility |
| `onOpenChange` | `(open: boolean) => void` | - | Open state change handler |
| `modal` | `boolean` | `true` | Whether dialog is modal |

#### Sub-components

##### DialogTrigger

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `asChild` | `boolean` | `false` | Render as child element |
| `children` | `ReactNode` | - | Trigger element |

##### DialogContent

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `children` | `ReactNode` | - | Dialog content |

##### DialogHeader

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `children` | `ReactNode` | - | Header content |

##### DialogTitle

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `children` | `ReactNode` | - | Dialog title |

##### DialogDescription

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `children` | `ReactNode` | - | Dialog description |

#### Usage Examples

```jsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './components/ui/dialog';

// Controlled dialog
const [isOpen, setIsOpen] = useState(false);

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button variant="glass">Open Settings</Button>
  </DialogTrigger>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Application Settings</DialogTitle>
      <DialogDescription>
        Configure your application preferences below.
      </DialogDescription>
    </DialogHeader>
    <div className="py-4">
      {/* Dialog content */}
      <form onSubmit={handleSubmit}>
        {/* Form fields */}
      </form>
    </div>
  </DialogContent>
</Dialog>

// Confirmation dialog
<Dialog>
  <DialogTrigger asChild>
    <Button variant="destructive">Delete Image</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Deletion</DialogTitle>
      <DialogDescription>
        This action cannot be undone. Are you sure you want to delete this image?
      </DialogDescription>
    </DialogHeader>
    <div className="flex justify-end space-x-2 mt-4">
      <Button variant="glassSecondary" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button variant="destructive" onClick={handleDelete}>
        Delete
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

### Sheet

Slide-out panel component, typically used for mobile navigation.

#### Main Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | - | Control sheet visibility |
| `onOpenChange` | `(open: boolean) => void` | - | Open state change handler |
| `modal` | `boolean` | `true` | Whether sheet is modal |

#### Sub-components

##### SheetTrigger

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `asChild` | `boolean` | `false` | Render as child element |
| `children` | `ReactNode` | - | Trigger element |

##### SheetContent

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `side` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'right'` | Side to slide from |
| `className` | `string` | `''` | Additional CSS classes |
| `children` | `ReactNode` | - | Sheet content |

#### Usage Examples

```jsx
import { Sheet, SheetContent, SheetTrigger } from './components/ui/sheet';

// Mobile navigation menu
const [isMenuOpen, setIsMenuOpen] = useState(false);

<Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
  <SheetTrigger asChild>
    <Button variant="glassSecondary" size="sm" className="md:hidden">
      <Menu className="w-6 h-6" />
    </Button>
  </SheetTrigger>
  <SheetContent side="right" className="w-[300px] sm:w-[400px]">
    <nav className="mt-8">
      <h2 className="text-lg font-semibold mb-4">Navigation</h2>
      <div className="space-y-2">
        {navigationItems.map((item) => (
          <Button
            key={item.id}
            variant="glassSecondary"
            className="w-full justify-start"
            onClick={() => {
              handleNavigation(item.id);
              setIsMenuOpen(false);
            }}
          >
            <item.icon className="w-4 h-4 mr-3" />
            {item.label}
          </Button>
        ))}
      </div>
    </nav>
  </SheetContent>
</Sheet>

// Settings panel
<Sheet>
  <SheetTrigger asChild>
    <Button variant="glass">
      <Settings className="w-4 h-4 mr-2" />
      Settings
    </Button>
  </SheetTrigger>
  <SheetContent side="left" className="w-[400px]">
    <div className="mt-8 space-y-6">
      <h2 className="text-xl font-semibold">Application Settings</h2>
      {/* Settings form */}
    </div>
  </SheetContent>
</Sheet>
```

### Input

Form input component with consistent styling.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `string` | `'text'` | Input type |
| `placeholder` | `string` | `''` | Placeholder text |
| `value` | `string` | - | Input value |
| `onChange` | `(event: ChangeEvent) => void` | - | Change event handler |
| `disabled` | `boolean` | `false` | Disable the input |
| `className` | `string` | `''` | Additional CSS classes |

#### Usage Examples

```jsx
import { Input } from './components/ui/input';

// Basic text input
<Input
  type="text"
  placeholder="Enter your name"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>

// Email input with validation
<Input
  type="email"
  placeholder="your@email.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  aria-invalid={emailError ? 'true' : 'false'}
  aria-describedby={emailError ? 'email-error' : undefined}
/>

// File input
<Input
  type="file"
  accept="image/*"
  onChange={handleFileChange}
  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0"
/>
```

## 🎨 Custom Components

### AnimatedBackground

Creates the animated background with floating orbs and gradient effects.

#### Props

This component doesn't accept any props and should be used as-is.

#### Usage Examples

```jsx
import AnimatedBackground from './components/AnimatedBackground';

// Use as page background
<div className="min-h-screen relative">
  <AnimatedBackground />
  <div className="relative z-10">
    {/* Page content */}
  </div>
</div>
```

#### Features

- Fixed positioning covers entire viewport
- Multiple animated floating orbs
- Gradient background with dot pattern
- Moving wave animation
- Respects `prefers-reduced-motion`
- GPU-accelerated animations

### FeatureCard

Reusable card component for displaying features with icons and descriptions.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `LucideIcon` | - | Lucide React icon component |
| `title` | `string` | - | Feature title |
| `description` | `string` | - | Feature description |
| `children` | `ReactNode` | - | Additional content |
| `className` | `string` | `''` | Additional CSS classes |

#### Usage Examples

```jsx
import FeatureCard from './components/FeatureCard';
import { Sparkles, Image, LayoutGrid } from 'lucide-react';

// Basic feature card
<FeatureCard
  icon={Sparkles}
  title="AI Magic"
  description="Transform images with AI-powered effects"
/>

// Feature card with interactive content
<FeatureCard
  icon={Image}
  title="Image Converter"
  description="Convert to any format instantly"
>
  <div className="grid grid-cols-2 gap-3 mt-6">
    {formats.map((format) => (
      <Button
        key={format}
        variant="glassSecondary"
        size="sm"
        onClick={() => selectFormat(format)}
      >
        {format}
      </Button>
    ))}
  </div>
</FeatureCard>

// Feature card with custom styling
<FeatureCard
  icon={LayoutGrid}
  title="Collage Maker"
  description="Create stunning collages"
  className="md:col-span-2"
>
  {/* Custom content layout */}
</FeatureCard>
```

#### Structure

The component uses the following internal structure:

```jsx
<Card variant="glassSubtle">
  <CardHeader>
    <div className="flex items-center space-x-4">
      <div className="icon-container">
        <Icon />
      </div>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  </CardHeader>
  {children && <CardContent>{children}</CardContent>}
</Card>
```

### UploadZone

File upload component with drag-and-drop functionality and accessibility features.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | - | Upload zone title |
| `subtitle` | `string` | - | Descriptive subtitle |
| `onFileUpload` | `(file: File) => void` | - | File upload handler |
| `className` | `string` | `''` | Additional CSS classes |
| `accept` | `string` | `'image/*'` | Accepted file types |
| `maxSize` | `number` | `10485760` | Maximum file size in bytes (10MB) |

#### Usage Examples

```jsx
import UploadZone from './components/UploadZone';

// Basic upload zone
<UploadZone
  title="Image Converter"
  subtitle="Convert your images to any format instantly"
  onFileUpload={handleFileUpload}
/>

// Upload zone with custom file validation
<UploadZone
  title="AI Image Magic"
  subtitle="Transform your images with AI-powered effects"
  accept="image/jpeg,image/png,image/webp"
  maxSize={5242880} // 5MB
  onFileUpload={(file) => {
    if (file.size > 5242880) {
      showError('File size must be less than 5MB');
      return;
    }
    processImageFile(file);
  }}
/>

// Upload zone with custom styling
<UploadZone
  title="Batch Upload"
  subtitle="Upload multiple images for processing"
  className="min-h-[200px]"
  onFileUpload={addToUploadQueue}
/>
```

#### Event Handler Signature

```typescript
type FileUploadHandler = (file: File) => void;

// Example implementation
const handleFileUpload: FileUploadHandler = (file) => {
  console.log('File uploaded:', {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified
  });
  
  // Process the file
  processImage(file);
};
```

#### File Validation

The component includes built-in validation:

- **File Type**: Checks against `accept` prop
- **File Size**: Validates against `maxSize` prop
- **Drag & Drop**: Handles both drag/drop and click-to-browse
- **Error Handling**: Provides visual feedback for validation failures

## 🛠️ Utility Functions

### cn (Class Names)

Utility function for conditionally joining class names with Tailwind CSS conflict resolution.

#### Signature

```typescript
function cn(...inputs: ClassValue[]): string
```

#### Usage Examples

```jsx
import { cn } from './lib/utils';

// Basic usage
<div className={cn('base-class', 'additional-class')} />

// Conditional classes
<Button 
  className={cn(
    'base-button-styles',
    isActive && 'active-styles',
    isDisabled && 'disabled-styles'
  )}
/>

// Merge conflicting Tailwind classes
<div className={cn('p-4 p-6')} /> // Results in 'p-6'

// Complex conditional logic
<Card 
  className={cn(
    'default-card-styles',
    variant === 'glass' && 'glass-styles',
    variant === 'subtle' && 'subtle-styles',
    size === 'large' && 'large-styles',
    className // User-provided classes
  )}
/>
```

### buttonVariants (CVA Function)

Class Variance Authority function for generating button class combinations.

#### Signature

```typescript
const buttonVariants: VariantProps<typeof buttonVariants>
```

#### Usage Examples

```jsx
import { buttonVariants } from './components/ui/button';

// Generate button classes programmatically
const buttonClasses = buttonVariants({
  variant: 'glass',
  size: 'lg'
});

// Use in custom components
<div className={buttonVariants({ variant: 'glassSecondary' })}>
  Custom button-styled div
</div>

// Extract variant types for TypeScript
type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
```

### cardVariants (CVA Function)

Class Variance Authority function for generating card class combinations.

#### Signature

```typescript
const cardVariants: VariantProps<typeof cardVariants>
```

#### Usage Examples

```jsx
import { cardVariants } from './components/ui/card';

// Generate card classes
const cardClasses = cardVariants({
  variant: 'glass'
});

// Use in custom wrapper
<section className={cardVariants({ variant: 'glassSubtle' })}>
  Section with card styling
</section>
```

## 📝 TypeScript Definitions

### Component Prop Types

```typescript
// Button component props
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'glass' | 'glassSecondary' | 'glassPrimary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

// Card component props
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'glassSubtle';
}

// FeatureCard component props
interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children?: React.ReactNode;
  className?: string;
}

// UploadZone component props
interface UploadZoneProps {
  title: string;
  subtitle: string;
  onFileUpload: (file: File) => void;
  className?: string;
  accept?: string;
  maxSize?: number;
}
```

### Event Handler Types

```typescript
// File upload handler
type FileUploadHandler = (file: File) => void;

// Button click handler
type ButtonClickHandler = (event: React.MouseEvent<HTMLButtonElement>) => void;

// Form change handler
type FormChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => void;

// Dialog state handler
type DialogStateHandler = (open: boolean) => void;
```

### Style Variant Types

```typescript
// Extract variant types from CVA functions
type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
type ButtonSize = VariantProps<typeof buttonVariants>['size'];
type CardVariant = VariantProps<typeof cardVariants>['variant'];

// Custom style prop types
interface GlassStyleProps {
  opacity?: number;
  blurIntensity?: 'light' | 'medium' | 'strong';
  hoverEffect?: boolean;
}
```

## 🎯 Event Handlers

### File Upload Events

```jsx
// Handle file selection from input
const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
  const files = event.target.files;
  if (files && files.length > 0) {
    const file = files[0];
    
    // Validate file
    if (!validateFile(file)) {
      showError('Invalid file type or size');
      return;
    }
    
    onFileUpload(file);
  }
};

// Handle drag and drop
const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
  event.preventDefault();
  const files = event.dataTransfer.files;
  
  if (files && files.length > 0) {
    const file = files[0];
    onFileUpload(file);
  }
};

// Handle drag over (required for drop to work)
const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
  event.preventDefault();
};
```

### Form Validation Events

```jsx
// Input validation on change
const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = event.target;
  
  // Update form state
  setFormData(prev => ({ ...prev, [name]: value }));
  
  // Clear previous errors
  if (errors[name]) {
    setErrors(prev => ({ ...prev, [name]: '' }));
  }
  
  // Validate on change (optional)
  const error = validateField(name, value);
  if (error) {
    setErrors(prev => ({ ...prev, [name]: error }));
  }
};

// Form submission with validation
const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  
  // Validate all fields
  const validationErrors = validateForm(formData);
  
  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    // Focus first error field
    const firstErrorField = Object.keys(validationErrors)[0];
    document.getElementById(firstErrorField)?.focus();
    return;
  }
  
  // Submit form
  submitForm(formData);
};
```

### Navigation Events

```jsx
// Tab navigation with keyboard support
const handleTabKeyDown = (event: React.KeyboardEvent, index: number) => {
  const { key } = event;
  
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      event.preventDefault();
      setActiveTab((prev) => (prev + 1) % tabs.length);
      break;
      
    case 'ArrowLeft':
    case 'ArrowUp':
      event.preventDefault();
      setActiveTab((prev) => (prev - 1 + tabs.length) % tabs.length);
      break;
      
    case 'Home':
      event.preventDefault();
      setActiveTab(0);
      break;
      
    case 'End':
      event.preventDefault();
      setActiveTab(tabs.length - 1);
      break;
      
    case 'Enter':
    case ' ':
      event.preventDefault();
      handleTabSelect(index);
      break;
  }
};
```

## 🎨 Styling Props

### CSS Custom Properties

Components support CSS custom properties for dynamic styling:

```jsx
// Dynamic opacity and blur effects
<Card 
  variant="glass"
  style={{
    '--glass-opacity': 0.3,
    '--glass-blur': '20px',
    '--hover-scale': 1.05
  }}
/>

// Dynamic color theming
<Button
  variant="glass"
  style={{
    '--primary-hue': 24,
    '--primary-saturation': '92%',
    '--primary-lightness': '50%'
  }}
/>
```

### Responsive Styling Props

```jsx
// Responsive size variants
<Button 
  variant="glass"
  className="
    text-sm sm:text-base
    px-3 sm:px-4 md:px-6
    py-2 sm:py-2.5 md:py-3
  "
/>

// Responsive card layouts
<Card
  variant="glass"
  className="
    col-span-1 md:col-span-2 lg:col-span-1
    p-4 md:p-6 lg:p-8
  "
/>
```

### Animation Control Props

```jsx
// Control animation duration
<div className="transition-all duration-300 hover:duration-500" />

// Disable animations for reduced motion
<div className="animate-pulse motion-reduce:animate-none" />

// Custom hover effects
<Button
  className="
    hover:scale-105 hover:shadow-xl
    transition-all duration-300
    motion-reduce:hover:scale-100
    motion-reduce:transition-none
  "
/>
```

## 🔧 Advanced Usage

### Compound Components

```jsx
// Build complex UI with compound components
<Card variant="glass">
  <CardHeader>
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Sparkles className="w-6 h-6 text-orange-600" />
        <div>
          <CardTitle>AI Processing</CardTitle>
          <CardDescription>Transform your images with AI</CardDescription>
        </div>
      </div>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="glassSecondary" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </SheetTrigger>
        <SheetContent>
          {/* AI settings */}
        </SheetContent>
      </Sheet>
    </div>
  </CardHeader>
  <CardContent>
    <UploadZone
      title="Upload Image"
      subtitle="Select an image to transform"
      onFileUpload={handleAIProcessing}
    />
  </CardContent>
  <CardFooter>
    <Button variant="glassPrimary" className="w-full">
      Start AI Processing
    </Button>
  </CardFooter>
</Card>
```

### Custom Hooks Integration

```jsx
// Use with custom hooks
const ImageProcessor = () => {
  const { files, addFile, removeFile, processAll } = useFileProcessor();
  const { isProcessing, progress } = useProcessingStatus();
  
  return (
    <div className="space-y-6">
      <UploadZone
        title="Batch Image Processor"
        subtitle="Upload multiple images for processing"
        onFileUpload={addFile}
      />
      
      {files.length > 0 && (
        <Card variant="glass">
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between">
                  <span>{file.name}</span>
                  <Button
                    variant="glassSecondary"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            
            <Button
              variant="glassPrimary"
              className="w-full mt-4"
              onClick={processAll}
              disabled={isProcessing}
            >
              {isProcessing ? `Processing... ${progress}%` : 'Process All'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
```

---

**API Version**: 2.0.0  
**Last Updated**: July 30, 2024  
**Component Library**: shadcn/ui + Custom Variants