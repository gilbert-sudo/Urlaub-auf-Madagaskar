import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const fetchClients = createAsyncThunk('clients/fetchClients', async () => {
  const response = await axios.get(`${API_URL}/api/clients`);
  return response.data;
});

export const createClient = createAsyncThunk('clients/createClient', async (clientData) => {
  const response = await axios.post(`${API_URL}/api/clients`, clientData);
  return response.data;
});

export const updateClient = createAsyncThunk('clients/updateClient', async ({ id, data }) => {
  const response = await axios.put(`${API_URL}/api/clients/${id}`, data);
  return response.data;
});

export const deleteClient = createAsyncThunk('clients/deleteClient', async (id) => {
  await axios.delete(`${API_URL}/api/clients/${id}`);
  return id;
});

const clientsSlice = createSlice({
  name: 'clients',
  initialState: {
    items: [],
    loading: false,
    error: null,
    status: 'idle'
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClients.pending, (state) => {
        state.loading = true;
        state.status = 'loading';
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.status = 'succeeded';
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
        state.status = 'failed';
      })
      .addCase(createClient.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateClient.fulfilled, (state, action) => {
        const index = state.items.findIndex(client => client._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.items = state.items.filter(client => client._id !== action.payload);
      });
  }
});

export default clientsSlice.reducer;
