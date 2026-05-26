// src/pages/SurcotePage/SurcotePage.jsx
// ============================================================
// Pacific Dataviz Challenge 2026
// Surcote côtière NC — cyclone centennal
// Store : surcoteSlice (features, stats, filters)
// ============================================================

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Map, {
  Layer,
  Source,
  NavigationControl,
  Popup,
} from "react-map-gl/mapbox";
import { useDispatch, useSelector } from "react-redux";
import "mapbox-gl/dist/mapbox-gl.css";
import "./SurcotePage.scss";

import {
  loadSurcoteData,
  setDisplayThreshold,
  setVizMode,
  setSelectedPoint,
  clearSelectedPoint,
  selectFilteredSurcote,
  selectSurcoteStats,
  selectSurcoteLoading,
  selectSurcoteError,
  selectDisplayThreshold,
  selectVizMode,
  selectSelectedPoint,
  SURCOTE_THRESHOLDS,
} from "../../store/slices/sucoteSlice";
import { useTheme } from "../../store/context/themeContext";
import { useLang } from "../../store/context/langContext";

const TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

// Palette de danger
const DANGER_COLORS = {
  low: "#F9E537",
  moderate: "#FF9F0A",
  high: "#FF3B30",
  extreme: "#BF5AF2",
};

const DANGER_LABELS_FR = {
  low: "Vigilance",
  moderate: "Danger",
  high: "Critique",
  extreme: "Catastrophique",
};
const DANGER_LABELS_EN = {
  low: "Watch",
  moderate: "Danger",
  high: "Critical",
  extreme: "Catastrophic",
};

const INITIAL_VIEW = {
  longitude: 165.9,
  latitude: -21.5,
  zoom: 7.5,
  pitch: 45,
  bearing: -5,
};

const DARK_STYLE = "mapbox://styles/mapbox/dark-v11";
const LIGHT_STYLE = "mapbox://styles/mapbox/satellite-streets-v12";

// Couleur en fonction de la valeur de surcote
const surcoteToColor = (val) => {
  if (val >= SURCOTE_THRESHOLDS.extreme) return DANGER_COLORS.extreme;
  if (val >= SURCOTE_THRESHOLDS.high) return DANGER_COLORS.high;
  if (val >= SURCOTE_THRESHOLDS.moderate) return DANGER_COLORS.moderate;
  return DANGER_COLORS.low;
};

export default function SurcotePage() {
  const dispatch = useDispatch();
  const { isDark } = useTheme();
  const { lang } = useLang();

  const features = useSelector(selectFilteredSurcote);
  const stats = useSelector(selectSurcoteStats);
  const loading = useSelector(selectSurcoteLoading);
  const error = useSelector(selectSurcoteError);
  const threshold = useSelector(selectDisplayThreshold);
  const vizMode = useSelector(selectVizMode);
  const selected = useSelector(selectSelectedPoint);

  const [popup, setPopup] = useState(null);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    dispatch(loadSurcoteData());
  }, [dispatch]);

  // Animation de pulsation des points extrêmes
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse((p) => (p + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const dangerLabels = lang === "fr" ? DANGER_LABELS_FR : DANGER_LABELS_EN;

  // GeoJSON enrichi avec les couleurs
  const geoData = useMemo(() => {
    if (!features?.features) return null;
    return {
      ...features,
      features: features.features.map((f) => {
        const val =
          vizMode === "vague"
            ? f.properties?.hauteur_significative_max
            : vizMode === "periode"
              ? f.properties?.periode_max
              : f.properties?.surcote_max;

        const normalized =
          vizMode === "surcote"
            ? val / 4.0
            : vizMode === "vague"
              ? val / 12.0
              : val / 20.0;

        return {
          ...f,
          properties: {
            ...f.properties,
            displayVal: val,
            pointColor: surcoteToColor(f.properties?.surcote_max || 0),
            pointRadius: 3 + (normalized || 0) * 6,
            isExtreme:
              (f.properties?.surcote_max || 0) >= SURCOTE_THRESHOLDS.extreme,
          },
        };
      }),
    };
  }, [features, vizMode]);

  const handleMapClick = useCallback(
    (e) => {
      if (!e.features?.length) {
        dispatch(clearSelectedPoint());
        setPopup(null);
        return;
      }
      const f = e.features[0];
      const props = f.properties;
      setPopup({
        longitude: e.lngLat.lng,
        latitude: e.lngLat.lat,
        ...props,
      });
      dispatch(setSelectedPoint(props));
    },
    [dispatch],
  );

  const mapStyle = isDark ? DARK_STYLE : LIGHT_STYLE;

  const vizModes = [
    {
      key: "surcote",
      label: lang === "fr" ? "Surcote" : "Storm surge",
      unit: "m",
    },
    { key: "vague", label: lang === "fr" ? "Vague" : "Wave height", unit: "m" },
    {
      key: "periode",
      label: lang === "fr" ? "Période" : "Wave period",
      unit: "s",
    },
  ];

  const thresholds = Object.entries(SURCOTE_THRESHOLDS);

  return (
    <div
      className={`sur-page ${isDark ? "sur-page--dark" : "sur-page--light"}`}
    >
      {/* ── Carte ────────────────────────────────────────── */}
      <div className="sur-page__map">
        <Map
          initialViewState={INITIAL_VIEW}
          style={{ width: "100%", height: "100%" }}
          mapStyle={mapStyle}
          mapboxAccessToken={TOKEN}
          interactiveLayerIds={geoData ? ["surcote-points"] : []}
          onClick={handleMapClick}
        >
          <NavigationControl position="top-right" visualizePitch />

          {geoData && (
            <Source id="surcote" type="geojson" data={geoData}>
              {/* Halo des points extrêmes */}
              <Layer
                id="surcote-extreme-halo"
                type="circle"
                filter={["==", ["get", "isExtreme"], true]}
                paint={{
                  "circle-radius": 16,
                  "circle-color": DANGER_COLORS.extreme,
                  "circle-opacity":
                    0.15 + Math.abs(Math.sin(pulse * 0.06)) * 0.1,
                  "circle-blur": 1,
                }}
              />

              {/* Points principaux */}
              <Layer
                id="surcote-points"
                type="circle"
                paint={{
                  "circle-radius": ["get", "pointRadius"],
                  "circle-color": ["get", "pointColor"],
                  "circle-opacity": 0.85,
                  "circle-stroke-width": 1,
                  "circle-stroke-color": "rgba(255,255,255,0.3)",
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
                dispatch(clearSelectedPoint());
              }}
              className="sur-popup"
              anchor="bottom"
            >
              <div className="sur-popup__inner">
                <div
                  className="sur-popup__level"
                  style={{
                    background: surcoteToColor(popup.surcote_max || 0) + "22",
                    borderColor: surcoteToColor(popup.surcote_max || 0),
                  }}
                >
                  <span
                    style={{ color: surcoteToColor(popup.surcote_max || 0) }}
                  >
                    {dangerLabels[popup.danger] || "—"}
                  </span>
                </div>
                <div className="sur-popup__grid">
                  <span>Surcote max</span>
                  <strong
                    style={{ color: surcoteToColor(popup.surcote_max || 0) }}
                  >
                    {popup.surcote_max != null
                      ? `${popup.surcote_max.toFixed(2)} m`
                      : "—"}
                  </strong>
                  <span>
                    {lang === "fr" ? "Vague sig. max" : "Max sig. wave"}
                  </span>
                  <strong>
                    {popup.hauteur_significative_max != null
                      ? `${popup.hauteur_significative_max.toFixed(1)} m`
                      : "—"}
                  </strong>
                  <span>{lang === "fr" ? "Période max" : "Max period"}</span>
                  <strong>
                    {popup.periode_max != null
                      ? `${popup.periode_max.toFixed(1)} s`
                      : "—"}
                  </strong>
                </div>
              </div>
            </Popup>
          )}
        </Map>
      </div>

      {/* ── Panel ────────────────────────────────────────── */}
      <div className="sur-panel">
        {/* Titre */}
        <div className="sur-panel__head">
          <div className="sur-panel__icon">🏖</div>
          <div>
            <div className="sur-panel__title">
              {lang === "fr" ? "Surcote côtière" : "Coastal Storm Surge"}
            </div>
            <div className="sur-panel__subtitle">
              {lang === "fr"
                ? "Cyclone centennal · NC · DIMENC–IRD"
                : "Centennial cyclone · NC · DIMENC–IRD"}
            </div>
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="sur-panel__loading">
            <div className="sur-panel__spinner" />
            <span>{lang === "fr" ? "Chargement…" : "Loading…"}</span>
          </div>
        )}
        {error && (
          <div className="sur-panel__error">
            ⚠{" "}
            {lang === "fr"
              ? "Données mock (API indisponible)"
              : "Mock data (API unavailable)"}
          </div>
        )}

        {/* KPIs */}
        <div className="sur-panel__kpis">
          <div className="sur-panel__kpi">
            <div
              className="sur-panel__kpi-val"
              style={{ color: DANGER_COLORS.extreme }}
            >
              {stats.maxSurcote ? `${stats.maxSurcote.toFixed(2)} m` : "—"}
            </div>
            <div className="sur-panel__kpi-lbl">
              {lang === "fr" ? "Surcote max" : "Max surge"}
            </div>
          </div>
          <div className="sur-panel__kpi">
            <div
              className="sur-panel__kpi-val"
              style={{ color: DANGER_COLORS.high }}
            >
              {stats.pointsExtremes || 0}
            </div>
            <div className="sur-panel__kpi-lbl">
              {lang === "fr" ? "Points critiques" : "Critical points"}
            </div>
          </div>
          <div className="sur-panel__kpi">
            <div
              className="sur-panel__kpi-val"
              style={{ color: DANGER_COLORS.moderate }}
            >
              {stats.totalPoints || 0}
            </div>
            <div className="sur-panel__kpi-lbl">
              {lang === "fr" ? "Points côtiers" : "Coastal points"}
            </div>
          </div>
        </div>

        {/* Mode de visualisation */}
        <div className="sur-panel__section">
          <div className="sur-panel__section-title">
            {lang === "fr" ? "Variable affichée" : "Display variable"}
          </div>
          <div className="sur-panel__modes">
            {vizModes.map(({ key, label, unit }) => (
              <button
                key={key}
                className={`sur-mode ${vizMode === key ? "sur-mode--on" : ""}`}
                onClick={() => dispatch(setVizMode(key))}
              >
                <span className="sur-mode__label">{label}</span>
                <span className="sur-mode__unit">{unit}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Seuil minimum */}
        <div className="sur-panel__section">
          <div className="sur-panel__section-title">
            {lang === "fr" ? "Seuil minimum" : "Minimum threshold"}
          </div>
          <div className="sur-panel__thresholds">
            {thresholds.map(([key, val]) => (
              <button
                key={key}
                className={`sur-thresh ${threshold === key ? "sur-thresh--on" : ""}`}
                style={
                  threshold === key
                    ? {
                        borderColor: DANGER_COLORS[key],
                        color: DANGER_COLORS[key],
                        background: DANGER_COLORS[key] + "18",
                      }
                    : {}
                }
                onClick={() => dispatch(setDisplayThreshold(key))}
              >
                <span
                  className="sur-thresh__dot"
                  style={{ background: DANGER_COLORS[key] }}
                />
                <span className="sur-thresh__label">{dangerLabels[key]}</span>
                <span className="sur-thresh__val">≥ {val} m</span>
              </button>
            ))}
          </div>
        </div>

        {/* Légende couleurs */}
        <div className="sur-panel__section">
          <div className="sur-panel__section-title">
            {lang === "fr" ? "Niveaux de risque" : "Risk levels"}
          </div>
          <div className="sur-panel__legend">
            {Object.entries(DANGER_COLORS).map(([key, color]) => (
              <div key={key} className="sur-legend-row">
                <div
                  className="sur-legend-dot"
                  style={{ background: color, boxShadow: `0 0 6px ${color}80` }}
                />
                <span className="sur-legend-lbl">{dangerLabels[key]}</span>
                <span className="sur-legend-val" style={{ color }}>
                  ≥ {SURCOTE_THRESHOLDS[key]} m
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="sur-panel__credit">
          DIMENC · IRD · BENEBIG 2024 · data.gouv.nc
          {features?.features?.[0]?.properties?.mock && (
            <span className="sur-panel__mock-badge"> · ⚠ Mock</span>
          )}
        </div>
      </div>
    </div>
  );
}
