# Component Documentation

Comprehensive documentation for all components in the ImageCraft Pro application, featuring shadcn/ui components with custom glass morphism variants.

## 📋 Table of Contents

- [Overview](#overview)
- [shadcn/ui Components](#shadcnui-components)
- [Custom Components](#custom-components)
- [Design System](#design-system)
- [Usage Examples](#usage-examples)
- [Component Variants](#component-variants)
- [Accessibility Features](#accessibility-features)
- [Styling Guidelines](#styling-guidelines)

## 🎯 Overview

ImageCraft Pro uses a hybrid approach combining shadcn/ui components with custom glass morphism variants. This provides:

- **Consistency**: Standardized component APIs and behaviors
- **Accessibility**: Built-in a11y features from Radix UI primitives
- **Customization**: Glass morphism design system integration
- **Performance**: Optimized components with proper React patterns
- **Developer Experience**: TypeScript support and clear documentation

### Component Architecture

```
components/
├── ui/                    # shadcn/ui components with custom variants
│   ├── button.jsx         # Glass-themed button variants
│   ├── card.jsx          # Glass morphism card components
│   ├── dialog.jsx        # Modal dialog component
│   ├── input.jsx         # Form input component
│   ├── navigation-menu.jsx # Navigation component
│   └── sheet.jsx         # Mobile slide-out menu
├── AnimatedBackground.jsx # Custom animated background
├── FeatureCard.jsx       # Reusable feature display card
└── UploadZone.jsx        # File upload interface
```

## 🧩 shadcn/ui Components

### Button Component

The core interactive component with multiple glass-themed variants.

#### Import
```jsx
import { Button } from './components/ui/button';
```

#### Basic Usage
```jsx
<Button variant="glass" size="default" onClick={handleClick}>
  Click me
</Button>
```

#### Variants

##### `glass` - Primary glass button
```jsx
<Button variant="glass">
  Primary Action
</Button>
```
- **Style**: Gradient glass effect with orange theme
- **Use Case**: Primary actions, featured buttons
- **Hover Effect**: Scale up with enhanced glow

##### `glassSecondary` - Secondary glass button
```jsx
<Button variant="glassSecondary">
  Secondary Action
</Button>
```
- **Style**: Subtle white glass effect
- **Use Case**: Secondary actions, navigation items
- **Hover Effect**: Slight opacity increase with scale

##### `glassPrimary` - Solid glass button
```jsx
<Button variant="glassPrimary">
  Call to Action
</Button>
```
- **Style**: Solid orange gradient background
- **Use Case**: Primary CTAs, important actions
- **Hover Effect**: Deeper gradient with scale

#### Sizes
```jsx
<Button size="sm">Small</Button>      # Height: 36px
<Button size="default">Default</Button>  # Height: 40px
<Button size="lg">Large</Button>      # Height: 44px
<Button size="icon">🔥</Button>       # Square: 40x40px
```

#### Advanced Usage
```jsx
<Button
  variant="glass"
  size="lg"
  asChild
  className="custom-classes"
  disabled={isLoading}
  aria-label="Descriptive button label"
>
  <Link to="/destination">
    <Icon className="w-4 h-4 mr-2" />
    Navigate
  </Link>
</Button>
```

#### Props
- `variant`: 'default' | 'glass' | 'glassSecondary' | 'glassPrimary' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
- `size`: 'default' | 'sm' | 'lg' | 'icon'
- `asChild`: boolean - Renders as child element instead of button
- `disabled`: boolean - Disables the button
- `className`: string - Additional CSS classes
- Standard button props (onClick, type, etc.)

### Card Component

Versatile container component with glass morphism effects.

#### Import
```jsx
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from './components/ui/card';
```

#### Basic Usage
```jsx
<Card variant="glass">
  <CardContent>
    Card content here
  </CardContent>
</Card>
```

#### Variants

##### `glass` - Full glass effect
```jsx
<Card variant="glass">
  <CardContent>
    Primary glass card with enhanced hover effects
  </CardContent>
</Card>
```
- **Style**: Prominent glass effect with dynamic blur
- **Use Case**: Main content areas, featured sections
- **Hover Effect**: Enhanced blur and brightness

##### `glassSubtle` - Subtle glass effect
```jsx
<Card variant="glassSubtle">
  <CardContent>
    Subtle glass card for secondary content
  </CardContent>
</Card>
```
- **Style**: Lighter glass effect
- **Use Case**: Secondary content, nested cards
- **Hover Effect**: Gentle enhancement

#### Complete Card Structure
```jsx
<Card variant="glass">
  <CardHeader>
    <div className="flex items-center space-x-4">
      <Icon className="w-6 h-6 text-orange-600" />
      <div>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description text</CardDescription>
      </div>
    </div>
  </CardHeader>
  <CardContent>
    <p>Main card content goes here.</p>
  </CardContent>
  <CardFooter>
    <Button variant="glassPrimary">Action</Button>
  </CardFooter>
</Card>
```

#### Props
- `variant`: 'default' | 'glass' | 'glassSubtle'
- `className`: string - Additional CSS classes
- Standard div props

### Dialog Component

Modal dialog component built on Radix UI Dialog primitive.

#### Import
```jsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './components/ui/dialog';
```

#### Usage
```jsx
<Dialog>
  <DialogTrigger asChild>
    <Button variant="glass">Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Dialog description text
      </DialogDescription>
    </DialogHeader>
    <div className="py-4">
      Dialog content
    </div>
  </DialogContent>
</Dialog>
```

#### Features
- **Accessibility**: Focus management, escape key handling
- **Backdrop**: Click outside to close
- **Scroll Lock**: Prevents background scrolling
- **Animation**: Smooth open/close transitions

### Sheet Component

Slide-out menu component, primarily used for mobile navigation.

#### Import
```jsx
import { Sheet, SheetContent, SheetTrigger } from './components/ui/sheet';
```

#### Usage
```jsx
<Sheet open={isOpen} onOpenChange={setIsOpen}>
  <SheetTrigger asChild>
    <Button variant="glassSecondary" size="sm">
      <Menu className="w-6 h-6" />
    </Button>
  </SheetTrigger>
  <SheetContent side="right" className="w-[300px]">
    <div className="mt-8">
      <h2 className="text-lg font-semibold mb-4">Navigation</h2>
      {/* Navigation content */}
    </div>
  </SheetContent>
</Sheet>
```

#### Props
- `side`: 'top' | 'right' | 'bottom' | 'left'
- `open`: boolean - Control open state
- `onOpenChange`: function - Handle state changes

### Input Component

Form input component with consistent styling.

#### Import
```jsx
import { Input } from './components/ui/input';
```

#### Usage
```jsx
<Input
  type="text"
  placeholder="Enter text..."
  value={value}
  onChange={(e) => setValue(e.target.value)}
  className="glass-input"
/>
```

#### Features
- **Styling**: Consistent with glass morphism theme
- **Accessibility**: Proper focus indicators
- **Validation**: Works with form validation libraries

## 🎨 Custom Components

### AnimatedBackground

Creates the animated background with floating orbs and gradient effects.

#### Usage
```jsx
import AnimatedBackground from './components/AnimatedBackground';

<div className="min-h-screen relative">
  <AnimatedBackground />
  {/* Your content */}
</div>
```

#### Features
- **Floating Orbs**: Three animated orbs with different patterns
- **Gradient Background**: Dynamic orange-to-white gradient
- **Dot Pattern**: Subtle animated dot overlay
- **Moving Wave**: Periodic gradient wave animation
- **Performance**: Uses CSS animations for GPU acceleration
- **Accessibility**: Respects `prefers-reduced-motion`

#### Animations
```css
@keyframes float1 {
  0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
  25% { transform: translateY(-30px) translateX(20px) rotate(2deg); }
  50% { transform: translateY(-10px) translateX(-15px) rotate(-1deg); }
  75% { transform: translateY(20px) translateX(10px) rotate(1deg); }
}
```

### FeatureCard

Reusable card component for displaying features with icons and descriptions.

#### Import
```jsx
import FeatureCard from './components/FeatureCard';
```

#### Usage
```jsx
<FeatureCard
  icon={Sparkles}
  title="AI Magic"
  description="Transform images with AI-powered effects"
>
  <div className="mt-6">
    {/* Feature-specific content */}
    <Button variant="glass">Try Now</Button>
  </div>
</FeatureCard>
```

#### Props
- `icon`: Lucide React icon component
- `title`: string - Feature title
- `description`: string - Feature description
- `children`: ReactNode - Additional content
- `className`: string - Additional CSS classes

#### Structure
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

File upload component with drag-and-drop functionality.

#### Import
```jsx
import UploadZone from './components/UploadZone';
```

#### Usage
```jsx
<UploadZone
  title="Image Converter"
  subtitle="Convert your images to any format instantly"
  onFileUpload={handleFileUpload}
/>
```

#### Props
- `title`: string - Upload zone title
- `subtitle`: string - Descriptive subtitle
- `onFileUpload`: function - File upload handler
- `className`: string - Additional CSS classes

#### Features
- **Drag & Drop**: Native HTML5 drag and drop
- **Click to Browse**: Hidden file input with custom styling
- **File Validation**: Accepts image files only
- **Accessibility**: Proper labels and descriptions
- **Visual Feedback**: Hover states and transitions

#### Event Handlers
```jsx
const handleFileUpload = (file) => {
  console.log('File uploaded:', file.name);
  // Process the uploaded file
};

const handleFileSelect = (e) => {
  const files = e.target.files;
  if (files && files.length > 0 && onFileUpload) {
    onFileUpload(files[0]);
  }
};

const handleDrop = (e) => {
  e.preventDefault();
  const files = e.dataTransfer.files;
  if (files && files.length > 0 && onFileUpload) {
    onFileUpload(files[0]);
  }
};
```

## 🎨 Design System

### Color Palette

#### CSS Variables
```css
:root {
  --primary: 24 92% 50%;           /* Orange #f97316 */
  --primary-foreground: 0 0% 100%; /* White */
  --secondary: 24 70% 96%;         /* Light orange */
  --border: 24 30% 90%;            /* Light gray */
  --ring: 24 92% 50%;             /* Focus ring orange */
}
```

#### Usage in Components
```jsx
// Tailwind classes using CSS variables
className="bg-primary text-primary-foreground"

// Custom styles with opacity
style={{ background: 'hsl(var(--primary) / 0.3)' }}
```

### Typography

#### Font Families
```css
/* Headings */
font-family: 'Poppins, sans-serif'

/* Body text */
font-family: 'Inter, sans-serif'
```

#### Usage
```jsx
<h1 style={{ fontFamily: 'Poppins, sans-serif' }}>
  Main Heading
</h1>

<p style={{ fontFamily: 'Inter, sans-serif' }}>
  Body content
</p>
```

### Spacing Scale

Following Tailwind's default spacing scale:
- `space-x-2` = 8px
- `space-x-4` = 16px
- `space-x-6` = 24px
- `p-4` = 16px padding
- `p-6` = 24px padding
- `p-8` = 32px padding

### Border Radius

Consistent rounded corners:
- `rounded-lg` = 8px (buttons, small elements)
- `rounded-xl` = 12px (cards, containers)
- `rounded-2xl` = 16px (large cards, main containers)
- `rounded-full` = Perfect circle (icons, avatars)

## 📱 Usage Examples

### Basic Page Layout

```jsx
import { Card, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import AnimatedBackground from './components/AnimatedBackground';
import FeatureCard from './components/FeatureCard';
import { Sparkles } from 'lucide-react';

const ExamplePage = () => {
  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Page Title
          </h1>
          <p className="text-gray-600 text-lg">
            Page description
          </p>
        </header>

        <main className="space-y-8">
          <FeatureCard
            icon={Sparkles}
            title="Feature Title"
            description="Feature description"
          >
            <div className="grid grid-cols-2 gap-4 mt-6">
              <Button variant="glass">Option 1</Button>
              <Button variant="glassSecondary">Option 2</Button>
            </div>
          </FeatureCard>

          <Card variant="glass">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold mb-4">Section Title</h2>
              <p className="text-gray-600 mb-6">Section content</p>
              <Button variant="glassPrimary" size="lg">
                Call to Action
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};
```

### Form Example

```jsx
import { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Dialog, DialogContent, DialogTrigger } from './components/ui/dialog';

const FormExample = () => {
  const [formData, setFormData] = useState({ name: '', email: '' });

  return (
    <Card variant="glass" className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Contact Form</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Name
          </label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Enter your name"
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            placeholder="Enter your email"
          />
        </div>

        <div className="flex space-x-4">
          <Button variant="glassPrimary" className="flex-1">
            Submit
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="glassSecondary">
                Preview
              </Button>
            </DialogTrigger>
            <DialogContent>
              {/* Preview content */}
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};
```

### Navigation Example

```jsx
import { useState } from 'react';
import { Button } from './components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from './components/ui/sheet';
import { Menu, Home, Settings, User } from 'lucide-react';

const NavigationExample = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <nav className="flex items-center justify-between p-4">
      {/* Desktop Navigation */}
      <div className="hidden md:flex space-x-2">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant={activeTab === item.id ? 'glassPrimary' : 'glassSecondary'}
            size="sm"
            onClick={() => setActiveTab(item.id)}
            className="flex items-center space-x-2"
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </Button>
        ))}
      </div>

      {/* Mobile Navigation */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="glassSecondary" size="sm" className="md:hidden">
            <Menu className="w-6 h-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px]">
          <div className="mt-8 space-y-4">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? 'glassPrimary' : 'glassSecondary'}
                className="w-full justify-start"
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMenuOpen(false);
                }}
              >
                <item.icon className="w-4 h-4 mr-3" />
                {item.label}
              </Button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
};
```

## 🎭 Component Variants

### Button Variants Showcase

```jsx
const ButtonShowcase = () => (
  <div className="space-y-6 p-8">
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Glass Variants</h3>
      <div className="flex flex-wrap gap-4">
        <Button variant="glass">Glass</Button>
        <Button variant="glassSecondary">Glass Secondary</Button>
        <Button variant="glassPrimary">Glass Primary</Button>
      </div>
    </div>

    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Sizes</h3>
      <div className="flex items-center gap-4">
        <Button variant="glass" size="sm">Small</Button>
        <Button variant="glass" size="default">Default</Button>
        <Button variant="glass" size="lg">Large</Button>
        <Button variant="glass" size="icon">🔥</Button>
      </div>
    </div>

    <div className="space-y-4">
      <h3 className="text-lg font-semibold">States</h3>
      <div className="flex gap-4">
        <Button variant="glass">Normal</Button>
        <Button variant="glass" disabled>Disabled</Button>
      </div>
    </div>
  </div>
);
```

### Card Variants Showcase

```jsx
const CardShowcase = () => (
  <div className="grid md:grid-cols-2 gap-6 p-8">
    <Card variant="glass">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-2">Glass Card</h3>
        <p className="text-gray-600">
          Full glass effect with enhanced hover animations
        </p>
      </CardContent>
    </Card>

    <Card variant="glassSubtle">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-2">Glass Subtle Card</h3>
        <p className="text-gray-600">
          Lighter glass effect for secondary content
        </p>
      </CardContent>
    </Card>
  </div>
);
```

## ♿ Accessibility Features

### Screen Reader Support

All components include proper ARIA labels and semantic HTML:

```jsx
<Button
  variant="glass"
  aria-label="Save document"
  aria-describedby="save-help"
>
  Save
  <span id="save-help" className="sr-only">
    Saves the current document to your account
  </span>
</Button>
```

### Keyboard Navigation

- **Tab Navigation**: All interactive elements are keyboard accessible
- **Enter/Space**: Activate buttons and controls
- **Escape**: Close dialogs and menus
- **Arrow Keys**: Navigate through option groups

### Focus Management

```jsx
// Focus indicators for all interactive elements
focus-visible:outline-none 
focus-visible:ring-2 
focus-visible:ring-ring 
focus-visible:ring-offset-2
```

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  .animate-pulse,
  .animate-float1,
  .animate-float2,
  .animate-float3,
  .animate-wave {
    animation: none !important;
  }
}
```

### Color Contrast

All text meets WCAG AA contrast requirements:
- **Normal text**: 4.5:1 contrast ratio
- **Large text**: 3:1 contrast ratio
- **Interactive elements**: Proper focus indicators

## 🎨 Styling Guidelines

### Class Naming Convention

Follow shadcn/ui and Tailwind conventions:

```jsx
// Good: Use semantic Tailwind classes
<div className="flex items-center space-x-4 p-6 rounded-xl">

// Good: Combine with custom classes
<Button className="hover:scale-110 transition-transform">

// Avoid: Inline styles when Tailwind classes exist
<div style={{ display: 'flex', alignItems: 'center' }}>
```

### Custom CSS Variables

Use CSS variables for dynamic styling:

```jsx
// Good: Use CSS variables for dynamic values
style={{
  background: `linear-gradient(135deg, rgba(249, 115, 22, ${opacity}), rgba(255, 255, 255, 0.3))`
}}

// Good: Combine with Tailwind
className="backdrop-blur-md"
style={{ backgroundColor: 'hsl(var(--primary) / 0.2)' }}
```

### Responsive Design

Follow mobile-first approach:

```jsx
<div className="
  grid 
  grid-cols-1 
  md:grid-cols-2 
  lg:grid-cols-3 
  gap-4 
  p-4 
  md:p-6 
  lg:p-8
">
```

### Animation Best Practices

```jsx
// Good: Use transition utilities
className="transition-all duration-300 hover:scale-105"

// Good: Respect reduced motion
className="motion-reduce:transition-none motion-reduce:hover:scale-100"

// Good: Use CSS animations for complex effects
className="animate-float1"
```

## 🔧 Component Development Guidelines

### Creating New Components

1. **Start with shadcn/ui**: Use existing components as base when possible
2. **Add Custom Variants**: Extend with CVA for glass morphism styling
3. **Include Accessibility**: Add proper ARIA labels and keyboard support
4. **Test Responsiveness**: Ensure mobile-first design
5. **Document Usage**: Include examples and prop documentation

### Example Component Template

```jsx
import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const customVariants = cva(
  "base-styles transition-all duration-300",
  {
    variants: {
      variant: {
        default: "default-styles",
        glass: "glass-morphism-styles",
      },
      size: {
        default: "default-size",
        sm: "small-size",
        lg: "large-size",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const CustomComponent = React.forwardRef(({ 
  className, 
  variant, 
  size, 
  children,
  ...props 
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(customVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </div>
  )
})

CustomComponent.displayName = "CustomComponent"

export { CustomComponent, customVariants }
```

### Testing Components

```jsx
// Test accessibility
// Test keyboard navigation
// Test screen reader compatibility
// Test responsive design
// Test hover states and animations
// Test with different content lengths
```

---

**Component Library Version**: 2.0.0  
**Last Updated**: July 30, 2024  
**Framework**: React 18 + shadcn/ui + Tailwind CSS