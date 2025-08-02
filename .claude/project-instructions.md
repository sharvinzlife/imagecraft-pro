# ImageCraft Pro Development Instructions

## Project Overview
ImageCraft Pro is a modern PWA for image processing with a glass morphism design system. All development should prioritize accessibility, performance, and progressive enhancement.

## Development Workflow

### 1. Component Development
- **Always check existing components** in `src/components/` before creating new ones
- **Use TypeScript** for all new code with proper type definitions
- **Follow the glass morphism design pattern**:
  ```tsx
  className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl"
  ```

### 2. Accessibility Requirements
- **Minimum contrast ratio**: 4.5:1 for normal text, 3:1 for large text
- **Always test glass morphism backgrounds** with contrasts MCP
- **Include ARIA labels** for all interactive elements
- **Ensure keyboard navigation** works properly

### 3. Image Processing Features
- **Location**: `src/utils/imageProcessing/`
- **Pattern**: Each feature is a separate module
- **Testing**: Include sample images for testing
- **Performance**: Use Web Workers for heavy processing

### 4. PWA Considerations
- **Service Worker**: Located at `public/service-worker.js`
- **Offline Support**: Cache critical assets and UI
- **App Manifest**: Update `public/manifest.json` for new features
- **Icons**: Maintain all size variants in `public/icons/`

### 5. State Management
- **Zustand Store**: `src/store/`
- **Pattern**: One slice per feature domain
- **Persistence**: Use localStorage for user preferences

### 6. Styling Guidelines
- **Tailwind CSS**: Primary styling method
- **Custom Properties**: Use CSS variables for design tokens
- **Responsive**: Mobile-first approach
- **Dark Mode**: Not currently implemented (glass morphism works in all lighting)

### 7. Component Structure
```
src/components/
├── common/          # Shared components
├── features/        # Feature-specific components
├── layout/          # Layout components
└── ui/              # Base UI components
```

### 8. Testing Strategy
- **Unit Tests**: For utility functions
- **Component Tests**: For complex interactions
- **Accessibility Tests**: Using automated tools
- **Manual Testing**: PWA features and offline mode

### 9. Performance Optimization
- **Lazy Loading**: For feature components
- **Code Splitting**: By route
- **Image Optimization**: Convert to WebP when possible
- **Bundle Size**: Monitor with webpack-bundle-analyzer

### 10. Git Workflow
- **Branch Naming**: `feature/`, `fix/`, `chore/`
- **Commit Messages**: Conventional commits format
- **PR Template**: Include accessibility checklist

## Common Tasks

### Adding a New Image Tool
1. Create module in `src/utils/imageProcessing/`
2. Add UI component in `src/components/features/tools/`
3. Update the tool registry
4. Add to service worker cache
5. Test offline functionality
6. Verify accessibility with contrasts MCP

### Implementing Glass Morphism Component
1. Start with base structure
2. Apply backdrop-blur and transparency
3. Add subtle border for definition
4. Test contrast with various backgrounds
5. Ensure text remains readable

### Updating Design Tokens
1. Locate `src/styles/tokens.css`
2. Update CSS custom properties
3. Test all components using the tokens
4. Verify accessibility isn't compromised

## Code Quality Checklist
- [ ] TypeScript types are properly defined
- [ ] Component is accessible (ARIA, keyboard nav)
- [ ] Glass morphism contrast is sufficient
- [ ] Works offline (if applicable)
- [ ] Responsive on all screen sizes
- [ ] Performance impact is minimal
- [ ] Code follows project patterns

## Debugging Tips
- **Glass Morphism Issues**: Check browser support for backdrop-filter
- **PWA Not Updating**: Clear service worker cache
- **Contrast Problems**: Use browser DevTools color picker
- **Performance**: Use Chrome DevTools Performance tab

## Resources
- Design System: Internal documentation
- Accessibility: WCAG 2.1 guidelines
- PWA Best Practices: web.dev/progressive-web-apps
- Glass Morphism: Consider fallbacks for older browsers