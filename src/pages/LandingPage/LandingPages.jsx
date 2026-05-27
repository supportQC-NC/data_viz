// src/pages/LandingPage/LandingPages.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useLang } from "../../store/context/langContext";
import Hero from "../../components/Hero/Hero";
import Footer from "../../components/Footer/Footer";
import cycloneImg from "../../cyclone.png";
import "./LandingPage.scss";

// ── Stat card ────────────────────────────────────────────────
function StatCard({ value, label, sub, danger }) {
  return (
    <div className="stat-card">
      <span
        className={`stat-card__value${danger ? " stat-card__value--danger" : ""}`}
      >
        {value}
      </span>
      <span className="stat-card__label">{label}</span>
      <span className="stat-card__sub">{sub}</span>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────
export default function LandingPage() {
  const { t } = useLang();

  return (
    <div className="landing">
      {/* ── HERO ── */}
      <Hero />

      {/* ── STATS ── */}
      <section className="stats">
        <div className="stats__inner">
          <StatCard
            value={t("landing.stat1_value")}
            label={t("landing.stat1_label")}
            sub={t("landing.stat1_sub")}
            danger
          />
          <StatCard
            value={t("landing.stat2_value")}
            label={t("landing.stat2_label")}
            sub={t("landing.stat2_sub")}
          />
          <StatCard
            value={t("landing.stat3_value")}
            label={t("landing.stat3_label")}
            sub={t("landing.stat3_sub")}
            danger
          />
          <StatCard
            value={t("landing.stat4_value")}
            label={t("landing.stat4_label")}
            sub={t("landing.stat4_sub")}
          />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="features">
        {/* Cyclones */}
        <div className="feature">
          <div className="feature__content">
            <span className="feature__label">
              {t("landing.section1_label")}
            </span>
            <h2 className="feature__title">{t("landing.section1_title")}</h2>
            <p className="feature__body">{t("landing.section1_body")}</p>
            <Link to="/cyclones" className="btn btn--primary">
              {t("landing.section1_cta")} →
            </Link>
          </div>
          <div className="feature__visual">
            <div className="visual-cyclone">
              <img
                src={cycloneImg}
                alt="Cyclone"
                className="visual-cyclone__img"
              />
              <div className="visual-cyclone__glow" />
            </div>
          </div>
        </div>

        {/* Surcote */}
        <div className="feature feature--reverse">
          <div className="feature__content">
            <span className="feature__label">
              {t("landing.section2_label")}
            </span>
            <h2 className="feature__title">{t("landing.section2_title")}</h2>
            <p className="feature__body">{t("landing.section2_body")}</p>
            <Link to="/surcote" className="btn btn--primary">
              {t("landing.section2_cta")} →
            </Link>
          </div>
          <div className="feature__visual">
            <div className="visual-surcote">
              <div className="visual-surcote__wave" />
              <div className="visual-surcote__wave" />
              <div className="visual-surcote__wave" />
              <div className="visual-surcote__wave" />
              <div className="visual-surcote__line visual-surcote__line--normal" />
              <div className="visual-surcote__line visual-surcote__line--danger" />
            </div>
          </div>
        </div>

        {/* Récifs */}
        <div className="feature">
          <div className="feature__content">
            <span className="feature__label">
              {t("landing.section3_label")}
            </span>
            <h2 className="feature__title">{t("landing.section3_title")}</h2>
            <p className="feature__body">{t("landing.section3_body")}</p>
            <Link to="/map" className="btn btn--primary">
              {t("landing.section3_cta")} →
            </Link>
          </div>
          <div className="feature__visual">
            <div className="visual-coral">
              <div className="visual-coral__reef">
                {[...Array(10)].map((_, i) => (
                  <span key={i} />
                ))}
              </div>
              <div className="visual-coral__temp">🌡 +1.8°C</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DATASETS ── */}
      <section className="datasets-section">
        <div className="datasets-section__inner">
          <div className="datasets-section__header">
            <span className="datasets-section__label">
              {t("landing.footer_datasets")}
            </span>
            <h2 className="datasets-section__title">
              {t("landing.datasets_title")}
            </h2>
          </div>
          <div className="datasets-grid">
            {[
              { icon: "🌀", key: "ds1" },
              { icon: "🌊", key: "ds2" },
              { icon: "🪸", key: "ds3" },
              { icon: "🏖️", key: "ds4" },
              { icon: "⚠️", key: "ds5" },
              { icon: "🌡️", key: "ds6" },
            ].map(({ icon, key }) => (
              <div key={key} className="dataset-chip">
                <div className="dataset-chip__icon">{icon}</div>
                <span className="dataset-chip__text">
                  {t(`landing.${key}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
