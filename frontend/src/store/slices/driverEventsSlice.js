import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const fetchDriverEvents = createAsyncThunk(
  'driverEvents/fetchDriverEvents',
  async (driverId) => {
    const response = await axios.get(`${API_URL}/api/driver-events/driver/${driverId}`);
    return response.data;
  }
);

export const addDriverEvent = createAsyncThunk(
  'driverEvents/addDriverEvent',
  async (eventData) => {
    const response = await axios.post(`${API_URL}/api/driver-events`, eventData);
    return response.data;
  }
);

export const updateDriverEvent = createAsyncThunk(
  'driverEvents/updateDriverEvent',
  async ({ id, ...eventData }) => {
    const response = await axios.put(`${API_URL}/api/driver-events/${id}`, eventData);
    return response.data;
  }
);

export const deleteDriverEvent = createAsyncThunk(
  'driverEvents/deleteDriverEvent',
  async (id) => {
    await axios.delete(`${API_URL}/api/driver-events/${id}`);
    return id;
  }
);

const driverEventsSlice = createSlice({
  name: 'driverEvents',
  initialState: {
    events: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDriverEvents.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDriverEvents.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.events = action.payload;
      })
      .addCase(fetchDriverEvents.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(addDriverEvent.fulfilled, (state, action) => {
        state.events.push(action.payload);
      })
      .addCase(updateDriverEvent.fulfilled, (state, action) => {
        const index = state.events.findIndex((e) => e._id === action.payload._id);
        if (index !== -1) {
          state.events[index] = action.payload;
        }
      })
      .addCase(deleteDriverEvent.fulfilled, (state, action) => {
        state.events = state.events.filter((e) => e._id !== action.payload);
      });
  },
});

export default driverEventsSlice.reducer;
