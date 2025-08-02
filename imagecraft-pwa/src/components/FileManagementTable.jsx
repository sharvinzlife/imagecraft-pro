import React, { useState, useMemo } from 'react';
import { 
  Image, 
  MoreVertical, 
  Download, 
  Share2, 
  Trash2, 
  Eye, 
  Edit2,
  Calendar,
  FileImage,
  HardDrive,
  Filter,
  SortAsc,
  SortDesc,
  Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from './ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { Progress } from './ui/progress';
import { cn } from '../lib/utils';

/**
 * FileManagementTable - Complete file management interface
 * Handles user's uploaded files, processing history, and file operations
 */
const FileManagementTable = ({ 
  files = [], 
  loading = false,
  onDownload,
  onShare,
  onDelete,
  onPreview,
  onReprocess,
  className 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter and sort files
  const processedFiles = useMemo(() => {
    let filtered = files;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.originalName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(file => file.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle date sorting
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      // Handle size sorting
      if (sortBy === 'size') {
        aValue = parseInt(aValue) || 0;
        bValue = parseInt(bValue) || 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [files, searchQuery, sortBy, sortOrder, statusFilter]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'completed': { variant: 'success', label: 'Completed' },
      'processing': { variant: 'processing', label: 'Processing' },
      'failed': { variant: 'error', label: 'Failed' },
      'queued': { variant: 'warning', label: 'Queued' },
      'uploaded': { variant: 'info', label: 'Uploaded' },
    };

    const config = statusConfig[status] || { variant: 'default', label: status };
    
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />;
  };

  const statusCounts = useMemo(() => {
    const counts = files.reduce((acc, file) => {
      acc[file.status] = (acc[file.status] || 0) + 1;
      return acc;
    }, {});
    counts.all = files.length;
    return counts;
  }, [files]);

  return (
    <Card variant="glass" className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <FileImage className="w-5 h-5 text-orange-600" />
              <span>File Management</span>
            </CardTitle>
            <CardDescription>
              Manage your uploaded images and processing history
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="glassSecondary" className="text-xs">
              {files.length} files
            </Badge>
            <Badge variant="glassSecondary" className="text-xs">
              {formatFileSize(files.reduce((acc, file) => acc + (file.size || 0), 0))} total
            </Badge>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 glass-input"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="glassSecondary" size="sm" className="flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span>Status</span>
                  {statusFilter !== 'all' && (
                    <Badge variant="orange" className="text-xs ml-1">
                      {statusCounts[statusFilter] || 0}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                  All Files ({statusCounts.all || 0})
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter('completed')}>
                  Completed ({statusCounts.completed || 0})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('processing')}>
                  Processing ({statusCounts.processing || 0})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('failed')}>
                  Failed ({statusCounts.failed || 0})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('queued')}>
                  Queued ({statusCounts.queued || 0})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {/* Loading skeleton */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-3 bg-white/10 rounded-lg animate-pulse">
                <div className="w-12 h-12 bg-white/20 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/20 rounded w-3/4" />
                  <div className="h-3 bg-white/20 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : processedFiles.length === 0 ? (
          <div className="text-center py-12">
            <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || statusFilter !== 'all' ? 'No files match your filters' : 'No files uploaded yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Upload your first image to get started'
              }
            </p>
            {(searchQuery || statusFilter !== 'all') && (
              <Button
                variant="glassSecondary"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-orange-500/20 overflow-hidden backdrop-blur-sm bg-white/5">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-white/10">
                  <TableHead className="w-12"></TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-orange-600 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Name</span>
                      {getSortIcon('name')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-orange-600 transition-colors"
                    onClick={() => handleSort('size')}
                  >
                    <div className="flex items-center space-x-1">
                      <HardDrive className="w-4 h-4" />
                      <span>Size</span>
                      {getSortIcon('size')}
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-orange-600 transition-colors"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Created</span>
                      {getSortIcon('createdAt')}
                    </div>
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedFiles.map((file) => (
                  <TableRow key={file.id} className="hover:bg-white/5 transition-colors">
                    <TableCell>
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                        {file.thumbnailUrl ? (
                          <img 
                            src={file.thumbnailUrl} 
                            alt={file.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <Image className="w-5 h-5 text-orange-600" />
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        {file.originalName && file.originalName !== file.name && (
                          <p className="text-xs text-gray-500 truncate">
                            Original: {file.originalName}
                          </p>
                        )}
                        {file.format && (
                          <p className="text-xs text-gray-500">
                            {file.format.toUpperCase()} • {file.width}×{file.height}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <span className="text-sm text-gray-900">
                        {formatFileSize(file.size)}
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        {getStatusBadge(file.status)}
                        {file.status === 'processing' && file.progress !== undefined && (
                          <Progress 
                            value={file.progress} 
                            variant="glass" 
                            size="sm" 
                            className="w-16"
                          />
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {formatDate(file.createdAt)}
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="glassSecondary" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            aria-label={`Actions for ${file.name}`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {file.url && (
                            <DropdownMenuItem onClick={() => onPreview?.(file)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                          )}
                          {file.status === 'completed' && file.resultUrl && (
                            <DropdownMenuItem onClick={() => onDownload?.(file)}>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                          )}
                          {file.status === 'completed' && (
                            <DropdownMenuItem onClick={() => onShare?.(file)}>
                              <Share2 className="w-4 h-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                          )}
                          {file.status === 'failed' && (
                            <DropdownMenuItem onClick={() => onReprocess?.(file)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Reprocess
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => onDelete?.(file)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileManagementTable;