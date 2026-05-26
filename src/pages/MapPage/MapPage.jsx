// src/pages/MapPage/MapPage.jsx
// ============================================================
// Pacific Dataviz Challenge 2026
// Montée des eaux NC — Simulation flood + SeaLevelControl
// Données : seaLevelData (local) + NOAA API via SeaLevelControl
// Refonte v2 — propre, sans imports morts
// ============================================================

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import Map, { NavigationControl, Layer, Source } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import "./MapPage.scss";

import { useTheme } from "../../store/context/themeContext";
import { useLang } from "../../store/context/langContext";
import SeaLevelControl from "../../components/SeaLevelControl";

const TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

// ─── Stations NOAA (passées à SeaLevelControl) ───────────────
const NOAA_STATIONS = [
  {
    id: "1612340",
    label: "Honolulu, Hawaii",
    longitude: -157.867,
    latitude: 21.303,
  },
  {
    id: "1770000",
    label: "Pago Pago, Samoa am.",
    longitude: -170.69,
    latitude: -14.28,
  },
  {
    id: "1630000",
    label: "Apra Harbor, Guam",
    longitude: 144.657,
    latitude: 13.443,
  },
];

const INITIAL_VIEW = {
  longitude: 166.45,
  latitude: -22.27,
  zoom: 6.5,
  pitch: 55,
  bearing: -12,
};

// ─── NOAA fetch ───────────────────────────────────────────────
const fetchNoaaWaterLevel = async (stationId) => {
  const url = new URL(
    "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter",
  );
  url.searchParams.set("station", stationId);
  url.searchParams.set("product", "water_level");
  url.searchParams.set("date", "latest");
  url.searchParams.set("datum", "MSL");
  url.searchParams.set("units", "metric");
  url.searchParams.set("time_zone", "gmt");
  url.searchParams.set("format", "json");
  url.searchParams.set("application", "pacific-sea-level-map");
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("NOAA HTTP " + res.status);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || "Erreur NOAA");
  const row = json.data?.[0];
  if (!row) throw new Error("Aucune donnée NOAA.");
  return { value: Number(row.v), time: row.t, stationId };
};

// ═══════════════════════════════════════════════════════════
// CONTOURS NC PAR NIVEAU (anti-horaire = inner ring = soustraction)
// ═══════════════════════════════════════════════════════════

const NC_SHORE_0 = [
  [164.168, -20.012],
  [164.525, -20.338],
  [164.675, -20.428],
  [164.812, -20.545],
  [164.888, -20.648],
  [165.002, -20.738],
  [165.148, -20.808],
  [165.215, -20.858],
  [165.278, -20.945],
  [165.328, -21.025],
  [165.388, -21.088],
  [165.445, -21.152],
  [165.508, -21.228],
  [165.558, -21.298],
  [165.628, -21.388],
  [165.658, -21.458],
  [165.698, -21.528],
  [165.745, -21.595],
  [165.808, -21.648],
  [165.858, -21.698],
  [165.905, -21.748],
  [165.958, -21.808],
  [166.015, -21.848],
  [166.068, -21.878],
  [166.118, -21.928],
  [166.158, -21.988],
  [166.205, -22.048],
  [166.248, -22.105],
  [166.278, -22.145],
  [166.315, -22.178],
  [166.348, -22.208],
  [166.378, -22.232],
  [166.398, -22.262],
  [166.428, -22.282],
  [166.448, -22.302],
  [166.468, -22.325],
  [166.495, -22.348],
  [166.528, -22.368],
  [166.558, -22.388],
  [166.588, -22.408],
  [166.625, -22.428],
  [166.658, -22.448],
  [166.695, -22.448],
  [166.728, -22.438],
  [166.758, -22.418],
  [166.788, -22.398],
  [166.818, -22.378],
  [166.848, -22.358],
  [166.878, -22.338],
  [166.908, -22.308],
  [166.938, -22.278],
  [166.968, -22.248],
  [166.998, -22.218],
  [167.028, -22.188],
  [167.058, -22.158],
  [167.085, -22.128],
  [167.108, -22.098],
  [167.128, -22.068],
  [167.145, -22.038],
  [167.158, -22.008],
  [167.168, -21.978],
  [167.175, -21.948],
  [167.178, -21.918],
  [167.178, -21.888],
  [167.175, -21.858],
  [167.168, -21.828],
  [167.158, -21.798],
  [167.145, -21.768],
  [167.098, -21.748],
  [167.038, -21.748],
  [166.978, -21.758],
  [166.918, -21.778],
  [166.858, -21.808],
  [166.798, -21.838],
  [166.738, -21.868],
  [166.678, -21.878],
  [166.618, -21.868],
  [166.558, -21.838],
  [166.498, -21.798],
  [166.438, -21.748],
  [166.378, -21.698],
  [166.318, -21.648],
  [166.258, -21.598],
  [166.198, -21.548],
  [166.138, -21.498],
  [166.078, -21.448],
  [166.018, -21.398],
  [165.958, -21.348],
  [165.898, -21.298],
  [165.838, -21.248],
  [165.778, -21.198],
  [165.718, -21.148],
  [165.658, -21.098],
  [165.598, -21.048],
  [165.538, -20.998],
  [165.478, -20.948],
  [165.418, -20.898],
  [165.358, -20.848],
  [165.298, -20.798],
  [165.238, -20.748],
  [165.178, -20.698],
  [165.118, -20.648],
  [165.058, -20.598],
  [164.998, -20.548],
  [164.938, -20.498],
  [164.878, -20.448],
  [164.818, -20.398],
  [164.758, -20.348],
  [164.698, -20.298],
  [164.638, -20.248],
  [164.578, -20.198],
  [164.518, -20.148],
  [164.458, -20.098],
  [164.398, -20.052],
  [164.338, -20.022],
  [164.278, -20.008],
  [164.218, -20.008],
  [164.168, -20.012],
];

const NC_SHORE_1 = [
  [164.198, -20.015],
  [164.548, -20.355],
  [164.698, -20.445],
  [164.835, -20.562],
  [164.912, -20.665],
  [165.025, -20.755],
  [165.172, -20.825],
  [165.238, -20.875],
  [165.302, -20.962],
  [165.352, -21.042],
  [165.412, -21.105],
  [165.468, -21.168],
  [165.532, -21.245],
  [165.582, -21.315],
  [165.652, -21.405],
  [165.682, -21.475],
  [165.722, -21.545],
  [165.768, -21.612],
  [165.832, -21.665],
  [165.882, -21.715],
  [165.928, -21.765],
  [165.982, -21.825],
  [166.038, -21.865],
  [166.092, -21.895],
  [166.142, -21.945],
  [166.182, -22.005],
  [166.228, -22.062],
  [166.272, -22.118],
  [166.302, -22.158],
  [166.338, -22.192],
  [166.372, -22.222],
  [166.402, -22.248],
  [166.422, -22.278],
  [166.452, -22.298],
  [166.472, -22.318],
  [166.492, -22.342],
  [166.518, -22.365],
  [166.548, -22.385],
  [166.578, -22.402],
  [166.608, -22.418],
  [166.645, -22.435],
  [166.678, -22.452],
  [166.715, -22.452],
  [166.748, -22.442],
  [166.778, -22.422],
  [166.808, -22.402],
  [166.838, -22.382],
  [166.868, -22.362],
  [166.898, -22.342],
  [166.928, -22.312],
  [166.958, -22.282],
  [166.988, -22.252],
  [167.018, -22.222],
  [167.048, -22.192],
  [167.078, -22.162],
  [167.105, -22.132],
  [167.128, -22.102],
  [167.148, -22.072],
  [167.165, -22.042],
  [167.178, -22.012],
  [167.188, -21.982],
  [167.195, -21.952],
  [167.198, -21.922],
  [167.198, -21.892],
  [167.195, -21.862],
  [167.188, -21.832],
  [167.178, -21.802],
  [167.165, -21.772],
  [167.118, -21.752],
  [167.058, -21.752],
  [166.998, -21.762],
  [166.938, -21.782],
  [166.878, -21.812],
  [166.818, -21.842],
  [166.758, -21.872],
  [166.698, -21.882],
  [166.638, -21.872],
  [166.578, -21.842],
  [166.518, -21.802],
  [166.458, -21.752],
  [166.398, -21.702],
  [166.338, -21.652],
  [166.278, -21.602],
  [166.218, -21.552],
  [166.158, -21.502],
  [166.098, -21.452],
  [166.038, -21.402],
  [165.978, -21.352],
  [165.918, -21.302],
  [165.858, -21.252],
  [165.798, -21.202],
  [165.738, -21.152],
  [165.678, -21.102],
  [165.618, -21.052],
  [165.558, -21.002],
  [165.498, -20.952],
  [165.438, -20.902],
  [165.378, -20.852],
  [165.318, -20.802],
  [165.258, -20.752],
  [165.198, -20.702],
  [165.138, -20.652],
  [165.078, -20.602],
  [165.018, -20.552],
  [164.958, -20.502],
  [164.898, -20.452],
  [164.838, -20.402],
  [164.778, -20.352],
  [164.718, -20.302],
  [164.658, -20.252],
  [164.598, -20.202],
  [164.538, -20.152],
  [164.478, -20.102],
  [164.418, -20.058],
  [164.358, -20.028],
  [164.298, -20.012],
  [164.238, -20.012],
  [164.198, -20.015],
];

const NC_SHORE_3 = [
  [164.228, -20.022],
  [164.578, -20.372],
  [164.728, -20.462],
  [164.862, -20.578],
  [164.938, -20.682],
  [165.052, -20.772],
  [165.198, -20.842],
  [165.265, -20.892],
  [165.328, -20.978],
  [165.378, -21.058],
  [165.438, -21.122],
  [165.495, -21.185],
  [165.558, -21.262],
  [165.608, -21.332],
  [165.678, -21.422],
  [165.708, -21.492],
  [165.748, -21.562],
  [165.795, -21.628],
  [165.858, -21.682],
  [165.908, -21.732],
  [165.955, -21.782],
  [166.008, -21.842],
  [166.065, -21.882],
  [166.118, -21.912],
  [166.168, -21.962],
  [166.208, -22.022],
  [166.255, -22.078],
  [166.298, -22.135],
  [166.328, -22.175],
  [166.362, -22.208],
  [166.395, -22.238],
  [166.425, -22.265],
  [166.448, -22.295],
  [166.478, -22.315],
  [166.498, -22.338],
  [166.518, -22.358],
  [166.542, -22.382],
  [166.568, -22.398],
  [166.598, -22.415],
  [166.628, -22.432],
  [166.665, -22.448],
  [166.698, -22.462],
  [166.735, -22.462],
  [166.768, -22.452],
  [166.798, -22.432],
  [166.828, -22.412],
  [166.858, -22.392],
  [166.888, -22.372],
  [166.918, -22.352],
  [166.948, -22.322],
  [166.978, -22.292],
  [167.008, -22.262],
  [167.038, -22.232],
  [167.068, -22.202],
  [167.098, -22.172],
  [167.125, -22.142],
  [167.148, -22.112],
  [167.168, -22.082],
  [167.185, -22.052],
  [167.198, -22.022],
  [167.208, -21.992],
  [167.215, -21.962],
  [167.218, -21.932],
  [167.218, -21.902],
  [167.215, -21.872],
  [167.208, -21.842],
  [167.198, -21.812],
  [167.185, -21.782],
  [167.138, -21.762],
  [167.078, -21.762],
  [167.018, -21.772],
  [166.958, -21.792],
  [166.898, -21.822],
  [166.838, -21.852],
  [166.778, -21.882],
  [166.718, -21.892],
  [166.658, -21.882],
  [166.598, -21.852],
  [166.538, -21.812],
  [166.478, -21.762],
  [166.418, -21.712],
  [166.358, -21.662],
  [166.298, -21.612],
  [166.238, -21.562],
  [166.178, -21.512],
  [166.118, -21.462],
  [166.058, -21.412],
  [165.998, -21.362],
  [165.938, -21.312],
  [165.878, -21.262],
  [165.818, -21.212],
  [165.758, -21.162],
  [165.698, -21.112],
  [165.638, -21.062],
  [165.578, -21.012],
  [165.518, -20.962],
  [165.458, -20.912],
  [165.398, -20.862],
  [165.338, -20.812],
  [165.278, -20.762],
  [165.218, -20.712],
  [165.158, -20.662],
  [165.098, -20.612],
  [165.038, -20.562],
  [164.978, -20.512],
  [164.918, -20.462],
  [164.858, -20.412],
  [164.798, -20.362],
  [164.738, -20.312],
  [164.678, -20.262],
  [164.618, -20.212],
  [164.558, -20.162],
  [164.498, -20.112],
  [164.438, -20.068],
  [164.378, -20.038],
  [164.318, -20.022],
  [164.258, -20.018],
  [164.228, -20.022],
];

const getNCShore = (r) =>
  r < 1.0 ? NC_SHORE_0 : r < 3.0 ? NC_SHORE_1 : NC_SHORE_3;

const PACIFIC_OCEAN = [
  [110.0, -50.0],
  [110.0, 40.0],
  [230.0, 40.0],
  [230.0, -50.0],
  [110.0, -50.0],
];
const AUSTRALIA = [
  [114.0, -22.0],
  [114.0, -35.0],
  [118.0, -34.0],
  [124.0, -34.0],
  [130.0, -33.0],
  [134.0, -34.0],
  [138.0, -35.0],
  [141.0, -38.0],
  [146.0, -39.0],
  [150.0, -37.0],
  [153.5, -28.0],
  [153.5, -24.0],
  [149.0, -21.0],
  [146.5, -18.0],
  [144.0, -14.5],
  [136.5, -12.0],
  [130.5, -11.0],
  [128.0, -14.5],
  [124.0, -17.0],
  [120.0, -20.0],
  [115.0, -21.0],
  [114.0, -22.0],
].reverse();
const NZ_N = [
  [174.0, -37.0],
  [178.5, -37.5],
  [178.5, -41.5],
  [174.5, -41.5],
  [172.5, -40.0],
  [174.0, -37.0],
].reverse();
const NZ_S = [
  [166.5, -46.5],
  [168.0, -46.0],
  [170.5, -45.5],
  [171.5, -44.5],
  [172.5, -43.5],
  [173.5, -42.5],
  [174.0, -41.5],
  [172.0, -40.5],
  [170.5, -42.0],
  [169.0, -44.0],
  [167.0, -45.5],
  [166.5, -46.5],
].reverse();

const buildFloodGeoJSON = (seaRise) => {
  if (seaRise <= 0) return { type: "FeatureCollection", features: [] };
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { seaRise },
        geometry: {
          type: "Polygon",
          coordinates: [
            PACIFIC_OCEAN,
            AUSTRALIA,
            NZ_N,
            NZ_S,
            getNCShore(seaRise),
          ],
        },
      },
    ],
  };
};

// ═══════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════

export default function MapPage() {
  const { isDark } = useTheme();
  const { lang } = useLang();

  const [terrain3D, setTerrain3D] = useState(true);
  const [seaRise, setSeaRise] = useState(0);
  const [wavePhase, setWavePhase] = useState(0);
  const [noaaStationId, setNoaaStationId] = useState(NOAA_STATIONS[0].id);
  const [includeNoaaLevel, setIncludeNoaaLevel] = useState(false);
  const [noaaLevel, setNoaaLevel] = useState(null);
  const [noaaLoading, setNoaaLoading] = useState(false);
  const [noaaError, setNoaaError] = useState(null);

  const mapRef = useRef();
  const mapReadyRef = useRef(false);
  const waveRafRef = useRef();

  // Animation vague
  useEffect(() => {
    let phase = 0;
    const animate = () => {
      phase += 0.008;
      setWavePhase(phase);
      waveRafRef.current = requestAnimationFrame(animate);
    };
    waveRafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(waveRafRef.current);
  }, []);

  const effectiveSeaRise = useMemo(() => {
    const obs =
      includeNoaaLevel && Number.isFinite(noaaLevel?.value)
        ? noaaLevel.value
        : 0;
    return Math.max(0, seaRise + obs);
  }, [seaRise, includeNoaaLevel, noaaLevel]);

  const floodGeoJSON = useMemo(
    () => buildFloodGeoJSON(effectiveSeaRise),
    [effectiveSeaRise],
  );

  const floodOpacity = useMemo(() => {
    const base = Math.min(0.75, 0.4 + effectiveSeaRise * 0.05);
    const pulse = Math.sin(wavePhase * 1.5) * 0.04;
    return Math.max(0.25, Math.min(0.8, base + pulse));
  }, [effectiveSeaRise, wavePhase]);

  const waterColor = useMemo(() => {
    if (effectiveSeaRise < 1) return "#0096c7";
    if (effectiveSeaRise < 3) return "#0077b6";
    if (effectiveSeaRise < 10) return "#005f99";
    return "#003d7a";
  }, [effectiveSeaRise]);

  // NOAA
  const loadNoaa = useCallback(async (sid) => {
    setNoaaLoading(true);
    setNoaaError(null);
    try {
      setNoaaLevel(await fetchNoaaWaterLevel(sid));
    } catch (e) {
      setNoaaError(e.message);
      setNoaaLevel(null);
    } finally {
      setNoaaLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNoaa(noaaStationId);
  }, [noaaStationId, loadNoaa]);

  // Terrain 3D
  const ensureDem = useCallback((map) => {
    if (!map.getSource("mapbox-dem"))
      map.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      });
  }, []);

  const applyTerrain = useCallback((map, on) => {
    try {
      on
        ? map.setTerrain({ source: "mapbox-dem", exaggeration: 1.8 })
        : map.setTerrain(null);
    } catch {}
  }, []);

  const setupAfterIdle = useCallback(
    (map) => {
      const onIdle = () => {
        map.off("idle", onIdle);
        mapReadyRef.current = true;
        ensureDem(map);
        if (terrain3D) applyTerrain(map, true);
      };
      map.on("idle", onIdle);
    },
    [ensureDem, applyTerrain, terrain3D],
  );

  const onMapLoad = useCallback(() => {
    const m = mapRef.current?.getMap();
    if (m) setupAfterIdle(m);
  }, [setupAfterIdle]);
  const onStyleData = useCallback(() => {
    const m = mapRef.current?.getMap();
    if (!m?.isStyleLoaded()) return;
    mapReadyRef.current = false;
    ensureDem(m);
    setupAfterIdle(m);
  }, [ensureDem, setupAfterIdle]);

  const toggleTerrain = useCallback(() => {
    const m = mapRef.current?.getMap();
    if (!m || !mapReadyRef.current) return;
    const next = !terrain3D;
    ensureDem(m);
    applyTerrain(m, next);
    setTerrain3D(next);
  }, [terrain3D, ensureDem, applyTerrain]);

  // HUD
  const hudLabel =
    effectiveSeaRise < 0.05
      ? lang === "fr"
        ? "Niveau actuel"
        : "Current level"
      : effectiveSeaRise < 0.5
        ? lang === "fr"
          ? "Scénario modéré"
          : "Moderate scenario"
        : effectiveSeaRise < 1.5
          ? lang === "fr"
            ? "GIEC SSP5-8.5"
            : "IPCC SSP5-8.5"
          : effectiveSeaRise < 3
            ? lang === "fr"
              ? "Fonte Antarctique"
              : "Antarctic melt"
            : effectiveSeaRise < 10
              ? lang === "fr"
                ? "Effondrement climatique"
                : "Climate collapse"
              : lang === "fr"
                ? "Monde transformé"
                : "Transformed world";

  const hudColor =
    effectiveSeaRise < 0.3
      ? "#00E5FF"
      : effectiveSeaRise < 1
        ? "#29B6F6"
        : effectiveSeaRise < 5
          ? "#FF9100"
          : "#FF1744";

  const mapStyle = isDark
    ? "mapbox://styles/mapbox/satellite-streets-v12"
    : "mapbox://styles/mapbox/satellite-streets-v12";

  const selectedNoaaStation = useMemo(
    () => NOAA_STATIONS.find((s) => s.id === noaaStationId) || NOAA_STATIONS[0],
    [noaaStationId],
  );

  return (
    <div className="map-page">
      {/* ── Carte ─────────────────────────────────────── */}
      <div className="map-page__canvas">
        <Map
          ref={mapRef}
          initialViewState={INITIAL_VIEW}
          style={{ width: "100%", height: "100%" }}
          mapStyle={mapStyle}
          mapboxAccessToken={TOKEN}
          onLoad={onMapLoad}
          onStyleData={onStyleData}
        >
          <NavigationControl position="top-right" showCompass visualizePitch />

          {/* Bâtiments 3D */}
          <Layer
            id="3d-buildings"
            source="composite"
            source-layer="building"
            filter={["==", "extrude", "true"]}
            type="fill-extrusion"
            minzoom={14}
            paint={{
              "fill-extrusion-color": [
                "interpolate",
                ["linear"],
                ["get", "height"],
                0,
                "#1a2a1a",
                50,
                "#2a3a2a",
                200,
                "#1a301a",
              ],
              "fill-extrusion-height": ["get", "height"],
              "fill-extrusion-base": ["get", "min_height"],
              "fill-extrusion-opacity": 0.7,
            }}
          />

          {/* Simulation montée des eaux */}
          {effectiveSeaRise > 0 && (
            <Source id="flood-ocean" type="geojson" data={floodGeoJSON}>
              <Layer
                id="flood-fill"
                type="fill"
                paint={{
                  "fill-color": waterColor,
                  "fill-opacity": floodOpacity,
                  "fill-antialias": true,
                }}
              />
              <Layer
                id="flood-glow"
                type="fill"
                paint={{
                  "fill-color": "#48cae4",
                  "fill-opacity": Math.min(0.15, floodOpacity * 0.2),
                  "fill-antialias": true,
                }}
              />
            </Source>
          )}
        </Map>
      </div>

      {/* ── Toolbar ───────────────────────────────────── */}
      <div className="mp-toolbar">
        <button
          className={`mp-toolbar__btn${terrain3D ? " mp-toolbar__btn--on" : ""}`}
          onClick={toggleTerrain}
          title={
            terrain3D
              ? lang === "fr"
                ? "Désactiver 3D"
                : "Disable 3D"
              : lang === "fr"
                ? "Activer 3D"
                : "Enable 3D"
          }
        >
          {terrain3D ? "⛰ 3D ON" : "⛰ 3D OFF"}
        </button>
      </div>

      {/* ── HUD niveau ────────────────────────────────── */}
      <div className="mp-hud" style={{ "--hc": hudColor }}>
        <div
          className="mp-hud__dot"
          style={{ background: hudColor, boxShadow: `0 0 12px ${hudColor}` }}
        />
        <div className="mp-hud__body">
          <div className="mp-hud__label">{hudLabel}</div>
          <div className="mp-hud__value" style={{ color: hudColor }}>
            +{effectiveSeaRise.toFixed(2)} m
          </div>
        </div>
        {effectiveSeaRise >= 0.5 && <div className="mp-hud__warn">🚨</div>}
      </div>

      {/* ── Légende ───────────────────────────────────── */}
      <div className="mp-legend">
        <div className="mp-legend__block">
          <div className="mp-legend__ttl">
            {lang === "fr" ? "Simulation" : "Simulation"}
          </div>
          <div className="mp-legend__info">
            <div>
              🌊{" "}
              {lang === "fr"
                ? "Eau = océan connecté"
                : "Water = connected ocean"}
            </div>
            <div>
              🏝{" "}
              {lang === "fr"
                ? "Terres exclues du fill"
                : "Lands excluded from fill"}
            </div>
            <div>
              📐 {lang === "fr" ? "Contour NC varie" : "NC shoreline varies"}
            </div>
          </div>
          <div className="mp-legend__sub">
            GeoJSON Polygon cutout · NC + AU + NZ
          </div>
        </div>
        <div className="mp-legend__sep" />
        <div className="mp-legend__block">
          <div className="mp-legend__ttl">
            {lang === "fr" ? "Source" : "Source"}
          </div>
          <div className="mp-legend__info" style={{ fontSize: 10 }}>
            <div>NOAA CO-OPS</div>
            <div>GIEC AR6</div>
            <div>data.gouv.nc</div>
          </div>
        </div>
      </div>

      {/* ── SeaLevelControl ───────────────────────────── */}
      <SeaLevelControl
        seaRise={seaRise}
        effectiveSeaRise={effectiveSeaRise}
        onChange={setSeaRise}
        noaaStations={NOAA_STATIONS}
        noaaStationId={noaaStationId}
        onNoaaStationChange={setNoaaStationId}
        noaaLevel={noaaLevel}
        noaaLoading={noaaLoading}
        noaaError={noaaError}
        includeNoaaLevel={includeNoaaLevel}
        onIncludeNoaaLevelChange={setIncludeNoaaLevel}
        onRefreshNoaa={() => loadNoaa(noaaStationId)}
        selectedNoaaStation={selectedNoaaStation}
      />

      {/* ── Badge concours ────────────────────────────── */}
      <div className="mp-badge">
        <span>Pacific Dataviz Challenge 2026</span>
        <span>Sea Level Rise · NC & Pacifique Sud</span>
      </div>
    </div>
  );
}
