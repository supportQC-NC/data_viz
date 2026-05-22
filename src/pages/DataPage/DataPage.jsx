// src/pages/DataPage/DataPage.jsx
// ============================================================
// DataPage v1.0 — Pacific Dataviz Challenge 2026
// Graphiques Recharts premium · Storytelling climatique
// Données mockées prêtes pour swap open-data
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ReferenceLine, Dot
} from 'recharts';
import './DataPage.scss';

// ═══════════════════════════════════════════════════════════
// DONNÉES MOCKÉES — Architecture data-ready
// Swap open-data NOAA/IPCC/JAXA sans refactorisation
// ═══════════════════════════════════════════════════════════

// Montée des eaux historique + projections
const SEA_LEVEL_FULL = [
  // Historique satellite (NOAA/NASA GMSL)
  { year: 1993, observed: 0,    ssp126: null,  ssp585: null,  extreme: null, source: 'obs' },
  { year: 1995, observed: 14,   ssp126: null,  ssp585: null,  extreme: null, source: 'obs' },
  { year: 1997, observed: 18,   ssp126: null,  ssp585: null,  extreme: null, source: 'obs' },
  { year: 2000, observed: 29,   ssp126: null,  ssp585: null,  extreme: null, source: 'obs' },
  { year: 2003, observed: 52,   ssp126: null,  ssp585: null,  extreme: null, source: 'obs' },
  { year: 2006, observed: 71,   ssp126: null,  ssp585: null,  extreme: null, source: 'obs' },
  { year: 2010, observed: 82,   ssp126: null,  ssp585: null,  extreme: null, source: 'obs' },
  { year: 2013, observed: 101,  ssp126: null,  ssp585: null,  extreme: null, source: 'obs' },
  { year: 2016, observed: 120,  ssp126: null,  ssp585: null,  extreme: null, source: 'obs' },
  { year: 2019, observed: 143,  ssp126: null,  ssp585: null,  extreme: null, source: 'obs' },
  { year: 2022, observed: 159,  ssp126: null,  ssp585: null,  extreme: null, source: 'obs' },
  { year: 2025, observed: 182,  ssp126: 182,   ssp585: 182,   extreme: 182,  source: 'both' },
  // Projections IPCC AR6
  { year: 2030, observed: null, ssp126: 212,   ssp585: 225,   extreme: 255,  source: 'proj' },
  { year: 2040, observed: null, ssp126: 255,   ssp585: 295,   extreme: 360,  source: 'proj' },
  { year: 2050, observed: null, ssp126: 305,   ssp585: 380,   extreme: 500,  source: 'proj' },
  { year: 2060, observed: null, ssp126: 348,   ssp585: 480,   extreme: 680,  source: 'proj' },
  { year: 2075, observed: null, ssp126: 408,   ssp585: 640,   extreme: 960,  source: 'proj' },
  { year: 2100, observed: null, ssp126: 480,   ssp585: 1000,  extreme: 2000, source: 'proj' },
  { year: 2150, observed: null, ssp126: 580,   ssp585: 1800,  extreme: 4500, source: 'proj' },
];

// Températures océaniques Pacifique
const OCEAN_TEMP_DATA = [
  { year: 1980, temp: 26.2, anomaly: -0.12, bleaching: 2 },
  { year: 1985, temp: 26.4, anomaly: 0.05,  bleaching: 3 },
  { year: 1990, temp: 26.6, anomaly: 0.22,  bleaching: 8 },
  { year: 1995, temp: 26.9, anomaly: 0.41,  bleaching: 15 },
  { year: 1998, temp: 27.6, anomaly: 0.85,  bleaching: 78 }, // El Niño majeur
  { year: 2000, temp: 27.0, anomaly: 0.48,  bleaching: 22 },
  { year: 2005, temp: 27.3, anomaly: 0.65,  bleaching: 35 },
  { year: 2010, temp: 27.5, anomaly: 0.78,  bleaching: 42 },
  { year: 2015, temp: 27.9, anomaly: 1.05,  bleaching: 68 }, // El Niño record
  { year: 2016, temp: 28.2, anomaly: 1.22,  bleaching: 91 },
  { year: 2020, temp: 28.1, anomaly: 1.18,  bleaching: 65 },
  { year: 2023, temp: 28.8, anomaly: 1.62,  bleaching: 88 },
  { year: 2025, temp: 29.1, anomaly: 1.84,  bleaching: 82 },
];

// Cyclones historiques Pacifique par décennie
const CYCLONE_DECADE_DATA = [
  { decade: '1980s', cat1: 42, cat2: 28, cat3: 19, cat4: 11, cat5: 3,  total: 103, damageB: 12 },
  { decade: '1990s', cat1: 45, cat2: 31, cat3: 22, cat4: 14, cat5: 5,  total: 117, damageB: 28 },
  { decade: '2000s', cat1: 48, cat2: 34, cat3: 26, cat4: 18, cat5: 8,  total: 134, damageB: 52 },
  { decade: '2010s', cat1: 44, cat2: 36, cat3: 29, cat4: 22, cat5: 12, total: 143, damageB: 89 },
  { decade: '2020s', cat1: 41, cat2: 35, cat3: 31, cat4: 25, cat5: 16, total: 148, damageB: 124 },
];

// Mangroves Pacifique par pays (Ha)
const MANGROVE_DATA = [
  { country: 'Indonésie',   flag: '🇮🇩', ha1990: 3100000, ha2020: 2950000, loss: 150000, health: 0.72, color: '#4CAF50' },
  { country: 'Fidji',       flag: '🇫🇯', ha1990: 47000,   ha2020: 42000,   loss: 5000,   health: 0.68, color: '#66BB6A' },
  { country: 'PNG',          flag: '🇵🇬', ha1990: 480000,  ha2020: 415000,  loss: 65000,  health: 0.61, color: '#81C784' },
  { country: 'N.-Calédonie', flag: '🇳🇨', ha1990: 25500,   ha2020: 21300,   loss: 4200,   health: 0.54, color: '#FFB74D' },
  { country: 'Vanuatu',     flag: '🇻🇺', ha1990: 6800,    ha2020: 5900,    loss: 900,    health: 0.65, color: '#FF8A65' },
  { country: 'Salomon',     flag: '🇸🇧', ha1990: 52000,   ha2020: 44000,   loss: 8000,   health: 0.58, color: '#FF7043' },
  { country: 'Tuvalu',      flag: '🇹🇻', ha1990: 280,     ha2020: 195,     loss: 85,     health: 0.31, color: '#EF5350' },
  { country: 'Kiribati',    flag: '🇰🇮', ha1990: 1200,    ha2020: 710,     loss: 490,    health: 0.28, color: '#E53935' },
];

// Radar vulnérabilité pays
const VULNERABILITY_RADAR = [
  {
    country: 'Tuvalu', flag: '🇹🇻', color: '#FF1744',
    data: [
      { axis: 'Élévation', val: 98 },
      { axis: 'Exposition', val: 95 },
      { axis: 'Économie', val: 88 },
      { axis: 'Infrastructure', val: 82 },
      { axis: 'Population', val: 62 },
      { axis: 'Mangroves', val: 55 },
    ],
  },
  {
    country: 'Kiribati', flag: '🇰🇮', color: '#FF6D00',
    data: [
      { axis: 'Élévation', val: 95 },
      { axis: 'Exposition', val: 90 },
      { axis: 'Économie', val: 85 },
      { axis: 'Infrastructure', val: 78 },
      { axis: 'Population', val: 72 },
      { axis: 'Mangroves', val: 48 },
    ],
  },
  {
    country: 'Vanuatu', flag: '🇻🇺', color: '#FFD740',
    data: [
      { axis: 'Élévation', val: 55 },
      { axis: 'Exposition', val: 88 },
      { axis: 'Économie', val: 72 },
      { axis: 'Infrastructure', val: 68 },
      { axis: 'Population', val: 60 },
      { axis: 'Mangroves', val: 72 },
    ],
  },
  {
    country: 'N.-Calédonie', flag: '🇳🇨', color: '#00E5FF',
    data: [
      { axis: 'Élévation', val: 32 },
      { axis: 'Exposition', val: 65 },
      { axis: 'Économie', val: 40 },
      { axis: 'Infrastructure', val: 38 },
      { axis: 'Population', val: 45 },
      { axis: 'Mangroves', val: 58 },
    ],
  },
];

// Population à risque par scénario
const POPULATION_RISK = [
  { scenario: 'Auj. 2025', rise: 0,    pop: 2,   color: '#00E5FF' },
  { scenario: '+30cm 2050', rise: 0.3,  pop: 70,  color: '#29B6F6' },
  { scenario: '+60cm 2075', rise: 0.6,  pop: 130, color: '#039BE5' },
  { scenario: '+1m 2100',   rise: 1.0,  pop: 190, color: '#FF9100' },
  { scenario: '+2m WAIS',   rise: 2.0,  pop: 340, color: '#FF5722' },
  { scenario: '+5m 2150',   rise: 5.0,  pop: 630, color: '#FF1744' },
  { scenario: '+12m 2300',  rise: 12.0, pop: 1100,color: '#B71C1C' },
];

// Scatter: corrélation temp / intensité cyclones
const CYCLONE_SCATTER = [
  { temp: 26.2, intensity: 85,  year: 1985, name: 'Uma',    cat: 4 },
  { temp: 26.5, intensity: 90,  year: 1988, name: 'Anne',   cat: 4 },
  { temp: 26.8, intensity: 95,  year: 1992, name: 'Betsy',  cat: 4 },
  { temp: 27.0, intensity: 100, year: 1996, name: 'Martin', cat: 4 },
  { temp: 27.6, intensity: 145, year: 1998, name: 'Zoe',    cat: 5 },
  { temp: 27.1, intensity: 98,  year: 2002, name: 'Ami',    cat: 4 },
  { temp: 27.3, intensity: 110, year: 2007, name: 'Xavier', cat: 5 },
  { temp: 27.5, intensity: 120, year: 2010, name: 'Tomas',  cat: 4 },
  { temp: 27.9, intensity: 165, year: 2015, name: 'Pam',    cat: 5 },
  { temp: 28.2, intensity: 180, year: 2016, name: 'Winston',cat: 5 },
  { temp: 28.0, intensity: 148, year: 2020, name: 'Harold', cat: 4 },
  { temp: 28.5, intensity: 172, year: 2022, name: 'Cody',   cat: 5 },
  { temp: 28.8, intensity: 185, year: 2023, name: 'Judy',   cat: 5 },
  { temp: 29.1, intensity: 192, year: 2025, name: 'Hina',   cat: 5 },
];

// ═══════════════════════════════════════════════════════════
// CUSTOM TOOLTIP COMPONENTS
// ═══════════════════════════════════════════════════════════

const CustomTooltipSeaLevel = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="dp-tooltip">
      <div className="dp-tooltip__year">{label}</div>
      {payload.map(p => p.value != null && (
        <div key={p.dataKey} className="dp-tooltip__row">
          <span className="dp-tooltip__dot" style={{ background: p.color }} />
          <span className="dp-tooltip__label">{p.name}</span>
          <span className="dp-tooltip__val" style={{ color: p.color }}>+{p.value} mm</span>
        </div>
      ))}
    </div>
  );
};

const CustomTooltipCyclone = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="dp-tooltip">
      <div className="dp-tooltip__year" style={{ color: '#FF6D00' }}>{d.name} ({d.year})</div>
      <div className="dp-tooltip__row">
        <span className="dp-tooltip__label">Temp. océan</span>
        <span className="dp-tooltip__val" style={{ color: '#FF9100' }}>{d.temp}°C</span>
      </div>
      <div className="dp-tooltip__row">
        <span className="dp-tooltip__label">Vents max</span>
        <span className="dp-tooltip__val" style={{ color: '#FF1744' }}>{d.intensity} kt</span>
      </div>
      <div className="dp-tooltip__row">
        <span className="dp-tooltip__label">Catégorie</span>
        <span className="dp-tooltip__val" style={{ color: '#FFD740' }}>CAT {d.cat}</span>
      </div>
    </div>
  );
};

const CustomTooltipMangrove = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="dp-tooltip">
      <div className="dp-tooltip__year">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="dp-tooltip__row">
          <span className="dp-tooltip__dot" style={{ background: p.color }} />
          <span className="dp-tooltip__label">{p.name}</span>
          <span className="dp-tooltip__val" style={{ color: p.color }}>
            {(p.value / 1000).toFixed(0)}k ha
          </span>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// ANIMATED COUNTER
// ═══════════════════════════════════════════════════════════

const AnimCounter = ({ target, suffix = '', prefix = '', decimals = 0, color, duration = 2000 }) => {
  const [val, setVal] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setVisible(true);
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || started.current) return;
    started.current = true;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible, target, duration]);

  return (
    <span ref={ref} style={{ color }}>
      {prefix}{decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString('fr-FR')}{suffix}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════
// SECTION HEADER
// ═══════════════════════════════════════════════════════════

const SectionHeader = ({ tag, title, sub, accent = '#00E5FF' }) => (
  <div className="dp-section-header">
    <div className="dp-section-tag" style={{ color: accent, borderColor: `${accent}40`, background: `${accent}10` }}>
      {tag}
    </div>
    <h2 className="dp-section-title">{title}</h2>
    {sub && <p className="dp-section-sub">{sub}</p>}
    <div className="dp-section-line" style={{ background: `linear-gradient(to right, ${accent}, transparent)` }} />
  </div>
);

// ═══════════════════════════════════════════════════════════
// CUSTOM DOT pour scatter
// ═══════════════════════════════════════════════════════════

const CycloneDot = (props) => {
  const { cx, cy, payload } = props;
  const colors = { 1: '#69F0AE', 2: '#FFD740', 3: '#FF9100', 4: '#FF5722', 5: '#FF1744' };
  const color = colors[payload.cat] || '#FF1744';
  const r = 4 + payload.cat * 1.5;
  return (
    <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity={0.85}
      stroke={color} strokeWidth={1.5} strokeOpacity={0.5} />
  );
};

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

const DataPage = () => {
  const navigate = useNavigate();
  const [activeRadar, setActiveRadar] = useState(0);
  const [activeYear, setActiveYear] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Préparer données mangroves pour BarChart
  const mangroveBarData = MANGROVE_DATA.map(d => ({
    country: d.country,
    '1990': d.ha1990,
    '2020': d.ha2020,
    perte: d.loss,
    health: Math.round(d.health * 100),
    color: d.color,
  }));

  // Préparer données radar actif
  const radarData = VULNERABILITY_RADAR[activeRadar].data;

  const gradientId = (name) => `grad-${name.replace(/\s/g, '-')}`;

  return (
    <div className="dp">

      {/* ══ HERO ═══════════════════════════════════════════ */}
      <section className="dp-hero" ref={heroRef}>
        <div className="dp-hero__bg" style={{ transform: `translateY(${scrollY * 0.35}px)` }} />
        <div className="dp-hero__noise" />

        <nav className="dp-nav">
          <button className="dp-nav__logo" onClick={() => navigate('/')}>
            <span className="dp-nav__logo-icon">🌊</span>
            <span>PacificShield</span>
          </button>
          <div className="dp-nav__links">
            <button onClick={() => navigate('/map')}>Carte</button>
            <button onClick={() => navigate('/about')}>À propos</button>
            <button className="dp-nav__active">Données</button>
            <button className="dp-nav__cta" onClick={() => navigate('/map')}>Explorer →</button>
          </div>
        </nav>

        <div className="dp-hero__content">
          <div className="dp-hero__eyebrow">
            <span className="dp-hero__dot" />
            Pacific Dataviz Challenge 2026
            <span className="dp-hero__sep">·</span>
            Analyse de données
          </div>

          <h1 className="dp-hero__title">
            <span>Les données</span>
            <span className="dp-hero__title-em">de la crise.</span>
          </h1>

          <p className="dp-hero__sub">
            182 mm de montée depuis 1993. 88 % des coraux blanchis.
            Cyclones × 1,8 plus intenses. Chaque graphique est un signal d'alarme.
          </p>

          {/* KPIs hero */}
          <div className="dp-hero__kpis">
            {[
              { v: 182, suffix: ' mm', label: 'montée depuis 1993', color: '#00E5FF', prefix: '+' },
              { v: 190, suffix: 'M',   label: 'pers. à risque à +1m', color: '#FF9100', prefix: '' },
              { v: 78,  suffix: '%',   label: 'mangroves perdues Pac.', color: '#4CAF50', prefix: '-' },
              { v: 5,   suffix: '×',   label: 'cyclones cat.5 en +', color: '#FF1744', prefix: '' },
            ].map(k => (
              <div key={k.label} className="dp-hero__kpi">
                <div className="dp-hero__kpi-val">
                  <AnimCounter target={k.v} suffix={k.suffix} prefix={k.prefix} color={k.color} />
                </div>
                <div className="dp-hero__kpi-label">{k.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="dp-hero__scroll">
          <div className="dp-hero__scroll-line" />
          <span>Scroll</span>
        </div>
      </section>

      {/* ══ CHART 1 — Sea Level Timeline ═══════════════════ */}
      <section className="dp-section dp-section--dark">
        <div className="dp-container">
          <SectionHeader
            tag="📈 Montée des eaux"
            title="182 mm depuis 1993. Et ça s'accélère."
            sub="Données observées NOAA/NASA (1993–2025) · Projections IPCC AR6 (2025–2150) · Trois scénarios d'émissions"
            accent="#00E5FF"
          />

          <div className="dp-chart-card dp-chart-card--xl">
            <div className="dp-chart-legend">
              {[
                { color: '#00E5FF', label: 'Observé (satellite)', dash: false },
                { color: '#69F0AE', label: 'SSP1-2.6 (optimiste)', dash: true },
                { color: '#FF9100', label: 'SSP5-8.5 (pessimiste)', dash: true },
                { color: '#FF1744', label: 'Extrême (WAIS)', dash: true },
              ].map(l => (
                <div key={l.label} className="dp-chart-legend__item">
                  <div className="dp-chart-legend__line" style={{
                    background: l.dash ? 'transparent' : l.color,
                    borderTop: l.dash ? `2px dashed ${l.color}` : 'none',
                  }} />
                  <span>{l.label}</span>
                </div>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={SEA_LEVEL_FULL} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradObs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00E5FF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradSSP126" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#69F0AE" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#69F0AE" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradSSP585" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF9100" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#FF9100" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradExtreme" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF1744" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#FF1744" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="year" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  tickFormatter={v => `+${v}mm`} />
                <Tooltip content={<CustomTooltipSeaLevel />} />
                <ReferenceLine x={2025} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4"
                  label={{ value: 'Auj.', fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />

                <Area type="monotone" dataKey="extreme" name="Extrême" stroke="#FF1744"
                  strokeWidth={1.5} strokeDasharray="6 3" fill="url(#gradExtreme)" dot={false} connectNulls />
                <Area type="monotone" dataKey="ssp585" name="SSP5-8.5" stroke="#FF9100"
                  strokeWidth={2} strokeDasharray="5 3" fill="url(#gradSSP585)" dot={false} connectNulls />
                <Area type="monotone" dataKey="ssp126" name="SSP1-2.6" stroke="#69F0AE"
                  strokeWidth={2} strokeDasharray="4 3" fill="url(#gradSSP126)" dot={false} connectNulls />
                <Area type="monotone" dataKey="observed" name="Observé" stroke="#00E5FF"
                  strokeWidth={2.5} fill="url(#gradObs)" dot={{ fill: '#00E5FF', r: 3, strokeWidth: 0 }} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>

            <div className="dp-chart-footnote">
              ⚡ 2025 : point de divergence — après ce point, les scénarios se séparent dramatiquement selon nos choix politiques
            </div>
          </div>

          {/* Insight box */}
          <div className="dp-insight">
            <div className="dp-insight__icon" style={{ color: '#00E5FF' }}>📊</div>
            <div>
              <div className="dp-insight__title">Accélération documentée</div>
              <div className="dp-insight__text">
                Le taux de montée est passé de <strong style={{ color: '#00E5FF' }}>2,1 mm/an</strong> dans les années 90
                à <strong style={{ color: '#FF9100' }}>5,8 mm/an</strong> en 2025.
                Une accélération de 176% en 30 ans, confirmée par 3 missions satellites indépendantes.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CHART 2 — Température + Blanchissement ══════════ */}
      <section className="dp-section">
        <div className="dp-container">
          <SectionHeader
            tag="🌡️ Température océanique"
            title="L'océan Pacifique brûle."
            sub="Anomalie de température de surface (SST) et blanchissement des coraux 1980–2025 · Sources : NOAA, GBRMPA"
            accent="#FF9100"
          />

          <div className="dp-chart-grid dp-chart-grid--2">
            {/* Area Chart - Température */}
            <div className="dp-chart-card">
              <div className="dp-chart-title">Température de surface (°C)</div>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={OCEAN_TEMP_DATA} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF9100" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#FF9100" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradAnomaly" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF1744" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#FF1744" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="year" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                  <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} domain={[25.5, 30]} />
                  <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(255,145,0,0.3)', borderRadius: 8 }}
                    labelStyle={{ color: '#FF9100' }} itemStyle={{ color: '#fff' }} />
                  <ReferenceLine y={27} stroke="rgba(255,145,0,0.3)" strokeDasharray="4 4"
                    label={{ value: 'Seuil blanchissement', fill: 'rgba(255,145,0,0.5)', fontSize: 10 }} />
                  <Area type="monotone" dataKey="temp" name="Temp. (°C)" stroke="#FF9100"
                    strokeWidth={2} fill="url(#gradTemp)" dot={{ fill: '#FF9100', r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart - Blanchissement */}
            <div className="dp-chart-card">
              <div className="dp-chart-title">Blanchissement des coraux (%)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={OCEAN_TEMP_DATA} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradBleach" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B35" stopOpacity={1} />
                      <stop offset="95%" stopColor="#FF1744" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="year" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                  <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                    tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(255,107,53,0.3)', borderRadius: 8 }}
                    labelStyle={{ color: '#FF6B35' }} itemStyle={{ color: '#fff' }}
                    formatter={v => [`${v}%`, 'Blanchissement']} />
                  <Bar dataKey="bleaching" name="Blanchissement" fill="url(#gradBleach)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alert box */}
          <div className="dp-alert">
            <div className="dp-alert__icon">🚨</div>
            <div className="dp-alert__content">
              <strong style={{ color: '#FF1744' }}>2023 — Année record :</strong> Le Pacifique a atteint
              29,1°C soit +1,84°C au-dessus des moyennes pré-industrielles. 88% des coraux de la Grande Barrière blanchis.
              Des événements qui survenaient tous les 25 ans se produisent désormais chaque 5 ans.
            </div>
          </div>
        </div>
      </section>

      {/* ══ CHART 3 — Cyclones ══════════════════════════════ */}
      <section className="dp-section dp-section--dark">
        <div className="dp-container">
          <SectionHeader
            tag="🌀 Cyclones historiques"
            title="Plus forts. Plus fréquents."
            sub="Intensité des cyclones Pacifique par décennie et corrélation avec la température océanique · IBTrACS NOAA"
            accent="#FF6D00"
          />

          <div className="dp-chart-grid dp-chart-grid--2">
            {/* Stacked Bar - Cyclones par catégorie */}
            <div className="dp-chart-card">
              <div className="dp-chart-title">Cyclones par catégorie et décennie</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={CYCLONE_DECADE_DATA} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="decade" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                  <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(255,109,0,0.3)', borderRadius: 8 }}
                    labelStyle={{ color: '#FF6D00' }} itemStyle={{ color: '#fff' }} />
                  <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                  <Bar dataKey="cat1" name="Cat.1" stackId="a" fill="#69F0AE" />
                  <Bar dataKey="cat2" name="Cat.2" stackId="a" fill="#FFD740" />
                  <Bar dataKey="cat3" name="Cat.3" stackId="a" fill="#FF9100" />
                  <Bar dataKey="cat4" name="Cat.4" stackId="a" fill="#FF5722" />
                  <Bar dataKey="cat5" name="Cat.5" stackId="a" fill="#FF1744" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Scatter - Corrélation temp/intensité */}
            <div className="dp-chart-card">
              <div className="dp-chart-title">Corrélation : Température → Intensité maximale</div>
              <div className="dp-scatter-legend">
                {[
                  { cat: 3, color: '#FF9100', label: 'Cat.3' },
                  { cat: 4, color: '#FF5722', label: 'Cat.4' },
                  { cat: 5, color: '#FF1744', label: 'Cat.5' },
                ].map(l => (
                  <div key={l.label} className="dp-scatter-legend__item">
                    <div className="dp-scatter-legend__dot" style={{ background: l.color,
                      width: 6 + l.cat * 2, height: 6 + l.cat * 2, borderRadius: '50%' }} />
                    <span>{l.label}</span>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={268}>
                <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="temp" name="Température" stroke="rgba(255,255,255,0.2)"
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                    tickFormatter={v => `${v}°C`} domain={[26, 29.5]} type="number" />
                  <YAxis dataKey="intensity" name="Vents max" stroke="rgba(255,255,255,0.2)"
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                    tickFormatter={v => `${v}kt`} domain={[80, 200]} />
                  <Tooltip content={<CustomTooltipCyclone />} />
                  <Scatter data={CYCLONE_SCATTER} shape={<CycloneDot />} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Dommages économiques */}
          <div className="dp-chart-card dp-chart-card--slim">
            <div className="dp-chart-title">Dommages économiques par décennie (Md USD)</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={CYCLONE_DECADE_DATA} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradDamage" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor="#FF6D00" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#FF1744" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                  tickFormatter={v => `${v}Md$`} />
                <YAxis type="category" dataKey="decade" stroke="rgba(255,255,255,0.2)"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} width={55} />
                <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(255,109,0,0.3)', borderRadius: 8 }}
                  formatter={v => [`${v} Md USD`, 'Dommages']} />
                <Bar dataKey="damageB" fill="url(#gradDamage)" radius={[0, 4, 4, 0]}
                  label={{ position: 'right', fill: 'rgba(255,255,255,0.6)', fontSize: 11, formatter: v => `${v}Md$` }} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="dp-insight" style={{ '--insight-color': '#FF6D00' }}>
            <div className="dp-insight__icon" style={{ color: '#FF6D00' }}>🌀</div>
            <div>
              <div className="dp-insight__title">Winston 2016 · Pam 2015 · Harold 2020</div>
              <div className="dp-insight__text">
                Les trois cyclones les plus destructeurs du Pacifique se sont tous produits <strong style={{ color: '#FF6D00' }}>
                après 2015</strong>. Winston reste le cyclone le plus intense jamais enregistré dans l'hémisphère Sud,
                avec des vents de <strong style={{ color: '#FF1744' }}>295 km/h</strong> et une pression minimale de 884 hPa.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CHART 4 — Mangroves ═════════════════════════════ */}
      <section className="dp-section">
        <div className="dp-container">
          <SectionHeader
            tag="🌿 Mangroves"
            title="40% perdues. Et chaque hectare compte."
            sub="Évolution des surfaces de mangroves 1990–2020 dans le Pacifique · Source : JAXA Global Mangrove Watch"
            accent="#4CAF50"
          />

          <div className="dp-chart-card dp-chart-card--xl">
            <div className="dp-chart-title">Surface de mangroves par pays (hectares) — 1990 vs 2020</div>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={mangroveBarData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad1990" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#1B5E20" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="grad2020" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF9100" stopOpacity={0.85} />
                    <stop offset="95%" stopColor="#E65100" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="country" stroke="rgba(255,255,255,0.2)"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip content={<CustomTooltipMangrove />} />
                <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                <Bar dataKey="1990" name="Surface 1990" fill="url(#grad1990)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="2020" name="Surface 2020" fill="url(#grad2020)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Barres de santé */}
          <div className="dp-health-grid">
            <div className="dp-health-title">Indice de santé des mangroves 2025</div>
            <div className="dp-health-bars">
              {MANGROVE_DATA.map(d => (
                <div key={d.country} className="dp-health-item">
                  <div className="dp-health-name">{d.flag} {d.country}</div>
                  <div className="dp-health-track">
                    <div className="dp-health-fill" style={{
                      width: `${d.health * 100}%`,
                      background: d.health > 0.65 ? '#4CAF50' : d.health > 0.45 ? '#FF9100' : '#FF1744',
                    }} />
                  </div>
                  <div className="dp-health-val" style={{
                    color: d.health > 0.65 ? '#4CAF50' : d.health > 0.45 ? '#FF9100' : '#FF1744',
                  }}>
                    {Math.round(d.health * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ CHART 5 — Vulnérabilité Radar ══════════════════ */}
      <section className="dp-section dp-section--dark">
        <div className="dp-container">
          <SectionHeader
            tag="🗺️ Vulnérabilité"
            title="Qui est le plus exposé ?"
            sub="Indice de vulnérabilité climatique multidimensionnel — Élévation, exposition aux cyclones, économie, infrastructure"
            accent="#FF5252"
          />

          <div className="dp-radar-wrap">
            {/* Selector */}
            <div className="dp-radar-selector">
              {VULNERABILITY_RADAR.map((r, i) => (
                <button key={r.country}
                  className={`dp-radar-btn ${activeRadar === i ? 'dp-radar-btn--active' : ''}`}
                  style={activeRadar === i ? { borderColor: r.color, color: r.color, background: `${r.color}15` } : {}}
                  onClick={() => setActiveRadar(i)}>
                  {r.flag} {r.country}
                </button>
              ))}
            </div>

            <div className="dp-chart-grid dp-chart-grid--radar">
              <div className="dp-chart-card dp-chart-card--radar">
                <div className="dp-chart-title" style={{ color: VULNERABILITY_RADAR[activeRadar].color }}>
                  {VULNERABILITY_RADAR[activeRadar].flag} {VULNERABILITY_RADAR[activeRadar].country} — Profil de vulnérabilité
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="axis"
                      tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar dataKey="val" name={VULNERABILITY_RADAR[activeRadar].country}
                      stroke={VULNERABILITY_RADAR[activeRadar].color}
                      fill={VULNERABILITY_RADAR[activeRadar].color} fillOpacity={0.25}
                      strokeWidth={2.5} dot={{ fill: VULNERABILITY_RADAR[activeRadar].color, r: 4 }} />
                    <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                      labelStyle={{ color: '#fff' }} itemStyle={{ color: VULNERABILITY_RADAR[activeRadar].color }}
                      formatter={v => [`${v}/100`, 'Vulnérabilité']} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Stats comparatives */}
              <div className="dp-vuln-stats">
                {VULNERABILITY_RADAR.map((r, i) => {
                  const avg = Math.round(r.data.reduce((s, d) => s + d.val, 0) / r.data.length);
                  return (
                    <div key={r.country}
                      className={`dp-vuln-stat ${i === activeRadar ? 'dp-vuln-stat--active' : ''}`}
                      style={{ borderColor: `${r.color}30`, '--vc': r.color }}
                      onClick={() => setActiveRadar(i)}>
                      <div className="dp-vuln-flag">{r.flag}</div>
                      <div className="dp-vuln-name">{r.country}</div>
                      <div className="dp-vuln-score" style={{ color: r.color }}>{avg}/100</div>
                      <div className="dp-vuln-bar">
                        <div className="dp-vuln-fill" style={{ width: `${avg}%`, background: r.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CHART 6 — Population à risque ══════════════════ */}
      <section className="dp-section">
        <div className="dp-container">
          <SectionHeader
            tag="👥 Impact humain"
            title="Jusqu'à 1,1 milliard de personnes."
            sub="Estimation des populations à risque de submersion selon le scénario de montée des eaux · Sources : CoastalDEM, SEDAC"
            accent="#FF9100"
          />

          <div className="dp-chart-card dp-chart-card--xl">
            <div className="dp-chart-title">Population mondiale à risque de submersion (millions)</div>
            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart data={POPULATION_RISK} margin={{ top: 20, right: 40, left: 20, bottom: 10 }}>
                <defs>
                  <linearGradient id="gradPop" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#00E5FF" stopOpacity={0.9} />
                    <stop offset="50%" stopColor="#FF9100" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#FF1744" stopOpacity={0.9} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="scenario" stroke="rgba(255,255,255,0.2)"
                  tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10 }} angle={-12} textAnchor="end" height={45} />
                <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                  tickFormatter={v => `${v}M`} />
                <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(255,145,0,0.3)', borderRadius: 8 }}
                  labelStyle={{ color: '#FF9100' }} itemStyle={{ color: '#fff' }}
                  formatter={v => [`${v} millions`, 'Population à risque']} />
                <Bar dataKey="pop" name="Population" fill="url(#gradPop)" radius={[6, 6, 0, 0]}
                  label={{ position: 'top', fill: 'rgba(255,255,255,0.5)', fontSize: 11, formatter: v => `${v}M` }} />
                <Line type="monotone" dataKey="pop" stroke="#FF1744" strokeWidth={2}
                  dot={{ fill: '#FF1744', r: 4 }} strokeDasharray="0" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Compteurs dramatiques */}
          <div className="dp-drama-grid">
            {[
              { val: 190, unit: 'millions', desc: 'à risque dès +1m', sub: '2100 scénario pessimiste', color: '#FF9100' },
              { val: 1100, unit: 'millions', desc: 'à risque à +12m', sub: '2300 fonte Groenland', color: '#FF1744' },
              { val: 5, unit: 'nations', desc: 'sous le niveau de la mer', sub: 'à +1m de montée', color: '#FF5252' },
              { val: 14, unit: 'mégapoles', desc: 'partiellement submergées', sub: "si Antarctique s'effondre", color: '#FF3D00' },
            ].map(d => (
              <div key={d.desc} className="dp-drama-card" style={{ '--dc': d.color, borderColor: `${d.color}25` }}>
                <div className="dp-drama-val">
                  <AnimCounter target={d.val} color={d.color} />
                </div>
                <div className="dp-drama-unit" style={{ color: d.color }}>{d.unit}</div>
                <div className="dp-drama-desc">{d.desc}</div>
                <div className="dp-drama-sub">{d.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SECTION DATA SOURCES ════════════════════════════ */}
      <section className="dp-section dp-section--dark dp-section--sources">
        <div className="dp-container">
          <SectionHeader
            tag="🔬 Sources"
            title="Science ouverte & données satellites."
            sub="Architecture data-ready — swap open-data NOAA/JAXA/IPCC sans refactorisation"
            accent="#69F0AE"
          />

          <div className="dp-sources-grid">
            {[
              { icon: '🛰️', name: 'NASA GSFC', desc: 'Global Mean Sea Level (GMSL)', tag: 'Satellites altimètre', color: '#40C4FF' },
              { icon: '🌊', name: 'NOAA CO-OPS', desc: 'Tide Gauges API temps réel', tag: 'Marégraphes', color: '#00E5FF' },
              { icon: '📊', name: 'IPCC AR6', desc: 'Projections SSP1-2.6 / SSP5-8.5', tag: 'Science du climat', color: '#69F0AE' },
              { icon: '🌿', name: 'JAXA GMW', desc: 'Global Mangrove Watch v3.0', tag: 'Télédétection', color: '#4CAF50' },
              { icon: '🌀', name: 'IBTrACS', desc: 'Best Track Cyclone Database', tag: 'NOAA', color: '#FF9100' },
              { icon: '👥', name: 'CoastalDEM', desc: 'Population at risk model', tag: 'SEDAC NASA', color: '#FF5252' },
              { icon: '🪸', name: 'GBRMPA', desc: 'Coral reef bleaching index', tag: 'Australie', color: '#FF6B35' },
              { icon: '🗺️', name: 'SPREP', desc: 'Pacific regional env. data', tag: 'Samoa', color: '#FFD740' },
            ].map(s => (
              <div key={s.name} className="dp-source-card" style={{ borderColor: `${s.color}20`, '--sc': s.color }}>
                <div className="dp-source-icon" style={{ color: s.color }}>{s.icon}</div>
                <div className="dp-source-name" style={{ color: s.color }}>{s.name}</div>
                <div className="dp-source-desc">{s.desc}</div>
                <div className="dp-source-tag" style={{ background: `${s.color}15`, color: s.color }}>{s.tag}</div>
              </div>
            ))}
          </div>

          <div className="dp-arch-note">
            <div className="dp-arch-icon">⚙️</div>
            <div>
              <div className="dp-arch-title">Architecture data-ready</div>
              <div className="dp-arch-desc">
                Toutes les données sont encapsulées en interfaces standardisées dans <code>seaLevelData.js</code>.
                L'intégration des datasets officiels du Pacific Dataviz Challenge 2026 ne nécessitera
                qu'un swap de fichier — aucune refactorisation des composants de visualisation.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA FINAL ═══════════════════════════════════════ */}
      <section className="dp-cta">
        <div className="dp-cta__glow" />
        <div className="dp-cta__content">
          <h2 className="dp-cta__title">Voyez-le sur la carte.</h2>
          <p className="dp-cta__sub">
            Ces chiffres deviennent réels quand on les superpose aux côtes du Pacifique.
            Simulez la montée des eaux sur Nouméa, Tuvalu, Fidji.
          </p>
          <div className="dp-cta__btns">
            <button className="dp-cta__btn dp-cta__btn--primary" onClick={() => navigate('/map')}>
              <span>🌊</span> Explorer la carte
            </button>
            <button className="dp-cta__btn dp-cta__btn--secondary" onClick={() => navigate('/about')}>
              Notre approche →
            </button>
          </div>
        </div>
        <footer className="dp-footer">
          <div className="dp-footer__logo">🌊 PacificShield</div>
          <div className="dp-footer__links">
            <button onClick={() => navigate('/map')}>Carte</button>
            <button onClick={() => navigate('/about')}>À propos</button>
            <button onClick={() => navigate('/')}>Accueil</button>
          </div>
          <div className="dp-footer__credits">
            Pacific Dataviz Challenge 2026 · NOAA · NASA · JAXA · SPREP · IPCC AR6 · CC BY 4.0
          </div>
        </footer>
      </section>

    </div>
  );
};

export default DataPage;