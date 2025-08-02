/**
 * ExportPanel Component
 * Glass morphism export controls with format options
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { downloadBlob } from '../../utils/collageExport';

const ExportPanel = ({ 
  isExporting,
  canExport,
  isDirty,
  onExport,
  onSave,
  onReset,
  className = ''
}) => {
  const [exportFormat, setExportFormat] = useState('png');
  const [exportQuality, setExportQuality] = useState('high');
  const [exportScale, setExportScale] = useState('2x');
  const [includeWatermark, setIncludeWatermark] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Export configuration options
  const formatOptions = [
    { value: 'png', label: 'PNG', description: 'Best quality, larger file' },
    { value: 'jpeg', label: 'JPEG', description: 'Smaller file, no transparency' },
    { value: 'webp', label: 'WebP', description: 'Modern format, great compression' }
  ];

  const qualityOptions = [
    { value: 'low', label: 'Low (60%)', numeric: 0.6 },
    { value: 'medium', label: 'Medium (80%)', numeric: 0.8 },
    { value: 'high', label: 'High (100%)', numeric: 1.0 }
  ];

  const scaleOptions = [
    { value: '1x', label: '1x (Original)', numeric: 1.0 },
    { value: '2x', label: '2x (Retina)', numeric: 2.0 },
    { value: '3x', label: '3x (Print)', numeric: 3.0 }
  ];

  // Handle export
  const handleExport = useCallback(async () => {
    if (!canExport || isExporting) return;

    const config = {
      format: exportFormat,
      quality: qualityOptions.find(q => q.value === exportQuality)?.numeric || 1.0,
      scale: scaleOptions.find(s => s.value === exportScale)?.numeric || 2.0,
      includeWatermark
    };

    try {
      const result = await onExport(config);
      if (result) {
        // Auto-download the exported file
        downloadBlob(result.blob, result.filename);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [canExport, isExporting, exportFormat, exportQuality, exportScale, includeWatermark, onExport]);

  // Handle save
  const handleSave = useCallback(() => {
    if (onSave) {
      onSave();
    }
  }, [onSave]);

  // Handle reset
  const handleReset = useCallback(() => {
    if (onReset && window.confirm('Are you sure you want to reset? All changes will be lost.')) {
      onReset();
    }
  }, [onReset]);

  return (
    <Card variant="glassSubtle" className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Export
          </h3>
          {isDirty && (
            <div className="w-2 h-2 bg-orange-500 rounded-full" title="Unsaved changes" />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Format
          </label>
          <div className="grid grid-cols-1 gap-2">
            {formatOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setExportFormat(option.value)}
                className={`p-3 text-left rounded-lg border-2 transition-all duration-300 ${
                  exportFormat === option.value
                    ? 'border-orange-500 bg-orange-50/50'
                    : 'border-orange-500/20 hover:border-orange-500/40 hover:bg-white/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">{option.label}</div>
                    <div className="text-xs text-gray-600">{option.description}</div>
                  </div>
                  {exportFormat === option.value && (
                    <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                      <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quality Selection (for JPEG/WebP) */}
        {(exportFormat === 'jpeg' || exportFormat === 'webp') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quality
            </label>
            <div className="flex space-x-2">
              {qualityOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setExportQuality(option.value)}
                  className={`flex-1 p-2 text-xs font-medium rounded-lg transition-all duration-300 ${
                    exportQuality === option.value
                      ? 'bg-orange-500 text-white'
                      : 'bg-white/20 text-gray-700 hover:bg-white/30'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scale Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resolution
          </label>
          <div className="flex space-x-2">
            {scaleOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setExportScale(option.value)}
                className={`flex-1 p-2 text-xs font-medium rounded-lg transition-all duration-300 ${
                  exportScale === option.value
                    ? 'bg-orange-500 text-white'
                    : 'bg-white/20 text-gray-700 hover:bg-white/30'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between p-2 text-sm text-gray-600 hover:text-orange-500 transition-colors duration-200"
        >
          <span>Advanced Options</span>
          <svg 
            className={`w-4 h-4 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="space-y-3 pt-2 border-t border-orange-500/20">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={includeWatermark}
                onChange={(e) => setIncludeWatermark(e.target.checked)}
                className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
              />
              <span className="text-sm text-gray-700">Include watermark</span>
            </label>
          </div>
        )}

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={!canExport || isExporting}
          className={`w-full p-4 rounded-lg font-medium text-white transition-all duration-300 ${
            canExport && !isExporting
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          {isExporting ? (
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Exporting...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export & Download</span>
            </div>
          )}
        </button>

        {/* Secondary Actions */}
        <div className="flex space-x-2">
          <button
            onClick={handleSave}
            disabled={!isDirty}
            className={`flex-1 p-3 rounded-lg font-medium transition-all duration-300 ${
              isDirty
                ? 'bg-white/20 text-gray-800 hover:bg-white/30 border border-orange-500/30'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Save Draft
          </button>
          
          <button
            onClick={handleReset}
            className="flex-1 p-3 rounded-lg font-medium bg-white/20 text-gray-800 hover:bg-red-50/50 hover:text-red-600 border border-gray-300/30 hover:border-red-300/50 transition-all duration-300"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Reset
          </button>
        </div>

        {/* Export Info */}
        {canExport && (
          <div className="text-xs text-gray-500 space-y-1 p-3 bg-gray-50/50 rounded-lg">
            <div className="flex justify-between">
              <span>Format:</span>
              <span className="text-gray-700">{exportFormat.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span>Resolution:</span>
              <span className="text-gray-700">{exportScale}</span>
            </div>
            {(exportFormat === 'jpeg' || exportFormat === 'webp') && (
              <div className="flex justify-between">
                <span>Quality:</span>
                <span className="text-gray-700">{exportQuality}</span>
              </div>
            )}
          </div>
        )}

        {/* Help Text */}
        {!canExport && (
          <div className="text-center p-4 bg-gray-50/50 rounded-lg">
            <p className="text-sm text-gray-500 mb-2">
              Select a template and add photos to enable export
            </p>
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Files will be downloaded automatically</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExportPanel;