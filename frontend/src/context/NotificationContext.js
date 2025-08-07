import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Action Types
const ActionTypes = {
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  MARK_AS_READ: 'MARK_AS_READ',
  MARK_ALL_AS_READ: 'MARK_ALL_AS_READ',
  SET_DRAWER_OPEN: 'SET_DRAWER_OPEN',
  LOAD_NOTIFICATIONS: 'LOAD_NOTIFICATIONS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
};

// Initial State
const initialState = {
  notifications: [],
  unreadCount: 0,
  isDrawerOpen: false,
  isLoading: false,
  error: null,
};

// Reducer
function notificationReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
      
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };
      
    case ActionTypes.LOAD_NOTIFICATIONS:
      const notifications = action.payload || [];
      return {
        ...state,
        notifications,
        unreadCount: notifications.filter(n => !n.read).length,
        isLoading: false,
      };
      
    case ActionTypes.ADD_NOTIFICATION:
      const newNotification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false,
      };
      return {
        ...state,
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
      
    case ActionTypes.REMOVE_NOTIFICATION:
      const filtered = state.notifications.filter(n => n.id !== action.payload);
      return {
        ...state,
        notifications: filtered,
        unreadCount: filtered.filter(n => !n.read).length,
      };
      
    case ActionTypes.MARK_AS_READ: {
      const updated = state.notifications.map(n => 
        n.id === action.payload ? { ...n, read: true } : n
      );
      return {
        ...state,
        notifications: updated,
        unreadCount: updated.filter(n => !n.read).length,
      };
    }
      
    case ActionTypes.MARK_ALL_AS_READ: {
      const allRead = state.notifications.map(n => ({ ...n, read: true }));
      return {
        ...state,
        notifications: allRead,
        unreadCount: 0,
      };
    }
      
    case ActionTypes.SET_DRAWER_OPEN:
      return { ...state, isDrawerOpen: action.payload };
      
    default:
      return state;
  }
}

// Create Context
const NotificationContext = createContext();

// Provider Component
export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  
  // Action Creators
  const loadNotifications = useCallback(async () => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    try {
      // TODO: Replace with actual API call
      // const response = await notificationService.getNotifications();
      // dispatch({ type: ActionTypes.LOAD_NOTIFICATIONS, payload: response.data });
      
      // Mock data for now
      setTimeout(() => {
        dispatch({ 
          type: ActionTypes.LOAD_NOTIFICATIONS, 
          payload: [
            {
              id: '1',
              type: 'order',
              title: 'Order Confirmed',
              message: 'Your order #12345 has been confirmed',
              timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
              read: false,
              metadata: { orderId: '12345' }
            },
            {
              id: '2',
              type: 'promotion',
              title: 'Special Offer',
              message: 'Get 20% off on your next purchase',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
              read: true,
              metadata: { promoCode: 'SAVE20' }
            }
          ]
        });
      }, 500);
    } catch (error) {
      dispatch({ 
        type: ActionTypes.SET_ERROR, 
        payload: error.message || 'Failed to load notifications' 
      });
    }
  }, []);
  
  const addNotification = useCallback((notification) => {
    dispatch({ 
      type: ActionTypes.ADD_NOTIFICATION, 
      payload: notification 
    });
  }, []);
  
  const removeNotification = useCallback((id) => {
    dispatch({ 
      type: ActionTypes.REMOVE_NOTIFICATION, 
      payload: id 
    });
  }, []);
  
  const markAsRead = useCallback((id) => {
    dispatch({ 
      type: ActionTypes.MARK_AS_READ, 
      payload: id 
    });
  }, []);
  
  const markAllAsRead = useCallback(() => {
    dispatch({ type: ActionTypes.MARK_ALL_AS_READ });
  }, []);
  
  const toggleDrawer = useCallback((isOpen) => {
    dispatch({ 
      type: ActionTypes.SET_DRAWER_OPEN, 
      payload: isOpen 
    });
    
    // Mark all as read when opening the drawer
    if (isOpen) {
      markAllAsRead();
    }
  }, [markAllAsRead]);
  
  // Context value
  const value = {
    ...state,
    loadNotifications,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    toggleDrawer,
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom Hook
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
