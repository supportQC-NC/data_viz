// src/pages/CyclonesGuidePage/CyclonesGuidePage.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../../store/context/langContext";
import "./CyclonesGuidePage.scss";

const INTENSITY_SCALE = [
  {
    type: "Non classé",
    color: "#4a6a84",
    vmax: "< 17 m/s",
    pmin: "> 1005 hPa",
    risk: "Faible",
    riskKey: "faible",
  },
  {
    type: "Dépression tropicale faible",
    color: "#00b4cc",
    vmax: "17–24 m/s",
    pmin: "995–1005 hPa",
    risk: "Faible à modéré",
    riskKey: "modéré",
  },
  {
    type: "Dépression tropicale modérée",
    color: "#00e6ff",
    vmax: "25–32 m/s",
    pmin: "985–995 hPa",
    risk: "Modéré",
    riskKey: "modéré",
  },
  {
    type: "Dépression tropicale forte",
    color: "#ffd166",
    vmax: "33–44 m/s",
    pmin: "975–985 hPa",
    risk: "Élevé",
    riskKey: "élevé",
  },
  {
    type: "Cyclone tropical",
    color: "#ff9f43",
    vmax: "45–59 m/s",
    pmin: "960–975 hPa",
    risk: "Très élevé",
    riskKey: "très",
  },
  {
    type: "Cyclone tropical intense",
    color: "#ff6b35",
    vmax: "60–89 m/s",
    pmin: "930–960 hPa",
    risk: "Extrême",
    riskKey: "extrême",
  },
  {
    type: "Cyclone tropical très intense",
    color: "#ff3b5c",
    vmax: "≥ 90 m/s",
    pmin: "< 930 hPa",
    risk: "Catastrophique",
    riskKey: "catastrophique",
  },
];

const INTENSITY_DESC = {
  "Non classé":
    "Perturbation tropicale non encore classifiée. Système désorganisé en phase de développement.",
  "Dépression tropicale faible":
    "Premier stade de classification. Vents modérés, système organisé avec une circulation fermée.",
  "Dépression tropicale modérée":
    "Système bien organisé avec des vents soutenus pouvant causer des dégâts côtiers mineurs.",
  "Dépression tropicale forte":
    "Vents forts pouvant causer des dommages significatifs. Alerte cyclonique possible.",
  "Cyclone tropical":
    "Cyclone confirmé. Vents destructeurs, fortes pluies, risque de submersion côtière.",
  "Cyclone tropical intense":
    "Cyclone majeur. Dommages structurels importants, inondations généralisées, mise à l\u2019abri impérative.",
  "Cyclone tropical très intense":
    "Niveau le plus élevé. Dommages catastrophiques, danger de mort. Équivalent Cat. 4–5 américains.",
};

const FIELDS = [
  {
    name: "nom",
    label: "Nom",
    desc: "Nom attribué selon la convention internationale de l\u2019OMM.",
  },
  {
    name: "saison",
    label: "Saison",
    desc: 'Format "AAAA/AAAA+1". Ex : 2023/2024 couvre nov. 2023 à avr. 2024.',
  },
  {
    name: "date",
    label: "Date/Heure",
    desc: "Position toutes les 6h (00h, 06h, 12h, 18h UTC).",
  },
  {
    name: "latitude",
    label: "Latitude",
    desc: "Degrés décimaux. Négatif = hémisphère sud. Zone NC : -13°S à -25°S.",
  },
  {
    name: "longitude",
    label: "Longitude",
    desc: "Degrés décimaux. Zone NC : 158°E à 172°E.",
  },
  {
    name: "vmax",
    label: "Vmax (m/s)",
    desc: "Vent moyen max sur 10 min. Indicateur principal d\u2019intensité.",
  },
  {
    name: "pmin",
    label: "Pmin (hPa)",
    desc: "Pression minimale au centre. Plus basse = plus intense.",
  },
  {
    name: "type",
    label: "Type",
    desc: "Classification à chaque observation. Peut varier selon l\u2019intensification.",
  },
  {
    name: "vmax_traj",
    label: "Vmax traj.",
    desc: "Vitesse max atteinte sur l\u2019ensemble de la trajectoire.",
  },
  {
    name: "pmin_traj",
    label: "Pmin traj.",
    desc: "Pression min atteinte sur l\u2019ensemble. Correspond au pic d\u2019intensité.",
  },
];

const FAQ_DATA = [
  {
    q: "Pourquoi certains cyclones n\u2019ont pas de Vmax ou Pmin ?",
    a: "Les données historiques avant 1990 sont parfois incomplètes faute de couverture satellitaire. La base SPEArTC compile les meilleures estimations disponibles.",
  },
  {
    q: "Relation entre pression et vitesse de vent ?",
    a: "Relation inverse non-linéaire : quand la pression chute, le gradient s\u2019accentue, accélérant les vents. 900 hPa ≈ vents ≥ 100 m/s.",
  },
  {
    q: "Pourquoi la saison cyclonique de novembre à avril ?",
    a: "Eaux suffisamment chaudes (≥ 26°C) pendant l\u2019été austral pour alimenter la convection tropicale nécessaire.",
  },
  {
    q: "Comment lire la trajectoire sur la carte ?",
    a: "Chaque segment est coloré selon l\u2019intensité maximale. Les points représentent chaque observation (6h), leur taille reflète la vitesse de vent.",
  },
  {
    q: "Source des données ?",
    a: "Météo-France Nouvelle-Calédonie, à partir de la base SPEArTC, enrichie d\u2019observations locales. Disponible sur Géorep NC sous licence ouverte.",
  },
];

const Accordion = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`cyc-guide-faq${open ? " open" : ""}`}>
      <button className="cyc-guide-faq__q" onClick={() => setOpen((v) => !v)}>
        <span>{question}</span>
        <span className="cyc-guide-faq__icon">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="cyc-guide-faq__a">{answer}</div>}
    </div>
  );
};

export default function CyclonesGuidePage() {
  const { t } = useLang();
  const [tab, setTab] = useState("intensite");

  const TABS = [
    { id: "intensite", label: "Échelle d\u2019intensité" },
    { id: "champs", label: "Champs de données" },
    { id: "faq", label: "FAQ" },
    { id: "sources", label: "Sources" },
  ];

  return (
    <div className="cyc-guide">
      <div className="cyc-guide__inner">
        <div className="cyc-guide__header">
          <div className="cyc-guide__breadcrumb">
            <Link to="/cyclones">← Analyses cyclones</Link>
            <span>·</span>
            <Link to="/cyclones/map">Carte</Link>
          </div>
          <span className="cyc-guide__label">
            Documentation · Données cycloniques
          </span>
          <h1 className="cyc-guide__title">Guide de lecture — Cyclones</h1>
          <p className="cyc-guide__sub">
            Comprendre les données cycloniques du Pacifique Sud —
            classification, champs, interprétation et sources.
          </p>
        </div>

        <div className="cyc-guide__tabs">
          {TABS.map((tab_item) => (
            <button
              key={tab_item.id}
              className={`cyc-guide__tab${tab === tab_item.id ? " active" : ""}`}
              onClick={() => setTab(tab_item.id)}
            >
              {tab_item.label}
            </button>
          ))}
        </div>

        {tab === "intensite" && (
          <div className="cyc-guide__section">
            <p className="cyc-guide__intro">
              7 niveaux d'intensité définis par la vitesse maximale du vent
              moyen sur 10 minutes et la pression centrale minimale.
            </p>
            <div className="cyc-guide__scale">
              {INTENSITY_SCALE.map((item, i) => (
                <div key={i} className="cyc-guide__scale-card">
                  <div
                    className="cyc-guide__scale-bar"
                    style={{ background: item.color }}
                  />
                  <div className="cyc-guide__scale-content">
                    <div className="cyc-guide__scale-header">
                      <span
                        className="cyc-guide__scale-type"
                        style={{ color: item.color }}
                      >
                        {item.type}
                      </span>
                      <span
                        className={`cyc-guide__scale-risk cyc-guide__scale-risk--${item.riskKey}`}
                      >
                        {item.risk}
                      </span>
                    </div>
                    <p className="cyc-guide__scale-desc">
                      {INTENSITY_DESC[item.type]}
                    </p>
                    <div className="cyc-guide__scale-metrics">
                      <div className="cyc-guide__metric">
                        <span className="cyc-guide__metric-label">
                          Vent max
                        </span>
                        <span
                          className="cyc-guide__metric-value"
                          style={{ color: item.color }}
                        >
                          {item.vmax}
                        </span>
                      </div>
                      <div className="cyc-guide__metric">
                        <span className="cyc-guide__metric-label">
                          Pression min
                        </span>
                        <span
                          className="cyc-guide__metric-value"
                          style={{ color: item.color }}
                        >
                          {item.pmin}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "champs" && (
          <div className="cyc-guide__section">
            <p className="cyc-guide__intro">
              16 champs pour les positions, 20 pour les trajectoires.
            </p>
            <div className="cyc-guide__table">
              <div className="cyc-guide__table-header">
                <span>Champ</span>
                <span>Nom</span>
                <span>Description</span>
              </div>
              {FIELDS.map((f, i) => (
                <div key={i} className="cyc-guide__table-row">
                  <code className="cyc-guide__code">{f.name}</code>
                  <span className="cyc-guide__field-label">{f.label}</span>
                  <span className="cyc-guide__field-desc">{f.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "faq" && (
          <div className="cyc-guide__section">
            <p className="cyc-guide__intro">
              Questions fréquentes sur l'interprétation des données cycloniques.
            </p>
            <div className="cyc-guide__faq-list">
              {FAQ_DATA.map((item, i) => (
                <Accordion key={i} question={item.q} answer={item.a} />
              ))}
            </div>
          </div>
        )}

        {tab === "sources" && (
          <div className="cyc-guide__section">
            <p className="cyc-guide__intro">
              Sources officielles ouvertes conformes au Pacific Dataviz
              Challenge 2026.
            </p>
            <div className="cyc-guide__sources">
              {[
                {
                  icon: "🌀",
                  title: "Positions cycloniques — Géorep NC",
                  desc: "8 148 enregistrements toutes les 6h depuis 1977/1978. Météo-France Nouvelle-Calédonie.",
                  badge: "Licence ouverte",
                  link: "https://georep-dtsi-sgt.opendata.arcgis.com/datasets/63e27e6671324498838e4944035a3cc0_0",
                },
                {
                  icon: "📍",
                  title: "Trajectoires cycloniques — Géorep NC",
                  desc: "212 trajectoires complètes avec caractéristiques globales.",
                  badge: "Licence ouverte",
                  link: "https://georep-dtsi-sgt.opendata.arcgis.com/datasets/63e27e6671324498838e4944035a3cc0_1",
                },
                {
                  icon: "🛰️",
                  title: "SPEArTC — Base internationale",
                  desc: "South Pacific Enhanced Archive of Tropical Cyclones. Depuis 1840.",
                  badge: "Open access",
                  link: "https://apdrc.soest.hawaii.edu/projects/speartc",
                },
              ].map((src, i) => (
                <div key={i} className="cyc-guide__source-card">
                  <span className="cyc-guide__source-icon">{src.icon}</span>
                  <div className="cyc-guide__source-content">
                    <h3 className="cyc-guide__source-title">{src.title}</h3>
                    <p className="cyc-guide__source-desc">{src.desc}</p>
                    <div className="cyc-guide__source-footer">
                      <span className="cyc-guide__source-badge">
                        {src.badge}
                      </span>
                      <a
                        href={src.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cyc-guide__source-link"
                      >
                        Voir la source →
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
