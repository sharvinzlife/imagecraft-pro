import React from 'react';

const AnimatedBackground = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden">
    {/* Enhanced Orange to White Gradient Background */}
    <div 
      className="absolute inset-0"
      style={{
        background: `
          linear-gradient(135deg, 
            #f97316 0%,     /* Orange-500 */
            #fb923c 20%,    /* Orange-400 */
            #fdba74 40%,    /* Orange-300 */
            #fed7aa 60%,    /* Orange-200 */
            #fff7ed 80%,    /* Orange-50 */
            #ffffff 100%    /* Pure white */
          )
        `
      }}
    />
    
    {/* Layered gradient for depth */}
    <div 
      className="absolute inset-0"
      style={{
        background: `
          radial-gradient(ellipse at top left, rgba(249, 115, 22, 0.4) 0%, transparent 50%),
          radial-gradient(ellipse at bottom right, rgba(251, 146, 60, 0.3) 0%, transparent 50%),
          radial-gradient(ellipse at center, rgba(255, 255, 255, 0.2) 0%, transparent 70%)
        `
      }}
    />
    
    {/* Enhanced Dot Pattern with improved visibility */}
    <div 
      className="absolute inset-0 animate-gentle-breathe"
      style={{
        backgroundImage: `
          radial-gradient(circle at 2px 2px, rgba(255,255,255,0.7) 2px, transparent 0),
          radial-gradient(circle at 20px 20px, rgba(249,115,22,0.3) 1.5px, transparent 0),
          radial-gradient(circle at 10px 10px, rgba(251,146,60,0.2) 1px, transparent 0)
        `,
        backgroundSize: '40px 40px, 80px 80px, 60px 60px',
        backgroundPosition: '0 0, 40px 40px, 20px 20px'
      }}
    />
    
    {/* Main Floating Orbs with Enhanced Gradients */}
    <div 
      className="absolute top-1/5 left-1/5 w-96 h-96 rounded-full opacity-25 animate-gentle-float"
      style={{
        background: `
          radial-gradient(circle, 
            rgba(249, 115, 22, 0.4) 0%, 
            rgba(251, 146, 60, 0.3) 30%,
            rgba(253, 186, 116, 0.2) 60%,
            rgba(255, 255, 255, 0.1) 80%,
            transparent 100%
          )
        `,
        filter: 'blur(100px)',
        transform: 'translate3d(0, 0, 0)',
      }}
    />
    
    <div 
      className="absolute bottom-1/4 right-1/5 w-80 h-80 rounded-full opacity-20 animate-gentle-float-reverse"
      style={{
        background: `
          radial-gradient(circle, 
            rgba(251, 146, 60, 0.5) 0%, 
            rgba(253, 186, 116, 0.3) 40%,
            rgba(254, 215, 170, 0.2) 70%,
            transparent 100%
          )
        `,
        filter: 'blur(90px)',
        transform: 'translate3d(0, 0, 0)',
      }}
    />
    
    <div 
      className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full opacity-15 animate-gentle-breathe-slow"
      style={{
        background: `
          radial-gradient(circle, 
            rgba(255, 247, 237, 0.8) 0%, 
            rgba(254, 215, 170, 0.4) 50%,
            rgba(249, 115, 22, 0.2) 80%,
            transparent 100%
          )
        `,
        filter: 'blur(80px)',
        transform: 'translate3d(-50%, -50%, 0)',
      }}
    />
    
    {/* Additional smaller orbs for more depth */}
    <div 
      className="absolute top-3/4 left-1/3 w-48 h-48 rounded-full opacity-18 animate-gentle-float"
      style={{
        background: `
          radial-gradient(circle, 
            rgba(251, 146, 60, 0.3) 0%, 
            rgba(255, 255, 255, 0.1) 70%,
            transparent 100%
          )
        `,
        filter: 'blur(60px)',
        transform: 'translate3d(0, 0, 0)',
        animationDelay: '3s',
        animationDuration: '35s'
      }}
    />
    
    <div 
      className="absolute top-1/6 right-1/4 w-56 h-56 rounded-full opacity-12 animate-gentle-float-reverse"
      style={{
        background: `
          radial-gradient(circle, 
            rgba(253, 186, 116, 0.4) 0%, 
            rgba(255, 247, 237, 0.2) 60%,
            transparent 100%
          )
        `,
        filter: 'blur(70px)',
        transform: 'translate3d(0, 0, 0)',
        animationDelay: '5s',
        animationDuration: '40s'
      }}
    />
    
    {/* Enhanced Light Rays */}
    <div 
      className="absolute top-0 left-1/4 w-px h-full opacity-12 animate-gentle-shimmer"
      style={{
        background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.6) 20%, rgba(249,115,22,0.2) 50%, rgba(255,255,255,0.4) 80%, transparent 100%)'
      }}
    />
    <div 
      className="absolute top-0 right-1/3 w-px h-full opacity-10 animate-gentle-shimmer"
      style={{ 
        background: 'linear-gradient(to bottom, transparent 0%, rgba(251,146,60,0.3) 30%, rgba(255,255,255,0.5) 70%, transparent 100%)',
        animationDelay: '2s' 
      }}
    />
    <div 
      className="absolute top-0 left-2/3 w-px h-full opacity-8 animate-gentle-shimmer"
      style={{ 
        background: 'linear-gradient(to bottom, transparent 0%, rgba(253,186,116,0.4) 40%, rgba(255,247,237,0.6) 60%, transparent 100%)',
        animationDelay: '4s' 
      }}
    />
    
    {/* Ambient Glow Effects */}
    <div 
      className="absolute inset-0 opacity-8 animate-ambient-glow"
      style={{
        background: `
          radial-gradient(ellipse at 20% 30%, rgba(249, 115, 22, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 70%, rgba(251, 146, 60, 0.12) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 90%, rgba(253, 186, 116, 0.1) 0%, transparent 40%)
        `
      }}
    />
    
    {/* Subtle mesh overlay for texture */}
    <div 
      className="absolute inset-0 opacity-5"
      style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
        `,
        backgroundSize: '100px 100px'
      }}
    />
  </div>
);

export default AnimatedBackground;

// Add the new animation styles if they don't exist in CSS
const animationStyles = `
@keyframes gentle-breathe {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.02); }
}

@keyframes gentle-float {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
  33% { transform: translate3d(20px, -30px, 0) rotate(1deg); }
  66% { transform: translate3d(-15px, 20px, 0) rotate(-0.5deg); }
}

@keyframes gentle-float-reverse {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
  33% { transform: translate3d(-25px, 20px, 0) rotate(-1deg); }
  66% { transform: translate3d(20px, -15px, 0) rotate(0.5deg); }
}

@keyframes gentle-breathe-slow {
  0%, 100% { opacity: 0.12; transform: translate3d(-50%, -50%, 0) scale(1); }
  50% { opacity: 0.18; transform: translate3d(-50%, -50%, 0) scale(1.05); }
}

@keyframes gentle-shimmer {
  0%, 100% { opacity: 0.1; }
  50% { opacity: 0.2; }
}

@keyframes ambient-glow {
  0%, 100% { opacity: 0.05; }
  50% { opacity: 0.08; }
}

.animate-gentle-breathe { animation: gentle-breathe 8s ease-in-out infinite; }
.animate-gentle-float { animation: gentle-float 25s ease-in-out infinite; }
.animate-gentle-float-reverse { animation: gentle-float-reverse 30s ease-in-out infinite; }
.animate-gentle-breathe-slow { animation: gentle-breathe-slow 12s ease-in-out infinite; }
.animate-gentle-shimmer { animation: gentle-shimmer 6s ease-in-out infinite; }
.animate-ambient-glow { animation: ambient-glow 15s ease-in-out infinite; }

/* Respect reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  .animate-gentle-breathe,
  .animate-gentle-float,
  .animate-gentle-float-reverse,
  .animate-gentle-breathe-slow,
  .animate-gentle-shimmer,
  .animate-ambient-glow {
    animation: none !important;
  }
}
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('animated-background-styles')) {
  const style = document.createElement('style');
  style.id = 'animated-background-styles';
  style.textContent = animationStyles;
  document.head.appendChild(style);
}