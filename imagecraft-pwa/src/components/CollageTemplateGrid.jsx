import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Instagram, Facebook, Twitter, Linkedin, Video, Image as ImageIcon } from 'lucide-react';

const CollageTemplateGrid = ({ onTemplateSelect }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const templates = [
    // Instagram Stories (9:16)
    {
      id: 'insta-story-1',
      name: 'Story Grid 2x2',
      category: 'instagram',
      platform: 'Instagram Stories',
      ratio: '9:16',
      dimensions: '1080x1920',
      icon: Instagram,
      popular: true,
      layout: [
        { x: 10, y: 200, width: 520, height: 520 },
        { x: 550, y: 200, width: 520, height: 520 },
        { x: 10, y: 740, width: 520, height: 520 },
        { x: 550, y: 740, width: 520, height: 520 }
      ]
    },
    {
      id: 'insta-story-2',
      name: 'Story Collage 3',
      category: 'instagram',
      platform: 'Instagram Stories',
      ratio: '9:16',
      dimensions: '1080x1920',
      icon: Instagram,
      layout: [
        { x: 20, y: 200, width: 1040, height: 600 },
        { x: 20, y: 820, width: 510, height: 400 },
        { x: 550, y: 820, width: 510, height: 400 }
      ]
    },
    // Instagram Posts (1:1)
    {
      id: 'insta-post-1',
      name: 'Square Grid 4',
      category: 'instagram',
      platform: 'Instagram Post',
      ratio: '1:1',
      dimensions: '1080x1080',
      icon: Instagram,
      popular: true,
      layout: [
        { x: 20, y: 20, width: 520, height: 520 },
        { x: 560, y: 20, width: 520, height: 520 },
        { x: 20, y: 560, width: 520, height: 520 },
        { x: 560, y: 560, width: 520, height: 520 }
      ]
    },
    {
      id: 'insta-post-2',
      name: 'Magazine Layout',
      category: 'instagram',
      platform: 'Instagram Post',
      ratio: '1:1',
      dimensions: '1080x1080',
      icon: Instagram,
      layout: [
        { x: 20, y: 20, width: 640, height: 500 },
        { x: 680, y: 20, width: 380, height: 240 },
        { x: 680, y: 280, width: 380, height: 240 },
        { x: 20, y: 540, width: 1040, height: 520 }
      ]
    },
    // Facebook Posts
    {
      id: 'facebook-1',
      name: 'FB Cover Collage',
      category: 'facebook',
      platform: 'Facebook Post',
      ratio: '1200:630',
      dimensions: '1200x630',
      icon: Facebook,
      layout: [
        { x: 20, y: 20, width: 560, height: 280 },
        { x: 600, y: 20, width: 580, height: 280 },
        { x: 20, y: 320, width: 1160, height: 290 }
      ]
    },
    // Twitter Posts
    {
      id: 'twitter-1',
      name: 'Tweet Collage',
      category: 'twitter',
      platform: 'Twitter/X Post',
      ratio: '1200:675',
      dimensions: '1200x675',
      icon: Twitter,
      layout: [
        { x: 20, y: 20, width: 580, height: 315 },
        { x: 620, y: 20, width: 560, height: 315 },
        { x: 150, y: 355, width: 900, height: 300 }
      ]
    },
    // TikTok
    {
      id: 'tiktok-1',
      name: 'TikTok Split',
      category: 'tiktok',
      platform: 'TikTok',
      ratio: '9:16',
      dimensions: '1080x1920',
      icon: Video,
      layout: [
        { x: 20, y: 200, width: 1040, height: 760 },
        { x: 20, y: 980, width: 1040, height: 760 }
      ]
    },
    // LinkedIn
    {
      id: 'linkedin-1',
      name: 'Professional Grid',
      category: 'linkedin',
      platform: 'LinkedIn Post',
      ratio: '1200:627',
      dimensions: '1200x627',
      icon: Linkedin,
      layout: [
        { x: 20, y: 20, width: 375, height: 280 },
        { x: 415, y: 20, width: 375, height: 280 },
        { x: 810, y: 20, width: 370, height: 280 },
        { x: 150, y: 320, width: 900, height: 287 }
      ]
    }
  ];

  const categories = [
    { id: 'all', name: 'All Templates', icon: ImageIcon },
    { id: 'instagram', name: 'Instagram', icon: Instagram },
    { id: 'facebook', name: 'Facebook', icon: Facebook },
    { id: 'twitter', name: 'Twitter/X', icon: Twitter },
    { id: 'tiktok', name: 'TikTok', icon: Video },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin }
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(template => template.category === selectedCategory);

  const TemplatePreview = ({ template }) => (
    <div 
      className="relative bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg overflow-hidden"
      style={{ aspectRatio: template.ratio.replace(':', '/') }}
    >
      {template.layout.map((slot, index) => (
        <div
          key={index}
          className="absolute border-2 border-orange-300 border-dashed rounded bg-white/50 backdrop-blur-sm"
          style={{
            left: `${(slot.x / parseInt(template.dimensions.split('x')[0])) * 100}%`,
            top: `${(slot.y / parseInt(template.dimensions.split('x')[1])) * 100}%`,
            width: `${(slot.width / parseInt(template.dimensions.split('x')[0])) * 100}%`,
            height: `${(slot.height / parseInt(template.dimensions.split('x')[1])) * 100}%`,
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'glassPrimary' : 'glassSecondary'}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="flex items-center space-x-2"
          >
            <category.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{category.name}</span>
          </Button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card 
            key={template.id}
            variant="glassCream"
            className="cursor-pointer hover:scale-105 transition-transform duration-300"
            onClick={() => onTemplateSelect(template)}
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Template Preview */}
                <TemplatePreview template={template} />
                
                {/* Template Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {template.name}
                    </h3>
                    {template.popular && (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                        Popular
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <template.icon className="w-4 h-4" />
                    <span>{template.platform}</span>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {template.dimensions} • {template.layout.length} photos
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CollageTemplateGrid;