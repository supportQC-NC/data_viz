// src/data/seaLevelData.js
// ============================================================
// Architecture: Pacific Dataviz Challenge 2026
// v2.0 — Ajout zones mangroves + données enrichies
// Sources mockées — prêtes pour swap open-data IPCC/NOAA/JAXA
// ============================================================

export const SEA_LEVEL_SCENARIOS = [
  {
    id: 'baseline',
    year: 2025,
    rise: 0,
    label: "Aujourd'hui",
    shortLabel: '2025',
    description: 'Niveau de référence actuel (0 m). Données NOAA 2025.',
    ipccScenario: null,
    co2ppm: 424,
    tempAnomaly: 1.2,
    arcticIceLoss: 0,
    color: '#00E5FF',
    waveIntensity: 0.15,
    particleCount: 80,
    skyGradient: ['#0a1628', '#0d2240'],
  },
  {
    id: 'ssp126_2050',
    year: 2050,
    rise: 0.3,
    label: '2050 — Transition réussie',
    shortLabel: '2050',
    description: '+30 cm · Scénario SSP1-2.6 GIEC. Émissions maîtrisées, réchauffement limité à +1.5°C.',
    ipccScenario: 'SSP1-2.6',
    co2ppm: 440,
    tempAnomaly: 1.5,
    arcticIceLoss: 18,
    color: '#29B6F6',
    waveIntensity: 0.28,
    particleCount: 110,
    skyGradient: ['#0a1a30', '#0e2a4a'],
  },
  {
    id: 'ssp585_2100',
    year: 2100,
    rise: 1.0,
    label: '2100 — GIEC Pessimiste',
    shortLabel: '2100',
    description: '+1 m · Scénario SSP5-8.5. Émissions non maîtrisées, réchauffement +4.4°C.',
    ipccScenario: 'SSP5-8.5',
    co2ppm: 1135,
    tempAnomaly: 4.4,
    arcticIceLoss: 45,
    color: '#039BE5',
    waveIntensity: 0.52,
    particleCount: 160,
    skyGradient: ['#071520', '#0a1e35'],
  },
  {
    id: 'antarctica_2100',
    year: 2100,
    rise: 2.0,
    label: '2100 — Fonte Antarctique',
    shortLabel: '+2m',
    description: '+2 m · Instabilité des calottes ouest-antarctiques. Scénario de queue haute.',
    ipccScenario: 'MICI',
    co2ppm: 1135,
    tempAnomaly: 5.0,
    arcticIceLoss: 60,
    color: '#F57C00',
    waveIntensity: 0.70,
    particleCount: 220,
    skyGradient: ['#120a05', '#1a0f08'],
  },
  {
    id: 'collapse_2150',
    year: 2150,
    rise: 5.0,
    label: '2150 — Effondrement climatique',
    shortLabel: '+5m',
    description: '+5 m · Fonte combinée Groenland + Antarctique occidental. Mégavilles côtières englouties.',
    ipccScenario: 'Collapse',
    co2ppm: null,
    tempAnomaly: 6.5,
    arcticIceLoss: 80,
    color: '#E53935',
    waveIntensity: 0.88,
    particleCount: 320,
    skyGradient: ['#1a0505', '#2a0808'],
  },
  {
    id: 'greenland_2300',
    year: 2300,
    rise: 12.0,
    label: '2300 — Monde transformé',
    shortLabel: '+12m',
    description: '+12 m · Fonte totale Groenland. Disparition de centaines de villes côtières mondiales.',
    ipccScenario: 'Extreme',
    co2ppm: null,
    tempAnomaly: 8.0,
    arcticIceLoss: 95,
    color: '#B71C1C',
    waveIntensity: 0.97,
    particleCount: 450,
    skyGradient: ['#100202', '#200404'],
  },
  {
    id: 'total_melt_2500',
    year: 2500,
    rise: 70.0,
    label: '2500 — Fonte totale des pôles',
    shortLabel: '+70m',
    description: '+70 m · Fonte complète Groenland + Antarctique. Cartes du monde redessinées.',
    ipccScenario: 'TotalMelt',
    co2ppm: null,
    tempAnomaly: null,
    arcticIceLoss: 100,
    color: '#4A0000',
    waveIntensity: 1.0,
    particleCount: 600,
    skyGradient: ['#080000', '#150101'],
  },
];

// ─────────────────────────────────────────────
// ZONES MANGROVES — PACIFIQUE
// Source future : JAXA Global Mangrove Watch (GMW v3.0)
// Données annuelles 1996–2020, résolution 25m
// ─────────────────────────────────────────────

export const MANGROVE_ZONES = {
  type: 'FeatureCollection',
  features: [
    // ── NOUVELLE-CALÉDONIE ────────────────────────────
    {
      type: 'Feature',
      properties: {
        id: 'nc-west-coast',
        name: 'Côte Ouest — Grande Terre',
        country: 'Nouvelle-Calédonie',
        flag: '🇳🇨',
        region: 'Pacifique Sud-Ouest',
        areaHa: 18500,             // Hectares total mangroves
        healthIndex: 0.62,         // 0–1 (1 = pristine)
        lossRate: 0.8,             // % perte annuelle
        lossHa1990_2020: 3200,     // Ha perdus depuis 1990
        protectionLevel: 'partial',// none / partial / protected
        carbonTonnesHa: 850,       // tCO₂e / ha stocké
        speciesCount: 4,           // Espèces de mangroves
        dominantSpecies: 'Avicennia marina',
        threatsMain: ['Nickel mining runoff', 'Agriculture', 'Urbanisation'],
        submersionRise: 1.0,
        gmwCoverage: true,
        color: '#4CAF50',
        coordinates: [165.8, -21.2],
      },
      geometry: {
        type: 'Point',
        coordinates: [165.8, -21.2],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'nc-noumea-lagoon',
        name: 'Lagon de Nouméa',
        country: 'Nouvelle-Calédonie',
        flag: '🇳🇨',
        region: 'Pacifique Sud-Ouest',
        areaHa: 2800,
        healthIndex: 0.45,
        lossRate: 1.8,
        lossHa1990_2020: 680,
        protectionLevel: 'partial',
        carbonTonnesHa: 780,
        speciesCount: 3,
        dominantSpecies: 'Rhizophora stylosa',
        threatsMain: ['Urbanisation côtière', 'Pollution portuaire', 'Dragage'],
        submersionRise: 0.8,
        gmwCoverage: true,
        color: '#FF9800',
        coordinates: [166.32, -22.15],
      },
      geometry: {
        type: 'Point',
        coordinates: [166.32, -22.15],
      },
    },

    // ── FIDJI ─────────────────────────────────────────
    {
      type: 'Feature',
      properties: {
        id: 'fiji-viti-levu-north',
        name: 'Viti Levu — Côte Nord',
        country: 'Fidji',
        flag: '🇫🇯',
        region: 'Pacifique Sud',
        areaHa: 42000,
        healthIndex: 0.71,
        lossRate: 0.5,
        lossHa1990_2020: 4800,
        protectionLevel: 'protected',
        carbonTonnesHa: 920,
        speciesCount: 6,
        dominantSpecies: 'Bruguiera gymnorhiza',
        threatsMain: ['Aquaculture crevettes', 'Déforestation agricole'],
        submersionRise: 1.2,
        gmwCoverage: true,
        color: '#4CAF50',
        coordinates: [177.8, -17.2],
      },
      geometry: {
        type: 'Point',
        coordinates: [177.8, -17.2],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'fiji-rewa-delta',
        name: 'Delta de la Rewa',
        country: 'Fidji',
        flag: '🇫🇯',
        region: 'Pacifique Sud',
        areaHa: 8500,
        healthIndex: 0.58,
        lossRate: 1.2,
        lossHa1990_2020: 1900,
        protectionLevel: 'none',
        carbonTonnesHa: 860,
        speciesCount: 5,
        dominantSpecies: 'Ceriops tagal',
        threatsMain: ['Agriculture sucrière', 'Sédimentation', 'Cyclones répétés'],
        submersionRise: 0.9,
        gmwCoverage: true,
        color: '#FF9800',
        coordinates: [178.3, -18.0],
      },
      geometry: {
        type: 'Point',
        coordinates: [178.3, -18.0],
      },
    },

    // ── VANUATU ───────────────────────────────────────
    {
      type: 'Feature',
      properties: {
        id: 'vanuatu-espiritu-santo',
        name: 'Espiritu Santo',
        country: 'Vanuatu',
        flag: '🇻🇺',
        region: 'Pacifique Sud',
        areaHa: 12000,
        healthIndex: 0.80,
        lossRate: 0.3,
        lossHa1990_2020: 800,
        protectionLevel: 'protected',
        carbonTonnesHa: 1100,
        speciesCount: 7,
        dominantSpecies: 'Rhizophora apiculata',
        threatsMain: ['Exploitation forestière', 'Cyclones catégorie 4-5'],
        submersionRise: 1.5,
        gmwCoverage: true,
        color: '#2E7D32',
        coordinates: [167.0, -15.4],
      },
      geometry: {
        type: 'Point',
        coordinates: [167.0, -15.4],
      },
    },

    // ── SALOMON ───────────────────────────────────────
    {
      type: 'Feature',
      properties: {
        id: 'solomon-new-georgia',
        name: 'Nouvelle-Géorgie',
        country: 'Îles Salomon',
        flag: '🇸🇧',
        region: 'Pacifique Sud-Ouest',
        areaHa: 38000,
        healthIndex: 0.83,
        lossRate: 0.4,
        lossHa1990_2020: 2800,
        protectionLevel: 'partial',
        carbonTonnesHa: 1050,
        speciesCount: 9,
        dominantSpecies: 'Sonneratia alba',
        threatsMain: ['Exploitation forestière industrielle', 'Pêche'],
        submersionRise: 2.0,
        gmwCoverage: true,
        color: '#2E7D32',
        coordinates: [157.5, -8.5],
      },
      geometry: {
        type: 'Point',
        coordinates: [157.5, -8.5],
      },
    },

    // ── PAPOUASIE-NOUVELLE-GUINÉE ──────────────────────
    {
      type: 'Feature',
      properties: {
        id: 'png-fly-river',
        name: 'Delta du fleuve Fly',
        country: 'Papouasie-Nouvelle-Guinée',
        flag: '🇵🇬',
        region: 'Mélanésie',
        areaHa: 520000,
        healthIndex: 0.75,
        lossRate: 0.6,
        lossHa1990_2020: 48000,
        protectionLevel: 'none',
        carbonTonnesHa: 980,
        speciesCount: 12,
        dominantSpecies: 'Xylocarpus granatum',
        threatsMain: ['Mines Ok Tedi (pollution)', 'Déforestation', 'Sédimentation'],
        submersionRise: 3.0,
        gmwCoverage: true,
        color: '#FF5722',
        coordinates: [141.2, -8.5],
      },
      geometry: {
        type: 'Point',
        coordinates: [141.2, -8.5],
      },
    },

    // ── INDONÉSIE ─────────────────────────────────────
    {
      type: 'Feature',
      properties: {
        id: 'indonesia-papua',
        name: 'Papouasie occidentale',
        country: 'Indonésie',
        flag: '🇮🇩',
        region: 'Asie-Pacifique',
        areaHa: 2800000,
        healthIndex: 0.70,
        lossRate: 1.0,
        lossHa1990_2020: 380000,
        protectionLevel: 'partial',
        carbonTonnesHa: 1200,
        speciesCount: 18,
        dominantSpecies: 'Rhizophora mucronata',
        threatsMain: ['Huile de palme', 'Crevetticulture', 'Charbon de bois'],
        submersionRise: 2.5,
        gmwCoverage: true,
        color: '#FF9800',
        coordinates: [133.0, -4.5],
      },
      geometry: {
        type: 'Point',
        coordinates: [133.0, -4.5],
      },
    },

    // ── AUSTRALIE ─────────────────────────────────────
    {
      type: 'Feature',
      properties: {
        id: 'australia-gulf-carpentaria',
        name: 'Golfe de Carpentarie',
        country: 'Australie',
        flag: '🇦🇺',
        region: 'Océanie',
        areaHa: 350000,
        healthIndex: 0.68,
        lossRate: 0.9,
        lossHa1990_2020: 45000,
        protectionLevel: 'partial',
        carbonTonnesHa: 760,
        speciesCount: 10,
        dominantSpecies: 'Avicennia marina',
        threatsMain: ['Sécheresse extrême', 'Canicules marines', 'Élevage bovin'],
        submersionRise: 4.0,
        gmwCoverage: true,
        color: '#FF9800',
        coordinates: [136.0, -15.5],
      },
      geometry: {
        type: 'Point',
        coordinates: [136.0, -15.5],
      },
    },
  ],
};

// ─────────────────────────────────────────────
// ZONES VULNÉRABLES — PACIFIQUE & MONDE
// ─────────────────────────────────────────────

export const VULNERABLE_ZONES = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'noumea',
        name: 'Nouméa',
        country: 'Nouvelle-Calédonie',
        flag: '🇳🇨',
        region: 'Pacifique Sud-Ouest',
        subRegion: 'Grande Terre – Sud',
        elevation: 2,
        population: 94285,
        populationAtRisk2100: 62000,
        gdpAtRisk: 4.2,
        criticalInfra: ['Aéroport Magenta', 'Port autonome', 'Hôpital Gaston-Bourret'],
        description: 'Capitale de la Nouvelle-Calédonie. La baie des Citrons, Anse Vata et le front de mer sont en première ligne de submersion.',
        submersionRise: 2,
        sources: ['DIMENC', 'IRD Nouméa', 'NOAA'],
        coordinates: [166.4416, -22.2758],
      },
      geometry: { type: 'Point', coordinates: [166.4416, -22.2758] },
    },
    {
      type: 'Feature',
      properties: {
        id: 'ouvea',
        name: 'Ouvéa',
        country: 'Nouvelle-Calédonie',
        flag: '🇳🇨',
        region: 'Pacifique Sud-Ouest',
        subRegion: 'Îles Loyauté',
        elevation: 1,
        population: 3400,
        populationAtRisk2100: 3400,
        gdpAtRisk: 0.05,
        criticalInfra: ['Aéroport Gossanah', 'Lagon UNESCO'],
        description: 'Atoll corallien classé UNESCO. Élévation maximale 1 m. Totalement submersible dès +1 m.',
        submersionRise: 1,
        sources: ['IAC', 'SPC', 'IRD'],
        coordinates: [166.5747, -20.6486],
      },
      geometry: { type: 'Point', coordinates: [166.5747, -20.6486] },
    },
    {
      type: 'Feature',
      properties: {
        id: 'lifou',
        name: 'Lifou',
        country: 'Nouvelle-Calédonie',
        flag: '🇳🇨',
        region: 'Pacifique Sud-Ouest',
        subRegion: 'Îles Loyauté',
        elevation: 3,
        population: 9275,
        populationAtRisk2100: 5000,
        gdpAtRisk: 0.08,
        criticalInfra: ['Port de Wé', 'Aéroport de Lifou'],
        description: "Plus grande île des Loyauté, falaises calcaires vulnérables à l'érosion marine accélérée.",
        submersionRise: 3,
        sources: ['SPC', 'Province des Îles'],
        coordinates: [167.1, -20.9],
      },
      geometry: { type: 'Point', coordinates: [167.1, -20.9] },
    },
    {
      type: 'Feature',
      properties: {
        id: 'suva',
        name: 'Suva',
        country: 'Fidji',
        flag: '🇫🇯',
        region: 'Pacifique Sud',
        subRegion: 'Viti Levu',
        elevation: 2,
        population: 93970,
        populationAtRisk2100: 75000,
        gdpAtRisk: 1.8,
        criticalInfra: ['Port de Suva', 'Parlement', 'Hôpital Colonial War Memorial'],
        description: 'Capitale des Fidji. Zone gouvernementale et commerciale très exposée. Déjà soumise à des inondations récurrentes.',
        submersionRise: 2,
        sources: ['Fiji Meteorological Service', 'SPREP'],
        coordinates: [178.4419, -18.1416],
      },
      geometry: { type: 'Point', coordinates: [178.4419, -18.1416] },
    },
    {
      type: 'Feature',
      properties: {
        id: 'port-vila',
        name: 'Port-Vila',
        country: 'Vanuatu',
        flag: '🇻🇺',
        region: 'Pacifique Sud',
        subRegion: 'Éfaté',
        elevation: 2,
        population: 51437,
        populationAtRisk2100: 40000,
        gdpAtRisk: 0.4,
        criticalInfra: ['Aéroport international Bauerfield', 'Port Havannah'],
        description: 'Capitale du Vanuatu, une des nations les plus vulnérables au monde. Cyclones + montée des eaux + séismes.',
        submersionRise: 2,
        sources: ['VNSO', 'SPREP', 'WorldBank Climate'],
        coordinates: [168.3219, -17.7334],
      },
      geometry: { type: 'Point', coordinates: [168.3219, -17.7334] },
    },
    {
      type: 'Feature',
      properties: {
        id: 'honiara',
        name: 'Honiara',
        country: 'Îles Salomon',
        flag: '🇸🇧',
        region: 'Pacifique Sud-Ouest',
        subRegion: 'Guadalcanal',
        elevation: 2,
        population: 84520,
        populationAtRisk2100: 65000,
        gdpAtRisk: 0.3,
        criticalInfra: ['Aéroport Henderson', 'Port Jackson'],
        description: "Capitale des Salomon. Des îles Solomon ont déjà été englouties (Nuatambu, 2016).",
        submersionRise: 2,
        sources: ['Solomon Islands Meteorological Service', 'Nature Climate Change 2016'],
        coordinates: [159.9729, -9.4438],
      },
      geometry: { type: 'Point', coordinates: [159.9729, -9.4438] },
    },
    {
      type: 'Feature',
      properties: {
        id: 'tarawa',
        name: 'Tarawa Sud',
        country: 'Kiribati',
        flag: '🇰🇮',
        region: 'Pacifique Central',
        subRegion: 'Gilbert',
        elevation: 1,
        population: 56388,
        populationAtRisk2100: 56388,
        gdpAtRisk: 0.1,
        criticalInfra: ['Aéroport Bonriki', 'Eau douce', 'Toutes infrastructures'],
        description: "Atoll menacé d'engloutissement total. Premier territoire au monde à devoir relocaliser entièrement sa population.",
        submersionRise: 1,
        sources: ['KMS', 'SPREP', 'Nature 2020'],
        coordinates: [173.0, 1.3],
      },
      geometry: { type: 'Point', coordinates: [173.0, 1.3] },
    },
    {
      type: 'Feature',
      properties: {
        id: 'funafuti',
        name: 'Funafuti',
        country: 'Tuvalu',
        flag: '🇹🇻',
        region: 'Pacifique Central',
        subRegion: 'Polynésie',
        elevation: 1,
        population: 6320,
        populationAtRisk2100: 6320,
        gdpAtRisk: 0.02,
        criticalInfra: ["Aéroport Funafuti", "Réserve d'eau douce"],
        description: "Nation insulaire à 2m d'altitude max. Symbole mondial de la crise climatique. Plan d'évacuation vers NZ en cours.",
        submersionRise: 1,
        sources: ['TMTTI', 'Nature Communications 2018', 'SPREP'],
        coordinates: [179.1966, -8.5211],
      },
      geometry: { type: 'Point', coordinates: [179.1966, -8.5211] },
    },
    {
      type: 'Feature',
      properties: {
        id: 'apia',
        name: 'Apia',
        country: 'Samoa',
        flag: '🇼🇸',
        region: 'Pacifique Sud',
        subRegion: 'Polynésie',
        elevation: 2,
        population: 36735,
        populationAtRisk2100: 25000,
        gdpAtRisk: 0.25,
        criticalInfra: ["Port d'Apia", 'CBD côtier'],
        description: "Capitale du Samoa indépendant. Front de mer et zone portuaire très exposés aux cyclones et submersions.",
        submersionRise: 2,
        sources: ['SAMOA Meteorology Division', 'SPREP'],
        coordinates: [-171.7667, -13.8333],
      },
      geometry: { type: 'Point', coordinates: [-171.7667, -13.8333] },
    },
    {
      type: 'Feature',
      properties: {
        id: 'jakarta',
        name: 'Jakarta',
        country: 'Indonésie',
        flag: '🇮🇩',
        region: 'Asie du Sud-Est',
        subRegion: 'Java',
        elevation: 1,
        population: 10770487,
        populationAtRisk2100: 10770487,
        gdpAtRisk: 180.0,
        criticalInfra: ['Aéroport Soekarno-Hatta', 'Zone industrielle côtière'],
        description: "Ville qui s'enfonce de 25 cm/an. Capitale déjà partiellement abandonnée. Emblème de l'urgence climatique.",
        submersionRise: 1,
        sources: ['BMKG', 'Nature Geoscience 2023', 'WorldBank'],
        coordinates: [106.8456, -6.2088],
      },
      geometry: { type: 'Point', coordinates: [106.8456, -6.2088] },
    },
    {
      type: 'Feature',
      properties: {
        id: 'honolulu',
        name: 'Honolulu',
        country: 'États-Unis',
        flag: '🇺🇸',
        region: 'Pacifique Nord',
        subRegion: 'Hawaï',
        elevation: 2,
        population: 350964,
        populationAtRisk2100: 95000,
        gdpAtRisk: 18.5,
        criticalInfra: ['Pearl Harbor', 'Waikiki Beach', "Aéroport Daniel K. Inouye"],
        description: "Waikiki Beach déjà en érosion active. Les plages d'Oahu pourraient disparaître d'ici 2100.",
        submersionRise: 2,
        sources: ['NOAA', 'UHSLC', 'Hawaii Climate Commission'],
        coordinates: [-157.8583, 21.3069],
      },
      geometry: { type: 'Point', coordinates: [-157.8583, 21.3069] },
    },
    {
      type: 'Feature',
      properties: {
        id: 'greenland',
        name: 'Groenland',
        country: 'Arctique',
        flag: '🧊',
        region: 'Arctique',
        subRegion: 'Pôle Nord',
        elevation: 3000,
        population: 56480,
        populationAtRisk2100: 0,
        gdpAtRisk: 0,
        criticalInfra: [],
        description: 'Fonte du Groenland = +7 m de montée des eaux mondiale si totale. Perd 280 Gt/an actuellement.',
        submersionRise: 9999,
        isIceSource: true,
        meltContribution: 7.0,
        sources: ['NSIDC', 'Nature 2021', 'ESA CryoSat'],
        coordinates: [-42.6043, 71.7069],
      },
      geometry: { type: 'Point', coordinates: [-42.6043, 71.7069] },
    },
    {
      type: 'Feature',
      properties: {
        id: 'antarctica-west',
        name: 'Antarctique occidental',
        country: 'Antarctique',
        flag: '🧊',
        region: 'Antarctique',
        subRegion: 'Pôle Sud',
        elevation: 2500,
        population: 0,
        populationAtRisk2100: 0,
        gdpAtRisk: 0,
        criticalInfra: [],
        description: 'Instabilité WAIS (West Antarctic Ice Sheet). Collapse possible = +3.3 m. Point de basculement potentiel atteint.',
        submersionRise: 9999,
        isIceSource: true,
        meltContribution: 3.3,
        sources: ['BAS', 'Science 2023 WAIS Study', 'NSIDC'],
        coordinates: [-100, -82],
      },
      geometry: { type: 'Point', coordinates: [-100, -82] },
    },
  ],
};

// ─────────────────────────────────────────────
// DONNÉES HISTORIQUES MONTÉE DES EAUX
// ─────────────────────────────────────────────

export const SEA_LEVEL_HISTORICAL = [
  [1993, 0], [1994, 8], [1995, 14], [1996, 22],
  [1997, 18], [1998, 2], [1999, 12], [2000, 25],
  [2001, 33], [2002, 44], [2003, 52], [2004, 58],
  [2005, 65], [2006, 70], [2007, 80], [2008, 72],
  [2009, 86], [2010, 72], [2011, 60], [2012, 88],
  [2013, 97], [2014, 107], [2015, 101], [2016, 115],
  [2017, 122], [2018, 130], [2019, 140], [2020, 138],
  [2021, 148], [2022, 155], [2023, 168], [2024, 182],
].map(([year, mm]) => ({ year, mm, m: mm / 1000 }));

// ─────────────────────────────────────────────
// CYCLONES HISTORIQUES PACIFIQUE
// ─────────────────────────────────────────────

export const CYCLONES_PACIFIC = [
  {
    id: 'winston-2016',
    name: 'Winston',
    year: 2016,
    category: 5,
    peakWindsKnots: 180,
    minPressureHpa: 884,
    country: 'Fidji',
    deaths: 44,
    damageUSD: 1.4e9,
    description: 'Cyclone le plus intense jamais enregistré dans le Pacifique Sud.',
    color: '#FF1744',
    track: [
      { time: '2016-02-11T00:00:00Z', lon: 175.5, lat: -12.2, windKt: 60,  cat: 1 },
      { time: '2016-02-14T00:00:00Z', lon: 171.0, lat: -14.5, windKt: 90,  cat: 2 },
      { time: '2016-02-17T00:00:00Z', lon: 170.2, lat: -17.0, windKt: 140, cat: 4 },
      { time: '2016-02-19T12:00:00Z', lon: 172.5, lat: -17.8, windKt: 180, cat: 5 },
      { time: '2016-02-20T00:00:00Z', lon: 177.4, lat: -17.6, windKt: 180, cat: 5 },
      { time: '2016-02-21T00:00:00Z', lon: 180.0, lat: -17.0, windKt: 120, cat: 3 },
    ],
  },
  {
    id: 'pam-2015',
    name: 'Pam',
    year: 2015,
    category: 5,
    peakWindsKnots: 165,
    minPressureHpa: 896,
    country: 'Vanuatu',
    deaths: 15,
    damageUSD: 449e6,
    description: 'Cyclone cat-5 dévastant le Vanuatu. 90% des habitations de Port-Vila détruites.',
    color: '#FF6D00',
    track: [
      { time: '2015-03-06T00:00:00Z', lon: 165.0, lat:  -8.0, windKt:  40, cat: 1 },
      { time: '2015-03-10T00:00:00Z', lon: 168.0, lat: -12.0, windKt: 100, cat: 3 },
      { time: '2015-03-13T06:00:00Z', lon: 168.3, lat: -17.7, windKt: 165, cat: 5 },
      { time: '2015-03-15T00:00:00Z', lon: 170.0, lat: -22.0, windKt: 100, cat: 3 },
    ],
  },
];

// ─────────────────────────────────────────────
// UTILITAIRES
// ─────────────────────────────────────────────

export const getZoneStatus = (elevation, seaRise) => {
  const margin = elevation - seaRise;
  if (margin <= 0)   return { status: 'submergé',  label: 'Submergé',   color: '#D32F2F', urgency: 4 };
  if (margin <= 0.5) return { status: 'critique',  label: 'Critique',   color: '#E64A19', urgency: 3 };
  if (margin <= 1)   return { status: 'danger',    label: 'En danger',  color: '#F57C00', urgency: 3 };
  if (margin <= 3)   return { status: 'menacé',    label: 'Menacé',     color: '#FBC02D', urgency: 2 };
  if (margin <= 8)   return { status: 'vigilance', label: 'Vigilance',  color: '#7CB342', urgency: 1 };
  return                    { status: 'sûr',       label: 'Sûr',        color: '#43A047', urgency: 0 };
};

export const getMangroveStatus = (zone) => {
  const hi = zone.properties.healthIndex;
  if (hi >= 0.75) return { label: 'Saine',     color: '#2E7D32', urgency: 0 };
  if (hi >= 0.55) return { label: 'Dégradée',  color: '#F57C00', urgency: 1 };
  if (hi >= 0.35) return { label: 'Critique',  color: '#E64A19', urgency: 2 };
  return               { label: 'Effondrée', color: '#B71C1C', urgency: 3 };
};

export const interpolateScenario = (seaRise) => {
  const scenarios = SEA_LEVEL_SCENARIOS;
  for (let i = 0; i < scenarios.length - 1; i++) {
    const a = scenarios[i];
    const b = scenarios[i + 1];
    if (seaRise >= a.rise && seaRise <= b.rise) {
      const t = (seaRise - a.rise) / (b.rise - a.rise);
      return {
        t, from: a, to: b,
        waveIntensity: a.waveIntensity + t * (b.waveIntensity - a.waveIntensity),
        particleCount: Math.round(a.particleCount + t * (b.particleCount - a.particleCount)),
        year: Math.round(a.year + t * (b.year - a.year)),
        tempAnomaly: a.tempAnomaly != null && b.tempAnomaly != null
          ? a.tempAnomaly + t * (b.tempAnomaly - a.tempAnomaly)
          : null,
      };
    }
  }
  return {
    t: 1,
    from: scenarios[scenarios.length - 2],
    to: scenarios[scenarios.length - 1],
    waveIntensity: 1.0,
    particleCount: 600,
    year: scenarios[scenarios.length - 1].year,
    tempAnomaly: null,
  };
};

export const getClosestScenario = (seaRise) =>
  SEA_LEVEL_SCENARIOS.reduce((prev, curr) =>
    Math.abs(curr.rise - seaRise) < Math.abs(prev.rise - seaRise) ? curr : prev
  );

export const getPopulationAtRisk = (seaRise) => {
  const lookup = [
    { rise: 0,    pop: 0 },
    { rise: 0.3,  pop: 70e6 },
    { rise: 1.0,  pop: 190e6 },
    { rise: 2.0,  pop: 340e6 },
    { rise: 5.0,  pop: 630e6 },
    { rise: 12.0, pop: 1100e6 },
    { rise: 70.0, pop: 4500e6 },
  ];
  for (let i = 0; i < lookup.length - 1; i++) {
    const a = lookup[i], b = lookup[i + 1];
    if (seaRise >= a.rise && seaRise <= b.rise) {
      const t = (seaRise - a.rise) / (b.rise - a.rise);
      return Math.round(a.pop + t * (b.pop - a.pop));
    }
  }
  return 4500e6;
};