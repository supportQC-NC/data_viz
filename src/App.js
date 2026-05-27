// src/App.js
import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation }        from 'react-router-dom';
import { useSelector }                       from 'react-redux';
import { selectTheme }                       from './store/slices/uiSlice';
import { ThemeProvider }                     from './store/context/themeContext';
import { LangProvider }                      from './store/context/langContext';
import Nav                                   from './components/Nav/Nav';
import Loader                                from './components/Loader/Loader';

const LandingPage       = lazy(() => import('./pages/LandingPage/LandingPages'));
const CyclonesPage      = lazy(() => import('./pages/CyclonesPage/CyclonesPage'));
const CyclonesMapPage   = lazy(() => import('./pages/CyclonesMapPage/CyclonesMapPage'));
const CyclonesGuidePage = lazy(() => import('./pages/CyclonesGuidePage/CyclonesGuidePage'));
const SurcotePage       = lazy(() => import('./pages/SurcotePage/SurcotePage'));
const SurcoteGuidePage  = lazy(() => import('./pages/SurcoteGuidePage/SurcoteGuidePage'));
const GuidePage         = lazy(() => import('./pages/GuidePage/GuidePage'));
const AboutPage         = lazy(() => import('./pages/AboutPage/AboutPage'));

function AppContent() {
  const theme    = useSelector(selectTheme);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="app-root" data-theme={theme}>
      <Nav />
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/"               element={<LandingPage       />} />
          <Route path="/cyclones"       element={<CyclonesPage      />} />
          <Route path="/cyclones/map"   element={<CyclonesMapPage   />} />
          <Route path="/cyclones/guide" element={<CyclonesGuidePage />} />
          <Route path="/surcote"        element={<SurcotePage       />} />
          <Route path="/surcote/guide"  element={<SurcoteGuidePage  />} />
          <Route path="/guide"          element={<GuidePage         />} />
          <Route path="/about"          element={<AboutPage         />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <AppContent />
      </LangProvider>
    </ThemeProvider>
  );
}