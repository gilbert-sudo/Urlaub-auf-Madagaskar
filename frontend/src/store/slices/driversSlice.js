import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const fetchDrivers = createAsyncThunk('drivers/fetchDrivers', async () => {
  const response = await axios.get(`${API_URL}/api/drivers`);
  return response.data;
});

export const createDriver = createAsyncThunk('drivers/createDriver', async (driverData) => {
  const response = await axios.post(`${API_URL}/api/drivers`, driverData);
  return response.data;
});

export const updateDriver = createAsyncThunk('drivers/updateDriver', async ({ id, data }) => {
  const response = await axios.put(`${API_URL}/api/drivers/${id}`, data);
  return response.data;
});

export const deleteDriver = createAsyncThunk('drivers/deleteDriver', async (id) => {
  await axios.delete(`${API_URL}/api/drivers/${id}`);
  return id;
});

const driversSlice = createSlice({
  name: 'drivers',
  initialState: {
    items: [],
    loading: false,
    error: null,
    status: 'idle'
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDrivers.pending, (state) => {
        state.loading = true;
        state.status = 'loading';
      })
      .addCase(fetchDrivers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.status = 'succeeded';
      })
      .addCase(fetchDrivers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
        state.status = 'failed';
      })
      .addCase(createDriver.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateDriver.fulfilled, (state, action) => {
        const index = state.items.findIndex(driver => driver._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteDriver.fulfilled, (state, action) => {
        state.items = state.items.filter(driver => driver._id !== action.payload);
      });
  }
});

export default driversSlice.reducer;
