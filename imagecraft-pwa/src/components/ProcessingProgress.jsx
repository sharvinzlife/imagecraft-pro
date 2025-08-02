import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { cn } from '../lib/utils';
import CelebrationAnimation from './common/CelebrationAnimation.tsx';

/**
 * ProcessingProgress - Real-time progress component for image processing jobs
 * Integrates with WebSocket for live updates from backend processing service
 */
const ProcessingProgress = ({ 
  job, 
  onCancel, 
  onRetry, 
  className,
  variant = "glass",
  enableCelebration = true,
  celebrationIntensity = "medium"
}) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [previousStatus, setPreviousStatus] = useState(job?.status);

  // Trigger celebration when job completes
  useEffect(() => {
    if (job && enableCelebration) {
      if (previousStatus !== 'completed' && job.status === 'completed') {
        setShowCelebration(true);
      }
      setPreviousStatus(job.status);
    }
  }, [job?.status, previousStatus, enableCelebration]);

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
  };

  if (!job) return null;

  const getStatusIcon = () => {
    switch (job.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'processing':
      case 'uploading':
      default:
        return <Loader2 className="w-4 h-4 animate-spin text-orange-600" />;
    }
  };

  const getProgressVariant = () => {
    switch (job.status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'processing':
        return 'processing';
      default:
        return 'glass';
    }
  };

  const getStatusMessage = () => {
    switch (job.status) {
      case 'queued':
        return 'Waiting in queue...';
      case 'uploading':
        return 'Uploading file...';
      case 'processing':
        return `${job.operation || 'Processing'}...`;
      case 'completed':
        return 'Processing completed!';
      case 'failed':
        return job.error?.message || 'Processing failed';
      default:
        return 'Unknown status';
    }
  };

  return (
    <Card variant={variant} className={cn("w-full", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {job.fileName || job.name}
              </p>
              <p className="text-xs text-gray-600">
                {getStatusMessage()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {job.status === 'failed' && onRetry && (
              <Button
                variant="glassSecondary"
                size="sm"
                onClick={() => onRetry(job.id)}
                className="text-xs"
              >
                Retry
              </Button>
            )}
            {(job.status === 'processing' || job.status === 'queued') && onCancel && (
              <Button
                variant="glassSecondary"
                size="sm"
                onClick={() => onCancel(job.id)}
                className="text-xs"
                aria-label={`Cancel processing ${job.fileName}`}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar - only show if not completed/failed */}
        {job.status !== 'completed' && job.status !== 'failed' && (
          <div className="space-y-2">
            <Progress
              value={job.progress || 0}
              variant={getProgressVariant()}
              size="sm"
              showValue={job.progress > 0}
              animated={job.status === 'processing'}
              aria-label={`Processing progress: ${job.progress || 0}%`}
            />
            
            {job.estimatedTime && job.status === 'processing' && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>{Math.round(job.progress || 0)}% complete</span>
                <span>~{Math.ceil((job.estimatedTime * (100 - (job.progress || 0))) / 100)}s remaining</span>
              </div>
            )}
          </div>
        )}

        {/* Results section for completed jobs */}
        {job.status === 'completed' && job.result && (
          <div className="mt-3 p-2 bg-green-50/50 border border-green-200/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-xs text-green-800">
                <span className="font-medium">Result:</span> {job.result.format?.toUpperCase()} • {job.result.size ? `${(job.result.size / 1024).toFixed(1)}KB` : 'Unknown size'}
              </div>
              {job.result.url && (
                <Button
                  variant="glassSecondary"
                  size="sm"
                  onClick={() => window.open(job.result.url, '_blank')}
                  className="text-xs"
                >
                  Download
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Error details for failed jobs */}
        {job.status === 'failed' && job.error && (
          <div className="mt-3 p-2 bg-red-50/50 border border-red-200/50 rounded-lg">
            <p className="text-xs text-red-800">
              <span className="font-medium">Error:</span> {job.error.message}
            </p>
            {job.error.code && (
              <p className="text-xs text-red-600 mt-1">
                Code: {job.error.code}
              </p>
            )}
          </div>
        )}

        {/* Celebration Animation */}
        <CelebrationAnimation
          isActive={showCelebration}
          duration={4000}
          intensity={celebrationIntensity}
          onComplete={handleCelebrationComplete}
          ariaLabel={`Processing completed for ${job.fileName || job.name}`}
        />
      </CardContent>
    </Card>
  );
};

/**
 * ProcessingQueue - Container for multiple processing jobs
 * Shows all active, completed, and failed jobs with filtering
 */
const ProcessingQueue = ({ 
  jobs = [], 
  onCancelJob, 
  onRetryJob, 
  onClearCompleted,
  maxVisible = 5,
  className 
}) => {
  const [filter, setFilter] = React.useState('all'); // 'all', 'active', 'completed', 'failed'
  
  const filteredJobs = React.useMemo(() => {
    let filtered = jobs;
    
    switch (filter) {
      case 'active':
        filtered = jobs.filter(job => ['queued', 'uploading', 'processing'].includes(job.status));
        break;
      case 'completed':
        filtered = jobs.filter(job => job.status === 'completed');
        break;
      case 'failed':
        filtered = jobs.filter(job => job.status === 'failed');
        break;
      default:
        filtered = jobs;
    }
    
    return filtered.slice(0, maxVisible);
  }, [jobs, filter, maxVisible]);

  const counts = React.useMemo(() => ({
    total: jobs.length,
    active: jobs.filter(job => ['queued', 'uploading', 'processing'].includes(job.status)).length,
    completed: jobs.filter(job => job.status === 'completed').length,
    failed: jobs.filter(job => job.status === 'failed').length,
  }), [jobs]);

  if (jobs.length === 0) {
    return null;
  }

  return (
    <Card variant="glass" className={cn("w-full", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Processing Queue
          </h3>
          <div className="flex items-center space-x-2">
            {/* Filter buttons */}
            <div className="flex space-x-1">
              {[
                { key: 'all', label: `All (${counts.total})` },
                { key: 'active', label: `Active (${counts.active})` },
                { key: 'completed', label: `Done (${counts.completed})` },
                { key: 'failed', label: `Failed (${counts.failed})` },
              ].map(({ key, label }) => (
                <Button
                  key={key}
                  variant={filter === key ? "glassPrimary" : "glassSecondary"}
                  size="sm"
                  onClick={() => setFilter(key)}
                  className="text-xs"
                  disabled={counts[key === 'all' ? 'total' : key] === 0}
                >
                  {label}
                </Button>
              ))}
            </div>
            
            {/* Clear completed button */}
            {counts.completed > 0 && (
              <Button
                variant="glassSecondary"
                size="sm"
                onClick={onClearCompleted}
                className="text-xs"
              >
                Clear Completed
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <ProcessingProgress
              key={job.id}
              job={job}
              onCancel={onCancelJob}
              onRetry={onRetryJob}
              variant="glassSubtle"
            />
          ))}
        </div>

        {jobs.length > maxVisible && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Showing {Math.min(maxVisible, filteredJobs.length)} of {jobs.length} jobs
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { ProcessingProgress, ProcessingQueue };