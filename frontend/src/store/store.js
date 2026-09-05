import { configureStore } from '@reduxjs/toolkit';
import tripsReducer from './slices/tripsSlice';
import clientsReducer from './slices/clientsSlice';
import driversReducer from './slices/driversSlice';
import hotelsReducer from './slices/hotelsSlice';
import authReducer from './slices/authSlice';
import itineraryReducer from './slices/itinerarySlice';

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
    drivers: driversReducer,
    hotels: hotelsReducer,
    auth: authReducer,
    itinerary: itineraryReducer,
  },
  preloadedState: persistedState
});

store.subscribe(() => {
  saveState(store.getState());
});
