import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Download, 
  Eye, 
  X,
  MoreHorizontal 
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';
// API hook removed - using browser-only processing
import { useNotifications } from '../store/appStore';
import { cn } from '../lib/utils';
import CelebrationAnimation from './common/CelebrationAnimation.tsx';

// Simple hook for browser-only processing
const useImageProcessing = () => ({
  processImage: () => Promise.resolve(),
  isProcessing: false,
  progress: 0
});

const JobStatusCard = ({ job, onCancel, onDownload, onPreview, onRemove }) => {
  const [expanded, setExpanded] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [previousStatus, setPreviousStatus] = useState(job?.status);

  // Trigger celebration when job completes
  useEffect(() => {
    if (job && previousStatus !== 'completed' && job.status === 'completed') {
      setShowCelebration(true);
    }
    setPreviousStatus(job.status);
  }, [job, previousStatus]);

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
  };
  
  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50/50',
      border: 'border-yellow-200',
      label: 'Pending'
    },
    processing: {
      icon: Loader2,
      color: 'text-blue-600',
      bg: 'bg-blue-50/50',
      border: 'border-blue-200',
      label: 'Processing'
    },
    completed: {
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50/50',
      border: 'border-green-200',
      label: 'Completed'
    },
    failed: {
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50/50',
      border: 'border-red-200',
      label: 'Failed'
    },
    cancelled: {
      icon: AlertCircle,
      color: 'text-gray-600',
      bg: 'bg-gray-50/50',
      border: 'border-gray-200',
      label: 'Cancelled'
    }
  };

  const config = statusConfig[job.status] || statusConfig.pending;
  const IconComponent = config.icon;
  const isActive = ['pending', 'processing'].includes(job.status);
  const isCompleted = job.status === 'completed';
  const canCancel = isActive;

  const formatDuration = (start, end = new Date()) => {
    const duration = Math.floor((end - start) / 1000);
    if (duration < 60) return `${duration}s`;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  };

  const getJobTypeLabel = (type) => {
    const labels = {
      convert: 'Format Conversion',
      edit: 'Image Editing',
      collage: 'Collage Creation',
      'ai-effect': 'AI Processing'
    };
    return labels[type] || type;
  };

  return (
    <Card 
      className={cn(
        'transition-all duration-300 backdrop-blur-md border',
        config.bg,
        config.border,
        expanded ? 'shadow-lg' : 'shadow-sm'
      )}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={cn('flex-shrink-0', config.color)}>
              <IconComponent 
                className={cn(
                  'w-5 h-5',
                  job.status === 'processing' && 'animate-spin'
                )} 
              />
            </div>
            <div>
              <h4 
                className="text-sm font-semibold text-gray-900"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {getJobTypeLabel(job.type)}
              </h4>
              <p className="text-xs text-gray-500">
                {config.label} • {formatDuration(job.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {/* Action buttons */}
            {isCompleted && job.result?.download_url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDownload?.(job)}
                className="h-8 w-8 p-0"
                title="Download result"
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
            
            {isCompleted && job.result?.preview_url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPreview?.(job)}
                className="h-8 w-8 p-0"
                title="Preview result"
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}

            {canCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCancel?.(job.id)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                title="Cancel job"
              >
                <X className="w-4 h-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-8 w-8 p-0"
              title={expanded ? "Collapse" : "Expand"}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>

            {!isActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove?.(job.id)}
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                title="Remove from list"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {isActive && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>{Math.round(job.progress || 0)}%</span>
            </div>
            <Progress 
              value={job.progress || 0} 
              variant={job.status === 'processing' ? 'default' : 'warning'}
            />
          </div>
        )}

        {/* Error message */}
        {job.status === 'failed' && job.error && (
          <div className="mb-3 p-2 bg-red-100/50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">
              {job.error.message || 'Processing failed'}
            </p>
          </div>
        )}

        {/* Expanded details */}
        {expanded && (
          <div className="border-t border-gray-200 pt-3 mt-3">
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Job ID:</span>
                <span className="font-mono">{job.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span>Started:</span>
                <span>{job.createdAt.toLocaleTimeString()}</span>
              </div>
              {job.result?.file_size && (
                <div className="flex justify-between">
                  <span>Output Size:</span>
                  <span>{(job.result.file_size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              )}
              {job.params && (
                <div className="mt-2">
                  <span className="font-medium">Parameters:</span>
                  <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(job.params, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Celebration Animation */}
        <CelebrationAnimation
          isActive={showCelebration}
          duration={4000}
          intensity="medium"
          onComplete={handleCelebrationComplete}
          ariaLabel={`Processing completed for ${job.type || 'image'}`}
        />
      </CardContent>
    </Card>
  );
};

const JobStatusDisplay = ({ className }) => {
  const { jobs, cancelJob } = useImageProcessing();
  const { addNotification } = useNotifications();
  const [removedJobs, setRemovedJobs] = useState(new Set());

  // Filter out removed jobs
  const visibleJobs = jobs.filter(job => !removedJobs.has(job.id));

  // Sort jobs by creation time (newest first)
  const sortedJobs = [...visibleJobs].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  const handleCancel = async (jobId) => {
    try {
      await cancelJob(jobId);
      addNotification({
        type: 'info',
        title: 'Job Cancelled',
        message: 'Processing job has been cancelled.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Cancel Failed',
        message: 'Failed to cancel the job. It may have already completed.',
      });
    }
  };

  const handleDownload = (job) => {
    if (job.result?.download_url) {
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = job.result.download_url;
      link.download = job.result.filename || 'processed_image';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addNotification({
        type: 'success',
        title: 'Download Started',
        message: 'Your processed image is being downloaded.',
      });
    }
  };

  const handlePreview = (job) => {
    if (job.result?.preview_url) {
      window.open(job.result.preview_url, '_blank');
    }
  };

  const handleRemove = (jobId) => {
    setRemovedJobs(prev => new Set([...prev, jobId]));
  };

  const clearCompleted = () => {
    const completedJobIds = sortedJobs
      .filter(job => ['completed', 'failed', 'cancelled'].includes(job.status))
      .map(job => job.id);
    
    setRemovedJobs(prev => new Set([...prev, ...completedJobIds]));

    addNotification({
      type: 'info',
      title: 'Jobs Cleared',
      message: `Removed ${completedJobIds.length} completed jobs from the list.`,
    });
  };

  // Auto-remove completed jobs after 5 minutes
  useEffect(() => {
    const timer = setInterval(() => {
      const oldCompletedJobs = sortedJobs
        .filter(job => 
          ['completed', 'failed'].includes(job.status) &&
          Date.now() - job.createdAt.getTime() > 5 * 60 * 1000 // 5 minutes
        )
        .map(job => job.id);

      if (oldCompletedJobs.length > 0) {
        setRemovedJobs(prev => new Set([...prev, ...oldCompletedJobs]));
      }
    }, 60000); // Check every minute

    return () => clearInterval(timer);
  }, [sortedJobs]);

  if (sortedJobs.length === 0) {
    return null;
  }

  const activeJobs = sortedJobs.filter(job => 
    ['pending', 'processing'].includes(job.status)
  );
  const completedJobs = sortedJobs.filter(job => 
    ['completed', 'failed', 'cancelled'].includes(job.status)
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 
          className="text-lg font-semibold text-gray-900"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          Processing Jobs
        </h3>
        {completedJobs.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCompleted}
            className="text-gray-500 hover:text-gray-700"
          >
            Clear Completed ({completedJobs.length})
          </Button>
        )}
      </div>

      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Active ({activeJobs.length})
          </h4>
          {activeJobs.map(job => (
            <JobStatusCard
              key={job.id}
              job={job}
              onCancel={handleCancel}
              onDownload={handleDownload}
              onPreview={handlePreview}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      {/* Completed Jobs */}
      {completedJobs.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Recent ({completedJobs.length})
          </h4>
          {completedJobs.slice(0, 5).map(job => (
            <JobStatusCard
              key={job.id}
              job={job}
              onCancel={handleCancel}
              onDownload={handleDownload}
              onPreview={handlePreview}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default JobStatusDisplay;