import React from 'react';
import { Card, CardHeader, CardContent } from './ui/card';

const FeatureCard = ({ icon: Icon, title, description, children, className = '', onClick, variant = 'glassCream', floating = false, compact = false }) => (
  <Card 
    variant={floating ? 'glassCream' : variant}
    floatingElements={floating}
    className={`group transition-all duration-500 ease-out transform-gpu ${
      onClick 
        ? 'cursor-pointer hover:shadow-2xl hover:scale-[1.03] hover:-translate-y-2 hover:rotate-1 active:scale-100 active:translate-y-0 active:rotate-0' 
        : 'hover:shadow-xl hover:scale-[1.01] hover:-translate-y-1'
    } ${className}`}
    onClick={onClick}
  >
    <CardHeader className="relative overflow-hidden">
      {/* Enhanced shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
      
      <div className={`relative flex ${compact ? 'flex-col space-y-3' : 'items-center space-x-4'}`}>
        {Icon && (
          <div className={`relative ${compact ? 'self-center' : ''}`}>
            {/* Floating decoration rings */}
            <div className="absolute -inset-2 rounded-xl border border-orange-200/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
            <div className="absolute -inset-3 rounded-xl border border-orange-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-float2" />
            
            <div 
              className={`relative ${compact ? 'p-2.5' : 'p-3.5'} rounded-xl shadow-lg transition-all duration-700 ease-out transform group-hover:shadow-2xl group-hover:scale-125 group-hover:rotate-6 group-hover:-translate-y-1 overflow-hidden`}
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #fb923c 50%, #ea580c 100%)',
                boxShadow: '0 4px 20px rgba(249, 115, 22, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
              }}
            >
              {/* Glass highlight */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-xl pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
              
              <Icon className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} text-white transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12 relative z-10`} />
            </div>
          </div>
        )}
        <div className={`flex-1 transition-transform duration-300 group-hover:translate-x-1 ${compact ? 'text-center' : ''}`}>
          <h3 
            className={`${compact ? 'text-sm sm:text-base' : 'text-lg sm:text-xl'} font-bold text-slate-900 ${description ? 'mb-2' : 'mb-0'} transition-all duration-300 group-hover:text-orange-700 group-hover:scale-105 ${compact ? 'line-clamp-1' : ''}` }
            style={{ 
              fontFamily: 'Poppins, sans-serif',
              textShadow: '0 2px 4px rgba(255, 255, 255, 0.9), 0 1px 2px rgba(255, 255, 255, 0.7)',
              color: '#0f172a' // Ensure maximum contrast
            }}
          >
            {title}
          </h3>
          {description && (
            <p 
              className={`text-slate-800 ${compact ? 'text-xs' : 'text-sm'} font-semibold transition-colors duration-300 group-hover:text-slate-900 ${compact ? 'line-clamp-2' : 'line-clamp-3'}`}
              style={{ 
                fontFamily: 'Inter, sans-serif',
                textShadow: '0 2px 4px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(255, 255, 255, 0.6)',
                color: '#1e293b' // Better contrast for description
              }}
            >
              {description}
            </p>
          )}
        </div>
        
        {/* Interactive indicator */}
        {onClick && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
          </div>
        )}
      </div>
    </CardHeader>
    {children && (
      <CardContent className="relative transition-all duration-300 group-hover:px-8">
        {children}
      </CardContent>
    )}
  </Card>
);

export default FeatureCard;