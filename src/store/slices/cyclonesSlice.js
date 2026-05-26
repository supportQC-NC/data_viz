// store/slices/cyclonesSlice.js
// ============================================================
// Pacific Dataviz Challenge 2026
// Cyclones Slice — trajectoires historiques Pacifique SW
// Source : data.gouv.nc / Géorep Météo-France SPEArTC 1977→
// ============================================================

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchCyclonesSegments, fetchCyclonesPoints, fetchCyclonesRef } from '../../services/api';

// ─── Thunks ──────────────────────────────────────────────────

// Charge les trajectoires (lignes) des cyclones zone NC
export const loadCyclonesSegments = createAsyncThunk(
  'cyclones/loadSegments',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchCyclonesSegments();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Charge les positions horaires (points) avec vent/pression
export const loadCyclonesPoints = createAsyncThunk(
  'cyclones/loadPoints',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchCyclonesPoints();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Charge le référentiel (métadonnées par cyclone : nom, saison, catégorie max)
export const loadCyclonesRef = createAsyncThunk(
  'cyclones/loadRef',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchCyclonesRef();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ─── État initial ─────────────────────────────────────────────

const initialState = {
  // Données GeoJSON brutes
  segments:    null,   // FeatureCollection — trajectoires
  points:      null,   // FeatureCollection — positions horodatées
  referentiel: null,   // Array — métadonnées cyclones

  // États de chargement
  loadingSegments:    false,
  loadingPoints:      false,
  loadingRef:         false,
  errorSegments:      null,
  errorPoints:        null,
  errorRef:           null,

  // Filtres actifs
  filters: {
    saison:       null,    // ex: '2002-2003' | null = toutes
    categorie:    null,    // 'TD' | 'TS' | 'TC' | 'STC' | 'ITC' | null
    ensoPhase:    null,    // 'El Nino' | 'La Nina' | 'Neutral' | null
    selectedName: null,    // nom du cyclone sélectionné pour focus
  },

  // Cyclone actuellement survolé/sélectionné sur la carte
  hoveredCyclone:   null,
  selectedCyclone:  null,

  // Statistiques calculées (enrichi après chargement)
  stats: {
    total:       0,
    byCategory:  {},
    byDecade:    {},
    mostIntense: null,
  },
};

// ─── Slice ───────────────────────────────────────────────────

const cyclonesSlice = createSlice({
  name: 'cyclones',
  initialState,
  reducers: {
    // Filtres
    setFilterSaison(state, action) {
      state.filters.saison = action.payload;
    },
    setFilterCategorie(state, action) {
      state.filters.categorie = action.payload;
    },
    setFilterEnso(state, action) {
      state.filters.ensoPhase = action.payload;
    },
    setFilterName(state, action) {
      state.filters.selectedName = action.payload;
    },
    resetFilters(state) {
      state.filters = initialState.filters;
    },

    // Interaction carte
    setHoveredCyclone(state, action) {
      state.hoveredCyclone = action.payload;
    },
    setSelectedCyclone(state, action) {
      state.selectedCyclone = action.payload;
    },
    clearSelection(state) {
      state.hoveredCyclone  = null;
      state.selectedCyclone = null;
    },

    // Stats (calculées en dehors et injectées)
    setStats(state, action) {
      state.stats = action.payload;
    },

    // Injection directe des données (pour les tests ou données mock)
    setData(state, action) {
      const { segments, points, referentiel } = action.payload;
      if (segments)    state.segments    = segments;
      if (points)      state.points      = points;
      if (referentiel) state.referentiel = referentiel;
    },
  },

  extraReducers: (builder) => {
    // Segments
    builder
      .addCase(loadCyclonesSegments.pending, (state) => {
        state.loadingSegments = true;
        state.errorSegments   = null;
      })
      .addCase(loadCyclonesSegments.fulfilled, (state, action) => {
        state.loadingSegments = false;
        state.segments        = action.payload;
      })
      .addCase(loadCyclonesSegments.rejected, (state, action) => {
        state.loadingSegments = false;
        state.errorSegments   = action.payload;
      });

    // Points
    builder
      .addCase(loadCyclonesPoints.pending, (state) => {
        state.loadingPoints = true;
        state.errorPoints   = null;
      })
      .addCase(loadCyclonesPoints.fulfilled, (state, action) => {
        state.loadingPoints = false;
        state.points        = action.payload;
      })
      .addCase(loadCyclonesPoints.rejected, (state, action) => {
        state.loadingPoints = false;
        state.errorPoints   = action.payload;
      });

    // Référentiel
    builder
      .addCase(loadCyclonesRef.pending, (state) => {
        state.loadingRef = true;
        state.errorRef   = null;
      })
      .addCase(loadCyclonesRef.fulfilled, (state, action) => {
        state.loadingRef = false;
        state.referentiel = action.payload;
      })
      .addCase(loadCyclonesRef.rejected, (state, action) => {
        state.loadingRef = false;
        state.errorRef   = action.payload;
      });
  },
});

export const {
  setFilterSaison,
  setFilterCategorie,
  setFilterEnso,
  setFilterName,
  resetFilters,
  setHoveredCyclone,
  setSelectedCyclone,
  clearSelection,
  setStats,
  setData,
} = cyclonesSlice.actions;

// ─── Selectors ───────────────────────────────────────────────

export const selectCyclonesSegments    = (state) => state.cyclones.segments;
export const selectCyclonesPoints      = (state) => state.cyclones.points;
export const selectCyclonesRef         = (state) => state.cyclones.referentiel;
export const selectCyclonesLoading     = (state) =>
  state.cyclones.loadingSegments || state.cyclones.loadingPoints;
export const selectCyclonesError       = (state) =>
  state.cyclones.errorSegments || state.cyclones.errorPoints;
export const selectCyclonesFilters     = (state) => state.cyclones.filters;
export const selectHoveredCyclone      = (state) => state.cyclones.hoveredCyclone;
export const selectSelectedCyclone     = (state) => state.cyclones.selectedCyclone;
export const selectCyclonesStats       = (state) => state.cyclones.stats;

// Selector filtré — renvoie les segments après application des filtres
export const selectFilteredSegments = (state) => {
  const { segments, filters } = state.cyclones;
  if (!segments || !segments.features) return null;

  let features = segments.features;

  if (filters.categorie) {
    features = features.filter(
      (f) => f.properties?.categorie === filters.categorie
    );
  }
  if (filters.saison) {
    features = features.filter(
      (f) => f.properties?.saison === filters.saison
    );
  }
  if (filters.selectedName) {
    features = features.filter(
      (f) => f.properties?.nom?.toLowerCase() === filters.selectedName.toLowerCase()
    );
  }

  return { ...segments, features };
};

export default cyclonesSlice.reducer;