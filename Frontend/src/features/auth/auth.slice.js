import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",

  initialState: {
    user: null,
    loading: true,
    error: null,
  },

  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.error = null;
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
    },

    clearAuth: (state) => {
      state.user = null;
      state.error = null;
    },
  },
});

export const {
  setUser,
  setLoading,
  setError,
  clearAuth,
} = authSlice.actions;

export default authSlice.reducer;