import React from 'react';
import { cn } from '../../lib/utils';
import { GLASS_MORPHISM_STYLES } from '../../constants/collageTemplates';

const BackgroundOverlay = ({
  style,
  dimensions,
  children,
  className = ''
}) => {
  // Generate background style based on configuration
  const getBackgroundStyle = () => {
    if (!style) return {};

    switch (style.type) {
      case 'solid':
        return {
          backgroundColor: style.colors?.[0] || '#ffffff',
          opacity: (style.opacity || 100) / 100
        };

      case 'gradient':
        const colors = style.colors || ['#f97316', '#fb923c'];
        const direction = style.gradientDirection || 135;
        const opacity = (style.opacity || 100) / 100;
        
        return {
          background: `linear-gradient(${direction}deg, ${colors.join(', ')})`,
          opacity
        };

      case 'glass':
        const blurIntensity = style.blurIntensity || 15;
        const glassOpacity = (style.opacity || 20) / 100;
        
        return {
          backdropFilter: `blur(${blurIntensity}px)`,
          background: `rgba(255, 255, 255, ${glassOpacity})`,
          border: `2px solid ${GLASS_MORPHISM_STYLES.border.glassSubtle}`,
          boxShadow: GLASS_MORPHISM_STYLES.shadow.default
        };

      case 'image':
        return {
          backgroundImage: `url(${style.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: (style.opacity || 100) / 100
        };

      default:
        return {};
    }
  };

  // Calculate aspect ratio container style
  const containerStyle = {
    width: '100%',
    aspectRatio: dimensions ? `${dimensions.width} / ${dimensions.height}` : '1 / 1',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '16px' // Standard rounded-2xl equivalent
  };

  return (
    <div
      className={cn(
        'relative rounded-2xl overflow-hidden',
        className
      )}
      style={containerStyle}
      role="img"
      aria-label={`Collage background for ${dimensions?.platform || 'custom'} ${dimensions?.displayName || 'format'}`}
    >
      {/* Background layer */}
      {style && (
        <div
          className="absolute inset-0 w-full h-full"
          style={getBackgroundStyle()}
          aria-hidden="true"
        />
      )}

      {/* Glass morphism additional overlay for enhanced effect */}
      {style?.type === 'glass' && (
        <div 
          className="absolute inset-0 w-full h-full opacity-60"
          style={{
            background: GLASS_MORPHISM_STYLES.background.gradientOverlay
          }}
          aria-hidden="true"
        />
      )}

      {/* Content layer */}
      <div className="relative w-full h-full">
        {children}
      </div>

      {/* Platform indicator for development/debugging */}
      {process.env.NODE_ENV === 'development' && dimensions && (
        <div className="absolute bottom-2 right-2 px-2 py-1 backdrop-blur-sm bg-white/80 border border-orange-500/30 rounded text-xs text-gray-900 font-mono shadow-sm">
          {dimensions.width}×{dimensions.height} ({dimensions.aspectRatio})
        </div>
      )}
    </div>
  );
};

export default BackgroundOverlay;