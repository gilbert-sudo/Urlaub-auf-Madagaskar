import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  days: [],
  activeDayIndex: null,
};

const itinerarySlice = createSlice({
  name: 'itinerary',
  initialState,
  reducers: {
    setItinerary: (state, action) => {
      state.days = action.payload;
      // Reset active day if it's out of bounds after setting new itinerary
      if (state.activeDayIndex !== null && state.activeDayIndex >= action.payload.length) {
        state.activeDayIndex = action.payload.length > 0 ? action.payload.length - 1 : null;
      }
    },
    addDay: (state, action) => {
      state.days.push(action.payload);
      state.activeDayIndex = state.days.length - 1;
    },
    updateDay: (state, action) => {
      const { index, data } = action.payload;
      if (state.days[index]) {
        state.days[index] = { ...state.days[index], ...data };
      }
    },
    removeDay: (state, action) => {
      const index = action.payload;
      state.days = state.days.filter((_, i) => i !== index).map((item, i) => ({ ...item, dayNumber: i + 1 }));
      if (state.days.length === 0) {
        state.activeDayIndex = null;
      } else if (state.activeDayIndex === index) {
        state.activeDayIndex = Math.max(0, index - 1);
      } else if (state.activeDayIndex > index) {
        state.activeDayIndex -= 1;
      }
    },
    setActiveDayIndex: (state, action) => {
      state.activeDayIndex = action.payload;
    },
    resetItinerary: (state) => {
      state.days = [];
      state.activeDayIndex = null;
    }
  }
});

export const { setItinerary, addDay, updateDay, removeDay, setActiveDayIndex, resetItinerary } = itinerarySlice.actions;

export default itinerarySlice.reducer;
