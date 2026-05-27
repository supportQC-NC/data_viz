// src/components/Nav/Nav.js
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation }        from 'react-router-dom';
import { useDispatch }                 from 'react-redux';
import { closeNav }                    from '../../store/slices/uiSlice';
import { useTheme }                    from '../../store/context/themeContext';
import { useLang }                     from '../../store/context/langContext';
import './Nav.scss';

const NAV_ITEMS = [
  { key: 'map',      path: '/map',      icon: '🗺️'  },
  { key: 'cyclones', path: '/cyclones', icon: '🌀'  },
  { key: 'surcote',  path: '/surcote',  icon: '🌊'  },
  { key: 'guide',    path: '/guide',    icon: '📖'  },
  { key: 'data',     path: '/data',     icon: '📊'  },
  { key: 'about',    path: '/about',    icon: 'ℹ️'  },
];

export default function Nav() {
  const dispatch          = useDispatch();
  const { theme, toggle } = useTheme();
  const { lang, switchLang, t } = useLang();
  const location          = useLocation();

  const [scrolled,    setScrolled]    = useState(false);
  const [drawerOpen,  setDrawerOpen]  = useState(false);

  // Ferme le drawer au changement de route
  useEffect(() => {
    setDrawerOpen(false);
    dispatch(closeNav());
  }, [location.pathname, dispatch]);

  // Détecte le scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <nav className={`nav${scrolled ? ' nav--scrolled' : ''}`}>
        <div className="nav__inner">

          {/* Logo */}
          <NavLink to="/" className="nav__logo">
            <div className="nav__logo-icon">🌊</div>
            <div className="nav__logo-text">
              <span className="nav__logo-title">Pacific Climate</span>
              <span className="nav__logo-sub">Dataviz 2026</span>
            </div>
          </NavLink>

          {/* Liens desktop */}
          <ul className="nav__links">
            {NAV_ITEMS.map(({ key, path, icon }) => (
              <li key={key} className="nav__link">
                <NavLink to={path} className={({ isActive }) => isActive ? 'active' : ''}>
                  <span>{icon}</span>
                  {t(`nav.${key}`)}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Contrôles */}
          <div className="nav__controls">
            <div className="nav__lang">
              <button className={lang === 'fr' ? 'active' : ''} onClick={() => switchLang('fr')}>FR</button>
              <button className={lang === 'en' ? 'active' : ''} onClick={() => switchLang('en')}>EN</button>
            </div>

            <button className="nav__theme-btn" onClick={toggle} title={t('theme.toggle')}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            <button
              className={`nav__burger${drawerOpen ? ' open' : ''}`}
              onClick={() => setDrawerOpen(v => !v)}
              aria-label="Menu"
            >
              <span className="nav__burger-line" />
              <span className="nav__burger-line" />
              <span className="nav__burger-line" />
            </button>
          </div>
        </div>
      </nav>

      {/* Drawer mobile */}
      <div className={`nav__drawer${drawerOpen ? ' open' : ''}`}>
        {NAV_ITEMS.map(({ key, path, icon }) => (
          <NavLink key={key} to={path} className={({ isActive }) => isActive ? 'active' : ''}>
            <span>{icon}</span>
            {t(`nav.${key}`)}
          </NavLink>
        ))}
        <div className="nav__drawer-sep" />
        <div className="nav__drawer-controls">
          <div className="nav__lang">
            <button className={lang === 'fr' ? 'active' : ''} onClick={() => switchLang('fr')}>FR</button>
            <button className={lang === 'en' ? 'active' : ''} onClick={() => switchLang('en')}>EN</button>
          </div>
          <button className="nav__theme-btn" onClick={toggle}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </>
  );
}