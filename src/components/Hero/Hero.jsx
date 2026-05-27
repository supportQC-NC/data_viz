// src/components/Hero/Hero.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useLang } from "../../store/context/langContext";
import "./Hero.scss";

export default function Hero() {
  const { t } = useLang();

  return (
    <section className="hero">
      <div className="hero__bg" />
      <div className="hero__overlay" />

      <div className="hero__content">
        <div className="hero__badge">
          <span className="hero__badge-dot" />
          {t("landing.badge")}
        </div>

        <h1 className="hero__headline">
          <span className="hero__headline-accent">
            {t("landing.headline1")}
          </span>
          <span className="hero__headline-line">{t("landing.headline2")}</span>
          <span className="hero__headline-danger">
            {t("landing.headline3")}
          </span>
        </h1>

        <p className="hero__subtitle">{t("landing.subtitle")}</p>

        <div className="hero__cta">
          <Link to="/map" className="hero__btn hero__btn--primary">
            🗺️ {t("landing.cta_explore")}
          </Link>
          <Link to="/data" className="hero__btn hero__btn--ghost">
            📊 {t("landing.cta_data")}
          </Link>
        </div>
      </div>

      <div className="hero__scroll">
        <span className="hero__scroll-label">{t("landing.scroll")}</span>
        <div className="hero__scroll-arrow">
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="hero__fade" />
    </section>
  );
}
