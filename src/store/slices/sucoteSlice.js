// store/slices/surcoteSlice.js
// ============================================================
// Pacific Dataviz Challenge 2026
// Surcote Slice — submersion marine cyclone centennal
// Source : data.gouv.nc / DIMENC-IRD (BENEBIG 2024)
// Points tous les 100m sur le trait de côte NC
// Champs : surcote_max (m), hauteur_significative_max (m), periode_max (s)
// ============================================================

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchSurcoteData } from '../../services/api';

// ─── Thunk ───────────────────────────────────────────────────

export const loadSurcoteData = createAsyncThunk(
  'surcote/load',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchSurcoteData();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ─── État initial ─────────────────────────────────────────────

// Seuils de danger pour la colorisation (en mètres)
export const SURCOTE_THRESHOLDS = {
  low:      0.5,   // jaune  — vigilance
  moderate: 1.0,   // orange — danger
  high:     1.5,   // rouge  — critique
  extreme:  2.5,   // violet — catastrophique
};

export const WAVE_THRESHOLDS = {
  low:      2.0,
  moderate: 4.0,
  high:     6.0,
  extreme:  8.0,
};

const initialState = {
  // Données GeoJSON brutes — FeatureCollection de points côtiers
  features: null,

  // État de chargement
  loading: false,
  error:   null,

  // Statistiques globales
  stats: {
    totalPoints:   0,
    maxSurcote:    0,
    avgSurcote:    0,
    maxVague:      0,
    pointsExtremes: 0,  // nombre de points au-dessus du seuil "extreme"
  },

  // Filtre d'affichage par seuil
  displayThreshold: 'low',  // 'low' | 'moderate' | 'high' | 'extreme'

  // Point sélectionné sur la carte
  selectedPoint: null,

  // Mode de visualisation
  vizMode: 'surcote',  // 'surcote' | 'vague' | 'periode'
};

// ─── Slice ───────────────────────────────────────────────────

const surcoteSlice = createSlice({
  name: 'surcote',
  initialState,
  reducers: {
    setDisplayThreshold(state, action) {
      state.displayThreshold = action.payload;
    },
    setVizMode(state, action) {
      state.vizMode = action.payload; // 'surcote' | 'vague' | 'periode'
    },
    setSelectedPoint(state, action) {
      state.selectedPoint = action.payload;
    },
    clearSelectedPoint(state) {
      state.selectedPoint = null;
    },
    setStats(state, action) {
      state.stats = action.payload;
    },
    // Injection directe (mock ou test)
    setData(state, action) {
      state.features = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(loadSurcoteData.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(loadSurcoteData.fulfilled, (state, action) => {
        state.loading  = false;
        state.features = action.payload;

        // Calcul stats à la réception
        if (action.payload?.features?.length) {
          const feats = action.payload.features;
          const surcotes = feats
            .map((f) => f.properties?.surcote_max)
            .filter((v) => v != null && !isNaN(v));
          const vagues = feats
            .map((f) => f.properties?.hauteur_significative_max)
            .filter((v) => v != null && !isNaN(v));

          state.stats = {
            totalPoints:    feats.length,
            maxSurcote:     surcotes.length ? Math.max(...surcotes) : 0,
            avgSurcote:     surcotes.length
              ? surcotes.reduce((a, b) => a + b, 0) / surcotes.length
              : 0,
            maxVague:       vagues.length ? Math.max(...vagues) : 0,
            pointsExtremes: surcotes.filter(
              (v) => v >= SURCOTE_THRESHOLDS.extreme
            ).length,
          };
        }
      })
      .addCase(loadSurcoteData.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      });
  },
});

export const {
  setDisplayThreshold,
  setVizMode,
  setSelectedPoint,
  clearSelectedPoint,
  setStats,
  setData,
} = surcoteSlice.actions;

// ─── Selectors ───────────────────────────────────────────────

export const selectSurcoteFeatures  = (state) => state.surcote.features;
export const selectSurcoteLoading   = (state) => state.surcote.loading;
export const selectSurcoteError     = (state) => state.surcote.error;
export const selectSurcoteStats     = (state) => state.surcote.stats;
export const selectDisplayThreshold = (state) => state.surcote.displayThreshold;
export const selectVizMode          = (state) => state.surcote.vizMode;
export const selectSelectedPoint    = (state) => state.surcote.selectedPoint;

// Selector filtré par seuil minimum
export const selectFilteredSurcote = (state) => {
  const { features, displayThreshold, vizMode } = state.surcote;
  if (!features?.features) return null;

  const threshold = SURCOTE_THRESHOLDS[displayThreshold] ?? 0;

  const field =
    vizMode === 'vague'   ? 'hauteur_significative_max' :
    vizMode === 'periode' ? 'periode_max' :
    'surcote_max';

  const filtered = features.features.filter(
    (f) => (f.properties?.[field] ?? 0) >= threshold
  );

  return { ...features, features: filtered };
};

export default surcoteSlice.reducer;