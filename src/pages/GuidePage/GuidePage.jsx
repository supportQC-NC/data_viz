// src/pages/GuidePage/GuidePage.jsx
// ============================================================
// Guide de lecture des données — cyclones + surcote
// Entièrement bilingue FR/EN · useTheme + useLang
// ============================================================
import React, { useState } from "react";
import "./GuidePage.scss";
import { useTheme } from "../../store/context/themeContext";
import { useLang } from "../../store/context/langContext";

const CAT_COLORS = {
  TD: "#90CAF9",
  TS: "#42A5F5",
  TC: "#FFB74D",
  STC: "#FF7043",
  ITC: "#EF5350",
};

// ── Données du guide ──────────────────────────────────────────
const CATEGORIES = [
  {
    code: "TD",
    wind_ms: "< 17.5",
    wind_kmh: "< 63",
    fr: {
      name: "Dépression tropicale",
      desc: "Système organisé mais encore peu intense. Fortes pluies, mer agitée. Peut se renforcer rapidement si les conditions océaniques sont favorables.",
    },
    en: {
      name: "Tropical Depression",
      desc: "Organised system but still low intensity. Heavy rain, rough seas. Can rapidly intensify if ocean conditions are favorable.",
    },
  },
  {
    code: "TS",
    wind_ms: "17.5–24.4",
    wind_kmh: "63–88",
    fr: {
      name: "Tempête tropicale",
      desc: "Vents forts générant des submersions côtières localisées. Dégâts aux constructions légères, arbres arrachés, interruptions d'électricité.",
    },
    en: {
      name: "Tropical Storm",
      desc: "Strong winds causing localised coastal flooding. Damage to light structures, uprooted trees, power outages.",
    },
  },
  {
    code: "TC",
    wind_ms: "24.5–32.6",
    wind_kmh: "89–117",
    fr: {
      name: "Cyclone tropical",
      desc: "Dégâts importants sur les bâtiments. Zones d'évacuation préventives recommandées. Surcote côtière significative.",
    },
    en: {
      name: "Tropical Cyclone",
      desc: "Major structural damage. Preventive evacuation zones recommended. Significant coastal storm surge.",
    },
  },
  {
    code: "STC",
    wind_ms: "32.7–44.1",
    wind_kmh: "118–159",
    fr: {
      name: "Cyclone sévère",
      desc: "Destructions majeures. Routes coupées, infrastructures endommagées, risques de submersion étendus. Mise à l'abri obligatoire.",
    },
    en: {
      name: "Severe Cyclone",
      desc: "Major destruction. Roads cut, infrastructure damaged, widespread flooding risk. Mandatory shelter.",
    },
  },
  {
    code: "ITC",
    wind_ms: "≥ 44.2",
    wind_kmh: "≥ 160",
    fr: {
      name: "Cyclone intense",
      desc: "Catastrophique. Vents extrêmes capables de détruire des bâtiments solides. Surcote de plusieurs mètres possible. Risque vital immédiat.",
    },
    en: {
      name: "Intense Cyclone",
      desc: "Catastrophic. Extreme winds capable of destroying solid buildings. Storm surge of several meters possible. Immediate life risk.",
    },
  },
];

const Section = ({ id, icon, title, children }) => (
  <section className="guide__section" id={id}>
    <div className="guide__section-header">
      <span className="guide__section-icon">{icon}</span>
      <h2 className="guide__section-title">{title}</h2>
    </div>
    <div className="guide__section-body">{children}</div>
  </section>
);

const Card = ({ children, accent }) => (
  <div
    className="guide__card"
    style={accent ? { borderLeftColor: accent } : {}}
  >
    {children}
  </div>
);

export default function GuidePage() {
  const { isDark } = useTheme();
  const { lang } = useLang();
  const [activeTab, setActiveTab] = useState("cyclones");

  const t = (fr, en) => (lang === "fr" ? fr : en);

  return (
    <div className={`guide ${isDark ? "guide--dark" : "guide--light"}`}>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="guide__hero">
        <div className="guide__hero-inner">
          <div className="guide__hero-eyebrow">
            {t(
              "Documentation · Guide de lecture",
              "Documentation · Reading Guide",
            )}
          </div>
          <h1 className="guide__hero-title">
            {t("Comment lire les données ?", "How to read the data?")}
          </h1>
          <p className="guide__hero-sub">
            {t(
              "Comprendre chaque indicateur affiché sur la carte et dans les panneaux de données.",
              "Understand every indicator displayed on the map and in the data panels.",
            )}
          </p>
          {/* Tabs */}
          <div className="guide__tabs">
            {[
              { key: "cyclones", fr: "🌀 Cyclones", en: "🌀 Cyclones" },
              {
                key: "surcote",
                fr: "🌊 Surcote côtière",
                en: "🌊 Storm Surge",
              },
              {
                key: "sources",
                fr: "📊 Sources de données",
                en: "📊 Data Sources",
              },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`guide__tab ${activeTab === tab.key ? "guide__tab--active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {t(tab.fr, tab.en)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB : CYCLONES
      ══════════════════════════════════════════════════════ */}
      {activeTab === "cyclones" && (
        <div className="guide__content">
          {/* Catégories */}
          <Section
            id="categories"
            icon="🏷"
            title={t("Les catégories d'intensité", "Intensity categories")}
          >
            <p className="guide__intro">
              {t(
                "Les cyclones du Pacifique Sud sont classés selon l'échelle de l'Organisation Météorologique Mondiale (OMM) basée sur la vitesse maximale des vents soutenus. La catégorie est dérivée du champ mean_wind_speed (IBTrACS) en m/s.",
                "South Pacific cyclones are classified according to the World Meteorological Organization (WMO) scale based on maximum sustained wind speed. The category is derived from the mean_wind_speed field (IBTrACS) in m/s.",
              )}
            </p>

            <div className="guide__cat-grid">
              {CATEGORIES.map((cat) => (
                <div
                  key={cat.code}
                  className="guide__cat-card"
                  style={{
                    borderColor: CAT_COLORS[cat.code] + "60",
                    background: CAT_COLORS[cat.code] + "08",
                  }}
                >
                  {/* Badge */}
                  <div
                    className="guide__cat-badge"
                    style={{
                      background: CAT_COLORS[cat.code] + "22",
                      borderColor: CAT_COLORS[cat.code],
                      color: CAT_COLORS[cat.code],
                    }}
                  >
                    {cat.code}
                  </div>

                  <div className="guide__cat-name">
                    {lang === "fr" ? cat.fr.name : cat.en.name}
                  </div>

                  {/* Vitesse */}
                  <div className="guide__cat-speed">
                    <div className="guide__cat-speed-bar">
                      <div
                        className="guide__cat-speed-fill"
                        style={{
                          width:
                            cat.code === "ITC"
                              ? "100%"
                              : cat.code === "STC"
                                ? "82%"
                                : cat.code === "TC"
                                  ? "62%"
                                  : cat.code === "TS"
                                    ? "42%"
                                    : "22%",
                          background: `linear-gradient(90deg, ${CAT_COLORS[cat.code]}80, ${CAT_COLORS[cat.code]})`,
                        }}
                      />
                    </div>
                    <div className="guide__cat-speed-vals">
                      <span style={{ color: CAT_COLORS[cat.code] }}>
                        {cat.wind_kmh} km/h
                      </span>
                      <span className="guide__cat-speed-ms">
                        ({cat.wind_ms} m/s)
                      </span>
                    </div>
                  </div>

                  <p className="guide__cat-desc">
                    {lang === "fr" ? cat.fr.desc : cat.en.desc}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          {/* Vent */}
          <Section
            id="vent"
            icon="🌬"
            title={t("La vitesse du vent", "Wind speed")}
          >
            <div className="guide__two-col">
              <Card accent="#42A5F5">
                <div className="guide__card-title">
                  {t("Ce que mesure IBTrACS", "What IBTrACS measures")}
                </div>
                <p>
                  {t(
                    "Le champ mean_wind_speed est la vitesse moyenne du vent maximal soutenu sur 10 minutes, exprimée en mètres par seconde (m/s). L'application la convertit automatiquement en km/h (× 3.6).",
                    "The mean_wind_speed field is the average maximum sustained wind speed over 10 minutes, expressed in metres per second (m/s). The app automatically converts it to km/h (× 3.6).",
                  )}
                </p>
                <div className="guide__conversion">
                  <code>km/h = m/s × 3.6</code>
                  <span>
                    {t(
                      "Exemple : 25 m/s = 90 km/h → Cyclone (TC)",
                      "Example: 25 m/s = 90 km/h → Cyclone (TC)",
                    )}
                  </span>
                </div>
              </Card>
              <Card accent="#FFB74D">
                <div className="guide__card-title">
                  {t("Lire la jauge", "Reading the gauge")}
                </div>
                <div className="guide__gauge-demo">
                  {[
                    { label: "TOM · 1977", v: 63, cat: "TS" },
                    { label: "NIRAN · 2021", v: 205, cat: "ITC" },
                    { label: "HAROLD · 2020", v: 270, cat: "ITC" },
                  ].map(({ label, v, cat }) => (
                    <div key={label} className="guide__gauge-row">
                      <span className="guide__gauge-label">{label}</span>
                      <div className="guide__gauge-track">
                        <div
                          className="guide__gauge-fill"
                          style={{
                            width: `${Math.min(100, (v / 280) * 100)}%`,
                            background: CAT_COLORS[cat],
                          }}
                        />
                      </div>
                      <span
                        className="guide__gauge-val"
                        style={{ color: CAT_COLORS[cat] }}
                      >
                        {v} km/h
                      </span>
                    </div>
                  ))}
                </div>
                <p className="guide__note">
                  {t(
                    "La jauge est étalonnée sur 280 km/h (max historique Pacifique Sud).",
                    "The gauge is scaled to 280 km/h (South Pacific historical max).",
                  )}
                </p>
              </Card>
            </div>
          </Section>

          {/* Pression */}
          <Section
            id="pression"
            icon="⬇"
            title={t("La pression atmosphérique", "Atmospheric pressure")}
          >
            <p className="guide__intro">
              {t(
                "La pression centrale minimale (mean_central_pressure) est l'une des mesures les plus importantes de l'intensité d'un cyclone. Plus la pression est basse, plus le cyclone est intense.",
                "The minimum central pressure (mean_central_pressure) is one of the most important measures of cyclone intensity. The lower the pressure, the more intense the cyclone.",
              )}
            </p>
            <div className="guide__pressure-scale">
              {[
                {
                  range: "> 990 hPa",
                  label: t("Dépression / Tempête", "Depression / Storm"),
                  color: "#90CAF9",
                  desc: t("Pression quasi-normale", "Near-normal pressure"),
                },
                {
                  range: "960–990 hPa",
                  label: t("Cyclone tropical", "Tropical cyclone"),
                  color: "#FFB74D",
                  desc: t(
                    "Pression nettement inférieure à la normale",
                    "Clearly below normal pressure",
                  ),
                },
                {
                  range: "920–960 hPa",
                  label: t("Cyclone sévère", "Severe cyclone"),
                  color: "#FF7043",
                  desc: t(
                    "Pression très basse, vent extrême",
                    "Very low pressure, extreme wind",
                  ),
                },
                {
                  range: "< 920 hPa",
                  label: t("Cyclone intense", "Intense cyclone"),
                  color: "#EF5350",
                  desc: t(
                    "Record historique — ex: Harold 2020 : 899 hPa",
                    "Historical record — e.g. Harold 2020: 899 hPa",
                  ),
                },
              ].map(({ range, label, color, desc }) => (
                <div key={range} className="guide__pressure-row">
                  <div className="guide__pressure-range" style={{ color }}>
                    {range}
                  </div>
                  <div
                    className="guide__pressure-dot"
                    style={{ background: color }}
                  />
                  <div className="guide__pressure-info">
                    <strong style={{ color }}>{label}</strong>
                    <span>{desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="guide__ref-note">
              {t(
                "Référence : pression au niveau de la mer = 1013 hPa",
                "Reference: sea-level pressure = 1013 hPa",
              )}
            </div>
          </Section>

          {/* ENSO */}
          <Section
            id="enso"
            icon="🌡"
            title={t("L'indice ENSO", "The ENSO Index")}
          >
            <div className="guide__enso-grid">
              <div className="guide__enso-card guide__enso-card--nino">
                <div className="guide__enso-title">🔴 El Niño</div>
                <div className="guide__enso-subtitle">
                  {t("Eaux plus chaudes", "Warmer waters")}
                </div>
                <ul className="guide__enso-list">
                  <li>
                    {t(
                      "Température de l'Océan Pacifique équatorial > normale",
                      "Equatorial Pacific Ocean temperature > normal",
                    )}
                  </li>
                  <li>
                    {t(
                      "Cyclones plus nombreux et plus intenses en moyenne",
                      "More frequent and more intense cyclones on average",
                    )}
                  </li>
                  <li>
                    {t(
                      "Trajectoires modifiées : certaines zones plus exposées",
                      "Modified tracks: some areas more exposed",
                    )}
                  </li>
                  <li>
                    {t(
                      "Pression centrale plus basse",
                      "Lower central pressure",
                    )}
                  </li>
                </ul>
              </div>
              <div className="guide__enso-card guide__enso-card--nina">
                <div className="guide__enso-title">🔵 La Niña</div>
                <div className="guide__enso-subtitle">
                  {t("Eaux plus fraîches", "Cooler waters")}
                </div>
                <ul className="guide__enso-list">
                  <li>
                    {t(
                      "Température de l'Océan Pacifique équatorial < normale",
                      "Equatorial Pacific Ocean temperature < normal",
                    )}
                  </li>
                  <li>
                    {t(
                      "Saisons cycloniques généralement moins actives",
                      "Generally less active cyclone seasons",
                    )}
                  </li>
                  <li>
                    {t(
                      "Trajectoires plus proches des côtes NC parfois",
                      "Tracks closer to NC coasts sometimes",
                    )}
                  </li>
                  <li>
                    {t(
                      "Phénomène actuellement renforcé par le changement climatique",
                      "Phenomenon currently intensified by climate change",
                    )}
                  </li>
                </ul>
              </div>
            </div>
            <Card>
              <div className="guide__card-title">
                💡{" "}
                {t(
                  "Lien avec le changement climatique",
                  "Link to climate change",
                )}
              </div>
              <p>
                {t(
                  "Le réchauffement climatique augmente la température des océans, ce qui fournit plus d'énergie aux cyclones. Les études montrent une intensification des cyclones les plus forts (+8% de vents pour +1°C). La Nouvelle-Calédonie est particulièrement vulnérable car l'Océan Pacifique se réchauffe plus rapidement que la moyenne mondiale.",
                  "Climate change raises ocean temperatures, providing more energy to cyclones. Studies show an intensification of the strongest cyclones (+8% winds per +1°C). New Caledonia is particularly vulnerable as the Pacific Ocean warms faster than the global average.",
                )}
              </p>
            </Card>
          </Section>

          {/* Lire la carte */}
          <Section
            id="carte"
            icon="🗺"
            title={t("Lire la carte", "Reading the map")}
          >
            <div className="guide__map-guide">
              {[
                {
                  icon: "━",
                  color: "#90CAF9",
                  fr: "Trajectoire TD (Dépression)",
                  en: "TD track (Depression)",
                },
                {
                  icon: "━",
                  color: "#42A5F5",
                  fr: "Trajectoire TS (Tempête)",
                  en: "TS track (Storm)",
                },
                {
                  icon: "━",
                  color: "#FFB74D",
                  fr: "Trajectoire TC (Cyclone)",
                  en: "TC track (Cyclone)",
                },
                {
                  icon: "━",
                  color: "#FF7043",
                  fr: "Trajectoire STC (Sévère)",
                  en: "STC track (Severe)",
                },
                {
                  icon: "━",
                  color: "#EF5350",
                  fr: "Trajectoire ITC (Intense)",
                  en: "ITC track (Intense)",
                },
                {
                  icon: "✦",
                  color: "#fff",
                  fr: "Œil du cyclone (position courante)",
                  en: "Cyclone eye (current position)",
                },
              ].map(({ icon, color, fr, en }) => (
                <div key={fr} className="guide__map-row">
                  <span className="guide__map-icon" style={{ color }}>
                    {icon}
                  </span>
                  <span className="guide__map-label">
                    {lang === "fr" ? fr : en}
                  </span>
                </div>
              ))}
            </div>
            <Card>
              <div className="guide__card-title">
                🖱 {t("Interactions disponibles", "Available interactions")}
              </div>
              <div className="guide__interactions">
                {[
                  {
                    icon: "👆",
                    fr: "Cliquer sur une trajectoire → fiche détaillée du cyclone",
                    en: "Click a track → detailed cyclone card",
                  },
                  {
                    icon: "🖱",
                    fr: "Survoler une trajectoire → nom, catégorie, vent",
                    en: "Hover a track → name, category, wind",
                  },
                  {
                    icon: "🔍",
                    fr: "Filtrer par catégorie → sélectionner TD/TS/TC/STC/ITC",
                    en: "Filter by category → select TD/TS/TC/STC/ITC",
                  },
                  {
                    icon: "📅",
                    fr: "Filtrer par période → sélectionner une plage d'années",
                    en: "Filter by period → select a year range",
                  },
                  {
                    icon: "▶",
                    fr: "Simulation → rejouer les trajectoires une par une",
                    en: "Simulation → replay tracks one by one",
                  },
                ].map(({ icon, fr, en }) => (
                  <div key={fr} className="guide__interaction-row">
                    <span>{icon}</span>
                    <span>{lang === "fr" ? fr : en}</span>
                  </div>
                ))}
              </div>
            </Card>
          </Section>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB : SURCOTE
      ══════════════════════════════════════════════════════ */}
      {activeTab === "surcote" && (
        <div className="guide__content">
          <Section
            id="surcote-def"
            icon="🌊"
            title={t(
              "Qu'est-ce que la surcote côtière ?",
              "What is coastal storm surge?",
            )}
          >
            <p className="guide__intro">
              {t(
                "La surcote (ou surge en anglais) est l'élévation temporaire du niveau de la mer au-dessus de la marée astronomique normale, causée par un cyclone ou une tempête. Elle est provoquée par deux mécanismes combinés :",
                "Storm surge is the temporary rise in sea level above the normal astronomical tide caused by a cyclone or storm. It is produced by two combined mechanisms:",
              )}
            </p>
            <div className="guide__surge-mechs">
              <Card accent="#42A5F5">
                <div className="guide__card-title">
                  💨 {t("Effet du vent", "Wind effect")}
                </div>
                <p>
                  {t(
                    "Les vents forts soufflant vers la côte poussent physiquement l'eau contre le littoral. Cet effet est d'autant plus important que la côte est peu profonde (\"plateau continental\") et que les vents soufflent perpendiculairement à elle.",
                    "Strong onshore winds physically push water against the coastline. This effect is greater when the coast is shallow (continental shelf) and winds blow perpendicularly to it.",
                  )}
                </p>
              </Card>
              <Card accent="#90CAF9">
                <div className="guide__card-title">
                  ⬇ {t("Effet de la basse pression", "Low pressure effect")}
                </div>
                <p>
                  {t(
                    "La dépression atmosphérique au cœur du cyclone agit comme une pompe : elle \"aspire\" la mer vers le haut. Règle d'or : une réduction de 1 hPa de pression élève le niveau de la mer d'environ 1 cm.",
                    'The low atmospheric pressure at the cyclone\'s core acts as a pump: it "sucks" the sea upward. Golden rule: a 1 hPa drop in pressure raises sea level by approximately 1 cm.',
                  )}
                </p>
                <div className="guide__conversion">
                  <code>−1 hPa → +1 cm</code>
                  <span>
                    {t(
                      "Un cyclone à 900 hPa (vs. 1013) → +1.13m de surcote barométrique",
                      "A cyclone at 900 hPa (vs. 1013) → +1.13m barometric surge",
                    )}
                  </span>
                </div>
              </Card>
            </div>
          </Section>

          <Section
            id="surcote-data"
            icon="📊"
            title={t("Les données affichées", "Data displayed")}
          >
            <p className="guide__intro">
              {t(
                "Le jeu de données DIMENC/IRD/BENEBIG 2024 représente les valeurs de surcote pour un cyclone centennal (probabilité d'occurrence = 1% par an) aux différents points du littoral néo-calédonien.",
                "The DIMENC/IRD/BENEBIG 2024 dataset represents storm surge values for a centennial cyclone (probability of occurrence = 1% per year) at various points along the New Caledonian coastline.",
              )}
            </p>
            <div className="guide__vars">
              {[
                {
                  icon: "🌊",
                  field: "surcote_max",
                  fr: {
                    name: "Surcote maximale",
                    unit: "mètres",
                    desc: "Hauteur maximale de montée de la mer au-dessus de la marée normale. C'est l'indicateur principal du risque d'inondation côtière. Une surcote de 2m signifie que la mer sera 2m plus haute que la normale.",
                  },
                  en: {
                    name: "Maximum storm surge",
                    unit: "metres",
                    desc: "Maximum sea level rise above normal tide. This is the main indicator of coastal flooding risk. A 2m surge means the sea will be 2m higher than normal.",
                  },
                  colors: [
                    {
                      range: "< 0.5m",
                      label: t("Vigilance", "Watch"),
                      color: "#F9E537",
                    },
                    {
                      range: "0.5–1m",
                      label: t("Danger", "Danger"),
                      color: "#FF9F0A",
                    },
                    {
                      range: "1–2.5m",
                      label: t("Critique", "Critical"),
                      color: "#FF3B30",
                    },
                    {
                      range: "> 2.5m",
                      label: t("Catastrophique", "Catastrophic"),
                      color: "#BF5AF2",
                    },
                  ],
                },
                {
                  icon: "〜",
                  field: "hauteur_significative_max",
                  fr: {
                    name: "Hauteur de vague significative",
                    unit: "mètres",
                    desc: "Hauteur moyenne du tiers des vagues les plus hautes observées. Correspond à ce qu'un observateur perçoit visuellement. Les vagues maximales peuvent atteindre 2× la hauteur significative.",
                  },
                  en: {
                    name: "Significant wave height",
                    unit: "metres",
                    desc: "Average height of the highest third of observed waves. Corresponds to what an observer visually perceives. Maximum waves can reach 2× the significant height.",
                  },
                },
                {
                  icon: "⏱",
                  field: "periode_max",
                  fr: {
                    name: "Période de vague maximale",
                    unit: "secondes",
                    desc: "Temps entre deux vagues successives. Des vagues longues (> 14s) sont les plus dangereuses car elles transportent plus d'énergie et pénètrent plus profondément dans les terres. Les tsunamis ont des périodes de plusieurs minutes.",
                  },
                  en: {
                    name: "Maximum wave period",
                    unit: "seconds",
                    desc: "Time between successive waves. Long waves (> 14s) are the most dangerous as they carry more energy and penetrate further inland. Tsunamis have periods of several minutes.",
                  },
                },
              ].map(({ icon, field, fr, en, colors }) => (
                <div key={field} className="guide__var-card">
                  <div className="guide__var-header">
                    <span className="guide__var-icon">{icon}</span>
                    <div>
                      <div className="guide__var-name">
                        {lang === "fr" ? fr.name : en.name}
                      </div>
                      <div className="guide__var-field">
                        <code>{field}</code> ·{" "}
                        {lang === "fr" ? fr.unit : en.unit}
                      </div>
                    </div>
                  </div>
                  <p className="guide__var-desc">
                    {lang === "fr" ? fr.desc : en.desc}
                  </p>
                  {colors && (
                    <div className="guide__var-colors">
                      {colors.map(({ range, label, color }) => (
                        <div key={range} className="guide__var-color-row">
                          <div
                            className="guide__var-dot"
                            style={{
                              background: color,
                              boxShadow: `0 0 6px ${color}70`,
                            }}
                          />
                          <span className="guide__var-range">{range}</span>
                          <span className="guide__var-label" style={{ color }}>
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>

          <Section
            id="cyclone-centennal"
            icon="📅"
            title={t("Le cyclone centennal", "The centennial cyclone")}
          >
            <Card>
              <div className="guide__card-title">
                {t(
                  "Qu'est-ce qu'un événement centennal ?",
                  "What is a centennial event?",
                )}
              </div>
              <p>
                {t(
                  "Un cyclone centennal est un événement dont la probabilité d'occurrence est de 1% par an, soit une fois tous les 100 ans en moyenne. Cela ne signifie pas qu'il ne peut arriver que tous les 100 ans — il peut théoriquement arriver deux années consécutives.",
                  "A centennial cyclone is an event with a 1% annual probability, meaning once every 100 years on average. This does not mean it can only occur every 100 years — it could theoretically occur in two consecutive years.",
                )}
              </p>
              <div className="guide__stat-box">
                <div className="guide__stat-item">
                  <div className="guide__stat-val">1%</div>
                  <div className="guide__stat-lbl">
                    {t("Probabilité annuelle", "Annual probability")}
                  </div>
                </div>
                <div className="guide__stat-item">
                  <div className="guide__stat-val">26%</div>
                  <div className="guide__stat-lbl">
                    {t("Probabilité sur 30 ans", "Probability over 30 years")}
                  </div>
                </div>
                <div className="guide__stat-item">
                  <div className="guide__stat-val">63%</div>
                  <div className="guide__stat-lbl">
                    {t("Probabilité sur 100 ans", "Probability over 100 years")}
                  </div>
                </div>
              </div>
            </Card>
          </Section>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB : SOURCES
      ══════════════════════════════════════════════════════ */}
      {activeTab === "sources" && (
        <div className="guide__content">
          <Section
            id="ibtracs"
            icon="🛰"
            title={t(
              "IBTrACS — Archive internationale des cyclones",
              "IBTrACS — International Best Track Archive",
            )}
          >
            <p className="guide__intro">
              {t(
                "IBTrACS (International Best Track Archive for Climate Stewardship) est la base de données mondiale de référence pour les cyclones tropicaux, gérée par la NOAA (National Oceanic and Atmospheric Administration, États-Unis) en partenariat avec l'Organisation Météorologique Mondiale (OMM).",
                "IBTrACS (International Best Track Archive for Climate Stewardship) is the world reference database for tropical cyclones, managed by NOAA (National Oceanic and Atmospheric Administration, USA) in partnership with the World Meteorological Organization (WMO).",
              )}
            </p>
            <div className="guide__two-col">
              <Card accent="#00E5FF">
                <div className="guide__card-title">
                  {t("Ce que contient IBTrACS", "What IBTrACS contains")}
                </div>
                <ul className="guide__list">
                  <li>
                    {t(
                      "Position de chaque cyclone toutes les 6 heures",
                      "Position of each cyclone every 6 hours",
                    )}
                  </li>
                  <li>
                    {t(
                      "Vitesse du vent maximale soutenue (mean_wind_speed en m/s)",
                      "Maximum sustained wind speed (mean_wind_speed in m/s)",
                    )}
                  </li>
                  <li>
                    {t(
                      "Pression centrale minimale (mean_central_pressure en hPa)",
                      "Minimum central pressure (mean_central_pressure in hPa)",
                    )}
                  </li>
                  <li>
                    {t(
                      "Saison cyclonique, nom, bassin océanique",
                      "Cyclone season, name, ocean basin",
                    )}
                  </li>
                  <li>
                    {t(
                      "Données depuis 1842 pour certains bassins",
                      "Data from 1842 for some basins",
                    )}
                  </li>
                </ul>
              </Card>
              <Card accent="#69F0AE">
                <div className="guide__card-title">
                  {t("Limites à connaître", "Known limitations")}
                </div>
                <ul className="guide__list">
                  <li>
                    {t(
                      "Données plus incomplètes avant l'ère satellite (< 1970)",
                      "More incomplete data before the satellite era (< 1970)",
                    )}
                  </li>
                  <li>
                    {t(
                      "Résolution temporelle de 6h (pas de données en temps réel)",
                      "6h temporal resolution (no real-time data)",
                    )}
                  </li>
                  <li>
                    {t(
                      "Chaque cyclone peut avoir 20-100 segments selon sa durée",
                      "Each cyclone can have 20-100 segments depending on its duration",
                    )}
                  </li>
                  <li>
                    {t(
                      "La catégorie n'est pas un champ direct → dérivée du vent",
                      "Category is not a direct field → derived from wind speed",
                    )}
                  </li>
                </ul>
              </Card>
            </div>
          </Section>

          <Section
            id="dimenc"
            icon="🏛"
            title={t(
              "DIMENC / IRD — Données surcote NC",
              "DIMENC / IRD — NC Storm Surge Data",
            )}
          >
            <Card>
              <div className="guide__card-title">
                BENEBIG 2024 · data.gouv.nc
              </div>
              <p>
                {t(
                  "Les données de surcote côtière proviennent du projet BENEBIG (BEsoins en maNage pour la gEstion des risques naturels de Bord de lIttoral de Grande-terre) mené par l'IRD (Institut de Recherche pour le Développement) en collaboration avec la DIMENC (Direction des mines de l'énergie et de l'industrie de Nouvelle-Calédonie) et l'Université de la Nouvelle-Calédonie. Le modèle numérique simule un cyclone centennal frappant directement la Grande-Terre.",
                  "Coastal storm surge data comes from the BENEBIG project (BEsoins en maNage pour la gEstion des risques naturels de Bord de lIttoral de Grande-terre) conducted by IRD (Research Institute for Development) in collaboration with DIMENC (Direction of Mines, Energy and Industry of New Caledonia) and the University of New Caledonia. The numerical model simulates a centennial cyclone directly striking Grande-Terre.",
                )}
              </p>
            </Card>
          </Section>

          <Section
            id="meteofrance"
            icon="🌤"
            title={t("Météo-France / SPEArTC", "Météo-France / SPEArTC")}
          >
            <p className="guide__intro">
              {t(
                "La base SPEArTC (South Pacific Enhanced Archive for Tropical Cyclones), gérée par Météo-France et accessible via data.gouv.nc, référence les cyclones du Pacifique Sud-Ouest depuis 1970. Elle complète IBTrACS avec des données régionales plus précises pour la zone NC/Vanuatu/Fidji.",
                "The SPEArTC database (South Pacific Enhanced Archive for Tropical Cyclones), managed by Météo-France and accessible via data.gouv.nc, references South-West Pacific cyclones since 1970. It complements IBTrACS with more precise regional data for the NC/Vanuatu/Fiji area.",
              )}
            </p>
          </Section>
        </div>
      )}
    </div>
  );
}
