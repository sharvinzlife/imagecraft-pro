import React, { useState, useEffect } from 'react';
import { Upload, Image, LayoutGrid, Sparkles, Menu, X, Eye, Sliders, Crop, Palette, Wand2 } from 'lucide-react';

// Reusable Animated Background Component
const AnimatedBackground = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden">
    {/* Main Gradient Background */}
    <div 
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(135deg, #f97316 0%, #fb923c 50%, #ffffff 100%)'
      }}
    />
    
    {/* Animated Dot Pattern */}
    <div 
      className="absolute inset-0"
      style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.6) 1px, transparent 0)',
        backgroundSize: '30px 30px',
        animation: 'pulse 3s ease-in-out infinite'
      }}
    />
    
    {/* Floating Orbs */}
    <div 
      className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-40"
      style={{
        background: 'radial-gradient(circle, rgba(249, 115, 22, 0.6) 0%, rgba(255, 255, 255, 0.2) 70%, transparent 100%)',
        filter: 'blur(60px)',
        animation: 'float1 8s ease-in-out infinite'
      }}
    />
    <div 
      className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full opacity-30"
      style={{
        background: 'radial-gradient(circle, rgba(251, 146, 60, 0.7) 0%, rgba(255, 255, 255, 0.3) 70%, transparent 100%)',
        filter: 'blur(50px)',
        animation: 'float2 10s ease-in-out infinite reverse'
      }}
    />
    <div 
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full opacity-25"
      style={{
        background: 'radial-gradient(circle, rgba(255, 237, 213, 0.8) 0%, rgba(249, 115, 22, 0.4) 70%, transparent 100%)',
        filter: 'blur(40px)',
        animation: 'float3 12s ease-in-out infinite'
      }}
    />
    
    {/* Moving Gradient Wave */}
    <div 
      className="absolute inset-0 opacity-20"
      style={{
        background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.6) 50%, transparent 100%)',
        animation: 'wave 20s linear infinite'
      }}
    />
    
    {/* CSS Animations */}
    <style>{`
      @keyframes pulse {
        0%, 100% { opacity: 0.4; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.05); }
      }
      
      @keyframes float1 {
        0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
        25% { transform: translateY(-30px) translateX(20px) rotate(2deg); }
        50% { transform: translateY(-10px) translateX(-15px) rotate(-1deg); }
        75% { transform: translateY(20px) translateX(10px) rotate(1deg); }
      }
      
      @keyframes float2 {
        0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
        33% { transform: translateY(25px) translateX(-20px) rotate(-2deg); }
        66% { transform: translateY(-15px) translateX(25px) rotate(1.5deg); }
      }
      
      @keyframes float3 {
        0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
        25% { transform: translate(-55%, -45%) rotate(1deg); }
        50% { transform: translate(-45%, -55%) rotate(-1deg); }
        75% { transform: translate(-50%, -50%) rotate(0.5deg); }
      }
      
      @keyframes wave {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `}</style>
  </div>
);

// Reusable Glass Card Component
const GlassCard = ({ 
  children, 
  className = '', 
  hoverScale = 1.02, 
  blurIntensity = 15,
  backgroundOpacity = 0.2,
  borderOpacity = 0.3,
  ...props 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className={`relative group transform transition-all duration-500 ${className}`}
      style={{ transform: `scale(${isHovered ? hoverScale : 1})` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      <div 
        className="absolute inset-0 rounded-2xl transition-all duration-500"
        style={{
          background: `linear-gradient(135deg, rgba(249, 115, 22, ${backgroundOpacity + 0.1}), rgba(255, 255, 255, ${backgroundOpacity + 0.2}))`,
          filter: `blur(${isHovered ? blurIntensity + 5 : blurIntensity}px)`,
          opacity: isHovered ? 0.8 : 0.6
        }}
      />
      <div 
        className="relative backdrop-blur-md border-2 rounded-2xl transition-all duration-500"
        style={{
          background: `rgba(255, 255, 255, ${isHovered ? backgroundOpacity + 0.15 : backgroundOpacity})`,
          borderColor: `rgba(249, 115, 22, ${isHovered ? borderOpacity + 0.3 : borderOpacity})`,
          boxShadow: isHovered 
            ? '0 25px 50px rgba(249, 115, 22, 0.25)' 
            : '0 10px 30px rgba(0, 0, 0, 0.1)'
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Reusable Upload Zone Component
const UploadZone = ({ title, subtitle, onFileUpload, className = '' }) => (
  <GlassCard className={className} hoverScale={1.02}>
    <div className="p-8">
      <div className="flex flex-col items-center text-center space-y-6">
        <div 
          className="p-5 rounded-full shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-110"
          style={{
            background: 'linear-gradient(135deg, #f97316, #fb923c)'
          }}
        >
          <Upload className="w-8 h-8 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {title}
          </h3>
          <p className="text-gray-600 text-base" style={{ fontFamily: 'Inter, sans-serif' }}>
            {subtitle}
          </p>
        </div>
        <div 
          className="w-full max-w-xs h-36 border-2 border-dashed rounded-xl flex items-center justify-center transition-all duration-300 group-hover:border-orange-400 group-hover:bg-white/20 cursor-pointer"
          style={{
            borderColor: 'rgba(249, 115, 22, 0.4)',
            background: 'rgba(255, 255, 255, 0.1)'
          }}
          onClick={onFileUpload}
        >
          <span className="text-gray-600 text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
            Drop your image here
          </span>
        </div>
      </div>
    </div>
  </GlassCard>
);

// Reusable Feature Card Component
const FeatureCard = ({ icon: Icon, title, description, children, className = '' }) => (
  <GlassCard className={className} hoverScale={1.02} backgroundOpacity={0.15}>
    <div className="p-6">
      <div className="flex items-center space-x-4 mb-6">
        <div 
          className="p-3 rounded-lg shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-110"
          style={{
            background: 'linear-gradient(135deg, #f97316, #fb923c)'
          }}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {title}
          </h3>
          <p className="text-gray-600 text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
            {description}
          </p>
        </div>
      </div>
      {children}
    </div>
  </GlassCard>
);

// Reusable Button Component
const GlassButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  className = '',
  ...props 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const variants = {
    primary: {
      background: isHovered 
        ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.4), rgba(251, 146, 60, 0.35))'
        : 'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(251, 146, 60, 0.2))',
      borderColor: isHovered ? 'rgba(249, 115, 22, 0.6)' : 'rgba(249, 115, 22, 0.3)'
    },
    secondary: {
      background: isHovered 
        ? 'rgba(255, 255, 255, 0.35)'
        : 'rgba(255, 255, 255, 0.25)',
      borderColor: isHovered ? 'rgba(249, 115, 22, 0.4)' : 'rgba(249, 115, 22, 0.25)'
    }
  };
  
  const sizes = {
    sm: 'py-2 px-3 text-sm',
    md: 'py-3 px-4 text-sm',
    lg: 'py-4 px-6 text-base'
  };
  
  return (
    <button
      className={`backdrop-blur-md border rounded-lg font-semibold transition-all duration-300 hover:scale-105 ${sizes[size]} ${className}`}
      style={{
        ...variants[variant],
        color: '#374151',
        fontFamily: 'Inter, sans-serif',
        boxShadow: isHovered 
          ? '0 10px 30px rgba(249, 115, 22, 0.25)' 
          : '0 4px 15px rgba(0, 0, 0, 0.1)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

// Reusable Navigation Component
const Navigation = ({ sections, activeSection, onSectionChange, isMobile = false }) => (
  <nav className={isMobile ? "grid grid-cols-2 gap-3" : "hidden md:flex space-x-2"}>
    {sections.map((section) => (
      <GlassButton
        key={section.id}
        variant={activeSection === section.id ? 'primary' : 'secondary'}
        size={isMobile ? 'md' : 'sm'}
        onClick={() => onSectionChange(section.id)}
        className={activeSection === section.id ? 'text-white' : ''}
        style={activeSection === section.id ? {
          background: 'linear-gradient(135deg, #f97316, #fb923c)',
          color: 'white',
          boxShadow: '0 10px 25px rgba(249, 115, 22, 0.3)'
        } : {}}
      >
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} items-center space-${isMobile ? 'y' : 'x'}-2`}>
          <section.icon className={`w-${isMobile ? '5' : '4'} h-${isMobile ? '5' : '4'}`} />
          <span>{section.name}</span>
        </div>
      </GlassButton>
    ))}
  </nav>
);

// Main App Component
const ImageProcessingApp = () => {
  const [activeSection, setActiveSection] = useState('converter');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    { id: 'converter', name: 'Converter', icon: Image, description: 'Convert to any format' },
    { id: 'editor', name: 'Editor', icon: Sliders, description: 'Edit & enhance' },
    { id: 'collage', name: 'Collage', icon: LayoutGrid, description: 'Create collages' },
    { id: 'ai', name: 'AI Magic', icon: Sparkles, description: 'AI-powered tools' }
  ];

  const formatOptions = ['JPEG', 'PNG', 'AVIF', 'HEIC', 'TIFF', 'GIF', 'BMP', 'SVG'];
  
  const editingTools = [
    { name: 'Contrast', icon: Eye },
    { name: 'White Balance', icon: Palette },
    { name: 'Exposure', icon: Sparkles },
    { name: 'Vibrance', icon: Wand2 },
    { name: 'Saturation', icon: Palette },
    { name: 'Crop', icon: Crop }
  ];

  const aiStyles = ['Restore', 'Cartoon', 'Anime', 'Ghibli', 'Pixar', '3D Render', 'Oil Painting', 'Watercolor'];

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'converter':
        return (
          <div className="space-y-8">
            <UploadZone 
              title="Image Converter" 
              subtitle="Convert your images to any format instantly"
              onFileUpload={() => console.log('File upload clicked')}
            />
            <FeatureCard 
              icon={Image} 
              title="Output Formats" 
              description="Choose your desired format"
            >
              <div className="grid grid-cols-4 gap-3 mt-6">
                {formatOptions.map((format) => (
                  <GlassButton
                    key={format}
                    variant="secondary"
                    size="sm"
                    onClick={() => console.log(`Selected format: ${format}`)}
                  >
                    {format}
                  </GlassButton>
                ))}
              </div>
            </FeatureCard>
          </div>
        );
      
      case 'editor':
        return (
          <div className="space-y-8">
            <UploadZone 
              title="Image Editor" 
              subtitle="Edit and enhance your images with professional tools"
              onFileUpload={() => console.log('File upload clicked')}
            />
            <FeatureCard 
              icon={Sliders} 
              title="Editing Tools" 
              description="Professional image editing capabilities"
            >
              <div className="grid grid-cols-2 gap-4 mt-6">
                {editingTools.map((tool) => (
                  <div
                    key={tool.name}
                    className="flex items-center space-x-3 backdrop-blur-md border rounded-lg p-4 transition-all duration-300 cursor-pointer hover:scale-105"
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      borderColor: 'rgba(249, 115, 22, 0.25)',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <tool.icon className="w-5 h-5 text-orange-600" />
                    <span 
                      className="text-gray-700 text-sm font-medium"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      {tool.name}
                    </span>
                  </div>
                ))}
              </div>
            </FeatureCard>
            <FeatureCard 
              icon={Crop} 
              title="Smart Cropping" 
              description="Crop for social media and custom sizes"
            >
              <div className="flex flex-wrap gap-3 mt-6">
                {['Instagram', 'Facebook', 'Twitter', 'LinkedIn', 'Custom'].map((platform) => (
                  <GlassButton
                    key={platform}
                    variant="primary"
                    size="md"
                    onClick={() => console.log(`Selected platform: ${platform}`)}
                  >
                    {platform}
                  </GlassButton>
                ))}
              </div>
            </FeatureCard>
          </div>
        );
      
      case 'collage':
        return (
          <div className="space-y-8">
            <UploadZone 
              title="Collage Maker" 
              subtitle="Create stunning collages with multiple layouts"
              onFileUpload={() => console.log('File upload clicked')}
            />
            <FeatureCard 
              icon={LayoutGrid} 
              title="Collage Templates" 
              description="Choose from beautiful pre-designed layouts"
            >
              <div className="grid grid-cols-3 gap-4 mt-6">
                {[1, 2, 3, 4, 5, 6].map((template) => (
                  <div
                    key={template}
                    className="aspect-square backdrop-blur-md border rounded-lg flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.25), rgba(255, 255, 255, 0.35))',
                      borderColor: 'rgba(249, 115, 22, 0.3)',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <LayoutGrid className="w-8 h-8 text-orange-600" />
                  </div>
                ))}
              </div>
            </FeatureCard>
          </div>
        );
      
      case 'ai':
        return (
          <div className="space-y-8">
            <UploadZone 
              title="AI Image Magic" 
              subtitle="Transform your images with AI-powered effects"
              onFileUpload={() => console.log('File upload clicked')}
            />
            <FeatureCard 
              icon={Sparkles} 
              title="AI Styles" 
              description="Transform with AI-powered effects"
            >
              <div className="grid grid-cols-2 gap-4 mt-6">
                {aiStyles.map((style) => (
                  <GlassButton
                    key={style}
                    variant="primary"
                    size="md"
                    onClick={() => console.log(`Selected AI style: ${style}`)}
                  >
                    {style}
                  </GlassButton>
                ))}
              </div>
            </FeatureCard>
            <FeatureCard 
              icon={Wand2} 
              title="AI Enhancement" 
              description="Restore and enhance image quality"
            >
              <div className="space-y-4 mt-6">
                <GlassButton
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={() => console.log('Upscale & Enhance clicked')}
                >
                  Upscale & Enhance
                </GlassButton>
                <GlassButton
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={() => console.log('Remove Background clicked')}
                >
                  Remove Background
                </GlassButton>
              </div>
            </FeatureCard>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="relative z-10">
        <GlassCard className="rounded-none border-x-0 border-t-0" backgroundOpacity={0.25}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 group cursor-pointer">
                <div 
                  className="p-3 rounded-lg shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-110"
                  style={{
                    background: 'linear-gradient(135deg, #f97316, #fb923c)'
                  }}
                >
                  <Image className="w-6 h-6 text-white" />
                </div>
                <h1 
                  className="text-2xl font-bold text-gray-800 transition-all duration-300 group-hover:text-orange-600"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  ImageCraft Pro
                </h1>
              </div>
              
              <Navigation 
                sections={sections}
                activeSection={activeSection}
                onSectionChange={setActiveSection}
              />

              {/* Mobile Menu Button */}
              <GlassButton
                variant="secondary"
                size="sm"
                className="md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </GlassButton>
            </div>

            {/* Mobile Navigation */}
            {isMenuOpen && (
              <div className="md:hidden mt-4">
                <Navigation 
                  sections={sections}
                  activeSection={activeSection}
                  onSectionChange={(section) => {
                    setActiveSection(section);
                    setIsMenuOpen(false);
                  }}
                  isMobile
                />
              </div>
            )}
          </div>
        </GlassCard>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-10 text-center">
          <h2 
            className="text-4xl md:text-5xl font-bold text-gray-800 mb-4"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {sections.find(s => s.id === activeSection)?.name}
          </h2>
          <p 
            className="text-gray-700 text-xl font-medium"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {sections.find(s => s.id === activeSection)?.description}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {renderSectionContent()}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-16">
        <GlassCard className="rounded-none border-x-0 border-b-0" backgroundOpacity={0.2}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <p 
                className="text-gray-600 text-sm font-medium"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                © 2024 ImageCraft Pro. All rights reserved.
              </p>
              <div className="flex items-center space-x-6 mt-4 md:mt-0">
                {['Privacy', 'Terms', 'Support'].map((item) => (
                  <button 
                    key={item}
                    className="text-gray-600 text-sm font-medium transition-all duration-300 hover:text-orange-600 hover:scale-105"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>
      </footer>
    </div>
  );
};

export default ImageProcessingApp;