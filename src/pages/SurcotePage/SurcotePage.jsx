// src/pages/SurcotePage/SurcotePage.jsx
// ============================================================
// Pacific Dataviz Challenge 2026
// Surcote côtière NC — cyclone centennal
// Données : sucoteSlice  (state.surcote)
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
  SURCOTE_THRESHOLDS,
} from "../../store/slices/sucoteSlice";

import { useTheme } from "../../store/context/themeContext";
import { useLang } from "../../store/context/langContext";

const TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

const DANGER_COLORS = {
  low: "#F9E537",
  moderate: "#FF9F0A",
  high: "#FF3B30",
  extreme: "#BF5AF2",
};

const DANGER_FR = {
  low: "Vigilance",
  moderate: "Danger",
  high: "Critique",
  extreme: "Catastrophique",
};
const DANGER_EN = {
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

const getSurcoteColor = (val) => {
  if (!val || val < SURCOTE_THRESHOLDS.low) return DANGER_COLORS.low;
  if (val < SURCOTE_THRESHOLDS.moderate) return DANGER_COLORS.low;
  if (val < SURCOTE_THRESHOLDS.high) return DANGER_COLORS.moderate;
  if (val < SURCOTE_THRESHOLDS.extreme) return DANGER_COLORS.high;
  return DANGER_COLORS.extreme;
};

// Expression Mapbox step pour la couleur selon surcote_max
const COLOR_EXPR = [
  "step",
  ["get", "surcote_max"],
  DANGER_COLORS.low,
  SURCOTE_THRESHOLDS.moderate,
  DANGER_COLORS.moderate,
  SURCOTE_THRESHOLDS.high,
  DANGER_COLORS.high,
  SURCOTE_THRESHOLDS.extreme,
  DANGER_COLORS.extreme,
];

const RADIUS_EXPR = [
  "interpolate",
  ["linear"],
  ["get", "surcote_max"],
  0,
  3,
  4,
  10,
];

export default function SurcotePage() {
  const dispatch = useDispatch();
  const { isDark } = useTheme();
  const { lang } = useLang();
  const mapRef = useRef(null);

  // ── Store ─────────────────────────────────────────────────
  const features = useSelector(selectFilteredSurcote); // FeatureCollection | null
  const stats = useSelector(selectSurcoteStats);
  const loading = useSelector(selectSurcoteLoading);
  const error = useSelector(selectSurcoteError);
  const threshold = useSelector(selectDisplayThreshold);
  const vizMode = useSelector(selectVizMode);

  const [popup, setPopup] = useState(null);

  useEffect(() => {
    dispatch(loadSurcoteData());
  }, [dispatch]);

  const D = lang === "fr" ? DANGER_FR : DANGER_EN;

  // ── GeoJSON stable pour Mapbox ────────────────────────────
  // On enrichit les features avec la valeur d'affichage choisie
  const geoData = useMemo(() => {
    if (!features?.features?.length)
      return { type: "FeatureCollection", features: [] };
    return {
      ...features,
      features: features.features.map((f) => {
        const p = f.properties || {};
        const displayVal =
          vizMode === "vague"
            ? (p.hauteur_significative_max ?? 0)
            : vizMode === "periode"
              ? (p.periode_max ?? 0)
              : (p.surcote_max ?? 0);
        return {
          ...f,
          properties: { ...p, _displayVal: displayVal },
        };
      }),
    };
  }, [features, vizMode]);

  // ── Expression couleur selon vizMode ─────────────────────
  const colorExpr = useMemo(() => {
    const field =
      vizMode === "vague"
        ? "hauteur_significative_max"
        : vizMode === "periode"
          ? "periode_max"
          : "surcote_max";
    if (vizMode === "surcote") return COLOR_EXPR;
    // Pour vague/periode, gradient simple vert→rouge
    return [
      "interpolate",
      ["linear"],
      ["get", field],
      0,
      "#4CAF50",
      4,
      "#FF9100",
      10,
      "#FF1744",
    ];
  }, [vizMode]);

  const radiusExpr = useMemo(() => {
    const field =
      vizMode === "vague"
        ? "hauteur_significative_max"
        : vizMode === "periode"
          ? "periode_max"
          : "surcote_max";
    return ["interpolate", ["linear"], ["get", field], 0, 3, 8, 11];
  }, [vizMode]);

  const handleClick = useCallback(
    (e) => {
      if (!e.features?.length) {
        dispatch(clearSelectedPoint());
        setPopup(null);
        return;
      }
      const f = e.features[0];
      const p = f.properties;
      dispatch(setSelectedPoint(p));
      setPopup({ longitude: e.lngLat.lng, latitude: e.lngLat.lat, ...p });
    },
    [dispatch],
  );

  const mapStyle = isDark
    ? "mapbox://styles/mapbox/dark-v11"
    : "mapbox://styles/mapbox/satellite-streets-v12";

  const VIZ_MODES = [
    { key: "surcote", label: { fr: "Surcote", en: "Storm surge" }, unit: "m" },
    { key: "vague", label: { fr: "Vague", en: "Wave height" }, unit: "m" },
    { key: "periode", label: { fr: "Période", en: "Wave period" }, unit: "s" },
  ];

  const isMock = geoData.features?.[0]?.properties?.mock;

  return (
    <div className={`sur ${isDark ? "sur--dark" : "sur--light"}`}>
      {/* ── Carte ─────────────────────────────────────── */}
      <div className="sur__map">
        <Map
          ref={mapRef}
          initialViewState={INITIAL_VIEW}
          style={{ width: "100%", height: "100%" }}
          mapStyle={mapStyle}
          mapboxAccessToken={TOKEN}
          interactiveLayerIds={geoData.features.length ? ["sur-points"] : []}
          onClick={handleClick}
        >
          <NavigationControl position="top-right" visualizePitch />

          {/* Couche principale : points de surcote */}
          <Source id="surcote-data" type="geojson" data={geoData}>
            {/* Halo points extrêmes */}
            <Layer
              id="sur-extreme-halo"
              type="circle"
              filter={[
                ">=",
                ["get", "surcote_max"],
                SURCOTE_THRESHOLDS.extreme,
              ]}
              paint={{
                "circle-radius": 22,
                "circle-color": DANGER_COLORS.extreme,
                "circle-opacity": 0.18,
                "circle-blur": 1.2,
              }}
            />

            {/* Points principaux */}
            <Layer
              id="sur-points"
              type="circle"
              paint={{
                "circle-radius": radiusExpr,
                "circle-color": colorExpr,
                "circle-opacity": 0.88,
                "circle-stroke-width": 1,
                "circle-stroke-color": "rgba(255,255,255,0.25)",
              }}
            />
          </Source>

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
              anchor="bottom"
              className="sur-popup"
            >
              <div className="sur-popup__inner">
                <div
                  className="sur-popup__badge"
                  style={{
                    background: getSurcoteColor(popup.surcote_max) + "22",
                    borderColor: getSurcoteColor(popup.surcote_max),
                    color: getSurcoteColor(popup.surcote_max),
                  }}
                >
                  {D[popup.danger] || D.low}
                </div>
                <table className="sur-popup__table">
                  <tbody>
                    <tr>
                      <td>Surcote max</td>
                      <td style={{ color: getSurcoteColor(popup.surcote_max) }}>
                        {popup.surcote_max != null
                          ? `${Number(popup.surcote_max).toFixed(2)} m`
                          : "—"}
                      </td>
                    </tr>
                    <tr>
                      <td>{lang === "fr" ? "Vague sig." : "Sig. wave"}</td>
                      <td>
                        {popup.hauteur_significative_max != null
                          ? `${Number(popup.hauteur_significative_max).toFixed(1)} m`
                          : "—"}
                      </td>
                    </tr>
                    <tr>
                      <td>{lang === "fr" ? "Période" : "Period"}</td>
                      <td>
                        {popup.periode_max != null
                          ? `${Number(popup.periode_max).toFixed(1)} s`
                          : "—"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Popup>
          )}
        </Map>
      </div>

      {/* ── Panel ─────────────────────────────────────── */}
      <div className="sur__panel">
        {/* Header */}
        <div className="sur__head">
          <span className="sur__head-icon">🏖</span>
          <div>
            <div className="sur__head-title">
              {lang === "fr" ? "Surcote côtière" : "Coastal Storm Surge"}
            </div>
            <div className="sur__head-sub">
              {lang === "fr"
                ? "Cyclone centennal · DIMENC–IRD · NC"
                : "Centennial cyclone · DIMENC–IRD · NC"}
            </div>
          </div>
        </div>

        {/* Status */}
        {loading && (
          <div className="sur__status">
            <div className="sur__spinner" />
            <span>
              {lang === "fr" ? "Chargement des données…" : "Loading data…"}
            </span>
          </div>
        )}
        {error && !loading && (
          <div className="sur__error">
            ⚠{" "}
            {lang === "fr"
              ? "API indisponible — données mock"
              : "API unavailable — mock data"}
          </div>
        )}
        {isMock && !loading && !error && (
          <div className="sur__mock">⚠ Mock</div>
        )}

        {/* KPIs */}
        <div className="sur__kpis">
          <div className="sur__kpi">
            <div
              className="sur__kpi-val"
              style={{ color: DANGER_COLORS.extreme }}
            >
              {stats?.maxSurcote
                ? `${Number(stats.maxSurcote).toFixed(2)} m`
                : "—"}
            </div>
            <div className="sur__kpi-lbl">
              {lang === "fr" ? "Surcote max" : "Max surge"}
            </div>
          </div>
          <div className="sur__kpi">
            <div className="sur__kpi-val" style={{ color: DANGER_COLORS.high }}>
              {stats?.pointsExtremes ?? 0}
            </div>
            <div className="sur__kpi-lbl">
              {lang === "fr" ? "Points critiques" : "Critical pts"}
            </div>
          </div>
          <div className="sur__kpi">
            <div
              className="sur__kpi-val"
              style={{ color: DANGER_COLORS.moderate }}
            >
              {stats?.totalPoints ?? 0}
            </div>
            <div className="sur__kpi-lbl">
              {lang === "fr" ? "Points côtiers" : "Coastal pts"}
            </div>
          </div>
        </div>

        {/* Variable */}
        <div className="sur__section">
          <div className="sur__section-title">
            {lang === "fr" ? "Variable affichée" : "Display variable"}
          </div>
          <div className="sur__modes">
            {VIZ_MODES.map((m) => (
              <button
                key={m.key}
                className={`sur__mode ${vizMode === m.key ? "sur__mode--on" : ""}`}
                onClick={() => dispatch(setVizMode(m.key))}
              >
                <span>{m.label[lang]}</span>
                <span className="sur__mode-unit">{m.unit}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Seuil */}
        <div className="sur__section">
          <div className="sur__section-title">
            {lang === "fr" ? "Seuil minimum affiché" : "Minimum threshold"}
          </div>
          <div className="sur__thresholds">
            {Object.entries(SURCOTE_THRESHOLDS).map(([key, val]) => (
              <button
                key={key}
                className={`sur__thresh ${threshold === key ? "sur__thresh--on" : ""}`}
                style={
                  threshold === key
                    ? {
                        borderColor: DANGER_COLORS[key],
                        color: DANGER_COLORS[key],
                        background: DANGER_COLORS[key] + "14",
                      }
                    : {}
                }
                onClick={() => dispatch(setDisplayThreshold(key))}
              >
                <span
                  className="sur__thresh-dot"
                  style={{ background: DANGER_COLORS[key] }}
                />
                <span>{D[key]}</span>
                <span className="sur__thresh-val">≥ {val} m</span>
              </button>
            ))}
          </div>
        </div>

        {/* Légende */}
        <div className="sur__section">
          <div className="sur__section-title">
            {lang === "fr" ? "Niveaux de danger" : "Danger levels"}
          </div>
          <div className="sur__legend">
            {Object.entries(DANGER_COLORS).map(([key, color]) => (
              <div key={key} className="sur__legend-row">
                <div
                  className="sur__legend-dot"
                  style={{ background: color, boxShadow: `0 0 6px ${color}70` }}
                />
                <span className="sur__legend-lbl">{D[key]}</span>
                <span className="sur__legend-val" style={{ color }}>
                  ≥ {SURCOTE_THRESHOLDS[key]} m
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="sur__credit">
          DIMENC · IRD · BENEBIG 2024 · data.gouv.nc
        </div>
      </div>
    </div>
  );
}
