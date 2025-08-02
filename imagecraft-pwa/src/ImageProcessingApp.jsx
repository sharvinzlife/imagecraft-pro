/**
 * Image Processing App Content
 * Main application content (header-less for use with routing)
 */

import React, { useState, useEffect } from 'react';
import { 
  Image, 
  LayoutGrid, 
  Sparkles, 
  Eye, 
  Sliders, 
  Crop, 
  Palette, 
  Wand2,
  Brush,
  Star,
  Zap,
  Paintbrush,
  Archive,
  FileImage,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import SimpleNavigation from './components/SimpleNavigation';
import UploadZone from './components/UploadZone';
import BatchUploadZone from './components/BatchUploadZone';
import FeatureCard from './components/FeatureCard';
import FormatSelector from './components/FormatSelector';
import CollageTemplateGrid from './components/CollageTemplateGrid';
import CollageEditor from './components/CollageEditor';
// Removed server-dependent status indicators
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { useNotifications } from './store/appStore';
import { useImageProcessing } from './hooks/useOptimizedImageProcessing';
import CelebrationAnimation, { useCelebration } from './components/common/CelebrationAnimation.tsx';

const ImageProcessingApp = () => {
  const [activeSection, setActiveSection] = useState('converter');
  const [batchMode, setBatchMode] = useState(false);
  
  // File upload state
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileId, setFileId] = useState(null);
  
  // Conversion state
  const [isConverting, setIsConverting] = useState(false); // eslint-disable-line no-unused-vars
  const [currentConversionJob, setCurrentConversionJob] = useState(null);
  
  // Collage state
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isEditingCollage, setIsEditingCollage] = useState(false);

  // Hooks
  const { isSignedIn } = useAuth();
  const { addNotification, conversionComplete } = useNotifications();
  const imageProcessing = useImageProcessing();
  const { isActive: celebrationActive, trigger: triggerCelebration } = useCelebration();

  // Monitor conversion completion
  useEffect(() => {
    if (imageProcessing.isComplete && currentConversionJob) {
      setIsConverting(false);
      
      // Trigger celebration animation
      triggerCelebration();
      
      // Show completion notification via store
      conversionComplete(uploadedFile?.name, imageProcessing.result?.downloadUrl, {
        outputFormat: 'converted format',
        processingTime: 'a few seconds',
        onDownload: () => {
          console.log('Download initiated from celebration toast');
        },
      });
      
      // Reset after a delay to allow celebration animation
      setTimeout(() => {
        setCurrentConversionJob(null);
      }, 6000);
    }

    // Handle processing error
    if (imageProcessing.hasError && currentConversionJob) {
      setIsConverting(false);
      setCurrentConversionJob(null);
      
      addNotification({
        type: 'error',
        title: 'Conversion Failed',
        message: imageProcessing.error?.message || 'An error occurred during conversion.',
        duration: 8000,
      });
    }
  }, [imageProcessing.isComplete, imageProcessing.hasError, imageProcessing.result, imageProcessing.error, currentConversionJob, addNotification, conversionComplete, triggerCelebration, uploadedFile?.name]);

  // Collage handlers
  const handleTemplateSelect = (template) => {
    if (!isSignedIn) {
      addNotification({
        type: 'info',
        title: 'Login Required',
        message: 'Please log in to create collages.',
      });
      return;
    }

    setSelectedTemplate(template);
    setIsEditingCollage(true);
  };

  const handleBackToTemplates = () => {
    setIsEditingCollage(false);
    setSelectedTemplate(null);
  };

  const handleExportCollage = async (collageData) => {
    try {
      // TODO: Implement collage creation with the new image processing service
      addNotification({
        type: 'info',
        title: 'Collage Feature Coming Soon',
        message: 'Collage creation is being updated to work with the new processing system.',
      });

      setIsEditingCollage(false);
      setSelectedTemplate(null);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Collage Creation Failed',
        message: error.message || 'Failed to create collage. Please try again.',
      });
    }
  };

  // Load Google Fonts
  useEffect(() => {
    const fonts = [
      'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
      'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap'
    ];
    
    fonts.forEach(href => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.href = href;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
    });
  }, []);

  const sections = [
    { id: 'converter', name: 'Image Converter', icon: Image, description: 'Convert images to any format (JPEG, PNG, WebP, AVIF)', shortName: 'Convert', supportsBatch: true },
    { id: 'editor', name: 'Photo Editor', icon: Sliders, description: 'Edit, enhance, and adjust your photos', shortName: 'Edit', supportsBatch: true },
    { id: 'collage', name: 'Collage Maker', icon: LayoutGrid, description: 'Create beautiful photo collages', shortName: 'Collage', supportsBatch: false },
    { id: 'ai', name: 'AI Magic Tools', icon: Sparkles, description: 'AI-powered photo transformations', shortName: 'AI Magic', supportsBatch: true }
  ];
  
  const editingTools = [
    { name: 'Adjust Contrast', icon: Eye, description: 'Make bright areas brighter and dark areas darker' },
    { name: 'Fix White Balance', icon: Palette, description: 'Correct color temperature and tints' },
    { name: 'Adjust Exposure', icon: Sparkles, description: 'Make your photo brighter or darker overall' },
    { name: 'Enhance Vibrance', icon: Wand2, description: 'Boost color intensity without oversaturation' },
    { name: 'Adjust Saturation', icon: Palette, description: 'Control the intensity of all colors' },
    { name: 'Crop & Resize', icon: Crop, description: 'Trim and resize your image' }
  ];

  const aiStyles = [
    { name: 'Photo Restoration', icon: Sparkles, description: 'Repair scratches, tears, and fading in old photos' },
    { name: 'Cartoon Style', icon: Star, description: 'Transform into colorful animated cartoon art' },
    { name: 'Anime Style', icon: Star, description: 'Convert to Japanese anime/manga illustration style' },
    { name: 'Studio Ghibli', icon: Brush, description: 'Beautiful hand-drawn Ghibli movie art style' },
    { name: 'Pixar Animation', icon: Zap, description: 'Create 3D animated movie character look' },
    { name: '3D Render', icon: Zap, description: 'Photorealistic 3D computer graphics style' },
    { name: 'Oil Painting', icon: Paintbrush, description: 'Classic fine art oil painting technique' },
    { name: 'Watercolor Art', icon: Brush, description: 'Soft, flowing watercolor painting effect' }
  ];

  const handleFileUpload = async (uploadResult, originalFile) => {
    // Reset any ongoing conversion state when new file is uploaded
    setIsConverting(false);
    setCurrentConversionJob(null);
    
    // Store the uploaded file info (allow file upload without sign-in)
    setUploadedFile(originalFile);
    setFileId(uploadResult?.fileId || 'current-file-id'); // Use actual file ID from upload result

    if (!isSignedIn) {
      addNotification({
        type: 'info',
        title: 'File Uploaded',
        message: `${originalFile.name} uploaded. Sign in to process images.`,
      });
    } else {
      addNotification({
        type: 'success',
        title: 'File Ready',
        message: `${originalFile.name} is ready for processing!`,
      });
    }

    // Auto-start processing based on current section
    if (activeSection === 'converter') {
      // File is ready for format conversion
    } else if (activeSection === 'editor') {
      // File is ready for editing
    } else if (activeSection === 'ai') {
      // File is ready for AI processing
    }
  };



  const handleToolSelect = async (tool, fileId) => {
    if (!fileId) {
      addNotification({
        type: 'warning',
        title: 'No File Selected',
        message: 'Please upload a file first.',
      });
      return;
    }

    try {
      // TODO: Implement filter/enhancement with the new image processing service
      addNotification({
        type: 'info',
        title: 'Enhancement Feature Coming Soon',
        message: `${tool.name} enhancement is being updated to work with the new processing system.`,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Enhancement Failed',
        message: error.message || 'Failed to start enhancement.',
      });
    }
  };

  const handleStyleSelect = async (style, fileId) => {
    if (!fileId) {
      addNotification({
        type: 'warning',
        title: 'No File Selected',
        message: 'Please upload a file first.',
      });
      return;
    }

    try {
      // TODO: Implement AI style processing with the new image processing service
      addNotification({
        type: 'info',
        title: 'AI Processing Feature Coming Soon',
        message: `${style} AI processing is being updated to work with the new processing system.`,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'AI Processing Failed',
        message: error.message || 'Failed to start AI processing.',
      });
    }
  };

  // Batch processing handlers
  const handleBatchComplete = (results) => {
    const { uploaded, processed, failed } = results;
    
    addNotification({
      type: 'success',
      title: 'Batch Processing Complete',
      message: `${uploaded} files uploaded, ${processed} processed successfully${failed > 0 ? `, ${failed} failed` : ''}.`,
      duration: 8000,
    });

    // Trigger celebration for batch completion
    if (processed > 0) {
      triggerCelebration();
    }
  };

  const handleFileProcessed = (result) => {
    // Individual file processing completion
    console.log('File processed:', result);
  };

  const renderSectionContent = () => {
    if (activeSection === 'collage') {
      if (isEditingCollage && selectedTemplate) {
        return (
          <CollageEditor
            template={selectedTemplate}
            onBack={handleBackToTemplates}
            onExport={handleExportCollage}
          />
        );
      }
      
      return (
        <CollageTemplateGrid onTemplateSelect={handleTemplateSelect} />
      );
    }

    return (
      <>
        {/* Upload Zone - Show for all sections except collage */}
        {batchMode && activeSection !== 'collage' ? (
          <BatchUploadZone
            onBatchComplete={handleBatchComplete}
            onFileProcessed={handleFileProcessed}
            processingType={activeSection === 'converter' ? 'convert' : activeSection === 'editor' ? 'edit' : activeSection === 'ai' ? 'ai-style' : null}
            maxFiles={20}
          />
        ) : (
          <UploadZone onFileUpload={handleFileUpload} />
        )}
        
        {/* Converter Section - Always show FormatSelector */}
        {activeSection === 'converter' && (
          <FormatSelector 
            uploadedFile={uploadedFile}
            disabled={!isSignedIn}
          />
        )}
        
        {/* Editor Section - Show editing tools */}
        {activeSection === 'editor' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {editingTools.map((tool) => (
              <FeatureCard
                key={tool.name}
                title={tool.name}
                description={tool.description}
                icon={tool.icon}
                onClick={() => handleToolSelect(tool, fileId)}
                variant="glassCream"
                floating={true}
              />
            ))}
          </div>
        )}
        
        {/* AI Section - Show AI styles */}
        {activeSection === 'ai' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiStyles.map((style) => (
              <FeatureCard
                key={style.name}
                title={style.name}
                description={style.description}
                icon={style.icon}
                onClick={() => handleStyleSelect(style.name, fileId)}
                variant="glassCream"
                floating={true}
              />
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen relative">{/* Background handled by App.tsx AnimatedBackground component */}

      {/* Skip to main content for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-orange-600 text-white px-4 py-2 rounded-lg z-50"
      >
        Skip to main content
      </a>
      
      {/* Navigation */}
      <SimpleNavigation />
      
      {/* Main Content */}
      <main id="main-content" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Section Tabs */}
        <div className="mb-8">
          <Card variant="glassCream" floatingElements className="p-3 shadow-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {sections.map((section) => (
                <Button
                  key={section.id}
                  variant={activeSection === section.id ? "glassPrimary" : "glassSecondary"}
                  size="lg"
                  onClick={() => setActiveSection(section.id)}
                  className="flex flex-col sm:flex-row lg:flex-col items-center space-y-2 sm:space-y-0 sm:space-x-3 lg:space-x-0 lg:space-y-2 h-auto py-4 px-4 sm:px-6 group transition-all duration-500 hover:scale-105 hover:-translate-y-1 text-left sm:text-left lg:text-center"
                >
                  <div className="relative flex-shrink-0">
                    <div className="absolute -inset-1 bg-gradient-to-r from-orange-200/30 to-pink-200/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                    <section.icon className="relative w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm sm:text-base font-bold transition-all duration-300 group-hover:scale-105 truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <span className="sm:hidden">{section.shortName}</span>
                      <span className="hidden sm:inline lg:hidden">{section.name}</span>
                      <span className="hidden lg:inline">{section.shortName}</span>
                    </div>
                    <div className="text-xs text-slate-800 font-medium transition-colors duration-300 group-hover:text-slate-900 line-clamp-2 sm:line-clamp-1 lg:line-clamp-2" style={{ fontFamily: 'Inter, sans-serif', textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)' }}>
                      {section.description}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </Card>
        </div>

        {/* Section Header */}
        <div className="mb-12 text-center relative">
          <div className="relative">
            <h2 
              className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 transition-all duration-300 hover:text-orange-600 hover:scale-105"
              style={{ 
                fontFamily: 'Poppins, sans-serif',
                textShadow: '0 2px 4px rgba(255, 255, 255, 0.8)'
              }}
            >
              {sections.find(s => s.id === activeSection)?.name}
            </h2>
            <p 
              className="text-slate-900 text-xl font-semibold max-w-2xl mx-auto transition-colors duration-300 hover:text-slate-900"
              style={{ 
                fontFamily: 'Inter, sans-serif',
                textShadow: '0 2px 4px rgba(255, 255, 255, 0.9), 0 1px 2px rgba(255, 255, 255, 0.8)',
                lineHeight: '1.4',
                padding: '0 16px'
              }}
            >
              {sections.find(s => s.id === activeSection)?.description}
            </p>
            
            {/* Batch Mode Toggle */}
            {sections.find(s => s.id === activeSection)?.supportBatch !== false && activeSection !== 'collage' && (
              <div className="mt-8 flex items-center justify-center">
                <Card variant="glassCream" className="p-3">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <FileImage className="w-4 h-4 text-slate-600" />
                      <span className="text-sm font-medium text-slate-700">Single File</span>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setBatchMode(!batchMode)}
                      className="p-1 hover:bg-orange-100/50"
                      aria-label={`Switch to ${batchMode ? 'single file' : 'batch'} mode`}
                    >
                      {batchMode ? (
                        <ToggleRight className="w-8 h-8 text-orange-600" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-slate-400" />
                      )}
                    </Button>
                    
                    <div className="flex items-center space-x-2">
                      <Archive className="w-4 h-4 text-slate-600" />
                      <span className="text-sm font-medium text-slate-700">Batch Mode</span>
                    </div>
                  </div>
                  
                  {batchMode && (
                    <div className="mt-2 text-xs text-slate-600 text-center">
                      Process multiple files at once with queue management
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Section Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          {renderSectionContent()}
        </div>

        {/* Status indicators removed - now using browser-only processing */}
      </main>
      
      {/* Celebration Animation */}
      <CelebrationAnimation 
        isActive={celebrationActive}
        onComplete={() => {}}
        duration={4000}
        intensity="medium"
      />
    </div>
  );
};

export default ImageProcessingApp;