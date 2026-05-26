// src/store/slices/uiSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  theme:       'dark',   // 'dark' | 'light'
  lang:        'fr',     // 'fr'  | 'en'
  mapMode:     'both',   // 'cyclones' | 'surcote' | 'both'
  sidebarOpen: false,
  activePopup: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },
    setTheme(state, action) {
      state.theme = action.payload;
    },
    toggleLang(state) {
      state.lang = state.lang === 'fr' ? 'en' : 'fr';
    },
    setLang(state, action) {
      state.lang = action.payload;
    },
    setMapMode(state, action) {
      state.mapMode = action.payload;
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action) {
      state.sidebarOpen = action.payload;
    },
    setActivePopup(state, action) {
      state.activePopup = action.payload;
    },
    closePopup(state) {
      state.activePopup = null;
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  toggleLang,
  setLang,
  setMapMode,
  toggleSidebar,
  setSidebarOpen,
  setActivePopup,
  closePopup,
} = uiSlice.actions;

// Selectors
export const selectTheme       = (state) => state.ui.theme;
export const selectLang        = (state) => state.ui.lang;
export const selectMapMode     = (state) => state.ui.mapMode;
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectActivePopup = (state) => state.ui.activePopup;

export default uiSlice.reducer;