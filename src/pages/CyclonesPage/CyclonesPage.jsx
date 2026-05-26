// src/pages/CyclonesPage/CyclonesPage.jsx
// ============================================================
// Pacific Dataviz Challenge 2026
// Cyclones historiques NC + Pacifique SW — data.gouv.nc
// Store : cyclonesSlice (segments, points, referentiel)
// ============================================================

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Map, {
  Layer,
  Source,
  NavigationControl,
  Popup,
} from "react-map-gl/mapbox";
import { useDispatch, useSelector } from "react-redux";
import "mapbox-gl/dist/mapbox-gl.css";
import "./CyclonesPage.scss";

import {
  loadCyclonesSegments,
  loadCyclonesRef,
  setFilterCategorie,
  setFilterSaison,
  resetFilters,
  setSelectedCyclone,
  clearSelection,
  selectFilteredSegments,
  selectCyclonesRef,
  selectCyclonesLoading,
  selectCyclonesError,
  selectCyclonesFilters,
  selectSelectedCyclone,
} from "../../store/slices/cyclonesSlice";
import { useTheme } from "../../store/context/themeContext";
import { useLang } from "../../store/context/langContext";

const TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

// Couleurs officielles par catégorie
const CAT_COLORS = {
  TD: "#90CAF9",
  TS: "#42A5F5",
  TC: "#FFB74D",
  STC: "#FF7043",
  ITC: "#EF5350",
};

const CAT_LABELS_FR = {
  TD: "Dépression",
  TS: "Tempête",
  TC: "Cyclone",
  STC: "Cyclone sévère",
  ITC: "Cyclone intense",
};
const CAT_LABELS_EN = {
  TD: "Depression",
  TS: "Storm",
  TC: "Cyclone",
  STC: "Severe cyclone",
  ITC: "Intense cyclone",
};

const INITIAL_VIEW = {
  longitude: 166.5,
  latitude: -19.5,
  zoom: 5.5,
  pitch: 40,
  bearing: -8,
};

const DARK_STYLE = "mapbox://styles/mapbox/dark-v11";
const LIGHT_STYLE = "mapbox://styles/mapbox/satellite-streets-v12";

export default function CyclonesPage() {
  const dispatch = useDispatch();
  const { isDark } = useTheme();
  const { lang, t } = useLang();
  const mapRef = useRef(null);

  const segments = useSelector(selectFilteredSegments);
  const referentiel = useSelector(selectCyclonesRef);
  const loading = useSelector(selectCyclonesLoading);
  const error = useSelector(selectCyclonesError);
  const filters = useSelector(selectCyclonesFilters);
  const selected = useSelector(selectSelectedCyclone);

  const [popup, setPopup] = useState(null);
  const [animOffset, setAnimOffset] = useState(0);

  // Chargement initial depuis le store/API
  useEffect(() => {
    dispatch(loadCyclonesSegments());
    dispatch(loadCyclonesRef());
  }, [dispatch]);

  // Animation des trajectoires (dash-offset)
  useEffect(() => {
    let raf;
    const animate = () => {
      setAnimOffset((prev) => (prev - 0.5) % 100);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Saisons disponibles depuis le référentiel
  const saisons = useMemo(() => {
    if (!referentiel) return [];
    const set = new Set(referentiel.map((r) => r.saison).filter(Boolean));
    return Array.from(set).sort().reverse();
  }, [referentiel]);

  // Stats calculées depuis les données filtrées
  const stats = useMemo(() => {
    if (!segments?.features) return { total: 0, byCategory: {} };
    const byCategory = {};
    segments.features.forEach((f) => {
      const cat = f.properties?.categorie || "TD";
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    });
    return { total: segments.features.length, byCategory };
  }, [segments]);

  const catLabels = lang === "fr" ? CAT_LABELS_FR : CAT_LABELS_EN;

  // GeoJSON colorisé dynamiquement
  const geoData = useMemo(() => {
    if (!segments) return null;
    return {
      ...segments,
      features: segments.features.map((f) => ({
        ...f,
        properties: {
          ...f.properties,
          lineColor: CAT_COLORS[f.properties?.categorie] || "#90CAF9",
          lineWidth:
            f.properties?.categorie === "ITC"
              ? 3
              : f.properties?.categorie === "STC"
                ? 2.5
                : 2,
        },
      })),
    };
  }, [segments]);

  const handleMapClick = useCallback(
    (e) => {
      const features = e.features;
      if (!features?.length) {
        dispatch(clearSelection());
        setPopup(null);
        return;
      }
      const f = features[0];
      setPopup({
        longitude: e.lngLat.lng,
        latitude: e.lngLat.lat,
        nom: f.properties.nom,
        saison: f.properties.saison,
        categorie: f.properties.categorie,
        vent: f.properties.vent_max,
        pression: f.properties.pression_min,
      });
      dispatch(setSelectedCyclone(f.properties));
    },
    [dispatch],
  );

  const mapStyle = isDark ? DARK_STYLE : LIGHT_STYLE;

  return (
    <div
      className={`cyc-page ${isDark ? "cyc-page--dark" : "cyc-page--light"}`}
    >
      {/* ── Carte ────────────────────────────────────────── */}
      <div className="cyc-page__map">
        <Map
          ref={mapRef}
          initialViewState={INITIAL_VIEW}
          style={{ width: "100%", height: "100%" }}
          mapStyle={mapStyle}
          mapboxAccessToken={TOKEN}
          interactiveLayerIds={geoData ? ["cyclones-lines"] : []}
          onClick={handleMapClick}
        >
          <NavigationControl position="top-right" visualizePitch />

          {geoData && (
            <Source id="cyclones" type="geojson" data={geoData} lineMetrics>
              {/* Halo (glow) */}
              <Layer
                id="cyclones-glow"
                type="line"
                paint={{
                  "line-color": ["get", "lineColor"],
                  "line-width": ["*", ["get", "lineWidth"], 6],
                  "line-opacity": 0.12,
                  "line-blur": 8,
                }}
              />

              {/* Ligne principale */}
              <Layer
                id="cyclones-lines"
                type="line"
                layout={{ "line-join": "round", "line-cap": "round" }}
                paint={{
                  "line-color": ["get", "lineColor"],
                  "line-width": ["get", "lineWidth"],
                  "line-opacity": 0.9,
                  "line-dasharray": [2, 1],
                }}
              />

              {/* Points de départ */}
              <Layer
                id="cyclones-origin"
                type="circle"
                filter={["==", ["geometry-type"], "Point"]}
                paint={{
                  "circle-radius": 4,
                  "circle-color": ["get", "lineColor"],
                  "circle-opacity": 0.9,
                  "circle-stroke-width": 1.5,
                  "circle-stroke-color": "rgba(255,255,255,0.5)",
                }}
              />
            </Source>
          )}

          {/* Popup */}
          {popup && (
            <Popup
              longitude={popup.longitude}
              latitude={popup.latitude}
              closeButton
              closeOnClick={false}
              onClose={() => {
                setPopup(null);
                dispatch(clearSelection());
              }}
              className="cyc-popup"
              anchor="bottom"
            >
              <div className="cyc-popup__inner">
                <div className="cyc-popup__name">{popup.nom || "—"}</div>
                <div
                  className="cyc-popup__cat"
                  style={{ color: CAT_COLORS[popup.categorie] }}
                >
                  {catLabels[popup.categorie] || popup.categorie}
                </div>
                <div className="cyc-popup__grid">
                  <span>{lang === "fr" ? "Saison" : "Season"}</span>
                  <strong>{popup.saison || "—"}</strong>
                  <span>{lang === "fr" ? "Vent max" : "Max wind"}</span>
                  <strong>{popup.vent ? `${popup.vent} km/h` : "—"}</strong>
                  <span>{lang === "fr" ? "Pression min" : "Min pressure"}</span>
                  <strong>
                    {popup.pression ? `${popup.pression} hPa` : "—"}
                  </strong>
                </div>
              </div>
            </Popup>
          )}
        </Map>
      </div>

      {/* ── Panel gauche ─────────────────────────────────── */}
      <div className="cyc-panel">
        {/* Titre */}
        <div className="cyc-panel__head">
          <div className="cyc-panel__icon">🌀</div>
          <div>
            <div className="cyc-panel__title">
              {lang === "fr" ? "Cyclones historiques" : "Historical Cyclones"}
            </div>
            <div className="cyc-panel__subtitle">
              {lang === "fr"
                ? "NC & Pacifique SW · data.gouv.nc"
                : "NC & SW Pacific · data.gouv.nc"}
            </div>
          </div>
        </div>

        {/* État chargement / erreur */}
        {loading && (
          <div className="cyc-panel__loading">
            <div className="cyc-panel__spinner" />
            <span>{lang === "fr" ? "Chargement…" : "Loading…"}</span>
          </div>
        )}
        {error && (
          <div className="cyc-panel__error">
            ⚠{" "}
            {lang === "fr"
              ? "Données mock (API indisponible)"
              : "Mock data (API unavailable)"}
          </div>
        )}

        {/* Stats */}
        <div className="cyc-panel__stats">
          <div className="cyc-panel__stat">
            <div className="cyc-panel__stat-val">{stats.total}</div>
            <div className="cyc-panel__stat-lbl">
              {lang === "fr" ? "trajectoires" : "tracks"}
            </div>
          </div>
          {Object.entries(stats.byCategory).map(([cat, count]) => (
            <div key={cat} className="cyc-panel__stat">
              <div
                className="cyc-panel__stat-val"
                style={{ color: CAT_COLORS[cat] }}
              >
                {count}
              </div>
              <div className="cyc-panel__stat-lbl">{cat}</div>
            </div>
          ))}
        </div>

        {/* Filtre catégorie */}
        <div className="cyc-panel__section">
          <div className="cyc-panel__section-title">
            {lang === "fr" ? "Catégorie" : "Category"}
          </div>
          <div className="cyc-panel__cats">
            <button
              className={`cyc-cat ${!filters.categorie ? "cyc-cat--on" : ""}`}
              onClick={() => dispatch(setFilterCategorie(null))}
            >
              {lang === "fr" ? "Toutes" : "All"}
            </button>
            {Object.entries(CAT_COLORS).map(([cat, color]) => (
              <button
                key={cat}
                className={`cyc-cat ${filters.categorie === cat ? "cyc-cat--on" : ""}`}
                style={
                  filters.categorie === cat
                    ? { borderColor: color, color, background: `${color}18` }
                    : {}
                }
                onClick={() =>
                  dispatch(
                    setFilterCategorie(filters.categorie === cat ? null : cat),
                  )
                }
              >
                <span className="cyc-cat__dot" style={{ background: color }} />
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Filtre saison */}
        {saisons.length > 0 && (
          <div className="cyc-panel__section">
            <div className="cyc-panel__section-title">
              {lang === "fr" ? "Saison" : "Season"}
            </div>
            <select
              className="cyc-panel__select"
              value={filters.saison || ""}
              onChange={(e) =>
                dispatch(setFilterSaison(e.target.value || null))
              }
            >
              <option value="">
                {lang === "fr" ? "Toutes les saisons" : "All seasons"}
              </option>
              {saisons.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Reset */}
        {(filters.categorie || filters.saison) && (
          <button
            className="cyc-panel__reset"
            onClick={() => dispatch(resetFilters())}
          >
            ↺ {lang === "fr" ? "Réinitialiser" : "Reset filters"}
          </button>
        )}

        {/* Légende */}
        <div className="cyc-panel__section">
          <div className="cyc-panel__section-title">
            {lang === "fr" ? "Légende" : "Legend"}
          </div>
          <div className="cyc-panel__legend">
            {Object.entries(CAT_COLORS).map(([cat, color]) => (
              <div key={cat} className="cyc-legend-row">
                <div
                  className="cyc-legend-line"
                  style={{ background: color }}
                />
                <span className="cyc-legend-cat">{cat}</span>
                <span className="cyc-legend-lbl">{catLabels[cat]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="cyc-panel__credit">
          data.gouv.nc · Météo-France · SPEArTC
          {segments?.features?.[0]?.properties?.mock && (
            <span className="cyc-panel__mock-badge"> · ⚠ Mock</span>
          )}
        </div>
      </div>
    </div>
  );
}
