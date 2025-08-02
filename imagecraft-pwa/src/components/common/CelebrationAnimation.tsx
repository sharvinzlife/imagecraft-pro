import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Types
interface Particle {
  id: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  velocityX: number;
  velocityY: number;
  rotationSpeed: number;
  life: number;
  decay: number;
}

interface Balloon {
  id: string;
  x: number;
  y: number;
  scale: number;
  color: string;
  velocityY: number;
  wobble: number;
  wobbleSpeed: number;
  life: number;
  decay: number;
}

interface Emoji {
  id: string;
  x: number;
  y: number;
  emoji: string;
  scale: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
  decay: number;
}

type AnimationPhase = 'idle' | 'active' | 'fadeOut' | 'complete';
export type IntensityLevel = 'low' | 'medium' | 'high';

interface IntensityConfig {
  confetti: number;
  balloons: number;
  emojis: number;
}

export interface CelebrationAnimationProps {
  /** Whether the animation is currently active */
  isActive?: boolean;
  /** Duration of the animation in milliseconds */
  duration?: number;
  /** Animation intensity level */
  intensity?: IntensityLevel;
  /** Callback fired when animation completes */
  onComplete?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether to respect reduced motion preferences */
  reducedMotion?: boolean;
  /** Accessible label for screen readers */
  ariaLabel?: string;
}

export interface CelebrationHookOptions {
  duration?: number;
  intensity?: IntensityLevel;
}

export interface CelebrationHookReturn {
  isActive: boolean;
  trigger: (options?: CelebrationHookOptions) => void;
  stop: () => void;
}

/**
 * CelebrationAnimation Component
 * 
 * A performant celebration animation component featuring:
 * - Physics-based confetti particles
 * - Floating balloons with realistic movement
 * - Animated emoji elements
 * - Full TypeScript support
 * - Responsive design with glass morphism integration
 * - Accessibility compliant (WCAG 2.1 AA)
 * - Optimized performance with proper cleanup
 */
const CelebrationAnimation: React.FC<CelebrationAnimationProps> = ({
  isActive = false,
  duration = 4000,
  intensity = 'medium',
  onComplete,
  className = '',
  reducedMotion = false,
  ariaLabel = 'Celebration animation in progress'
}) => {
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('idle');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [emojis, setEmojis] = useState<Emoji[]>([]);

  // Animation intensity configurations
  const intensityConfig = useMemo<Record<IntensityLevel, IntensityConfig>>(() => ({
    low: { confetti: 15, balloons: 3, emojis: 5 },
    medium: { confetti: 30, balloons: 5, emojis: 8 },
    high: { confetti: 50, balloons: 8, emojis: 12 }
  }), []);

  // Confetti colors optimized for glass morphism theme with high contrast
  const confettiColors = useMemo<string[]>(() => [
    '#f97316', // Orange primary
    '#fb923c', // Orange light
    '#ea580c', // Orange dark
    '#fed7aa', // Orange very light
    '#ffedd5', // Orange subtle
    '#fbbf24', // Yellow
    '#f59e0b', // Amber
    '#d97706', // Amber dark
    '#ffffff', // White for contrast
    '#1f2937'  // Dark gray for contrast
  ], []);

  // Balloon colors with high visibility
  const balloonColors = useMemo<string[]>(() => [
    '#ef4444', // Red
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#84cc16'  // Lime
  ], []);

  // Happy emojis for celebration
  const happyEmojis = useMemo<string[]>(() => [
    '🎉', '🎊', '🥳', '🎈', '✨', '🌟', '⭐', '💫', 
    '🔥', '👏', '🙌', '🎁', '🍾', '🥂', '🎯', '💯'
  ], []);

  // Generate random confetti particle
  const createConfettiParticle = useCallback((index: number): Particle => ({
    id: `confetti-${index}-${Date.now()}-${Math.random()}`,
    x: Math.random() * 100,
    y: Math.random() * 20 - 20,
    rotation: Math.random() * 360,
    scale: 0.3 + Math.random() * 0.7,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    velocityX: (Math.random() - 0.5) * 4,
    velocityY: Math.random() * 3 + 2,
    rotationSpeed: (Math.random() - 0.5) * 10,
    life: 1,
    decay: 0.012 + Math.random() * 0.008
  }), [confettiColors]);

  // Generate random balloon
  const createBalloon = useCallback((index: number): Balloon => ({
    id: `balloon-${index}-${Date.now()}-${Math.random()}`,
    x: Math.random() * 80 + 10,
    y: 110,
    scale: 0.6 + Math.random() * 0.4,
    color: balloonColors[Math.floor(Math.random() * balloonColors.length)],
    velocityY: -1 - Math.random() * 0.5,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.02 + Math.random() * 0.02,
    life: 1,
    decay: 0.006 + Math.random() * 0.004
  }), [balloonColors]);

  // Generate random emoji
  const createEmoji = useCallback((index: number): Emoji => ({
    id: `emoji-${index}-${Date.now()}-${Math.random()}`,
    x: Math.random() * 90 + 5,
    y: Math.random() * 30 + 70,
    emoji: happyEmojis[Math.floor(Math.random() * happyEmojis.length)],
    scale: 0.5 + Math.random() * 0.5,
    velocityX: (Math.random() - 0.5) * 2,
    velocityY: -1 - Math.random() * 2,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 5,
    life: 1,
    decay: 0.010 + Math.random() * 0.006
  }), [happyEmojis]);

  // Initialize all particle systems
  const initializeParticles = useCallback(() => {
    const config = intensityConfig[intensity];
    
    setParticles(Array.from({ length: config.confetti }, (_, i) => createConfettiParticle(i)));
    setBalloons(Array.from({ length: config.balloons }, (_, i) => createBalloon(i)));
    setEmojis(Array.from({ length: config.emojis }, (_, i) => createEmoji(i)));
  }, [intensity, intensityConfig, createConfettiParticle, createBalloon, createEmoji]);

  // Physics animation loop
  useEffect(() => {
    if (animationPhase !== 'active') return;

    let animationId: number;

    const animate = () => {
      // Update confetti particles with physics
      setParticles(prev => prev
        .map(particle => ({
          ...particle,
          x: particle.x + particle.velocityX,
          y: particle.y + particle.velocityY,
          rotation: particle.rotation + particle.rotationSpeed,
          velocityY: particle.velocityY + 0.15, // Gravity
          velocityX: particle.velocityX * 0.999, // Air resistance
          life: particle.life - particle.decay
        }))
        .filter(particle => particle.life > 0 && particle.y < 120)
      );

      // Update balloons with floating motion
      setBalloons(prev => prev
        .map(balloon => ({
          ...balloon,
          x: balloon.x + Math.sin(balloon.wobble) * 0.5,
          y: balloon.y + balloon.velocityY,
          wobble: balloon.wobble + balloon.wobbleSpeed,
          life: balloon.life - balloon.decay
        }))
        .filter(balloon => balloon.life > 0 && balloon.y > -20)
      );

      // Update emojis with gentle physics
      setEmojis(prev => prev
        .map(emoji => ({
          ...emoji,
          x: emoji.x + emoji.velocityX,
          y: emoji.y + emoji.velocityY,
          rotation: emoji.rotation + emoji.rotationSpeed,
          velocityY: emoji.velocityY + 0.05, // Light gravity
          velocityX: emoji.velocityX * 0.998, // Air resistance
          life: emoji.life - emoji.decay
        }))
        .filter(emoji => emoji.life > 0 && emoji.y < 120)
      );

      if (animationPhase === 'active') {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [animationPhase]);

  // Main animation lifecycle control
  useEffect(() => {
    if (!isActive || reducedMotion) {
      setAnimationPhase('idle');
      return;
    }

    setAnimationPhase('active');
    initializeParticles();

    // Start fade out at 70% of duration
    const fadeOutTimer = setTimeout(() => {
      setAnimationPhase('fadeOut');
    }, duration * 0.7);

    // Complete animation
    const completeTimer = setTimeout(() => {
      setAnimationPhase('complete');
      setParticles([]);
      setBalloons([]);
      setEmojis([]);
      onComplete?.();
    }, duration);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
      setAnimationPhase('idle');
      setParticles([]);
      setBalloons([]);
      setEmojis([]);
    };
  }, [isActive, duration, reducedMotion, initializeParticles, onComplete]);

  // Don't render if not active, completed, or reduced motion is preferred
  if (!isActive || animationPhase === 'complete' || animationPhase === 'idle' || reducedMotion) {
    return null;
  }

  const fadeOpacity = animationPhase === 'fadeOut' ? 0.3 : 1;

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-50 overflow-hidden transition-opacity duration-1000 ${className}`}
      style={{ opacity: fadeOpacity }}
      role="img"
      aria-label={ariaLabel}
      aria-live="polite"
    >
      {/* Screen reader announcement */}
      <div className="sr-only">
        {isActive && 'Celebration! Your image has been processed successfully.'}
      </div>

      {/* Confetti Particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
            backgroundColor: particle.color,
            opacity: particle.life,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
            zIndex: 10
          }}
        />
      ))}

      {/* Balloon Elements */}
      {balloons.map(balloon => (
        <div
          key={balloon.id}
          className="absolute"
          style={{
            left: `${balloon.x}%`,
            top: `${balloon.y}%`,
            transform: `scale(${balloon.scale})`,
            opacity: balloon.life,
            zIndex: 20
          }}
        >
          {/* Balloon body */}
          <div
            className="w-6 h-8 rounded-full relative"
            style={{
              backgroundColor: balloon.color,
              boxShadow: `inset -2px -2px 0 rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.25)`
            }}
          >
            {/* Balloon highlight */}
            <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full opacity-50" />
          </div>
          {/* Balloon string */}
          <div
            className="absolute top-full left-1/2 w-px bg-gray-500 opacity-70"
            style={{ 
              height: '20px', 
              transform: 'translateX(-50%)',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
            }}
          />
        </div>
      ))}

      {/* Emoji Elements */}
      {emojis.map(emoji => (
        <div
          key={emoji.id}
          className="absolute text-xl select-none font-bold"
          style={{
            left: `${emoji.x}%`,
            top: `${emoji.y}%`,
            transform: `rotate(${emoji.rotation}deg) scale(${emoji.scale})`,
            opacity: emoji.life,
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
            filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))',
            zIndex: 30
          }}
        >
          {emoji.emoji}
        </div>
      ))}

      {/* Central burst effect - only during initial phase */}
      {animationPhase === 'active' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="backdrop-blur-md bg-white/20 border border-white/30 rounded-full p-6 animate-bounce shadow-lg"
            style={{
              animation: 'bounce 0.6s ease-in-out',
              boxShadow: '0 8px 32px rgba(249, 115, 22, 0.3)'
            }}
          >
            <div className="text-5xl filter drop-shadow-lg">🎉</div>
          </div>
        </div>
      )}
    </div>
  );
};

// Higher-order component for easier integration
export const withCelebration = <P extends object>(
  WrappedComponent: React.ComponentType<P & { triggerCelebration?: () => void }>
) => {
  const CelebrationWrapper: React.FC<P> = (props) => {
    const [showCelebration, setShowCelebration] = useState(false);

    const triggerCelebration = useCallback(() => {
      setShowCelebration(true);
    }, []);

    const handleCelebrationComplete = useCallback(() => {
      setShowCelebration(false);
    }, []);

    return (
      <>
        <WrappedComponent 
          {...props} 
          triggerCelebration={triggerCelebration}
        />
        <CelebrationAnimation
          isActive={showCelebration}
          onComplete={handleCelebrationComplete}
          ariaLabel="Image processing completed successfully!"
        />
      </>
    );
  };

  CelebrationWrapper.displayName = `withCelebration(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return CelebrationWrapper;
};

// Custom hook for celebration control
export const useCelebration = (): CelebrationHookReturn => {
  const [isActive, setIsActive] = useState(false);

  const trigger = useCallback((options: CelebrationHookOptions = {}) => {
    setIsActive(true);
    
    if (options.duration) {
      setTimeout(() => setIsActive(false), options.duration);
    }
  }, []);

  const stop = useCallback(() => {
    setIsActive(false);
  }, []);

  return { isActive, trigger, stop };
};

export default CelebrationAnimation;