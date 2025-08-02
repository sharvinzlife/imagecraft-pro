/**
 * BackgroundSelector Component
 * Glass morphism background selection interface for collages
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';

const BackgroundSelector = ({ 
  currentBackground,
  onBackgroundChange,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState('gradient');
  const [customColor, setCustomColor] = useState('#f97316');
  const [gradientDirection, setGradientDirection] = useState(135);

  // Predefined background options
  const backgroundCategories = {
    gradient: {
      name: 'Gradients',
      icon: '🌈',
      options: [
        {
          id: 'orange-gradient',
          name: 'Orange Glow',
          type: 'gradient',
          value: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(255, 255, 255, 0.3))',
          opacity: 0.8,
          preview: 'linear-gradient(135deg, #f97316, #fb923c)'
        },
        {
          id: 'blue-gradient',
          name: 'Ocean Blue',
          type: 'gradient',
          value: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 197, 253, 0.3))',
          opacity: 0.8,
          preview: 'linear-gradient(135deg, #3b82f6, #93c5fd)'
        },
        {
          id: 'purple-gradient',
          name: 'Purple Haze',
          type: 'gradient',
          value: 'linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(196, 181, 253, 0.3))',
          opacity: 0.8,
          preview: 'linear-gradient(135deg, #9333ea, #c4b5fd)'
        },
        {
          id: 'green-gradient',
          name: 'Forest Green',
          type: 'gradient',
          value: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(167, 243, 208, 0.3))',
          opacity: 0.8,
          preview: 'linear-gradient(135deg, #22c55e, #a7f3d0)'
        },
        {
          id: 'pink-gradient',
          name: 'Sunset Pink',
          type: 'gradient',
          value: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(251, 207, 232, 0.3))',
          opacity: 0.8,
          preview: 'linear-gradient(135deg, #ec4899, #fbcfe8)'
        },
        {
          id: 'warm-gradient',
          name: 'Warm Sunset',
          type: 'gradient',
          value: 'linear-gradient(135deg, rgba(251, 146, 60, 0.2), rgba(254, 215, 170, 0.3))',
          opacity: 0.8,
          preview: 'linear-gradient(135deg, #fb923c, #fed7aa)'
        }
      ]
    },
    solid: {
      name: 'Solid Colors',
      icon: '🎨',
      options: [
        {
          id: 'white',
          name: 'Pure White',
          type: 'solid',
          value: '#ffffff',
          opacity: 1.0,
          preview: '#ffffff'
        },
        {
          id: 'light-gray',
          name: 'Light Gray',
          type: 'solid',
          value: '#f8fafc',
          opacity: 1.0,
          preview: '#f8fafc'
        },
        {
          id: 'cream',
          name: 'Cream',
          type: 'solid',
          value: '#fef7ed',
          opacity: 1.0,
          preview: '#fef7ed'
        },
        {
          id: 'light-orange',
          name: 'Light Orange',
          type: 'solid',
          value: '#fed7aa',
          opacity: 1.0,
          preview: '#fed7aa'
        },
        {
          id: 'black',
          name: 'Deep Black',
          type: 'solid',
          value: '#000000',
          opacity: 1.0,
          preview: '#000000'
        },
        {
          id: 'dark-gray',
          name: 'Dark Gray',
          type: 'solid',
          value: '#1f2937',
          opacity: 1.0,
          preview: '#1f2937'
        }
      ]
    },
    glass: {
      name: 'Glass Effects',
      icon: '💎',
      options: [
        {
          id: 'glass-light',
          name: 'Light Glass',
          type: 'glass',
          value: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(249, 115, 22, 0.1))',
          opacity: 0.8,
          preview: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(249, 115, 22, 0.3))'
        },
        {
          id: 'glass-orange',
          name: 'Orange Glass',
          type: 'glass',
          value: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(255, 255, 255, 0.3))',
          opacity: 0.9,
          preview: 'linear-gradient(135deg, rgba(249, 115, 22, 0.5), rgba(255, 255, 255, 0.5))'
        },
        {
          id: 'glass-blue',
          name: 'Blue Glass',
          type: 'glass',
          value: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(255, 255, 255, 0.3))',
          opacity: 0.9,
          preview: 'linear-gradient(135deg, rgba(59, 130, 246, 0.5), rgba(255, 255, 255, 0.5))'
        },
        {
          id: 'glass-dark',
          name: 'Dark Glass',
          type: 'glass',
          value: 'linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(255, 255, 255, 0.1))',
          opacity: 0.8,
          preview: 'linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(255, 255, 255, 0.3))'
        }
      ]
    },
    pattern: {
      name: 'Patterns',
      icon: '🔷',
      options: [
        {
          id: 'dots',
          name: 'Dots Pattern',
          type: 'pattern',
          value: 'radial-gradient(circle at 50% 50%, rgba(249, 115, 22, 0.08), rgba(255, 255, 255, 0.15))',
          opacity: 0.8,
          preview: 'radial-gradient(circle, #f97316 1px, transparent 1px)'
        },
        {
          id: 'grid',
          name: 'Grid Pattern',
          type: 'pattern',
          value: 'linear-gradient(90deg, rgba(249, 115, 22, 0.1) 1px, transparent 1px), linear-gradient(rgba(249, 115, 22, 0.1) 1px, transparent 1px)',
          opacity: 0.6,
          preview: 'repeating-linear-gradient(90deg, transparent, transparent 20px, #f97316 20px, #f97316 21px)'
        }
      ]
    }
  };

  // Handle category selection
  const handleCategoryChange = useCallback((category) => {
    setSelectedCategory(category);
  }, []);

  // Handle background option selection
  const handleBackgroundSelect = useCallback((option) => {
    onBackgroundChange(option);
  }, [onBackgroundChange]);

  // Handle custom color change
  const handleCustomColorChange = useCallback((color) => {
    setCustomColor(color);
    const customBackground = {
      id: 'custom-solid',
      name: 'Custom Color',
      type: 'solid',
      value: color,
      opacity: 1.0,
      preview: color
    };
    onBackgroundChange(customBackground);
  }, [onBackgroundChange]);

  // Create custom gradient
  const handleCustomGradient = useCallback(() => {
    const customGradient = {
      id: 'custom-gradient',
      name: 'Custom Gradient',
      type: 'gradient',
      value: `linear-gradient(${gradientDirection}deg, ${customColor}, ${customColor}80)`,
      opacity: 0.8,
      preview: `linear-gradient(${gradientDirection}deg, ${customColor}, ${customColor}80)`
    };
    onBackgroundChange(customGradient);
  }, [customColor, gradientDirection, onBackgroundChange]);

  const currentOptions = backgroundCategories[selectedCategory]?.options || [];

  return (
    <Card variant="glassSubtle" className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Background
          </h3>
          {currentBackground && (
            <button
              onClick={() => onBackgroundChange(null)}
              className="text-sm text-gray-500 hover:text-red-500 transition-colors duration-200"
            >
              Clear
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Category Tabs */}
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(backgroundCategories).map(([key, category]) => (
            <button
              key={key}
              onClick={() => handleCategoryChange(key)}
              className={`p-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                selectedCategory === key
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-white/20 text-gray-700 hover:bg-white/30'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Background Options Grid */}
        <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
          {currentOptions.map((option) => (
            <BackgroundOption
              key={option.id}
              option={option}
              isSelected={currentBackground?.id === option.id}
              onClick={() => handleBackgroundSelect(option)}
            />
          ))}
        </div>

        {/* Custom Controls */}
        {selectedCategory === 'solid' && (
          <div className="space-y-3 pt-4 border-t border-orange-500/20">
            <label className="block text-sm font-medium text-gray-700">
              Custom Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={customColor}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                className="w-12 h-12 rounded-lg border-2 border-orange-500/30 cursor-pointer"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  className="w-full p-2 bg-white/20 border border-orange-500/30 rounded-lg text-sm"
                  placeholder="#f97316"
                />
              </div>
            </div>
          </div>
        )}

        {selectedCategory === 'gradient' && (
          <div className="space-y-3 pt-4 border-t border-orange-500/20">
            <label className="block text-sm font-medium text-gray-700">
              Custom Gradient
            </label>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border-2 border-orange-500/30 cursor-pointer"
                />
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">Direction</label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={gradientDirection}
                    onChange={(e) => setGradientDirection(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 text-center">{gradientDirection}°</div>
                </div>
              </div>
              <Button
                variant="glassSecondary" 
                size="sm" 
                onClick={handleCustomGradient}
                className="w-full"
              >
                Apply Custom Gradient
              </Button>
            </div>
          </div>
        )}

        {/* Current Background Preview */}
        {currentBackground && (
          <div className="pt-4 border-t border-orange-500/20">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Background
            </label>
            <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg">
              <div 
                className="w-8 h-8 rounded-lg border border-gray-300 flex-shrink-0"
                style={{ background: currentBackground.preview }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {currentBackground.name}
                </p>
                <p className="text-xs text-gray-600 capitalize">
                  {currentBackground.type}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Individual Background Option Component
const BackgroundOption = ({ option, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`group relative aspect-square rounded-lg overflow-hidden transition-all duration-300 transform hover:scale-105 ${
        isSelected ? 'ring-2 ring-orange-500 ring-offset-2' : ''
      }`}
      aria-label={`Select ${option.name} background`}
    >
      <div
        className="absolute inset-0 w-full h-full"
        style={{ background: option.preview }}
      />
      
      {/* Glass morphism effect overlay */}
      {option.type === 'glass' && (
        <div className="absolute inset-0 backdrop-blur-sm bg-white/10" />
      )}
      
      {/* Overlay with name */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-end">
        <div className="w-full p-2 bg-gradient-to-t from-black/50 to-transparent">
          <p className="text-white text-xs font-medium text-center truncate">
            {option.name}
          </p>
        </div>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  );
};

export default BackgroundSelector;