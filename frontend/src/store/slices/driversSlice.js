import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchDrivers = createAsyncThunk('drivers/fetchDrivers', async () => {
  const response = await axios.get('http://localhost:5000/api/drivers');
  return response.data;
});

const driversSlice = createSlice({
  name: 'drivers',
  initialState: {
    items: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDrivers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDrivers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      });
  }
});

export default driversSlice.reducer;
