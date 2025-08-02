/**
 * Project Management Store
 * Manages project state, collaboration, and file operations
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  Project,
  ProjectFile,
  ProjectVersion,
  ProjectComment,
  ProjectActivity,
  ProjectSearchQuery,
  ProjectSearchResult,
  ExportJob,
  ProcessingRecord,
  ProjectWorkflow,
  WorkflowExecution
} from '../types/project';
import { projectService } from '../services/projectService';

interface ProjectState {
  // Project data
  projects: Project[];
  currentProject: Project | null;
  projectFiles: Record<string, ProjectFile[]>;
  projectVersions: Record<string, ProjectVersion[]>;
  projectComments: Record<string, ProjectComment[]>;
  
  // Processing data
  processingRecords: ProcessingRecord[];
  exportJobs: ExportJob[];
  
  // Workflow data
  workflows: ProjectWorkflow[];
  workflowExecutions: WorkflowExecution[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedProjectId: string | null;
  viewMode: 'grid' | 'list';
  
  // Real-time updates
  websockets: Record<string, WebSocket>;
  
  // Actions - Project CRUD
  createProject: (data: {
    name: string;
    description?: string;
    type: string;
    template_id?: string;
  }) => Promise<Project>;
  loadProjects: (query?: ProjectSearchQuery) => Promise<void>;
  loadProject: (id: string) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (id: string, name?: string) => Promise<Project>;
  
  // File management
  uploadFile: (projectId: string, file: File, onProgress?: (progress: number) => void) => Promise<ProjectFile>;
  loadProjectFiles: (projectId: string) => Promise<void>;
  updateFile: (fileId: string, updates: Partial<ProjectFile>) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  downloadFile: (fileId: string, version?: string) => Promise<Blob>;
  
  // Processing operations
  startProcessing: (fileId: string, operation: string, parameters: any) => Promise<ProcessingRecord>;
  loadProcessingRecords: (projectId: string) => Promise<void>;
  cancelProcessing: (recordId: string) => Promise<void>;
  
  // Version management
  createVersion: (projectId: string, name?: string, description?: string) => Promise<ProjectVersion>;
  loadVersions: (projectId: string) => Promise<void>;
  rollbackToVersion: (versionId: string) => Promise<void>;
  compareVersions: (versionId1: string, versionId2: string) => Promise<any>;
  
  // Collaboration
  addCollaborator: (projectId: string, email: string, role: string, message?: string) => Promise<void>;
  updateCollaboratorRole: (projectId: string, userId: string, role: string) => Promise<void>;
  removeCollaborator: (projectId: string, userId: string) => Promise<void>;
  
  // Comments
  addComment: (projectId: string, content: string, fileId?: string, position?: any) => Promise<ProjectComment>;
  loadComments: (projectId: string, fileId?: string) => Promise<void>;
  updateComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  resolveComment: (commentId: string) => Promise<void>;
  
  // Sharing
  createShareLink: (projectId: string, options: any) => Promise<any>;
  revokeShareLink: (shareId: string) => Promise<void>;
  
  // Export
  createExport: (projectId: string, settings: any) => Promise<ExportJob>;
  loadExportJobs: (projectId: string) => Promise<void>;
  downloadExport: (jobId: string) => Promise<Blob>;
  cancelExport: (jobId: string) => Promise<void>;
  
  // Workflows
  createWorkflow: (data: any) => Promise<ProjectWorkflow>;
  loadWorkflows: (projectId?: string) => Promise<void>;
  executeWorkflow: (workflowId: string, projectId: string) => Promise<WorkflowExecution>;
  
  // Real-time updates
  connectToProject: (projectId: string) => void;
  disconnectFromProject: (projectId: string) => void;
  
  // UI actions
  setSelectedProject: (projectId: string | null) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setSearchQuery: (query: string) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Utility functions
  getProjectById: (id: string) => Project | undefined;
  getFilesByProject: (projectId: string) => ProjectFile[];
  getVersionsByProject: (projectId: string) => ProjectVersion[];
  getCommentsByProject: (projectId: string, fileId?: string) => ProjectComment[];
}

export const useProjectStore = create<ProjectState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    projects: [],
    currentProject: null,
    projectFiles: {},
    projectVersions: {},
    projectComments: {},
    processingRecords: [],
    exportJobs: [],
    workflows: [],
    workflowExecutions: [],
    isLoading: false,
    error: null,
    searchQuery: '',
    selectedProjectId: null,
    viewMode: 'grid',
    websockets: {},

    // Project CRUD operations
    createProject: async (data) => {
      set({ isLoading: true, error: null });
      
      try {
        const project = await projectService.createProject(data);
        
        set(state => ({
          projects: [project, ...state.projects],
          currentProject: project,
          selectedProjectId: project.id,
          isLoading: false
        }));
        
        return project;
      } catch (error: any) {
        set({
          error: error.message || 'Failed to create project',
          isLoading: false
        });
        throw error;
      }
    },

    loadProjects: async (query) => {
      set({ isLoading: true, error: null });
      
      try {
        const result = query 
          ? await projectService.searchProjects(query)
          : await projectService.getMyProjects();
        
        const projects = 'projects' in result ? result.projects : result;
        
        set({
          projects,
          isLoading: false
        });
      } catch (error: any) {
        set({
          error: error.message || 'Failed to load projects',
          isLoading: false
        });
      }
    },

    loadProject: async (id: string) => {
      set({ isLoading: true, error: null });
      
      try {
        const project = await projectService.getProject(id);
        
        set({
          currentProject: project,
          selectedProjectId: id,
          isLoading: false
        });
        
        // Load related data
        await Promise.all([
          get().loadProjectFiles(id),
          get().loadVersions(id),
          get().loadComments(id)
        ]);
        
        return project;
      } catch (error: any) {
        set({
          error: error.message || 'Failed to load project',
          isLoading: false
        });
        throw error;
      }
    },

    updateProject: async (id: string, updates: Partial<Project>) => {
      try {
        const updatedProject = await projectService.updateProject(id, updates);
        
        set(state => ({
          projects: state.projects.map(p => p.id === id ? updatedProject : p),
          currentProject: state.currentProject?.id === id ? updatedProject : state.currentProject
        }));
      } catch (error: any) {
        set({ error: error.message || 'Failed to update project' });
        throw error;
      }
    },

    deleteProject: async (id: string) => {
      set({ isLoading: true, error: null });
      
      try {
        await projectService.deleteProject(id);
        
        set(state => ({
          projects: state.projects.filter(p => p.id !== id),
          currentProject: state.currentProject?.id === id ? null : state.currentProject,
          selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId,
          isLoading: false
        }));
        
        // Clean up related data
        set(state => {
          const newProjectFiles = { ...state.projectFiles };
          const newProjectVersions = { ...state.projectVersions };
          const newProjectComments = { ...state.projectComments };
          
          delete newProjectFiles[id];
          delete newProjectVersions[id];
          delete newProjectComments[id];
          
          return {
            projectFiles: newProjectFiles,
            projectVersions: newProjectVersions,
            projectComments: newProjectComments
          };
        });
        
        // Disconnect WebSocket
        get().disconnectFromProject(id);
      } catch (error: any) {
        set({
          error: error.message || 'Failed to delete project',
          isLoading: false
        });
        throw error;
      }
    },

    duplicateProject: async (id: string, name?: string) => {
      set({ isLoading: true, error: null });
      
      try {
        const duplicatedProject = await projectService.duplicateProject(id, name);
        
        set(state => ({
          projects: [duplicatedProject, ...state.projects],
          isLoading: false
        }));
        
        return duplicatedProject;
      } catch (error: any) {
        set({
          error: error.message || 'Failed to duplicate project',
          isLoading: false
        });
        throw error;
      }
    },

    // File management
    uploadFile: async (projectId: string, file: File, onProgress?: (progress: number) => void) => {
      try {
        const uploadedFile = await projectService.uploadFile(projectId, file, onProgress);
        
        set(state => ({
          projectFiles: {
            ...state.projectFiles,
            [projectId]: [...(state.projectFiles[projectId] || []), uploadedFile]
          }
        }));
        
        return uploadedFile;
      } catch (error: any) {
        set({ error: error.message || 'Failed to upload file' });
        throw error;
      }
    },

    loadProjectFiles: async (projectId: string) => {
      try {
        const files = await projectService.getProjectFiles(projectId);
        
        set(state => ({
          projectFiles: {
            ...state.projectFiles,
            [projectId]: files
          }
        }));
      } catch (error: any) {
        console.error('Failed to load project files:', error);
      }
    },

    updateFile: async (fileId: string, updates: Partial<ProjectFile>) => {
      try {
        const updatedFile = await projectService.updateFile(fileId, updates);
        
        set(state => {
          const newProjectFiles = { ...state.projectFiles };
          
          Object.keys(newProjectFiles).forEach(projectId => {
            newProjectFiles[projectId] = newProjectFiles[projectId].map(file =>
              file.id === fileId ? updatedFile : file
            );
          });
          
          return { projectFiles: newProjectFiles };
        });
      } catch (error: any) {
        set({ error: error.message || 'Failed to update file' });
        throw error;
      }
    },

    deleteFile: async (fileId: string) => {
      try {
        await projectService.deleteFile(fileId);
        
        set(state => {
          const newProjectFiles = { ...state.projectFiles };
          
          Object.keys(newProjectFiles).forEach(projectId => {
            newProjectFiles[projectId] = newProjectFiles[projectId].filter(file => file.id !== fileId);
          });
          
          return { projectFiles: newProjectFiles };
        });
      } catch (error: any) {
        set({ error: error.message || 'Failed to delete file' });
        throw error;
      }
    },

    downloadFile: async (fileId: string, version?: string) => {
      try {
        return await projectService.downloadFile(fileId, version);
      } catch (error: any) {
        set({ error: error.message || 'Failed to download file' });
        throw error;
      }
    },

    // Processing operations
    startProcessing: async (fileId: string, operation: string, parameters: any) => {
      try {
        const record = await projectService.startProcessing(fileId, operation, parameters);
        
        set(state => ({
          processingRecords: [record, ...state.processingRecords]
        }));
        
        return record;
      } catch (error: any) {
        set({ error: error.message || 'Failed to start processing' });
        throw error;
      }
    },

    loadProcessingRecords: async (projectId: string) => {
      try {
        const { records } = await projectService.getProcessingHistory(projectId);
        set({ processingRecords: records });
      } catch (error: any) {
        console.error('Failed to load processing records:', error);
      }
    },

    cancelProcessing: async (recordId: string) => {
      try {
        await projectService.cancelProcessing(recordId);
        
        set(state => ({
          processingRecords: state.processingRecords.map(record =>
            record.id === recordId ? { ...record, status: 'cancelled' } : record
          )
        }));
      } catch (error: any) {
        set({ error: error.message || 'Failed to cancel processing' });
        throw error;
      }
    },

    // Version management
    createVersion: async (projectId: string, name?: string, description?: string) => {
      try {
        const version = await projectService.createVersion(projectId, name, description);
        
        set(state => ({
          projectVersions: {
            ...state.projectVersions,
            [projectId]: [version, ...(state.projectVersions[projectId] || [])]
          }
        }));
        
        return version;
      } catch (error: any) {
        set({ error: error.message || 'Failed to create version' });
        throw error;
      }
    },

    loadVersions: async (projectId: string) => {
      try {
        const versions = await projectService.getVersions(projectId);
        
        set(state => ({
          projectVersions: {
            ...state.projectVersions,
            [projectId]: versions
          }
        }));
      } catch (error: any) {
        console.error('Failed to load versions:', error);
      }
    },

    rollbackToVersion: async (versionId: string) => {
      set({ isLoading: true, error: null });
      
      try {
        const updatedProject = await projectService.rollbackToVersion(versionId);
        
        set(state => ({
          currentProject: updatedProject,
          projects: state.projects.map(p => p.id === updatedProject.id ? updatedProject : p),
          isLoading: false
        }));
        
        // Reload project data
        if (updatedProject.id) {
          await get().loadProjectFiles(updatedProject.id);
        }
      } catch (error: any) {
        set({
          error: error.message || 'Failed to rollback to version',
          isLoading: false
        });
        throw error;
      }
    },

    compareVersions: async (versionId1: string, versionId2: string) => {
      try {
        return await projectService.compareVersions(versionId1, versionId2);
      } catch (error: any) {
        set({ error: error.message || 'Failed to compare versions' });
        throw error;
      }
    },

    // Collaboration
    addCollaborator: async (projectId: string, email: string, role: string, message?: string) => {
      try {
        await projectService.addCollaborator(projectId, email, role as any, message);
        
        // Reload project to get updated collaborators
        await get().loadProject(projectId);
      } catch (error: any) {
        set({ error: error.message || 'Failed to add collaborator' });
        throw error;
      }
    },

    updateCollaboratorRole: async (projectId: string, userId: string, role: string) => {
      try {
        await projectService.updateCollaboratorRole(projectId, userId, role as any);
        
        // Reload project to get updated collaborators
        await get().loadProject(projectId);
      } catch (error: any) {
        set({ error: error.message || 'Failed to update collaborator role' });
        throw error;
      }
    },

    removeCollaborator: async (projectId: string, userId: string) => {
      try {
        await projectService.removeCollaborator(projectId, userId);
        
        // Reload project to get updated collaborators
        await get().loadProject(projectId);
      } catch (error: any) {
        set({ error: error.message || 'Failed to remove collaborator' });
        throw error;
      }
    },

    // Comments
    addComment: async (projectId: string, content: string, fileId?: string, position?: any) => {
      try {
        const comment = await projectService.addComment(projectId, content, fileId, position);
        
        const key = fileId ? `${projectId}_${fileId}` : projectId;
        set(state => ({
          projectComments: {
            ...state.projectComments,
            [key]: [comment, ...(state.projectComments[key] || [])]
          }
        }));
        
        return comment;
      } catch (error: any) {
        set({ error: error.message || 'Failed to add comment' });
        throw error;
      }
    },

    loadComments: async (projectId: string, fileId?: string) => {
      try {
        const comments = await projectService.getComments(projectId, fileId);
        
        const key = fileId ? `${projectId}_${fileId}` : projectId;
        set(state => ({
          projectComments: {
            ...state.projectComments,
            [key]: comments
          }
        }));
      } catch (error: any) {
        console.error('Failed to load comments:', error);
      }
    },

    updateComment: async (commentId: string, content: string) => {
      try {
        const updatedComment = await projectService.updateComment(commentId, content);
        
        set(state => {
          const newProjectComments = { ...state.projectComments };
          
          Object.keys(newProjectComments).forEach(key => {
            newProjectComments[key] = newProjectComments[key].map(comment =>
              comment.id === commentId ? updatedComment : comment
            );
          });
          
          return { projectComments: newProjectComments };
        });
      } catch (error: any) {
        set({ error: error.message || 'Failed to update comment' });
        throw error;
      }
    },

    deleteComment: async (commentId: string) => {
      try {
        await projectService.deleteComment(commentId);
        
        set(state => {
          const newProjectComments = { ...state.projectComments };
          
          Object.keys(newProjectComments).forEach(key => {
            newProjectComments[key] = newProjectComments[key].filter(comment => comment.id !== commentId);
          });
          
          return { projectComments: newProjectComments };
        });
      } catch (error: any) {
        set({ error: error.message || 'Failed to delete comment' });
        throw error;
      }
    },

    resolveComment: async (commentId: string) => {
      try {
        await projectService.resolveComment(commentId);
        
        set(state => {
          const newProjectComments = { ...state.projectComments };
          
          Object.keys(newProjectComments).forEach(key => {
            newProjectComments[key] = newProjectComments[key].map(comment =>
              comment.id === commentId ? { ...comment, status: 'resolved' } : comment
            );
          });
          
          return { projectComments: newProjectComments };
        });
      } catch (error: any) {
        set({ error: error.message || 'Failed to resolve comment' });
        throw error;
      }
    },

    // Sharing
    createShareLink: async (projectId: string, options: any) => {
      try {
        return await projectService.createShareLink(projectId, options);
      } catch (error: any) {
        set({ error: error.message || 'Failed to create share link' });
        throw error;
      }
    },

    revokeShareLink: async (shareId: string) => {
      try {
        await projectService.revokeShareLink(shareId);
      } catch (error: any) {
        set({ error: error.message || 'Failed to revoke share link' });
        throw error;
      }
    },

    // Export
    createExport: async (projectId: string, settings: any) => {
      try {
        const exportJob = await projectService.createExport(projectId, settings);
        
        set(state => ({
          exportJobs: [exportJob, ...state.exportJobs]
        }));
        
        return exportJob;
      } catch (error: any) {
        set({ error: error.message || 'Failed to create export' });
        throw error;
      }
    },

    loadExportJobs: async (projectId: string) => {
      try {
        const { jobs } = await projectService.getExportJobs(projectId);
        set({ exportJobs: jobs });
      } catch (error: any) {
        console.error('Failed to load export jobs:', error);
      }
    },

    downloadExport: async (jobId: string) => {
      try {
        return await projectService.downloadExport(jobId);
      } catch (error: any) {
        set({ error: error.message || 'Failed to download export' });
        throw error;
      }
    },

    cancelExport: async (jobId: string) => {
      try {
        await projectService.cancelExport(jobId);
        
        set(state => ({
          exportJobs: state.exportJobs.map(job =>
            job.id === jobId ? { ...job, status: 'cancelled' } : job
          )
        }));
      } catch (error: any) {
        set({ error: error.message || 'Failed to cancel export' });
        throw error;
      }
    },

    // Workflows
    createWorkflow: async (data: any) => {
      try {
        const workflow = await projectService.createWorkflow(data);
        
        set(state => ({
          workflows: [workflow, ...state.workflows]
        }));
        
        return workflow;
      } catch (error: any) {
        set({ error: error.message || 'Failed to create workflow' });
        throw error;
      }
    },

    loadWorkflows: async (projectId?: string) => {
      try {
        const workflows = await projectService.getWorkflows(projectId);
        set({ workflows });
      } catch (error: any) {
        console.error('Failed to load workflows:', error);
      }
    },

    executeWorkflow: async (workflowId: string, projectId: string) => {
      try {
        const execution = await projectService.executeWorkflow(workflowId, projectId);
        
        set(state => ({
          workflowExecutions: [execution, ...state.workflowExecutions]
        }));
        
        return execution;
      } catch (error: any) {
        set({ error: error.message || 'Failed to execute workflow' });
        throw error;
      }
    },

    // Real-time updates
    connectToProject: (projectId: string) => {
      const { websockets } = get();
      
      if (websockets[projectId]) {
        return; // Already connected
      }
      
      try {
        const ws = projectService.createProjectWebSocket(projectId);
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'file_updated':
              // Update file in store
              set(state => {
                const newProjectFiles = { ...state.projectFiles };
                if (newProjectFiles[projectId]) {
                  newProjectFiles[projectId] = newProjectFiles[projectId].map(file =>
                    file.id === data.file.id ? data.file : file
                  );
                }
                return { projectFiles: newProjectFiles };
              });
              break;
              
            case 'comment_added':
              // Add comment to store
              const key = data.comment.file_id ? `${projectId}_${data.comment.file_id}` : projectId;
              set(state => ({
                projectComments: {
                  ...state.projectComments,
                  [key]: [data.comment, ...(state.projectComments[key] || [])]
                }
              }));
              break;
              
            case 'processing_updated':
              // Update processing record
              set(state => ({
                processingRecords: state.processingRecords.map(record =>
                  record.id === data.record.id ? data.record : record
                )
              }));
              break;
          }
        };
        
        ws.onclose = () => {
          // Remove from websockets
          set(state => {
            const newWebsockets = { ...state.websockets };
            delete newWebsockets[projectId];
            return { websockets: newWebsockets };
          });
        };
        
        set(state => ({
          websockets: {
            ...state.websockets,
            [projectId]: ws
          }
        }));
      } catch (error) {
        console.error('Failed to connect to project WebSocket:', error);
      }
    },

    disconnectFromProject: (projectId: string) => {
      const { websockets } = get();
      const ws = websockets[projectId];
      
      if (ws) {
        ws.close();
        
        set(state => {
          const newWebsockets = { ...state.websockets };
          delete newWebsockets[projectId];
          return { websockets: newWebsockets };
        });
      }
    },

    // UI actions
    setSelectedProject: (projectId: string | null) => {
      set({ selectedProjectId: projectId });
    },

    setViewMode: (mode: 'grid' | 'list') => {
      set({ viewMode: mode });
    },

    setSearchQuery: (query: string) => {
      set({ searchQuery: query });
    },

    setError: (error: string | null) => {
      set({ error });
    },

    clearError: () => {
      set({ error: null });
    },

    // Utility functions
    getProjectById: (id: string) => {
      return get().projects.find(p => p.id === id);
    },

    getFilesByProject: (projectId: string) => {
      return get().projectFiles[projectId] || [];
    },

    getVersionsByProject: (projectId: string) => {
      return get().projectVersions[projectId] || [];
    },

    getCommentsByProject: (projectId: string, fileId?: string) => {
      const key = fileId ? `${projectId}_${fileId}` : projectId;
      return get().projectComments[key] || [];
    }
  }))
);

// Subscribe to selected project changes and manage WebSocket connections
useProjectStore.subscribe(
  (state) => state.selectedProjectId,
  (selectedProjectId, previousSelectedProjectId) => {
    const store = useProjectStore.getState();
    
    // Disconnect from previous project
    if (previousSelectedProjectId) {
      store.disconnectFromProject(previousSelectedProjectId);
    }
    
    // Connect to new project
    if (selectedProjectId) {
      store.connectToProject(selectedProjectId);
    }
  }
);

// Clean up WebSocket connections on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    const { websockets } = useProjectStore.getState();
    Object.values(websockets).forEach(ws => ws.close());
  });
}