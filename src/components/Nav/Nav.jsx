// src/components/Nav/Nav.jsx
// ============================================================
// Pacific Dataviz Challenge 2026
// Navigation — 5 routes + theme + lang via Redux direct
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

const T = {
  fr: {
    map: "Montée des eaux",
    cyclones: "Cyclones",
    surcote: "Surcote",
    data: "Données",
    about: "À propos",
    lang: "EN",
    themeDark: "☀ Clair",
    themeLight: "◐ Sombre",
  },
  en: {
    map: "Sea Level",
    cyclones: "Cyclones",
    surcote: "Storm surge",
    data: "Data",
    about: "About",
    lang: "FR",
    themeDark: "☀ Light",
    themeLight: "◐ Dark",
  },
};

export default function Nav() {
  const dispatch = useDispatch();
  const theme = useSelector(selectTheme);
  const lang = useSelector(selectLang);
  const location = useLocation();
  const t = T[lang];
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Ferme le menu mobile au changement de route
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const links = [
    { to: "/map", label: t.map, icon: "🌊" },
    { to: "/cyclones", label: t.cyclones, icon: "🌀" },
    { to: "/surcote", label: t.surcote, icon: "🏖" },
    { to: "/data", label: t.data, icon: "📊" },
    { to: "/about", label: t.about, icon: "ℹ" },
  ];

  return (
    <nav className={`nav ${scrolled ? "nav--scrolled" : ""}`} role="navigation">
      {/* Logo */}
      <NavLink to="/" className="nav__logo" aria-label="Accueil">
        <span className="nav__logo-icon">🌊</span>
        <span className="nav__logo-text">
          Pacific<span>Shield</span>
        </span>
      </NavLink>

      {/* Links desktop */}
      <ul className="nav__links" role="list">
        {links.map(({ to, label, icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `nav__link ${isActive ? "nav__link--active" : ""}`
              }
            >
              <span className="nav__link-icon">{icon}</span>
              <span className="nav__link-label">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Controls */}
      <div className="nav__controls">
        <button
          className="nav__btn nav__btn--lang"
          onClick={() => dispatch(toggleLang())}
          aria-label="Toggle language"
        >
          {t.lang}
        </button>
        <button
          className="nav__btn nav__btn--theme"
          onClick={() => dispatch(toggleTheme())}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? t.themeDark : t.themeLight}
        </button>
      </div>

      {/* Burger mobile */}
      <button
        className={`nav__burger ${menuOpen ? "nav__burger--open" : ""}`}
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Menu"
        aria-expanded={menuOpen}
      >
        <span />
        <span />
        <span />
      </button>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="nav__mobile">
          {links.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav__mobile-link ${isActive ? "nav__mobile-link--active" : ""}`
              }
            >
              <span>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
          <div className="nav__mobile-controls">
            <button onClick={() => dispatch(toggleLang())}>{t.lang}</button>
            <button onClick={() => dispatch(toggleTheme())}>
              {theme === "dark" ? t.themeDark : t.themeLight}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
