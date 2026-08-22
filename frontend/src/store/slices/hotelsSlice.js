import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchHotels = createAsyncThunk('hotels/fetchHotels', async () => {
  const response = await axios.get('https://urlaub-auf-madagaskar.onrender.com/api/hotels');
  return response.data;
});

const hotelsSlice = createSlice({
  name: 'hotels',
  initialState: {
    items: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotels.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchHotels.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      });
  }
});

export default hotelsSlice.reducer;
