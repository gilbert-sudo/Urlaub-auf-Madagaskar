import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchTrips = createAsyncThunk('trips/fetchTrips', async () => {
  const response = await axios.get('https://urlaub-auf-madagaskar.onrender.com/api/trips');
  return response.data;
});

export const fetchTripById = createAsyncThunk('trips/fetchTripById', async (id) => {
  const response = await axios.get(`https://urlaub-auf-madagaskar.onrender.com/api/trips/${id}`);
  return response.data;
});

const tripsSlice = createSlice({
  name: 'trips',
  initialState: {
    items: [],
    currentTrip: null,
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrips.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTrips.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTrips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchTripById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTripById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTrip = action.payload;
      });
  }
});

export default tripsSlice.reducer;
