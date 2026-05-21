// // src/pages/MapPage/MapPage.jsx
// import React, { useState, useRef, useCallback, useEffect } from 'react';
// import Map, { NavigationControl, Layer, Marker, Popup } from 'react-map-gl/mapbox';
// import 'mapbox-gl/dist/mapbox-gl.css';
// import './MapPage.scss';

// import { VULNERABLE_ZONES, getZoneStatus } from '../../data/seaLevelData';
// import SeaLevelControl from '../../components/SeaLevelControl';

// const TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

// const STYLES = [
//   { id: 'sat',  label: 'Satellite',  url: 'mapbox://styles/mapbox/satellite-v9' },
//   { id: 'sat2', label: 'Sat + Rues', url: 'mapbox://styles/mapbox/satellite-streets-v12' },
//   { id: 'dark', label: 'Sombre',     url: 'mapbox://styles/mapbox/dark-v11' },
//   { id: 'out',  label: 'Relief',     url: 'mapbox://styles/mapbox/outdoors-v12' },
// ];

// const WATER_COLOR = (r) =>
//   r < 0.3 ? '#1E88E5'
//   : r < 1  ? '#0277BD'
//   : r < 2  ? '#00838F'
//   : r < 5  ? '#BF360C'
//   : '#B71C1C';

// // ── Marqueur ─────────────────────────────────────────────
// const ZoneMarker = React.memo(({ zone, seaRise, onSelect }) => {
//   const { status, color, urgency } = getZoneStatus(zone.properties.elevation, seaRise);
//   const size = urgency >= 3 ? 20 : urgency >= 2 ? 15 : 10;

//   const renderShape = () => {
//     if (urgency >= 3) {
//       return (
//         <svg width={size * 2} height={size * 2} viewBox="0 0 100 100" overflow="visible">
//           <polygon points="50,2 98,50 50,98 2,50"
//             fill={`${color}15`} stroke={`${color}55`} strokeWidth="1.5"/>
//           <polygon points="50,16 82,50 50,84 18,50"
//             fill={color} stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
//           <polygon points="50,22 72,44 50,34" fill="rgba(255,255,255,0.4)"/>
//           <circle cx="50" cy="50" r="5" fill="rgba(255,255,255,0.9)"/>
//         </svg>
//       );
//     }
//     if (urgency >= 2) {
//       return (
//         <svg width={size * 2} height={size * 2} viewBox="0 0 100 100" overflow="visible">
//           <polygon points="50,10 90,80 10,80"
//             fill={`${color}20`} stroke={`${color}55`} strokeWidth="1.5"/>
//           <polygon points="50,22 78,72 22,72"
//             fill={color} stroke="rgba(255,255,255,0.45)" strokeWidth="1.5"/>
//           <line x1="50" y1="32" x2="50" y2="58"
//             stroke="rgba(255,255,255,0.85)" strokeWidth="4" strokeLinecap="round"/>
//           <circle cx="50" cy="67" r="4" fill="rgba(255,255,255,0.9)"/>
//         </svg>
//       );
//     }
//     if (urgency === 1) {
//       const pts = Array.from({ length: 6 }, (_, i) => {
//         const a = Math.PI / 180 * (60 * i - 30);
//         return `${50 + 36 * Math.cos(a)},${50 + 36 * Math.sin(a)}`;
//       }).join(' ');
//       return (
//         <svg width={size * 2} height={size * 2} viewBox="0 0 100 100" overflow="visible">
//           <polygon points={pts} fill={color} stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
//           <circle cx="50" cy="50" r="10" fill="rgba(255,255,255,0.75)"/>
//         </svg>
//       );
//     }
//     return (
//       <svg width={size * 2} height={size * 2} viewBox="0 0 100 100" overflow="visible">
//         <circle cx="50" cy="50" r="30" fill="none"
//           stroke={color} strokeWidth="2.5" strokeDasharray="8 5" opacity="0.7"/>
//         <circle cx="50" cy="50" r="12" fill={color} opacity="0.8"/>
//       </svg>
//     );
//   };

//   return (
//     <Marker
//       longitude={zone.geometry.coordinates[0]}
//       latitude={zone.geometry.coordinates[1]}
//       onClick={(e) => { e.originalEvent.stopPropagation(); onSelect({ ...zone, status, color }); }}
//     >
//       <div className="mp-marker">
//         {urgency >= 3 && (
//           <div
//             className="mp-marker__ring"
//             style={{
//               width:        `${size * 4}px`,
//               height:       `${size * 4}px`,
//               marginLeft:   `${-size * 2}px`,
//               marginTop:    `${-size * 2}px`,
//               border:       `1.5px solid ${color}`,
//               background:   `${color}12`,
//             }}
//           />
//         )}
//         <div
//           className="mp-marker__shape"
//           style={{ filter: `drop-shadow(0 0 ${urgency * 4 + 4}px ${color})` }}
//         >
//           {renderShape()}
//         </div>
//       </div>
//     </Marker>
//   );
// });

// // ── Popup ─────────────────────────────────────────────────
// const ZonePopup = React.memo(({ zone, seaRise, onClose }) => {
//   const { color } = getZoneStatus(zone.properties.elevation, seaRise);
//   const p      = zone.properties;
//   const margin = p.elevation - seaRise;

//   return (
//     <Popup
//       longitude={zone.geometry.coordinates[0]}
//       latitude={zone.geometry.coordinates[1]}
//       onClose={onClose}
//       closeOnClick={false}
//       anchor="bottom"
//       offset={28}
//     >
//       <div
//         className="mp-popup"
//         style={{
//           border:     `1px solid ${color}50`,
//           boxShadow:  `0 12px 48px rgba(0,0,0,0.75), 0 0 0 1px ${color}18`,
//         }}
//       >
//         <div className="mp-popup__head">
//           <span className="mp-popup__flag">{p.flag || '🌍'}</span>
//           <div className="mp-popup__info">
//             <div className="mp-popup__name">{p.name}</div>
//             <div className="mp-popup__sub">{p.country} · {p.region}</div>
//           </div>
//           <div
//             className="mp-popup__tag"
//             style={{ background: `${color}20`, border: `1px solid ${color}`, color }}
//           >
//             {(zone.status || '').toUpperCase()}
//           </div>
//         </div>

//         {[
//           ['🏔 Altitude',   `${p.elevation} m`,                                           null],
//           ['👥 Population', p.population?.toLocaleString('fr-FR') || '—',                 null],
//           ['⚠ Marge',      `${margin > 0 ? '+' : ''}${margin.toFixed(1)} m`,
//             margin <= 0 ? '#ff5252' : margin < 2 ? '#ffd740' : '#69f0ae'],
//         ].map(([l, v, c]) => (
//           <div className="mp-popup__row" key={l}>
//             <span className="mp-popup__row-label">{l}</span>
//             <span className="mp-popup__row-value" style={c ? { color: c } : {}}>{v}</span>
//           </div>
//         ))}

//         {p.description && <p className="mp-popup__desc">{p.description}</p>}
//       </div>
//     </Popup>
//   );
// });

// // ── Page ──────────────────────────────────────────────────
// export default function MapPage() {
//   const [styleUrl,  setStyleUrl]  = useState(STYLES[0].url);
//   const [terrain3D, setTerrain3D] = useState(true);
//   const [seaRise,   setSeaRise]   = useState(0);
//   const [selected,  setSelected]  = useState(null);
//   const mapRef = useRef();

//   const ensureDem = useCallback((map) => {
//     if (!map.getSource('mapbox-dem')) {
//       map.addSource('mapbox-dem', {
//         type: 'raster-dem',
//         url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
//         tileSize: 512, maxzoom: 14,
//       });
//     }
//   }, []);

//   const addFloodLayers = useCallback((map) => {
//     if (!map.getSource('terrain-v2')) {
//       map.addSource('terrain-v2', {
//         type: 'vector',
//         url: 'mapbox://mapbox.mapbox-terrain-v2',
//       });
//     }
//     if (!map.getLayer('flood-fill')) {
//       map.addLayer({
//         id: 'flood-fill', type: 'fill',
//         source: 'terrain-v2', 'source-layer': 'contour',
//         filter: ['<=', ['get', 'ele'], 0],
//         paint: { 'fill-color': '#1E88E5', 'fill-opacity': 0.50 },
//       });
//     }
//     if (!map.getLayer('flood-line')) {
//       map.addLayer({
//         id: 'flood-line', type: 'line',
//         source: 'terrain-v2', 'source-layer': 'contour',
//         filter: ['<=', ['get', 'ele'], 0],
//         paint: { 'line-color': '#29B6F6', 'line-width': 1.5, 'line-opacity': 0.9 },
//       });
//     }
//   }, []);

//   const onMapLoad = useCallback(() => {
//     const map = mapRef.current?.getMap();
//     if (!map) return;
//     ensureDem(map);
//     map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
//     addFloodLayers(map);
//   }, [ensureDem, addFloodLayers]);

//   // Update flood quand seaRise change
//   useEffect(() => {
//     const map = mapRef.current?.getMap();
//     if (!map?.isStyleLoaded()) return;
//     if (!map.getLayer('flood-fill')) { addFloodLayers(map); return; }
//     const c = WATER_COLOR(seaRise);
//     const o = Math.min(0.35 + seaRise * 0.06, 0.75);
//     map.setFilter('flood-fill', ['<=', ['get', 'ele'], seaRise]);
//     map.setFilter('flood-line', ['<=', ['get', 'ele'], seaRise]);
//     map.setPaintProperty('flood-fill', 'fill-color', c);
//     map.setPaintProperty('flood-fill', 'fill-opacity', o);
//     map.setPaintProperty('flood-line', 'line-color', c);
//     map.setPaintProperty('flood-line', 'line-width', seaRise < 1 ? 1.5 : seaRise < 3 ? 2.5 : 3.5);
//   }, [seaRise, addFloodLayers]);

//   const toggleTerrain = useCallback(() => {
//     const map = mapRef.current?.getMap();
//     if (!map) return;
//     ensureDem(map);
//     const next = !terrain3D;
//     next ? map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 }) : map.setTerrain(null);
//     setTerrain3D(next);
//   }, [terrain3D, ensureDem]);

//   const handleStyleChange = useCallback((url) => {
//     setStyleUrl(url);
//     setSelected(null);
//   }, []);

//   const hudColor = WATER_COLOR(seaRise);
//   const hudLabel =
//     seaRise < 0.1 ? 'Niveau actuel'
//     : seaRise < 0.5 ? 'Scénario modéré'
//     : seaRise < 1.5 ? 'GIEC pessimiste'
//     : seaRise < 3   ? 'Fonte Antarctique'
//     : seaRise < 6   ? 'Effondrement'
//     : 'Monde transformé';

//   return (
//     <div className="map-page">

//       {/* CARTE */}
//       <div className="map-page__map-wrap">
//         <Map
//           ref={mapRef}
//           initialViewState={{ longitude: 170, latitude: -16, zoom: 5, pitch: 50, bearing: -8 }}
//           style={{ width: '100%', height: '100%' }}
//           mapStyle={styleUrl}
//           mapboxAccessToken={TOKEN}
//           onLoad={onMapLoad}
//           onStyleData={() => {
//             const map = mapRef.current?.getMap();
//             if (!map?.isStyleLoaded()) return;
//             ensureDem(map);
//             if (terrain3D) map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
//             addFloodLayers(map);
//           }}
//         >
//           <NavigationControl position="top-right" />

//           {/* Bâtiments 3D */}
//           <Layer
//             id="3d-buildings"
//             source="composite"
//             source-layer="building"
//             filter={['==', 'extrude', 'true']}
//             type="fill-extrusion"
//             minzoom={14}
//             paint={{
//               'fill-extrusion-color': [
//                 'interpolate', ['linear'], ['get', 'height'],
//                 0, '#0d1b2a', 50, '#1a3050', 200, '#0d47a1',
//               ],
//               'fill-extrusion-height':  ['get', 'height'],
//               'fill-extrusion-base':    ['get', 'min_height'],
//               'fill-extrusion-opacity': 0.82,
//             }}
//           />

//           {/* Marqueurs */}
//           {VULNERABLE_ZONES.features.map(z => (
//             <ZoneMarker key={z.properties.id} zone={z} seaRise={seaRise} onSelect={setSelected} />
//           ))}

//           {selected && (
//             <ZonePopup zone={selected} seaRise={seaRise} onClose={() => setSelected(null)} />
//           )}
//         </Map>
//       </div>

//       {/* TOOLBAR */}
//       <div className="mp-toolbar">
//         {STYLES.map(s => (
//           <button
//             key={s.id}
//             className={`mp-toolbar__btn${styleUrl === s.url ? ' mp-toolbar__btn--active' : ''}`}
//             onClick={() => handleStyleChange(s.url)}
//           >
//             {s.label}
//           </button>
//         ))}
//         <div className="mp-toolbar__sep" />
//         <button
//           className={`mp-toolbar__btn${terrain3D ? ' mp-toolbar__btn--active' : ''}`}
//           onClick={toggleTerrain}
//         >
//           ⛰ Relief 3D
//         </button>
//       </div>

//       {/* HUD NIVEAU */}
//       <div className="mp-hud">
//         <div className="mp-hud__dot" style={{ background: hudColor, boxShadow: `0 0 10px ${hudColor}` }} />
//         <span className="mp-hud__label">{hudLabel}</span>
//         <span className="mp-hud__value" style={{ color: hudColor, textShadow: `0 0 14px ${hudColor}88` }}>
//           +{seaRise.toFixed(2)} m
//         </span>
//       </div>

//       {/* LÉGENDE */}
//       <div className="mp-legend">
//         <span className="mp-legend__title">Zones côtières</span>
//         {[
//           { color: '#43A047', label: 'Sûr'       },
//           { color: '#FBC02D', label: 'Menacé'     },
//           { color: '#F57C00', label: 'En danger'  },
//           { color: '#E64A19', label: 'Critique'   },
//           { color: '#D32F2F', label: 'Submergé'   },
//         ].map(({ color, label }) => (
//           <div className="mp-legend__row" key={label}>
//             <div className="mp-legend__dot" style={{ background: color, boxShadow: `0 0 6px ${color}88` }} />
//             {label}
//           </div>
//         ))}
//       </div>

//       {/* SEA LEVEL CONTROL */}
//       <SeaLevelControl seaRise={seaRise} onChange={setSeaRise} />

//       {/* BADGE */}
//       <div className="mp-badge">
//         Pacific Dataviz Challenge 2026<br />
//         Sea Level Rise · Pacific Ocean
//       </div>
//     </div>
//   );
// }

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Map, { NavigationControl, Layer, Marker, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapPage.scss';

import { VULNERABLE_ZONES, getZoneStatus } from '../../data/seaLevelData';
import SeaLevelControl from '../../components/SeaLevelControl';

const TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

const NOAA_STATIONS = [
  {
    id: '1612340',
    label: 'Honolulu, Hawaii',
    country: 'USA',
    longitude: -157.867,
    latitude: 21.303,
  },
  {
    id: '1770000',
    label: 'Pago Pago, Samoa américaines',
    country: 'USA',
    longitude: -170.69,
    latitude: -14.28,
  },
  {
    id: '1630000',
    label: 'Apra Harbor, Guam',
    country: 'USA',
    longitude: 144.657,
    latitude: 13.443,
  },
];

const STYLES = [
  { id: 'sat', label: 'Satellite', url: 'mapbox://styles/mapbox/satellite-v9' },
  { id: 'sat2', label: 'Sat + Rues', url: 'mapbox://styles/mapbox/satellite-streets-v12' },
  { id: 'dark', label: 'Sombre', url: 'mapbox://styles/mapbox/dark-v11' },
  { id: 'out', label: 'Relief', url: 'mapbox://styles/mapbox/outdoors-v12' },
];

const WATER_COLOR = (r) =>
  r < 0.3 ? '#1E88E5'
    : r < 1 ? '#0277BD'
      : r < 2 ? '#00838F'
        : r < 5 ? '#BF360C'
          : '#B71C1C';

const fetchNoaaWaterLevel = async (stationId) => {
  const url = new URL('https://api.tidesandcurrents.noaa.gov/api/prod/datagetter');

  url.searchParams.set('station', stationId);
  url.searchParams.set('product', 'water_level');
  url.searchParams.set('date', 'latest');
  url.searchParams.set('datum', 'MSL');
  url.searchParams.set('units', 'metric');
  url.searchParams.set('time_zone', 'gmt');
  url.searchParams.set('format', 'json');
  url.searchParams.set('application', 'pacific-sea-level-map');

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`NOAA API HTTP ${response.status}`);
  }

  const json = await response.json();

  if (json.error) {
    throw new Error(json.error.message || 'Erreur NOAA');
  }

  const row = json.data?.[0];

  if (!row) {
    throw new Error('Aucune donnée NOAA disponible pour cette station.');
  }

  return {
    value: Number(row.v),
    time: row.t,
    stationId,
    raw: row,
  };
};

const ZoneMarker = React.memo(({ zone, seaRise, onSelect }) => {
  const { status, color, urgency } = getZoneStatus(zone.properties.elevation, seaRise);
  const size = urgency >= 3 ? 20 : urgency >= 2 ? 15 : 10;

  const renderShape = () => {
    if (urgency >= 3) {
      return (
        <svg width={size * 2} height={size * 2} viewBox="0 0 100 100" overflow="visible">
          <polygon points="50,2 98,50 50,98 2,50" fill={`${color}15`} stroke={`${color}55`} strokeWidth="1.5" />
          <polygon points="50,16 82,50 50,84 18,50" fill={color} stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
          <polygon points="50,22 72,44 50,34" fill="rgba(255,255,255,0.4)" />
          <circle cx="50" cy="50" r="5" fill="rgba(255,255,255,0.9)" />
        </svg>
      );
    }

    if (urgency >= 2) {
      return (
        <svg width={size * 2} height={size * 2} viewBox="0 0 100 100" overflow="visible">
          <polygon points="50,10 90,80 10,80" fill={`${color}20`} stroke={`${color}55`} strokeWidth="1.5" />
          <polygon points="50,22 78,72 22,72" fill={color} stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" />
          <line x1="50" y1="32" x2="50" y2="58" stroke="rgba(255,255,255,0.85)" strokeWidth="4" strokeLinecap="round" />
          <circle cx="50" cy="67" r="4" fill="rgba(255,255,255,0.9)" />
        </svg>
      );
    }

    if (urgency === 1) {
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = Math.PI / 180 * (60 * i - 30);
        return `${50 + 36 * Math.cos(a)},${50 + 36 * Math.sin(a)}`;
      }).join(' ');

      return (
        <svg width={size * 2} height={size * 2} viewBox="0 0 100 100" overflow="visible">
          <polygon points={pts} fill={color} stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="10" fill="rgba(255,255,255,0.75)" />
        </svg>
      );
    }

    return (
      <svg width={size * 2} height={size * 2} viewBox="0 0 100 100" overflow="visible">
        <circle cx="50" cy="50" r="30" fill="none" stroke={color} strokeWidth="2.5" strokeDasharray="8 5" opacity="0.7" />
        <circle cx="50" cy="50" r="12" fill={color} opacity="0.8" />
      </svg>
    );
  };

  return (
    <Marker
      longitude={zone.geometry.coordinates[0]}
      latitude={zone.geometry.coordinates[1]}
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onSelect({ ...zone, status, color });
      }}
    >
      <div className="mp-marker">
        {urgency >= 3 && (
          <div
            className="mp-marker__ring"
            style={{
              width: `${size * 4}px`,
              height: `${size * 4}px`,
              marginLeft: `${-size * 2}px`,
              marginTop: `${-size * 2}px`,
              border: `1.5px solid ${color}`,
              background: `${color}12`,
            }}
          />
        )}

        <div className="mp-marker__shape" style={{ filter: `drop-shadow(0 0 ${urgency * 4 + 4}px ${color})` }}>
          {renderShape()}
        </div>
      </div>
    </Marker>
  );
});

const ZonePopup = React.memo(({ zone, seaRise, onClose }) => {
  const { color } = getZoneStatus(zone.properties.elevation, seaRise);
  const p = zone.properties;
  const margin = p.elevation - seaRise;

  return (
    <Popup
      longitude={zone.geometry.coordinates[0]}
      latitude={zone.geometry.coordinates[1]}
      onClose={onClose}
      closeOnClick={false}
      anchor="bottom"
      offset={28}
    >
      <div
        className="mp-popup"
        style={{
          border: `1px solid ${color}50`,
          boxShadow: `0 12px 48px rgba(0,0,0,0.75), 0 0 0 1px ${color}18`,
        }}
      >
        <div className="mp-popup__head">
          <span className="mp-popup__flag">{p.flag || '🌍'}</span>

          <div className="mp-popup__info">
            <div className="mp-popup__name">{p.name}</div>
            <div className="mp-popup__sub">{p.country} · {p.region}</div>
          </div>

          <div className="mp-popup__tag" style={{ background: `${color}20`, border: `1px solid ${color}`, color }}>
            {(zone.status || '').toUpperCase()}
          </div>
        </div>

        {[
          ['🏔 Altitude', `${p.elevation} m`, null],
          ['👥 Population', p.population?.toLocaleString('fr-FR') || '—', null],
          [
            '⚠ Marge',
            `${margin > 0 ? '+' : ''}${margin.toFixed(1)} m`,
            margin <= 0 ? '#ff5252' : margin < 2 ? '#ffd740' : '#69f0ae',
          ],
        ].map(([l, v, c]) => (
          <div className="mp-popup__row" key={l}>
            <span className="mp-popup__row-label">{l}</span>
            <span className="mp-popup__row-value" style={c ? { color: c } : {}}>
              {v}
            </span>
          </div>
        ))}

        {p.description && <p className="mp-popup__desc">{p.description}</p>}
      </div>
    </Popup>
  );
});

export default function MapPage() {
  const [styleUrl, setStyleUrl] = useState(STYLES[0].url);
  const [terrain3D, setTerrain3D] = useState(true);
  const [seaRise, setSeaRise] = useState(0);
  const [selected, setSelected] = useState(null);

  const [noaaStationId, setNoaaStationId] = useState(NOAA_STATIONS[0].id);
  const [includeNoaaLevel, setIncludeNoaaLevel] = useState(false);
  const [noaaLevel, setNoaaLevel] = useState(null);
  const [noaaLoading, setNoaaLoading] = useState(false);
  const [noaaError, setNoaaError] = useState(null);

  const mapRef = useRef();

  const selectedNoaaStation = useMemo(
    () => NOAA_STATIONS.find((s) => s.id === noaaStationId) || NOAA_STATIONS[0],
    [noaaStationId]
  );

  const effectiveSeaRise = useMemo(() => {
    const observed = includeNoaaLevel && Number.isFinite(noaaLevel?.value)
      ? noaaLevel.value
      : 0;

    return Math.max(0, seaRise + observed);
  }, [seaRise, includeNoaaLevel, noaaLevel]);

  const loadNoaa = useCallback(async (stationId = noaaStationId) => {
    setNoaaLoading(true);
    setNoaaError(null);

    try {
      const data = await fetchNoaaWaterLevel(stationId);
      setNoaaLevel(data);
    } catch (err) {
      setNoaaError(err.message || 'Erreur de chargement NOAA');
      setNoaaLevel(null);
    } finally {
      setNoaaLoading(false);
    }
  }, [noaaStationId]);

  useEffect(() => {
    loadNoaa(noaaStationId);
  }, [noaaStationId, loadNoaa]);

  const ensureDem = useCallback((map) => {
    if (!map.getSource('mapbox-dem')) {
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });
    }
  }, []);

  const addFloodLayers = useCallback((map) => {
    if (!map.getSource('terrain-v2')) {
      map.addSource('terrain-v2', {
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-terrain-v2',
      });
    }

    if (!map.getLayer('flood-fill')) {
      map.addLayer({
        id: 'flood-fill',
        type: 'fill',
        source: 'terrain-v2',
        'source-layer': 'contour',
        filter: ['<=', ['get', 'ele'], 0],
        paint: {
          'fill-color': '#1E88E5',
          'fill-opacity': 0.5,
        },
      });
    }

    if (!map.getLayer('flood-line')) {
      map.addLayer({
        id: 'flood-line',
        type: 'line',
        source: 'terrain-v2',
        'source-layer': 'contour',
        filter: ['<=', ['get', 'ele'], 0],
        paint: {
          'line-color': '#29B6F6',
          'line-width': 1.5,
          'line-opacity': 0.9,
        },
      });
    }
  }, []);

  const updateFloodLayer = useCallback((rise) => {
    const map = mapRef.current?.getMap();

    if (!map?.isStyleLoaded()) return;

    if (!map.getLayer('flood-fill')) {
      addFloodLayers(map);
      return;
    }

    const color = WATER_COLOR(rise);
    const opacity = Math.min(0.35 + rise * 0.06, 0.75);

    map.setFilter('flood-fill', ['<=', ['get', 'ele'], rise]);
    map.setFilter('flood-line', ['<=', ['get', 'ele'], rise]);
    map.setPaintProperty('flood-fill', 'fill-color', color);
    map.setPaintProperty('flood-fill', 'fill-opacity', opacity);
    map.setPaintProperty('flood-line', 'line-color', color);
    map.setPaintProperty('flood-line', 'line-width', rise < 1 ? 1.5 : rise < 3 ? 2.5 : 3.5);
  }, [addFloodLayers]);

  const onMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();

    if (!map) return;

    ensureDem(map);
    map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
    addFloodLayers(map);
    updateFloodLayer(effectiveSeaRise);
  }, [ensureDem, addFloodLayers, updateFloodLayer, effectiveSeaRise]);

  useEffect(() => {
    updateFloodLayer(effectiveSeaRise);
  }, [effectiveSeaRise, updateFloodLayer]);

  const toggleTerrain = useCallback(() => {
    const map = mapRef.current?.getMap();

    if (!map) return;

    ensureDem(map);

    const next = !terrain3D;

    if (next) {
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
    } else {
      map.setTerrain(null);
    }

    setTerrain3D(next);
  }, [terrain3D, ensureDem]);

  const handleStyleChange = useCallback((url) => {
    setStyleUrl(url);
    setSelected(null);
  }, []);

  const hudColor = WATER_COLOR(effectiveSeaRise);
  const hudLabel =
    effectiveSeaRise < 0.1 ? 'Niveau actuel'
      : effectiveSeaRise < 0.5 ? 'Scénario modéré'
        : effectiveSeaRise < 1.5 ? 'GIEC pessimiste'
          : effectiveSeaRise < 3 ? 'Fonte Antarctique'
            : effectiveSeaRise < 6 ? 'Effondrement'
              : 'Monde transformé';

  return (
    <div className="map-page">
      <div className="map-page__map-wrap">
        <Map
          ref={mapRef}
          initialViewState={{
            longitude: 170,
            latitude: -16,
            zoom: 5,
            pitch: 50,
            bearing: -8,
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle={styleUrl}
          mapboxAccessToken={TOKEN}
          onLoad={onMapLoad}
          onStyleData={() => {
            const map = mapRef.current?.getMap();

            if (!map?.isStyleLoaded()) return;

            ensureDem(map);

            if (terrain3D) {
              map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
            }

            addFloodLayers(map);
            updateFloodLayer(effectiveSeaRise);
          }}
        >
          <NavigationControl position="top-right" />

          <Layer
            id="3d-buildings"
            source="composite"
            source-layer="building"
            filter={['==', 'extrude', 'true']}
            type="fill-extrusion"
            minzoom={14}
            paint={{
              'fill-extrusion-color': [
                'interpolate',
                ['linear'],
                ['get', 'height'],
                0,
                '#0d1b2a',
                50,
                '#1a3050',
                200,
                '#0d47a1',
              ],
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': ['get', 'min_height'],
              'fill-extrusion-opacity': 0.82,
            }}
          />

          {VULNERABLE_ZONES.features.map((z) => (
            <ZoneMarker
              key={z.properties.id}
              zone={z}
              seaRise={effectiveSeaRise}
              onSelect={setSelected}
            />
          ))}

          {selected && (
            <ZonePopup
              zone={selected}
              seaRise={effectiveSeaRise}
              onClose={() => setSelected(null)}
            />
          )}
        </Map>
      </div>

      <div className="mp-toolbar">
        {STYLES.map((s) => (
          <button
            key={s.id}
            className={`mp-toolbar__btn${styleUrl === s.url ? ' mp-toolbar__btn--active' : ''}`}
            onClick={() => handleStyleChange(s.url)}
          >
            {s.label}
          </button>
        ))}

        <div className="mp-toolbar__sep" />

        <button
          className={`mp-toolbar__btn${terrain3D ? ' mp-toolbar__btn--active' : ''}`}
          onClick={toggleTerrain}
        >
          ⛰ Relief 3D
        </button>
      </div>

      <div className="mp-hud">
        <div
          className="mp-hud__dot"
          style={{
            background: hudColor,
            boxShadow: `0 0 10px ${hudColor}`,
          }}
        />

        <span className="mp-hud__label">{hudLabel}</span>

        <span
          className="mp-hud__value"
          style={{
            color: hudColor,
            textShadow: `0 0 14px ${hudColor}88`,
          }}
        >
          +{effectiveSeaRise.toFixed(2)} m
        </span>
      </div>

      <div className="mp-legend">
        <span className="mp-legend__title">Zones côtières</span>

        {[
          { color: '#43A047', label: 'Sûr' },
          { color: '#FBC02D', label: 'Menacé' },
          { color: '#F57C00', label: 'En danger' },
          { color: '#E64A19', label: 'Critique' },
          { color: '#D32F2F', label: 'Submergé' },
        ].map(({ color, label }) => (
          <div className="mp-legend__row" key={label}>
            <div
              className="mp-legend__dot"
              style={{
                background: color,
                boxShadow: `0 0 6px ${color}88`,
              }}
            />
            {label}
          </div>
        ))}
      </div>

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
        Pacific Dataviz Challenge 2026<br />
        Sea Level Rise · Pacific Ocean
      </div>
    </div>
  );
}