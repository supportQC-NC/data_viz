// services/api.js
// ============================================================
// Pacific Dataviz Challenge 2026
// Service API — data.gouv.nc + ArcGIS Géorep
// ============================================================

// ─── Configuration ──────────────────────────────────────────

// Base URL de l'API OpenDataSoft data.gouv.nc
const ODS_BASE = 'https://data.gouv.nc/api/explore/v2.1/catalog/datasets';

// Base URL de l'API ArcGIS Géorep (pour les couches Météo-France)
const ARCGIS_BASE = 'https://georep-dtsi-sgt.opendata.arcgis.com/datasets';

// IDs des datasets
const DATASET_IDS = {
  cyclones: 'phenomenes-cycloniques-a-partir-de-19771978-dans-le-pacifique-sud-ouest-en-nouvelle-caledonie-et-a-wallis-et-futuna',
  surcote:  'surcote-et-vague-au-trait-de-cote-pour-un-cyclone-centennal',
};

// IDs ArcGIS des sous-couches cyclones (Géorep)
const ARCGIS_IDS = {
  ncSegments:   'dtsi-sgt::nouvelle-caledonie-segments',
  ncPoints:     'dtsi-sgt::nouvelle-caledonie-points',
  psoSegments:  'dtsi-sgt::pacifique-sud-ouest-segments',
  psoPoints:    'dtsi-sgt::pacifique-sud-ouest-points',
  referentiel:  'dtsi-sgt::referentiel-cyclones',
  enso:         'dtsi-sgt::phases-enso',
  surcote:      'dtsi-sgt::surcote-maximale-pour-un-cyclone-centennal',
  vague:        'dtsi-sgt::hauteur-significative-maximale-pour-un-cyclone-centennal',
  periode:      'dtsi-sgt::période-maximale-pour-un-cyclone-centennal',
};

// ─── Helpers ────────────────────────────────────────────────

/**
 * Construit l'URL d'export GeoJSON depuis data.gouv.nc (ODS v2.1)
 */
const odsGeoJsonUrl = (datasetId, params = {}) => {
  const base = `${ODS_BASE}/${datasetId}/exports/geojson`;
  const qs   = new URLSearchParams({
    timezone:   'UTC',
    use_labels: 'false',
    epsg:       '4326',
    ...params,
  });
  return `${base}?${qs.toString()}`;
};

/**
 * Construit l'URL d'export GeoJSON depuis ArcGIS Géorep
 */
const arcgisGeoJsonUrl = (layerId, params = {}) => {
  const base = `${ARCGIS_BASE}/${layerId}.geojson`;
  const qs   = new URLSearchParams({
    outSR:        '{"latestWkid":4326}',
    where:        '1=1',
    outFields:    '*',
    f:            'geojson',
    ...params,
  });
  return `${base}?${qs.toString()}`;
};

/**
 * Fetch générique avec timeout et retry
 */
const fetchWithTimeout = async (url, options = {}, timeoutMs = 30000) => {
  const controller = new AbortController();
  const id         = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
    return await res.json();
  } catch (err) {
    clearTimeout(id);
    if (err.name === 'AbortError') throw new Error(`Timeout après ${timeoutMs}ms — ${url}`);
    throw err;
  }
};

/**
 * Fetch avec fallback sur mock si l'API est inaccessible
 */
const fetchWithFallback = async (url, fallbackFn, label) => {
  try {
    const data = await fetchWithTimeout(url);
    console.info(`✅ [API] ${label} chargé depuis data.gouv.nc`);
    return data;
  } catch (err) {
    console.warn(`⚠️ [API] ${label} — fallback sur données mock (${err.message})`);
    return fallbackFn();
  }
};

// ─── Données Mock (fallback si API inaccessible) ─────────────

/**
 * Génère des trajectoires cycloniques mockées pour le Pacifique SW
 * Basé sur des cyclones historiques réels (noms et zones approximatifs)
 */
const mockCyclonesSegments = () => {
  const historicalCyclones = [
    { nom: 'Beni',     saison: '2002-2003', cat: 'ITC',  coords: [[165.2,-14.5],[166.1,-16.2],[166.8,-18.4],[167.2,-20.1],[167.5,-21.8]] },
    { nom: 'Erica',    saison: '2002-2003', cat: 'ITC',  coords: [[163.5,-14.0],[164.2,-15.8],[165.0,-17.5],[165.8,-19.2],[166.2,-21.0]] },
    { nom: 'Niran',    saison: '2020-2021', cat: 'ITC',  coords: [[160.0,-16.0],[161.5,-17.5],[163.0,-19.0],[164.2,-20.8],[165.0,-22.5]] },
    { nom: 'Cook',     saison: '2016-2017', cat: 'STC',  coords: [[170.5,-13.0],[170.0,-15.5],[169.5,-17.8],[168.8,-19.5],[168.0,-21.0],[167.2,-22.8]] },
    { nom: 'Donna',    saison: '2016-2017', cat: 'ITC',  coords: [[167.5,-12.5],[168.0,-14.8],[168.5,-17.0],[169.0,-19.2],[169.2,-21.5]] },
    { nom: 'Harold',   saison: '2019-2020', cat: 'ITC',  coords: [[165.8,-13.5],[164.5,-14.8],[163.2,-16.2],[162.5,-18.0],[162.0,-20.2],[161.8,-22.0]] },
    { nom: 'Gina',     saison: '2002-2003', cat: 'TC',   coords: [[162.5,-15.5],[163.5,-17.2],[164.2,-18.8],[164.8,-20.5],[165.2,-22.2]] },
    { nom: 'Zoe',      saison: '2002-2003', cat: 'ITC',  coords: [[170.5,-11.8],[170.0,-13.5],[169.5,-15.5],[169.2,-17.8],[169.0,-20.0]] },
    { nom: 'Oscar',    saison: '2018-2019', cat: 'STC',  coords: [[173.5,-15.5],[172.8,-17.0],[171.8,-18.8],[170.8,-20.2],[169.8,-21.8],[168.8,-23.0]] },
    { nom: 'Lucas',    saison: '1997-1998', cat: 'TC',   coords: [[166.0,-17.5],[166.5,-19.0],[167.0,-20.5],[167.2,-22.0],[167.0,-23.5]] },
    { nom: 'Hina',     saison: '2014-2015', cat: 'TC',   coords: [[163.8,-14.8],[164.2,-16.5],[164.8,-18.2],[165.2,-20.0],[165.8,-21.8]] },
    { nom: 'Lusi',     saison: '2013-2014', cat: 'ITC',  coords: [[169.2,-13.2],[168.8,-15.5],[168.5,-17.8],[168.2,-20.2],[168.0,-22.5]] },
    { nom: 'Freda',    saison: '1980-1981', cat: 'STC',  coords: [[167.5,-16.0],[167.8,-17.8],[168.0,-19.5],[168.2,-21.2],[168.0,-23.0]] },
    { nom: 'Nigel',    saison: '1984-1985', cat: 'TC',   coords: [[166.2,-15.8],[166.5,-17.5],[166.8,-19.2],[167.0,-21.0],[167.2,-22.8]] },
    { nom: 'Beti',     saison: '1994-1995', cat: 'ITC',  coords: [[165.0,-14.2],[165.5,-16.0],[166.0,-17.8],[166.2,-19.5],[166.5,-21.5]] },
  ];

  const catColors = {
    'TD':  '#90caf9',  // Dépression tropicale
    'TS':  '#64b5f6',  // Tempête tropicale
    'TC':  '#ffb74d',  // Cyclone tropical
    'STC': '#ff7043',  // Cyclone tropical sévère
    'ITC': '#ef5350',  // Cyclone tropical intense
  };

  const features = historicalCyclones.map((c) => ({
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: c.coords,
    },
    properties: {
      nom:       c.nom,
      saison:    c.saison,
      categorie: c.cat,
      color:     catColors[c.cat] || '#90caf9',
      vent_max:  c.cat === 'ITC' ? 185 : c.cat === 'STC' ? 145 : c.cat === 'TC' ? 105 : 75,
      pression_min: c.cat === 'ITC' ? 910 : c.cat === 'STC' ? 940 : c.cat === 'TC' ? 970 : 990,
      mock:      true,
    },
  }));

  return { type: 'FeatureCollection', features };
};

/**
 * Génère des points de surcote mockés sur le trait de côte NC
 */
const mockSurcoteData = () => {
  // Points clés du littoral de Nouvelle-Calédonie (Grande Terre + îles)
  const coastlinePoints = [
    // Côte Ouest Grande Terre
    [166.45, -22.27], [166.42, -22.20], [166.38, -22.15], [166.35, -22.10],
    [166.30, -22.05], [166.28, -22.00], [166.25, -21.95], [166.20, -21.88],
    [166.15, -21.80], [166.10, -21.72], [166.05, -21.65], [166.00, -21.58],
    [165.95, -21.50], [165.88, -21.42], [165.82, -21.35], [165.75, -21.28],
    [165.68, -21.20], [165.62, -21.12], [165.55, -21.05], [165.48, -20.98],
    [165.40, -20.90], [165.32, -20.82], [165.25, -20.75], [165.18, -20.68],
    [165.10, -20.60], [165.05, -20.52], [164.98, -20.45], [164.90, -20.38],
    [164.82, -20.30], [164.75, -20.22], [164.68, -20.15], [164.60, -20.08],
    // Côte Est Grande Terre
    [167.00, -20.50], [167.05, -20.58], [167.10, -20.65], [167.15, -20.72],
    [167.20, -20.80], [167.25, -20.88], [167.30, -20.95], [167.35, -21.02],
    [167.40, -21.10], [167.42, -21.18], [167.45, -21.25], [167.48, -21.32],
    [167.50, -21.40], [167.52, -21.48], [167.55, -21.55], [167.57, -21.62],
    [167.58, -21.70], [167.60, -21.78], [167.62, -21.85], [167.65, -21.92],
    [167.68, -22.00], [167.70, -22.08], [167.72, -22.15], [167.75, -22.22],
    // Île des Pins
    [167.48, -22.60], [167.50, -22.65], [167.52, -22.68], [167.55, -22.72],
    [167.58, -22.68], [167.60, -22.65], [167.62, -22.60], [167.58, -22.56],
    // Îles Loyauté (Lifou)
    [167.00, -20.92], [167.02, -20.88], [167.05, -20.85], [167.08, -20.88],
    [167.10, -20.92], [167.08, -20.96], [167.05, -21.00], [167.02, -20.96],
    // Maré
    [168.00, -21.50], [168.02, -21.55], [168.05, -21.58], [168.08, -21.55],
    [168.10, -21.50], [168.08, -21.45], [168.05, -21.42], [168.02, -21.45],
    // Ouvéa
    [166.52, -20.62], [166.55, -20.58], [166.58, -20.55], [166.60, -20.58],
    [166.62, -20.62], [166.60, -20.66], [166.57, -20.68], [166.54, -20.66],
  ];

  // Génère des valeurs de surcote réalistes avec variation spatiale
  const features = coastlinePoints.map(([lon, lat], i) => {
    // Les zones exposées à l'Est ont des valeurs plus élevées
    const exposureBonus = lon > 166.8 ? 0.8 : 0;
    // Variabilité spatiale
    const base       = 0.3 + Math.random() * 1.8 + exposureBonus;
    const surcote    = Math.min(4.0, base);
    const vague      = surcote * (2.5 + Math.random() * 2.0);
    const periode    = 8 + Math.random() * 8;

    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lon, lat] },
      properties: {
        surcote_max:              Math.round(surcote * 100) / 100,
        hauteur_significative_max: Math.round(vague * 100) / 100,
        periode_max:              Math.round(periode * 10) / 10,
        // Catégorie de danger
        danger:
          surcote >= 2.5 ? 'extreme'  :
          surcote >= 1.5 ? 'high'     :
          surcote >= 1.0 ? 'moderate' : 'low',
        mock: true,
      },
    };
  });

  return { type: 'FeatureCollection', features };
};

/**
 * Données mock pour le référentiel cyclones
 */
const mockCyclonesRef = () => [
  { nom: 'Niran',  saison: '2020-2021', cat_max: 'ITC', vent_max: 205, pression_min: 888, decede: 0, enso: 'La Nina' },
  { nom: 'Cook',   saison: '2016-2017', cat_max: 'STC', vent_max: 175, pression_min: 930, decede: 7, enso: 'Neutral' },
  { nom: 'Harold', saison: '2019-2020', cat_max: 'ITC', vent_max: 215, pression_min: 895, decede: 24, enso: 'El Nino' },
  { nom: 'Donna',  saison: '2016-2017', cat_max: 'ITC', vent_max: 185, pression_min: 910, decede: 0, enso: 'Neutral' },
  { nom: 'Oscar',  saison: '2018-2019', cat_max: 'STC', vent_max: 155, pression_min: 935, decede: 2, enso: 'Neutral' },
  { nom: 'Beni',   saison: '2002-2003', cat_max: 'ITC', vent_max: 190, pression_min: 905, decede: 0, enso: 'El Nino' },
  { nom: 'Erica',  saison: '2002-2003', cat_max: 'ITC', vent_max: 195, pression_min: 900, decede: 0, enso: 'El Nino' },
  { nom: 'Zoe',    saison: '2002-2003', cat_max: 'ITC', vent_max: 250, pression_min: 890, decede: 0, enso: 'El Nino' },
];

// ─── Fonctions API Publiques ─────────────────────────────────

/**
 * Charge les trajectoires cycloniques (segments) zone Nouvelle-Calédonie
 * Source primaire : ArcGIS Géorep / Météo-France
 * Fallback : données mock
 */
export const fetchCyclonesSegments = async () => {
  // Tentative via ArcGIS Géorep
  const arcgisUrl = arcgisGeoJsonUrl(ARCGIS_IDS.ncSegments, {
    resultRecordCount: 5000,
  });

  return fetchWithFallback(arcgisUrl, mockCyclonesSegments, 'Cyclones Segments NC');
};

/**
 * Charge les positions horodatées des cyclones (points) zone NC
 */
export const fetchCyclonesPoints = async () => {
  const arcgisUrl = arcgisGeoJsonUrl(ARCGIS_IDS.ncPoints, {
    resultRecordCount: 10000,
  });

  return fetchWithFallback(arcgisUrl, () => ({ type: 'FeatureCollection', features: [] }), 'Cyclones Points NC');
};

/**
 * Charge le référentiel cyclones (métadonnées : noms, catégories, ENSO)
 */
export const fetchCyclonesRef = async () => {
  const arcgisUrl = `${ARCGIS_BASE}/${ARCGIS_IDS.referentiel}.geojson?where=1=1&outFields=*&f=geojson`;

  try {
    const data = await fetchWithTimeout(arcgisUrl);
    console.info('✅ [API] Référentiel cyclones chargé');
    // Transforme en array simple de propriétés
    return data.features?.map((f) => f.properties) || [];
  } catch (err) {
    console.warn(`⚠️ [API] Référentiel cyclones — fallback mock (${err.message})`);
    return mockCyclonesRef();
  }
};

/**
 * Charge les données de surcote côtière (points tous les 100m)
 * Source : data.gouv.nc / DIMENC-IRD
 */
export const fetchSurcoteData = async () => {
  // Tentative via l'API ODS data.gouv.nc
  const odsUrl = odsGeoJsonUrl(DATASET_IDS.surcote, {
    limit: 10000,
  });

  return fetchWithFallback(odsUrl, mockSurcoteData, 'Surcote côtière');
};

/**
 * Charge les données Pacifique SW (zone élargie pour vue régionale)
 */
export const fetchCyclonesPacifique = async () => {
  const arcgisUrl = arcgisGeoJsonUrl(ARCGIS_IDS.psoSegments, {
    resultRecordCount: 5000,
  });

  return fetchWithFallback(arcgisUrl, mockCyclonesSegments, 'Cyclones Pacifique SW');
};

/**
 * Charge les phases ENSO par saison cyclonique
 */
export const fetchEnsoPhases = async () => {
  const arcgisUrl = `${ARCGIS_BASE}/${ARCGIS_IDS.enso}.geojson?where=1=1&outFields=*&f=geojson`;

  try {
    const data = await fetchWithTimeout(arcgisUrl);
    return data.features?.map((f) => f.properties) || [];
  } catch (err) {
    console.warn('⚠️ [API] Phases ENSO non disponibles');
    return [];
  }
};