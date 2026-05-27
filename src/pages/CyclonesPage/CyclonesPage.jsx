// src/pages/CyclonesPage/CyclonesPage.jsx
import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import {
  fetchPositions,
  fetchTrajectoires,
  selectPositions,
  selectTrajectoires,
} from "../../store/slices/cyclonesSlice";
import { useLang } from "../../store/context/langContext";
import "./CyclonesPage.scss";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

const TYPE_ORDER = [
  "Non classé",
  "Dépression tropicale faible",
  "Dépression tropicale modérée",
  "Dépression tropicale forte",
  "Cyclone tropical",
  "Cyclone tropical intense",
  "Cyclone tropical très intense",
];

const TYPE_COLORS = {
  "Non classé": "#4a6a84",
  "Dépression tropicale faible": "#00b4cc",
  "Dépression tropicale modérée": "#00e6ff",
  "Dépression tropicale forte": "#ffd166",
  "Cyclone tropical": "#ff9f43",
  "Cyclone tropical intense": "#ff6b35",
  "Cyclone tropical très intense": "#ff3b5c",
};

const TICK = {
  fontSize: 11,
  fontFamily: "Roboto Mono, monospace",
  fill: "var(--text-muted)",
};

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
          <span className="chart-tooltip__value">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const ChartModal = ({ open, onClose, title, desc, children }) => {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  if (!open) return null;
  return (
    <div className="chart-modal" onClick={onClose}>
      <div className="chart-modal__inner" onClick={(e) => e.stopPropagation()}>
        <div className="chart-modal__header">
          <div>
            <h2 className="chart-modal__title">{title}</h2>
            <p className="chart-modal__desc">{desc}</p>
          </div>
          <button className="chart-modal__close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="chart-modal__body">{children(520)}</div>
      </div>
    </div>
  );
};

const ChartCard = ({ title, desc, wide, children }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <div className={`chart-card${wide ? " chart-card--wide" : ""}`}>
        <div className="chart-card__header">
          <div>
            <h2 className="chart-card__title">{title}</h2>
            <p className="chart-card__desc">{desc}</p>
          </div>
          <button
            className="chart-card__expand"
            onClick={() => setExpanded(true)}
            title="Agrandir"
          >
            ⛶
          </button>
        </div>
        <div className="chart-card__body">{children(260)}</div>
      </div>
      <ChartModal
        open={expanded}
        onClose={() => setExpanded(false)}
        title={title}
        desc={desc}
      >
        {children}
      </ChartModal>
    </>
  );
};

const StatCard = ({ icon, value, label, sub, danger }) => (
  <div className={`cyc-stat${danger ? " cyc-stat--danger" : ""}`}>
    <span className="cyc-stat__icon">{icon}</span>
    <span className="cyc-stat__value">{value}</span>
    <span className="cyc-stat__label">{label}</span>
    {sub && <span className="cyc-stat__sub">{sub}</span>}
  </div>
);

// ── Animation Mapbox + Canvas ─────────────────────────────────
const CycloneAnimation = ({ positions }) => {
  const wrapperRef = useRef(null);
  const mapContainer = useRef(null);
  const canvasRef = useRef(null);
  const mapRef = useRef(null);
  const rafRef = useRef(null);
  const frameRef = useRef(0);
  const readyRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(0.2);
  const [progress, setProgress] = useState(0);
  const [currentCyc, setCurrentCyc] = useState(null);

  // Calcul des données cyclone — mémorisé stablement
  const cycloneData = useMemo(() => {
    const obj = {};
    positions.forEach((p) => {
      if (!obj[p.num_ref]) obj[p.num_ref] = { name: p.nom, points: [] };
      obj[p.num_ref].points.push({
        lat: p.latitude,
        lng: p.longitude,
        date: p.date,
        type: p.type,
        vmax: p.vmax,
      });
    });
    return Object.values(obj)
      .map((c) => ({
        ...c,
        points: c.points.sort((a, b) => new Date(a.date) - new Date(b.date)),
      }))
      .filter((c) => c.points.length > 1);
  }, [positions]);

  const totalFrames = useMemo(
    () => cycloneData.reduce((s, c) => s + c.points.length, 0),
    [cycloneData],
  );

  const getColor = (type) => TYPE_COLORS[type] || "#4a6a84";

  // draw — retourne le cyclone actuellement en cours
  const drawFrame = (frame, data, total, map, canvas) => {
    if (!canvas || !map || !data.length) return null;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    if (w === 0 || h === 0) return null;
    ctx.clearRect(0, 0, w, h);

    let globalIdx = 0;
    let activeCyc = null;

    data.forEach((cyclone) => {
      const pts = cyclone.points;
      const cycStart = globalIdx;
      const cycEnd = globalIdx + pts.length - 1;
      const visible = Math.min(pts.length, Math.max(0, frame - cycStart + 1));
      globalIdx += pts.length;

      // Cyclone terminé → on n'affiche rien (effacé pour lisibilité)
      if (frame > cycEnd) return;
      if (visible <= 0) return;

      // Cyclone en cours → c'est le cyclone actif
      if (frame >= cycStart && frame <= cycEnd) {
        activeCyc = { ...cyclone, currentPt: pts[visible - 1] };
      }

      // Trajectoire partielle uniquement
      for (let i = 0; i < visible - 1; i++) {
        if (!pts[i] || !pts[i + 1]) continue;
        const a = map.project([pts[i].lng, pts[i].lat]);
        const b = map.project([pts[i + 1].lng, pts[i + 1].lat]);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = getColor(pts[i].type);
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.75;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Tête
      if (visible > 0 && pts[visible - 1]) {
        const last = pts[visible - 1];
        const head = map.project([last.lng, last.lat]);
        const color = getColor(last.type);
        const radius = last.vmax ? Math.min(14, 4 + last.vmax / 10) : 5;

        const grd = ctx.createRadialGradient(
          head.x,
          head.y,
          0,
          head.x,
          head.y,
          radius * 3,
        );
        grd.addColorStop(0, color + "aa");
        grd.addColorStop(0.5, color + "33");
        grd.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(head.x, head.y, radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(head.x, head.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = color;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (cyclone.name && radius > 7) {
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.font = "bold 10px Roboto Mono";
          ctx.fillText(cyclone.name, head.x + radius + 3, head.y + 4);
        }
      }
    });

    ctx.fillStyle = "rgba(0,230,255,0.4)";
    ctx.font = "10px Roboto Mono";
    ctx.fillText(`${frame} / ${total}`, 10, h - 10);

    return activeCyc;
  };

  // Sync taille canvas
  const syncSize = () => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
  };

  // Init Mapbox — une seule fois
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;
    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [163, -18],
      zoom: 4.5,
      projection: { name: "mercator" },
      interactive: true,
    });
    mapRef.current.on("load", () => {
      readyRef.current = true;
      syncSize();
      drawFrame(
        frameRef.current,
        cycloneData,
        totalFrames,
        mapRef.current,
        canvasRef.current,
      );
    });
    mapRef.current.on("move", () => {
      syncSize();
      drawFrame(
        frameRef.current,
        cycloneData,
        totalFrames,
        mapRef.current,
        canvasRef.current,
      );
    });
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      readyRef.current = false;
    };
  }, [cycloneData, totalFrames]);

  // ResizeObserver
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const ro = new ResizeObserver(() => {
      syncSize();
      drawFrame(
        frameRef.current,
        cycloneData,
        totalFrames,
        mapRef.current,
        canvasRef.current,
      );
    });
    ro.observe(wrapper);
    syncSize();
    return () => ro.disconnect();
  }, [cycloneData, totalFrames]);

  // Boucle animation
  useEffect(() => {
    if (!playing) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    let localSpeed = speed;
    const loop = () => {
      frameRef.current = Math.min(frameRef.current + localSpeed, totalFrames);
      setProgress(frameRef.current / totalFrames);
      const cyc = drawFrame(
        Math.floor(frameRef.current),
        cycloneData,
        totalFrames,
        mapRef.current,
        canvasRef.current,
      );
      setCurrentCyc(cyc);
      if (frameRef.current >= totalFrames) {
        frameRef.current = 0;
        setPlaying(false);
        setCurrentCyc(null);
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, speed, cycloneData, totalFrames]);

  const handlePlayPause = () => {
    if (!playing && frameRef.current >= totalFrames) frameRef.current = 0;
    setPlaying((v) => !v);
  };

  const handleSeek = (e) => {
    const pct = parseFloat(e.target.value);
    frameRef.current = Math.floor(pct * totalFrames);
    setProgress(pct);
    drawFrame(
      Math.floor(frameRef.current),
      cycloneData,
      totalFrames,
      mapRef.current,
      canvasRef.current,
    );
  };

  return (
    <div className="cyc-anim" ref={wrapperRef}>
      <div ref={mapContainer} className="cyc-anim__map" />
      <canvas ref={canvasRef} className="cyc-anim__canvas" />
      {currentCyc && (
        <div className="cyc-anim__infobar">
          <span className="cyc-anim__infobar-name">{currentCyc.name}</span>
          <span className="cyc-anim__infobar-sep">·</span>
          <span
            className="cyc-anim__infobar-type"
            style={{
              color: TYPE_COLORS[currentCyc.currentPt?.type] || "#00e6ff",
            }}
          >
            {currentCyc.currentPt?.type}
          </span>
          <span className="cyc-anim__infobar-sep">·</span>
          <span className="cyc-anim__infobar-date">
            {currentCyc.currentPt?.date?.slice(0, 10)}
          </span>
          {currentCyc.currentPt?.vmax && (
            <>
              <span className="cyc-anim__infobar-sep">·</span>
              <span className="cyc-anim__infobar-vmax">
                {currentCyc.currentPt.vmax} m/s
              </span>
            </>
          )}
        </div>
      )}
      <div className="cyc-anim__controls">
        <button
          className={`cyc-anim__play${playing ? " playing" : ""}`}
          onClick={handlePlayPause}
        >
          {playing ? "⏹" : "▶"}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.001"
          value={progress}
          onChange={handleSeek}
          className="cyc-anim__seek"
        />
        <div className="cyc-anim__speed">
          {[0.2, 0.5, 1].map((s) => (
            <button
              key={s}
              className={`cyc-anim__speed-btn${speed === s ? " active" : ""}`}
              onClick={() => setSpeed(s)}
            >
              {s === 0.2 ? "lent" : s === 0.5 ? "0.5x" : "1x"}
            </button>
          ))}
        </div>
      </div>
      <div className="cyc-anim__legend">
        {TYPE_ORDER.slice(2).map((tp) => (
          <div key={tp} className="cyc-anim__legend-item">
            <span
              style={{
                background: TYPE_COLORS[tp],
                width: 8,
                height: 8,
                borderRadius: "50%",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            <span>{tp}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Page ─────────────────────────────────────────────────────
export default function CyclonesPage() {
  const dispatch = useDispatch();
  const { t } = useLang();
  const positions = useSelector(selectPositions);
  const trajectoires = useSelector(selectTrajectoires);

  useEffect(() => {
    if (positions.status === "idle") dispatch(fetchPositions());
    if (trajectoires.status === "idle") dispatch(fetchTrajectoires());
  }, [dispatch, positions.status, trajectoires.status]);

  const trajs = useMemo(
    () => trajectoires.features.map((f) => f.properties),
    [trajectoires.features],
  );
  const pos = useMemo(
    () => positions.features.map((f) => f.properties),
    [positions.features],
  );

  const stats = useMemo(() => {
    if (!trajs.length) return null;
    const wv = trajs.filter((tr) => tr.vmax_traj);
    const wp = trajs.filter((tr) => tr.pmin_traj);
    const byYear = {};
    trajs.forEach((tr) => {
      byYear[tr.annee_deb] = (byYear[tr.annee_deb] || 0) + 1;
    });
    const worstYear = Object.entries(byYear).reduce(
      (a, b) => (b[1] > a[1] ? b : a),
      ["", 0],
    );
    return {
      total: trajs.length,
      mostIntense: wv.reduce(
        (a, b) => (b.vmax_traj > a.vmax_traj ? b : a),
        wv[0],
      ),
      lowestPmin: wp.reduce(
        (a, b) => (b.pmin_traj < a.pmin_traj ? b : a),
        wp[0],
      ),
      worstYear,
    };
  }, [trajs]);

  const byYearData = useMemo(() => {
    const obj = {};
    trajs.forEach((tr) => {
      const y = tr.annee_deb;
      if (!obj[y]) obj[y] = { annee: y, total: 0, intense: 0 };
      obj[y].total++;
      if (
        [
          "Cyclone tropical",
          "Cyclone tropical intense",
          "Cyclone tropical très intense",
        ].includes(tr.type_max)
      )
        obj[y].intense++;
    });
    return Object.values(obj).sort((a, b) => a.annee - b.annee);
  }, [trajs]);

  const byDecadeData = useMemo(() => {
    const obj = {};
    trajs.forEach((tr) => {
      const d = Math.floor(tr.annee_deb / 10) * 10;
      if (!obj[d]) obj[d] = { decade: `${d}s`, vmaxMax: 0 };
      if (tr.vmax_traj > obj[d].vmaxMax) obj[d].vmaxMax = tr.vmax_traj;
    });
    return Object.values(obj).sort((a, b) => a.decade.localeCompare(b.decade));
  }, [trajs]);

  const byTypeData = useMemo(() => {
    const obj = {};
    trajs.forEach((tr) => {
      const type = tr.type_max || "Non classé";
      if (!obj[type]) obj[type] = { name: type, value: 0 };
      obj[type].value++;
    });
    return TYPE_ORDER.filter((tr) => obj[tr]).map((tr) => obj[tr]);
  }, [trajs]);

  const scatterData = useMemo(
    () =>
      trajs
        .filter((tr) => tr.vmax_traj && tr.pmin_traj)
        .map((tr) => ({
          x: tr.pmin_traj,
          y: tr.vmax_traj,
          name: tr.nom,
          annee: tr.annee_deb,
        })),
    [trajs],
  );

  if (positions.status === "loading" || trajectoires.status === "loading") {
    return (
      <div className="cyclones-page">
        <div className="cyclones-page__loader">
          <div className="cyclones-page__spinner" />
          <span>{t("cyclones.loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="cyclones-page">
      <div className="cyclones-page__inner">
        <div className="cyclones-page__header">
          <span className="cyclones-page__label">
            {t("cyclones.page_label")}
          </span>
          <h1 className="cyclones-page__title">{t("cyclones.page_title")}</h1>
          <p className="cyclones-page__sub">
            {trajs.length} {t("cyclones.stat1_label").toLowerCase()} ·{" "}
            {pos.length} positions · {t("cyclones.stat1_sub")}
          </p>
          <Link to="/cyclones/map" className="cyclones-page__map-btn">
            {t("cyclones.map_btn")}
          </Link>
        </div>

        {stats && (
          <div className="cyclones-page__stats">
            <StatCard
              icon="🌀"
              value={stats.total}
              label={t("cyclones.stat1_label")}
              sub={t("cyclones.stat1_sub")}
            />
            <StatCard
              icon="💨"
              value={`${stats.mostIntense?.vmax_traj} m/s`}
              label={t("cyclones.stat2_label")}
              sub={`${stats.mostIntense?.nom} — ${stats.mostIntense?.annee_deb}`}
              danger
            />
            <StatCard
              icon="📉"
              value={`${stats.lowestPmin?.pmin_traj} hPa`}
              label={t("cyclones.stat3_label")}
              sub={`${stats.lowestPmin?.nom} — ${stats.lowestPmin?.annee_deb}`}
              danger
            />
            <StatCard
              icon="📅"
              value={stats.worstYear[0]}
              label={t("cyclones.stat4_label")}
              sub={`${stats.worstYear[1]} phénomènes`}
            />
          </div>
        )}

        {pos.length > 0 && (
          <div className="cyclones-page__section">
            <div className="cyclones-page__section-header">
              <h2 className="cyclones-page__section-title">
                🎬 Animation des trajectoires — 1977 à 2024
              </h2>
              <p className="cyclones-page__section-desc">
                Rejoue toutes les trajectoires dans l'ordre chronologique sur
                fond satellite. Chaque point = une observation toutes les 6h.
              </p>
            </div>
            <CycloneAnimation positions={pos} />
          </div>
        )}

        <div className="cyclones-page__charts">
          <ChartCard
            title={t("cyclones.chart1_title")}
            desc={t("cyclones.chart1_desc")}
            wide
          >
            {(h) => (
              <ResponsiveContainer width="100%" height={h}>
                <BarChart
                  data={byYearData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="annee"
                    tick={TICK}
                    stroke="rgba(255,255,255,0.12)"
                    interval={4}
                  />
                  <YAxis tick={TICK} stroke="rgba(255,255,255,0.12)" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="total"
                    name={t("cyclones.chart1_total")}
                    fill="rgba(0,180,204,0.4)"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="intense"
                    name={t("cyclones.chart1_intense")}
                    fill="#ff3b5c"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard
            title={t("cyclones.chart2_title")}
            desc={t("cyclones.chart2_desc")}
          >
            {(h) => (
              <ResponsiveContainer width="100%" height={h}>
                <AreaChart
                  data={byDecadeData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="vmaxGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#ff3b5c"
                        stopOpacity={0.45}
                      />
                      <stop offset="95%" stopColor="#ff3b5c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="decade"
                    tick={TICK}
                    stroke="rgba(255,255,255,0.12)"
                  />
                  <YAxis tick={TICK} stroke="rgba(255,255,255,0.12)" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="vmaxMax"
                    name="Vmax (m/s)"
                    stroke="#ff3b5c"
                    strokeWidth={2.5}
                    fill="url(#vmaxGrad)"
                    dot={{ fill: "#ff3b5c", r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard
            title={t("cyclones.chart3_title")}
            desc={t("cyclones.chart3_desc")}
          >
            {(h) => (
              <ResponsiveContainer width="100%" height={h}>
                <PieChart>
                  <Pie
                    data={byTypeData}
                    cx="50%"
                    cy="42%"
                    innerRadius={h * 0.17}
                    outerRadius={h * 0.3}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {byTypeData.map((e, i) => (
                      <Cell key={i} fill={TYPE_COLORS[e.name] || "#4a6a84"} />
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
            )}
          </ChartCard>

          <ChartCard
            title={t("cyclones.chart4_title")}
            desc={t("cyclones.chart4_desc")}
            wide
          >
            {(h) => (
              <ResponsiveContainer width="100%" height={h}>
                <ScatterChart
                  margin={{ top: 10, right: 20, left: -10, bottom: 24 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="x"
                    name="Pression min"
                    type="number"
                    domain={["auto", "auto"]}
                    tick={TICK}
                    stroke="rgba(255,255,255,0.12)"
                    label={{
                      value: "Pression min (hPa)",
                      position: "insideBottom",
                      offset: -12,
                      style: { ...TICK, fill: "var(--text-muted)" },
                    }}
                  />
                  <YAxis
                    dataKey="y"
                    name="Vmax"
                    type="number"
                    tick={TICK}
                    stroke="rgba(255,255,255,0.12)"
                    label={{
                      value: "Vent max (m/s)",
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
                          <div className="chart-tooltip__label">
                            {d.name} ({d.annee})
                          </div>
                          <div className="chart-tooltip__row">
                            <span className="chart-tooltip__name">
                              Pression
                            </span>
                            <span className="chart-tooltip__value">
                              {d.x} hPa
                            </span>
                          </div>
                          <div className="chart-tooltip__row">
                            <span className="chart-tooltip__name">
                              Vent max
                            </span>
                            <span className="chart-tooltip__value">
                              {d.y} m/s
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Scatter
                    data={scatterData}
                    fill="#00e6ff"
                    fillOpacity={0.55}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        <div className="cyclones-page__cta-block">
          <div className="cyclones-page__cta-text">
            <h2>{t("cyclones.cta_title")}</h2>
            <p>{t("cyclones.cta_body")}</p>
          </div>
          <Link to="/cyclones/map" className="cyclones-page__cta-btn">
            {t("cyclones.cta_btn")}
          </Link>
        </div>
      </div>
    </div>
  );
}
