// components/Nav/Nav.jsx
// ============================================================
// Pacific Dataviz Challenge 2026
// Navigation globale — dark/light + fr/en + routes
// ============================================================

import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  toggleTheme,
  toggleLang,
  selectTheme,
  selectLang,
} from "../../store/slices/uiSlice";
import "./Nav.scss";

// Traductions nav
const NAV_LABELS = {
  fr: {
    map: "Carte",
    data: "Données",
    about: "À propos",
    theme: { dark: "☀ Clair", light: "◐ Sombre" },
    lang: "EN",
  },
  en: {
    map: "Map",
    data: "Data",
    about: "About",
    theme: { dark: "☀ Light", light: "◐ Dark" },
    lang: "FR",
  },
};

export default function Nav() {
  const dispatch = useDispatch();
  const theme = useSelector(selectTheme);
  const lang = useSelector(selectLang);
  const location = useLocation();
  const t = NAV_LABELS[lang];

  // Scroll effect
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`nav ${scrolled ? "nav--scrolled" : ""}`} role="navigation">
      {/* Logo */}
      <NavLink to="/" className="nav__logo" aria-label="Accueil">
        <span className="nav__logo-icon">🌊</span>
        <span className="nav__logo-text">
          Pacific<span>Storm</span>
        </span>
      </NavLink>

      {/* Links */}
      <ul className="nav__links" role="list">
        <li>
          <NavLink
            to="/map"
            className={({ isActive }) =>
              `nav__link ${isActive ? "nav__link--active" : ""}`
            }
          >
            {t.map}
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/data"
            className={({ isActive }) =>
              `nav__link ${isActive ? "nav__link--active" : ""}`
            }
          >
            {t.data}
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `nav__link ${isActive ? "nav__link--active" : ""}`
            }
          >
            {t.about}
          </NavLink>
        </li>
      </ul>

      {/* Controls */}
      <div className="nav__controls">
        <button
          className="nav__btn nav__btn--lang"
          onClick={() => dispatch(toggleLang())}
          aria-label={`Passer en ${t.lang}`}
        >
          {t.lang}
        </button>
        <button
          className="nav__btn nav__btn--theme"
          onClick={() => dispatch(toggleTheme())}
          aria-label={t.theme[theme]}
        >
          {t.theme[theme]}
        </button>
      </div>
    </nav>
  );
}
