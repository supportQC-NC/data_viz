// src/App.js
// ============================================================
// Pacific Dataviz Challenge 2026
// Router principal — ThemeProvider + LangProvider
// Chemins corrects : ./store/context/
// ============================================================

import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectTheme, selectLang } from './store/slices/uiSlice';
import { ThemeProvider } from './store/context/themeContext';
import { LangProvider }  from './store/context/langContext';
import Nav from './components/Nav/Nav';

// ── Lazy loading ─────────────────────────────────────────────
const LandingPage = lazy(() => import('./pages/LandingPage/LandingPage'));
const MapPage     = lazy(() => import('./pages/MapPage/MapPage'));
const DataPage    = lazy(() => import('./pages/DataPage/DataPage'));
const AboutPage   = lazy(() => import('./pages/AboutPage/AboutPage'));

// ── Loader de page ───────────────────────────────────────────
const PageLoader = () => (
  <div style={{
    width:          '100vw',
    height:         '100vh',
    background:     'var(--color-bg-primary, #020b18)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
  }}>
    <div style={{
      width:        48,
      height:       48,
      border:       '2px solid rgba(0,230,255,0.15)',
      borderTop:    '2px solid #00e6ff',
      borderRadius: '50%',
      animation:    'spin 0.8s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ── Inner (lit Redux pour sync <html>) ───────────────────────
function AppInner() {
  const theme    = useSelector(selectTheme);
  const lang     = useSelector(selectLang);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('lang', lang);
  }, [theme, lang]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const showNav = location.pathname !== '/';

  return (
    <div className="app-root" data-theme={theme}>
      {showNav && <Nav />}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"      element={<LandingPage />} />
          <Route path="/map"   element={<MapPage />} />
          <Route path="/data"  element={<DataPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </Suspense>
    </div>
  );
}

// ── Root avec providers ──────────────────────────────────────
function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <AppInner />
      </LangProvider>
    </ThemeProvider>
  );
}

export default App;