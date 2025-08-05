# ImageCraft Pro

A modern, browser-native Progressive Web Application (PWA) for professional image processing and conversion. Built with React 18, TypeScript, and WebAssembly technologies, featuring a stunning glass morphism design system.

## ✨ Features

### 🔄 Image Converter
- **AVIF Support** - Full AVIF encoding/decoding using @jsquash/avif WebAssembly
- **WebAssembly-powered conversion** supporting 20+ formats (JPEG, PNG, WebP, AVIF, HEIC, TIFF, BMP, GIF, and more)
- **Optimized AVIF encoding** with precise quality control and automatic downloads
- **Performance-tuned processing** with auto-scaling for large images (>16MP)
- **High-quality output** with professional-grade WebAssembly processing
- **Batch processing** support for multiple files
- **Smart fallback system** for optimal performance

### 🎨 Image Editor
- Professional editing tools (Contrast, White Balance, Exposure, Vibrance, Saturation)
- Smart cropping for social media platforms
- Real-time preview and adjustments
- Custom crop dimensions

### 🖼️ Collage Maker
- Multiple pre-designed layouts
- Drag and drop interface
- Custom spacing and borders
- Export in various sizes

### 🤖 AI Magic
- AI-powered style transformations (Cartoon, Anime, Ghibli, Pixar, etc.)
- Image restoration and enhancement
- Background removal
- Upscaling and quality improvement

## 🚀 Technology Stack

### Core Framework
- **React 18** - Modern functional components with hooks
- **TypeScript** - Type-safe development (gradual migration)
- **Create React App 5.0.1** - Build tooling and development server
- **PWA** - Service workers, web manifest, offline capabilities

### Image Processing Engine
- **@imagemagick/magick-wasm 0.0.35** - Professional image processing via WebAssembly
- **browser-image-compression 2.0.2** - Lightweight compression for standard formats
- **Web Workers** - Non-blocking processing in separate threads
- **OffscreenCanvas** - Advanced canvas operations in workers

### UI Components & Design System
- **shadcn/ui** - High-quality, accessible component library built on Radix UI
- **Radix UI** - Unstyled, accessible UI primitives
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Class Variance Authority (CVA)** - Component variant management
- **Tailwind Merge & CLSX** - Conditional styling utilities
- **Glass Morphism UI** - Modern glass-like interface with blur effects

### State Management
- **Zustand 4.4.7** - Lightweight state management
- **React Hooks** - Local state management patterns
- **Context API** - Provider pattern for complex state

### Icons & Typography
- **Lucide React** - Beautiful, customizable icons
- **Google Fonts** - Inter (body), Poppins (headings)

### Additional Libraries
- **@clerk/clerk-react 5.38.0** - Authentication and user management
- **react-router-dom 6.23.1** - Client-side routing
- **sonner 2.0.6** - Toast notifications
- **web-vitals 3.5.0** - Performance monitoring

## 📦 Installation

### Prerequisites
- Node.js 18+ and pnpm
- Modern web browser with WebAssembly support

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd imagecraft-pwa
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development server**
   ```bash
   pnpm start
   ```
   The app will open at `http://localhost:3000`

4. **Build for production**
   ```bash
   pnpm run build
   ```

5. **Test the build locally**
   ```bash
   npx serve -s build
   ```

## 🏗️ Architecture Overview

### **Client-Side Processing Pipeline**
```
Browser → File Upload → Web Worker → ImageMagick WASM/Canvas API → Download
```

**Zero-server architecture**: All processing happens in the browser using WebAssembly and Canvas API.

### Project Structure

```
imagecraft-pwa/
├── public/
│   ├── workers/
│   │   ├── imagemagick-wasm-worker.js    # ImageMagick WASM processor
│   │   ├── image-processor-worker.js     # Legacy Canvas processor
│   │   └── analytics-worker.js           # Performance tracking
│   ├── magick.wasm                       # ImageMagick WebAssembly binary
│   ├── manifest.json                     # PWA manifest
│   └── service-worker.js                 # Service worker for offline
├── src/
│   ├── components/
│   │   ├── ui/                          # shadcn/ui base components
│   │   ├── common/                      # Shared components (TypeScript)
│   │   ├── collage/                     # Collage editor components
│   │   ├── layout/                      # Layout components
│   │   ├── providers/                   # Context providers
│   │   └── routing/                     # Routing components
│   ├── services/
│   │   ├── imageMagickService.js        # ImageMagick WASM service
│   │   ├── imageProcessingService.js    # Main processing service
│   │   └── modernImageProcessor.js      # Unified processor with fallbacks
│   ├── hooks/                           # Custom React hooks
│   ├── store/                           # Zustand state management
│   ├── utils/                           # Utility functions
│   ├── types/                           # TypeScript type definitions
│   ├── styles/                          # Global CSS and animations
│   └── pages/                           # Route components
├── package.json                         # Dependencies and scripts
├── tailwind.config.js                   # Tailwind configuration
└── vercel.json                          # Deployment configuration
```

## 🔧 Image Processing Capabilities

### Format Support Matrix

| Format | Input | Output | Method | Quality |
|--------|-------|---------|---------| --------|
| JPEG   | ✅    | ✅     | Canvas/ImageMagick | Excellent |
| PNG    | ✅    | ✅     | Canvas/ImageMagick | Excellent |
| WebP   | ✅    | ✅     | Canvas/ImageMagick | Excellent |
| AVIF   | ✅    | ✅     | ImageMagick | Excellent |
| HEIC   | ✅    | ✅     | ImageMagick | Excellent |
| TIFF   | ✅    | ✅     | ImageMagick | Excellent |
| RAW    | ✅    | ❌     | ImageMagick | Good |
| BMP    | ✅    | ✅     | Canvas/ImageMagick | Good |
| GIF    | ✅    | ✅     | Canvas/ImageMagick | Limited |

### Processing Methods

#### **ImageMagick WASM (Primary)**
- **Supports**: All formats, advanced operations
- **Benefits**: Professional quality, comprehensive format support
- **Use cases**: AVIF, HEIC, TIFF, professional processing

#### **Canvas API (Fallback)**
- **Supports**: JPEG, PNG, WebP, BMP
- **Benefits**: Fast, lightweight, native browser support
- **Use cases**: Basic conversions, resize operations

#### **browser-image-compression (Compression)**
- **Supports**: JPEG, PNG, WebP compression
- **Benefits**: Excellent file size optimization
- **Use cases**: File size reduction, quick compression

## 🎨 Design System

### Glass Morphism Theme
```css
/* Core glass morphism utility classes */
.glass {
  @apply backdrop-blur-md bg-white/10 border border-white/20 rounded-xl;
}

.glass-hover {
  @apply hover:bg-white/20 transition-colors;
}

.glass-subtle {
  @apply backdrop-blur-sm bg-white/5 border border-white/10;
}
```

### Component Variants
- **Glass Buttons**: `glass`, `glassSecondary`, `glassPrimary`
- **Glass Cards**: `glass`, `glassSubtle`, `glassCream`
- **Responsive Layouts**: Mobile-first with adaptive breakpoints

### Accessibility Features
- **Screen reader support** with semantic HTML and ARIA labels
- **Keyboard navigation** for all interactive elements
- **Skip links** for screen readers
- **Reduced motion** support for users with vestibular disorders
- **WCAG 2.1 AA compliance** with proper contrast ratios

## 📱 PWA Capabilities

### Installation
- ✅ **Desktop**: Install via browser's "Install App" prompt
- ✅ **Mobile**: "Add to Home Screen" functionality
- ✅ **Cross-platform**: Works on Windows, macOS, Linux, iOS, Android

### Offline Features
- ✅ **Service Worker caching** for core app functionality
- ✅ **Offline image processing** - works without internet connection
- ✅ **Cache-first strategy** for static assets
- ✅ **Progressive enhancement** for slower connections

### Performance
- ✅ **Fast loading** with optimized bundle sizes (181.82 kB main bundle)
- ✅ **Code splitting** with lazy loading of heavy components
- ✅ **Web Workers** for non-blocking processing
- ✅ **Optimized WASM loading** on-demand

## 🚀 Available Scripts

```bash
# Development
pnpm start           # Start development server
pnpm build           # Build for production
pnpm preview         # Preview production build

# Testing & Quality
pnpm test            # Run unit tests
pnpm test:coverage   # Run tests with coverage
pnpm lint            # Run ESLint
pnpm type-check      # Run TypeScript compiler

# Analysis
pnpm analyze         # Bundle size analysis
pnpm clean           # Clean build and node_modules
```

## 🌐 Browser Support

### Modern Browser Requirements
- **Chrome 88+**: Full WebAssembly and OffscreenCanvas support
- **Firefox 85+**: Complete feature set
- **Safari 14+**: Most features (some WASM limitations)
- **Edge 88+**: Full compatibility

### Progressive Enhancement
- **Graceful degradation**: Canvas API fallback when WASM unavailable
- **Feature detection**: Dynamic capability detection
- **Error recovery**: Comprehensive fallback systems

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Build and deploy
pnpm run build
vercel --prod
```

### Static Site Hosting
The app is a static site that can be deployed to:
- **Vercel** (recommended)
- **Netlify**
- **GitHub Pages**
- **AWS S3 + CloudFront**
- **Any static hosting service**

### Docker Deployment
```dockerfile
FROM node:18-alpine
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build
EXPOSE 3000
CMD ["pnpm", "dlx", "serve", "-s", "build", "-l", "3000"]
```

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file for local development:
```env
REACT_APP_APP_NAME="ImageCraft Pro"
REACT_APP_VERSION="2.0.0"
```

### Vercel Configuration
```json
{
  "buildCommand": "pnpm run build",
  "outputDirectory": "build",
  "framework": "create-react-app",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "require-corp"
        },
        {
          "key": "Cross-Origin-Opener-Policy", 
          "value": "same-origin"
        }
      ]
    }
  ]
}
```

## 🛠️ Development

### Component Development
1. **Use shadcn/ui components**: Check existing components first
2. **Follow glass morphism patterns**: Extend with CVA variants
3. **Maintain accessibility**: Include ARIA labels and keyboard navigation
4. **Test responsiveness**: Mobile-first design approach

### TypeScript Migration
The project is gradually migrating to TypeScript:
- Core components are being converted to `.tsx`
- Type definitions are in `/src/types/`
- New components should use TypeScript

### Performance Monitoring
- **Web Vitals**: Integrated performance monitoring
- **Bundle Analysis**: Use `pnpm run analyze`
- **Lighthouse**: Target 90+ performance score

## 🔄 Major Changes from v1.0

### ✅ Added
- **ImageMagick WASM**: Professional-grade image processing
- **AVIF/HEIC Support**: Modern format conversion
- **Web Worker Architecture**: Non-blocking processing
- **shadcn/ui Components**: Modern, accessible UI library
- **Zero-server Architecture**: Complete client-side processing

### ❌ Removed
- **NestJS Backend**: Eliminated server-side processing entirely
- **Jimp Library**: Replaced with ImageMagick WASM
- **Multiple UI Libraries**: Consolidated to shadcn/ui
- **Server Dependencies**: No backend required

### 🔄 Improved
- **Bundle Size**: Optimized from 500KB+ to 181.82KB main bundle
- **Performance**: Web Workers for non-blocking processing
- **Accessibility**: WCAG 2.1 AA compliance
- **Mobile Experience**: Enhanced responsive design

## 🧪 Testing

### Test Coverage
- Unit tests for utility functions
- Component testing with React Testing Library
- Integration tests for image processing workflows
- Accessibility testing with jest-axe

### Running Tests
```bash
pnpm test              # Run tests in watch mode
pnpm test:coverage     # Run with coverage report
pnpm test:ci           # Run tests for CI
```

## 🛠️ Troubleshooting

### Common Issues

**Build Errors**
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**WASM Module Loading Issues**
- Ensure proper CORS headers for WASM files
- Check browser console for specific error messages
- Verify WebAssembly support in target browsers

**Glass Effects Not Working**
- Ensure browser supports `backdrop-filter: blur()`
- Check for CSS conflicts in browser dev tools
- Verify Tailwind CSS is properly compiled

## 📊 Performance Metrics

### Current Metrics
- **Main Bundle**: 181.82 kB (gzipped)
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3.0s

### Target Scores
- **Lighthouse Performance**: 90+
- **Accessibility**: 100
- **Best Practices**: 95+
- **SEO**: 90+
- **PWA**: 100

## 🔮 Roadmap

### Phase 1: Core Features (Completed ✅)
- [x] ImageMagick WASM integration
- [x] shadcn/ui component migration
- [x] Glass morphism design system
- [x] Zero-server architecture

### Phase 2: Advanced Features (In Progress)
- [ ] Complete TypeScript migration
- [ ] Advanced collage features
- [ ] Video processing with FFmpeg.wasm
- [ ] AI-powered features

### Phase 3: Enterprise Features
- [ ] Plugin architecture
- [ ] Advanced analytics
- [ ] Team collaboration features
- [ ] White-label options

## 📚 Documentation

- **CLAUDE.md** - Comprehensive project documentation
- **CHANGELOG.md** - Detailed change history
- **ACCESSIBILITY.md** - WCAG compliance and accessibility features
- **SECURITY_REPORT.md** - Security analysis and best practices
- **DEPLOYMENT.md** - Deployment guide and configuration

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- **shadcn/ui** - Outstanding component library and design system
- **ImageMagick** - Powerful image processing capabilities
- **Radix UI** - Accessible, unstyled UI primitives
- **Tailwind CSS** - Utility-first CSS framework
- **Create React App** - Project scaffolding and build tools

---

**Version**: 2.0.0 | **Last Updated**: August 2, 2025  
**Architecture**: Browser-Native PWA with WebAssembly Processing  
**Made with ❤️ using React, TypeScript, and modern web standards**