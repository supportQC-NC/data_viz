// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import uiReducer      from './slices/uiSlice';
import cyclonesReducer from './slices/cyclonesSlice';
import surcoteReducer  from './slices/surcoteSlice';

export const store = configureStore({
  reducer: {
    ui       : uiReducer,
    cyclones : cyclonesReducer,
    surcote  : surcoteReducer,
  },
});