// src/store/context/themeContext.js
// ============================================================
// Pacific Dataviz Challenge 2026
// Contexte React pour le thème — source de vérité : Redux
// CHEMIN CORRECT : ../slices/uiSlice  (depuis store/context/)
// ============================================================

import React, { createContext, useContext, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme, setTheme, selectTheme } from '../slices/uiSlice';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const dispatch = useDispatch();
  const theme    = useSelector(selectTheme); // 'dark' | 'light'

  const toggle  = useCallback(() => dispatch(toggleTheme()),    [dispatch]);
  const set     = useCallback((t) => dispatch(setTheme(t)),     [dispatch]);
  const isDark  = theme === 'dark';
  const isLight = theme === 'light';

  return (
    <ThemeContext.Provider value={{ theme, isDark, isLight, toggle, set }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a <ThemeProvider>');
  return ctx;
}

export default ThemeContext;