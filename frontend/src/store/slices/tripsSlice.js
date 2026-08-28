import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const fetchTrips = createAsyncThunk('trips/fetchTrips', async () => {
  const response = await axios.get(`${API_URL}/api/trips`);
  return response.data;
});

export const fetchTripById = createAsyncThunk('trips/fetchTripById', async (id) => {
  const response = await axios.get(`${API_URL}/api/trips/${id}`);
  return response.data;
});

export const createTrip = createAsyncThunk('trips/createTrip', async (tripData) => {
  const response = await axios.post(`${API_URL}/api/trips`, tripData);
  return response.data;
});

const tripsSlice = createSlice({
  name: 'trips',
  initialState: {
    items: [],
    currentTrip: null,
    loading: false,
    error: null,
    status: 'idle'
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrips.pending, (state) => {
        state.loading = true;
        state.status = 'loading';
      })
      .addCase(fetchTrips.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.status = 'succeeded';
      })
      .addCase(fetchTrips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
        state.status = 'failed';
      })
      .addCase(fetchTripById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTripById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTrip = action.payload;
      })
      .addCase(createTrip.pending, (state) => {
        state.loading = true;
      })
      .addCase(createTrip.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(createTrip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export default tripsSlice.reducer;
