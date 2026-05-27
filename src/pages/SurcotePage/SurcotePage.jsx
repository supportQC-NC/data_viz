// src/pages/SurcotePage/SurcotePage.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useLang } from "../../store/context/langContext";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  Legend,
} from "recharts";
import {
  fetchSurcote,
  fetchAleas,
  fetchLittoral,
  selectSurcote,
  selectAleas,
  selectLittoral,
} from "../../store/slices/surcoteSlice";
import "./SurcotePage.scss";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

const SURCOTE_COLORS = [
  "#00e6ff",
  "#00ffd5",
  "#ffd166",
  "#ff9f43",
  "#ff6b35",
  "#ff3b5c",
];
const TICK = {
  fontSize: 11,
  fontFamily: "Roboto Mono, monospace",
  fill: "var(--text-muted)",
};

const getSurcoteColor = (val) => {
  if (val < 0.5) return SURCOTE_COLORS[0];
  if (val < 1.0) return SURCOTE_COLORS[1];
  if (val < 1.5) return SURCOTE_COLORS[2];
  if (val < 2.0) return SURCOTE_COLORS[3];
  if (val < 3.0) return SURCOTE_COLORS[4];
  return SURCOTE_COLORS[5];
};

// ── Tooltip ───────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      {label && <div className="chart-tooltip__label">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="chart-tooltip__row">
          <span
            className="chart-tooltip__dot"
            style={{ background: p.color || p.fill }}
          />
          <span className="chart-tooltip__name">{p.name}</span>
          <span className="chart-tooltip__value">
            {typeof p.value === "number" ? p.value.toFixed(3) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Stat card ─────────────────────────────────────────────────
const StatCard = ({ icon, value, label, sub, danger }) => (
  <div className={`sur-stat${danger ? " sur-stat--danger" : ""}`}>
    <span className="sur-stat__icon">{icon}</span>
    <span className="sur-stat__value">{value}</span>
    <span className="sur-stat__label">{label}</span>
    {sub && <span className="sur-stat__sub">{sub}</span>}
  </div>
);

// ── Map Mapbox ────────────────────────────────────────────────
const SurcoteMap = ({
  surcoteFeatures,
  aleasFeatures,
  expanded,
  onExpand,
  onCollapse,
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [ready, setReady] = useState(false);
  const [activeLayer, setActiveLayer] = useState("heatmap"); // heatmap | points | aleas

  const initMap = () => {
    if (map.current || !mapContainer.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [165.5, -21.5],
      zoom: 6.5,
    });
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current.addControl(new mapboxgl.ScaleControl(), "bottom-right");

    map.current.on("load", () => {
      // ── Sources ──
      map.current.addSource("surcote", {
        type: "geojson",
        data: { type: "FeatureCollection", features: surcoteFeatures },
      });
      map.current.addSource("aleas", {
        type: "geojson",
        data: { type: "FeatureCollection", features: aleasFeatures },
      });

      // ── HEATMAP surcote — douce à faible zoom, précise au zoom ──
      map.current.addLayer({
        id: "surcote-heat",
        type: "heatmap",
        source: "surcote",
        maxzoom: 10,
        paint: {
          // Poids selon valeur de surcote
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["get", "Surcote"],
            0,
            0,
            4,
            1,
          ],
          // Intensité très faible au dézoom, monte progressivement
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            0.1,
            7,
            0.4,
            9,
            1.5,
          ],
          // Rayon petit au dézoom = points distincts, large au zoom = blob
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            4,
            7,
            8,
            9,
            16,
            10,
            24,
          ],
          // Opacité faible au dézoom
          "heatmap-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            0.4,
            7,
            0.65,
            9,
            0.8,
            10,
            0,
          ],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(0,0,0,0)",
            0.15,
            "rgba(0,230,255,0.5)",
            0.35,
            "rgba(0,255,180,0.7)",
            0.55,
            "rgba(255,209,102,0.85)",
            0.75,
            "rgba(255,107,53,0.9)",
            0.9,
            "rgba(255,59,92,1)",
            1,
            "rgba(200,0,60,1)",
          ],
        },
      });

      // ── CERCLES surcote — apparaissent zoom > 8, remplacent la heatmap ──
      map.current.addLayer({
        id: "surcote-point",
        type: "circle",
        source: "surcote",
        minzoom: 8,
        paint: {
          // Rayon croît avec le zoom
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            8,
            2,
            10,
            4,
            12,
            7,
            14,
            10,
          ],
          "circle-color": [
            "step",
            ["get", "Surcote"],
            "#00e6ff",
            0.5,
            "#00ffd5",
            1.0,
            "#ffd166",
            1.5,
            "#ff9f43",
            2.0,
            "#ff6b35",
            3.0,
            "#ff3b5c",
          ],
          // Opacité croît avec le zoom (inverse de la heatmap)
          "circle-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            8,
            0,
            9,
            0.5,
            10,
            0.85,
          ],
          "circle-stroke-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            9,
            0,
            11,
            1,
          ],
          "circle-stroke-color": "rgba(255,255,255,0.3)",
        },
      });

      // ── ALÉAS lignes côtières ──
      map.current.addLayer({
        id: "aleas-line",
        type: "line",
        source: "aleas",
        paint: {
          "line-color": [
            "case",
            ["==", ["get", "alea_submersion"], "Oui"],
            [
              "case",
              [
                ">=",
                ["coalesce", ["to-number", ["get", "indice_total"], 0], 0],
                12,
              ],
              "#ff3b5c",
              [
                ">=",
                ["coalesce", ["to-number", ["get", "indice_total"], 0], 0],
                8,
              ],
              "#ff6b35",
              [
                ">=",
                ["coalesce", ["to-number", ["get", "indice_total"], 0], 0],
                5,
              ],
              "#ffd166",
              "#ff9f43",
            ],
            "#00b4cc",
          ],
          "line-width": ["interpolate", ["linear"], ["zoom"], 5, 1.5, 10, 4],
          "line-opacity": 0.9,
        },
      });

      // ── Symboles surcote (valeurs texte zoom > 11) ──
      map.current.addLayer({
        id: "surcote-labels",
        type: "symbol",
        source: "surcote",
        minzoom: 11,
        layout: {
          visibility: "none",
          "text-field": [
            "concat",
            ["to-string", ["round", ["*", ["get", "Surcote"], 100]]],
            "cm",
          ],
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 11,
          "text-offset": [0, -1.2],
          "text-anchor": "bottom",
        },
        paint: {
          "text-color": [
            "step",
            ["get", "Surcote"],
            "#00e6ff",
            0.5,
            "#00ffd5",
            1.0,
            "#ffd166",
            1.5,
            "#ff9f43",
            2.0,
            "#ff6b35",
            3.0,
            "#ff3b5c",
          ],
          "text-halo-color": "rgba(2,11,24,0.8)",
          "text-halo-width": 1.5,
        },
      });

      // ── Popup clic ──
      map.current.on("click", "surcote-point", (e) => {
        const p = e.features[0].properties;
        new mapboxgl.Popup({ closeButton: true, className: "sur-popup" })
          .setLngLat(e.lngLat)
          .setHTML(
            `
            <div style="font-family:'Roboto Mono',monospace;font-size:11px;color:#f0f8ff;padding:8px;min-width:180px">
              <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:#00e6ff;border-bottom:1px solid rgba(0,230,255,0.2);padding-bottom:6px">${p.Commune}</div>
              <div style="display:flex;justify-content:space-between;margin:3px 0">
                <span style="color:#5a7a94">Surcote</span>
                <b style="color:#ff3b5c">${parseFloat(p.Surcote).toFixed(2)} m</b>
              </div>
              <div style="display:flex;justify-content:space-between;margin:3px 0">
                <span style="color:#5a7a94">Vague signif.</span>
                <b style="color:#ff9f43">${parseFloat(p.HauteurSignificative).toFixed(2)} m</b>
              </div>
              <div style="display:flex;justify-content:space-between;margin:3px 0">
                <span style="color:#5a7a94">Période</span>
                <b>${parseFloat(p.Periode).toFixed(0)} ans</b>
              </div>
            </div>
          `,
          )
          .addTo(map.current);
      });

      map.current.on("mouseenter", "surcote-point", () => {
        map.current.getCanvas().style.cursor = "pointer";
      });
      map.current.on("mouseleave", "surcote-point", () => {
        map.current.getCanvas().style.cursor = "";
      });
      map.current.on("mouseenter", "aleas-line", () => {
        map.current.getCanvas().style.cursor = "pointer";
      });
      map.current.on("mouseleave", "aleas-line", () => {
        map.current.getCanvas().style.cursor = "";
      });

      setReady(true);
    });
  };

  useEffect(() => {
    initMap();
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        setReady(false);
      }
    };
  }, []);

  // Resize quand expand change
  useEffect(() => {
    setTimeout(() => {
      if (map.current) map.current.resize();
    }, 300);
  }, [expanded]);

  // Update données
  useEffect(() => {
    if (!ready) return;
    const src = map.current?.getSource("surcote");
    if (src)
      src.setData({ type: "FeatureCollection", features: surcoteFeatures });
  }, [ready, surcoteFeatures]);

  useEffect(() => {
    if (!ready) return;
    const src = map.current?.getSource("aleas");
    if (src)
      src.setData({ type: "FeatureCollection", features: aleasFeatures });
  }, [ready, aleasFeatures]);

  // Toggle layers
  const toggleLayer = (mode) => {
    if (!map.current) return;
    setActiveLayer(mode);
    const visibility = (id, show) =>
      map.current.setLayoutProperty(
        id,
        "visibility",
        show ? "visible" : "none",
      );
    if (mode === "heatmap") {
      map.current.setFilter("surcote-labels", null);
      visibility("surcote-heat", true);
      visibility("surcote-point", true);
      visibility("aleas-line", false);
      visibility("surcote-labels", false);
      map.current.easeTo({ pitch: 0, bearing: 0, duration: 800 });
    } else if (mode === "aleas") {
      map.current.setFilter("surcote-labels", null);
      visibility("surcote-heat", false);
      visibility("surcote-point", false);
      visibility("aleas-line", true);
      visibility("surcote-labels", false);
      map.current.easeTo({ pitch: 0, bearing: 0, duration: 800 });
    } else if (mode === "3d") {
      visibility("surcote-heat", false);
      visibility("surcote-point", false);
      visibility("aleas-line", true);
      visibility("surcote-labels", true);
      // Filtre : on n'affiche les labels que pour surcote > 1m pour lisibilité
      map.current.setFilter("surcote-labels", [">", ["get", "Surcote"], 1.0]);
      map.current.easeTo({ pitch: 40, bearing: -15, duration: 1200 });
    }
  };

  return (
    <div className={`sur-map${expanded ? " sur-map--expanded" : ""}`}>
      {/* Contrôles couches */}
      <div className="sur-map__controls">
        {[
          { id: "heatmap", label: "🌡️ Heatmap surcote" },
          { id: "aleas", label: "⚠️ Aléas côtiers" },
          { id: "3d", label: "🌐 Vue inclinée + labels" },
        ].map((btn) => (
          <button
            key={btn.id}
            className={`sur-map__ctrl-btn${activeLayer === btn.id ? " active" : ""}`}
            onClick={() => toggleLayer(btn.id)}
          >
            {btn.label}
          </button>
        ))}
        <button
          className="sur-map__expand-btn"
          onClick={expanded ? onCollapse : onExpand}
          title={expanded ? "Réduire" : "Agrandir"}
        >
          {expanded ? "⊡" : "⛶"}
        </button>
      </div>

      <div ref={mapContainer} className="sur-map__canvas" />

      {/* Légende dynamique */}
      <div className="sur-map__legend">
        {activeLayer === "heatmap" && (
          <>
            <div className="sur-map__legend-title">Surcote (m)</div>
            {["< 0.5", "0.5–1", "1–1.5", "1.5–2", "2–3", "> 3"].map(
              (label, i) => (
                <div key={i} className="sur-map__legend-item">
                  <span
                    className="sur-map__legend-dot"
                    style={{ background: SURCOTE_COLORS[i] }}
                  />
                  <span>{label}</span>
                </div>
              ),
            )}
          </>
        )}
        {activeLayer === "aleas" && (
          <>
            <div className="sur-map__legend-title">Aléa submersion</div>
            {[
              { label: "Critique (≥12)", color: "#ff3b5c" },
              { label: "Élevé (8–12)", color: "#ff6b35" },
              { label: "Modéré (5–8)", color: "#ffd166" },
              { label: "Faible", color: "#ff9f43" },
              { label: "Non exposé", color: "#00b4cc" },
            ].map((item, i) => (
              <div key={i} className="sur-map__legend-item">
                <span
                  className="sur-map__legend-line"
                  style={{ background: item.color }}
                />
                <span>{item.label}</span>
              </div>
            ))}
          </>
        )}
        {activeLayer === "3d" && (
          <>
            <div className="sur-map__legend-title">Vue 3D</div>
            <div
              className="sur-map__legend-item"
              style={{ fontSize: "0.62rem", maxWidth: 120, lineHeight: 1.4 }}
            >
              Hauteur proportionnelle à la surcote (× 5000)
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Page ─────────────────────────────────────────────────────
export default function SurcotePage() {
  const dispatch = useDispatch();
  const { t } = useLang();

  const surcote = useSelector(selectSurcote);
  const aleas = useSelector(selectAleas);
  const littoral = useSelector(selectLittoral);

  const [mapExpanded, setMapExpanded] = useState(false);

  useEffect(() => {
    if (surcote.status === "idle") dispatch(fetchSurcote());
    if (aleas.status === "idle") dispatch(fetchAleas());
    if (littoral.status === "idle") dispatch(fetchLittoral());
  }, [dispatch, surcote.status, aleas.status, littoral.status]);

  // Bloquer scroll quand expanded
  useEffect(() => {
    document.body.style.overflow = mapExpanded ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mapExpanded]);

  const surProps = useMemo(
    () => surcote.features.map((f) => f.properties),
    [surcote.features],
  );
  const aleasProps = useMemo(
    () => aleas.features.map((f) => f.properties),
    [aleas.features],
  );

  const stats = useMemo(() => {
    if (!surProps.length || !aleasProps.length) return null;
    const maxSurcote = Math.max(
      ...surProps.map((p) => parseFloat(p.Surcote) || 0),
    );
    const maxHauteur = Math.max(
      ...surProps.map((p) => parseFloat(p.HauteurSignificative) || 0),
    );
    const communes = new Set(surProps.map((p) => p.Commune)).size;
    const exposed = aleasProps.filter(
      (p) => p.alea_submersion === "Oui",
    ).length;
    return {
      maxSurcote,
      maxHauteur,
      communes,
      exposed,
      totalAleas: aleasProps.length,
    };
  }, [surProps, aleasProps]);

  const topCommunes = useMemo(() => {
    const map = {};
    surProps.forEach((p) => {
      const c = p.Commune;
      if (!map[c]) map[c] = { commune: c, sum: 0, count: 0 };
      map[c].sum += parseFloat(p.Surcote) || 0;
      map[c].count += 1;
    });
    return Object.values(map)
      .map((d) => ({
        commune: d.commune,
        surcote: parseFloat((d.sum / d.count).toFixed(3)),
      }))
      .sort((a, b) => b.surcote - a.surcote)
      .slice(0, 12);
  }, [surProps]);

  const aleaData = useMemo(
    () => [
      {
        name: "Érosion côtière",
        value: aleasProps.filter((p) => p.alea_erosion === "Oui").length,
        color: "#ffd166",
      },
      {
        name: "Submersion marine",
        value: aleasProps.filter((p) => p.alea_submersion === "Oui").length,
        color: "#ff3b5c",
      },
      {
        name: "Mouvement terrain",
        value: aleasProps.filter((p) => p.alea_mouvement_terrain === "Oui")
          .length,
        color: "#ff9f43",
      },
    ],
    [aleasProps],
  );

  const scatterData = useMemo(
    () =>
      surProps
        .filter((_, i) => i % 8 === 0)
        .map((p) => ({
          x: parseFloat(p.Surcote) || 0,
          y: parseFloat(p.HauteurSignificative) || 0,
          comm: p.Commune,
        }))
        .filter((d) => d.x > 0 && d.y > 0),
    [surProps],
  );

  const isLoading = surcote.status === "loading" || aleas.status === "loading";

  if (isLoading) {
    return (
      <div className="surcote-page">
        <div className="surcote-page__loader">
          <div className="surcote-page__spinner" />
          <span>Chargement des données côtières…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="surcote-page">
      <div className="surcote-page__inner">
        {/* Header */}
        <div className="surcote-page__header">
          <span className="surcote-page__label">
            OBLIC · Géorep NC · Cyclone centennal
          </span>
          <h1 className="surcote-page__title">Surcote & Risques côtiers</h1>
          <p className="surcote-page__sub">
            {surProps.length.toLocaleString()} points de surcote ·{" "}
            {aleasProps.length.toLocaleString()} segments côtiers ·
            Nouvelle-Calédonie
          </p>
          <Link to="/surcote/guide" className="surcote-page__guide-btn">
            📖 Guide de lecture →
          </Link>
        </div>

        {/* Stats */}
        {stats && (
          <div className="surcote-page__stats">
            <StatCard
              icon="🌊"
              value={`${stats.maxSurcote.toFixed(2)} m`}
              label="Surcote maximale"
              sub="cyclone centennal"
              danger
            />
            <StatCard
              icon="🌊"
              value={`${stats.maxHauteur.toFixed(2)} m`}
              label="Vague significative max"
              sub="au trait de côte"
              danger
            />
            <StatCard
              icon="🏙️"
              value={stats.communes}
              label="Communes exposées"
              sub="littoral NC"
            />
            <StatCard
              icon="⚠️"
              value={`${((stats.exposed / stats.totalAleas) * 100).toFixed(0)}%`}
              label="Segments à risque"
              sub={`${stats.exposed.toLocaleString()} / ${stats.totalAleas.toLocaleString()}`}
              danger
            />
          </div>
        )}

        {/* Map */}
        {surcote.status === "succeeded" && aleas.status === "succeeded" && (
          <div className="surcote-page__section">
            <div className="surcote-page__section-header">
              <h2 className="surcote-page__section-title">
                🗺️ Carte des risques côtiers
              </h2>
              <p className="surcote-page__section-desc">
                Heatmap · Aléas côtiers · Vue 3D — Basculez entre les modes
                d'affichage
              </p>
            </div>
            <SurcoteMap
              surcoteFeatures={surcote.features}
              aleasFeatures={aleas.features}
              expanded={mapExpanded}
              onExpand={() => setMapExpanded(true)}
              onCollapse={() => setMapExpanded(false)}
            />
          </div>
        )}

        {/* Charts */}
        <div className="surcote-page__charts">
          <div className="sur-chart-card sur-chart-card--wide">
            <div className="sur-chart-card__header">
              <h2 className="sur-chart-card__title">
                Top communes — Surcote moyenne
              </h2>
              <p className="sur-chart-card__desc">
                Surcote moyenne en mètres pour un cyclone centennal
              </p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={topCommunes}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 90, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  type="number"
                  tick={TICK}
                  stroke="rgba(255,255,255,0.12)"
                  unit=" m"
                />
                <YAxis
                  type="category"
                  dataKey="commune"
                  tick={TICK}
                  stroke="rgba(255,255,255,0.12)"
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="surcote" name="Surcote (m)" radius={[0, 4, 4, 0]}>
                  {topCommunes.map((entry, i) => (
                    <Cell key={i} fill={getSurcoteColor(entry.surcote)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="sur-chart-card">
            <div className="sur-chart-card__header">
              <h2 className="sur-chart-card__title">
                Répartition des aléas côtiers
              </h2>
              <p className="sur-chart-card__desc">
                Segments exposés par type d'aléa
              </p>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={aleaData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {aleaData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(v) => (
                    <span
                      style={{
                        fontSize: 10,
                        color: "var(--text-muted)",
                        fontFamily: "Roboto Mono",
                      }}
                    >
                      {v}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="sur-chart-card">
            <div className="sur-chart-card__header">
              <h2 className="sur-chart-card__title">
                Surcote vs Vague significative
              </h2>
              <p className="sur-chart-card__desc">
                Corrélation entre surcote et hauteur de vague
              </p>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart
                margin={{ top: 10, right: 20, left: -10, bottom: 24 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="x"
                  name="Surcote"
                  type="number"
                  domain={["auto", "auto"]}
                  tick={TICK}
                  stroke="rgba(255,255,255,0.12)"
                  label={{
                    value: "Surcote (m)",
                    position: "insideBottom",
                    offset: -12,
                    style: { ...TICK, fill: "var(--text-muted)" },
                  }}
                />
                <YAxis
                  dataKey="y"
                  name="Vague"
                  type="number"
                  tick={TICK}
                  stroke="rgba(255,255,255,0.12)"
                  label={{
                    value: "Vague signif. (m)",
                    angle: -90,
                    position: "insideLeft",
                    offset: 10,
                    style: { ...TICK, fill: "var(--text-muted)" },
                  }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload;
                    return (
                      <div className="chart-tooltip">
                        <div className="chart-tooltip__label">{d.comm}</div>
                        <div className="chart-tooltip__row">
                          <span className="chart-tooltip__name">Surcote</span>
                          <span className="chart-tooltip__value">
                            {d.x.toFixed(2)} m
                          </span>
                        </div>
                        <div className="chart-tooltip__row">
                          <span className="chart-tooltip__name">Vague</span>
                          <span className="chart-tooltip__value">
                            {d.y.toFixed(2)} m
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Scatter data={scatterData} fill="#00e6ff" fillOpacity={0.5} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Map plein écran overlay */}
      {mapExpanded && (
        <div className="sur-map-overlay">
          <SurcoteMap
            surcoteFeatures={surcote.features}
            aleasFeatures={aleas.features}
            expanded={true}
            onExpand={() => {}}
            onCollapse={() => setMapExpanded(false)}
          />
        </div>
      )}
    </div>
  );
}
