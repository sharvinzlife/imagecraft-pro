/**
 * TextOverlay Component
 * Editable text overlays with glass morphism styling
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';

const TextOverlay = ({ 
  overlay,
  position,
  assignment,
  canvasScale,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(assignment?.content || overlay.text);
  const textRef = useRef(null);
  const inputRef = useRef(null);

  // Handle double click to start editing
  const handleDoubleClick = useCallback((e) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  // Handle editing completion
  const handleEditComplete = useCallback(() => {
    setIsEditing(false);
    if (editValue !== assignment?.content) {
      onUpdate(editValue);
    }
  }, [editValue, assignment?.content, onUpdate]);

  // Handle key events during editing
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditComplete();
    } else if (e.key === 'Escape') {
      setEditValue(assignment?.content || overlay.text);
      setIsEditing(false);
    }
  }, [handleEditComplete, assignment?.content, overlay.text]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Calculate styles based on overlay configuration
  const getTextStyles = useCallback(() => {
    const baseStyles = {
      position: 'absolute',
      left: position.x,
      top: position.y,
      width: position.width,
      height: position.height,
      fontSize: `${overlay.fontSize * canvasScale}rem`,
      fontWeight: overlay.fontWeight,
      color: overlay.color,
      textAlign: overlay.textAlign,
      fontFamily: overlay.fontFamily === 'Poppins' ? 'Poppins, sans-serif' 
                  : overlay.fontFamily === 'Inter' ? 'Inter, sans-serif' 
                  : 'system-ui, sans-serif',
      lineHeight: 1.2,
      cursor: 'text',
      userSelect: 'none',
      wordWrap: 'break-word',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: overlay.textAlign === 'center' ? 'center' 
                     : overlay.textAlign === 'right' ? 'flex-end' 
                     : 'flex-start'
    };

    // Add background styling if specified
    if (overlay.background === 'glass') {
      return {
        ...baseStyles,
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(249, 115, 22, 0.1))',
        backdropFilter: 'blur(8px)',
        borderRadius: '8px',
        padding: `${8 * canvasScale}px`,
        border: '1px solid rgba(249, 115, 22, 0.2)'
      };
    } else if (overlay.background === 'solid') {
      return {
        ...baseStyles,
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '4px',
        padding: `${6 * canvasScale}px`
      };
    }

    return baseStyles;
  }, [overlay, position, canvasScale]);

  // Get input styles for editing mode
  const getInputStyles = useCallback(() => {
    const textStyles = getTextStyles();
    return {
      ...textStyles,
      background: 'rgba(255, 255, 255, 0.95)',
      border: '2px solid #f97316',
      borderRadius: '8px',
      padding: `${8 * canvasScale}px`,
      outline: 'none',
      resize: 'none',
      boxShadow: '0 4px 16px rgba(249, 115, 22, 0.3)'
    };
  }, [getTextStyles, canvasScale]);

  const displayText = assignment?.content || overlay.text;

  return (
    <>
      {isEditing ? (
        <textarea
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleEditComplete}
          onKeyDown={handleKeyDown}
          style={getInputStyles()}
          placeholder={overlay.text}
          maxLength={overlay.maxLines ? overlay.maxLines * 50 : 500}
          aria-label={`Edit text overlay: ${overlay.id}`}
        />
      ) : (
        <div
          ref={textRef}
          style={getTextStyles()}
          onDoubleClick={handleDoubleClick}
          role="textbox"
          tabIndex={0}
          aria-label={`Text overlay: ${displayText}. Double-click to edit.`}
          aria-describedby={`text-overlay-instructions-${overlay.id}`}
        >
          <span className="select-none">
            {displayText || overlay.text}
          </span>
          
          {/* Edit indicator on hover */}
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
        </div>
      )}
      
      {/* Screen reader instructions */}
      <div id={`text-overlay-instructions-${overlay.id}`} className="sr-only">
        Double-click to edit text. Press Enter to save, Escape to cancel.
      </div>
    </>
  );
};

export default TextOverlay;