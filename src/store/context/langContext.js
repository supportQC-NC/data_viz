// src/store/context/langContext.js
// ============================================================
// Pacific Dataviz Challenge 2026
// Contexte React pour la langue + dictionnaire i18n FR/EN
// CHEMIN CORRECT : ../slices/uiSlice  (depuis store/context/)
// ============================================================

import React, { createContext, useContext, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleLang, setLang, selectLang } from '../slices/uiSlice';

// ═══════════════════════════════════════════════════════════
// DICTIONNAIRE i18n
// ═══════════════════════════════════════════════════════════

export const TRANSLATIONS = {

  nav: {
    fr: {
      map:              'Carte',
      data:             'Données',
      about:            'À propos',
      switchLang:       'EN',
      switchThemeDark:  '☀ Clair',
      switchThemeLight: '◐ Sombre',
    },
    en: {
      map:              'Map',
      data:             'Data',
      about:            'About',
      switchLang:       'FR',
      switchThemeDark:  '☀ Light',
      switchThemeLight: '◐ Dark',
    },
  },

  landing: {
    fr: {
      heroSupertitle:      'Pacific Dataviz Challenge 2026',
      heroTitle:           "L'Océan\nMonte.",
      heroSubtitle:        'Une expérience de données climatiques sur\nla montée des eaux et les cyclones du Pacifique.',
      heroCtaMap:          'Explorer la carte',
      heroCtaData:         'Voir les données',
      heroScrollHint:      'Défiler pour découvrir',
      statSeaRise:         '+182 mm',
      statSeaRiseLabel:    'depuis 1993',
      statCyclones:        '47',
      statCyclonesLabel:   'cyclones historiques',
      statAtRisk:          '1 milliard',
      statAtRiskLabel:     'personnes à risque à +2m',
      riseTag:             '🌊 Simulation',
      riseTitle:           "Regardez l'eau monter.",
      riseText:            "Ce n'est pas de la science-fiction. Les projections du GIEC montrent une montée entre 40 cm et 2 m d'ici 2100. Dans le Pacifique, des nations entières seront englouties.",
      riseCtaMap:          'Lancer la simulation →',
      riseScenarioObs:     'Observé 1993–2025',
      riseScenarioSSP1:    'SSP1-2.6 (optimiste)',
      riseScenarioSSP5:    'SSP5-8.5 (pessimiste)',
      riseScenarioExt:     'Extrême +2 m',
      cyclonesTag:         '🌀 Cyclones historiques',
      cyclonesTitle:       '150 ans de\ntempêtes.',
      cyclonesText:        "Des données historiques de 1850 à aujourd'hui. Trajectoires animées, intensité par catégorie, corrélation avec la hausse des températures.",
      cyclonesCtaMap:      'Explorer les trajectoires →',
      statCat5:            '23',
      statCat5Label:       'cyclones cat. 5 depuis 1990',
      statWarm:            '+1.8°C',
      statWarmLabel:       'anomalie SST Pacifique 2024',
      statStrong:          '×2.4',
      statStrongLabel:     'intensification des catégories 4-5',
      dataTag:             '📊 Analyse de données',
      dataTitle:           "6 graphiques.\n1 planète en crise.",
      dataText:            "Montée des eaux projetée jusqu'en 2300, corrélation température/cyclones, effondrement des mangroves, populations à risque par scénario.",
      dataCtaExplore:      'Explorer les données →',
      dataStatRise:        '182 mm',
      dataStatRiseLabel:   'Montée satellite 1993–2025',
      dataStatBillion:     '1 Md',
      dataStatBillionLabel:'personnes à risque à +2m',
      dataStatRate:        '5.8',
      dataStatRateLabel:   'mm/an de montée actuelle',
      dataChartLabel:      'Montée des eaux · 1993–2100',
      dataBadgeObs:        '● Observé',
      dataBadgeSSP1:       '– SSP1-2.6',
      dataBadgeSSP5:       '– SSP5-8.5',
      dataBadgeExt:        '– Extrême',
      urgencyTag:          '🚨 Urgence climatique',
      urgencyTitle:        "Des nations\nvont disparaître",
      urgencyText:         "Tuvalu, Kiribati — ces pays insulaires sont en première ligne d'une crise qu'ils n'ont pas causée. Altitude maximale : 2 mètres.",
      urgencyCtaData:      'Voir les données →',
      urgeStat1Num:        '5',
      urgeStat1Unit:       'îles Salomon',
      urgeStat1Sub:        'déjà englouties (2016)',
      urgeStat2Num:        '1 m',
      urgeStat2Unit:       'de montée',
      urgeStat2Sub:        "prévu d'ici 2100 (GIEC AR6)",
      urgeStat3Num:        '190 M',
      urgeStat3Unit:       'personnes',
      urgeStat3Sub:        'à déplacer si +1 m',
      finalTitle:          "Voyez ce qui se joue\ndans le Pacifique",
      finalCtaMap:         'Lancer la carte',
      finalCtaData:        'Voir les données',
      footerCredits:       'Pacific Dataviz Challenge 2026 · NOAA · NASA · JAXA · SPREP · GIEC AR6 · CC BY 4.0',
      footerMap:           'Carte',
      footerData:          'Données',
      footerAbout:         'À propos',
    },
    en: {
      heroSupertitle:      'Pacific Dataviz Challenge 2026',
      heroTitle:           "The Ocean\nIs Rising.",
      heroSubtitle:        'A climate data experience on sea level rise\nand Pacific cyclones.',
      heroCtaMap:          'Explore the map',
      heroCtaData:         'View the data',
      heroScrollHint:      'Scroll to discover',
      statSeaRise:         '+182 mm',
      statSeaRiseLabel:    'since 1993',
      statCyclones:        '47',
      statCyclonesLabel:   'historical cyclones',
      statAtRisk:          '1 billion',
      statAtRiskLabel:     'people at risk at +2m',
      riseTag:             '🌊 Simulation',
      riseTitle:           'Watch the water rise.',
      riseText:            "This is not science fiction. IPCC projections show a rise of 40 cm to 2 m by 2100. In the Pacific, entire nations will be submerged.",
      riseCtaMap:          'Launch the simulation →',
      riseScenarioObs:     'Observed 1993–2025',
      riseScenarioSSP1:    'SSP1-2.6 (optimistic)',
      riseScenarioSSP5:    'SSP5-8.5 (pessimistic)',
      riseScenarioExt:     'Extreme +2 m',
      cyclonesTag:         '🌀 Historical cyclones',
      cyclonesTitle:       '150 years of\nstorms.',
      cyclonesText:        "Historical data from 1850 to today. Animated trajectories, category intensity, correlation with rising temperatures.",
      cyclonesCtaMap:      'Explore trajectories →',
      statCat5:            '23',
      statCat5Label:       'Cat. 5 cyclones since 1990',
      statWarm:            '+1.8°C',
      statWarmLabel:       'Pacific SST anomaly 2024',
      statStrong:          '×2.4',
      statStrongLabel:     'Cat. 4-5 intensification',
      dataTag:             '📊 Data Analysis',
      dataTitle:           "6 charts.\n1 planet in crisis.",
      dataText:            "Projected sea level rise to 2300, temperature/cyclone correlation, mangrove collapse, populations at risk by scenario.",
      dataCtaExplore:      'Explore the data →',
      dataStatRise:        '182 mm',
      dataStatRiseLabel:   'Satellite rise 1993–2025',
      dataStatBillion:     '1 Bn',
      dataStatBillionLabel:'people at risk at +2m',
      dataStatRate:        '5.8',
      dataStatRateLabel:   'mm/yr current rise',
      dataChartLabel:      'Sea Level Rise · 1993–2100',
      dataBadgeObs:        '● Observed',
      dataBadgeSSP1:       '– SSP1-2.6',
      dataBadgeSSP5:       '– SSP5-8.5',
      dataBadgeExt:        '– Extreme',
      urgencyTag:          '🚨 Climate Emergency',
      urgencyTitle:        "Nations will\ndisappear",
      urgencyText:         "Tuvalu, Kiribati — these island nations are on the front line of a crisis they did not cause. Maximum altitude: 2 metres.",
      urgencyCtaData:      'View the data →',
      urgeStat1Num:        '5',
      urgeStat1Unit:       'Solomon Islands',
      urgeStat1Sub:        'already submerged (2016)',
      urgeStat2Num:        '1 m',
      urgeStat2Unit:       'sea level rise',
      urgeStat2Sub:        'projected by 2100 (IPCC AR6)',
      urgeStat3Num:        '190 M',
      urgeStat3Unit:       'people',
      urgeStat3Sub:        'to be displaced at +1 m',
      finalTitle:          "See what is at stake\nin the Pacific",
      finalCtaMap:         'Launch the map',
      finalCtaData:        'View the data',
      footerCredits:       'Pacific Dataviz Challenge 2026 · NOAA · NASA · JAXA · SPREP · IPCC AR6 · CC BY 4.0',
      footerMap:           'Map',
      footerData:          'Data',
      footerAbout:         'About',
    },
  },

  map: {
    fr: { title: 'Carte interactive', loading: 'Chargement…', noData: 'Aucune donnée' },
    en: { title: 'Interactive Map',   loading: 'Loading…',     noData: 'No data available' },
  },

  data: {
    fr: { title: 'Analyse de données', loading: 'Chargement…', observed: 'Observé',   projected: 'Projeté'   },
    en: { title: 'Data Analysis',      loading: 'Loading…',    observed: 'Observed',  projected: 'Projected' },
  },

  about: {
    fr: { title: 'À propos',  subtitle: 'Pacific Dataviz Challenge 2026' },
    en: { title: 'About',     subtitle: 'Pacific Dataviz Challenge 2026' },
  },

  common: {
    fr: { loading: 'Chargement…', error: 'Erreur', retry: 'Réessayer', close: 'Fermer' },
    en: { loading: 'Loading…',    error: 'Error',  retry: 'Retry',     close: 'Close'  },
  },
};

// ═══════════════════════════════════════════════════════════
// CONTEXTE + PROVIDER + HOOK
// ═══════════════════════════════════════════════════════════

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const dispatch = useDispatch();
  const lang     = useSelector(selectLang); // 'fr' | 'en'

  const toggle  = useCallback(() => dispatch(toggleLang()),    [dispatch]);
  const set     = useCallback((l) => dispatch(setLang(l)),     [dispatch]);
  const isFr    = lang === 'fr';
  const isEn    = lang === 'en';

  const t = useCallback((section, key) => {
    const val = TRANSLATIONS[section]?.[lang]?.[key];
    if (val === undefined && process.env.NODE_ENV === 'development') {
      console.warn(`[i18n] Clé manquante : "${section}.${lang}.${key}"`);
    }
    return val ?? key;
  }, [lang]);

  const tSection = useCallback((section) => {
    return TRANSLATIONS[section]?.[lang] ?? {};
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, isFr, isEn, toggle, set, t, tSection }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within a <LangProvider>');
  return ctx;
}

export default LangContext;