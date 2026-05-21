// src/pages/LandingPage/LandingPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.scss';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing">

      {/* HERO */}
      <section className="landing__hero">
        <div className="landing__hero-bg" />

        <nav className="landing__nav">
          <div className="landing__logo">
            🌊 PacificShield
          </div>
          <button
            className="btn btn--outline"
            onClick={() => navigate('/map')}
          >
            Explorer la carte
          </button>
        </nav>

        <div className="landing__hero-content">
          <span className="landing__badge">
            🛰️ Données satellites en temps réel
          </span>

          <h1 className="landing__title">
            Les boucliers naturels
            <span className="landing__title--accent"> du Pacifique</span>
          </h1>

          <p className="landing__subtitle">
            Mangroves, récifs coralliens, herbiers marins — 
            visualisez les écosystèmes qui protègent les îles du Pacifique 
            face à la montée des eaux.
          </p>

          <div className="landing__cta">
            <button
              className="btn btn--primary btn--lg"
              onClick={() => navigate('/map')}
            >
              Explorer maintenant →
            </button>
            <button className="btn btn--ghost btn--lg">
              En savoir plus
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="landing__stats">
          <div className="landing__stat">
            <span className="landing__stat-value">147</span>
            <span className="landing__stat-label">Îles surveillées</span>
          </div>
          <div className="landing__stat">
            <span className="landing__stat-value">3.2M</span>
            <span className="landing__stat-label">Ha de mangroves</span>
          </div>
          <div className="landing__stat">
            <span className="landing__stat-value">-40%</span>
            <span className="landing__stat-label">Coraux depuis 1980</span>
          </div>
          <div className="landing__stat">
            <span className="landing__stat-value">+4mm</span>
            <span className="landing__stat-label">Montée/an des eaux</span>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="landing__features">
        <h2 className="landing__section-title">Ce que vous pouvez explorer</h2>

        <div className="landing__cards">
          <div className="landing__card landing__card--mangrove">
            <div className="landing__card-icon">🌿</div>
            <h3>Mangroves</h3>
            <p>Évolution des surfaces, santé des forêts côtières, zones de déforestation critique.</p>
          </div>

          <div className="landing__card landing__card--coral">
            <div className="landing__card-icon">🪸</div>
            <h3>Récifs Coralliens</h3>
            <p>Stress thermique, événements de blanchissement, zones de protection marine.</p>
          </div>

          <div className="landing__card landing__card--sealevel">
            <div className="landing__card-icon">🌊</div>
            <h3>Montée des eaux</h3>
            <p>Projections 2050-2100, zones inondables, impact sur les communautés côtières.</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing__footer">
        <p>Données : JAXA · NOAA · NASA · Pacific Data Hub</p>
        <p>Open Source · CC BY 4.0</p>
      </footer>

    </div>
  );
};

export default LandingPage;
