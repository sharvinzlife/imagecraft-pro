/**
 * Global application state management using React Context
 * Manages user session, UI state, and application-wide data
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
// Note: API service removed, but Clerk auth kept for user management

// Initial state
const initialState = {
  // User and authentication
  user: null,
  isAuthenticated: false,
  authLoading: true,

  // UI state
  theme: localStorage.getItem('theme') || 'light',
  sidebarOpen: false,
  notifications: [],

  // App state
  currentSection: 'converter',
  uploadQueue: [],
  processingJobs: new Map(),

  // Settings
  settings: {
    autoSave: true,
    compressionQuality: 90,
    defaultOutputFormat: 'png',
    enableNotifications: true,
  },

  // Error handling
  globalError: null,
  networkStatus: {
    isOnline: navigator.onLine,
    apiHealthy: true,
  },
};

// Action types
const ActionTypes = {
  // Auth actions
  SET_USER: 'SET_USER',
  SET_AUTH_LOADING: 'SET_AUTH_LOADING',
  LOGOUT: 'LOGOUT',

  // UI actions
  SET_THEME: 'SET_THEME',
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_CURRENT_SECTION: 'SET_CURRENT_SECTION',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  CLEAR_NOTIFICATIONS: 'CLEAR_NOTIFICATIONS',

  // App actions
  ADD_TO_UPLOAD_QUEUE: 'ADD_TO_UPLOAD_QUEUE',
  REMOVE_FROM_UPLOAD_QUEUE: 'REMOVE_FROM_UPLOAD_QUEUE',
  CLEAR_UPLOAD_QUEUE: 'CLEAR_UPLOAD_QUEUE',
  UPDATE_PROCESSING_JOB: 'UPDATE_PROCESSING_JOB',
  REMOVE_PROCESSING_JOB: 'REMOVE_PROCESSING_JOB',

  // Settings actions
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',

  // Error handling
  SET_GLOBAL_ERROR: 'SET_GLOBAL_ERROR',
  CLEAR_GLOBAL_ERROR: 'CLEAR_GLOBAL_ERROR',
  UPDATE_NETWORK_STATUS: 'UPDATE_NETWORK_STATUS',
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        authLoading: false,
      };

    case ActionTypes.SET_AUTH_LOADING:
      return {
        ...state,
        authLoading: action.payload,
      };

    case ActionTypes.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        authLoading: false,
        uploadQueue: [],
        processingJobs: new Map(),
      };

    case ActionTypes.SET_THEME:
      localStorage.setItem('theme', action.payload);
      return {
        ...state,
        theme: action.payload,
      };

    case ActionTypes.TOGGLE_SIDEBAR:
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen,
      };

    case ActionTypes.SET_CURRENT_SECTION:
      return {
        ...state,
        currentSection: action.payload,
      };

    case ActionTypes.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, {
          id: Date.now(),
          timestamp: new Date(),
          ...action.payload,
        }],
      };

    case ActionTypes.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };

    case ActionTypes.CLEAR_NOTIFICATIONS:
      return {
        ...state,
        notifications: [],
      };

    case ActionTypes.ADD_TO_UPLOAD_QUEUE:
      return {
        ...state,
        uploadQueue: [...state.uploadQueue, {
          id: Date.now(),
          file: action.payload.file,
          status: 'pending',
          progress: 0,
          timestamp: new Date(),
        }],
      };

    case ActionTypes.REMOVE_FROM_UPLOAD_QUEUE:
      return {
        ...state,
        uploadQueue: state.uploadQueue.filter(item => item.id !== action.payload),
      };

    case ActionTypes.CLEAR_UPLOAD_QUEUE:
      return {
        ...state,
        uploadQueue: [],
      };

    case ActionTypes.UPDATE_PROCESSING_JOB:
      const newJobs = new Map(state.processingJobs);
      const existingJob = newJobs.get(action.payload.id);
      newJobs.set(action.payload.id, {
        ...existingJob,
        ...action.payload,
        lastUpdated: new Date(),
      });
      return {
        ...state,
        processingJobs: newJobs,
      };

    case ActionTypes.REMOVE_PROCESSING_JOB:
      const updatedJobs = new Map(state.processingJobs);
      updatedJobs.delete(action.payload);
      return {
        ...state,
        processingJobs: updatedJobs,
      };

    case ActionTypes.UPDATE_SETTINGS:
      const newSettings = { ...state.settings, ...action.payload };
      localStorage.setItem('app_settings', JSON.stringify(newSettings));
      return {
        ...state,
        settings: newSettings,
      };

    case ActionTypes.SET_GLOBAL_ERROR:
      return {
        ...state,
        globalError: action.payload,
      };

    case ActionTypes.CLEAR_GLOBAL_ERROR:
      return {
        ...state,
        globalError: null,
      };

    case ActionTypes.UPDATE_NETWORK_STATUS:
      return {
        ...state,
        networkStatus: { ...state.networkStatus, ...action.payload },
      };

    default:
      return state;
  }
}

// Context
const AppContext = createContext();

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, {
    ...initialState,
    settings: {
      ...initialState.settings,
      ...JSON.parse(localStorage.getItem('app_settings') || '{}'),
    },
  });

  // Authentication simplified - using Clerk for auth instead of API service
  useEffect(() => {
    // Clerk handles auth initialization, so we just set loading to false
    dispatch({ type: ActionTypes.SET_AUTH_LOADING, payload: false });
  }, []);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      dispatch({ 
        type: ActionTypes.UPDATE_NETWORK_STATUS, 
        payload: { isOnline: true } 
      });
    };

    const handleOffline = () => {
      dispatch({ 
        type: ActionTypes.UPDATE_NETWORK_STATUS, 
        payload: { isOnline: false, apiHealthy: false } 
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-remove notifications after timeout
  useEffect(() => {
    const timeouts = state.notifications.map(notification => {
      if (notification.autoRemove !== false) {
        return setTimeout(() => {
          dispatch({ 
            type: ActionTypes.REMOVE_NOTIFICATION, 
            payload: notification.id 
          });
        }, notification.duration || 5000);
      }
      return null;
    }).filter(Boolean);

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [state.notifications]);

  // Action creators
  const actions = {
    // Auth actions
    setUser: (user) => dispatch({ type: ActionTypes.SET_USER, payload: user }),
    setAuthLoading: (loading) => dispatch({ type: ActionTypes.SET_AUTH_LOADING, payload: loading }),
    logout: () => {
      dispatch({ type: ActionTypes.LOGOUT });
    },

    // UI actions
    setTheme: (theme) => dispatch({ type: ActionTypes.SET_THEME, payload: theme }),
    toggleSidebar: () => dispatch({ type: ActionTypes.TOGGLE_SIDEBAR }),
    setCurrentSection: (section) => dispatch({ type: ActionTypes.SET_CURRENT_SECTION, payload: section }),

    // Notification actions
    addNotification: (notification) => dispatch({ type: ActionTypes.ADD_NOTIFICATION, payload: notification }),
    removeNotification: (id) => dispatch({ type: ActionTypes.REMOVE_NOTIFICATION, payload: id }),
    clearNotifications: () => dispatch({ type: ActionTypes.CLEAR_NOTIFICATIONS }),

    // Upload queue actions
    addToUploadQueue: (file) => dispatch({ type: ActionTypes.ADD_TO_UPLOAD_QUEUE, payload: { file } }),
    removeFromUploadQueue: (id) => dispatch({ type: ActionTypes.REMOVE_FROM_UPLOAD_QUEUE, payload: id }),
    clearUploadQueue: () => dispatch({ type: ActionTypes.CLEAR_UPLOAD_QUEUE }),

    // Processing job actions
    updateProcessingJob: (job) => dispatch({ type: ActionTypes.UPDATE_PROCESSING_JOB, payload: job }),
    removeProcessingJob: (id) => dispatch({ type: ActionTypes.REMOVE_PROCESSING_JOB, payload: id }),

    // Settings actions
    updateSettings: (settings) => dispatch({ type: ActionTypes.UPDATE_SETTINGS, payload: settings }),

    // Error handling actions
    setGlobalError: (error) => dispatch({ type: ActionTypes.SET_GLOBAL_ERROR, payload: error }),
    clearGlobalError: () => dispatch({ type: ActionTypes.CLEAR_GLOBAL_ERROR }),
    updateNetworkStatus: (status) => dispatch({ type: ActionTypes.UPDATE_NETWORK_STATUS, payload: status }),
  };

  const value = {
    state,
    actions,
    dispatch,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to use the app context
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}

// Selector hooks for specific parts of the state
export function useAuth() {
  const { state, actions } = useAppContext();
  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    authLoading: state.authLoading,
    setUser: actions.setUser,
    logout: actions.logout,
  };
}

export function useNotifications() {
  const { state, actions } = useAppContext();
  return {
    notifications: state.notifications,
    addNotification: actions.addNotification,
    removeNotification: actions.removeNotification,
    clearNotifications: actions.clearNotifications,
  };
}

export function useUploadQueue() {
  const { state, actions } = useAppContext();
  return {
    uploadQueue: state.uploadQueue,
    addToUploadQueue: actions.addToUploadQueue,
    removeFromUploadQueue: actions.removeFromUploadQueue,
    clearUploadQueue: actions.clearUploadQueue,
  };
}

export function useProcessingJobs() {
  const { state, actions } = useAppContext();
  return {
    processingJobs: Array.from(state.processingJobs.values()),
    updateProcessingJob: actions.updateProcessingJob,
    removeProcessingJob: actions.removeProcessingJob,
  };
}

export function useSettings() {
  const { state, actions } = useAppContext();
  return {
    settings: state.settings,
    updateSettings: actions.updateSettings,
  };
}

export function useNetworkStatus() {
  const { state, actions } = useAppContext();
  return {
    networkStatus: state.networkStatus,
    updateNetworkStatus: actions.updateNetworkStatus,
  };
}

export { ActionTypes };