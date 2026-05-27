// src/components/Footer/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../../store/context/langContext';
import './Footer.scss';

const NAV_LINKS = [
  { key: 'map',      path: '/map'      },
  { key: 'cyclones', path: '/cyclones' },
  { key: 'surcote',  path: '/surcote'  },
  { key: 'guide',    path: '/guide'    },
  { key: 'data',     path: '/data'     },
  { key: 'about',    path: '/about'    },
];

const DATASETS = ['ds1', 'ds2', 'ds3', 'ds4', 'ds5', 'ds6'];

export default function Footer() {
  const { t } = useLang();

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__grid">

          {/* Brand */}
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              <div className="footer__logo-icon">🌊</div>
              <div>
                <span className="footer__logo-title">Pacific Climate</span>
                <span className="footer__logo-sub">Dataviz 2026</span>
              </div>
            </Link>
            <p className="footer__tagline">{t('footer.tagline')}</p>
            <div className="footer__badge">
              <span className="footer__badge-dot" />
              {t('footer.challenge')}
            </div>
          </div>

          {/* Navigation */}
          <div className="footer__col">
            <h3 className="footer__col-title">{t('footer.navigation')}</h3>
            <ul className="footer__links">
              {NAV_LINKS.map(({ key, path }) => (
                <li key={key}>
                  <Link to={path}>{t(`nav.${key}`)}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Données */}
          <div className="footer__col">
            <h3 className="footer__col-title">{t('footer.data_sources')}</h3>
            <ul className="footer__datasets">
              {DATASETS.map(k => (
                <li key={k}>{t(`landing.${k}`)}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="footer__bottom">
          <p className="footer__legal">{t('footer.legal')}</p>
          <p className="footer__rights">{t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  );
}