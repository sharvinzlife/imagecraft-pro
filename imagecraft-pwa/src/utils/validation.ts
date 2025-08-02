/**
 * Validation Utilities
 * Comprehensive validation schemas and security checks
 */

import { z } from 'zod';
import {
  LoginFormData,
  RegisterFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData,
  ChangePasswordFormData,
  UserTier
} from '../types/auth';

// Security constants
export const SECURITY_RULES = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true,
    SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    COMMON_PASSWORDS: [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'monkey', '1234567', 'letmein', 'trustno1', 'dragon'
    ]
  },
  EMAIL: {
    MAX_LENGTH: 254,
    ALLOWED_DOMAINS: [], // Empty means all domains allowed
    BLOCKED_DOMAINS: ['tempmail.org', '10minutemail.com', 'guerrillamail.com']
  },
  RATE_LIMITS: {
    LOGIN_ATTEMPTS: 5,
    REGISTRATION_ATTEMPTS: 3,
    PASSWORD_RESET_ATTEMPTS: 3,
    TIME_WINDOW_MINUTES: 15
  }
};

// Password strength checker
export function checkPasswordStrength(password: string): {
  score: number; // 0-5
  feedback: string[];
  isStrong: boolean;
} {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= SECURITY_RULES.PASSWORD.MIN_LENGTH) {
    score += 1;
  } else {
    feedback.push(`Password must be at least ${SECURITY_RULES.PASSWORD.MIN_LENGTH} characters long`);
  }

  // Character variety checks
  if (/[a-z]/.test(password)) {
    score += 1;
  } else if (SECURITY_RULES.PASSWORD.REQUIRE_LOWERCASE) {
    feedback.push('Password must contain at least one lowercase letter');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else if (SECURITY_RULES.PASSWORD.REQUIRE_UPPERCASE) {
    feedback.push('Password must contain at least one uppercase letter');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else if (SECURITY_RULES.PASSWORD.REQUIRE_NUMBERS) {
    feedback.push('Password must contain at least one number');
  }

  const specialCharsRegex = new RegExp(`[${SECURITY_RULES.PASSWORD.SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
  if (specialCharsRegex.test(password)) {
    score += 1;
  } else if (SECURITY_RULES.PASSWORD.REQUIRE_SPECIAL_CHARS) {
    feedback.push('Password must contain at least one special character');
  }

  // Common password check
  if (SECURITY_RULES.PASSWORD.COMMON_PASSWORDS.includes(password.toLowerCase())) {
    score = Math.max(0, score - 2);
    feedback.push('This password is too common. Please choose something more unique.');
  }

  // Repeated characters check
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push('Avoid repeating characters');
  }

  // Sequential characters check
  if (hasSequentialChars(password)) {
    score = Math.max(0, score - 1);
    feedback.push('Avoid sequential characters like "123" or "abc"');
  }

  return {
    score,
    feedback,
    isStrong: score >= 4 && feedback.length === 0
  };
}

function hasSequentialChars(password: string): boolean {
  const sequences = ['0123456789', 'abcdefghijklmnopqrstuvwxyz', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  
  for (const seq of sequences) {
    for (let i = 0; i <= seq.length - 3; i++) {
      const subseq = seq.slice(i, i + 3);
      if (password.toLowerCase().includes(subseq) || password.toLowerCase().includes(subseq.split('').reverse().join(''))) {
        return true;
      }
    }
  }
  
  return false;
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= SECURITY_RULES.EMAIL.MAX_LENGTH;
}

export function isBlockedEmailDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return SECURITY_RULES.EMAIL.BLOCKED_DOMAINS.includes(domain);
}

// Form validation schemas
const passwordSchema = z
  .string()
  .min(SECURITY_RULES.PASSWORD.MIN_LENGTH, 
    `Password must be at least ${SECURITY_RULES.PASSWORD.MIN_LENGTH} characters`)
  .max(SECURITY_RULES.PASSWORD.MAX_LENGTH, 
    `Password must be no more than ${SECURITY_RULES.PASSWORD.MAX_LENGTH} characters`)
  .refine((password) => {
    const strength = checkPasswordStrength(password);
    return strength.isStrong;
  }, {
    message: 'Password is not strong enough'
  });

const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .max(SECURITY_RULES.EMAIL.MAX_LENGTH, 'Email address is too long')
  .refine((email) => !isBlockedEmailDomain(email), {
    message: 'This email domain is not allowed'
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  remember_me: z.boolean().optional()
});

export const registerSchema = z.object({
  first_name: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name is too long')
    .regex(/^[a-zA-Z\s-']+$/, 'First name contains invalid characters'),
  last_name: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name is too long')
    .regex(/^[a-zA-Z\s-']+$/, 'Last name contains invalid characters'),
  email: emailSchema,
  password: passwordSchema,
  confirm_password: z.string(),
  terms_accepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions'
  }),
  marketing_consent: z.boolean().optional()
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"]
});

export const forgotPasswordSchema = z.object({
  email: emailSchema
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
  confirm_password: z.string()
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"]
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: passwordSchema,
  confirm_password: z.string()
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"]
}).refine((data) => data.current_password !== data.new_password, {
  message: "New password must be different from current password",
  path: ["new_password"]
});

// Project validation schemas
export const projectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name is too long')
    .regex(/^[a-zA-Z0-9\s-_()]+$/, 'Project name contains invalid characters'),
  description: z
    .string()
    .max(500, 'Description is too long')
    .optional(),
  type: z.enum(['single_image', 'batch_processing', 'collage', 'template', 'workflow']),
  privacy: z.enum(['private', 'team', 'public']).optional(),
  tags: z
    .array(z.string().max(30))
    .max(10, 'Too many tags')
    .optional()
});

export const collaboratorSchema = z.object({
  email: emailSchema,
  role: z.enum(['viewer', 'commenter', 'editor', 'admin']),
  message: z.string().max(200).optional()
});

export const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment is too long'),
  file_id: z.string().uuid().optional(),
  position: z.object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1)
  }).optional(),
  parent_comment_id: z.string().uuid().optional()
});

// File upload validation
export const ALLOWED_FILE_TYPES = {
  IMAGE: [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'image/bmp', 'image/tiff', 'image/svg+xml', 'image/heic', 'image/avif'
  ],
  DOCUMENT: [
    'application/pdf'
  ]
};

export const FILE_SIZE_LIMITS = {
  FREE_TIER: 10 * 1024 * 1024, // 10MB
  PREMIUM_TIER: 100 * 1024 * 1024, // 100MB
  TEAM_TIER: 500 * 1024 * 1024 // 500MB
};

export function validateFileUpload(
  file: File,
  userTier: UserTier,
  allowedTypes: string[] = ALLOWED_FILE_TYPES.IMAGE
): { isValid: boolean; error?: string } {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not supported. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  // Check file size based on user tier
  const sizeLimit = FILE_SIZE_LIMITS[`${userTier.toUpperCase()}_TIER` as keyof typeof FILE_SIZE_LIMITS];
  if (file.size > sizeLimit) {
    const sizeMB = Math.round(sizeLimit / (1024 * 1024));
    return {
      isValid: false,
      error: `File size exceeds the ${sizeMB}MB limit for your ${userTier} tier`
    };
  }

  // Check for potentially malicious files
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return {
      isValid: false,
      error: 'File name contains invalid characters'
    };
  }

  return { isValid: true };
}

// XSS Protection
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

// CSRF Token validation
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function validateCSRFToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken || token.length !== storedToken.length) {
    return false;
  }
  
  // Constant-time comparison to prevent timing attacks
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ storedToken.charCodeAt(i);
  }
  
  return result === 0;
}

// Rate limiting helpers
class RateLimiter {
  private attempts = new Map<string, { count: number; resetTime: number }>();
  
  isAllowed(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);
    
    if (!record || now > record.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (record.count >= limit) {
      return false;
    }
    
    record.count++;
    return true;
  }
  
  getRemainingAttempts(key: string, limit: number): number {
    const record = this.attempts.get(key);
    if (!record || Date.now() > record.resetTime) {
      return limit;
    }
    
    return Math.max(0, limit - record.count);
  }
  
  getResetTime(key: string): number | null {
    const record = this.attempts.get(key);
    if (!record || Date.now() > record.resetTime) {
      return null;
    }
    
    return record.resetTime;
  }
  
  clear(key: string): void {
    this.attempts.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

// Security headers validation
export function validateSecurityHeaders(response: Response): {
  isSecure: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  // Check for security headers
  const requiredHeaders = [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
    'Strict-Transport-Security'
  ];
  
  for (const header of requiredHeaders) {
    if (!response.headers.get(header)) {
      warnings.push(`Missing security header: ${header}`);
    }
  }
  
  // Check CSP header
  const csp = response.headers.get('Content-Security-Policy');
  if (!csp) {
    warnings.push('Missing Content-Security-Policy header');
  } else if (csp.includes('unsafe-inline') || csp.includes('unsafe-eval')) {
    warnings.push('CSP contains unsafe directives');
  }
  
  return {
    isSecure: warnings.length === 0,
    warnings
  };
}

// Input validation helper
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

// Export validation functions
export const validate = {
  login: (data: unknown) => validateInput(loginSchema, data),
  register: (data: unknown) => validateInput(registerSchema, data),
  forgotPassword: (data: unknown) => validateInput(forgotPasswordSchema, data),
  resetPassword: (data: unknown) => validateInput(resetPasswordSchema, data),
  changePassword: (data: unknown) => validateInput(changePasswordSchema, data),
  project: (data: unknown) => validateInput(projectSchema, data),
  collaborator: (data: unknown) => validateInput(collaboratorSchema, data),
  comment: (data: unknown) => validateInput(commentSchema, data)
};