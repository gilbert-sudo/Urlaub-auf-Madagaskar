import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const fetchHotels = createAsyncThunk('hotels/fetchHotels', async () => {
  const response = await axios.get(`${API_URL}/api/hotels`);
  return response.data;
});

export const createHotel = createAsyncThunk('hotels/createHotel', async (hotelData) => {
  const response = await axios.post(`${API_URL}/api/hotels`, hotelData);
  return response.data;
});

export const updateHotel = createAsyncThunk('hotels/updateHotel', async ({ id, data }) => {
  const response = await axios.put(`${API_URL}/api/hotels/${id}`, data);
  return response.data;
});

export const deleteHotel = createAsyncThunk('hotels/deleteHotel', async (id) => {
  await axios.delete(`${API_URL}/api/hotels/${id}`);
  return id;
});

const hotelsSlice = createSlice({
  name: 'hotels',
  initialState: {
    items: [],
    loading: false,
    error: null,
    status: 'idle'
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotels.pending, (state) => {
        state.loading = true;
        state.status = 'loading';
      })
      .addCase(fetchHotels.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.status = 'succeeded';
      })
      .addCase(fetchHotels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
        state.status = 'failed';
      })
      .addCase(createHotel.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          h => h._id === action.payload._id || (action.payload.placeId && h.placeId === action.payload.placeId)
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        } else {
          state.items.unshift(action.payload);
        }
      })
      .addCase(updateHotel.fulfilled, (state, action) => {
        const index = state.items.findIndex(h => h._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteHotel.fulfilled, (state, action) => {
        state.items = state.items.filter(h => h._id !== action.payload);
      });
  }
});

export default hotelsSlice.reducer;
