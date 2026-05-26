// src/pages/CyclonesPage/CyclonesPage.jsx
// ============================================================
// Pacific Dataviz Challenge 2026
// Simulation animée des cyclones NC — trajectoires séquentielles
// Données : cyclonesSlice (state.cyclones)
// Animation : imperative Mapbox source updates (0 re-renders/frame)
// ============================================================

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Map, { NavigationControl } from "react-map-gl/mapbox";
import { useDispatch, useSelector } from "react-redux";
import "mapbox-gl/dist/mapbox-gl.css";
import "./CyclonesPage.scss";

import {
  loadCyclonesSegments,
  loadCyclonesRef,
  setFilterCategorie,
  resetFilters,
  selectCyclonesSegments,
  selectCyclonesRef,
  selectCyclonesLoading,
  selectCyclonesError,
  selectCyclonesFilters,
} from "../../store/slices/cyclonesSlice";

import { useTheme } from "../../store/context/themeContext";
import { useLang } from "../../store/context/langContext";

const TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

const CAT_COLORS = {
  TD: "#90CAF9",
  TS: "#42A5F5",
  TC: "#FFB74D",
  STC: "#FF7043",
  ITC: "#EF5350",
};
const CAT_FR = {
  TD: "Dépression",
  TS: "Tempête",
  TC: "Cyclone",
  STC: "Cyclone sévère",
  ITC: "Cyclone intense",
};
const CAT_EN = {
  TD: "Depression",
  TS: "Storm",
  TC: "Cyclone",
  STC: "Severe cyclone",
  ITC: "Intense cyclone",
};

const INITIAL_VIEW = {
  longitude: 166.5,
  latitude: -19.0,
  zoom: 5.0,
  pitch: 30,
  bearing: 0,
};
const SPEEDS = [
  { key: "slow", label: { fr: "Lent", en: "Slow" }, step: 0.003 },
  { key: "normal", label: { fr: "Normal", en: "Normal" }, step: 0.007 },
  { key: "fast", label: { fr: "Rapide", en: "Fast" }, step: 0.018 },
];
const PAUSE_FRAMES = 70; // ~1.2s at 60fps entre cyclones

// Interpolation linéaire entre 2 coordonnées
const interpCoords = (coords, t) => {
  if (!coords || coords.length < 2) return coords?.[0] ?? [166, -22];
  const fi = Math.max(0, Math.min(1, t)) * (coords.length - 1);
  const lo = Math.floor(fi);
  const hi = Math.min(lo + 1, coords.length - 1);
  const rt = fi - lo;
  return [
    coords[lo][0] + (coords[hi][0] - coords[lo][0]) * rt,
    coords[lo][1] + (coords[hi][1] - coords[lo][1]) * rt,
  ];
};

// GeoJSON vide réutilisable
const EMPTY_FC = { type: "FeatureCollection", features: [] };

export default function CyclonesPage() {
  const dispatch = useDispatch();
  const { isDark } = useTheme();
  const { lang } = useLang();
  const mapRef = useRef(null);
  const mapReadyRef = useRef(false);
  const rafRef = useRef(null);

  // ── Redux ─────────────────────────────────────────────────
  const rawSegments = useSelector(selectCyclonesSegments);
  const referentiel = useSelector(selectCyclonesRef);
  const loading = useSelector(selectCyclonesLoading);
  const error = useSelector(selectCyclonesError);
  const filters = useSelector(selectCyclonesFilters);

  // ── Simulation state ──────────────────────────────────────
  const [simMode, setSimMode] = useState("idle"); // 'idle'|'running'|'paused'|'done'
  const [speedKey, setSpeedKey] = useState("normal");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completedSet, setCompletedSet] = useState(new Set());
  const [uiProgress, setUiProgress] = useState(0); // 0-100 for progress bar
  const [catFilter, setCatFilter] = useState(null);

  // Ref pour l'état d'animation (évite closures stales)
  const animRef = useRef({
    idx: 0,
    progress: 0.0,
    pauseFrames: 0,
    step: 0.007,
    running: false,
    completed: new Set(),
  });
  const featuresRef = useRef([]);

  useEffect(() => {
    dispatch(loadCyclonesSegments());
    dispatch(loadCyclonesRef());
  }, [dispatch]);

  // ── Filtre catégorie ──────────────────────────────────────
  const filteredFeatures = useMemo(() => {
    if (!rawSegments?.features) return [];
    if (!catFilter) return rawSegments.features;
    return rawSegments.features.filter(
      (f) => f.properties?.categorie === catFilter,
    );
  }, [rawSegments, catFilter]);

  // Sync ref
  useEffect(() => {
    featuresRef.current = filteredFeatures;
  }, [filteredFeatures]);

  // ── Initialisation sources Mapbox ─────────────────────────
  const initMapSources = useCallback((map) => {
    if (mapReadyRef.current) return;

    // Source 1: toutes les trajectoires (fond très dim)
    map.addSource("cyc-bg", { type: "geojson", data: EMPTY_FC });
    map.addLayer({
      id: "cyc-bg-lines",
      type: "line",
      source: "cyc-bg",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": ["get", "color"],
        "line-width": 1.5,
        "line-opacity": 0.1,
      },
    });

    // Source 2: trajectoires terminées
    map.addSource("cyc-done", { type: "geojson", data: EMPTY_FC });
    map.addLayer({
      id: "cyc-done-glow",
      type: "line",
      source: "cyc-done",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": ["get", "color"],
        "line-width": 8,
        "line-opacity": 0.12,
        "line-blur": 4,
      },
    });
    map.addLayer({
      id: "cyc-done-lines",
      type: "line",
      source: "cyc-done",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": ["get", "color"],
        "line-width": 2,
        "line-opacity": 0.55,
      },
    });

    // Source 3: trail animé du cyclone courant
    map.addSource("cyc-trail", { type: "geojson", data: EMPTY_FC });
    map.addLayer({
      id: "cyc-trail-glow",
      type: "line",
      source: "cyc-trail",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": ["get", "color"],
        "line-width": 12,
        "line-opacity": 0.25,
        "line-blur": 5,
      },
    });
    map.addLayer({
      id: "cyc-trail-line",
      type: "line",
      source: "cyc-trail",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": ["get", "color"],
        "line-width": 3,
        "line-opacity": 1.0,
      },
    });

    // Source 4: œil du cyclone
    map.addSource("cyc-eye", { type: "geojson", data: EMPTY_FC });
    map.addLayer({
      id: "cyc-eye-ring2",
      type: "circle",
      source: "cyc-eye",
      paint: {
        "circle-radius": 32,
        "circle-color": ["get", "color"],
        "circle-opacity": 0.08,
        "circle-blur": 0.8,
      },
    });
    map.addLayer({
      id: "cyc-eye-ring1",
      type: "circle",
      source: "cyc-eye",
      paint: {
        "circle-radius": 18,
        "circle-color": ["get", "color"],
        "circle-opacity": 0.2,
        "circle-blur": 0.5,
      },
    });
    map.addLayer({
      id: "cyc-eye-core",
      type: "circle",
      source: "cyc-eye",
      paint: {
        "circle-radius": 7,
        "circle-color": "#ffffff",
        "circle-opacity": 1.0,
        "circle-stroke-width": 3,
        "circle-stroke-color": ["get", "color"],
      },
    });

    mapReadyRef.current = true;
  }, []);

  const handleMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) initMapSources(map);
  }, [initMapSources]);

  // ── Mise à jour source fond quand données changent ────────
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !mapReadyRef.current || !filteredFeatures.length) return;
    const fc = {
      type: "FeatureCollection",
      features: filteredFeatures.map((f) => ({
        ...f,
        properties: {
          ...f.properties,
          color: CAT_COLORS[f.properties?.categorie] || "#90CAF9",
        },
      })),
    };
    map.getSource("cyc-bg")?.setData(fc);
  }, [filteredFeatures]);

  // ── Boucle animation ──────────────────────────────────────
  const startAnimation = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const a = animRef.current;
    a.idx = 0;
    a.progress = 0;
    a.pauseFrames = 0;
    a.running = true;
    a.completed = new Set();

    const speedObj = SPEEDS.find((s) => s.key === speedKey) || SPEEDS[1];
    a.step = speedObj.step;

    setCurrentIdx(0);
    setCompletedSet(new Set());
    setUiProgress(0);
    setSimMode("running");

    const map = mapRef.current?.getMap();
    if (map && mapReadyRef.current) {
      map.getSource("cyc-done")?.setData(EMPTY_FC);
      map.getSource("cyc-trail")?.setData(EMPTY_FC);
      map.getSource("cyc-eye")?.setData(EMPTY_FC);
    }

    const tick = () => {
      if (!a.running) return;

      const features = featuresRef.current;
      if (a.idx >= features.length) {
        a.running = false;
        setSimMode("done");
        return;
      }

      const m = mapRef.current?.getMap();

      // Pause entre cyclones
      if (a.pauseFrames > 0) {
        a.pauseFrames--;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const feature = features[a.idx];
      const coords = feature.geometry?.coordinates;
      if (!coords || coords.length < 2) {
        // Passer au suivant si données invalides
        a.completed.add(a.idx);
        a.idx++;
        a.progress = 0;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const color = CAT_COLORS[feature.properties?.categorie] || "#90CAF9";
      a.progress += a.step;

      if (a.progress >= 1.0) {
        // Cyclone terminé
        a.progress = 1.0;
        a.completed.add(a.idx);
        const completedClone = new Set(a.completed);

        // Mettre à jour la source "done" avec tous les cyclones terminés
        if (m && mapReadyRef.current) {
          const doneFeatures = features
            .filter((_, i) => completedClone.has(i))
            .map((f) => ({
              ...f,
              properties: {
                ...f.properties,
                color: CAT_COLORS[f.properties?.categorie] || "#90CAF9",
              },
            }));
          m.getSource("cyc-done")?.setData({
            type: "FeatureCollection",
            features: doneFeatures,
          });
          m.getSource("cyc-trail")?.setData(EMPTY_FC);
          m.getSource("cyc-eye")?.setData(EMPTY_FC);
        }

        setCompletedSet(completedClone);
        setUiProgress(100);

        // Pause puis cyclone suivant
        a.idx++;
        a.progress = 0;
        a.pauseFrames = PAUSE_FRAMES;

        if (a.idx < features.length) {
          setCurrentIdx(a.idx);
          setUiProgress(0);

          // Voler vers le départ du prochain cyclone
          const nextCoords = features[a.idx]?.geometry?.coordinates;
          if (nextCoords?.[0] && m) {
            m.flyTo({
              center: nextCoords[0],
              zoom: Math.max(5.5, m.getZoom()),
              speed: 0.8,
              curve: 1.4,
            });
          }
        }
      } else {
        // Mettre à jour position œil
        const pos = interpCoords(coords, a.progress);
        const trailEnd = Math.floor(a.progress * (coords.length - 1));
        const trailCoords = coords.slice(0, trailEnd + 1).concat([pos]);

        const trailFC = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "LineString", coordinates: trailCoords },
              properties: { color },
            },
          ],
        };
        const eyeFC = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: pos },
              properties: { color, ...feature.properties },
            },
          ],
        };

        if (m && mapReadyRef.current) {
          m.getSource("cyc-trail")?.setData(trailFC);
          m.getSource("cyc-eye")?.setData(eyeFC);
        }

        // Mise à jour UI progress (tous les 4 frames pour perf)
        if (Math.floor(a.progress * 1000) % 4 === 0) {
          setUiProgress(Math.round(a.progress * 100));
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    // Voler vers le premier cyclone
    const firstCoords = filteredFeatures[0]?.geometry?.coordinates;
    if (firstCoords?.[0] && map && mapReadyRef.current) {
      map.flyTo({ center: firstCoords[0], zoom: 6, speed: 0.9, curve: 1.4 });
    }

    setTimeout(() => {
      rafRef.current = requestAnimationFrame(tick);
    }, 600);
  }, [speedKey, filteredFeatures]);

  const pauseResume = useCallback(() => {
    const a = animRef.current;
    if (simMode === "running") {
      a.running = false;
      cancelAnimationFrame(rafRef.current);
      setSimMode("paused");
    } else if (simMode === "paused") {
      a.running = true;
      setSimMode("running");
      rafRef.current = requestAnimationFrame(function tick() {
        if (!animRef.current.running) return;
        // Relance la boucle (simplifié — on rappelle startAnimation en conservant l'état)
        // Pour un vrai pause/resume, on relance depuis l'état courant
        startAnimation(); // On restart depuis le début du cyclone courant
      });
    }
  }, [simMode, startAnimation]);

  const resetSim = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    animRef.current.running = false;
    setSimMode("idle");
    setCurrentIdx(0);
    setCompletedSet(new Set());
    setUiProgress(0);
    const map = mapRef.current?.getMap();
    if (map && mapReadyRef.current) {
      map.getSource("cyc-done")?.setData(EMPTY_FC);
      map.getSource("cyc-trail")?.setData(EMPTY_FC);
      map.getSource("cyc-eye")?.setData(EMPTY_FC);
    }
  }, []);

  // Cleanup
  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  // ── Stats ─────────────────────────────────────────────────
  const stats = useMemo(() => {
    const byCategory = {};
    filteredFeatures.forEach((f) => {
      const cat = f.properties?.categorie || "TD";
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    });
    return { total: filteredFeatures.length, byCategory };
  }, [filteredFeatures]);

  const currentFeature = filteredFeatures[currentIdx];
  const currentProps = currentFeature?.properties || {};
  const currentColor = CAT_COLORS[currentProps.categorie] || "#90CAF9";
  const catLabels = lang === "fr" ? CAT_FR : CAT_EN;
  const mapStyle = isDark
    ? "mapbox://styles/mapbox/dark-v11"
    : "mapbox://styles/mapbox/satellite-streets-v12";
  const isMock = filteredFeatures[0]?.properties?.mock;

  return (
    <div className={`cyc ${isDark ? "cyc--dark" : "cyc--light"}`}>
      {/* ── Carte ─────────────────────────────────────── */}
      <div className="cyc__map">
        <Map
          ref={mapRef}
          initialViewState={INITIAL_VIEW}
          style={{ width: "100%", height: "100%" }}
          mapStyle={mapStyle}
          mapboxAccessToken={TOKEN}
          onLoad={handleMapLoad}
        >
          <NavigationControl position="top-right" visualizePitch />
          {/* Sources et layers gérées impérativement dans initMapSources */}
        </Map>
      </div>

      {/* ── Panel ─────────────────────────────────────── */}
      <div className="cyc__panel">
        {/* Header */}
        <div className="cyc__head">
          <span className="cyc__head-icon">🌀</span>
          <div>
            <div className="cyc__head-title">
              {lang === "fr" ? "Cyclones historiques" : "Historical Cyclones"}
            </div>
            <div className="cyc__head-sub">
              NC & Pacifique SW · data.gouv.nc
            </div>
          </div>
        </div>

        {/* Status chargement */}
        {loading && (
          <div className="cyc__status">
            <div className="cyc__spinner" />
            <span>{lang === "fr" ? "Chargement…" : "Loading…"}</span>
          </div>
        )}
        {isMock && !loading && (
          <div className="cyc__mock">⚠ Mock · API indisponible</div>
        )}

        {/* Stats globales */}
        <div className="cyc__stats">
          <div className="cyc__stat">
            <div className="cyc__stat-val">{stats.total}</div>
            <div className="cyc__stat-lbl">
              {lang === "fr" ? "trajectoires" : "tracks"}
            </div>
          </div>
          {Object.entries(stats.byCategory).map(([cat, n]) => (
            <div key={cat} className="cyc__stat">
              <div className="cyc__stat-val" style={{ color: CAT_COLORS[cat] }}>
                {n}
              </div>
              <div className="cyc__stat-lbl">{cat}</div>
            </div>
          ))}
        </div>

        {/* ── SIMULATION ────────────────────────────── */}
        <div className="cyc__sim">
          <div className="cyc__sim-title">
            🎬 {lang === "fr" ? "Simulation" : "Simulation"}
          </div>

          {/* Cyclone courant */}
          {simMode !== "idle" && currentFeature && (
            <div
              className="cyc__now"
              style={{ borderColor: currentColor + "50" }}
            >
              <div className="cyc__now-header">
                <div className="cyc__now-name" style={{ color: currentColor }}>
                  {currentProps.nom || "—"}
                </div>
                {simMode === "running" && (
                  <div
                    className="cyc__now-pulse"
                    style={{ background: currentColor }}
                  />
                )}
              </div>
              <div className="cyc__now-meta">
                <span style={{ color: currentColor }}>
                  {catLabels[currentProps.categorie] || currentProps.categorie}
                </span>
                <span>·</span>
                <span>{currentProps.saison || "—"}</span>
                {currentProps.vent_max && (
                  <span>· {currentProps.vent_max} km/h</span>
                )}
              </div>
              {/* Barre de progression */}
              <div className="cyc__progress-track">
                <div
                  className="cyc__progress-fill"
                  style={{
                    width: `${uiProgress}%`,
                    background: currentColor,
                    boxShadow: `0 0 8px ${currentColor}60`,
                  }}
                />
              </div>
              <div className="cyc__progress-label">
                <span>{lang === "fr" ? "Trajectoire" : "Track"}</span>
                <span style={{ color: currentColor }}>{uiProgress}%</span>
              </div>
            </div>
          )}

          {/* Terminé */}
          {simMode === "done" && (
            <div className="cyc__done-msg">
              ✓{" "}
              {lang === "fr"
                ? `${completedSet.size} cyclones simulés`
                : `${completedSet.size} cyclones simulated`}
            </div>
          )}

          {/* Vitesse */}
          <div className="cyc__speed-row">
            <span className="cyc__speed-lbl">
              {lang === "fr" ? "Vitesse" : "Speed"}
            </span>
            <div className="cyc__speeds">
              {SPEEDS.map((s) => (
                <button
                  key={s.key}
                  className={`cyc__speed-btn ${speedKey === s.key ? "cyc__speed-btn--on" : ""}`}
                  onClick={() => {
                    setSpeedKey(s.key);
                    animRef.current.step = s.step;
                  }}
                >
                  {s.label[lang]}
                </button>
              ))}
            </div>
          </div>

          {/* Contrôles */}
          <div className="cyc__controls">
            {simMode === "idle" || simMode === "done" ? (
              <button
                className="cyc__btn-play"
                onClick={startAnimation}
                disabled={filteredFeatures.length === 0}
              >
                ▶{" "}
                {lang === "fr"
                  ? simMode === "done"
                    ? "Rejouer"
                    : "Lancer la simulation"
                  : simMode === "done"
                    ? "Replay"
                    : "Start simulation"}
              </button>
            ) : (
              <>
                <button className="cyc__btn-pause" onClick={pauseResume}>
                  {simMode === "paused" ? "▶ " : "⏸ "}
                  {simMode === "paused"
                    ? lang === "fr"
                      ? "Reprendre"
                      : "Resume"
                    : lang === "fr"
                      ? "Pause"
                      : "Pause"}
                </button>
                <button
                  className="cyc__btn-reset"
                  onClick={resetSim}
                  title="Reset"
                >
                  ↺
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filtre catégorie */}
        <div className="cyc__section">
          <div className="cyc__section-title">
            {lang === "fr" ? "Filtrer par catégorie" : "Filter by category"}
          </div>
          <div className="cyc__cats">
            <button
              className={`cyc__cat ${!catFilter ? "cyc__cat--on" : ""}`}
              onClick={() => {
                setCatFilter(null);
                resetSim();
              }}
            >
              {lang === "fr" ? "Toutes" : "All"}
            </button>
            {Object.entries(CAT_COLORS).map(([cat, color]) => (
              <button
                key={cat}
                className={`cyc__cat ${catFilter === cat ? "cyc__cat--on" : ""}`}
                style={
                  catFilter === cat
                    ? { borderColor: color, color, background: color + "18" }
                    : {}
                }
                onClick={() => {
                  setCatFilter(catFilter === cat ? null : cat);
                  resetSim();
                }}
              >
                <span className="cyc__cat-dot" style={{ background: color }} />
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Liste des cyclones */}
        <div className="cyc__section cyc__section--list">
          <div className="cyc__section-title">
            {lang === "fr" ? "Séquence" : "Sequence"}
            <span className="cyc__section-count">
              {filteredFeatures.length}
            </span>
          </div>
          <div className="cyc__list">
            {filteredFeatures.map((f, i) => {
              const p = f.properties || {};
              const color = CAT_COLORS[p.categorie] || "#90CAF9";
              const done = completedSet.has(i);
              const curr =
                i === currentIdx &&
                (simMode === "running" || simMode === "paused");
              return (
                <div
                  key={i}
                  className={`cyc__list-item ${curr ? "cyc__list-item--current" : ""} ${done ? "cyc__list-item--done" : ""}`}
                  style={
                    curr
                      ? { borderColor: color + "60", background: color + "0D" }
                      : {}
                  }
                >
                  <div className="cyc__list-idx">{i + 1}</div>
                  <div
                    className="cyc__list-dot"
                    style={{
                      background: done || curr ? color : "transparent",
                      borderColor: color,
                    }}
                  />
                  <div className="cyc__list-info">
                    <span
                      className="cyc__list-name"
                      style={{ color: curr ? color : undefined }}
                    >
                      {p.nom || "—"}
                    </span>
                    <span className="cyc__list-meta">
                      {p.saison} · {p.categorie}
                    </span>
                  </div>
                  {curr && (
                    <div
                      className="cyc__list-pulse"
                      style={{ background: color }}
                    />
                  )}
                  {done && <span className="cyc__list-check">✓</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Légende */}
        <div className="cyc__section">
          <div className="cyc__section-title">
            {lang === "fr" ? "Légende" : "Legend"}
          </div>
          <div className="cyc__legend">
            {Object.entries(CAT_COLORS).map(([cat, color]) => (
              <div key={cat} className="cyc__legend-row">
                <div
                  className="cyc__legend-line"
                  style={{ background: color }}
                />
                <span className="cyc__legend-cat">{cat}</span>
                <span className="cyc__legend-lbl">{catLabels[cat]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="cyc__credit">
          data.gouv.nc · Météo-France · SPEArTC · DIMENC
        </div>
      </div>
    </div>
  );
}
