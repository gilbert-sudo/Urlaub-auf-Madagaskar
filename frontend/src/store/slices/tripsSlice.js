import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Fetch all trips
export const fetchTrips = createAsyncThunk('trips/fetchTrips', async () => {
  const response = await axios.get(`${API_URL}/api/trips`);
  return response.data;
});

// Fetch a single trip by ID
export const fetchTripById = createAsyncThunk('trips/fetchTripById', async (id) => {
  const response = await axios.get(`${API_URL}/api/trips/${id}`);
  return response.data;
});

// Create a new trip
export const createTrip = createAsyncThunk('trips/createTrip', async (tripData) => {
  const response = await axios.post(`${API_URL}/api/trips`, tripData);
  return response.data;
});

// Update an existing trip
export const updateTrip = createAsyncThunk('trips/updateTrip', async ({ id, data }) => {
  const response = await axios.put(`${API_URL}/api/trips/${id}`, data);
  return response.data;
});

// Delete a trip
export const deleteTrip = createAsyncThunk('trips/deleteTrip', async (id) => {
  await axios.delete(`${API_URL}/api/trips/${id}`);
  return id; // return the deleted id for reducer
});

// Generate Share Token
export const shareTrip = createAsyncThunk('trips/shareTrip', async (id) => {
  const response = await axios.post(`${API_URL}/api/trips/${id}/share`);
  return response.data;
});

// Fetch Shared Trip
export const fetchSharedTrip = createAsyncThunk('trips/fetchSharedTrip', async (token) => {
  const response = await axios.get(`${API_URL}/api/trips/shared/${token}`);
  return response.data;
});

const tripsSlice = createSlice({
  name: 'trips',
  initialState: {
    items: [],
    currentTrip: null,
    loading: false,
    error: null,
    status: 'idle',
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // ----- FETCH ALL -----
      .addCase(fetchTrips.pending, (state) => {
        state.loading = true;
        state.status = 'loading';
        state.error = null;
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
      // ----- FETCH ONE -----
      .addCase(fetchTripById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTripById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTrip = action.payload;
      })
      .addCase(fetchTripById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // ----- CREATE -----
      .addCase(createTrip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTrip.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(createTrip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // ----- UPDATE -----
      .addCase(updateTrip.pending, (state) => {
        // We do not set loading=true here to prevent the UI from flashing/remounting
        state.error = null;
      })
      .addCase(updateTrip.fulfilled, (state, action) => {
        const idx = state.items.findIndex((t) => t._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
        if (state.currentTrip && state.currentTrip._id === action.payload._id) {
          state.currentTrip = action.payload;
        }
      })
      .addCase(updateTrip.rejected, (state, action) => {
        state.error = action.error.message;
      })
      // ----- DELETE -----
      .addCase(deleteTrip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTrip.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((t) => t._id !== action.payload);
        if (state.currentTrip && state.currentTrip._id === action.payload) {
          state.currentTrip = null;
        }
      })
      .addCase(deleteTrip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // ----- SHARE TRIP -----
      .addCase(shareTrip.fulfilled, (state, action) => {
        if (state.currentTrip) {
          state.currentTrip.shareToken = action.payload.shareToken;
        }
      })
      // ----- FETCH SHARED TRIP -----
      .addCase(fetchSharedTrip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSharedTrip.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTrip = action.payload;
      })
      .addCase(fetchSharedTrip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default tripsSlice.reducer;
