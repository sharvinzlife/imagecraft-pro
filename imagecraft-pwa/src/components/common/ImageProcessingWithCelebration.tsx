import React, { useState, useCallback } from 'react';
import { Upload, CheckCircle, Download, Sparkles } from 'lucide-react';
import CelebrationAnimation, { useCelebration } from './CelebrationAnimation';

/**
 * ImageProcessingWithCelebration - Complete workflow demonstration
 * Shows how to integrate celebration animations with actual image processing
 */

interface ProcessingJob {
  id: string;
  file: File;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: {
    url: string;
    format: string;
    size: number;
  };
  error?: string;
}

interface ImageProcessingWithCelebrationProps {
  className?: string;
}

const ImageProcessingWithCelebration: React.FC<ImageProcessingWithCelebrationProps> = ({ 
  className = '' 
}) => {
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const { isActive: celebrationActive, trigger: triggerCelebration } = useCelebration();

  // Simulate file processing
  const processFile = useCallback(async (file: File): Promise<void> => {
    const jobId = `job-${Date.now()}-${Math.random()}`;
    
    // Create initial job
    const newJob: ProcessingJob = {
      id: jobId,
      file,
      status: 'uploading',
      progress: 0
    };

    setJobs(prev => [...prev, newJob]);

    try {
      // Simulate upload progress
      for (let i = 0; i <= 30; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setJobs(prev => prev.map(job => 
          job.id === jobId 
            ? { ...job, progress: i, status: 'uploading' }
            : job
        ));
      }

      // Switch to processing
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'processing', progress: 30 }
          : job
      ));

      // Simulate processing progress
      for (let i = 30; i <= 90; i += 15) {
        await new Promise(resolve => setTimeout(resolve, 400));
        setJobs(prev => prev.map(job => 
          job.id === jobId 
            ? { ...job, progress: i }
            : job
        ));
      }

      // Complete processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockResult = {
        url: URL.createObjectURL(file),
        format: 'webp',
        size: Math.floor(file.size * 0.7) // Simulated compression
      };

      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { 
              ...job, 
              status: 'completed', 
              progress: 100,
              result: mockResult
            }
          : job
      ));

      // Trigger celebration after a short delay
      setTimeout(() => {
        triggerCelebration({ 
          duration: 4000, 
          intensity: 'medium' 
        });
      }, 300);

    } catch (error) {
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { 
              ...job, 
              status: 'failed', 
              error: error instanceof Error ? error.message : 'Processing failed'
            }
          : job
      ));
    }
  }, [triggerCelebration]);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        processFile(file);
      }
    });
  }, [processFile]);

  // Handle file input
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(processFile);
    e.target.value = ''; // Reset input
  }, [processFile]);

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  // Clear completed jobs
  const clearCompleted = useCallback(() => {
    setJobs(prev => prev.filter(job => job.status !== 'completed'));
  }, []);

  // Get job status counts
  const jobCounts = {
    total: jobs.length,
    processing: jobs.filter(job => ['uploading', 'processing'].includes(job.status)).length,
    completed: jobs.filter(job => job.status === 'completed').length,
    failed: jobs.filter(job => job.status === 'failed').length
  };

  return (
    <div className={`max-w-4xl mx-auto p-6 space-y-8 ${className}`}>
      {/* Header */}
      <div className="text-center card-glass-accessible p-8">
        <div className="flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-orange-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">
            Image Processing with Celebrations
          </h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Upload images to see the complete workflow with celebration animations when processing completes.
        </p>
      </div>

      {/* Upload Zone */}
      <div
        className={`card-glass-accessible border-2 border-dashed transition-all duration-300 ${
          dragActive 
            ? 'border-orange-500 bg-orange-50/50 scale-105' 
            : 'border-gray-300 hover:border-orange-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="text-center p-12">
          <Upload className={`w-12 h-12 mx-auto mb-4 transition-colors ${
            dragActive ? 'text-orange-600' : 'text-gray-400'
          }`} />
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {dragActive ? 'Drop images here!' : 'Upload Images to Process'}
          </h3>
          
          <p className="text-gray-600 mb-6">
            Drag and drop images or click to select files
          </p>

          <label className="btn-glass-accessible inline-flex items-center cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            Choose Files
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInput}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      {/* Processing Queue */}
      {jobs.length > 0 && (
        <div className="card-glass-accessible">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Processing Queue
            </h2>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {jobCounts.processing > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 mr-2">
                    {jobCounts.processing} processing
                  </span>
                )}
                {jobCounts.completed > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 mr-2">
                    {jobCounts.completed} completed
                  </span>
                )}
                {jobCounts.failed > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-800">
                    {jobCounts.failed} failed
                  </span>
                )}
              </div>
              
              {jobCounts.completed > 0 && (
                <button
                  onClick={clearCompleted}
                  className="btn-glass-secondary-accessible text-sm"
                >
                  Clear Completed
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      {jobs.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card-glass-subtle-accessible text-center p-4">
            <div className="text-2xl font-bold text-gray-900">{jobCounts.total}</div>
            <div className="text-sm text-gray-600">Total Jobs</div>
          </div>
          <div className="card-glass-subtle-accessible text-center p-4">
            <div className="text-2xl font-bold text-blue-600">{jobCounts.processing}</div>
            <div className="text-sm text-gray-600">Processing</div>
          </div>
          <div className="card-glass-subtle-accessible text-center p-4">
            <div className="text-2xl font-bold text-green-600">{jobCounts.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="card-glass-subtle-accessible text-center p-4">
            <div className="text-2xl font-bold text-red-600">{jobCounts.failed}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
        </div>
      )}

      {/* Celebration Animation */}
      <CelebrationAnimation
        isActive={celebrationActive}
        intensity="medium"
        duration={4000}
        ariaLabel="Image processing completed successfully!"
      />
    </div>
  );
};

// Job Card Component
interface JobCardProps {
  job: ProcessingJob;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const getStatusIcon = () => {
    switch (job.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
          <span className="text-white text-xs">!</span>
        </div>;
      default:
        return <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />;
    }
  };

  const getStatusText = () => {
    switch (job.status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Completed!';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg bg-white/50">
      {getStatusIcon()}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-gray-900 truncate">
            {job.file.name}
          </p>
          <span className="text-xs text-gray-500">
            {getStatusText()}
          </span>
        </div>
        
        {(job.status === 'uploading' || job.status === 'processing') && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-orange-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${job.progress}%` }}
            />
          </div>
        )}
        
        {job.status === 'completed' && job.result && (
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>
              {job.result.format.toUpperCase()} • {(job.result.size / 1024).toFixed(1)}KB
            </span>
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = job.result!.url;
                link.download = job.file.name.replace(/\.[^/.]+$/, `.${job.result!.format}`);
                link.click();
              }}
              className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium"
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </button>
          </div>
        )}
        
        {job.status === 'failed' && job.error && (
          <p className="text-xs text-red-600 mt-1">{job.error}</p>
        )}
      </div>
    </div>
  );
};

export default ImageProcessingWithCelebration;