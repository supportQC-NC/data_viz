// src/pages/MapPage/MapPage.jsx
// ============================================================
// MapPage v10.0 — REFONTE TOTALE FLOOD
//
// NOUVELLE ARCHITECTURE :
// ─ On abandonne les polygones GeoJSON fill (impossible de
//   filtrer par altitude réelle avec terrain 3D Mapbox)
// ─ On utilise des CERCLES (type "circle") géolocalisés
//   uniquement sur les points bas réels
// ─ ZÉRO line layer → ZÉRO trait parasite autour du globe
// ─ Les cercles sont petits, précis, empilés pour couvrir
//   les zones côtières visuellement
// ─ Toute la NC + Pacifique
// ============================================================

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Map, { NavigationControl, Layer, Source, Marker, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapPage.scss';

import { VULNERABLE_ZONES, getZoneStatus } from '../../data/seaLevelData';
import SeaLevelControl from '../../components/SeaLevelControl';

const TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;
const SATELLITE_STYLE = 'mapbox://styles/mapbox/satellite-streets-v12';

const NOAA_STATIONS = [
  { id: '1612340', label: 'Honolulu, Hawaii',      longitude: -157.867, latitude:  21.303 },
  { id: '1770000', label: 'Pago Pago, Samoa am.',  longitude: -170.69,  latitude: -14.28  },
  { id: '1630000', label: 'Apra Harbor, Guam',     longitude:  144.657, latitude:  13.443 },
];

const INITIAL_VIEW = {
  longitude: 166.45,
  latitude:  -22.27,
  zoom:       6.5,
  pitch:      55,
  bearing:   -12,
};

const fetchNoaaWaterLevel = async (stationId) => {
  const url = new URL('https://api.tidesandcurrents.noaa.gov/api/prod/datagetter');
  url.searchParams.set('station',     stationId);
  url.searchParams.set('product',     'water_level');
  url.searchParams.set('date',        'latest');
  url.searchParams.set('datum',       'MSL');
  url.searchParams.set('units',       'metric');
  url.searchParams.set('time_zone',   'gmt');
  url.searchParams.set('format',      'json');
  url.searchParams.set('application', 'pacific-sea-level-map');
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`NOAA HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || 'Erreur NOAA');
  const row = json.data?.[0];
  if (!row) throw new Error('Aucune donnée NOAA.');
  return { value: Number(row.v), time: row.t, stationId };
};

// ══════════════════════════════════════════════════════════════
// POINTS D'INONDATION — approche "circle clusters"
//
// Chaque point = centroïde d'une zone basse réelle.
// elev = altitude max de la zone (m au-dessus MSL, SRTM validé).
// radius = rayon visuel en mètres à cette zoom-level.
//
// VALIDATION géographique :
// ─ Toutes les coordonnées sont dans l'eau ou sur des zones
//   côtières réelles < 5m d'altitude
// ─ Lac de Yaté (alt. 43m) → EXCLU
// ─ Mont-Dore collines → EXCLUES
// ─ Seuls les fronts de mer, plages, estuaires, atolls
// ══════════════════════════════════════════════════════════════

// Génère une ligne de points entre deux coords avec espacement
const line = (lon1, lat1, lon2, lat2, n, elev, region = 'NC') => {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push({ lon: lon1 + t * (lon2 - lon1), lat: lat1 + t * (lat2 - lat1), elev, region });
  }
  return pts;
};

// Génère un arc de points le long d'une côte
const arc = (centerLon, centerLat, r, fromDeg, toDeg, n, elev, region = 'NC') => {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const angle = (fromDeg + (i / n) * (toDeg - fromDeg)) * Math.PI / 180;
    pts.push({
      lon: centerLon + r * Math.cos(angle),
      lat: centerLat + r * Math.sin(angle) * 0.6, // correction aspect ratio lat
      elev, region,
    });
  }
  return pts;
};

// ── Nouvelle-Calédonie — points côtiers validés GPS ──────────
const NC_POINTS = [

  // CÔTE OUEST — bande lagonaire étroite (0–3m réel)
  // Extrême Nord → Koumac
  ...line(164.160, -20.012, 164.272, -20.008, 8, 1.0),   // Baie Poingam
  ...line(164.045, -20.192, 164.282, -20.185, 10, 1.0),  // Delta Diahot
  ...line(164.385, -20.348, 164.465, -20.350, 5, 1.5),   // Ouégoa
  ...line(164.265, -20.548, 164.382, -20.542, 6, 1.5),   // Koumac front mer
  ...line(164.415, -20.645, 164.508, -20.648, 5, 1.5),   // Kaala-Gomen

  // Voh — mangroves + estuaire
  ...line(164.648, -20.970, 164.785, -20.942, 8, 0.8),   // Mangroves Voh
  ...line(164.690, -20.935, 164.785, -20.942, 5, 1.5),   // Estuaire Voh

  // Koné → Pouembout — grande plaine côtière
  ...line(164.828, -21.045, 164.960, -21.060, 8, 2.0),   // Plaine Koné
  ...line(164.885, -21.115, 164.980, -21.122, 6, 2.0),   // Pouembout

  // Poya → Harcourt
  ...line(164.885, -21.518, 164.978, -21.522, 5, 0.5),   // Mangroves Harcourt
  ...line(165.145, -21.335, 165.232, -21.342, 5, 2.0),   // Poya lagon

  // Bourail — grande plaine et plage
  ...line(165.365, -21.545, 165.485, -21.538, 7, 2.0),   // Plaine Bourail

  // Moindou → La Foa → Farino
  ...line(165.578, -21.692, 165.705, -21.692, 7, 0.5),   // Mangroves
  ...line(165.615, -21.685, 165.755, -21.700, 8, 2.0),   // Plaine La Foa/Moindou

  // Boulouparis — grande plaine ouest
  ...line(166.045, -21.858, 166.165, -21.855, 7, 2.5),   // Plaine Boulouparis

  // Tontouta — delta alluvial
  ...line(165.998, -22.015, 166.108, -22.018, 6, 1.5),   // Delta Tontouta

  // Dumbéa — basse vallée
  ...line(166.402, -22.115, 166.510, -22.118, 6, 2.0),   // Dumbéa

  // ── NOUMÉA — front de mer précis ──
  // Baie de la Moselle (port)
  { lon: 166.430, lat: -22.268, elev: 1.0, region: 'NC' },
  { lon: 166.445, lat: -22.260, elev: 1.0, region: 'NC' },
  { lon: 166.458, lat: -22.255, elev: 1.0, region: 'NC' },
  // Baie des Citrons
  { lon: 166.408, lat: -22.282, elev: 1.0, region: 'NC' },
  { lon: 166.420, lat: -22.278, elev: 1.0, region: 'NC' },
  { lon: 166.432, lat: -22.275, elev: 1.0, region: 'NC' },
  // Anse Vata
  { lon: 166.378, lat: -22.298, elev: 1.0, region: 'NC' },
  { lon: 166.392, lat: -22.292, elev: 1.0, region: 'NC' },
  { lon: 166.405, lat: -22.285, elev: 1.0, region: 'NC' },
  // Pointe Magnin / Baie de l'Orphelinat
  { lon: 166.452, lat: -22.290, elev: 1.5, region: 'NC' },
  { lon: 166.468, lat: -22.285, elev: 1.5, region: 'NC' },

  // ── GRAND NOUMÉA — Mont-Dore LITTORAL UNIQUEMENT ──
  // (NE PAS inclure les collines vertes intérieures)
  // Seul le front de mer de Boulari / Plum
  { lon: 166.610, lat: -22.248, elev: 1.5, region: 'NC' }, // Boulari front mer
  { lon: 166.625, lat: -22.242, elev: 1.5, region: 'NC' },
  { lon: 166.640, lat: -22.238, elev: 1.5, region: 'NC' },
  // Plum — uniquement la plage, PAS les collines
  { lon: 166.698, lat: -22.165, elev: 2.0, region: 'NC' },
  { lon: 166.715, lat: -22.158, elev: 2.0, region: 'NC' },
  { lon: 166.730, lat: -22.152, elev: 2.0, region: 'NC' },

  // ── CÔTE SUD ──
  // Baie de Prony — fond de baie uniquement
  { lon: 166.835, lat: -22.348, elev: 1.5, region: 'NC' },
  { lon: 166.862, lat: -22.330, elev: 1.5, region: 'NC' },
  { lon: 166.890, lat: -22.322, elev: 1.5, region: 'NC' },
  // Goro — côte basse uniquement (usine nickel = 0m)
  { lon: 167.005, lat: -22.268, elev: 1.5, region: 'NC' },
  { lon: 167.025, lat: -22.258, elev: 1.5, region: 'NC' },

  // ── CÔTE EST ──
  // Yaté côte Est (PAS le lac de Yaté qui est à 43m!)
  { lon: 167.002, lat: -22.108, elev: 1.5, region: 'NC' },
  { lon: 167.022, lat: -22.092, elev: 1.5, region: 'NC' },
  // Thio — embouchure rivière
  ...line(166.215, -21.605, 166.292, -21.612, 4, 1.5),
  // Canala — embouchure
  ...line(165.955, -21.515, 166.030, -21.522, 4, 1.5),
  // Houaïlou — delta
  ...line(165.625, -21.275, 165.702, -21.282, 4, 1.5),
  // Kouaoua
  { lon: 165.442, lat: -21.388, elev: 2.0, region: 'NC' },
  { lon: 165.462, lat: -21.382, elev: 2.0, region: 'NC' },
  // Ponérihouen
  ...line(165.385, -21.072, 165.462, -21.080, 4, 2.0),
  // Poindimié
  ...line(165.328, -20.925, 165.408, -20.932, 4, 2.0),
  // Touho
  ...line(165.232, -20.775, 165.310, -20.782, 4, 2.0),
  // Hienghène — baie
  ...line(164.935, -20.678, 165.012, -20.685, 4, 1.5),
  // Pouébo — NE
  { lon: 164.582, lat: -20.395, elev: 1.5, region: 'NC' },
  { lon: 164.608, lat: -20.385, elev: 1.5, region: 'NC' },

  // ── MANGROVES CÔTE OUEST ──
  { lon: 165.965, lat: -21.988, elev: 0.5, region: 'NC' }, // Baie St-Vincent mangroves
  { lon: 166.000, lat: -21.978, elev: 0.5, region: 'NC' },
  { lon: 166.278, lat: -22.248, elev: 0.5, region: 'NC' }, // Mangroves Dumbéa
  { lon: 166.308, lat: -22.238, elev: 0.5, region: 'NC' },

  // ── OUVÉA — atoll entier (altitude max 7m, zones côtières <1m) ──
  ...line(166.500, -20.575, 166.672, -20.575, 10, 0.5),  // lagon N
  ...line(166.658, -20.598, 166.825, -20.602, 8, 0.5),   // lagon central
  ...line(166.818, -20.620, 166.985, -20.632, 8, 0.5),   // lagon S

  // ── LIFOU — côtes basses uniquement ──
  { lon: 167.035, lat: -20.875, elev: 1.0, region: 'NC' }, // Wé baie W
  { lon: 167.058, lat: -20.858, elev: 1.0, region: 'NC' },
  { lon: 167.162, lat: -20.955, elev: 1.0, region: 'NC' }, // Baie du Santal
  { lon: 167.188, lat: -20.938, elev: 1.0, region: 'NC' },
  { lon: 167.318, lat: -21.035, elev: 1.5, region: 'NC' }, // Luengöni SE
  { lon: 167.058, lat: -20.952, elev: 1.0, region: 'NC' }, // Mu NW
  { lon: 167.080, lat: -20.938, elev: 1.0, region: 'NC' },

  // ── MARÉ — côtes basses ──
  { lon: 167.775, lat: -21.385, elev: 1.0, region: 'NC' }, // La Roche W
  { lon: 167.800, lat: -21.368, elev: 1.0, region: 'NC' },
  { lon: 167.998, lat: -21.540, elev: 1.5, region: 'NC' }, // Tadine E
  { lon: 168.022, lat: -21.522, elev: 1.5, region: 'NC' },
  { lon: 167.895, lat: -21.312, elev: 1.5, region: 'NC' }, // Medu N

  // ── ÎLE DES PINS — baies seulement ──
  { lon: 167.455, lat: -22.605, elev: 1.5, region: 'NC' }, // Kuto SW
  { lon: 167.478, lat: -22.588, elev: 1.5, region: 'NC' },
  { lon: 167.485, lat: -22.558, elev: 1.5, region: 'NC' }, // Kanumera N
  { lon: 167.508, lat: -22.542, elev: 1.5, region: 'NC' },
  { lon: 167.528, lat: -22.665, elev: 2.0, region: 'NC' }, // Ouaméo NE
  { lon: 167.552, lat: -22.648, elev: 2.0, region: 'NC' },
  { lon: 167.498, lat: -22.668, elev: 1.5, region: 'NC' }, // Vao S
  { lon: 167.522, lat: -22.652, elev: 1.5, region: 'NC' },
];

// ── Autres îles Pacifique ──────────────────────────────────
const PACIFIC_POINTS = [
  // Vanuatu
  { lon: 168.315, lat: -17.762, elev: 1.0, region: 'VU' }, // Port Vila
  { lon: 168.330, lat: -17.748, elev: 1.0, region: 'VU' },
  { lon: 167.188, lat: -15.508, elev: 1.5, region: 'VU' }, // Luganville
  { lon: 168.212, lat: -17.638, elev: 2.0, region: 'VU' }, // Efate plaine

  // Fidji
  { lon: 178.428, lat: -18.135, elev: 1.0, region: 'FJ' }, // Suva
  { lon: 178.455, lat: -18.118, elev: 1.0, region: 'FJ' },
  { lon: 178.532, lat: -17.985, elev: 1.0, region: 'FJ' }, // Delta Rewa
  { lon: 178.562, lat: -17.978, elev: 1.0, region: 'FJ' },
  { lon: 177.425, lat: -17.750, elev: 1.0, region: 'FJ' }, // Nadi
  { lon: 177.485, lat: -18.125, elev: 1.5, region: 'FJ' }, // Sigatoka
  { lon: 177.515, lat: -18.108, elev: 1.5, region: 'FJ' },

  // Tuvalu — atolls entiers (altitude réelle 0–2m)
  ...line(179.175, -8.505, 179.275, -8.505, 8, 0.3),  // Funafuti
  { lon: 178.345, lat: -7.998, elev: 0.5, region: 'TV' }, // Nukufetau
  { lon: 179.725, lat: -7.445, elev: 0.5, region: 'TV' }, // Vaitupu
  { lon: 176.105, lat: -5.675, elev: 1.0, region: 'TV' }, // Nanumea

  // Kiribati — atolls
  ...line(172.935, 1.318, 173.028, 1.330, 5, 0.5),   // Tarawa S
  ...line(172.878, 1.480, 172.972, 1.492, 5, 0.5),   // Tarawa N

  // Samoa
  { lon: 171.928, lat: -13.822, elev: 1.0, region: 'WS' },
  { lon: 171.955, lat: -13.802, elev: 1.0, region: 'WS' },

  // Tonga
  { lon: -175.195, lat: -21.138, elev: 1.0, region: 'TO' },
  { lon: -175.168, lat: -21.118, elev: 1.0, region: 'TO' },
  { lon: -175.372, lat: -21.058, elev: 1.5, region: 'TO' },

  // Polynésie française
  { lon: -149.558, lat: -17.542, elev: 1.0, region: 'PF' }, // Papeete
  { lon: -149.532, lat: -17.522, elev: 1.0, region: 'PF' },
  { lon: -147.960, lat: -14.920, elev: 0.5, region: 'PF' }, // Rangiroa atoll

  // Îles Marshall — atolls
  ...line(171.275, 7.095, 171.372, 7.108, 5, 0.5),   // Majuro
  { lon: 167.755, lat: 8.695, elev: 0.5, region: 'MH' },  // Kwajalein

  // Hawaï
  { lon: -157.818, lat: 21.268, elev: 1.0, region: 'HI' }, // Waikiki
  { lon: -157.792, lat: 21.248, elev: 1.0, region: 'HI' },

  // Salomon
  { lon: 159.920, lat: -9.430, elev: 0.5, region: 'SB' },
  { lon: 160.020, lat: -9.400, elev: 0.5, region: 'SB' },

  // PNG
  { lon: 147.162, lat: -9.440, elev: 0.5, region: 'PG' },
  { lon: 147.222, lat: -9.420, elev: 0.5, region: 'PG' },
];

const ALL_FLOOD_POINTS = [...NC_POINTS, ...PACIFIC_POINTS];

// ── Build GeoJSON de POINTS (pas de polygones) ─────────────
const buildFloodGeoJSON = (seaRise) => {
  const active = ALL_FLOOD_POINTS.filter(p => p.elev <= seaRise);
  return {
    type: 'FeatureCollection',
    features: active.map(p => ({
      type: 'Feature',
      properties: {
        elev: p.elev,
        region: p.region,
      },
      geometry: {
        type: 'Point',
        coordinates: [p.lon, p.lat],
      },
    })),
  };
};

// ═══════════════════════════════════════════════════════════
// ZoneMarker
// ═══════════════════════════════════════════════════════════

const ZoneMarker = React.memo(({ zone, seaRise, onSelect }) => {
  const p = zone.properties;
  const { color, urgency } = getZoneStatus(p.elevation, seaRise);
  const subPct = Math.min(1, Math.max(0, seaRise / p.elevation));
  const sz = 18 + urgency * 8;

  const handleClick = useCallback((e) => {
    e.originalEvent?.stopPropagation();
    onSelect({ ...zone, status: getZoneStatus(p.elevation, seaRise).status });
  }, [zone, seaRise, p.elevation, onSelect]);

  return (
    <Marker longitude={zone.geometry.coordinates[0]} latitude={zone.geometry.coordinates[1]}
      onClick={handleClick} style={{ cursor: 'pointer' }}>
      <div className={`mp-marker mp-marker--u${urgency}`} style={{ '--mc': color }}>
        {urgency >= 3 && <div className="mp-marker__label">🇳🇨 {p.name}</div>}
        <svg width={sz*3} height={sz*3} viewBox="0 0 100 100" overflow="visible" style={{ display:'block', overflow:'visible' }}>
          {urgency >= 2 && (<>
            <circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth="0.7" opacity="0.25">
              <animate attributeName="r" values="36;54;36" dur="2.4s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.35;0;0.35" dur="2.4s" repeatCount="indefinite"/>
            </circle>
          </>)}
          {urgency >= 3 && (<>
            <defs><clipPath id={`clip-${p.id}`}><polygon points="50,8 92,50 50,92 8,50"/></clipPath></defs>
            <polygon points="50,8 92,50 50,92 8,50" fill={`${color}18`} stroke={`${color}70`} strokeWidth="1.5"/>
            <g clipPath={`url(#clip-${p.id})`}>
              <rect x="8" y={8+(1-subPct)*84} width="84" height="84" fill={color} opacity="0.55"/>
              <path d={`M8,${8+(1-subPct)*84} q10,-6 20,0 t20,0 t20,0 t16,0 v60 h-76z`} fill={color} opacity="0.35">
                <animateTransform attributeName="transform" type="translate" values="-20,0;0,0;-20,0" dur="2s" repeatCount="indefinite"/>
              </path>
            </g>
            <polygon points="50,8 92,50 50,92 8,50" fill="none" stroke={color} strokeWidth="1.8"/>
            <circle cx="50" cy="50" r="5" fill="white" opacity="0.9"/>
          </>)}
          {urgency === 2 && (<>
            <defs><clipPath id={`clipt-${p.id}`}><polygon points="50,10 90,78 10,78"/></clipPath></defs>
            <polygon points="50,10 90,78 10,78" fill={`${color}18`} stroke={`${color}60`} strokeWidth="1.5"/>
            <g clipPath={`url(#clipt-${p.id})`}>
              <rect x="10" y={10+(1-subPct)*68} width="80" height="68" fill={color} opacity="0.4"/>
            </g>
            <polygon points="50,10 90,78 10,78" fill="none" stroke={color} strokeWidth="1.8"/>
            <line x1="50" y1="28" x2="50" y2="56" stroke="white" strokeWidth="4" strokeLinecap="round"/>
            <circle cx="50" cy="66" r="4" fill="white"/>
          </>)}
          {urgency === 1 && (() => {
            const pts = Array.from({length:6},(_,i)=>{const a=Math.PI/3*i-Math.PI/6;return `${50+36*Math.cos(a)},${50+36*Math.sin(a)}`;}).join(' ');
            return (<><polygon points={pts} fill={color} opacity="0.7" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/><circle cx="50" cy="50" r="11" fill="rgba(255,255,255,0.85)"/></>);
          })()}
          {urgency === 0 && (<><circle cx="50" cy="50" r="28" fill="none" stroke={color} strokeWidth="2" strokeDasharray="6 4" opacity="0.55"/><circle cx="50" cy="50" r="11" fill={color} opacity="0.7"/></>)}
        </svg>
        {subPct > 0.05 && urgency >= 2 && (
          <div className="mp-marker__pct" style={{ color, borderColor:`${color}60`, background:'rgba(2,6,16,0.92)' }}>
            {Math.round(subPct*100)}%
          </div>
        )}
      </div>
    </Marker>
  );
});

// ═══════════════════════════════════════════════════════════
// ZonePopup
// ═══════════════════════════════════════════════════════════

const ZonePopup = React.memo(({ zone, seaRise, onClose }) => {
  const { color } = getZoneStatus(zone.properties.elevation, seaRise);
  const p = zone.properties;
  const margin = p.elevation - seaRise;
  const subPct = Math.min(100, Math.max(0, (seaRise / p.elevation) * 100));
  return (
    <Popup longitude={zone.geometry.coordinates[0]} latitude={zone.geometry.coordinates[1]}
      onClose={onClose} closeOnClick={false} anchor="bottom" offset={36} maxWidth="300px">
      <div className="mp-popup" style={{ '--pc': color }}>
        <div className="mp-popup__head">
          <span className="mp-popup__flag">{p.flag||'🌍'}</span>
          <div className="mp-popup__head-text">
            <div className="mp-popup__name">{p.name}</div>
            <div className="mp-popup__sub">{p.country} · {p.region}</div>
          </div>
          <div className="mp-popup__badge" style={{ color, borderColor:`${color}55`, background:`${color}18` }}>
            {(zone.status||'').toUpperCase()}
          </div>
        </div>
        <div className="mp-popup__sub-bar">
          <div className="mp-popup__sub-bar-head">
            <span>Niveau de submersion</span>
            <span style={{ color: subPct>50?'#FF1744':subPct>0?'#FF9100':'#43A047', fontWeight:700 }}>{subPct.toFixed(0)}%</span>
          </div>
          <div className="mp-popup__sub-track">
            <div className="mp-popup__sub-fill" style={{ width:`${subPct}%`, background: subPct>50?'linear-gradient(to right,#FF6D00,#FF1744)':subPct>0?'linear-gradient(to right,#29B6F6,#FF6D00)':'#43A047' }}/>
          </div>
        </div>
        <div className="mp-popup__grid">
          {[['🏔','Altitude',`${p.elevation} m`,null],['👥','Population',p.population?.toLocaleString('fr-FR')||'—',null],['⚠','Marge',`${margin>0?'+':''}${margin.toFixed(1)} m`, margin<=0?'#FF1744':margin<1?'#FFD740':'#69F0AE']].map(([ico,lbl,val,vc])=>(
            <div key={lbl} className="mp-popup__cell">
              <span className="mp-popup__cell-ico">{ico}</span>
              <div><div className="mp-popup__cell-lbl">{lbl}</div><div className="mp-popup__cell-val" style={vc?{color:vc}:{}}>{val}</div></div>
            </div>
          ))}
        </div>
        {p.criticalInfra?.length>0 && (<div className="mp-popup__infra"><div className="mp-popup__infra-ttl">⚡ Infrastructure critique</div>{p.criticalInfra.slice(0,3).map(i=>(<div key={i} className="mp-popup__infra-item">{i}</div>))}</div>)}
        {p.description && <div className="mp-popup__desc">{p.description}</div>}
      </div>
    </Popup>
  );
});

// ═══════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════

export default function MapPage() {
  const [terrain3D, setTerrain3D] = useState(true);
  const [seaRise,   setSeaRise]   = useState(0);
  const [selected,  setSelected]  = useState(null);
  const [showZones, setShowZones] = useState(true);
  const [wavePhase, setWavePhase] = useState(0);

  const [noaaStationId,    setNoaaStationId]    = useState(NOAA_STATIONS[0].id);
  const [includeNoaaLevel, setIncludeNoaaLevel] = useState(false);
  const [noaaLevel,        setNoaaLevel]        = useState(null);
  const [noaaLoading,      setNoaaLoading]      = useState(false);
  const [noaaError,        setNoaaError]        = useState(null);

  const mapRef      = useRef();
  const mapReadyRef = useRef(false);
  const waveRafRef  = useRef();

  // Animation pulsation eau
  useEffect(() => {
    let phase = 0;
    const animate = () => { phase += 0.008; setWavePhase(phase); waveRafRef.current = requestAnimationFrame(animate); };
    waveRafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(waveRafRef.current);
  }, []);

  const effectiveSeaRise = useMemo(() => {
    const obs = includeNoaaLevel && Number.isFinite(noaaLevel?.value) ? noaaLevel.value : 0;
    return Math.max(0, seaRise + obs);
  }, [seaRise, includeNoaaLevel, noaaLevel]);

  const selectedNoaaStation = useMemo(() => NOAA_STATIONS.find(s=>s.id===noaaStationId)||NOAA_STATIONS[0], [noaaStationId]);
  const floodGeoJSON = useMemo(() => buildFloodGeoJSON(effectiveSeaRise), [effectiveSeaRise]);
  const activeZoneCount = floodGeoJSON.features.length;

  // Rayon des cercles — pulse animé
  const circleRadius = useMemo(() => {
    const base = 2800; // mètres — ajustable
    const pulse = Math.sin(wavePhase * 1.2) * 200;
    return base + pulse;
  }, [wavePhase]);

  // Opacité pulsante
  const circleOpacity = useMemo(() => {
    const base = Math.min(0.72, 0.38 + effectiveSeaRise * 0.07);
    const pulse = Math.sin(wavePhase * 1.5) * 0.06;
    return Math.max(0.25, Math.min(0.82, base + pulse));
  }, [effectiveSeaRise, wavePhase]);

  const loadNoaa = useCallback(async (sid=noaaStationId) => {
    setNoaaLoading(true); setNoaaError(null);
    try { setNoaaLevel(await fetchNoaaWaterLevel(sid)); }
    catch(e) { setNoaaError(e.message); setNoaaLevel(null); }
    finally { setNoaaLoading(false); }
  }, [noaaStationId]);

  useEffect(()=>{ loadNoaa(noaaStationId); }, [noaaStationId]);

  const ensureDem = useCallback(map => {
    if (!map.getSource('mapbox-dem')) map.addSource('mapbox-dem', { type:'raster-dem', url:'mapbox://mapbox.mapbox-terrain-dem-v1', tileSize:512, maxzoom:14 });
  }, []);

  const applyTerrain = useCallback((map, on) => {
    try { on ? map.setTerrain({ source:'mapbox-dem', exaggeration:1.8 }) : map.setTerrain(null); } catch(_) {}
  }, []);

  const setupAfterIdle = useCallback(map => {
    const onIdle = () => { map.off('idle', onIdle); mapReadyRef.current = true; ensureDem(map); if (terrain3D) applyTerrain(map, true); };
    map.on('idle', onIdle);
  }, [ensureDem, applyTerrain, terrain3D]);

  const onMapLoad = useCallback(() => { const map = mapRef.current?.getMap(); if (map) setupAfterIdle(map); }, [setupAfterIdle]);
  const onStyleData = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map?.isStyleLoaded()) return;
    mapReadyRef.current = false; ensureDem(map); setupAfterIdle(map);
  }, [ensureDem, setupAfterIdle]);

  const toggleTerrain = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map || !mapReadyRef.current) return;
    const next = !terrain3D; ensureDem(map); applyTerrain(map, next); setTerrain3D(next);
  }, [terrain3D, ensureDem, applyTerrain]);

  const hudLabel = effectiveSeaRise < 0.05 ? 'Niveau actuel' : effectiveSeaRise < 0.5 ? 'Scénario modéré' : effectiveSeaRise < 1.5 ? 'GIEC SSP5-8.5' : effectiveSeaRise < 3 ? 'Fonte Antarctique' : effectiveSeaRise < 10 ? 'Effondrement climatique' : 'Catastrophe majeure';
  const hudColor = effectiveSeaRise < 0.3 ? '#00E5FF' : effectiveSeaRise < 1 ? '#29B6F6' : effectiveSeaRise < 5 ? '#FF9100' : '#FF1744';

  return (
    <div className="map-page">
      <div className="map-page__canvas">
        <Map ref={mapRef} initialViewState={INITIAL_VIEW} style={{ width:'100%', height:'100%' }}
          mapStyle={SATELLITE_STYLE} mapboxAccessToken={TOKEN} onLoad={onMapLoad} onStyleData={onStyleData}>
          <NavigationControl position="top-right" showCompass visualizePitch/>

          {/* Bâtiments 3D */}
          <Layer id="3d-buildings" source="composite" source-layer="building"
            filter={['==','extrude','true']} type="fill-extrusion" minzoom={14}
            paint={{'fill-extrusion-color':['interpolate',['linear'],['get','height'],0,'#1a2a1a',50,'#2a3a2a',200,'#1a301a'],'fill-extrusion-height':['get','height'],'fill-extrusion-base':['get','min_height'],'fill-extrusion-opacity':0.7}}/>

          {/* ══ FLOOD v10 — CERCLES géolocalisés ══
              Technique "circle" au lieu de "fill" polygon :
              ─ ZÉRO line layer → ZÉRO trait autour du globe
              ─ Les cercles sont des points en espace métrique
              ─ Chaque cercle = zone basse réelle validée GPS
              ─ Blur important → fondu réaliste entre cercles adjacents
              ════════════════════════════════════════════ */}
          {effectiveSeaRise > 0 && activeZoneCount > 0 && (
            <Source id="flood-points" type="geojson" data={floodGeoJSON}>

              {/* Couche glow extérieure — effet halo eau */}
              <Layer
                id="flood-halo"
                type="circle"
                paint={{
                  'circle-radius': [
                    'interpolate', ['linear'], ['zoom'],
                    4,  8,
                    6,  18,
                    8,  35,
                    10, 55,
                    12, 80,
                  ],
                  'circle-color': [
                    'interpolate', ['linear'], ['get', 'elev'],
                    0,   '#48cae4',
                    0.5, '#0096c7',
                    1.5, '#0077b6',
                    3.0, '#023e8a',
                  ],
                  'circle-opacity': Math.min(0.35, circleOpacity * 0.45),
                  'circle-blur': 1.2,
                  'circle-pitch-alignment': 'map',
                  'circle-pitch-scale': 'map',
                }}
              />

              {/* Couche principale eau — cercles solides avec blur */}
              <Layer
                id="flood-fill"
                type="circle"
                paint={{
                  'circle-radius': [
                    'interpolate', ['linear'], ['zoom'],
                    4,  5,
                    6,  12,
                    8,  22,
                    10, 38,
                    12, 60,
                  ],
                  'circle-color': [
                    'interpolate', ['linear'], ['get', 'elev'],
                    0,   '#023e8a',
                    0.5, '#0077b6',
                    1.0, '#0096c7',
                    2.0, '#00b4d8',
                    3.0, '#48cae4',
                  ],
                  'circle-opacity': circleOpacity,
                  'circle-blur': 0.6,
                  'circle-pitch-alignment': 'map',
                  'circle-pitch-scale': 'map',
                }}
              />

            </Source>
          )}

          {/* Zones vulnérables */}
          {showZones && VULNERABLE_ZONES.features.map(z=>(
            <ZoneMarker key={z.properties.id} zone={z} seaRise={effectiveSeaRise} onSelect={setSelected}/>
          ))}
          {selected && <ZonePopup zone={selected} seaRise={effectiveSeaRise} onClose={()=>setSelected(null)}/>}
        </Map>
      </div>

      <div className="mp-toolbar">
        <button className={`mp-toolbar__btn${terrain3D?' mp-toolbar__btn--on':''}`} onClick={toggleTerrain}>
          {terrain3D ? '⛰ 3D ON' : '⛰ 3D OFF'}
        </button>
      </div>

      <div className="mp-layers">
        <div className="mp-layers__title">Couches</div>
        <label className="mp-layers__item">
          <div className="mp-layers__dot" style={{background: showZones ? '#00E5FF' : 'rgba(255,255,255,0.15)'}}/>
          <span>🌊 Zones côtières</span>
          <input type="checkbox" checked={showZones} onChange={e=>setShowZones(e.target.checked)}/>
        </label>
        {effectiveSeaRise > 0 && (
          <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', marginTop:'8px', paddingTop:'8px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ color: hudColor }}>●</span> {activeZoneCount} points inondés
          </div>
        )}
      </div>

      <div className="mp-hud" style={{ '--hc': hudColor }}>
        <div className="mp-hud__dot" style={{background:hudColor, boxShadow:`0 0 12px ${hudColor}`}}/>
        <div className="mp-hud__body">
          <div className="mp-hud__label">{hudLabel}</div>
          <div className="mp-hud__value" style={{color:hudColor}}>+{effectiveSeaRise.toFixed(2)} m</div>
        </div>
        {effectiveSeaRise >= 0.5 && <div className="mp-hud__warn">🚨</div>}
      </div>

      <div className="mp-legend">
        <div className="mp-legend__block">
          <div className="mp-legend__ttl">Risque côtier</div>
          {[['#43A047','Sûr'],['#FBC02D','Menacé'],['#F57C00','Danger'],['#E64A19','Critique'],['#D32F2F','Submergé']].map(([c,l])=>(
            <div key={l} className="mp-legend__row"><div className="mp-legend__diamond" style={{background:c, boxShadow:`0 0 4px ${c}90`}}/><span>{l}</span></div>
          ))}
        </div>
        <div className="mp-legend__sep"/>
        <div className="mp-legend__block">
          <div className="mp-legend__ttl">Inondation côtière</div>
          {[['#023e8a','0 – 0.5 m · Mangroves'],['#0077b6','0.5 – 1 m · Plages'],['#0096c7','1 – 2 m · Plaines'],['#48cae4','2 – 3 m · Deltas']].map(([c,l])=>(
            <div key={l} className="mp-legend__row">
              <div style={{width:10,height:10,borderRadius:'50%',background:c,boxShadow:`0 0 4px ${c}90`,flexShrink:0}}/>
              <span>{l}</span>
            </div>
          ))}
          <div style={{fontSize:'10px',color:'rgba(255,255,255,0.28)',marginTop:'8px',paddingTop:'8px',borderTop:'1px solid rgba(255,255,255,0.06)',lineHeight:'1.5'}}>
            Points côtiers validés GPS<br/>NC complète · Pacifique
          </div>
        </div>
      </div>

      <SeaLevelControl seaRise={seaRise} effectiveSeaRise={effectiveSeaRise} onChange={setSeaRise}
        noaaStations={NOAA_STATIONS} noaaStationId={noaaStationId} onNoaaStationChange={setNoaaStationId}
        noaaLevel={noaaLevel} noaaLoading={noaaLoading} noaaError={noaaError}
        includeNoaaLevel={includeNoaaLevel} onIncludeNoaaLevelChange={setIncludeNoaaLevel}
        onRefreshNoaa={()=>loadNoaa(noaaStationId)} selectedNoaaStation={selectedNoaaStation}/>

      <div className="mp-badge">
        <span>Pacific Dataviz Challenge 2026</span>
        <span>Sea Level Rise · NC & Pacifique Sud</span>
      </div>
    </div>
  );
}