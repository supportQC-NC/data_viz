// src/pages/AboutPage/AboutPage.jsx
// ============================================================
// Pacific Dataviz Challenge 2026
// À propos — Technologies + Présentation équipe
// ============================================================

import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../store/context/themeContext";
import { useLang } from "../../store/context/langContext";
import "./AboutPage.scss";

// ── Stack technologique ──────────────────────────────────────
const TECH_STACK = [
  {
    category: { fr: "Frontend", en: "Frontend" },
    items: [
      {
        name: "React 19",
        desc: { fr: "UI composants + hooks", en: "Component UI + hooks" },
        icon: "⚛",
        color: "#61DAFB",
      },
      {
        name: "Redux Toolkit",
        desc: {
          fr: "State management centralisé",
          en: "Centralised state management",
        },
        icon: "🔄",
        color: "#764ABC",
      },
      {
        name: "React Router v7",
        desc: {
          fr: "Navigation SPA multi-pages",
          en: "Multi-page SPA navigation",
        },
        icon: "🧭",
        color: "#CA4245",
      },
      {
        name: "Sass / SCSS",
        desc: {
          fr: "Styles modulaires + variables",
          en: "Modular styles + variables",
        },
        icon: "🎨",
        color: "#CC6699",
      },
    ],
  },
  {
    category: { fr: "Cartographie", en: "Mapping" },
    items: [
      {
        name: "Mapbox GL JS 3",
        desc: {
          fr: "Rendu WebGL GPU haute perf.",
          en: "High-perf GPU WebGL rendering",
        },
        icon: "🗺",
        color: "#00C4B4",
      },
      {
        name: "react-map-gl 8",
        desc: {
          fr: "Wrapper React pour Mapbox",
          en: "React wrapper for Mapbox",
        },
        icon: "📍",
        color: "#00A896",
      },
      {
        name: "GeoJSON + Turf.js",
        desc: {
          fr: "Géométries & analyses spatiales",
          en: "Geometries & spatial analysis",
        },
        icon: "📐",
        color: "#4CAF50",
      },
    ],
  },
  {
    category: { fr: "Données & Viz", en: "Data & Viz" },
    items: [
      {
        name: "Recharts",
        desc: {
          fr: "Graphiques SVG déclaratifs",
          en: "Declarative SVG charts",
        },
        icon: "📊",
        color: "#8884D8",
      },
      {
        name: "Canvas API",
        desc: {
          fr: "Animations temps réel (ocean)",
          en: "Real-time animations (ocean)",
        },
        icon: "🌊",
        color: "#00E5FF",
      },
      {
        name: "WebGL / Shaders",
        desc: { fr: "Effets visuels GPU", en: "GPU visual effects" },
        icon: "✨",
        color: "#FFD740",
      },
    ],
  },
  {
    category: { fr: "Sources de données", en: "Data sources" },
    items: [
      {
        name: "data.gouv.nc",
        desc: {
          fr: "Open data Nouvelle-Calédonie",
          en: "New Caledonia open data",
        },
        icon: "🏛",
        color: "#0066CC",
      },
      {
        name: "NOAA CO-OPS",
        desc: {
          fr: "Mesures marégraphiques live",
          en: "Live tide gauge readings",
        },
        icon: "📡",
        color: "#1976D2",
      },
      {
        name: "GIEC / IPCC AR6",
        desc: {
          fr: "Scénarios montée des eaux",
          en: "Sea level rise scenarios",
        },
        icon: "🌡",
        color: "#FF6B35",
      },
      {
        name: "Météo-France / SPEArTC",
        desc: { fr: "Données cyclones Pac. SW", en: "SW Pacific cyclone data" },
        icon: "🌀",
        color: "#EF5350",
      },
    ],
  },
];

// ── Données du projet ────────────────────────────────────────
const PROJECT_STATS = [
  {
    v: "2",
    l: { fr: "jeux de données réels", en: "real datasets" },
    c: "#00E5FF",
  },
  {
    v: "3",
    l: { fr: "pages cartes interactives", en: "interactive map pages" },
    c: "#69F0AE",
  },
  {
    v: "100%",
    l: { fr: "open data officiel", en: "official open data" },
    c: "#FF9100",
  },
];

export default function AboutPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { lang, t } = useLang();

  return (
    <div className={`about ${isDark ? "about--dark" : "about--light"}`}>
      {/* ── Hero ─────────────────────────────────────── */}
      <section className="about__hero">
        <div className="about__hero-inner">
          <div className="about__hero-tag">
            🏆 Pacific Dataviz Challenge 2026
          </div>
          <h1 className="about__hero-title">
            {lang === "fr" ? "À propos du projet" : "About the project"}
          </h1>
          <p className="about__hero-subtitle">
            {lang === "fr"
              ? "Une dataviz climatique immersive sur la montée des eaux et les cyclones du Pacifique. Données officielles data.gouv.nc · Météo-France · NOAA · GIEC."
              : "An immersive climate dataviz on sea level rise and Pacific cyclones. Official data: data.gouv.nc · Météo-France · NOAA · IPCC."}
          </p>
          <div className="about__hero-stats">
            {PROJECT_STATS.map((s) => (
              <div key={s.v} className="about__hero-stat">
                <div className="about__hero-stat-val" style={{ color: s.c }}>
                  {s.v}
                </div>
                <div className="about__hero-stat-lbl">{s.l[lang]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Présentation ─────────────────────────────── */}
      <section className="about__section">
        <div className="about__section-inner">
          <div className="about__section-tag">
            {lang === "fr" ? "👤 Présentation" : "👤 Presentation"}
          </div>
          <h2 className="about__section-title">
            {lang === "fr" ? "Qui sommes-nous ?" : "Who are we?"}
          </h2>

          {/* ▼▼▼ ZONE À COMPLÉTER — texte de présentation ▼▼▼ */}
          <div className="about__bio-placeholder">
            <div className="about__bio-avatar">🌊</div>
            <div className="about__bio-content">
              <div className="about__bio-name">
                {lang === "fr" ? "[Votre nom / équipe]" : "[Your name / team]"}
              </div>
              <div className="about__bio-role">
                {lang === "fr"
                  ? "[Votre rôle — ex: Développeur fullstack & Data visualizer, Nouvelle-Calédonie]"
                  : "[Your role — e.g.: Fullstack developer & Data visualizer, New Caledonia]"}
              </div>
              <p className="about__bio-text">
                {lang === "fr"
                  ? "[ Texte de présentation à compléter — parlez de votre parcours, votre lien avec le Pacifique, votre motivation pour ce concours… ]"
                  : "[ Presentation text to complete — talk about your background, your connection to the Pacific, your motivation for this challenge… ]"}
              </p>
            </div>
          </div>
          {/* ▲▲▲ FIN ZONE À COMPLÉTER ▲▲▲ */}
        </div>
      </section>

      {/* ── Mission ──────────────────────────────────── */}
      <section className="about__section about__section--alt">
        <div className="about__section-inner">
          <div className="about__section-tag">
            🎯 {lang === "fr" ? "Mission" : "Mission"}
          </div>
          <h2 className="about__section-title">
            {lang === "fr" ? "Pourquoi ce projet ?" : "Why this project?"}
          </h2>
          <div className="about__mission-grid">
            {[
              {
                icon: "🌊",
                title: {
                  fr: "Rendre visible l'invisible",
                  en: "Make the invisible visible",
                },
                desc: {
                  fr: "Les données climatiques existent. Elles sont complexes, abstraites, ignorées. Notre mission : les transformer en une expérience qui touche, qui choque, qui mobilise.",
                  en: "Climate data exists. It is complex, abstract, ignored. Our mission: transform it into an experience that moves, shocks, and mobilises.",
                },
              },
              {
                icon: "🗺",
                title: {
                  fr: "Ancrer dans le territoire",
                  en: "Root it in the territory",
                },
                desc: {
                  fr: "La Nouvelle-Calédonie, les îles du Pacifique — ce ne sont pas des statistiques. Ce sont des communautés, des cultures, des terres qui disparaissent.",
                  en: "New Caledonia, Pacific islands — these are not statistics. These are communities, cultures, lands disappearing.",
                },
              },
              {
                icon: "📊",
                title: {
                  fr: "Données officielles seulement",
                  en: "Official data only",
                },
                desc: {
                  fr: "data.gouv.nc · Météo-France · NOAA · GIEC AR6. Chaque chiffre est sourcé, chaque visualisation est documentée.",
                  en: "data.gouv.nc · Météo-France · NOAA · IPCC AR6. Every figure is sourced, every visualisation is documented.",
                },
              },
            ].map((m) => (
              <div key={m.icon} className="about__mission-card">
                <div className="about__mission-icon">{m.icon}</div>
                <h3 className="about__mission-title">{m.title[lang]}</h3>
                <p className="about__mission-desc">{m.desc[lang]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stack technique ──────────────────────────── */}
      <section className="about__section">
        <div className="about__section-inner">
          <div className="about__section-tag">
            ⚙ {lang === "fr" ? "Stack technique" : "Tech stack"}
          </div>
          <h2 className="about__section-title">
            {lang === "fr" ? "Technologies utilisées" : "Technologies used"}
          </h2>

          <div className="about__tech-categories">
            {TECH_STACK.map((cat) => (
              <div key={cat.category.fr} className="about__tech-cat">
                <div className="about__tech-cat-title">
                  {cat.category[lang]}
                </div>
                <div className="about__tech-grid">
                  {cat.items.map((item) => (
                    <div key={item.name} className="about__tech-card">
                      <div
                        className="about__tech-icon"
                        style={{
                          background: `${item.color}18`,
                          color: item.color,
                        }}
                      >
                        {item.icon}
                      </div>
                      <div className="about__tech-info">
                        <div
                          className="about__tech-name"
                          style={{ color: item.color }}
                        >
                          {item.name}
                        </div>
                        <div className="about__tech-desc">
                          {item.desc[lang]}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Concours ─────────────────────────────────── */}
      <section className="about__section about__section--alt">
        <div className="about__section-inner about__contest">
          <div className="about__contest-left">
            <div className="about__section-tag">
              🏆 {lang === "fr" ? "Concours" : "Competition"}
            </div>
            <h2 className="about__section-title">
              Pacific Dataviz Challenge 2026
            </h2>
            <p className="about__contest-text">
              {lang === "fr"
                ? "Organisé par la Communauté du Pacifique (SPC). Ouvert du 1er juin au 31 août 2026. Catégorie : Dataviz interactive. Données : open data officielles du Pacifique."
                : "Organised by the Pacific Community (SPC). Open from 1 June to 31 August 2026. Category: Interactive Dataviz. Data: official Pacific open data."}
            </p>
            <div className="about__contest-badges">
              {[
                "SPC",
                "DIMENC",
                "Météo-France",
                "data.gouv.nc",
                "NOAA",
                "GIEC",
              ].map((b) => (
                <span key={b} className="about__contest-badge">
                  {b}
                </span>
              ))}
            </div>
          </div>
          <div className="about__contest-right">
            <div className="about__contest-logo">🌊</div>
            <div className="about__contest-subtitle">
              {lang === "fr"
                ? "Pacific Dataviz\nChallenge 2026"
                : "Pacific Dataviz\nChallenge 2026"}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="about__cta-section">
        <h2 className="about__cta-title">
          {lang === "fr" ? "Explorer l'expérience" : "Explore the experience"}
        </h2>
        <div className="about__cta-buttons">
          <button
            className="about__cta-btn about__cta-btn--primary"
            onClick={() => navigate("/map")}
          >
            🌊 {lang === "fr" ? "Montée des eaux" : "Sea Level Rise"}
          </button>
          <button
            className="about__cta-btn about__cta-btn--secondary"
            onClick={() => navigate("/cyclones")}
          >
            🌀 {lang === "fr" ? "Cyclones" : "Cyclones"}
          </button>
          <button
            className="about__cta-btn about__cta-btn--secondary"
            onClick={() => navigate("/surcote")}
          >
            🏖 {lang === "fr" ? "Surcote côtière" : "Storm Surge"}
          </button>
          <button
            className="about__cta-btn about__cta-btn--secondary"
            onClick={() => navigate("/data")}
          >
            📊 {lang === "fr" ? "Données" : "Data"}
          </button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="about__footer">
        <div className="about__footer-logo">🌊 PacificShield</div>
        <div className="about__footer-credits">
          Pacific Dataviz Challenge 2026 · data.gouv.nc · NOAA · GIEC AR6 · CC
          BY 4.0
        </div>
      </footer>
    </div>
  );
}
