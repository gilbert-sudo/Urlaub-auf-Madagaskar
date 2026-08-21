import { configureStore } from '@reduxjs/toolkit';
import tripsReducer from './slices/tripsSlice';
import clientsReducer from './slices/clientsSlice';
import driversReducer from './slices/driversSlice';
import hotelsReducer from './slices/hotelsSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    trips: tripsReducer,
    clients: clientsReducer,
    drivers: driversReducer,
    hotels: hotelsReducer,
    auth: authReducer,
  },
});
