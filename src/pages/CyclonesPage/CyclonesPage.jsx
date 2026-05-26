// src/pages/CyclonesPage/CyclonesPage.jsx — v11 FINAL
// Fix NaN : validation stricte des coordonnées IBTrACS
// Fix flicker : canvas2D overlay synchronisé avec map.on('render') → zéro clignotement
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Map, { NavigationControl, Popup } from "react-map-gl/mapbox";
import mapboxgl from "mapbox-gl";
import { useDispatch, useSelector } from "react-redux";
import "mapbox-gl/dist/mapbox-gl.css";
import "./CyclonesPage.scss";
import cycloneImg from "../../cyclone.png";
import {
  loadCyclonesSegments,
  loadCyclonesRef,
  selectCyclonesSegments,
  selectCyclonesRef,
  selectCyclonesLoading,
} from "../../store/slices/cyclonesSlice";
import { useTheme } from "../../store/context/themeContext";
import { useLang } from "../../store/context/langContext";

const TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;
mapboxgl.accessToken = TOKEN;

const CAT_COLORS = {
  TD: "#90CAF9",
  TS: "#42A5F5",
  TC: "#FFB74D",
  STC: "#FF7043",
  ITC: "#EF5350",
};
const CAT_FR = {
  TD: "Dépression",
  TS: "Tempête trop.",
  TC: "Cyclone",
  STC: "Cy. sévère",
  ITC: "Cy. intense",
};
const CAT_EN = {
  TD: "Depression",
  TS: "Tropical storm",
  TC: "Cyclone",
  STC: "Severe",
  ITC: "Intense",
};
const CAT_ORDER = ["TD", "TS", "TC", "STC", "ITC"];
const CAT_EXPR = [
  "match",
  ["get", "_cat"],
  "ITC",
  "#EF5350",
  "STC",
  "#FF7043",
  "TC",
  "#FFB74D",
  "TS",
  "#42A5F5",
  "TD",
  "#90CAF9",
  "#90CAF9",
];

const SPEEDS = [
  { key: "slow", label: { fr: "Lent", en: "Slow" }, step: 0.008, pause: 50 },
  {
    key: "normal",
    label: { fr: "Normal", en: "Normal" },
    step: 0.025,
    pause: 25,
  },
  { key: "fast", label: { fr: "Rapide", en: "Fast" }, step: 0.08, pause: 10 },
  { key: "ultra", label: { fr: "Ultra", en: "Ultra" }, step: 0.22, pause: 3 },
];
const EMPTY_FC = { type: "FeatureCollection", features: [] };
const PACIFIC_VIEW = {
  longitude: 168,
  latitude: -17,
  zoom: 4.2,
  pitch: 0,
  bearing: 0,
};

// ════════════════════════════════════════════════════════════════
// NORMALISATION IBTrACS
// ════════════════════════════════════════════════════════════════
const catFromWindMs = (ms) => {
  const v = Number(ms);
  if (!v || isNaN(v)) return null;
  if (v < 17.5) return "TD";
  if (v < 24.5) return "TS";
  if (v < 32.7) return "TC";
  if (v < 44.2) return "STC";
  return "ITC";
};
const normCat = (p = {}) => {
  // Champs explicites
  const raw = (
    p.categorie ||
    p.CATEGORIE ||
    p.cat ||
    p.CAT ||
    p.category ||
    p.intensite ||
    p.INTENSITE ||
    p.typeph ||
    p.TYPEPH ||
    p.storm_type ||
    ""
  )
    .toString()
    .trim()
    .toUpperCase();
  if (raw) {
    if (["ITC", "STC", "TC", "TS", "TD"].includes(raw)) return raw;
    if (raw.includes("INTENSE")) return "ITC";
    if (raw.includes("SEVERE") || raw.includes("SÉVÈRE")) return "STC";
    if (raw.includes("CYCLON") && !raw.includes("TROP")) return "TC";
    if (raw.includes("STORM") || raw.includes("TEMPÊTE")) return "TS";
    if (raw.includes("DEPRESS")) return "TD";
    const n = parseInt(raw);
    if (!isNaN(n)) {
      if (n >= 5) return "ITC";
      if (n === 4) return "STC";
      if (n === 3) return "TC";
      if (n === 2) return "TS";
      if (n <= 1) return "TD";
    }
  }
  // Dériver du vent (IBTrACS : mean_wind_speed en m/s)
  const ms =
    p.mean_wind_speed || p.MEAN_WIND_SPEED || p.wind_speed || p.vmax || p.VMAX;
  if (ms) return catFromWindMs(ms);
  const kt = p.wind_kt || p.WIND_KT || p.max_wind_kt;
  if (kt) return catFromWindMs(Number(kt) * 0.514);
  return null;
};
const normNom = (p = {}) =>
  (p.name || p.NAME || p.nom || p.NOM || p.nom_cycl || p.storm_name || "")
    .toString()
    .trim() || null;
const normSaison = (p = {}) =>
  (p.season || p.SEASON || p.saison || p.SAISON || p.annee || "")
    .toString()
    .trim() || null;
const normVent = (p = {}) => {
  const ms = Number(
    p.mean_wind_speed || p.MEAN_WIND_SPEED || p.wind_speed || 0,
  );
  if (ms > 0 && ms < 100) return Math.round(ms * 3.6);
  const kt = Number(p.wind_kt || p.WIND_KT || p.max_wind_kt || p.vent_max || 0);
  if (kt > 0 && kt < 250) return Math.round(kt * 1.852);
  const kh = Number(p.vent_max_kmh || p.WIND_KMH || 0);
  if (kh > 0 && kh < 400) return kh;
  return null;
};
const normPres = (p = {}) => {
  const v = Number(
    p.mean_central_pressure ||
      p.MEAN_CENTRAL_PRESSURE ||
      p.pressure ||
      p.pression_min ||
      p.PRESSION_MIN ||
      p.pmin ||
      p.mslp ||
      0,
  );
  return v > 800 && v < 1013 ? v : null;
};
const normKey = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

// Validation stricte des coordonnées (fix NaN)
const isValidCoord = (c) =>
  Array.isArray(c) &&
  c.length >= 2 &&
  isFinite(c[0]) &&
  isFinite(c[1]) &&
  !isNaN(c[0]) &&
  !isNaN(c[1]);
const getValidCoords = (f) => {
  const coords = f?.geometry?.coordinates;
  if (!Array.isArray(coords)) return null;
  const v = coords.filter(isValidCoord);
  return v.length >= 2 ? v : null;
};
const interpSafe = (coords, t) => {
  if (!coords?.length) return null;
  const fi = Math.max(0, Math.min(1, t)) * (coords.length - 1);
  const lo = Math.floor(fi),
    hi = Math.min(lo + 1, coords.length - 1),
    rt = fi - lo;
  const lng = coords[lo][0] + (coords[hi][0] - coords[lo][0]) * rt;
  const lat = coords[lo][1] + (coords[hi][1] - coords[lo][1]) * rt;
  return isFinite(lng) && isFinite(lat) ? [lng, lat] : null;
};

const enrich = (feats) =>
  feats.map((f) => ({
    ...f,
    properties: {
      ...f.properties,
      _cat: normCat(f.properties) || "TD",
      _nom: normNom(f.properties) || "—",
    },
  }));

// Suppression fond blanc PNG
const removeWhiteBg = (src) =>
  new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const id = ctx.getImageData(0, 0, c.width, c.height),
        d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        const b = (d[i] + d[i + 1] + d[i + 2]) / 3;
        if (b > 210) d[i + 3] = Math.round(Math.max(0, ((255 - b) / 45) * 255));
      }
      ctx.putImageData(id, 0, 0);
      res(c.toDataURL());
    };
    img.onerror = () => res(src);
    img.src = src;
  });

// ── UI Components ──────────────────────────────────────────────
const WindGauge = ({ v, c }) => (
  <div className="cyc-gauge">
    <div className="cyc-gauge__track">
      <div
        className="cyc-gauge__fill"
        style={{ width: `${Math.min(100, (v / 280) * 100)}%`, background: c }}
      />
    </div>
    <span className="cyc-gauge__val" style={{ color: c }}>
      {v}
      <small> km/h</small>
    </span>
  </div>
);
const IntensityBar = ({ cat }) => {
  const idx = CAT_ORDER.indexOf(cat);
  return (
    <div className="cyc-ibar">
      {CAT_ORDER.map((c, i) => (
        <div
          key={c}
          className={`cyc-ibar__seg${i <= idx ? " cyc-ibar__seg--on" : ""}`}
          style={i <= idx ? { background: CAT_COLORS[c] } : {}}
          title={`${c} – ${CAT_FR[c]}`}
        />
      ))}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
export default function CyclonesPage() {
  const dispatch = useDispatch();
  const { isDark } = useTheme();
  const { lang } = useLang();
  const mapRef = useRef(null);
  const mapReadyRef = useRef(false);
  const rafRef = useRef(null);

  // ── Canvas overlay refs (fix flicker) ─────────────────────────
  const canvasRef = useRef(null); // <canvas> overlay element
  const imgRef = useRef(null); // processed cyclone PNG
  const curPosRef = useRef(null); // [lng,lat] position courante
  const curColorRef = useRef("#90CAF9");
  const rotRef = useRef(0); // rotation degrees (counter-clockwise)
  const showMarker = useRef(false);

  const animRef = useRef({
    idx: 0,
    progress: 0,
    pauseFrames: 0,
    step: 0.025,
    pause: 25,
    running: false,
  });
  const filteredRef = useRef([]);
  const refMapRef = useRef({});

  const rawSegments = useSelector(selectCyclonesSegments);
  const referentiel = useSelector(selectCyclonesRef);
  const loading = useSelector(selectCyclonesLoading);

  const [simMode, setSimMode] = useState("idle");
  const [speedKey, setSpeedKey] = useState("normal");
  const [curIdx, setCurIdx] = useState(0);
  const [completedN, setCompletedN] = useState(0);
  const [uiProgress, setUiProgress] = useState(0);
  const [catFilter, setCatFilter] = useState(null);
  const [yearFrom, setYearFrom] = useState(null);
  const [yearTo, setYearTo] = useState(null);
  const [hoverData, setHoverData] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Charge et traite l'image cyclone
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
    };
    removeWhiteBg(cycloneImg)
      .then((url) => {
        img.src = url;
      })
      .catch(() => {
        img.src = cycloneImg;
      });
  }, []);

  // Resize canvas pour matcher le conteneur map
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = container.getBoundingClientRect();
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
  }, []);

  // ── Dessin canvas (appelé à chaque map.render) ─────────────────
  // Synchronisé avec Mapbox → zéro décalage, zéro clignotement
  const drawMarker = useCallback(() => {
    const canvas = canvasRef.current;
    const map = mapRef.current?.getMap();
    const img = imgRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!showMarker.current || !curPosRef.current || !map || !img?.complete)
      return;

    const { x, y } = map.project(curPosRef.current);
    // Vérifie que la projection est valide
    if (!isFinite(x) || !isFinite(y)) return;

    const size = 80 * dpr;
    rotRef.current = (rotRef.current - 1.5) % 360; // rotation anti-horaire

    ctx.save();
    // Glow coloré
    ctx.shadowBlur = 25 * dpr;
    ctx.shadowColor = curColorRef.current;
    ctx.translate(x * dpr, y * dpr);
    ctx.rotate((rotRef.current * Math.PI) / 180);
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
    ctx.restore();
  }, []);

  useEffect(() => {
    dispatch(loadCyclonesSegments());
    dispatch(loadCyclonesRef());
  }, [dispatch]);

  useEffect(() => {
    if (!referentiel?.length) return;
    const m = {};
    referentiel.forEach((r) => {
      const k = normKey(normNom(r) || "");
      if (k)
        m[k] = {
          vent: normVent(r),
          pres: normPres(r),
          decede: +(r.decede || r.deaths || 0) || 0,
          enso: (r.enso || r.enso_phase || "").toString() || null,
          _cat: normCat(r),
        };
    });
    refMapRef.current = m;
  }, [referentiel]);

  const filteredFeatures = useMemo(() => {
    if (!rawSegments?.features) return [];
    return rawSegments.features.filter((f) => {
      const cat = normCat(f.properties) || "TD";
      const yr =
        parseInt((normSaison(f.properties) || "").split(/[-/]/)[0]) || 0;
      if (catFilter && cat !== catFilter) return false;
      if (yearFrom && yr < yearFrom) return false;
      if (yearTo && yr > yearTo) return false;
      // Filtre les features sans géométrie valide (speed)
      return getValidCoords(f) !== null;
    });
  }, [rawSegments, catFilter, yearFrom, yearTo]);

  useEffect(() => {
    filteredRef.current = filteredFeatures;
  }, [filteredFeatures]);

  const availableYears = useMemo(() => {
    if (!rawSegments?.features) return [];
    const s = new Set();
    rawSegments.features.forEach((f) => {
      const y = parseInt((normSaison(f.properties) || "").split(/[-/]/)[0]);
      if (y > 1900) s.add(y);
    });
    return Array.from(s).sort();
  }, [rawSegments]);

  const stats = useMemo(() => {
    const byCat = {};
    filteredFeatures.forEach((f) => {
      const c = normCat(f.properties) || "TD";
      byCat[c] = (byCat[c] || 0) + 1;
    });
    return { total: filteredFeatures.length, byCat };
  }, [filteredFeatures]);

  const getEnriched = useCallback((feature) => {
    if (!feature) return null;
    const p = feature.properties || {};
    const nom = normNom(p) || "—";
    const ref = refMapRef.current[normKey(nom)] || {};
    const cat = normCat(p) || ref._cat || "TD";
    return {
      nom,
      saison: normSaison(p) || ref.saison || "—",
      _cat: cat,
      vent: normVent(p) || ref.vent || null,
      pres: normPres(p) || ref.pres || null,
      decede: ref.decede || 0,
      enso: ref.enso || null,
      color: CAT_COLORS[cat] || "#90CAF9",
    };
  }, []);

  const curData = useMemo(
    () => getEnriched(filteredFeatures[curIdx]),
    [filteredFeatures, curIdx, getEnriched],
  );

  // ════════════════════════════════════════════════════════════════
  // INIT MAPBOX
  // ════════════════════════════════════════════════════════════════
  const initMapSources = useCallback(
    (map) => {
      if (mapReadyRef.current) return;

      map.addSource("cyc-bg", { type: "geojson", data: EMPTY_FC });
      map.addSource("cyc-done", { type: "geojson", data: EMPTY_FC });
      map.addSource("cyc-trail", { type: "geojson", data: EMPTY_FC });

      map.addLayer({
        id: "cyc-bg-lines",
        type: "line",
        source: "cyc-bg",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": CAT_EXPR,
          "line-width": 1.5,
          "line-opacity": 0.22,
        },
      });
      map.addLayer({
        id: "cyc-done-lines",
        type: "line",
        source: "cyc-done",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": CAT_EXPR,
          "line-width": 2.5,
          "line-opacity": 0.7,
        },
      });
      map.addLayer({
        id: "cyc-trail-glow",
        type: "line",
        source: "cyc-trail",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": CAT_EXPR,
          "line-width": 14,
          "line-opacity": 0.2,
          "line-blur": 5,
        },
      });
      map.addLayer({
        id: "cyc-trail-line",
        type: "line",
        source: "cyc-trail",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": CAT_EXPR, "line-width": 3, "line-opacity": 1 },
      });

      // Hover / Clic
      const onHover = (e) => {
        if (!e.features?.length) return;
        map.getCanvas().style.cursor = "pointer";
        const d = getEnriched(e.features[0]);
        if (d) setHoverData({ lng: e.lngLat.lng, lat: e.lngLat.lat, ...d });
      };
      const onLeave = () => {
        map.getCanvas().style.cursor = "";
        setHoverData(null);
      };
      const onClick = (e) => {
        if (!e.features?.length) return;
        const d = getEnriched(e.features[0]);
        if (d) {
          setDetailData(d);
          setDrawerOpen(true);
          setHoverData(null);
        }
      };
      ["cyc-bg-lines", "cyc-done-lines", "cyc-trail-line"].forEach((l) => {
        map.on("mousemove", l, onHover);
        map.on("mouseleave", l, onLeave);
        map.on("click", l, onClick);
      });

      // ── Canvas synchronisé avec map.render → zéro clignotement ──
      map.on("render", drawMarker);

      mapReadyRef.current = true;
      const feats = filteredRef.current;
      if (feats.length)
        map
          .getSource("cyc-bg")
          .setData({ type: "FeatureCollection", features: enrich(feats) });
    },
    [getEnriched, drawMarker],
  );

  const handleMapLoad = useCallback(() => {
    const m = mapRef.current?.getMap();
    if (m) {
      initMapSources(m);
      resizeCanvas();
    }
  }, [initMapSources, resizeCanvas]);

  // ResizeObserver pour le canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas?.parentElement) return;
    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, [resizeCanvas]);

  useEffect(() => {
    const m = mapRef.current?.getMap();
    if (!m || !mapReadyRef.current) return;
    m.getSource("cyc-bg")?.setData({
      type: "FeatureCollection",
      features: enrich(filteredFeatures),
    });
  }, [filteredFeatures]);

  const setBgVisible = useCallback((v) => {
    const m = mapRef.current?.getMap();
    if (!m || !mapReadyRef.current) return;
    m.setLayoutProperty("cyc-bg-lines", "visibility", v ? "visible" : "none");
  }, []);

  const clearAnim = useCallback(() => {
    showMarker.current = false;
    curPosRef.current = null;
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx)
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    const m = mapRef.current?.getMap();
    if (m && mapReadyRef.current) {
      m.getSource("cyc-done")?.setData(EMPTY_FC);
      m.getSource("cyc-trail")?.setData(EMPTY_FC);
    }
  }, []);

  // ════════════════════════════════════════════════════════════════
  // BOUCLE ANIMATION
  // Trail statique + canvas marker → zéro setPaintProperty/frame
  // ════════════════════════════════════════════════════════════════
  const startAnimation = useCallback(
    (fromIdx = 0) => {
      cancelAnimationFrame(rafRef.current);
      const spd = SPEEDS.find((s) => s.key === speedKey) || SPEEDS[1];
      const a = animRef.current;
      a.idx = fromIdx;
      a.progress = 0;
      a.pauseFrames = 0;
      a.step = spd.step;
      a.pause = spd.pause;
      a.running = true;
      setSimMode("running");
      setCurIdx(fromIdx);
      setUiProgress(0);
      setHoverData(null);
      if (fromIdx === 0) {
        setCompletedN(0);
        clearAnim();
        setBgVisible(false);
      }
      if (fromIdx === 0) {
        const m = mapRef.current?.getMap();
        if (m)
          m.easeTo({
            center: [168, -19],
            zoom: 4.2,
            pitch: 0,
            bearing: 0,
            duration: 700,
          });
      }

      let doneFeats = [];

      const tick = () => {
        const map = mapRef.current?.getMap(); // TOUJOURS EN PREMIER
        if (!a.running) return;

        const features = filteredRef.current;
        if (a.idx >= features.length) {
          a.running = false;
          showMarker.current = false;
          curPosRef.current = null;
          setBgVisible(true);
          setSimMode("done");
          map?.getSource("cyc-trail")?.setData(EMPTY_FC);
          return;
        }
        if (a.pauseFrames > 0) {
          a.pauseFrames--;
          rafRef.current = requestAnimationFrame(tick);
          return;
        }

        const feature = features[a.idx];
        const coords = getValidCoords(feature);

        // Charge le trail au début (une seule fois par cyclone → une seule re-render Mapbox)
        if (a.progress === 0) {
          setCurIdx(a.idx);
          if (coords && map && mapReadyRef.current) {
            const cat = normCat(feature.properties) || "TD";
            map
              .getSource("cyc-trail")
              ?.setData({
                type: "FeatureCollection",
                features: [
                  {
                    type: "Feature",
                    geometry: { type: "LineString", coordinates: coords },
                    properties: { _cat: cat },
                  },
                ],
              });
            curColorRef.current = CAT_COLORS[cat] || "#90CAF9";
            showMarker.current = true;
          }
          if (!coords) {
            // Feature sans géométrie valide → skip
            a.idx++;
            a.pauseFrames = 1;
            rafRef.current = requestAnimationFrame(tick);
            return;
          }
        }

        a.progress += a.step;

        if (a.progress >= 1) {
          doneFeats = [
            ...doneFeats,
            {
              ...feature,
              properties: {
                ...feature.properties,
                _cat: normCat(feature.properties) || "TD",
              },
            },
          ];
          // Pas de cap — on garde toutes les trajectoires terminées
          if (map && mapReadyRef.current) {
            map
              .getSource("cyc-done")
              ?.setData({ type: "FeatureCollection", features: doneFeats });
            map.getSource("cyc-trail")?.setData(EMPTY_FC);
          }
          showMarker.current = false;
          curPosRef.current = null;
          setCompletedN((n) => n + 1);
          setUiProgress(100);
          a.idx++;
          a.progress = 0;
          a.pauseFrames = a.pause;
          if (a.idx < features.length) setCurIdx(a.idx);
        } else if (coords) {
          // Mise à jour position pour le canvas (drawMarker appelé par map.on('render'))
          const pos = interpSafe(coords, a.progress);
          if (pos) curPosRef.current = pos;
          if (Math.floor(a.progress * 400) % 3 === 0)
            setUiProgress(Math.round(a.progress * 100));
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [speedKey, clearAnim, setBgVisible],
  );

  const pauseSim = useCallback(() => {
    animRef.current.running = false;
    cancelAnimationFrame(rafRef.current);
    showMarker.current = false;
    setSimMode("paused");
  }, []);
  const resetSim = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    animRef.current.running = false;
    clearAnim();
    setBgVisible(true);
    setSimMode("idle");
    setCurIdx(0);
    setCompletedN(0);
    setUiProgress(0);
  }, [clearAnim, setBgVisible]);
  const goTo = useCallback(
    (i) => {
      resetSim();
      setTimeout(() => startAnimation(i), 60);
    },
    [resetSim, startAnimation],
  );
  const doFilter = useCallback(
    (cat) => {
      resetSim();
      setCatFilter(cat);
    },
    [resetSim],
  );
  const doYearFrom = useCallback(
    (y) => {
      resetSim();
      setYearFrom(y ? Number(y) : null);
    },
    [resetSim],
  );
  const doYearTo = useCallback(
    (y) => {
      resetSim();
      setYearTo(y ? Number(y) : null);
    },
    [resetSim],
  );
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const catLabels = lang === "fr" ? CAT_FR : CAT_EN;
  const mapStyle = "mapbox://styles/mapbox/satellite-streets-v12"; // satellite fixe pour lisibilité
  const D = detailData || {};
  const Dc = D.color || "#90CAF9";
  const total = filteredFeatures.length;

  return (
    <div className={`cyc ${isDark ? "cyc--dark" : "cyc--light"}`}>
      <div className="cyc__map">
        <Map
          ref={mapRef}
          initialViewState={PACIFIC_VIEW}
          style={{ width: "100%", height: "100%" }}
          mapStyle={mapStyle}
          mapboxAccessToken={TOKEN}
          onLoad={handleMapLoad}
        >
          <NavigationControl position="top-right" visualizePitch />
          {hoverData && !drawerOpen && (
            <Popup
              longitude={hoverData.lng}
              latitude={hoverData.lat}
              closeButton={false}
              anchor="bottom"
              offset={12}
              className="cyc-hover"
            >
              <div className="cyc-hover__inner">
                <div className="cyc-hover__top">
                  <span className="cyc-hover__name">{hoverData.nom}</span>
                  <span
                    className="cyc-hover__badge"
                    style={{
                      background: hoverData.color + "22",
                      borderColor: hoverData.color,
                      color: hoverData.color,
                    }}
                  >
                    {hoverData._cat} · {catLabels[hoverData._cat]}
                  </span>
                </div>
                <div className="cyc-hover__meta">
                  {hoverData.saison && <span>📅 {hoverData.saison}</span>}
                  {hoverData.vent && <span>🌬 {hoverData.vent} km/h</span>}
                  {hoverData.pres && <span>⬇ {hoverData.pres} hPa</span>}
                </div>
                <span className="cyc-hover__cta">
                  🖱{" "}
                  {lang === "fr" ? "Cliquer pour détails" : "Click for details"}
                </span>
              </div>
            </Popup>
          )}
        </Map>
        {/* Canvas overlay synchronisé avec map.render → zéro flicker */}
        <canvas ref={canvasRef} className="cyc__canvas" />
      </div>

      <div className="cyc__panel">
        <div className="cyc__head">
          <span>🌀</span>
          <div>
            <div className="cyc__head-title">
              {lang === "fr" ? "Cyclones historiques" : "Historical Cyclones"}
            </div>
            <div className="cyc__head-sub">
              IBTrACS · data.gouv.nc · SPEArTC
            </div>
          </div>
        </div>
        {loading && (
          <div className="cyc__loading-banner">
            <div className="cyc__spinner" />
            <span>
              {lang === "fr"
                ? "Chargement des données cyclones…"
                : "Loading cyclone data…"}
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="cyc__stats">
          <div className="cyc__stat">
            <div className="cyc__stat-val" style={{ color: "#00E5FF" }}>
              {total.toLocaleString()}
            </div>
            <div className="cyc__stat-lbl">total</div>
          </div>
          {CAT_ORDER.map((cat) => (
            <div key={cat} className="cyc__stat">
              <div className="cyc__stat-val" style={{ color: CAT_COLORS[cat] }}>
                {(stats.byCat[cat] || 0).toLocaleString()}
              </div>
              <div className="cyc__stat-lbl" style={{ color: CAT_COLORS[cat] }}>
                {cat}
              </div>
            </div>
          ))}
        </div>

        {/* Légende */}
        <div className="cyc__legend">
          {CAT_ORDER.map((cat) => (
            <div key={cat} className="cyc__legend-row">
              <div
                className="cyc__legend-bar"
                style={{ background: CAT_COLORS[cat] }}
              />
              <span
                className="cyc__legend-code"
                style={{ color: CAT_COLORS[cat] }}
              >
                {cat}
              </span>
              <span className="cyc__legend-lbl">{catLabels[cat]}</span>
            </div>
          ))}
        </div>

        {/* Simulation */}
        <div className="cyc__sim">
          <div className="cyc__sim-title">
            🎬 {lang === "fr" ? "Simulation" : "Simulation"}
          </div>

          {simMode === "idle" && !loading && total > 0 && (
            <div className="cyc__idle">
              <div className="cyc__idle-count">{total.toLocaleString()}</div>
              <div className="cyc__idle-sub">
                {lang === "fr" ? "cyclones validés" : "validated cyclones"}
              </div>
            </div>
          )}

          {simMode !== "idle" && curData && (
            <div
              className="cyc__cur"
              style={{
                borderColor: curData.color + "50",
                background: curData.color + "08",
              }}
            >
              <div className="cyc__cur-header">
                <div className="cyc__cur-name" style={{ color: curData.color }}>
                  {curData.nom}
                </div>
                <div
                  className="cyc__cur-badge"
                  style={{
                    background: curData.color + "22",
                    borderColor: curData.color,
                    color: curData.color,
                  }}
                >
                  {curData._cat} · {catLabels[curData._cat]}
                </div>
              </div>
              <IntensityBar cat={curData._cat} />
              <div className="cyc__cur-saison">{curData.saison}</div>
              <div className="cyc__cur-data">
                {curData.vent ? (
                  <div className="cyc__cur-row">
                    <span className="cyc__cur-lbl">
                      🌬 {lang === "fr" ? "Vent max" : "Max wind"}
                    </span>
                    <WindGauge v={curData.vent} c={curData.color} />
                  </div>
                ) : (
                  <div className="cyc__cur-na">
                    🌬 {lang === "fr" ? "Vent non disponible" : "Wind N/A"}
                  </div>
                )}
                {curData.pres ? (
                  <div className="cyc__cur-row">
                    <span className="cyc__cur-lbl">
                      ⬇ {lang === "fr" ? "Pression min" : "Min pressure"}
                    </span>
                    <span
                      className="cyc__cur-val"
                      style={{
                        color:
                          curData.pres < 920
                            ? "#EF5350"
                            : curData.pres < 960
                              ? "#FF9100"
                              : "#42A5F5",
                      }}
                    >
                      {curData.pres}
                      <small> hPa</small>
                    </span>
                  </div>
                ) : (
                  <div className="cyc__cur-na">
                    ⬇{" "}
                    {lang === "fr" ? "Pression non disponible" : "Pressure N/A"}
                  </div>
                )}
                {curData.enso && (
                  <div className="cyc__cur-row">
                    <span className="cyc__cur-lbl">
                      🌡 ENSO
                      <span
                        className="cyc__cur-tooltip"
                        title={
                          lang === "fr"
                            ? "El Niño = eaux plus chaudes → cyclones plus intenses. La Niña = inverse."
                            : "El Niño = warmer waters → more intense cyclones. La Niña = opposite."
                        }
                      >
                        ⓘ
                      </span>
                    </span>
                    <span
                      className="cyc__cur-enso"
                      style={{
                        background:
                          curData.enso.toLowerCase().includes("nino") &&
                          !curData.enso.toLowerCase().includes("nina")
                            ? "rgba(239,83,80,.12)"
                            : "rgba(66,165,245,.12)",
                        borderColor:
                          curData.enso.toLowerCase().includes("nino") &&
                          !curData.enso.toLowerCase().includes("nina")
                            ? "#EF5350"
                            : "#42A5F5",
                        color:
                          curData.enso.toLowerCase().includes("nino") &&
                          !curData.enso.toLowerCase().includes("nina")
                            ? "#EF5350"
                            : "#42A5F5",
                      }}
                    >
                      {curData.enso}
                    </span>
                  </div>
                )}
                {curData.decede > 0 && (
                  <div className="cyc__cur-row">
                    <span className="cyc__cur-lbl">
                      ⚠ {lang === "fr" ? "Décès" : "Deaths"}
                    </span>
                    <span
                      className="cyc__cur-val"
                      style={{ color: "#EF5350", fontWeight: 700 }}
                    >
                      {curData.decede}
                    </span>
                  </div>
                )}
              </div>
              <div className="cyc__prog-track">
                <div
                  className="cyc__prog-fill"
                  style={{ width: `${uiProgress}%`, background: curData.color }}
                />
              </div>
              <div className="cyc__prog-meta">
                <span>
                  {curIdx + 1}/{total}
                </span>
                <span style={{ color: curData.color }}>{uiProgress}%</span>
              </div>
            </div>
          )}

          {simMode === "done" && (
            <div className="cyc__done">
              ✓ {completedN} {lang === "fr" ? "cyclones animés" : "cyclones"}
            </div>
          )}

          <div className="cyc__speed-row">
            <span className="cyc__speed-lbl">
              {lang === "fr" ? "Vitesse" : "Speed"}
            </span>
            {SPEEDS.map((s) => (
              <button
                key={s.key}
                className={`cyc__spd${speedKey === s.key ? " cyc__spd--on" : ""}`}
                onClick={() => {
                  setSpeedKey(s.key);
                  animRef.current.step = s.step;
                  animRef.current.pause = s.pause;
                }}
              >
                {s.label[lang]}
              </button>
            ))}
          </div>
          <div className="cyc__controls">
            {(simMode === "idle" || simMode === "done") && (
              <button
                className="cyc__btn-play"
                onClick={() => startAnimation(0)}
                disabled={!total}
              >
                ▶{" "}
                {lang === "fr"
                  ? simMode === "done"
                    ? "Rejouer"
                    : "Lancer"
                  : simMode === "done"
                    ? "Replay"
                    : "Start"}
              </button>
            )}
            {simMode === "running" && (
              <button className="cyc__btn-pause" onClick={pauseSim}>
                ⏸ Pause
              </button>
            )}
            {simMode === "paused" && (
              <button
                className="cyc__btn-pause"
                onClick={() => startAnimation(animRef.current.idx)}
                style={{
                  borderColor: "#69F0AE",
                  color: "#69F0AE",
                  background: "rgba(105,240,174,.08)",
                }}
              >
                ▶ {lang === "fr" ? "Reprendre" : "Resume"}
              </button>
            )}
            {(simMode === "running" || simMode === "paused") && (
              <button className="cyc__btn-reset" onClick={resetSim}>
                ↺
              </button>
            )}
          </div>
          {simMode !== "idle" && (
            <div className="cyc__nav">
              <button
                className="cyc__nav-btn"
                onClick={() => goTo(Math.max(0, animRef.current.idx - 1))}
                disabled={curIdx === 0}
              >
                ‹ Préc
              </button>
              <span className="cyc__nav-info">
                {curIdx + 1} / {total}
              </span>
              <button
                className="cyc__nav-btn"
                onClick={() =>
                  goTo(Math.min(total - 1, animRef.current.idx + 1))
                }
                disabled={curIdx >= total - 1}
              >
                Suiv ›
              </button>
            </div>
          )}
          <p className="cyc__hint">
            🖱{" "}
            {lang === "fr"
              ? "Cliquer une trajectoire pour les détails"
              : "Click a track for details"}
          </p>
        </div>

        {/* Filtres */}
        <div className="cyc__section">
          <div className="cyc__section-title">
            {lang === "fr" ? "Catégorie" : "Category"}
          </div>
          <div className="cyc__cats">
            <button
              className={`cyc__cat${!catFilter ? " cyc__cat--on" : ""}`}
              onClick={() => doFilter(null)}
            >
              {lang === "fr" ? "Toutes" : "All"}
            </button>
            {CAT_ORDER.map((cat) => (
              <button
                key={cat}
                className={`cyc__cat${catFilter === cat ? " cyc__cat--on" : ""}`}
                style={
                  catFilter === cat
                    ? {
                        borderColor: CAT_COLORS[cat],
                        color: CAT_COLORS[cat],
                        background: CAT_COLORS[cat] + "1A",
                      }
                    : {}
                }
                onClick={() => doFilter(catFilter === cat ? null : cat)}
              >
                <span
                  className="cyc__cat-dot"
                  style={{ background: CAT_COLORS[cat] }}
                />
                {cat}
              </button>
            ))}
          </div>
        </div>

        {availableYears.length > 1 && (
          <div className="cyc__section">
            <div className="cyc__section-title">
              {lang === "fr" ? "Période" : "Period"}
              {(yearFrom || yearTo) && (
                <button
                  className="cyc__clr"
                  onClick={() => {
                    doYearFrom(null);
                    doYearTo(null);
                  }}
                >
                  ✕
                </button>
              )}
            </div>
            <div className="cyc__year-row">
              <select
                className="cyc__sel"
                value={yearFrom || ""}
                onChange={(e) => doYearFrom(e.target.value)}
              >
                <option value="">{lang === "fr" ? "Depuis" : "From"}</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <span className="cyc__y-sep">→</span>
              <select
                className="cyc__sel"
                value={yearTo || ""}
                onChange={(e) => doYearTo(e.target.value)}
              >
                <option value="">{lang === "fr" ? "Jusqu'à" : "Until"}</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
        <div className="cyc__credit">
          IBTrACS · data.gouv.nc · Météo-France · SPEArTC
        </div>
      </div>

      {/* Drawer */}
      {drawerOpen && detailData && (
        <div className="cyc__drawer" onClick={() => setDrawerOpen(false)}>
          <div
            className="cyc__drawer-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="cyc__drawer-head"
              style={{ borderBottomColor: Dc + "60" }}
            >
              <div>
                <div className="cyc__drawer-name">{D.nom || "—"}</div>
                <div
                  style={{
                    color: Dc,
                    fontFamily: "var(--font-mono)",
                    fontSize: ".72rem",
                    fontWeight: 700,
                    marginTop: 3,
                  }}
                >
                  {D._cat} · {catLabels[D._cat]}
                </div>
                {D.saison && (
                  <div
                    style={{
                      color: "var(--color-text-muted)",
                      fontSize: ".68rem",
                      marginTop: 2,
                    }}
                  >
                    {D.saison}
                  </div>
                )}
              </div>
              <button
                className="cyc__drawer-close"
                onClick={() => setDrawerOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="cyc__drawer-body">
              {D._cat && (
                <div className="cyc__drawer-section">
                  <div className="cyc__drawer-lbl">Intensité</div>
                  <IntensityBar cat={D._cat} />
                </div>
              )}
              {D.vent && (
                <div className="cyc__drawer-section">
                  <div className="cyc__drawer-lbl">
                    🌬 {lang === "fr" ? "Vent maximum" : "Max wind"}
                  </div>
                  <WindGauge v={D.vent} c={Dc} />
                </div>
              )}
              {D.pres && (
                <div className="cyc__drawer-section">
                  <div className="cyc__drawer-lbl">
                    ⬇ {lang === "fr" ? "Pression minimale" : "Min pressure"}
                  </div>
                  <div
                    className="cyc__drawer-big"
                    style={{
                      color:
                        D.pres < 920
                          ? "#EF5350"
                          : D.pres < 960
                            ? "#FF9100"
                            : "#42A5F5",
                    }}
                  >
                    {D.pres}
                    <small> hPa</small>
                  </div>
                </div>
              )}
              {D.enso && (
                <div className="cyc__drawer-section">
                  <div className="cyc__drawer-lbl">🌡 ENSO</div>
                  <div
                    className="cyc__drawer-tag"
                    style={{
                      background:
                        D.enso.includes("Nino") && !D.enso.includes("Nina")
                          ? "rgba(239,83,80,.15)"
                          : "rgba(66,165,245,.15)",
                      borderColor:
                        D.enso.includes("Nino") && !D.enso.includes("Nina")
                          ? "#EF5350"
                          : "#42A5F5",
                    }}
                  >
                    {D.enso}
                  </div>
                </div>
              )}
              {D.decede > 0 && (
                <div className="cyc__drawer-section">
                  <div className="cyc__drawer-lbl">
                    ⚠ {lang === "fr" ? "Victimes" : "Deaths"}
                  </div>
                  <div className="cyc__drawer-deaths">
                    {D.decede}{" "}
                    {lang === "fr" ? "décès confirmés" : "confirmed deaths"}
                  </div>
                </div>
              )}
              <div className="cyc__drawer-desc">
                {D._cat === "ITC" && (
                  <p>
                    {lang === "fr"
                      ? "Cyclone tropical intense · vents > 160 km/h · destructions majeures, risque vital pour les côtes."
                      : "Intense tropical cyclone · winds > 160 km/h · major destruction, life-threatening coastal risk."}
                  </p>
                )}
                {D._cat === "STC" && (
                  <p>
                    {lang === "fr"
                      ? "Cyclone tropical sévère · vents 118–159 km/h · dégâts importants aux structures et littoral."
                      : "Severe tropical cyclone · winds 118–159 km/h · major structural and coastal damage."}
                  </p>
                )}
                {D._cat === "TC" && (
                  <p>
                    {lang === "fr"
                      ? "Cyclone tropical · vents 89–117 km/h · évacuations préventives conseillées."
                      : "Tropical cyclone · winds 89–117 km/h · preventive evacuations advised."}
                  </p>
                )}
                {D._cat === "TS" && (
                  <p>
                    {lang === "fr"
                      ? "Tempête tropicale · vents 63–88 km/h · risques côtiers et inondations."
                      : "Tropical storm · winds 63–88 km/h · coastal risks and flooding."}
                  </p>
                )}
                {D._cat === "TD" && (
                  <p>
                    {lang === "fr"
                      ? "Dépression tropicale · vents < 63 km/h · précipitations intenses."
                      : "Tropical depression · winds < 63 km/h · heavy rainfall."}
                  </p>
                )}
              </div>
            </div>
            <div className="cyc__drawer-source">
              IBTrACS · data.gouv.nc · Météo-France · SPEArTC
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
