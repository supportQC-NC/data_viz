// src/store/slices/cyclonesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// URLs GeoJSON export ArcGIS OpenData — accessibles depuis le navigateur
const POSITIONS_GEOJSON    = 'https://georep-dtsi-sgt.opendata.arcgis.com/datasets/63e27e6671324498838e4944035a3cc0_0.geojson';
const TRAJECTOIRES_GEOJSON = 'https://georep-dtsi-sgt.opendata.arcgis.com/datasets/63e27e6671324498838e4944035a3cc0_1.geojson';

// ── Thunks ───────────────────────────────────────────────────
export const fetchPositions = createAsyncThunk(
  'cyclones/fetchPositions',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(POSITIONS_GEOJSON);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log('[POSITIONS] features count:', data.features?.length);
      console.log('[POSITIONS] premier feature properties:', data.features?.[0]?.properties);
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchTrajectoires = createAsyncThunk(
  'cyclones/fetchTrajectoires',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(TRAJECTOIRES_GEOJSON);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log('[TRAJECTOIRES] features count:', data.features?.length);
      console.log('[TRAJECTOIRES] premier feature properties:', data.features?.[0]?.properties);
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────
const cyclonesSlice = createSlice({
  name: 'cyclones',
  initialState: {
    positions: {
      features : [],
      status   : 'idle',
      error    : null,
    },
    trajectoires: {
      features : [],
      status   : 'idle',
      error    : null,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPositions.pending,   (state) => { state.positions.status = 'loading'; })
      .addCase(fetchPositions.fulfilled, (state, { payload }) => {
        state.positions.status   = 'succeeded';
        state.positions.features = payload.features ?? [];
      })
      .addCase(fetchPositions.rejected,  (state, { payload }) => {
        state.positions.status = 'failed';
        state.positions.error  = payload;
      })

      .addCase(fetchTrajectoires.pending,   (state) => { state.trajectoires.status = 'loading'; })
      .addCase(fetchTrajectoires.fulfilled, (state, { payload }) => {
        state.trajectoires.status   = 'succeeded';
        state.trajectoires.features = payload.features ?? [];
      })
      .addCase(fetchTrajectoires.rejected,  (state, { payload }) => {
        state.trajectoires.status = 'failed';
        state.trajectoires.error  = payload;
      });
  },
});

export const selectPositions    = (state) => state.cyclones.positions;
export const selectTrajectoires = (state) => state.cyclones.trajectoires;

export default cyclonesSlice.reducer;