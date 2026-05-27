// src/store/slices/uiSlice.js
import { createSlice } from '@reduxjs/toolkit';

const getInitialTheme = () => {
  try {
    const stored = localStorage.getItem('pdvc_theme');
    if (stored) return stored;
  } catch {}
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getInitialLang = () => {
  try {
    const stored = localStorage.getItem('pdvc_lang');
    if (stored) return stored;
  } catch {}
  return navigator.language?.startsWith('fr') ? 'fr' : 'en';
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme:   getInitialTheme(),
    lang:    getInitialLang(),
    navOpen: false,
  },
  reducers: {
    toggleTheme(state) {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      state.theme = next;
      try { localStorage.setItem('pdvc_theme', next); } catch {}
    },
    setLang(state, action) {
      state.lang = action.payload;
      try { localStorage.setItem('pdvc_lang', action.payload); } catch {}
    },
    toggleNav(state) {
      state.navOpen = !state.navOpen;
    },
    closeNav(state) {
      state.navOpen = false;
    },
  },
});

export const { toggleTheme, setLang, toggleNav, closeNav } = uiSlice.actions;

export const selectTheme   = (state) => state.ui.theme;
export const selectLang    = (state) => state.ui.lang;
export const selectNavOpen = (state) => state.ui.navOpen;

export default uiSlice.reducer;