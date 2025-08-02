import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Download, Upload, RotateCcw, Palette } from 'lucide-react';

const CollageEditor = ({ template, onBack, onExport }) => {
  const [images, setImages] = useState({});
  const [selectedGradient, setSelectedGradient] = useState('orange');
  const fileInputRef = useRef(null);
  const [draggedSlot, setDraggedSlot] = useState(null);

  const gradients = [
    { id: 'orange', name: 'Orange Sunset', class: 'bg-gradient-to-br from-orange-400 to-red-500' },
    { id: 'blue', name: 'Ocean Blue', class: 'bg-gradient-to-br from-blue-400 to-blue-600' },
    { id: 'purple', name: 'Purple Dream', class: 'bg-gradient-to-br from-purple-400 to-pink-500' },
    { id: 'green', name: 'Forest Green', class: 'bg-gradient-to-br from-green-400 to-emerald-600' },
    { id: 'warm', name: 'Warm Sunset', class: 'bg-gradient-to-br from-yellow-400 to-orange-500' },
    { id: 'cool', name: 'Cool Breeze', class: 'bg-gradient-to-br from-cyan-400 to-blue-500' }
  ];

  const handleImageUpload = useCallback((slotIndex, event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages(prev => ({
          ...prev,
          [slotIndex]: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const triggerImageUpload = (slotIndex) => {
    if (fileInputRef.current) {
      fileInputRef.current.dataset.slotIndex = slotIndex;
      fileInputRef.current.click();
    }
  };

  const removeImage = (slotIndex) => {
    setImages(prev => {
      const newImages = { ...prev };
      delete newImages[slotIndex];
      return newImages;
    });
  };

  const handleDragOver = (e, slotIndex) => {
    e.preventDefault();
    setDraggedSlot(slotIndex);
  };

  const handleDragLeave = () => {
    setDraggedSlot(null);
  };

  const handleDrop = (e, slotIndex) => {
    e.preventDefault();
    setDraggedSlot(null);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImages(prev => ({
          ...prev,
          [slotIndex]: event.target.result
        }));
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const selectedGradientStyle = gradients.find(g => g.id === selectedGradient);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="glassSecondary"
          onClick={onBack}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Templates</span>
        </Button>
        
        <div className="flex space-x-2">
          <Button
            variant="glassSecondary"
            onClick={() => setImages({})}
            className="flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
          
          <Button
            variant="glassPrimary"
            onClick={() => onExport && onExport({ template, images, background: { type: 'gradient', gradient: selectedGradient } })}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Template Info */}
      <Card variant="glass">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {template.name}
              </h2>
              <p className="text-sm text-gray-600">
                {template.platform} • {template.dimensions} • {template.layout.length} photos
              </p>
            </div>
            <template.icon className="w-8 h-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      {/* Background Selection */}
      <Card variant="glass">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Palette className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-gray-900">Background</h3>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {gradients.map((gradient) => (
                <button
                  key={gradient.id}
                  onClick={() => setSelectedGradient(gradient.id)}
                  className={`h-12 rounded-lg ${gradient.class} transition-transform duration-200 hover:scale-105 ${
                    selectedGradient === gradient.id ? 'ring-2 ring-orange-500 ring-offset-2' : ''
                  }`}
                  title={gradient.name}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Canvas */}
      <Card variant="glass">
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div 
              className={`relative ${selectedGradientStyle?.class || 'bg-gradient-to-br from-orange-400 to-red-500'} rounded-xl shadow-2xl max-w-full`}
              style={{
                aspectRatio: template.ratio.replace(':', '/'),
                width: '100%',
                maxWidth: template.ratio.startsWith('9:16') ? '320px' : '480px',
              }}
            >
              {template.layout.map((slot, index) => {
                const hasImage = images[index];
                const isDragged = draggedSlot === index;

                return (
                  <div
                    key={index}
                    className={`absolute rounded-lg border-2 transition-all duration-300 cursor-pointer ${
                      hasImage 
                        ? 'border-white/50 bg-white/10' 
                        : isDragged 
                          ? 'border-orange-300 border-dashed bg-white/30' 
                          : 'border-white/30 border-dashed bg-white/20 hover:bg-white/30'
                    } backdrop-blur-sm`}
                    style={{
                      left: `${(slot.x / parseInt(template.dimensions.split('x')[0])) * 100}%`,
                      top: `${(slot.y / parseInt(template.dimensions.split('x')[1])) * 100}%`,
                      width: `${(slot.width / parseInt(template.dimensions.split('x')[0])) * 100}%`,
                      height: `${(slot.height / parseInt(template.dimensions.split('x')[1])) * 100}%`,
                    }}
                    onClick={() => !hasImage && triggerImageUpload(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    {hasImage ? (
                      <div className="relative w-full h-full group">
                        <img
                          src={images[index]}
                          alt={`Slot ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="glassSecondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerImageUpload(index);
                              }}
                              className="text-xs"
                            >
                              Replace
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImage(index);
                              }}
                              className="text-xs"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white/80 text-center p-2">
                        <Upload className="w-6 h-6 mb-2" />
                        <span className="text-xs font-medium">
                          Drop image or click
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const slotIndex = parseInt(e.target.dataset.slotIndex);
          handleImageUpload(slotIndex, e);
        }}
      />
    </div>
  );
};

export default CollageEditor;