// src/store/context/langContext.js
import React, { createContext, useContext, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setLang, selectLang } from '../slices/uiSlice';
import fr from '../../locales/fr.json';
import en from '../../locales/en.json';

const translations = { fr, en };

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const dispatch = useDispatch();
  const lang     = useSelector(selectLang);

  const switchLang = (l) => dispatch(setLang(l));

  const t = useCallback((key) => {
    const parts = key.split('.');
    let val = translations[lang] ?? translations['fr'];
    for (const p of parts) {
      if (val == null) return key;
      val = val[p];
    }
    return val ?? key;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);