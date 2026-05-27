// src/pages/SurcoteGuidePage/SurcoteGuidePage.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../../store/context/langContext";
import "./SurcoteGuidePage.scss";

const SURCOTE_SCALE = [
  {
    range: "< 0.5 m",
    color: "#00e6ff",
    label: "Très faible",
    desc: "Élévation du niveau marin quasi imperceptible. Impact limité aux zones de très basse altitude.",
  },
  {
    range: "0.5–1 m",
    color: "#00ffd5",
    label: "Faible",
    desc: "Légère submersion des zones côtières basses lors des marées hautes. Vigilance recommandée.",
  },
  {
    range: "1–1.5 m",
    color: "#ffd166",
    label: "Modéré",
    desc: "Submersion des plages et zones basses. Risque pour les infrastructures côtières.",
  },
  {
    range: "1.5–2 m",
    color: "#ff9f43",
    label: "Élevé",
    desc: "Inondations côtières significatives. Évacuation des zones à risque recommandée.",
  },
  {
    range: "2–3 m",
    color: "#ff6b35",
    label: "Très élevé",
    desc: "Submersion étendue du littoral. Dommages importants aux infrastructures côtières.",
  },
  {
    range: "> 3 m",
    color: "#ff3b5c",
    label: "Extrême",
    desc: "Submersion catastrophique. Danger de mort. Équivalent aux pires événements historiques.",
  },
];

const ALEA_TYPES = [
  {
    name: "Érosion côtière",
    color: "#ffd166",
    icon: "🏖️",
    desc: "Recul du trait de côte par action des vagues, courants et élévation du niveau marin. Affecte principalement les plages sableuses et flèches littorales.",
    champ: "alea_erosion",
  },
  {
    name: "Submersion marine",
    color: "#ff3b5c",
    icon: "🌊",
    desc: "Envahissement temporaire de zones côtières par la mer lors de tempêtes ou cyclones. Combinaison de surcote, vague et marée astronomique.",
    champ: "alea_submersion",
  },
  {
    name: "Mouvement de terrain",
    color: "#ff9f43",
    icon: "⛰️",
    desc: "Instabilité des versants côtiers (glissements, éboulements) exacerbée par les fortes pluies cycloniques et la saturation des sols.",
    champ: "alea_mouvement_terrain",
  },
];

const FIELDS = [
  {
    name: "Surcote",
    label: "Surcote (m)",
    desc: "Différence entre le niveau marin observé et le niveau de marée astronomique. Valeur clé pour le cyclone centennal.",
  },
  {
    name: "HauteurSignificative",
    label: "Vague significative (m)",
    desc: "Hauteur moyenne du tiers supérieur des vagues. Indicateur de l\u2019énergie des vagues au trait de côte.",
  },
  {
    name: "Periode",
    label: "Période de retour (ans)",
    desc: "Fréquence statistique de l\u2019événement. 100 ans = événement ayant 1% de probabilité de se produire chaque année.",
  },
  {
    name: "Commune",
    label: "Commune",
    desc: "Commune de Nouvelle-Calédonie concernée par le point de mesure.",
  },
  {
    name: "alea_erosion",
    label: "Aléa érosion",
    desc: "Oui/Non. Indique si le segment côtier est exposé au risque d\u2019érosion côtière.",
  },
  {
    name: "alea_submersion",
    label: "Aléa submersion",
    desc: "Oui/Non. Indique si le segment est exposé au risque de submersion marine.",
  },
  {
    name: "indice_total",
    label: "Indice total",
    desc: "Score de 0 à 15 synthétisant la vulnérabilité globale du segment côtier. Plus il est élevé, plus le risque est important.",
  },
  {
    name: "indice_esi",
    label: "Indice ESI",
    desc: "Environmental Sensitivity Index. Classification internationale de la sensibilité morpho-sédimentaire du littoral.",
  },
  {
    name: "cote",
    label: "Type de côte",
    desc: "Caractérisation morphologique : côte rocheuse, mangrove, plage, estuaire, côte artificialisée, etc.",
  },
  {
    name: "avant_cote",
    label: "Avant-côte",
    desc: "Zone marine proche du rivage. Détermine l\u2019atténuation ou l\u2019amplification des vagues avant le trait de côte.",
  },
];

const FAQ_DATA = [
  {
    q: "Qu\u2019est-ce qu\u2019un cyclone centennal ?",
    a: "Un cyclone centennal est un événement dont la période de retour statistique est de 100 ans, soit une probabilité de 1% de survenir chaque année. Ce n\u2019est pas le cyclone le plus fort possible, mais une référence normative pour la planification des risques.",
  },
  {
    q: "Comment est calculée la surcote ?",
    a: "La surcote est modélisée par des simulations hydrodynamiques couplant les vents et la pression du cyclone, la bathymétrie du lagon, et la marée astronomique. Les résultats sont fournis tous les 100 m le long du trait de côte.",
  },
  {
    q: "Quelle différence entre surcote et vague significative ?",
    a: "La surcote est l\u2019élévation du niveau moyen de la mer (phénomène statique). La vague significative est l\u2019énergie des vagues au-dessus de ce niveau (phénomène dynamique). Les deux se cumulent pour déterminer le niveau d\u2019inondation total.",
  },
  {
    q: "Comment lire l\u2019indice de vulnérabilité ?",
    a: "L\u2019indice total (0-15) combine plusieurs facteurs : type d\u2019avant-côte (récif protecteur ou non), type de côte, arrière-côte (zone basse inondable ou zone élevée). Un indice ≥ 12 indique une vulnérabilité critique.",
  },
  {
    q: "Sources des données OBLIC ?",
    a: "Les données sont produites par le Service de la Géologie de Nouvelle-Calédonie (SGNC/DIMENC) et le BRGM dans le cadre de l\u2019Observatoire du Littoral de Nouvelle-Calédonie (OBLIC). Disponibles sur Géorep NC sous licence ouverte.",
  },
];

const Accordion = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`sur-guide-faq${open ? " open" : ""}`}>
      <button className="sur-guide-faq__q" onClick={() => setOpen((v) => !v)}>
        <span>{question}</span>
        <span className="sur-guide-faq__icon">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="sur-guide-faq__a">{answer}</div>}
    </div>
  );
};

export default function SurcoteGuidePage() {
  const { t } = useLang();
  const [tab, setTab] = useState("surcote");

  const TABS = [
    { id: "surcote", label: "Échelle de surcote" },
    { id: "aleas", label: "Types d\u2019aléas" },
    { id: "champs", label: "Champs de données" },
    { id: "faq", label: "FAQ" },
  ];

  return (
    <div className="sur-guide">
      <div className="sur-guide__inner">
        <div className="sur-guide__header">
          <div className="sur-guide__breadcrumb">
            <Link to="/surcote">← Surcote & Risques côtiers</Link>
          </div>
          <span className="sur-guide__label">
            Documentation · OBLIC · Géorep NC
          </span>
          <h1 className="sur-guide__title">Guide de lecture — Surcote</h1>
          <p className="sur-guide__sub">
            Comprendre les données de surcote, aléas côtiers et vulnérabilité du
            littoral de Nouvelle-Calédonie.
          </p>
        </div>

        <div className="sur-guide__tabs">
          {TABS.map((tab_item) => (
            <button
              key={tab_item.id}
              className={`sur-guide__tab${tab === tab_item.id ? " active" : ""}`}
              onClick={() => setTab(tab_item.id)}
            >
              {tab_item.label}
            </button>
          ))}
        </div>

        {tab === "surcote" && (
          <div className="sur-guide__section">
            <p className="sur-guide__intro">
              La surcote est l'élévation du niveau de la mer causée par un
              cyclone, au-delà de la marée astronomique. Pour un cyclone
              centennal, les valeurs sont calculées tous les 100 m sur le trait
              de côte de Nouvelle-Calédonie.
            </p>
            <div className="sur-guide__scale">
              {SURCOTE_SCALE.map((item, i) => (
                <div key={i} className="sur-guide__scale-card">
                  <div
                    className="sur-guide__scale-bar"
                    style={{ background: item.color }}
                  />
                  <div className="sur-guide__scale-content">
                    <div className="sur-guide__scale-header">
                      <span
                        className="sur-guide__scale-range"
                        style={{ color: item.color }}
                      >
                        {item.range}
                      </span>
                      <span
                        className={`sur-guide__scale-label sur-guide__scale-label--${i}`}
                      >
                        {item.label}
                      </span>
                    </div>
                    <p className="sur-guide__scale-desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "aleas" && (
          <div className="sur-guide__section">
            <p className="sur-guide__intro">
              Trois types d'aléas côtiers sont identifiés par l'OBLIC pour
              chaque segment du littoral. Ils peuvent se cumuler sur un même
              secteur.
            </p>
            <div className="sur-guide__aleas">
              {ALEA_TYPES.map((alea, i) => (
                <div
                  key={i}
                  className="sur-guide__alea-card"
                  style={{ borderColor: `${alea.color}33` }}
                >
                  <div className="sur-guide__alea-header">
                    <span className="sur-guide__alea-icon">{alea.icon}</span>
                    <div>
                      <h3
                        className="sur-guide__alea-title"
                        style={{ color: alea.color }}
                      >
                        {alea.name}
                      </h3>
                      <code className="sur-guide__alea-field">
                        {alea.champ}
                      </code>
                    </div>
                  </div>
                  <p className="sur-guide__alea-desc">{alea.desc}</p>
                  <div className="sur-guide__alea-indicator">
                    <div
                      className="sur-guide__alea-val"
                      style={{
                        background: `${alea.color}22`,
                        borderColor: `${alea.color}44`,
                        color: alea.color,
                      }}
                    >
                      Oui — exposé
                    </div>
                    <div className="sur-guide__alea-val">Non — non exposé</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "champs" && (
          <div className="sur-guide__section">
            <p className="sur-guide__intro">
              Les données comprennent 31 234 points de surcote et 9 229 segments
              côtiers avec leurs caractéristiques d'aléas.
            </p>
            <div className="sur-guide__table">
              <div className="sur-guide__table-header">
                <span>Champ</span>
                <span>Nom</span>
                <span>Description</span>
              </div>
              {FIELDS.map((f, i) => (
                <div key={i} className="sur-guide__table-row">
                  <code className="sur-guide__code">{f.name}</code>
                  <span className="sur-guide__field-label">{f.label}</span>
                  <span className="sur-guide__field-desc">{f.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "faq" && (
          <div className="sur-guide__section">
            <p className="sur-guide__intro">
              Questions fréquentes sur les données de surcote et aléas côtiers.
            </p>
            <div className="sur-guide__faq-list">
              {FAQ_DATA.map((item, i) => (
                <Accordion key={i} question={item.q} answer={item.a} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
