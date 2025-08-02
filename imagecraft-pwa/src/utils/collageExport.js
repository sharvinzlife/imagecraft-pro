/**
 * Collage Export Utilities
 * High-quality export for social media platforms
 */

// Export collage to various formats
export const exportCollage = async (exportData, config) => {
  const { 
    template, 
    platform, 
    slotAssignments, 
    textAssignments, 
    backgroundOverlay, 
    platformSpec 
  } = exportData;

  const {
    format = 'png',
    quality = 1.0,
    scale = 2.0,
    includeWatermark = false,
    backgroundColor = 'transparent'
  } = config;

  try {
    // Create high-resolution canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: format === 'png' });
    
    // Set canvas dimensions with scale
    const { width, height } = platformSpec.dimensions;
    canvas.width = width * scale;
    canvas.height = height * scale;
    
    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Clear canvas with background
    if (backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Render background overlay
    if (backgroundOverlay) {
      await renderBackground(ctx, backgroundOverlay, canvas.width, canvas.height);
    }

    // Render photos in correct z-order
    const sortedSlots = template.photoSlots
      .map(slot => ({
        slot,
        assignment: slotAssignments.find(a => a.slotId === slot.id)
      }))
      .filter(({ assignment }) => assignment?.photo)
      .sort((a, b) => (a.slot.position.zIndex || 1) - (b.slot.position.zIndex || 1));

    for (const { slot, assignment } of sortedSlots) {
      await renderPhoto(ctx, slot, assignment, canvas.width, canvas.height, scale);
    }

    // Render text overlays
    if (template.textOverlays && textAssignments) {
      for (const overlay of template.textOverlays) {
        const assignment = textAssignments.find(a => a.overlayId === overlay.id);
        if (assignment?.content) {
          renderText(ctx, overlay, assignment, canvas.width, canvas.height, scale);
        }
      }
    }

    // Add watermark if requested
    if (includeWatermark) {
      renderWatermark(ctx, canvas.width, canvas.height);
    }

    // Convert to blob
    const blob = await new Promise(resolve => {
      if (format === 'jpeg') {
        canvas.toBlob(resolve, 'image/jpeg', quality);
      } else if (format === 'webp') {
        canvas.toBlob(resolve, 'image/webp', quality);
      } else {
        canvas.toBlob(resolve, 'image/png');
      }
    });

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `${template.name.toLowerCase().replace(/\s+/g, '-')}-${platform}-${timestamp}.${format}`;

    return {
      blob,
      url: URL.createObjectURL(blob),
      filename,
      dimensions: { width: canvas.width, height: canvas.height, aspectRatio: platformSpec.dimensions.aspectRatio },
      size: blob.size
    };

  } catch (error) {
    throw new Error(`Export failed: ${error.message}`);
  }
};

// Render background overlay
const renderBackground = async (ctx, backgroundOverlay, canvasWidth, canvasHeight) => {
  const { type, value, opacity = 1, blendMode = 'normal' } = backgroundOverlay;
  
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.globalCompositeOperation = blendMode;

  switch (type) {
    case 'solid':
      ctx.fillStyle = value;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      break;
      
    case 'gradient':
      // Parse gradient and apply
      if (value.includes('linear-gradient')) {
        const gradient = parseLinearGradient(value, canvasWidth, canvasHeight);
        if (gradient) {
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        }
      } else if (value.includes('radial-gradient')) {
        const gradient = parseRadialGradient(value, canvasWidth, canvasHeight);
        if (gradient) {
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        }
      }
      break;
      
    case 'pattern':
      // For simple patterns, render as solid color for now
      // In a full implementation, you'd generate the pattern
      ctx.fillStyle = 'rgba(249, 115, 22, 0.1)';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      break;
      
    case 'glass':
      // Simulate glass morphism effect
      const glassGradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
      glassGradient.addColorStop(0, 'rgba(249, 115, 22, 0.2)');
      glassGradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
      ctx.fillStyle = glassGradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      break;
  }
  
  ctx.restore();
};

// Render individual photo
const renderPhoto = async (ctx, slot, assignment, canvasWidth, canvasHeight, scale) => {
  const { photo, transform = { scale: 1, x: 0, y: 0, rotation: 0 } } = assignment;
  const { position } = slot;
  
  // Calculate position in pixels
  const x = (position.x / 100) * canvasWidth;
  const y = (position.y / 100) * canvasHeight;
  const width = (position.width / 100) * canvasWidth;
  const height = (position.height / 100) * canvasHeight;
  const rotation = (position.rotation || 0) + transform.rotation;

  try {
    // Load image
    const img = await loadImage(photo.url);
    
    ctx.save();
    
    // Apply transformations
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(transform.scale, transform.scale);
    ctx.translate(-width / 2, -height / 2);
    
    // Apply slot-specific styling
    if (slot.style === 'polaroid') {
      // Render polaroid frame
      const frameThickness = 8 * scale;
      const bottomFrameExtra = 16 * scale;
      
      // White frame
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(
        -frameThickness, 
        -frameThickness, 
        width + frameThickness * 2, 
        height + frameThickness + bottomFrameExtra
      );
      
      // Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 10 * scale;
      ctx.shadowOffsetX = 2 * scale;
      ctx.shadowOffsetY = 4 * scale;
    }
    
    // Draw image with proper aspect ratio handling
    drawImageWithAspectRatio(ctx, img, 0, 0, width, height, slot.aspectRatio);
    
    ctx.restore();
    
  } catch (error) {
    console.warn(`Failed to render photo for slot ${slot.id}:`, error);
    
    // Render placeholder
    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-width / 2, -height / 2);
    
    // Placeholder background
    ctx.fillStyle = 'rgba(249, 115, 22, 0.1)';
    ctx.fillRect(0, 0, width, height);
    
    // Placeholder icon
    ctx.fillStyle = 'rgba(249, 115, 22, 0.5)';
    ctx.font = `${Math.min(width, height) * 0.3}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📷', width / 2, height / 2);
    
    ctx.restore();
  }
};

// Render text overlay
const renderText = (ctx, overlay, assignment, canvasWidth, canvasHeight, scale) => {
  const { position, fontSize, fontWeight, color, textAlign, fontFamily = 'Arial' } = overlay;
  const { content } = assignment;
  
  // Calculate position in pixels
  const x = (position.x / 100) * canvasWidth;
  const y = (position.y / 100) * canvasHeight;
  const width = (position.width / 100) * canvasWidth;
  const height = (position.height / 100) * canvasHeight;
  
  ctx.save();
  
  // Set font properties
  const scaledFontSize = fontSize * scale * 16; // Convert rem to pixels
  const fontWeightMap = {
    'normal': '400',
    'medium': '500',
    'semibold': '600',
    'bold': '700'
  };
  
  ctx.font = `${fontWeightMap[fontWeight] || '400'} ${scaledFontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textAlign = textAlign;
  ctx.textBaseline = 'top';
  
  // Render background if specified
  if (overlay.background === 'glass') {
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(249, 115, 22, 0.1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = color; // Reset text color
  }
  
  // Handle text alignment
  let textX = x;
  if (textAlign === 'center') {
    textX = x + width / 2;
  } else if (textAlign === 'right') {
    textX = x + width;
  }
  
  // Word wrap if needed
  const words = content.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > width && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  // Limit lines if maxLines is specified
  const maxLines = overlay.maxLines || lines.length;
  const displayLines = lines.slice(0, maxLines);
  
  // Draw text lines
  const lineHeight = scaledFontSize * 1.2;
  displayLines.forEach((line, index) => {
    ctx.fillText(line, textX, y + index * lineHeight);
  });
  
  ctx.restore();
};

// Render watermark
const renderWatermark = (ctx, canvasWidth, canvasHeight) => {
  ctx.save();
  
  const watermarkText = 'ImageCraft Pro';
  const fontSize = Math.min(canvasWidth, canvasHeight) * 0.02;
  
  ctx.font = `400 ${fontSize}px Arial`;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  
  ctx.fillText(watermarkText, canvasWidth - 20, canvasHeight - 20);
  
  ctx.restore();
};

// Helper function to load image
const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// Helper function to draw image with aspect ratio
const drawImageWithAspectRatio = (ctx, img, x, y, width, height, aspectRatio) => {
  let drawWidth = width;
  let drawHeight = height;
  let drawX = x;
  let drawY = y;
  
  const imgAspect = img.width / img.height;
  const containerAspect = width / height;
  
  if (aspectRatio && aspectRatio !== 'free') {
    // Calculate target aspect ratio
    const targetAspects = {
      'square': 1,
      'portrait': 0.75, // 3:4
      'landscape': 1.33 // 4:3
    };
    
    const targetAspect = targetAspects[aspectRatio] || 1;
    
    if (imgAspect > targetAspect) {
      // Image is wider, crop width
      drawWidth = height * targetAspect;
      drawX = x + (width - drawWidth) / 2;
    } else {
      // Image is taller, crop height
      drawHeight = width / targetAspect;
      drawY = y + (height - drawHeight) / 2;
    }
  } else {
    // Fill container while maintaining aspect ratio
    if (imgAspect > containerAspect) {
      // Image is wider, fit to height
      drawWidth = height * imgAspect;
      drawX = x + (width - drawWidth) / 2;
    } else {
      // Image is taller, fit to width
      drawHeight = width / imgAspect;
      drawY = y + (height - drawHeight) / 2;
    }
  }
  
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
};

// Parse linear gradient from CSS
const parseLinearGradient = (value, width, height) => {
  // Simplified parser for basic gradients
  // In production, you'd want a more robust CSS gradient parser
  
  const match = value.match(/linear-gradient\(([^)]+)\)/);
  if (!match) return null;
  
  const parts = match[1].split(',').map(s => s.trim());
  const direction = parts[0];
  const colors = parts.slice(1);
  
  // Default to 135deg (diagonal)
  let x0 = 0, y0 = 0, x1 = width, y1 = height;
  
  if (direction.includes('135deg')) {
    x0 = 0; y0 = 0; x1 = width; y1 = height;
  } else if (direction.includes('90deg')) {
    x0 = 0; y0 = 0; x1 = 0; y1 = height;
  } else if (direction.includes('180deg')) {
    x0 = 0; y0 = 0; x1 = width; y1 = 0;
  }
  
  const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
  
  colors.forEach((color, index) => {
    const stop = index / (colors.length - 1);
    gradient.addColorStop(stop, color.trim());
  });
  
  return gradient;
};

// Parse radial gradient from CSS
const parseRadialGradient = (value, width, height) => {
  // Simplified parser for basic radial gradients
  const match = value.match(/radial-gradient\(([^)]+)\)/);
  if (!match) return null;
  
  const parts = match[1].split(',').map(s => s.trim());
  const colors = parts.filter(p => !p.includes('circle') && !p.includes('ellipse'));
  
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2;
  
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  
  colors.forEach((color, index) => {
    const stop = index / (colors.length - 1);
    gradient.addColorStop(stop, color.trim());
  });
  
  return gradient;
};

// Export utility for batch processing
export const exportMultipleFormats = async (exportData, formats = ['png', 'jpeg']) => {
  const results = [];
  
  for (const format of formats) {
    try {
      const result = await exportCollage(exportData, { format, quality: format === 'jpeg' ? 0.9 : 1.0 });
      results.push({ format, ...result });
    } catch (error) {
      console.error(`Failed to export ${format}:`, error);
    }
  }
  
  return results;
};

// Download utility
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 100);
};