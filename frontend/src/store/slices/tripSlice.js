import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  trips: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null
};

const tripSlice = createSlice({
  name: 'trips',
  initialState,
  reducers: {
    setTrips(state, action) {
      state.trips = action.payload;
    },
    addTrip(state, action) {
      state.trips.push(action.payload);
    }
  }
});

export const { setTrips, addTrip } = tripSlice.actions;
export default tripSlice.reducer;
