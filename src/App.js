// src/App.js
// ============================================================
// App v2.0 — Pacific Dataviz Challenge 2026
// Routes : Landing · Map · Data · About
// ============================================================

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage/LandingPage';
import MapPage     from './pages/MapPage/MapPage';
import AboutPage   from './pages/AboutPage/AboutPage';
import DataPage    from './pages/DataPage/DataPage';

function App() {
  return (
    <Routes>
      <Route path="/"      element={<LandingPage />} />
      <Route path="/map"   element={<MapPage />} />
      <Route path="/data"  element={<DataPage />} />
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  );
}

export default App;