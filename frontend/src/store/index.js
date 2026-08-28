import { configureStore } from '@reduxjs/toolkit';
import tripsReducer from './slices/tripsSlice';
import clientsReducer from './slices/clientsSlice';
import hotelsReducer from './slices/hotelsSlice';
import driversReducer from './slices/driversSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    trips: tripsReducer,
    clients: clientsReducer,
    hotels: hotelsReducer,
    drivers: driversReducer,
    auth: authReducer
  },
});
