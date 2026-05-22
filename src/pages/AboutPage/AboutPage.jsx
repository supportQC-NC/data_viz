// src/pages/AboutPage/AboutPage.jsx

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AboutPage.scss";

const MANGROVE_STATS = [
  {
    value: "40%",
    label: "des mangroves mondiales perdues",
    sub: "depuis 1980",
    color: "#FF6B35",
    icon: "🌿",
  },
  {
    value: "3.2M",
    label: "hectares dans le Pacifique",
    sub: "surface restante surveillée",
    color: "#00E5C3",
    icon: "🛰️",
  },
  {
    value: "70×",
    label: "plus efficaces que les forêts",
    sub: "pour le stockage de carbone",
    color: "#69F0AE",
    icon: "🌱",
  },
  {
    value: "1Md",
    label: "personnes protégées",
    sub: "des submersions côtières",
    color: "#40C4FF",
    icon: "👥",
  },
];

const TIMELINE = [
  {
    year: "1980",
    title: "L'âge d'or des mangroves",
    desc: "Le Pacifique abrite 35% des mangroves mondiales. Ces forêts côtières absorbent 5x plus de CO₂ que les forêts terrestres et protègent naturellement des cyclones.",
    seaLevel: "+0 mm",
    color: "#69F0AE",
    icon: "🌿",
  },
  {
    year: "2000",
    title: "Le tournant silencieux",
    desc: "La déforestation côtière s'accélère. Aquaculture, urbanisation, exploitation forestière : 25% des mangroves disparaissent en 20 ans.",
    seaLevel: "+25 mm",
    color: "#FFD740",
    icon: "⚠️",
  },
  {
    year: "2016",
    title: "Winston — Le réveil brutal",
    desc: "Le cyclone Winston dévaste les Fidji. Les zones protégées par des mangroves subissent beaucoup moins de dégâts.",
    seaLevel: "+80 mm",
    color: "#FF6D00",
    icon: "🌀",
  },
  {
    year: "2023",
    title: "L'urgence absolue",
    desc: "Température océanique record, blanchissement des coraux et accélération de la montée des eaux.",
    seaLevel: "+168 mm",
    color: "#FF5252",
    icon: "🚨",
  },
  {
    year: "2100",
    title: "Le monde à +1m",
    desc: "Sans action, des millions de personnes seront exposées. Les mangroves peuvent réduire fortement les impacts côtiers.",
    seaLevel: "+1 000 mm",
    color: "#D50000",
    icon: "⏳",
  },
];

const TEAM_DATA = [
  {
    name: "Données satellites",
    source: "JAXA ALOS-2",
    color: "#40C4FF",
    icon: "🛰️",
  },
  {
    name: "Niveaux marins",
    source: "NOAA Tide Gauges",
    color: "#00E5FF",
    icon: "🌊",
  },
  {
    name: "Projections IPCC",
    source: "AR6 — SSP1-2.6 / SSP5-8.5",
    color: "#69F0AE",
    icon: "📊",
  },
  {
    name: "Mangroves",
    source: "Global Mangrove Watch",
    color: "#00E5C3",
    icon: "🌿",
  },
  { name: "Cyclones", source: "IBTrACS NOAA", color: "#FF6D00", icon: "🌀" },
  {
    name: "Populations",
    source: "CoastalDEM v2",
    color: "#FF5252",
    icon: "👥",
  },
];

const safeNumber = (value, fallback = 0) =>
  Number.isFinite(value) ? value : fallback;

const WaveBackground = () => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const width = Math.max(
        1,
        Math.floor(rect.width || window.innerWidth || 1),
      );
      const height = Math.max(
        1,
        Math.floor(rect.height || window.innerHeight || 1),
      );

      canvas.width = width * dpr;
      canvas.height = height * dpr;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const render = () => {
      const rect = canvas.getBoundingClientRect();

      const w = Math.max(1, safeNumber(rect.width, window.innerWidth || 1));
      const h = Math.max(1, safeNumber(rect.height, window.innerHeight || 1));
      const t = safeNumber(timeRef.current, 0);

      ctx.clearRect(0, 0, w, h);

      for (let layer = 0; layer < 3; layer += 1) {
        const amp = 15 + layer * 8;
        const freq = 0.003 + layer * 0.001;
        const speed = 0.3 + layer * 0.15;
        const yBase = h * (0.6 + layer * 0.12);
        const alpha = Math.min(1, Math.max(0, 0.04 + layer * 0.02));

        ctx.beginPath();
        ctx.moveTo(0, h);

        for (let x = 0; x <= w; x += 4) {
          const y =
            yBase +
            Math.sin(x * freq + t * speed) * amp +
            Math.sin(x * freq * 1.7 + t * speed * 0.6) * amp * 0.4;

          ctx.lineTo(x, safeNumber(y, yBase));
        }

        ctx.lineTo(w, h);
        ctx.closePath();

        ctx.fillStyle = `rgba(0, 180, 255, ${alpha})`;
        ctx.fill();
      }

      timeRef.current += 0.01;
      animRef.current = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    animRef.current = requestAnimationFrame(render);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="about__waves" aria-hidden="true" />;
};

const AnimatedStat = ({ stat, index }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.3 },
    );

    if (ref.current) obs.observe(ref.current);

    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`about__stat-card ${visible ? "about__stat-card--visible" : ""}`}
      style={{
        "--delay": `${index * 0.12}s`,
        "--accent": stat.color,
        borderColor: `${stat.color}30`,
      }}
    >
      <div className="about__stat-icon">{stat.icon}</div>
      <div className="about__stat-value" style={{ color: stat.color }}>
        {stat.value}
      </div>
      <div className="about__stat-label">{stat.label}</div>
      <div className="about__stat-sub">{stat.sub}</div>
      <div
        className="about__stat-glow"
        style={{
          background: `radial-gradient(circle, ${stat.color}15, transparent 70%)`,
        }}
      />
    </div>
  );
};

const TimelineItem = ({ item, index, isLast }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const isRight = index % 2 === 1;

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 },
    );

    if (ref.current) obs.observe(ref.current);

    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`about__tl-item ${isRight ? "about__tl-item--right" : ""} ${visible ? "about__tl-item--visible" : ""}`}
      style={{ "--delay": `${index * 0.08}s`, "--accent": item.color }}
    >
      <div className="about__tl-spine">
        <div
          className="about__tl-node"
          style={{
            background: item.color,
            boxShadow: `0 0 24px ${item.color}, 0 0 48px ${item.color}44`,
          }}
        >
          <span>{item.icon}</span>
        </div>

        {!isLast && (
          <div
            className="about__tl-line"
            style={{
              background: `linear-gradient(to bottom, ${item.color}80, transparent)`,
            }}
          />
        )}
      </div>

      <div
        className="about__tl-card"
        style={{
          borderColor: `${item.color}40`,
          boxShadow: `0 0 40px ${item.color}10, inset 0 0 20px ${item.color}05`,
        }}
      >
        <div className="about__tl-year" style={{ color: item.color }}>
          {item.year}
        </div>
        <div className="about__tl-title">{item.title}</div>
        <div className="about__tl-desc">{item.desc}</div>
        <div
          className="about__tl-sea"
          style={{ borderColor: `${item.color}50`, color: item.color }}
        >
          🌊 Niveau marin : {item.seaLevel}
        </div>
      </div>
    </div>
  );
};

const AboutPage = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY || 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const parallaxStyle = {
    transform: `translateY(${safeNumber(scrollY * 0.3, 0)}px)`,
    opacity: Math.max(0, Math.min(1, 1 - safeNumber(scrollY, 0) / 600)),
  };

  return (
    <div className="about">
      <WaveBackground />

      <nav className="about__nav">
        <button
          type="button"
          className="about__nav-logo"
          onClick={() => navigate("/")}
        >
          🌊 PacificShield
        </button>

        <div className="about__nav-links">
          <button
            type="button"
            onClick={() => navigate("/map")}
            className="about__nav-btn"
          >
            Explorer la carte →
          </button>
        </div>
      </nav>

      <section className="about__hero">
        <div className="about__hero-content" style={parallaxStyle}>
          <div className="about__hero-badge">
            <span className="about__badge-dot" />
            Pacific Dataviz Challenge 2026
          </div>

          <h1 className="about__hero-title">
            La forêt qui
            <br />
            <span className="about__hero-accent">retient la mer</span>
          </h1>

          <p className="about__hero-lead">
            Dans le Pacifique, une armée silencieuse de mangroves lutte depuis
            des millénaires contre la montée des eaux. Nous la perdons à un
            rythme alarmant.
          </p>

          <div className="about__hero-scroll">
            <span>Scroll pour explorer</span>
            <div className="about__scroll-arrow" />
          </div>
        </div>

        <div className="about__hero-grid" />
        <div className="about__hero-glow" />
      </section>

      <section className="about__manifesto">
        <div className="about__manifesto-inner">
          {[
            [
              "#00E5FF",
              "PacificShield est né d’une conviction : les données climatiques doivent être visibles, tangibles, émotionnelles.",
            ],
            [
              "#69F0AE",
              "Chaque mangrove détruite est une digue naturelle perdue. Chaque millimètre de montée des eaux est une réalité vécue.",
            ],
            [
              "#FF6B35",
              "Nous avons cartographié l’invisible pour rendre l’urgence impossible à ignorer.",
            ],
          ].map(([color, text]) => (
            <div key={text} className="about__manifesto-line">
              <div
                className="about__manifesto-bar"
                style={{ background: color }}
              />
              <p>
                <strong style={{ color }}>PacificShield</strong> — {text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="about__stats">
        <div className="about__section-header">
          <div className="about__section-tag">🌿 Mangroves</div>
          <h2 className="about__section-title">La première ligne de défense</h2>
          <p className="about__section-sub">
            Les mangroves stockent du carbone, filtrent l’eau, protègent les
            côtes et forment un rempart naturel contre les cyclones.
          </p>
        </div>

        <div className="about__stats-grid">
          {MANGROVE_STATS.map((stat, index) => (
            <AnimatedStat key={stat.value} stat={stat} index={index} />
          ))}
        </div>

        <div className="about__mangrove-diagram">
          <div className="about__diag-title">
            Pourquoi les mangroves sont irremplaçables
          </div>

          <div className="about__diag-items">
            {[
              {
                icon: "💨",
                label: "Brise-vent",
                desc: "Réduit la force des cyclones",
              },
              {
                icon: "🌊",
                label: "Atténuation",
                desc: "Absorbe les vagues de submersion",
              },
              {
                icon: "🐟",
                label: "Nurserie",
                desc: "Protège les espèces marines",
              },
              {
                icon: "🌍",
                label: "Carbone bleu",
                desc: "Stocke énormément de carbone",
              },
              {
                icon: "💧",
                label: "Épuration",
                desc: "Filtre les polluants côtiers",
              },
              { icon: "🏝️", label: "Protection", desc: "Stabilise les côtes" },
            ].map((item) => (
              <div key={item.label} className="about__diag-item">
                <div className="about__diag-icon">{item.icon}</div>
                <div className="about__diag-label">{item.label}</div>
                <div className="about__diag-desc">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="about__timeline">
        <div className="about__section-header">
          <div className="about__section-tag">📅 Chronologie</div>
          <h2 className="about__section-title">40 ans de crise silencieuse</h2>
          <p className="about__section-sub">
            De la déforestation aux projections de 2100, la crise climatique du
            Pacifique s’est construite progressivement.
          </p>
        </div>

        <div className="about__tl-wrap">
          <div className="about__tl-center-line" />

          {TIMELINE.map((item, index) => (
            <TimelineItem
              key={item.year}
              item={item}
              index={index}
              isLast={index === TIMELINE.length - 1}
            />
          ))}
        </div>
      </section>

      <section className="about__stats">
        <div className="about__section-header">
          <div className="about__section-tag">🌊 Montée des eaux</div>
          <h2 className="about__section-title">
            Quand l’océan gagne du terrain
          </h2>
          <p className="about__section-sub">
            Une hausse moyenne du niveau de la mer de 1 mètre ne submerge pas
            les montagnes du Pacifique, mais transforme profondément les zones
            côtières, les îlots bas et les infrastructures littorales.
          </p>
        </div>

        <div className="about__mangrove-diagram">
          <div className="about__diag-title">
            Ce que +1 mètre change réellement
          </div>

          <div className="about__diag-items">
            {[
              {
                icon: "🏝️",
                label: "Zones basses",
                desc: "Les plaines littorales et îlots bas deviennent fortement exposés.",
              },
              {
                icon: "🌊",
                label: "Submersion",
                desc: "Les fortes marées et cyclones provoquent des inondations plus destructrices.",
              },
              {
                icon: "💧",
                label: "Eau douce",
                desc: "Le sel peut infiltrer les nappes phréatiques et fragiliser l’accès à l’eau.",
              },
              {
                icon: "🏔️",
                label: "Reliefs",
                desc: "Les montagnes restent émergées, mais les vallées côtières peuvent être touchées.",
              },
              {
                icon: "🌿",
                label: "Mangroves",
                desc: "Elles freinent les vagues, réduisent l’érosion et protègent naturellement les côtes.",
              },
              {
                icon: "👥",
                label: "Habitants",
                desc: "Certaines zones habitées proches du rivage pourraient devenir difficiles à vivre.",
              },
            ].map((item) => (
              <div key={item.label} className="about__diag-item">
                <div className="about__diag-icon">{item.icon}</div>
                <div className="about__diag-label">{item.label}</div>
                <div className="about__diag-desc">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="about__arch-note">
          <div className="about__arch-icon">🇳🇨</div>

          <div>
            <div className="about__arch-title">
              Nouvelle-Calédonie : montagnes protégées, littoral vulnérable
            </div>
            <div className="about__arch-desc">
              Sur la Grande Terre, les reliefs resteraient largement hors d’eau
              avec +1 mètre. Le vrai danger concerne surtout les zones basses :
              littoraux, routes côtières, mangroves, ports, plages, îlots et
              quartiers proches du lagon.
            </div>
          </div>
        </div>
      </section>

      <section className="about__zones">
        <div className="about__section-header">
          <div className="about__section-tag">🗺️ Zones critiques</div>
          <h2 className="about__section-title">
            Les nations en première ligne
          </h2>
        </div>

        <div className="about__zones-grid">
          {[
            {
              flag: "🇹🇻",
              name: "Tuvalu",
              stat: "2m max",
              detail: "Plan d’évacuation en cours",
              urgency: "CRITIQUE",
              color: "#FF1744",
            },
            {
              flag: "🇰🇮",
              name: "Kiribati",
              stat: "56 388 hab.",
              detail: "Population fortement exposée",
              urgency: "CRITIQUE",
              color: "#FF5252",
            },
            {
              flag: "🇻🇺",
              name: "Vanuatu",
              stat: "#1 mondial",
              detail: "Très forte vulnérabilité climatique",
              urgency: "DANGER",
              color: "#FF6D00",
            },
            {
              flag: "🇳🇨",
              name: "Nouvelle-Calédonie",
              stat: "62 000",
              detail: "Zones côtières menacées",
              urgency: "MENACÉ",
              color: "#FFD740",
            },
            {
              flag: "🇫🇯",
              name: "Fidji",
              stat: "2× cat.5",
              detail: "Cyclones majeurs récents",
              urgency: "DANGER",
              color: "#FF9100",
            },
            {
              flag: "🇸🇧",
              name: "Îles Salomon",
              stat: "5 îles",
              detail: "Îles déjà fortement touchées",
              urgency: "DANGER",
              color: "#FF6B35",
            },
          ].map((zone) => (
            <div
              key={zone.name}
              className="about__zone-card"
              style={{
                borderColor: `${zone.color}40`,
                "--zone-color": zone.color,
              }}
            >
              <div className="about__zone-head">
                <span className="about__zone-flag">{zone.flag}</span>

                <div>
                  <div className="about__zone-name">{zone.name}</div>
                  <div
                    className="about__zone-urgency"
                    style={{
                      color: zone.color,
                      borderColor: `${zone.color}60`,
                      background: `${zone.color}15`,
                    }}
                  >
                    {zone.urgency}
                  </div>
                </div>

                <div className="about__zone-stat" style={{ color: zone.color }}>
                  {zone.stat}
                </div>
              </div>

              <div className="about__zone-detail">{zone.detail}</div>

              <div className="about__zone-bar">
                <div
                  className="about__zone-bar-fill"
                  style={{
                    background: zone.color,
                    width:
                      zone.urgency === "CRITIQUE"
                        ? "90%"
                        : zone.urgency === "DANGER"
                          ? "65%"
                          : "40%",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="about__data">
        <div className="about__section-header">
          <div className="about__section-tag">🔬 Données & Méthode</div>
          <h2 className="about__section-title">
            Science ouverte, données satellites
          </h2>
          <p className="about__section-sub">
            PacificShield agrège des données open-source et prépare
            l’intégration des datasets officiels.
          </p>
        </div>

        <div className="about__data-grid">
          {TEAM_DATA.map((item) => (
            <div
              key={item.name}
              className="about__data-card"
              style={{
                "--data-color": item.color,
                borderColor: `${item.color}25`,
              }}
            >
              <div className="about__data-icon" style={{ color: item.color }}>
                {item.icon}
              </div>
              <div className="about__data-name" style={{ color: item.color }}>
                {item.name}
              </div>
              <div className="about__data-source">{item.source}</div>
            </div>
          ))}
        </div>

        <div className="about__arch-note">
          <div className="about__arch-icon">⚙️</div>

          <div>
            <div className="about__arch-title">Architecture data-ready</div>
            <div className="about__arch-desc">
              Toutes les couches de données sont abstraites en interfaces
              standardisées pour faciliter le remplacement des données mockées.
            </div>
          </div>
        </div>
      </section>

      <section className="about__cta">
        <div className="about__cta-inner">
          <div className="about__cta-glow" />

          <h2 className="about__cta-title">Explorez la carte interactive</h2>

          <p className="about__cta-sub">
            Simulez la montée des eaux, identifiez les zones de mangroves et
            visualisez ce qui peut encore être sauvé.
          </p>

          <button
            type="button"
            className="about__cta-btn"
            onClick={() => navigate("/map")}
          >
            <span>Lancer l’expérience</span>
            <span className="about__cta-arrow">→</span>
          </button>

          <div className="about__cta-credits">
            Pacific Dataviz Challenge 2026 · Données : NOAA · NASA · JAXA ·
            SPREP · IPCC AR6
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
