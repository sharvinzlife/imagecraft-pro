import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { Slider } from './ui/slider';
import { CheckCircle, FileImage, Zap, Loader2, Upload, Lock, Settings, Info } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import CelebrationAnimation from './common/CelebrationAnimation.tsx';
import { useImageProcessing, useQualityPresets } from '../hooks/useOptimizedImageProcessing';
import { ButtonText, ResponsiveText } from './ui/responsive-text';

const FormatSelector = ({ uploadedFile, disabled = false }) => {
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [selectedQuality, setSelectedQuality] = useState('medium');
  const [customQuality, setCustomQuality] = useState(80);
  const [useCustomQuality, setUseCustomQuality] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [previousConversionState, setPreviousConversionState] = useState(false);
  
  const { isSignedIn } = useAuth();
  const { 
    convertImage, 
    isProcessing, 
    progress, 
    progressMessage, 
    error, 
    result, 
    isReady,
    estimateOutputSize 
  } = useImageProcessing();
  
  const { presets: qualityPresets } = useQualityPresets();
  // Format info utilities available if needed

  const formatOptions = [
    { 
      id: 'jpeg', 
      name: 'JPEG', 
      description: 'Best for photos, smaller file sizes',
      details: 'Ideal for photographs and images with many colors. Compressed format.',
      icon: '📷',
      popular: true,
      supportsQuality: true
    },
    { 
      id: 'png', 
      name: 'PNG', 
      description: 'Best for graphics, supports transparency',
      details: 'Perfect for logos, graphics, and images needing transparent backgrounds.',
      icon: '🖼️',
      popular: true,
      supportsQuality: false
    },
    { 
      id: 'webp', 
      name: 'WebP', 
      description: 'Modern web format, great compression',
      details: 'Google\'s format with excellent compression and quality balance.',
      icon: '🌐',
      popular: true,
      supportsQuality: true
    },
    { 
      id: 'avif', 
      name: 'AVIF', 
      description: 'Next-gen format, superior compression',
      details: 'Latest format with the best compression and quality available.',
      icon: '⚡',
      popular: false,
      supportsQuality: true
    },
    { 
      id: 'gif', 
      name: 'GIF', 
      description: 'For simple animations',
      details: 'Limited to 256 colors, mainly used for simple animations.',
      icon: '🎭',
      popular: false,
      supportsQuality: false
    },
    { 
      id: 'bmp', 
      name: 'BMP', 
      description: 'Uncompressed bitmap format',
      details: 'Large file sizes but no quality loss. Rarely used today.',
      icon: '💾',
      popular: false,
      supportsQuality: false
    },
    { 
      id: 'raw', 
      name: 'RAW → JPEG', 
      description: 'Convert RAW images to JPEG',
      details: 'Supports CR2, NEF, ARW, DNG, ORF, RW2 and other RAW formats.',
      icon: '📸',
      popular: false,
      supportsQuality: true,
      isRawConversion: true
    },
    { 
      id: 'tiff', 
      name: 'TIFF', 
      description: 'Professional archival quality',
      details: 'Uncompressed or lossless format used in professional photography.',
      icon: '🎯',
      popular: false,
      supportsQuality: false
    }
  ];

  const handleFormatSelect = (format) => {
    setSelectedFormat(format);
  };

  const handleConvert = async () => {
    if (!selectedFormat || !uploadedFile || isProcessing || !isReady) {
      return;
    }

    try {
      // Use custom quality if enabled, otherwise use preset
      const qualityToUse = useCustomQuality ? customQuality / 100 : selectedQuality;
      
      await convertImage(uploadedFile, selectedFormat.id, qualityToUse, {
        autoDownload: true // Enable automatic download
      });
    } catch (error) {
      console.error('Conversion failed:', error);
      // Error handling is done in the hook
    }
  };

  // Trigger celebration when conversion completes
  useEffect(() => {
    if (previousConversionState && !isProcessing && result) {
      setShowCelebration(true);
      // Auto-hide celebration after 4 seconds
      setTimeout(() => setShowCelebration(false), 4000);
    }
    setPreviousConversionState(isProcessing);
  }, [isProcessing, result, previousConversionState]);

  // Determine conversion state and button behavior
  const hasFile = !!uploadedFile;
  const isAuthenticated = !disabled && isSignedIn;
  const canConvert = hasFile && isAuthenticated && selectedFormat && !isProcessing && isReady;
  
  // Dynamic button text based on state
  const getButtonText = () => {
    if (!isReady) {
      return 'Initializing...';
    }
    if (isProcessing) {
      return progressMessage || `Converting... ${Math.round(progress)}%`;
    }
    if (!hasFile) {
      return 'Upload Image First';
    }
    if (!isAuthenticated) {
      return 'Sign In to Convert';
    }
    if (!selectedFormat) {
      return 'Select Format First';
    }
    return {
      full: `Convert & Download as ${selectedFormat.name}`,
      short: `Convert to ${selectedFormat.name}`,
      mobile: `Convert ${selectedFormat.name}`
    };
  };
  
  // Dynamic button icon based on state
  const getButtonIcon = () => {
    if (!isReady) {
      return <Loader2 className="w-5 h-5 mr-2 animate-spin" />;
    }
    if (isProcessing) {
      return <Loader2 className="w-5 h-5 mr-2 animate-spin" />;
    }
    if (!hasFile) {
      return <Upload className="w-5 h-5 mr-2" />;
    }
    if (!isAuthenticated) {
      return <Lock className="w-5 h-5 mr-2" />;
    }
    return <Zap className="w-5 h-5 mr-2" />;
  };

  // Get estimated output size
  const getEstimatedSize = () => {
    if (!uploadedFile || !selectedFormat) return null;
    
    const estimated = estimateOutputSize(
      uploadedFile.size,
      uploadedFile.type,
      selectedFormat.id,
      selectedQuality
    );
    
    return {
      size: estimated,
      formatted: formatFileSize(estimated),
      ratio: uploadedFile.size > 0 ? estimated / uploadedFile.size : 1
    };
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-3">
          <FileImage className={`w-6 h-6 ${hasFile ? 'text-green-600' : 'text-orange-600'} transition-colors`} />
          <h3 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Choose Output Format
          </h3>
          {hasFile && isAuthenticated && (
            <CheckCircle className="w-5 h-5 text-green-600" />
          )}
        </div>
        <p className="text-gray-700 text-sm font-medium max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
          {!isReady
            ? "Initializing image processing service..."
            : isProcessing
            ? "Converting your image to the selected format... This may take a few moments."
            : hasFile 
            ? "Choose the output format that best fits your needs. Popular formats are highlighted."
            : "Upload an image above, then select the format you want to convert to. Each format has different strengths."
          }
        </p>
      </div>

      {/* Quality Selection - Only show for formats that support quality */}
      {selectedFormat && selectedFormat.supportsQuality && qualityPresets && (
        <Card variant="glassCream" className="animate-in fade-in duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-orange-600" />
                <h4 className="font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Quality Settings
                </h4>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs"
              >
                {showAdvanced ? 'Simple' : 'Advanced'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(qualityPresets).map(([key, preset]) => (
                <Button
                  key={key}
                  variant={selectedQuality === key ? "glassPrimary" : "glassSecondary"}
                  size="sm"
                  onClick={() => setSelectedQuality(key)}
                  className="flex flex-col items-center space-y-1 h-auto py-3 px-4 text-center"
                >
                  <div className="font-semibold capitalize">{key} Quality</div>
                  <div className="text-xs opacity-80">{preset.description}</div>
                </Button>
              ))}
            </div>
            
            {/* Custom Quality Slider - Only show for formats that support quality */}
            {selectedFormat && selectedFormat.supportsQuality && showAdvanced && (
              <div className="mt-4 pt-3 border-t border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <label 
                    htmlFor="quality-slider"
                    className="text-sm font-medium text-gray-700"
                  >
                    Custom Quality: {customQuality}%
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUseCustomQuality(!useCustomQuality);
                      // When enabling custom quality, automatically use the current slider value
                      if (!useCustomQuality) {
                        // User is enabling custom quality mode
                        console.log('Enabling custom quality mode with value:', customQuality);
                      }
                    }}
                    className={`text-xs ${useCustomQuality ? 'text-orange-600 font-semibold' : 'text-gray-500'}`}
                    aria-pressed={useCustomQuality}
                  >
                    {useCustomQuality ? 'Using Custom' : 'Use Custom'}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Slider
                    id="quality-slider"
                    value={[customQuality]}
                    onValueChange={(value) => {
                      console.log('Slider value changed to:', value[0]);
                      setCustomQuality(value[0]);
                      // Automatically enable custom quality when user moves the slider
                      if (!useCustomQuality) {
                        setUseCustomQuality(true);
                      }
                    }}
                    max={100}
                    min={1}
                    step={1}
                    className="w-full"
                    // Remove disabled prop to make slider always interactive
                    aria-label={`Quality setting: ${customQuality} percent`}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1% (Smallest)</span>
                    <span>50% (Balanced)</span>
                    <span>100% (Highest)</span>
                  </div>
                  {!useCustomQuality && (
                    <p className="text-xs text-blue-600 mt-1">
                      💡 Move the slider or click "Use Custom" to enable custom quality
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {/* Size Estimation */}
            {uploadedFile && (() => {
              const estimation = getEstimatedSize();
              return estimation && (
                <div className="mt-4 pt-3 border-t border-white/20">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Original:</span>
                    <span className="font-medium">{formatFileSize(uploadedFile.size)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600">Estimated:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{estimation.formatted}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        estimation.ratio < 0.8 ? 'bg-green-100 text-green-700' :
                        estimation.ratio > 1.2 ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {estimation.ratio < 1 ? '-' : '+'}{Math.abs((1 - estimation.ratio) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Format Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {formatOptions.map((format) => (
          <Card
            key={format.id}
            variant={selectedFormat?.id === format.id ? "glassPrimary" : "glassCream"}
            className={`relative cursor-pointer transition-all duration-300 group ${
              selectedFormat?.id === format.id 
                ? 'ring-2 ring-orange-400/60 shadow-xl scale-105' 
                : 'hover:scale-105'
            }`}
            onClick={() => handleFormatSelect(format)}
          >
            {/* Popular badge */}
            {format.popular && (
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs px-2 py-1 rounded-full shadow-lg backdrop-blur-sm border border-orange-400/50">
                Popular
              </div>
            )}

            {/* Selection indicator */}
            {selectedFormat?.id === format.id && (
              <div className="absolute top-2 left-2 text-white drop-shadow-lg">
                <CheckCircle className="w-5 h-5 fill-white/20" />
              </div>
            )}

            <CardHeader className="pb-2">
              <div className="flex flex-col items-center space-y-2">
                <div className="text-2xl">{format.icon}</div>
                <h4 
                  className={`font-bold text-center transition-colors ${
                    selectedFormat?.id === format.id 
                      ? 'text-slate-900' 
                      : 'text-gray-800 group-hover:text-orange-600'
                  }`}
                  style={{ 
                    fontFamily: 'Poppins, sans-serif',
                    textShadow: selectedFormat?.id === format.id 
                      ? '0 2px 4px rgba(255, 255, 255, 0.9), 0 1px 2px rgba(255, 255, 255, 0.7)' 
                      : undefined
                  }}
                >
                  {format.name}
                </h4>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0 pb-4">
              <div className="space-y-1">
                <p 
                  className={`text-xs text-center font-bold leading-tight ${
                    selectedFormat?.id === format.id 
                      ? 'text-slate-900' 
                      : 'text-gray-900'
                  }`}
                  style={{ 
                    fontFamily: 'Inter, sans-serif',
                    textShadow: selectedFormat?.id === format.id 
                      ? '0 2px 4px rgba(255, 255, 255, 0.9), 0 1px 2px rgba(255, 255, 255, 0.8)' 
                      : '0 2px 4px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(255, 255, 255, 0.6)'
                  }}
                >
                  {format.description}
                </p>
                {format.details && (
                  <p 
                    className={`text-xs text-center leading-tight font-medium ${
                      selectedFormat?.id === format.id 
                        ? 'text-slate-800' 
                        : 'text-gray-800'
                    }`}
                    style={{ 
                      fontFamily: 'Inter, sans-serif',
                      textShadow: selectedFormat?.id === format.id 
                        ? '0 2px 4px rgba(255, 255, 255, 0.9), 0 1px 2px rgba(255, 255, 255, 0.8)' 
                        : '0 2px 4px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(255, 255, 255, 0.6)'
                    }}
                  >
                    {format.details}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Convert Button */}
      <div className="flex flex-col items-center pt-4 space-y-3">
        <Button
          variant={canConvert ? "glassPrimary" : "glassSecondary"}
          size="lg"
          onClick={handleConvert}
          disabled={!canConvert}
          className={`min-w-[220px] h-12 text-base font-bold transition-all duration-300 relative overflow-hidden ${
            canConvert
              ? 'hover:shadow-lg hover:scale-105 active:scale-95 border-2 border-orange-500/40' 
              : 'opacity-70 cursor-not-allowed'
          } ${!isProcessing ? 'shadow-md' : ''}`}
          style={{
            textShadow: canConvert ? '0 1px 2px rgba(0, 0, 0, 0.1)' : undefined,
            boxShadow: canConvert 
              ? '0 4px 12px rgba(249, 115, 22, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.3)' 
              : undefined
          }}
        >
          {getButtonIcon()}
          {typeof getButtonText() === 'string' ? (
            <ResponsiveText maxLength={25} mobileMaxLength={15} showTooltip={false}>
              {getButtonText()}
            </ResponsiveText>
          ) : (
            <ButtonText
              fullText={getButtonText().full}
              shortText={getButtonText().short}
              mobileText={getButtonText().mobile}
            />
          )}
        </Button>
        
        {/* Progress bar during conversion */}
        {isProcessing && (
          <div className="w-full max-w-sm">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>{progressMessage || 'Converting...'}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200/50 rounded-full h-2 backdrop-blur-sm">
              <div 
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Performance indicator */}
            <div className="text-xs text-gray-500 mt-1 text-center">
              Using Web Workers for optimal performance
            </div>
          </div>
        )}
        
        {/* Status message */}
        {(!canConvert && !isProcessing) && (
          <p className="text-xs text-gray-500 text-center max-w-sm leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
            {!isReady
              ? 'Initializing processing engine...'
              : !hasFile 
              ? 'Upload an image above to enable conversion'
              : !isAuthenticated 
              ? 'Sign in to convert your images to different formats'
              : !selectedFormat
              ? 'Select a format above to continue'
              : 'Ready to convert'
            }
          </p>
        )}
        
        {/* Conversion status message */}
        {isProcessing && (
          <div className="text-center space-y-2">
            <p className="text-xs text-blue-600 max-w-sm leading-relaxed animate-pulse" style={{ fontFamily: 'Inter, sans-serif' }}>
              {progressMessage || 'Processing your image... This may take a few moments.'}
            </p>
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Web Worker</span>
              </div>
              <div className="flex items-center space-x-1">
                <Zap className="w-3 h-3" />
                <span>Auto Download</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Format info */}
      {selectedFormat && (
        <Card variant="glassCream" className="animate-in fade-in duration-300">
          <CardContent className="p-5">
            <div className="flex items-start space-x-4">
              <div className="text-3xl flex-shrink-0">{selectedFormat.icon}</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 text-lg mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {selectedFormat.name} Format Selected
                </h4>
                <p className="text-sm text-gray-700 font-semibold mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {selectedFormat.description}
                </p>
                {selectedFormat.details && (
                  <p className="text-xs text-gray-600 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {selectedFormat.details}
                  </p>
                )}
              </div>
              {canConvert && (
                <div className="text-green-600 flex-shrink-0">
                  <CheckCircle className="w-6 h-6" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Success Message */}
      {result && !isProcessing && (
        <Card variant="glassPrimary" className="animate-in fade-in duration-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Conversion Complete!
                </h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>✅ Converted to {selectedFormat?.name} format</p>
                  <p>📁 Downloaded automatically</p>
                  <p>📊 Size: {result.size ? formatFileSize(result.size) : 'Unknown'} {result.compressionRatio && !isNaN(result.compressionRatio) && result.compressionRatio > 0 ? `(${((1 - result.compressionRatio) * 100).toFixed(0)}% ${result.compressionRatio < 1 ? 'smaller' : 'larger'})` : '(processed)'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card variant="glassSecondary" className="animate-in fade-in duration-300 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Info className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-red-900 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Conversion Failed
                </h4>
                <p className="text-sm text-red-700 mb-2">{error.message || 'An unexpected error occurred.'}</p>
                {/* Format-specific help */}
                {error.message && error.message.includes('does not support') && selectedFormat && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded border">
                    <p className="font-semibold mb-1">💡 Suggested alternatives:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedFormat.id === 'avif' && (
                        <>
                          <li>Try <strong>WebP</strong> for modern compression with wide browser support</li>
                          <li>Use <strong>JPEG</strong> for photos with smaller file sizes</li>
                          <li>Consider <strong>PNG</strong> if you need transparency</li>
                        </>
                      )}
                      {selectedFormat.id === 'webp' && (
                        <>
                          <li>Try <strong>JPEG</strong> for photos</li>
                          <li>Use <strong>PNG</strong> for graphics with transparency</li>
                        </>
                      )}
                      {selectedFormat.id === 'bmp' && (
                        <>
                          <li>Try <strong>PNG</strong> for lossless quality</li>
                          <li>Use <strong>JPEG</strong> for smaller file sizes</li>
                        </>
                      )}
                      {!['avif', 'webp', 'bmp'].includes(selectedFormat.id) && (
                        <>
                          <li>Try <strong>JPEG</strong> for photos</li>
                          <li>Try <strong>PNG</strong> for graphics</li>
                        </>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Celebration Animation */}
      <CelebrationAnimation
        isActive={showCelebration}
        duration={4000}
        intensity="medium"
        onComplete={() => setShowCelebration(false)}
        ariaLabel={`Image converted to ${selectedFormat?.name || 'selected format'} successfully!`}
      />
    </div>
  );
};

export default FormatSelector;