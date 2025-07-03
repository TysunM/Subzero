import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { subscriptionService } from '../services/subscriptionService';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext();

const initialState = {
  subscriptions: [],
  totalMonthlySpend: 0,
  totalYearlySpend: 0,
  upcomingBills: [],
  isLoading: false,
  error: null,
  discoveryInProgress: false,
  lastSyncDate: null,
};

function subscriptionReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_DISCOVERY_LOADING':
      return { ...state, discoveryInProgress: action.payload };
    case 'SET_SUBSCRIPTIONS':
      return {
        ...state,
        subscriptions: action.payload,
        isLoading: false,
        error: null,
      };
    case 'ADD_SUBSCRIPTION':
      return {
        ...state,
        subscriptions: [...state.subscriptions, action.payload],
      };
    case 'UPDATE_SUBSCRIPTION':
      return {
        ...state,
        subscriptions: state.subscriptions.map(sub =>
          sub.id === action.payload.id ? action.payload : sub
        ),
      };
    case 'DELETE_SUBSCRIPTION':
      return {
        ...state,
        subscriptions: state.subscriptions.filter(sub => sub.id !== action.payload),
      };
    case 'SET_SPENDING_TOTALS':
      return {
        ...state,
        totalMonthlySpend: action.payload.monthly,
        totalYearlySpend: action.payload.yearly,
      };
    case 'SET_UPCOMING_BILLS':
      return {
        ...state,
        upcomingBills: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
        discoveryInProgress: false,
      };
    case 'SET_LAST_SYNC':
      return {
        ...state,
        lastSyncDate: action.payload,
      };
    default:
      return state;
  }
}

export function SubscriptionProvider({ children }) {
  const [state, dispatch] = useReducer(subscriptionReducer, initialState);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      loadSubscriptions();
    }
  }, [isAuthenticated, user]);

  const loadSubscriptions = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const subscriptions = await subscriptionService.getSubscriptions();
      dispatch({ type: 'SET_SUBSCRIPTIONS', payload: subscriptions });
      
      // Calculate totals
      const monthly = subscriptions.reduce((sum, sub) => sum + (sub.monthlyAmount || 0), 0);
      const yearly = subscriptions.reduce((sum, sub) => sum + (sub.yearlyAmount || 0), 0);
      dispatch({ type: 'SET_SPENDING_TOTALS', payload: { monthly, yearly } });
      
      // Load upcoming bills
      const upcomingBills = await subscriptionService.getUpcomingBills();
      dispatch({ type: 'SET_UPCOMING_BILLS', payload: upcomingBills });
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const discoverSubscriptions = async (options = {}) => {
    try {
      dispatch({ type: 'SET_DISCOVERY_LOADING', payload: true });
      
      const discoveredSubs = await subscriptionService.discoverSubscriptions({
        includeBankData: options.includeBankData || false,
        includeEmailData: options.includeEmailData || false,
      });
      
      // Add discovered subscriptions to the list
      for (const sub of discoveredSubs) {
        dispatch({ type: 'ADD_SUBSCRIPTION', payload: sub });
      }
      
      dispatch({ type: 'SET_LAST_SYNC', payload: new Date().toISOString() });
      
      // Recalculate totals
      await loadSubscriptions();
      
      return { success: true, count: discoveredSubs.length };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const addSubscription = async (subscriptionData) => {
    try {
      const newSubscription = await subscriptionService.addSubscription(subscriptionData);
      dispatch({ type: 'ADD_SUBSCRIPTION', payload: newSubscription });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const updateSubscription = async (id, subscriptionData) => {
    try {
      const updatedSubscription = await subscriptionService.updateSubscription(id, subscriptionData);
      dispatch({ type: 'UPDATE_SUBSCRIPTION', payload: updatedSubscription });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const deleteSubscription = async (id) => {
    try {
      await subscriptionService.deleteSubscription(id);
      dispatch({ type: 'DELETE_SUBSCRIPTION', payload: id });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const cancelSubscription = async (id, reason) => {
    try {
      const result = await subscriptionService.cancelSubscription(id, reason);
      await loadSubscriptions(); // Refresh the list
      return { success: true, result };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const value = {
    ...state,
    loadSubscriptions,
    discoverSubscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    cancelSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptions() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscriptions must be used within a SubscriptionProvider');
  }
  return context;
}

