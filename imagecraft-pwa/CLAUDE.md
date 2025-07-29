# CLAUDE.md - AI Assistant Context

This file contains context and guidelines for AI assistants working on the ImageCraft Pro project.

## 🤖 Project Overview

ImageCraft Pro is a modern Progressive Web Application (PWA) for image processing, editing, and AI-powered transformations. The project emphasizes beautiful UI design with glass morphism effects and comprehensive image manipulation capabilities.

## 🏗️ Architecture & Tech Stack

### Core Technologies
- **React 18**: Functional components with hooks
- **Tailwind CSS 3.x**: Utility-first styling with custom configurations
- **Lucide React**: Icon library for consistent iconography
- **Create React App**: Build tooling and development server
- **PWA**: Service workers and web app manifest

### Key Design Patterns
- **Glass Morphism**: Backdrop blur effects with semi-transparent backgrounds
- **Component Composition**: Reusable components with prop-based customization
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **State Management**: React hooks (useState, useEffect) for local state

## 📁 File Structure & Components

```
src/
├── ImageProcessingApp.js     # Main application component
├── index.js                  # React entry point
├── index.css                 # Global styles with Tailwind directives
└── serviceWorkerRegistration.js # PWA service worker
```

### Component Architecture

#### Main Components
1. **ImageProcessingApp**: Root component with navigation and section rendering
2. **AnimatedBackground**: Fixed background with floating orbs and animations
3. **GlassCard**: Reusable glass morphism container
4. **UploadZone**: File upload interface component
5. **FeatureCard**: Feature showcase with icon and content
6. **GlassButton**: Styled button with hover effects
7. **Navigation**: Responsive navigation component

#### Design System
- **Color Palette**: Orange gradient theme (#f97316 to #fb923c)
- **Typography**: Inter (body), Poppins (headings)
- **Animations**: 300-500ms transitions, subtle hover effects
- **Layout**: Max-width containers with responsive padding

## 🎨 Styling Guidelines

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

### Glass Morphism Pattern
```css
/* Standard glass card styling */
backdrop-blur-md
border-2
rounded-2xl
bg-white/20
border-orange-500/30
```

### Color Usage
- **Primary**: Orange (#f97316) for CTAs and highlights
- **Secondary**: Light orange (#fb923c) for gradients
- **Text**: Gray-800 for headings, Gray-600 for body
- **Backgrounds**: Semi-transparent white with blur effects

## 🛠️ Development Commands

```bash
# Development
npm start                 # Start dev server (localhost:3000)
npm run build            # Production build
npm test                 # Run tests (if configured)

# Dependencies
npm install              # Install all dependencies
npm install <package>    # Add new dependency
```

## 🧩 Component Patterns

### Reusable Glass Card
```jsx
<GlassCard 
  className="additional-classes"
  hoverScale={1.02}
  backgroundOpacity={0.2}
>
  {children}
</GlassCard>
```

### Feature Sections
Each main section follows this pattern:
1. Upload zone for file input
2. Feature cards with tools/options
3. Action buttons for processing

### State Management
- Use `useState` for component-level state
- Use `useEffect` for side effects (font loading, etc.)
- Props drilling for simple data passing

## 🔧 Common Tasks

### Adding New Features
1. Add new section to `sections` array in main component
2. Create corresponding case in `renderSectionContent()`
3. Implement UI with existing component patterns
4. Update navigation icons (Lucide React)

### Styling New Components
1. Use existing glass morphism patterns
2. Follow responsive design principles
3. Implement hover states and transitions
4. Maintain color palette consistency

### Icon Updates
- Use Lucide React icons consistently
- Import only needed icons to reduce bundle size
- Maintain 4-6 size classes for different contexts

## 🚨 Important Considerations

### PWA Requirements
- Service worker must be registered in index.js
- Manifest.json must be properly configured
- Icons should be provided in multiple sizes

### Performance
- Lazy load components when possible
- Optimize images and assets
- Use React.memo for expensive components if needed

### Accessibility
- Maintain semantic HTML structure
- Ensure keyboard navigation works
- Use proper ARIA labels for interactive elements

### Browser Compatibility
- Test backdrop-blur support (fallback to solid backgrounds)
- Ensure PWA features work across browsers
- Maintain responsive design on all screen sizes

## 🔮 Future Development

### Planned Features
1. **Backend Integration**: API for actual image processing
2. **File Handling**: Real upload/download functionality
3. **AI Services**: Integration with image AI APIs
4. **User Auth**: Account system and cloud storage
5. **Performance**: Optimize bundle size and loading

### Technical Debt
- Consider TypeScript migration for type safety
- Implement proper error boundaries
- Add comprehensive testing suite
- Optimize component re-renders

## 🐛 Known Issues & Limitations

1. **Placeholder Functionality**: Most features are UI-only
2. **File Upload**: Currently cosmetic, needs backend integration
3. **Image Processing**: No actual manipulation happening
4. **AI Features**: Require external API integration

## 📝 Code Style Guidelines

### React Patterns
- Use functional components with hooks
- Destructure props and state clearly
- Keep components focused and single-purpose
- Use meaningful variable and function names

### CSS/Styling
- Prefer Tailwind utilities over custom CSS
- Use consistent spacing scale (Tailwind's default)
- Maintain hover states for interactive elements
- Group related utility classes logically

### File Organization
- Keep components in logical files
- Export components with clear names
- Use consistent import ordering
- Document complex functions with comments

## 🔄 Testing Strategy

When implementing tests:
- Test component rendering
- Test user interactions
- Test responsive behavior
- Test PWA functionality

## 📊 Performance Monitoring

Key metrics to track:
- Bundle size and loading time
- First paint and interaction metrics
- PWA installation rate
- Mobile performance scores

---

**Last Updated**: 2024-07-29
**Version**: 1.0.0
**Maintainer**: AI Assistant (Claude)