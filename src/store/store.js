// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import cyclonesReducer from './slices/cyclonesSlice';
import surcoteReducer  from './slices/sucoteSlice';
import uiReducer       from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    cyclones: cyclonesReducer,
    surcote:  surcoteReducer,
    ui:       uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['cyclones/setData', 'surcote/setData'],
        ignoredPaths: [
          'cyclones.segments',
          'cyclones.points',
          'cyclones.referentiel',
          'surcote.features',
        ],
      },
    }),
});

export default store;