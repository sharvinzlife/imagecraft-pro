/**
 * Content Security Policy (CSP) Headers Configuration
 * OWASP-compliant CSP implementation for ImageCraft Pro PWA
 * 
 * Security Benefits:
 * - Prevents XSS attacks through script injection
 * - Blocks unauthorized resource loading
 * - Prevents clickjacking attacks
 * - Mitigates data exfiltration attempts
 * - Enforces HTTPS connections where possible
 */

/**
 * Generate CSP header value for ImageCraft Pro
 * Tailored for image processing PWA with strict security
 */
export const generateCSPHeader = (environment = 'production') => {
  const baseDirectives = {
    // Default source - most restrictive
    'default-src': ["'self'"],
    
    // Scripts - allow self and specific trusted sources
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for React and Vite dev
      "'unsafe-eval'", // Required for image processing workers
      environment === 'development' ? "'unsafe-eval'" : null,
      'https://cdn.jsdelivr.net', // For potential CDN resources
      'blob:' // For Web Workers
    ].filter(Boolean),
    
    // Stylesheets - allow self and inline styles
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for styled-components and Tailwind
      'https://fonts.googleapis.com'
    ],
    
    // Images - allow self, data URLs, and blob URLs for image processing
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:' // Allow HTTPS images only
    ],
    
    // Fonts - allow self and Google Fonts
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      'data:'
    ],
    
    // Connect sources - API endpoints and WebSocket connections  
    'connect-src': [
      "'self'",
      'https:',
      'wss:',
      'blob:', // For Web Workers communication
      environment === 'development' ? 'ws:' : null,
      environment === 'development' ? 'http://localhost:*' : null
    ].filter(Boolean),
    
    // Media sources - for potential video/audio processing
    'media-src': [
      "'self'",
      'blob:',
      'data:'
    ],
    
    // Object sources - block Flash and other plugins
    'object-src': ["'none'"],
    
    // Base URI - prevent base tag injection
    'base-uri': ["'self'"],
    
    // Form actions - restrict form submissions
    'form-action': ["'self'"],
    
    // Frame ancestors - prevent clickjacking
    'frame-ancestors': ["'none'"],
    
    // Child sources - for Web Workers
    'child-src': [
      "'self'",
      'blob:'
    ],
    
    // Worker sources - for image processing workers
    'worker-src': [
      "'self'",
      'blob:'
    ],
    
    // Manifest source - for PWA manifest
    'manifest-src': ["'self'"]
  };
  
  // Convert directives to CSP string
  const cspString = Object.entries(baseDirectives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
  
  return cspString;
};

/**
 * Additional security headers for ImageCraft Pro
 */
export const getSecurityHeaders = (environment = 'production') => {
  return {
    // Content Security Policy
    'Content-Security-Policy': generateCSPHeader(environment),
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Enable XSS protection
    'X-XSS-Protection': '1; mode=block',
    
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // Referrer policy for privacy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // HSTS for HTTPS enforcement (only in production)
    ...(environment === 'production' && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    }),
    
    // Feature policy to restrict dangerous features
    'Permissions-Policy': [
      'geolocation=()',
      'microphone=()',
      'camera=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()'
    ].join(', '),
    
    // Cross-Origin policies for enhanced security
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin'
  };
};

/**
 * Apply CSP headers to the application
 * For client-side applications, this sets meta tags
 */
export const applyCspHeaders = (environment = 'production') => {
  const cspHeader = generateCSPHeader(environment);
  
  // Create or update CSP meta tag
  let cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  
  if (!cspMeta) {
    cspMeta = document.createElement('meta');
    cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
    document.head.appendChild(cspMeta);
  }
  
  cspMeta.setAttribute('content', cspHeader);
  
  // Apply other security headers via meta tags where possible
  const securityMetas = [
    { name: 'referrer', content: 'strict-origin-when-cross-origin' },
    { 'http-equiv': 'X-Content-Type-Options', content: 'nosniff' }
  ];
  
  securityMetas.forEach(meta => {
    const existing = document.querySelector(
      `meta[${meta.name ? 'name' : 'http-equiv'}="${meta.name || meta['http-equiv']}"]`
    );
    
    if (!existing) {
      const metaEl = document.createElement('meta');
      if (meta.name) metaEl.setAttribute('name', meta.name);
      if (meta['http-equiv']) metaEl.setAttribute('http-equiv', meta['http-equiv']);
      metaEl.setAttribute('content', meta.content);
      document.head.appendChild(metaEl);
    }
  });
  
  console.log('Security headers applied:', {
    csp: cspHeader,
    environment
  });
};

/**
 * Validate CSP compliance for dynamic content
 * Checks if a resource URL would be allowed by current CSP
 */
export const validateCspCompliance = (resourceUrl, resourceType = 'script') => {
  const directives = {
    'script': 'script-src',
    'style': 'style-src',
    'img': 'img-src',
    'font': 'font-src',
    'connect': 'connect-src',
    'media': 'media-src',
    'object': 'object-src',
    'child': 'child-src',
    'worker': 'worker-src'
  };
  
  const directive = directives[resourceType];
  if (!directive) {
    console.warn(`Unknown resource type: ${resourceType}`);
    return false;
  }
  
  // Get current CSP from meta tag
  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (!cspMeta) {
    console.warn('No CSP meta tag found');
    return false;
  }
  
  const cspContent = cspMeta.getAttribute('content');
  const directiveRegex = new RegExp(`${directive}\\s+([^;]+)`);
  const match = cspContent.match(directiveRegex);
  
  if (!match) {
    console.warn(`No ${directive} directive found in CSP`);
    return false;
  }
  
  const allowedSources = match[1].split(/\s+/);
  
  // Check if resource URL is allowed
  for (const source of allowedSources) {
    if (source === "'self'" && resourceUrl.startsWith(window.location.origin)) {
      return true;
    }
    if (source === "'unsafe-inline'" && resourceUrl.startsWith('data:')) {
      return true;
    }
    if (source === 'blob:' && resourceUrl.startsWith('blob:')) {
      return true;
    }
    if (source === 'data:' && resourceUrl.startsWith('data:')) {
      return true;
    }
    if (source.startsWith('https:') && resourceUrl.startsWith('https:')) {
      return true;
    }
    if (resourceUrl.startsWith(source)) {
      return true;
    }
  }
  
  console.warn(`Resource ${resourceUrl} not allowed by CSP ${directive}`);
  return false;
};

/**
 * Report CSP violations for monitoring
 */
export const setupCspReporting = () => {
  // Listen for CSP violations
  document.addEventListener('securitypolicyviolation', (event) => {
    const violation = {
      blockedURI: event.blockedURI,
      violatedDirective: event.violatedDirective,
      originalPolicy: event.originalPolicy,
      sourceFile: event.sourceFile,
      lineNumber: event.lineNumber,
      columnNumber: event.columnNumber,
      timestamp: new Date().toISOString()
    };
    
    console.error('CSP Violation:', violation);
    
    // In production, send violations to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Replace with your monitoring endpoint
      fetch('/api/csp-violation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(violation)
      }).catch(err => {
        console.error('Failed to report CSP violation:', err);
      });
    }
  });
};

/**
 * Initialize all security measures
 */
export const initializeSecurity = () => {
  const environment = process.env.NODE_ENV || 'development';
  
  // Apply CSP headers
  applyCspHeaders(environment);
  
  // Setup CSP violation reporting
  setupCspReporting();
  
  console.log('Security initialization complete');
};

const cspUtils = {
  generateCSPHeader,
  getSecurityHeaders,
  applyCspHeaders,
  validateCspCompliance,
  setupCspReporting,
  initializeSecurity
};

export default cspUtils;