// src/App.js
// ============================================================
// Pacific Dataviz Challenge 2026
// Router — 5 routes + ThemeProvider + LangProvider
// ============================================================

import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectTheme, selectLang } from './store/slices/uiSlice';
import { ThemeProvider } from './store/context/themeContext';
import { LangProvider }  from './store/context/langContext';
import Nav from './components/Nav/Nav';

const LandingPage   = lazy(() => import('./pages/LandingPage/LandingPage'));
const MapPage       = lazy(() => import('./pages/MapPage/MapPage'));
const CyclonesPage  = lazy(() => import('./pages/CyclonesPage/CyclonesPage'));
const SurcotePage   = lazy(() => import('./pages/SurcotePage/SurcotePage'));
const DataPage      = lazy(() => import('./pages/DataPage/DataPage'));
const AboutPage     = lazy(() => import('./pages/AboutPage/AboutPage'));

const PageLoader = () => (
  <div style={{
    width: '100vw', height: '100vh',
    background: 'var(--color-bg-primary, #020b18)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <div style={{
      width: 40, height: 40,
      border: '2px solid rgba(0,230,255,0.15)',
      borderTop: '2px solid #00e6ff',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }}/>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

function AppInner() {
  const theme    = useSelector(selectTheme);
  const lang     = useSelector(selectLang);
  const location = useLocation();

  // Applique data-theme sur <html> → active les CSS custom properties
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('lang', lang);
    // Force aussi sur le body pour compatibilité
    document.body.setAttribute('data-theme', theme);
  }, [theme, lang]);

  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  const showNav = location.pathname !== '/';

  return (
    <div className="app-root" data-theme={theme}>
      {showNav && <Nav />}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"          element={<LandingPage />} />
          <Route path="/map"       element={<MapPage />} />
          <Route path="/cyclones"  element={<CyclonesPage />} />
          <Route path="/surcote"   element={<SurcotePage />} />
          <Route path="/data"      element={<DataPage />} />
          <Route path="/about"     element={<AboutPage />} />
        </Routes>
      </Suspense>
    </div>
  );
}

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