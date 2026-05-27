// src/store/context/themeContext.js
import React, { createContext, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme, selectTheme } from '../slices/uiSlice';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const dispatch = useDispatch();
  const theme    = useSelector(selectTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggle: () => dispatch(toggleTheme()) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);