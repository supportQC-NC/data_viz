// src/store/slices/surcoteSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// ── URLs GeoJSON ArcGIS OpenData ──────────────────────────────
const SURCOTE_URL  = 'https://georep-dtsi-sgt.opendata.arcgis.com/datasets/14e3fc49ed6a444d9875c11a97fb6a69_0.geojson';
const ALEAS_URL    = 'https://georep-dtsi-sgt.opendata.arcgis.com/datasets/56b4a818170a489f969b894e54aab71b_0.geojson';
const LITTORAL_URL = 'https://georep-dtsi-sgt.opendata.arcgis.com/datasets/a188fc1f6d5549a787394da626fd9070_0.geojson';

// ── Helper ────────────────────────────────────────────────────
const fetchGeoJSON = async (url, label, rejectWithValue) => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log(`[${label}] features count:`, data.features?.length);
    console.log(`[${label}] premier feature properties:`, data.features?.[0]?.properties);
    console.log(`[${label}] geometry type:`, data.features?.[0]?.geometry?.type);
    return data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
};

// ── Thunks ────────────────────────────────────────────────────
export const fetchSurcote  = createAsyncThunk('surcote/fetchSurcote',  (_, { rejectWithValue }) => fetchGeoJSON(SURCOTE_URL,  'SURCOTE',  rejectWithValue));
export const fetchAleas    = createAsyncThunk('surcote/fetchAleas',    (_, { rejectWithValue }) => fetchGeoJSON(ALEAS_URL,    'ALEAS',    rejectWithValue));
export const fetchLittoral = createAsyncThunk('surcote/fetchLittoral', (_, { rejectWithValue }) => fetchGeoJSON(LITTORAL_URL, 'LITTORAL', rejectWithValue));

// ── Slice ─────────────────────────────────────────────────────
const surcoteSlice = createSlice({
  name: 'surcote',
  initialState: {
    surcote : { features: [], status: 'idle', error: null },
    aleas   : { features: [], status: 'idle', error: null },
    littoral: { features: [], status: 'idle', error: null },
  },
  reducers: {},
  extraReducers: (builder) => {
    const handle = (key, thunk) => {
      builder
        .addCase(thunk.pending,   (state) => { state[key].status = 'loading'; state[key].error = null; })
        .addCase(thunk.fulfilled, (state, { payload }) => {
          state[key].status   = 'succeeded';
          state[key].features = payload.features ?? [];
        })
        .addCase(thunk.rejected,  (state, { payload }) => {
          state[key].status = 'failed';
          state[key].error  = payload;
        });
    };
    handle('surcote',  fetchSurcote);
    handle('aleas',    fetchAleas);
    handle('littoral', fetchLittoral);
  },
});

export const selectSurcote  = (state) => state.surcote.surcote;
export const selectAleas    = (state) => state.surcote.aleas;
export const selectLittoral = (state) => state.surcote.littoral;

export default surcoteSlice.reducer;