// src/pages/MapPage/MapPage.jsx
// ============================================================
// MapPage v12.0 — OCEAN FILL CONNECTE
//
// Architecture :
// ─ Un grand polygone "océan" couvre toute la zone Pacifique
// ─ Des polygones "île" découpent (soustrait) les terres
// ─ Résultat : seule l'eau réelle est colorée
// ─ Connecté à l'océan = pas de flaques isolées
// ─ Précision : le contour des îles définit exactement
//   jusqu'où l'eau monte sur les côtes
// ─ ZERO line layer = ZERO trait parasite
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
  if (!res.ok) throw new Error('NOAA HTTP ' + res.status);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || 'Erreur NOAA');
  const row = json.data && json.data[0];
  if (!row) throw new Error('Aucune donnée NOAA.');
  return { value: Number(row.v), time: row.t, stationId };
};

// =====================================================================
// ARCHITECTURE "OCEAN WITH ISLANDS CUTOUT"
//
// Principe GeoJSON MultiPolygon :
//
// 1. Outer ring (sens horaire) = rectangle océan Pacifique
// 2. Inner rings (sens anti-horaire) = contours des îles
//    → Les inner rings SOUSTRAIENT les terres de l'eau
//
// Résultat visuel : l'eau couvre tout l'océan SAUF les terres.
// Quand seaRise augmente, les inner rings (contours île)
// rétrécissent → l'eau "monte" sur les côtes.
//
// Le niveau de montée est simulé en choisissant quel contour
// d'île on utilise (côte à 0m, 1m, 2m, 5m, etc.)
// =====================================================================

// Contour approximatif de la Grande Terre NC
// Tracé manuellement en suivant le littoral réel
// Points en sens ANTI-HORAIRE (inner ring = soustraction)

// Contour côtier NC par niveau de montée
// Chaque niveau = un tracé légèrement plus petit (terres restantes)

// Contour actuel (niveau mer = 0) — suit le littoral
const NC_SHORE_0 = [
  // Pointe Nord
  [164.168,-20.012],
  // Côte Est Nord → Sud
  [164.525,-20.338],[164.675,-20.428],[164.812,-20.545],
  [164.888,-20.648],[165.002,-20.738],[165.148,-20.808],
  [165.215,-20.858],[165.278,-20.945],[165.328,-21.025],
  [165.388,-21.088],[165.445,-21.152],[165.508,-21.228],
  [165.558,-21.298],[165.628,-21.388],[165.658,-21.458],
  [165.698,-21.528],[165.745,-21.595],[165.808,-21.648],
  [165.858,-21.698],[165.905,-21.748],[165.958,-21.808],
  [166.015,-21.848],[166.068,-21.878],[166.118,-21.928],
  [166.158,-21.988],[166.205,-22.048],[166.248,-22.105],
  [166.278,-22.145],[166.315,-22.178],[166.348,-22.208],
  [166.378,-22.232],[166.398,-22.262],[166.428,-22.282],
  [166.448,-22.302],[166.468,-22.325],[166.495,-22.348],
  [166.528,-22.368],[166.558,-22.388],[166.588,-22.408],
  [166.625,-22.428],[166.658,-22.448],[166.695,-22.448],
  [166.728,-22.438],[166.758,-22.418],[166.788,-22.398],
  [166.818,-22.378],[166.848,-22.358],[166.878,-22.338],
  [166.908,-22.308],[166.938,-22.278],[166.968,-22.248],
  [166.998,-22.218],[167.028,-22.188],[167.058,-22.158],
  [167.085,-22.128],[167.108,-22.098],[167.128,-22.068],
  [167.145,-22.038],[167.158,-22.008],[167.168,-21.978],
  [167.175,-21.948],[167.178,-21.918],[167.178,-21.888],
  [167.175,-21.858],[167.168,-21.828],[167.158,-21.798],
  // Pointe Sud
  [167.145,-21.768],
  // Côte Ouest Sud → Nord  
  [167.098,-21.748],[167.038,-21.748],[166.978,-21.758],
  [166.918,-21.778],[166.858,-21.808],[166.798,-21.838],
  [166.738,-21.868],[166.678,-21.878],[166.618,-21.868],
  [166.558,-21.838],[166.498,-21.798],[166.438,-21.748],
  [166.378,-21.698],[166.318,-21.648],[166.258,-21.598],
  [166.198,-21.548],[166.138,-21.498],[166.078,-21.448],
  [166.018,-21.398],[165.958,-21.348],[165.898,-21.298],
  [165.838,-21.248],[165.778,-21.198],[165.718,-21.148],
  [165.658,-21.098],[165.598,-21.048],[165.538,-20.998],
  [165.478,-20.948],[165.418,-20.898],[165.358,-20.848],
  [165.298,-20.798],[165.238,-20.748],[165.178,-20.698],
  [165.118,-20.648],[165.058,-20.598],[164.998,-20.548],
  [164.938,-20.498],[164.878,-20.448],[164.818,-20.398],
  [164.758,-20.348],[164.698,-20.298],[164.638,-20.248],
  [164.578,-20.198],[164.518,-20.148],[164.458,-20.098],
  [164.398,-20.052],[164.338,-20.022],[164.278,-20.008],
  [164.218,-20.008],[164.168,-20.012],
];

// Contour à +1m : légèrement en retrait du littoral
// (les zones côtières basses disparaissent)
const NC_SHORE_1 = [
  [164.198,-20.015],
  [164.548,-20.355],[164.698,-20.445],[164.835,-20.562],
  [164.912,-20.665],[165.025,-20.755],[165.172,-20.825],
  [165.238,-20.875],[165.302,-20.962],[165.352,-21.042],
  [165.412,-21.105],[165.468,-21.168],[165.532,-21.245],
  [165.582,-21.315],[165.652,-21.405],[165.682,-21.475],
  [165.722,-21.545],[165.768,-21.612],[165.832,-21.665],
  [165.882,-21.715],[165.928,-21.765],[165.982,-21.825],
  [166.038,-21.865],[166.092,-21.895],[166.142,-21.945],
  [166.182,-22.005],[166.228,-22.062],[166.272,-22.118],
  [166.302,-22.158],[166.338,-22.192],[166.372,-22.222],
  [166.402,-22.248],[166.422,-22.278],[166.452,-22.298],
  [166.472,-22.318],[166.492,-22.342],[166.518,-22.365],
  [166.548,-22.385],[166.578,-22.402],[166.608,-22.418],
  [166.645,-22.435],[166.678,-22.452],[166.715,-22.452],
  [166.748,-22.442],[166.778,-22.422],[166.808,-22.402],
  [166.838,-22.382],[166.868,-22.362],[166.898,-22.342],
  [166.928,-22.312],[166.958,-22.282],[166.988,-22.252],
  [167.018,-22.222],[167.048,-22.192],[167.078,-22.162],
  [167.105,-22.132],[167.128,-22.102],[167.148,-22.072],
  [167.165,-22.042],[167.178,-22.012],[167.188,-21.982],
  [167.195,-21.952],[167.198,-21.922],[167.198,-21.892],
  [167.195,-21.862],[167.188,-21.832],[167.178,-21.802],
  [167.165,-21.772],
  [167.118,-21.752],[167.058,-21.752],[166.998,-21.762],
  [166.938,-21.782],[166.878,-21.812],[166.818,-21.842],
  [166.758,-21.872],[166.698,-21.882],[166.638,-21.872],
  [166.578,-21.842],[166.518,-21.802],[166.458,-21.752],
  [166.398,-21.702],[166.338,-21.652],[166.278,-21.602],
  [166.218,-21.552],[166.158,-21.502],[166.098,-21.452],
  [166.038,-21.402],[165.978,-21.352],[165.918,-21.302],
  [165.858,-21.252],[165.798,-21.202],[165.738,-21.152],
  [165.678,-21.102],[165.618,-21.052],[165.558,-21.002],
  [165.498,-20.952],[165.438,-20.902],[165.378,-20.852],
  [165.318,-20.802],[165.258,-20.752],[165.198,-20.702],
  [165.138,-20.652],[165.078,-20.602],[165.018,-20.552],
  [164.958,-20.502],[164.898,-20.452],[164.838,-20.402],
  [164.778,-20.352],[164.718,-20.302],[164.658,-20.252],
  [164.598,-20.202],[164.538,-20.152],[164.478,-20.102],
  [164.418,-20.058],[164.358,-20.028],[164.298,-20.012],
  [164.238,-20.012],[164.198,-20.015],
];

// Contour à +3m : recul plus marqué des terres
const NC_SHORE_3 = [
  [164.228,-20.022],
  [164.578,-20.372],[164.728,-20.462],[164.862,-20.578],
  [164.938,-20.682],[165.052,-20.772],[165.198,-20.842],
  [165.265,-20.892],[165.328,-20.978],[165.378,-21.058],
  [165.438,-21.122],[165.495,-21.185],[165.558,-21.262],
  [165.608,-21.332],[165.678,-21.422],[165.708,-21.492],
  [165.748,-21.562],[165.795,-21.628],[165.858,-21.682],
  [165.908,-21.732],[165.955,-21.782],[166.008,-21.842],
  [166.065,-21.882],[166.118,-21.912],[166.168,-21.962],
  [166.208,-22.022],[166.255,-22.078],[166.298,-22.135],
  [166.328,-22.175],[166.362,-22.208],[166.395,-22.238],
  [166.425,-22.265],[166.448,-22.295],[166.478,-22.315],
  [166.498,-22.338],[166.518,-22.358],[166.542,-22.382],
  [166.568,-22.398],[166.598,-22.415],[166.628,-22.432],
  [166.665,-22.448],[166.698,-22.462],[166.735,-22.462],
  [166.768,-22.452],[166.798,-22.432],[166.828,-22.412],
  [166.858,-22.392],[166.888,-22.372],[166.918,-22.352],
  [166.948,-22.322],[166.978,-22.292],[167.008,-22.262],
  [167.038,-22.232],[167.068,-22.202],[167.098,-22.172],
  [167.125,-22.142],[167.148,-22.112],[167.168,-22.082],
  [167.185,-22.052],[167.198,-22.022],[167.208,-21.992],
  [167.215,-21.962],[167.218,-21.932],[167.218,-21.902],
  [167.215,-21.872],[167.208,-21.842],[167.198,-21.812],
  [167.185,-21.782],
  [167.138,-21.762],[167.078,-21.762],[167.018,-21.772],
  [166.958,-21.792],[166.898,-21.822],[166.838,-21.852],
  [166.778,-21.882],[166.718,-21.892],[166.658,-21.882],
  [166.598,-21.852],[166.538,-21.812],[166.478,-21.762],
  [166.418,-21.712],[166.358,-21.662],[166.298,-21.612],
  [166.238,-21.562],[166.178,-21.512],[166.118,-21.462],
  [166.058,-21.412],[165.998,-21.362],[165.938,-21.312],
  [165.878,-21.262],[165.818,-21.212],[165.758,-21.162],
  [165.698,-21.112],[165.638,-21.062],[165.578,-21.012],
  [165.518,-20.962],[165.458,-20.912],[165.398,-20.862],
  [165.338,-20.812],[165.278,-20.762],[165.218,-20.712],
  [165.158,-20.662],[165.098,-20.612],[165.038,-20.562],
  [164.978,-20.512],[164.918,-20.462],[164.858,-20.412],
  [164.798,-20.362],[164.738,-20.312],[164.678,-20.262],
  [164.618,-20.212],[164.558,-20.162],[164.498,-20.112],
  [164.438,-20.068],[164.378,-20.038],[164.318,-20.022],
  [164.258,-20.018],[164.228,-20.022],
];

// Sélectionne le bon contour selon le niveau de montée
const getNCShore = (seaRise) => {
  if (seaRise < 1.0)  return NC_SHORE_0;
  if (seaRise < 3.0)  return NC_SHORE_1;
  return NC_SHORE_3;
};

// Rectangle océan Pacifique (outer ring, sens HORAIRE)
const PACIFIC_OCEAN = [
  [110.0, -50.0],[110.0, 40.0],[230.0, 40.0],[230.0, -50.0],[110.0, -50.0]
];

// Contours des autres grandes terres (inner rings anti-horaire)
// Pour les empêcher d'être "submergées" par le fill océan
const AUSTRALIA = [
  [114.0,-22.0],[114.0,-35.0],[118.0,-34.0],[124.0,-34.0],[130.0,-33.0],
  [134.0,-34.0],[138.0,-35.0],[141.0,-38.0],[146.0,-39.0],[150.0,-37.0],
  [153.5,-28.0],[153.5,-24.0],[149.0,-21.0],[146.5,-18.0],[144.0,-14.5],
  [136.5,-12.0],[130.5,-11.0],[128.0,-14.5],[124.0,-17.0],[120.0,-20.0],
  [115.0,-21.0],[114.0,-22.0],
].reverse();

const NEW_ZEALAND_N = [
  [174.0,-37.0],[178.5,-37.5],[178.5,-41.5],[174.5,-41.5],[172.5,-40.0],[174.0,-37.0]
].reverse();

const NEW_ZEALAND_S = [
  [166.5,-46.5],[168.0,-46.0],[170.5,-45.5],[171.5,-44.5],[172.5,-43.5],
  [173.5,-42.5],[174.0,-41.5],[172.0,-40.5],[170.5,-42.0],[169.0,-44.0],
  [167.0,-45.5],[166.5,-46.5]
].reverse();

// ── buildFloodGeoJSON ──────────────────────────────────────
// Crée un MultiPolygon : océan MOINS les terres NC + continent
const buildFloodGeoJSON = (seaRise) => {
  if (seaRise <= 0) {
    return { type: 'FeatureCollection', features: [] };
  }

  const ncShore = getNCShore(seaRise);

  // Feature principale : Pacifique Sud avec NC découpée
  const mainFeature = {
    type: 'Feature',
    properties: { type: 'ocean', seaRise },
    geometry: {
      type: 'Polygon',
      // Premier ring = outer (océan), suivants = inner (terres soustraites)
      coordinates: [
        PACIFIC_OCEAN,      // outer ring: tout le Pacifique
        AUSTRALIA,          // inner: Australie exclue
        NEW_ZEALAND_N,      // inner: NZ Nord exclue
        NEW_ZEALAND_S,      // inner: NZ Sud exclue
        ncShore,            // inner: NC exclue (niveau varie avec seaRise)
      ],
    },
  };

  // Ouvéa — atoll entier visible à partir de 0.5m
  const ouveaFeature = seaRise >= 0.5 ? null : {
    type: 'Feature',
    properties: { type: 'atoll' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [166.42,-20.75],[167.05,-20.75],[167.05,-20.48],[166.42,-20.48],[166.42,-20.75]
      ]],
    },
  };

  return {
    type: 'FeatureCollection',
    features: [mainFeature].filter(Boolean),
  };
};

// =====================================================================
// ZoneMarker + ZonePopup (identiques au projet original)
// =====================================================================

const ZoneMarker = React.memo(({ zone, seaRise, onSelect }) => {
  const p = zone.properties;
  const { color, urgency } = getZoneStatus(p.elevation, seaRise);
  const subPct = Math.min(1, Math.max(0, seaRise / p.elevation));
  const sz = 18 + urgency * 8;

  const handleClick = useCallback((e) => {
    e.originalEvent && e.originalEvent.stopPropagation();
    onSelect({ ...zone, status: getZoneStatus(p.elevation, seaRise).status });
  }, [zone, seaRise, p.elevation, onSelect]);

  return (
    <Marker longitude={zone.geometry.coordinates[0]} latitude={zone.geometry.coordinates[1]}
      onClick={handleClick} style={{ cursor: 'pointer' }}>
      <div className={`mp-marker mp-marker--u${urgency}`} style={{ '--mc': color }}>
        {urgency >= 3 && <div className="mp-marker__label">{p.flag} {p.name}</div>}
        <svg width={sz*3} height={sz*3} viewBox="0 0 100 100" overflow="visible"
          style={{ display:'block', overflow:'visible' }}>
          {urgency >= 2 && (
            <circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth="0.7" opacity="0.25">
              <animate attributeName="r" values="36;54;36" dur="2.4s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.35;0;0.35" dur="2.4s" repeatCount="indefinite"/>
            </circle>
          )}
          {urgency >= 3 && (
            <>
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
            </>
          )}
          {urgency === 2 && (
            <>
              <defs><clipPath id={`clipt-${p.id}`}><polygon points="50,10 90,78 10,78"/></clipPath></defs>
              <polygon points="50,10 90,78 10,78" fill={`${color}18`} stroke={`${color}60`} strokeWidth="1.5"/>
              <g clipPath={`url(#clipt-${p.id})`}>
                <rect x="10" y={10+(1-subPct)*68} width="80" height="68" fill={color} opacity="0.4"/>
              </g>
              <polygon points="50,10 90,78 10,78" fill="none" stroke={color} strokeWidth="1.8"/>
              <line x1="50" y1="28" x2="50" y2="56" stroke="white" strokeWidth="4" strokeLinecap="round"/>
              <circle cx="50" cy="66" r="4" fill="white"/>
            </>
          )}
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
        {p.description && <div className="mp-popup__desc">{p.description}</div>}
      </div>
    </Popup>
  );
});

// =====================================================================
// PAGE PRINCIPALE
// =====================================================================

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
    const obs = includeNoaaLevel && Number.isFinite(noaaLevel?.value) ? noaaLevel.value : 0;
    return Math.max(0, seaRise + obs);
  }, [seaRise, includeNoaaLevel, noaaLevel]);

  const selectedNoaaStation = useMemo(
    () => NOAA_STATIONS.find(s => s.id === noaaStationId) || NOAA_STATIONS[0],
    [noaaStationId]
  );

  const floodGeoJSON = useMemo(
    () => buildFloodGeoJSON(effectiveSeaRise),
    [effectiveSeaRise]
  );

  // Opacité animée — effet eau vivante
  const floodOpacity = useMemo(() => {
    const base = Math.min(0.75, 0.40 + effectiveSeaRise * 0.05);
    const pulse = Math.sin(wavePhase * 1.5) * 0.04;
    return Math.max(0.25, Math.min(0.80, base + pulse));
  }, [effectiveSeaRise, wavePhase]);

  // Couleur eau selon scénario
  const waterColor = useMemo(() => {
    if (effectiveSeaRise < 1)   return '#0096c7';
    if (effectiveSeaRise < 3)   return '#0077b6';
    if (effectiveSeaRise < 10)  return '#005f99';
    return '#003d7a';
  }, [effectiveSeaRise]);

  const loadNoaa = useCallback(async (sid = noaaStationId) => {
    setNoaaLoading(true); setNoaaError(null);
    try { setNoaaLevel(await fetchNoaaWaterLevel(sid)); }
    catch(e) { setNoaaError(e.message); setNoaaLevel(null); }
    finally { setNoaaLoading(false); }
  }, [noaaStationId]);

  useEffect(() => { loadNoaa(noaaStationId); }, [noaaStationId]);

  const ensureDem = useCallback(map => {
    if (!map.getSource('mapbox-dem')) {
      map.addSource('mapbox-dem', { type:'raster-dem', url:'mapbox://mapbox.mapbox-terrain-dem-v1', tileSize:512, maxzoom:14 });
    }
  }, []);

  const applyTerrain = useCallback((map, on) => {
    try { on ? map.setTerrain({ source:'mapbox-dem', exaggeration:1.8 }) : map.setTerrain(null); } catch(e) {}
  }, []);

  const setupAfterIdle = useCallback(map => {
    const onIdle = () => {
      map.off('idle', onIdle);
      mapReadyRef.current = true;
      ensureDem(map);
      if (terrain3D) applyTerrain(map, true);
    };
    map.on('idle', onIdle);
  }, [ensureDem, applyTerrain, terrain3D]);

  const onMapLoad  = useCallback(() => { const map = mapRef.current?.getMap(); if (map) setupAfterIdle(map); }, [setupAfterIdle]);
  const onStyleData = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map?.isStyleLoaded()) return;
    mapReadyRef.current = false; ensureDem(map); setupAfterIdle(map);
  }, [ensureDem, setupAfterIdle]);

  const toggleTerrain = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map || !mapReadyRef.current) return;
    const next = !terrain3D;
    ensureDem(map); applyTerrain(map, next); setTerrain3D(next);
  }, [terrain3D, ensureDem, applyTerrain]);

  const hudLabel =
    effectiveSeaRise < 0.05 ? 'Niveau actuel'
    : effectiveSeaRise < 0.5  ? 'Scénario modéré'
    : effectiveSeaRise < 1.5  ? 'GIEC SSP5-8.5'
    : effectiveSeaRise < 3    ? 'Fonte Antarctique'
    : effectiveSeaRise < 10   ? 'Effondrement climatique'
    : effectiveSeaRise < 30   ? 'Catastrophe majeure'
    : 'Monde transformé';

  const hudColor =
    effectiveSeaRise < 0.3 ? '#00E5FF'
    : effectiveSeaRise < 1  ? '#29B6F6'
    : effectiveSeaRise < 5  ? '#FF9100'
    : '#FF1744';

  return (
    <div className="map-page">
      <div className="map-page__canvas">
        <Map
          ref={mapRef}
          initialViewState={INITIAL_VIEW}
          style={{ width:'100%', height:'100%' }}
          mapStyle={SATELLITE_STYLE}
          mapboxAccessToken={TOKEN}
          onLoad={onMapLoad}
          onStyleData={onStyleData}
        >
          <NavigationControl position="top-right" showCompass visualizePitch/>

          {/* Bâtiments 3D */}
          <Layer id="3d-buildings" source="composite" source-layer="building"
            filter={['==','extrude','true']} type="fill-extrusion" minzoom={14}
            paint={{
              'fill-extrusion-color': ['interpolate',['linear'],['get','height'],0,'#1a2a1a',50,'#2a3a2a',200,'#1a301a'],
              'fill-extrusion-height': ['get','height'],
              'fill-extrusion-base': ['get','min_height'],
              'fill-extrusion-opacity': 0.7,
            }}
          />

          {/* ══ OCEAN FILL v12 ══════════════════════════════
              Technique : Polygon avec inner rings (cutouts)
              ─ Outer ring = tout le Pacifique
              ─ Inner rings = terres exclues (NC, Australie, NZ)
              ─ L'inner ring NC varie selon seaRise → simulation
              ─ ZERO ligne parasite car c'est un seul fill polygon
              ─ Connecté à l'océan → pas de flaques isolées
              ─ FONCTIONNE correctement à tous les niveaux de zoom
              ════════════════════════════════════════════════ */}
          {effectiveSeaRise > 0 && (
            <Source id="flood-ocean" type="geojson" data={floodGeoJSON}>

              {/* Corps eau principal */}
              <Layer
                id="flood-fill"
                type="fill"
                paint={{
                  'fill-color': waterColor,
                  'fill-opacity': floodOpacity,
                  'fill-antialias': true,
                }}
              />

              {/* Glow subtil sur le remplissage */}
              <Layer
                id="flood-glow"
                type="fill"
                paint={{
                  'fill-color': '#48cae4',
                  'fill-opacity': Math.min(0.15, floodOpacity * 0.2),
                  'fill-antialias': true,
                }}
              />

            </Source>
          )}

          {/* Zones vulnérables */}
          {showZones && VULNERABLE_ZONES.features.map(z => (
            <ZoneMarker key={z.properties.id} zone={z} seaRise={effectiveSeaRise} onSelect={setSelected}/>
          ))}
          {selected && (
            <ZonePopup zone={selected} seaRise={effectiveSeaRise} onClose={() => setSelected(null)}/>
          )}
        </Map>
      </div>

      {/* Toolbar */}
      <div className="mp-toolbar">
        <button className={`mp-toolbar__btn${terrain3D?' mp-toolbar__btn--on':''}`} onClick={toggleTerrain}>
          {terrain3D ? '⛰ 3D ON' : '⛰ 3D OFF'}
        </button>
      </div>

      {/* Couches */}
      <div className="mp-layers">
        <div className="mp-layers__title">Couches</div>
        <label className="mp-layers__item">
          <div className="mp-layers__dot" style={{background: showZones ? '#00E5FF' : 'rgba(255,255,255,0.15)'}}/>
          <span>🌊 Zones côtières</span>
          <input type="checkbox" checked={showZones} onChange={e => setShowZones(e.target.checked)}/>
        </label>
      </div>

      {/* HUD */}
      <div className="mp-hud" style={{ '--hc': hudColor }}>
        <div className="mp-hud__dot" style={{background:hudColor, boxShadow:`0 0 12px ${hudColor}`}}/>
        <div className="mp-hud__body">
          <div className="mp-hud__label">{hudLabel}</div>
          <div className="mp-hud__value" style={{color:hudColor}}>+{effectiveSeaRise.toFixed(2)} m</div>
        </div>
        {effectiveSeaRise >= 0.5 && <div className="mp-hud__warn">🚨</div>}
      </div>

      {/* Légende */}
      <div className="mp-legend">
        <div className="mp-legend__block">
          <div className="mp-legend__ttl">Risque côtier</div>
          {[['#43A047','Sûr'],['#FBC02D','Menacé'],['#F57C00','Danger'],['#E64A19','Critique'],['#D32F2F','Submergé']].map(([c,l]) => (
            <div key={l} className="mp-legend__row">
              <div className="mp-legend__diamond" style={{background:c, boxShadow:`0 0 4px ${c}90`}}/>
              <span>{l}</span>
            </div>
          ))}
        </div>
        <div className="mp-legend__sep"/>
        <div className="mp-legend__block">
          <div className="mp-legend__ttl">Simulation</div>
          <div style={{fontSize:'11px',color:'rgba(255,255,255,0.45)',lineHeight:'1.6'}}>
            <div>🌊 Eau = océan connecté</div>
            <div>🏝 Terres = exclues du fill</div>
            <div>📐 Contour NC varie</div>
            <div style={{marginTop:8,paddingTop:8,borderTop:'1px solid rgba(255,255,255,0.08)',fontSize:'10px',color:'rgba(255,255,255,0.28)'}}>
              GeoJSON Polygon cutout<br/>NC + Australie + NZ
            </div>
          </div>
        </div>
      </div>

      {/* Sea Level Control */}
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

      <div className="mp-badge">
        <span>Pacific Dataviz Challenge 2026</span>
        <span>Sea Level Rise · NC & Pacifique Sud</span>
      </div>
    </div>
  );
}