import { configureStore } from '@reduxjs/toolkit';
import tripReducer from './slices/tripSlice';

export const store = configureStore({
  reducer: {
    trips: tripReducer
  },
});
