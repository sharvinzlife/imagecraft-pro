import React from 'react';
import { CheckCircle, Download, Sparkles, Star } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Specialized celebration toast component with enhanced styling
 * Integrates with the existing Sonner toast system
 */

export const showCelebrationToast = (options = {}) => {
  const {
    fileName,
    downloadUrl,
    processingTime,
    outputFormat,
    onDownload,
    duration = 6000,
  } = options;

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  return toast.custom(
    (t) => (
      <CelebrationToastContent
        toast={t}
        fileName={fileName}
        downloadUrl={downloadUrl}
        processingTime={processingTime}
        outputFormat={outputFormat}
        onDownload={handleDownload}
      />
    ),
    {
      duration,
      position: 'top-right',
      className: 'celebration-toast-container',
    }
  );
};

const CelebrationToastContent = ({ 
  toast, 
  fileName, 
  downloadUrl, 
  processingTime, 
  outputFormat,
  onDownload 
}) => {
  return (
    <div
      className={`
        celebration-toast relative overflow-hidden rounded-2xl p-6 max-w-md w-full
        bg-gradient-to-br from-white/95 via-white/90 to-orange-50/95
        backdrop-blur-xl border border-orange-200/50
        shadow-2xl shadow-orange-100/50
        transform transition-all duration-500 ease-out
        ${toast.visible ? 'animate-in slide-in-from-right-5 fade-in-0' : 'animate-out slide-out-to-right-5 fade-out-0'}
        hover:scale-[1.02] hover:shadow-3xl hover:shadow-orange-200/60
      `}
      style={{
        background: `
          linear-gradient(135deg, 
            rgba(255, 255, 255, 0.95) 0%, 
            rgba(255, 255, 255, 0.9) 50%, 
            rgba(255, 237, 213, 0.95) 100%
          )
        `,
      }}
    >
      {/* Animated background elements */}
      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-orange-300/40 to-orange-400/30 rounded-full blur-sm animate-gentle-breathe" />
      <div className="absolute -bottom-3 -left-3 w-10 h-10 bg-gradient-to-br from-orange-200/30 to-orange-300/20 rounded-full blur-md animate-gentle-float-reverse" />
      
      {/* Success celebration header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-400/30 to-emerald-400/30 rounded-full blur-sm animate-gentle-pulse" />
            <CheckCircle className="relative w-8 h-8 text-green-600 animate-gentle-bounce" />
          </div>
          <div>
            <h4 
              className="text-lg font-bold text-slate-800 flex items-center gap-2"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Conversion Complete!
              <Sparkles className="w-5 h-5 text-orange-500 animate-gentle-pulse" />
            </h4>
            {processingTime && (
              <p 
                className="text-xs text-slate-500 font-medium"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Completed in {processingTime}
              </p>
            )}
          </div>
        </div>
        
        {/* Dismiss button */}
        <button
          onClick={() => toast.dismiss()}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100/50"
          aria-label="Dismiss notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* File information */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p 
            className="text-sm font-semibold text-slate-700 truncate flex-1 mr-2"
            style={{ fontFamily: 'Inter, sans-serif' }}
            title={fileName}
          >
            {fileName || 'Your image'}
          </p>
          {outputFormat && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200/50">
              {outputFormat.toUpperCase()}
            </span>
          )}
        </div>
        <p 
          className="text-sm text-slate-600"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Your image has been successfully processed and is ready for download.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end space-x-3">
        {downloadUrl && (
          <button
            onClick={onDownload}
            className="
              inline-flex items-center space-x-2 px-4 py-2 rounded-xl
              bg-gradient-to-r from-orange-500 to-orange-600
              hover:from-orange-600 hover:to-orange-700
              text-white font-semibold text-sm
              transition-all duration-200
              hover:scale-105 hover:shadow-lg hover:shadow-orange-500/25
              focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2
              transform-gpu
            "
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
        )}
        
        <button
          onClick={() => toast.dismiss()}
          className="
            inline-flex items-center px-3 py-2 rounded-xl
            text-slate-600 hover:text-slate-800
            hover:bg-slate-100/60
            font-medium text-sm
            transition-all duration-200
            hover:scale-105
            focus:outline-none focus:ring-2 focus:ring-slate-300/50 focus:ring-offset-2
          "
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Dismiss
        </button>
      </div>

      {/* Decorative stars */}
      <div className="absolute top-4 right-4 opacity-20">
        <Star className="w-3 h-3 text-orange-400 animate-gentle-pulse" style={{ animationDelay: '1s' }} />
      </div>
      <div className="absolute bottom-4 left-4 opacity-15">
        <Star className="w-2 h-2 text-orange-300 animate-gentle-pulse" style={{ animationDelay: '2s' }} />
      </div>
    </div>
  );
};

/**
 * Utility function for showing success celebrations with different styles
 */
export const celebrationToasts = {
  // Standard success celebration
  success: (options) => showCelebrationToast(options),

  // Quick success for minor operations
  quick: (options) => showCelebrationToast({
    ...options,
    duration: 3000,
  }),

  // Extended celebration for major operations
  extended: (options) => showCelebrationToast({
    ...options,
    duration: 8000,
  }),

  // Custom celebration with user-defined styling
  custom: (options, customToast) => {
    return toast.custom(customToast, {
      duration: options.duration || 6000,
      position: 'top-right',
      className: 'celebration-toast-container',
    });
  },
};

const CelebrationToast = { showCelebrationToast, celebrationToasts };
export default CelebrationToast;