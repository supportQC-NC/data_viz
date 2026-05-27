// src/pages/AboutPage/AboutPage.jsx
import React, { useState } from "react";
import { useLang } from "../../store/context/langContext";
import "./AboutPage.scss";

const SKILLS = [
  { name: "HTML", pct: 95, cat: "web" },
  { name: "CSS / SASS", pct: 85, cat: "web" },
  { name: "JavaScript", pct: 50, cat: "web" },
  { name: "React", pct: 60, cat: "web" },
  { name: "Next.js", pct: 70, cat: "web" },
  { name: "TypeScript", pct: 55, cat: "web" },
  { name: "Redux", pct: 35, cat: "web" },
  { name: "Power BI", pct: 90, cat: "data" },
  { name: "DAX", pct: 45, cat: "data" },
  { name: "Excel", pct: 60, cat: "data" },
  { name: "Photoshop", pct: 85, cat: "design" },
  { name: "Illustrator", pct: 75, cat: "design" },
  { name: "Premiere Pro", pct: 95, cat: "design" },
  { name: "InDesign", pct: 75, cat: "design" },
];

const CAT_COLORS = { web: "#00e6ff", data: "#ffd166", design: "#ff9f43" };

const STACK = [
  "React",
  "Redux",
  "Mapbox GL",
  "Recharts",
  "SCSS",
  "Canvas API",
  "GeoJSON",
  "ArcGIS OpenData",
];

const SkillBar = ({ name, pct, color }) => (
  <div className="about-skill">
    <div className="about-skill__header">
      <span className="about-skill__name">{name}</span>
      <span className="about-skill__pct" style={{ color }}>
        {pct}%
      </span>
    </div>
    <div className="about-skill__track">
      <div
        className="about-skill__fill"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  </div>
);

export default function AboutPage() {
  const { t } = useLang();
  const [activeSkillCat, setActiveSkillCat] = useState("all");

  const filteredSkills =
    activeSkillCat === "all"
      ? SKILLS
      : SKILLS.filter((s) => s.cat === activeSkillCat);

  const EXPERIENCES = [
    {
      period: t("about.xp1_period"),
      company: t("about.xp1_company"),
      role: t("about.xp1_role"),
      desc: t("about.xp1_desc"),
    },
    {
      period: t("about.xp2_period"),
      company: t("about.xp2_company"),
      role: t("about.xp2_role"),
      desc: t("about.xp2_desc"),
    },
    {
      period: t("about.xp3_period"),
      company: t("about.xp3_company"),
      role: t("about.xp3_role"),
      desc: t("about.xp3_desc"),
    },
    {
      period: t("about.xp4_period"),
      company: t("about.xp4_company"),
      role: t("about.xp4_role"),
      desc: t("about.xp4_desc"),
    },
    {
      period: t("about.xp5_period"),
      company: t("about.xp5_company"),
      role: t("about.xp5_role"),
      desc: t("about.xp5_desc"),
    },
    {
      period: t("about.xp6_period"),
      company: t("about.xp6_company"),
      role: t("about.xp6_role"),
      desc: t("about.xp6_desc"),
    },
    {
      period: t("about.xp7_period"),
      company: t("about.xp7_company"),
      role: t("about.xp7_role"),
      desc: t("about.xp7_desc"),
    },
  ];

  const INTERESTS = [
    { icon: "💻", label: t("about.interest1") },
    { icon: "🎨", label: t("about.interest2") },
    { icon: "🌿", label: t("about.interest3") },
    { icon: "🎬", label: t("about.interest4") },
    { icon: "🍳", label: t("about.interest5") },
    { icon: "🎧", label: t("about.interest6") },
  ];

  const CAT_LABELS = {
    web: t("about.filter_web"),
    data: t("about.filter_data"),
    design: t("about.filter_design"),
  };

  return (
    <div className="about-page">
      <div className="about-page__inner">
        {/* ── Hero ── */}
        <div className="about-hero">
          <div className="about-hero__avatar">
            <div className="about-hero__avatar-ring" />
            <div className="about-hero__avatar-inner">SV</div>
          </div>
          <div className="about-hero__content">
            <span className="about-hero__label">{t("about.label")}</span>
            <h1 className="about-hero__name">{t("about.name")}</h1>
            <p className="about-hero__role">{t("about.role")}</p>
            <p className="about-hero__location">{t("about.location")}</p>
            <p className="about-hero__bio">{t("about.bio")}</p>
            <div className="about-hero__links">
              <a
                href="https://github.com/Krysto-nc-dev"
                target="_blank"
                rel="noopener noreferrer"
                className="about-link about-link--github"
              >
                ⌥ {t("about.github")}
              </a>
              <a
                href="mailto:contact@krysto.nc"
                className="about-link about-link--mail"
              >
                ✉ contact@krysto.nc
              </a>
              <a href="tel:+687939253" className="about-link about-link--phone">
                📞 +687 93.92.53
              </a>
            </div>
          </div>
        </div>

        {/* ── Compétences ── */}
        <div className="about-section">
          <div className="about-section__header">
            <h2 className="about-section__title">{t("about.skills_title")}</h2>
            <div className="about-skill-filters">
              <button
                className={`about-skill-filter${activeSkillCat === "all" ? " active" : ""}`}
                onClick={() => setActiveSkillCat("all")}
              >
                {t("about.filter_all")}
              </button>
              {Object.entries(CAT_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  className={`about-skill-filter${activeSkillCat === key ? " active" : ""}`}
                  style={
                    activeSkillCat === key
                      ? { borderColor: CAT_COLORS[key], color: CAT_COLORS[key] }
                      : {}
                  }
                  onClick={() => setActiveSkillCat(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="about-skills-grid">
            {filteredSkills.map((s, i) => (
              <SkillBar
                key={i}
                name={s.name}
                pct={s.pct}
                color={CAT_COLORS[s.cat]}
              />
            ))}
          </div>
        </div>

        {/* ── Expériences ── */}
        <div className="about-section">
          <h2 className="about-section__title">{t("about.xp_title")}</h2>
          <div className="about-timeline">
            {EXPERIENCES.map((exp, i) => (
              <div key={i} className="about-xp">
                <div className="about-xp__dot" />
                <div className="about-xp__content">
                  <div className="about-xp__header">
                    <div>
                      <h3 className="about-xp__role">{exp.role}</h3>
                      <span className="about-xp__company">{exp.company}</span>
                    </div>
                    <span className="about-xp__period">{exp.period}</span>
                  </div>
                  <p className="about-xp__desc">{exp.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Formations ── */}
        <div className="about-section">
          <h2 className="about-section__title">{t("about.edu_title")}</h2>
          <div className="about-edu-grid">
            <div className="about-edu-card">
              <span className="about-edu-card__year">
                {t("about.edu1_year")}
              </span>
              <h3 className="about-edu-card__title">{t("about.edu1_title")}</h3>
              <span className="about-edu-card__school">
                {t("about.edu1_school")}
              </span>
            </div>
            <div className="about-edu-card">
              <span className="about-edu-card__year">
                {t("about.edu2_year")}
              </span>
              <h3 className="about-edu-card__title">{t("about.edu2_title")}</h3>
              <span className="about-edu-card__school">
                {t("about.edu2_school")}
              </span>
            </div>
          </div>
        </div>

        {/* ── Langues + Intérêts ── */}
        <div className="about-section about-section--row">
          <div className="about-lang-block">
            <h2 className="about-section__title">{t("about.lang_title")}</h2>
            <div className="about-langs">
              <div className="about-lang">
                <span className="about-lang__name">{t("about.lang_fr")}</span>
                <div className="about-skill__track">
                  <div
                    className="about-skill__fill"
                    style={{ width: "100%", background: "#00e6ff" }}
                  />
                </div>
                <span className="about-lang__level">
                  {t("about.lang_fr_level")}
                </span>
              </div>
              <div className="about-lang">
                <span className="about-lang__name">{t("about.lang_en")}</span>
                <div className="about-skill__track">
                  <div
                    className="about-skill__fill"
                    style={{ width: "70%", background: "#00e6ff" }}
                  />
                </div>
                <span className="about-lang__level">
                  {t("about.lang_en_level")}
                </span>
              </div>
            </div>
          </div>

          <div className="about-interest-block">
            <h2 className="about-section__title">
              {t("about.interests_title")}
            </h2>
            <div className="about-interests">
              {INTERESTS.map((item, i) => (
                <div key={i} className="about-interest">
                  <span className="about-interest__icon">{item.icon}</span>
                  <span className="about-interest__label">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Projet ── */}
        <div className="about-project">
          <div className="about-project__badge">{t("about.project_badge")}</div>
          <h2 className="about-project__title">{t("about.project_title")}</h2>
          <p className="about-project__desc">{t("about.project_desc")}</p>
          <div className="about-project__stack">
            {STACK.map((tech, i) => (
              <span key={i} className="about-project__tech">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
