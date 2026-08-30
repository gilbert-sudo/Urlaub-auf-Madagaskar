import { configureStore } from '@reduxjs/toolkit';
import tripsReducer from './slices/tripsSlice';
import clientsReducer from './slices/clientsSlice';
import hotelsReducer from './slices/hotelsSlice';
import driversReducer from './slices/driversSlice';
import authReducer from './slices/authSlice';

// Persistence utilities
const loadState = () => {
  try {
    const serializedState = localStorage.getItem('klaus_app_state');
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return undefined;
  }
};

const saveState = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem('klaus_app_state', serializedState);
  } catch {
    // ignore write errors
  }
};

const persistedState = loadState();

export const store = configureStore({
  reducer: {
    trips: tripsReducer,
    clients: clientsReducer,
    hotels: hotelsReducer,
    drivers: driversReducer,
    auth: authReducer
  },
  preloadedState: persistedState
});

store.subscribe(() => {
  saveState(store.getState());
});
