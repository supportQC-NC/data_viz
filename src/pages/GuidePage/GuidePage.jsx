// src/pages/GuidePage/GuidePage.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../../store/context/langContext";
import "./GuidePage.scss";

const INTENSITY_SCALE = [
  {
    type: "Non classé",
    color: "#4a6a84",
    vmax: "< 17 m/s",
    pmin: "> 1005 hPa",
    risk: "faible",
  },
  {
    type: "Dépression tropicale faible",
    color: "#00b4cc",
    vmax: "17 – 24 m/s",
    pmin: "995 – 1005 hPa",
    risk: "modéré",
  },
  {
    type: "Dépression tropicale modérée",
    color: "#00e6ff",
    vmax: "25 – 32 m/s",
    pmin: "985 – 995 hPa",
    risk: "modéré",
  },
  {
    type: "Dépression tropicale forte",
    color: "#ffd166",
    vmax: "33 – 44 m/s",
    pmin: "975 – 985 hPa",
    risk: "élevé",
  },
  {
    type: "Cyclone tropical",
    color: "#ff9f43",
    vmax: "45 – 59 m/s",
    pmin: "960 – 975 hPa",
    risk: "très",
  },
  {
    type: "Cyclone tropical intense",
    color: "#ff6b35",
    vmax: "60 – 89 m/s",
    pmin: "930 – 960 hPa",
    risk: "extrême",
  },
  {
    type: "Cyclone tropical très intense",
    color: "#ff3b5c",
    vmax: "≥ 90 m/s",
    pmin: "< 930 hPa",
    risk: "catastrophique",
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
    "Niveau le plus élevé. Dommages catastrophiques, danger de mort. Correspondant aux Cat. 4–5 américains.",
};

const INTENSITY_RISK = {
  "Non classé": "Faible",
  "Dépression tropicale faible": "Faible à modéré",
  "Dépression tropicale modérée": "Modéré",
  "Dépression tropicale forte": "Élevé",
  "Cyclone tropical": "Très élevé",
  "Cyclone tropical intense": "Extrême",
  "Cyclone tropical très intense": "Catastrophique",
};

const FIELDS = [
  {
    name: "nom",
    label: "Nom",
    desc: "Nom attribué au phénomène cyclonique selon la convention internationale de l\u2019OMM.",
  },
  {
    name: "saison",
    label: "Saison",
    desc: 'Saison cyclonique format "AAAA/AAAA+1". Ex : 2023/2024 couvre nov. 2023 à avr. 2024.',
  },
  {
    name: "date",
    label: "Date/Heure",
    desc: "Position enregistrée toutes les 6 heures (00h, 06h, 12h, 18h UTC) par les radiosondages et satellites.",
  },
  {
    name: "latitude",
    label: "Latitude",
    desc: "Position en degrés décimaux. Valeur négative = hémisphère sud. La zone NC est entre -13°S et -25°S.",
  },
  {
    name: "longitude",
    label: "Longitude",
    desc: "Position en degrés décimaux. La zone NC est entre 158°E et 172°E.",
  },
  {
    name: "vmax",
    label: "Vmax (m/s)",
    desc: "Vitesse maximale du vent moyen sur 10 minutes au niveau de la mer. Indicateur principal d\u2019intensité.",
  },
  {
    name: "pmin",
    label: "Pmin (hPa)",
    desc: "Pression minimale au centre du cyclone. Plus elle est basse, plus le cyclone est intense.",
  },
  {
    name: "type",
    label: "Type",
    desc: "Classification au moment de l\u2019observation. Peut changer à chaque point de la trajectoire.",
  },
  {
    name: "vmax_traj",
    label: "Vmax traj.",
    desc: "Vitesse maximale atteinte sur l\u2019ensemble de la trajectoire. Indicateur du pic d\u2019intensité.",
  },
  {
    name: "pmin_traj",
    label: "Pmin traj.",
    desc: "Pression minimale atteinte sur l\u2019ensemble de la trajectoire. Correspond souvent au moment de Vmax.",
  },
];

const FAQ_DATA = [
  {
    q: "Pourquoi certains cyclones n\u2019ont pas de valeur Vmax ou Pmin ?",
    a: "Les données historiques avant les années 1990 sont parfois incomplètes faute de couverture satellitaire. La base SPEArTC compile les meilleures estimations disponibles.",
  },
  {
    q: "Quelle est la relation entre pression et vitesse de vent ?",
    a: "La relation est inverse et non-linéaire : quand la pression chute, le gradient s\u2019accentue, accélérant les vents. Une pression de 900 hPa correspond à des vents ≥ 100 m/s.",
  },
  {
    q: "Pourquoi la saison cyclonique dure de novembre à avril ?",
    a: "Dans le Pacifique sud, les eaux sont suffisamment chaudes (≥ 26°C) pendant l\u2019été austral pour alimenter la convection tropicale nécessaire à la formation des cyclones.",
  },
  {
    q: "Comment interpréter la trajectoire sur la carte ?",
    a: "Chaque segment est coloré selon l\u2019intensité maximale du phénomène. Les points représentent chaque observation (toutes les 6h), leur taille reflétant la vitesse de vent.",
  },
  {
    q: "Quelle est la source des données ?",
    a: "Météo-France Nouvelle-Calédonie, à partir de la base SPEArTC, enrichie d\u2019observations locales. Disponible sur Géorep NC sous licence ouverte.",
  },
];

const Accordion = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item${open ? " faq-item--open" : ""}`}>
      <button className="faq-item__question" onClick={() => setOpen((v) => !v)}>
        <span>{question}</span>
        <span className="faq-item__icon">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="faq-item__answer">{answer}</div>}
    </div>
  );
};

export default function GuidePage() {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState("intensite");

  const TABS = [
    { id: "intensite", label: t("guide.tab_intensity") },
    { id: "champs", label: t("guide.tab_fields") },
    { id: "faq", label: t("guide.tab_faq") },
    { id: "source", label: t("guide.tab_sources") },
  ];

  return (
    <div className="guide-page">
      <div className="guide-page__inner">
        {/* Header */}
        <div className="guide-page__header">
          <span className="guide-page__label">{t("guide.label")}</span>
          <h1 className="guide-page__title">{t("guide.title")}</h1>
          <p className="guide-page__sub">{t("guide.sub")}</p>
          <div className="guide-page__ctas">
            <Link to="/cyclones" className="guide-btn guide-btn--primary">
              {t("guide.cta_analyses")}
            </Link>
            <Link to="/cyclones/map" className="guide-btn guide-btn--ghost">
              {t("guide.cta_map")}
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="guide-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`guide-tab${activeTab === tab.id ? " guide-tab--active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Intensité */}
        {activeTab === "intensite" && (
          <div className="guide-section">
            <p className="guide-section__intro">{t("guide.intro_intensity")}</p>
            <div className="intensity-scale">
              {INTENSITY_SCALE.map((item, i) => (
                <div key={i} className="intensity-card">
                  <div
                    className="intensity-card__bar"
                    style={{ background: item.color }}
                  />
                  <div className="intensity-card__content">
                    <div className="intensity-card__header">
                      <span
                        className="intensity-card__type"
                        style={{ color: item.color }}
                      >
                        {item.type}
                      </span>
                      <span
                        className={`intensity-card__risk intensity-card__risk--${item.risk}`}
                      >
                        {INTENSITY_RISK[item.type]}
                      </span>
                    </div>
                    <p className="intensity-card__desc">
                      {INTENSITY_DESC[item.type]}
                    </p>
                    <div className="intensity-card__metrics">
                      <div className="intensity-card__metric">
                        <span className="intensity-card__metric-label">
                          {t("guide.vmax_label")}
                        </span>
                        <span
                          className="intensity-card__metric-value"
                          style={{ color: item.color }}
                        >
                          {item.vmax}
                        </span>
                      </div>
                      <div className="intensity-card__metric">
                        <span className="intensity-card__metric-label">
                          {t("guide.pmin_label")}
                        </span>
                        <span
                          className="intensity-card__metric-value"
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

        {/* Tab Champs */}
        {activeTab === "champs" && (
          <div className="guide-section">
            <p className="guide-section__intro">{t("guide.intro_fields")}</p>
            <div className="fields-table">
              <div className="fields-table__header">
                <span>{t("guide.field_col_field")}</span>
                <span>{t("guide.field_col_name")}</span>
                <span>{t("guide.field_col_desc")}</span>
              </div>
              {FIELDS.map((f, i) => (
                <div key={i} className="fields-table__row">
                  <code className="fields-table__code">{f.name}</code>
                  <span className="fields-table__label">{f.label}</span>
                  <span className="fields-table__desc">{f.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab FAQ */}
        {activeTab === "faq" && (
          <div className="guide-section">
            <p className="guide-section__intro">{t("guide.intro_faq")}</p>
            <div className="faq-list">
              {FAQ_DATA.map((item, i) => (
                <Accordion key={i} question={item.q} answer={item.a} />
              ))}
            </div>
          </div>
        )}

        {/* Tab Sources */}
        {activeTab === "source" && (
          <div className="guide-section">
            <p className="guide-section__intro">{t("guide.intro_sources")}</p>
            <div className="sources-grid">
              <div className="source-card">
                <div className="source-card__icon">🌀</div>
                <div className="source-card__content">
                  <h3 className="source-card__title">
                    {t("guide.source1_title")}
                  </h3>
                  <p className="source-card__desc">{t("guide.source1_desc")}</p>
                  <div className="source-card__meta">
                    <span className="source-card__badge">
                      8 148 {t("guide.badge_records")}
                    </span>
                    <span className="source-card__badge">
                      16 {t("guide.badge_fields")}
                    </span>
                    <span className="source-card__badge source-card__badge--green">
                      {t("guide.badge_open")}
                    </span>
                  </div>
                  <a
                    href="https://georep-dtsi-sgt.opendata.arcgis.com/datasets/dtsi-sgt::historique-des-positions-1/about"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="source-card__link"
                  >
                    {t("guide.source1_link")}
                  </a>
                </div>
              </div>

              <div className="source-card">
                <div className="source-card__icon">📍</div>
                <div className="source-card__content">
                  <h3 className="source-card__title">
                    {t("guide.source2_title")}
                  </h3>
                  <p className="source-card__desc">{t("guide.source2_desc")}</p>
                  <div className="source-card__meta">
                    <span className="source-card__badge">
                      212 {t("guide.badge_trajs")}
                    </span>
                    <span className="source-card__badge">
                      20 {t("guide.badge_fields")}
                    </span>
                    <span className="source-card__badge source-card__badge--green">
                      {t("guide.badge_open")}
                    </span>
                  </div>
                  <a
                    href="https://georep-dtsi-sgt.opendata.arcgis.com/datasets/dtsi-sgt::historique-des-trajectoires-1/about"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="source-card__link"
                  >
                    {t("guide.source2_link")}
                  </a>
                </div>
              </div>

              <div className="source-card">
                <div className="source-card__icon">🛰️</div>
                <div className="source-card__content">
                  <h3 className="source-card__title">
                    {t("guide.source3_title")}
                  </h3>
                  <p className="source-card__desc">{t("guide.source3_desc")}</p>
                  <div className="source-card__meta">
                    <span className="source-card__badge">
                      {t("guide.badge_since")}
                    </span>
                    <span className="source-card__badge source-card__badge--green">
                      {t("guide.badge_access")}
                    </span>
                  </div>
                  <a
                    href="https://apdrc.soest.hawaii.edu/projects/speartc"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="source-card__link"
                  >
                    {t("guide.source3_link")}
                  </a>
                </div>
              </div>

              <div className="source-card source-card--full">
                <div className="source-card__icon">📋</div>
                <div className="source-card__content">
                  <h3 className="source-card__title">
                    {t("guide.source4_title")}
                  </h3>
                  <p className="source-card__desc">{t("guide.source4_desc")}</p>
                  <p className="source-card__cite">{t("guide.source4_cite")}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
