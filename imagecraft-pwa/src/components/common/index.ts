/**
 * Common Components Index
 * 
 * Exports all common/shared components for easy importing
 */

export { default as CelebrationAnimation, useCelebration, withCelebration } from './CelebrationAnimation';
export { default as CelebrationDemo } from './CelebrationDemo';
export { default as CelebrationAnimationExample } from './CelebrationAnimationExample';
export { default as ImageProcessingWithCelebration } from './ImageProcessingWithCelebration';

// Type exports
export type {
  CelebrationAnimationProps,
  CelebrationHookOptions,
  CelebrationHookReturn,
  IntensityLevel
} from './CelebrationAnimation';