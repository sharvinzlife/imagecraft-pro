/**
 * Template Selector Component
 * Glass Morphism Template Browser with Filtering
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { 
  COLLAGE_TEMPLATES, 
  TEMPLATE_CATEGORIES, 
  PLATFORM_SPECS,
  getTemplatesByCategory,
  getTemplatesByPlatform,
  searchTemplates
} from '../../constants/collageTemplates';
import { TemplateCategory, SocialPlatform, CollageTemplate } from '../../types/collage';

const TemplateSelector = ({ 
  currentPlatform,
  selectedTemplate,
  onPlatformChange,
  onTemplateSelect,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);

  // Filter templates based on current selections
  const filteredTemplates = useMemo(() => {
    let templates = COLLAGE_TEMPLATES;

    // Filter by platform
    if (currentPlatform) {
      templates = getTemplatesByPlatform(currentPlatform);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      templates = templates.filter(t => t.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      templates = templates.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return templates;
  }, [currentPlatform, selectedCategory, searchQuery]);

  // Get available categories for current platform
  const availableCategories = useMemo(() => {
    if (!currentPlatform) return Object.keys(TEMPLATE_CATEGORIES);
    
    const platformTemplates = getTemplatesByPlatform(currentPlatform);
    const categories = new Set(platformTemplates.map(t => t.category));
    return Array.from(categories);
  }, [currentPlatform]);

  const handleCategoryChange = useCallback((category) => {
    setSelectedCategory(category);
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleTemplateClick = useCallback((template) => {
    onTemplateSelect(template);
  }, [onTemplateSelect]);

  return (
    <Card variant="glassSubtle" className={className}>
      <CardHeader className="pb-4">
        <div className="flex flex-col space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Templates
            </h3>
            <div className="text-sm text-gray-600">
              {filteredTemplates.length} available
            </div>
          </div>

          {/* Platform Selector */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform
            </label>
            <button
              onClick={() => setShowPlatformDropdown(!showPlatformDropdown)}
              className="w-full flex items-center justify-between p-3 bg-white/20 backdrop-blur-sm border border-orange-500/30 rounded-lg hover:bg-white/30 hover:border-orange-500/50 transition-all duration-300"
              aria-expanded={showPlatformDropdown}
              aria-haspopup="listbox"
            >
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}
                />
                <span className="text-gray-800 font-medium">
                  {PLATFORM_SPECS[currentPlatform].name}
                </span>
              </div>
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${showPlatformDropdown ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Platform Dropdown */}
            {showPlatformDropdown && (
              <div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-md border border-orange-500/30 rounded-lg shadow-lg">
                {Object.entries(PLATFORM_SPECS).map(([key, spec]) => (
                  <button
                    key={key}
                    onClick={() => {
                      onPlatformChange(key);
                      setShowPlatformDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 text-left hover:bg-orange-50/50 transition-colors duration-200 ${
                      currentPlatform === key ? 'bg-orange-100/50' : ''
                    }`}
                  >
                    <div>
                      <div className="font-medium text-gray-800">{spec.name}</div>
                      <div className="text-sm text-gray-600">{spec.dimensions.aspectRatio}</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {spec.dimensions.width}×{spec.dimensions.height}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Templates
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by name, description, or tags..."
                className="w-full p-3 pl-10 bg-white/20 backdrop-blur-sm border border-orange-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategoryChange('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-300 ${
                  selectedCategory === 'all'
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'bg-white/20 text-gray-700 hover:bg-white/30'
                }`}
              >
                All ({COLLAGE_TEMPLATES.length})
              </button>
              {availableCategories.map(categoryKey => {
                const category = TEMPLATE_CATEGORIES[categoryKey];
                const count = getTemplatesByCategory(categoryKey).filter(t => 
                  t.platforms.includes(currentPlatform)
                ).length;
                
                return (
                  <button
                    key={categoryKey}
                    onClick={() => handleCategoryChange(categoryKey)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-300 ${
                      selectedCategory === categoryKey
                        ? 'bg-orange-500 text-white shadow-lg'
                        : 'bg-white/20 text-gray-700 hover:bg-white/30'
                    }`}
                  >
                    {category.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Templates Grid */}
        <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
          {filteredTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplate?.id === template.id}
              onClick={() => handleTemplateClick(template)}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">
              No templates found matching your criteria
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-2 text-orange-500 text-sm font-medium hover:text-orange-600 transition-colors duration-200"
            >
              Clear filters
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Individual Template Card Component
const TemplateCard = ({ template, isSelected, onClick }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <button
      onClick={onClick}
      className={`group relative w-full text-left transition-all duration-300 transform hover:scale-105 ${
        isSelected ? 'ring-2 ring-orange-500' : ''
      }`}
      aria-label={`Select ${template.name} template`}
    >
      <Card 
        variant="glass" 
        className={`transition-all duration-300 ${
          isSelected 
            ? 'border-orange-500/60 bg-white/40 shadow-lg' 
            : 'hover:border-orange-500/40 hover:bg-white/30'
        }`}
      >
        <CardContent className="p-3">
          {/* Template Preview */}
          <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden relative">
            {!imageError ? (
              <img
                src={template.thumbnail}
                alt={`${template.name} preview`}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-50">
                <div className="text-center">
                  <div 
                    className="w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-xs text-gray-600 font-medium">
                    {template.photoSlots.length} Photos
                  </div>
                </div>
              </div>
            )}
            
            {/* Selection Indicator */}
            {isSelected && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}

            {/* Popular Badge */}
            {template.isPopular && (
              <div className="absolute top-2 left-2 px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded-full">
                Popular
              </div>
            )}

            {/* Premium Badge */}
            {template.isPremium && (
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-purple-500 text-white text-xs font-medium rounded-full">
                Premium
              </div>
            )}
          </div>

          {/* Template Info */}
          <div>
            <h4 className="font-medium text-gray-800 text-sm mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {template.name}
            </h4>
            <p className="text-xs text-gray-600 mb-2 line-clamp-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              {template.description}
            </p>
            
            {/* Template Stats */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{template.photoSlots.length} photos</span>
              <span>{TEMPLATE_CATEGORIES[template.category].name}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  );
};

export default TemplateSelector;