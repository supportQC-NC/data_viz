// src/pages/LandingPage/LandingPage.jsx
// ============================================================
// Pacific Dataviz Challenge 2026
// LandingPage v4.0 — chemins contexts corrects : store/context/
// ============================================================

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../store/context/themeContext";
import { useLang } from "../../store/context/langContext";
import "./LandingPage.scss";

// ════════════════════════════════════════════════════════════
// ANIMATION CANVAS : L'Océan qui Monte
// ════════════════════════════════════════════════════════════

const RisingOcean = ({ compact = false, onRiseComplete }) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const { isDark } = useTheme();
  const stateRef = useRef({
    time: 0,
    waterY: null,
    targetY: null,
    phase: "rise",
    pauseFrames: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);
      stateRef.current.waterY = null;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement || canvas);
    resize();

    const lerp = (a, b, t) => a + (b - a) * t;

    const drawCityline = (ctx, W, H, waterY, time) => {
      const buildings = [
        { x: 0.04, w: 0.04, h: 0.22 },
        { x: 0.09, w: 0.03, h: 0.31 },
        { x: 0.13, w: 0.05, h: 0.18 },
        { x: 0.19, w: 0.04, h: 0.39 },
        { x: 0.24, w: 0.03, h: 0.26 },
        { x: 0.29, w: 0.05, h: 0.43 },
        { x: 0.35, w: 0.04, h: 0.2 },
        { x: 0.4, w: 0.03, h: 0.33 },
        { x: 0.44, w: 0.05, h: 0.16 },
        { x: 0.5, w: 0.04, h: 0.46 },
        { x: 0.55, w: 0.03, h: 0.29 },
        { x: 0.59, w: 0.05, h: 0.36 },
        { x: 0.65, w: 0.04, h: 0.21 },
        { x: 0.7, w: 0.06, h: 0.51 },
        { x: 0.77, w: 0.03, h: 0.27 },
        { x: 0.81, w: 0.05, h: 0.34 },
        { x: 0.87, w: 0.04, h: 0.19 },
        { x: 0.92, w: 0.03, h: 0.41 },
      ];
      buildings.forEach(({ x, w: bw, h: bh }) => {
        const bx = x * W,
          bWidth = bw * W,
          bTop = H - bh * H,
          bBot = H + 5;
        const subFrac = Math.max(
          0,
          Math.min(1, (waterY - bTop) / (bBot - bTop)),
        );
        const alpha = Math.max(0.04, 1 - subFrac * 1.9);
        ctx.fillStyle = isDark
          ? `rgba(3,10,28,${alpha})`
          : `rgba(20,50,100,${alpha})`;
        ctx.fillRect(bx, bTop, bWidth, bBot - bTop);
        if (alpha > 0.18) {
          const rows = Math.floor((bh * H) / 18),
            cols = Math.floor(bWidth / 10);
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const wx = bx + 3 + c * 10,
                wy = bTop + 6 + r * 16;
              if (wy > waterY) continue;
              if (Math.sin(time * 0.3 + r * 2.1 + c * 1.7 + bx * 0.05) > 0.42) {
                ctx.fillStyle = `rgba(255,215,90,${alpha * 0.65})`;
                ctx.fillRect(wx, wy, 5, 9);
              }
            }
          }
        }
      });
    };

    const drawMangroves = (ctx, W, H, waterY, time) => {
      const groups = [
        { x: 0.02, s: 0.9 },
        { x: 0.08, s: 1.1 },
        { x: 0.15, s: 0.8 },
        { x: 0.85, s: 1.0 },
        { x: 0.91, s: 1.2 },
        { x: 0.97, s: 0.85 },
      ];
      groups.forEach(({ x, s }) => {
        const bx = x * W,
          sway = Math.sin(time * 0.35 + bx * 0.02) * 4 * s;
        const h0 = 90 * s,
          baseY = waterY + 10,
          treeTop = baseY - h0;
        const subFrac = Math.max(
          0,
          Math.min(1, (waterY - treeTop + 20) / (h0 + 20)),
        );
        const alpha = Math.max(0.04, 1 - subFrac * 2);
        if (alpha <= 0.04) return;
        const rootColor = isDark
          ? `rgba(5,28,10,${alpha})`
          : `rgba(15,70,25,${alpha})`;
        const leafColor = isDark
          ? `rgba(8,45,15,${alpha * 0.9})`
          : `rgba(25,110,40,${alpha * 0.85})`;
        [
          { dx: -20 * s },
          { dx: -8 * s },
          { dx: 8 * s },
          { dx: 20 * s },
        ].forEach(({ dx }) => {
          ctx.beginPath();
          ctx.moveTo(bx + sway * 0.3, baseY);
          ctx.quadraticCurveTo(
            bx + dx * 0.5 + sway * 0.5,
            baseY - h0 * 0.35,
            bx + dx + sway,
            baseY - h0 * 0.65,
          );
          ctx.strokeStyle = rootColor;
          ctx.lineWidth = 3 * s;
          ctx.stroke();
        });
        ctx.beginPath();
        ctx.moveTo(bx + sway * 0.3, baseY - h0 * 0.5);
        ctx.lineTo(bx + sway, baseY - h0);
        ctx.strokeStyle = rootColor;
        ctx.lineWidth = 5 * s;
        ctx.stroke();
        [
          { dx: -24 * s, dy: -14 * s, r: 24 * s },
          { dx: 24 * s, dy: -10 * s, r: 22 * s },
          { dx: -4 * s, dy: -28 * s, r: 30 * s },
          { dx: 16 * s, dy: -22 * s, r: 19 * s },
        ].forEach(({ dx, dy, r }) => {
          ctx.beginPath();
          ctx.arc(bx + sway + dx, baseY - h0 + dy, r, 0, Math.PI * 2);
          ctx.fillStyle = leafColor;
          ctx.fill();
        });
      });
    };

    const render = () => {
      const ctx = canvas.getContext("2d");
      const W = canvas.offsetWidth,
        H = canvas.offsetHeight;
      const s = stateRef.current;
      if (s.waterY === null) {
        s.waterY = H * 0.98;
        s.targetY = compact ? H * 0.42 : H * 0.28;
      }

      if (s.phase === "rise") {
        s.waterY = lerp(s.waterY, s.targetY, 0.004);
        if (Math.abs(s.waterY - s.targetY) < 1) {
          s.waterY = s.targetY;
          s.phase = "hold";
          s.pauseFrames = compact ? 120 : 200;
          if (onRiseComplete) onRiseComplete();
        }
      } else if (s.phase === "hold") {
        s.pauseFrames--;
        if (s.pauseFrames <= 0) s.phase = "recede";
      } else {
        s.waterY = lerp(s.waterY, H * 0.98, 0.006);
        if (Math.abs(s.waterY - H * 0.98) < 1) {
          s.waterY = H * 0.98;
          s.phase = "rise";
          s.targetY = compact ? H * 0.42 : H * 0.28;
        }
      }
      s.time += 0.016;
      const wY = s.waterY;

      // Fond
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      if (isDark) {
        bg.addColorStop(0, "rgba(2,6,14,1)");
        bg.addColorStop(Math.max(0, wY / H - 0.08), "rgba(3,9,22,1)");
        bg.addColorStop(wY / H, "rgba(0,24,52,0.8)");
        bg.addColorStop(1, "rgba(0,14,38,1)");
      } else {
        bg.addColorStop(0, "rgba(200,225,255,1)");
        bg.addColorStop(Math.max(0, wY / H - 0.08), "rgba(180,210,250,1)");
        bg.addColorStop(wY / H, "rgba(30,110,200,0.9)");
        bg.addColorStop(1, "rgba(10,70,160,1)");
      }
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Étoiles (dark uniquement)
      if (isDark) {
        for (let i = 0; i < 60; i++) {
          const sx = ((i * 137.5) % 1) * W,
            sy = ((i * 59.2) % 1) * (wY * 0.7);
          const a = 0.1 + Math.sin(s.time * 0.2 + i) * 0.07;
          ctx.beginPath();
          ctx.arc(sx, sy, 0.5 + (i % 3) * 0.3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200,220,255,${a})`;
          ctx.fill();
        }
      }

      drawMangroves(ctx, W, H, wY, s.time);
      drawCityline(ctx, W, H, wY, s.time);

      // Vagues (3 couches)
      const wc = isDark
        ? [
            "rgba(0,100,200,0.18)",
            "rgba(0,150,220,0.28)",
            "rgba(0,200,240,0.15)",
          ]
        : [
            "rgba(30,130,220,0.22)",
            "rgba(50,160,240,0.32)",
            "rgba(100,200,255,0.18)",
          ];
      [0, 1, 2].forEach((layer) => {
        const amp = 8 - layer * 2,
          freq = 0.012 + layer * 0.004;
        const phase = s.time * (0.6 + layer * 0.25) + layer * Math.PI * 0.7;
        const yOff = layer * 3;
        ctx.beginPath();
        ctx.moveTo(0, wY + yOff);
        for (let px = 0; px <= W; px += 4) {
          ctx.lineTo(
            px,
            wY +
              yOff +
              Math.sin(px * freq + phase) * amp +
              Math.sin(px * freq * 2.1 - phase * 0.8) * amp * 0.4,
          );
        }
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.closePath();
        ctx.fillStyle = wc[layer];
        ctx.fill();
      });

      // Corps océan
      const og = ctx.createLinearGradient(0, wY, 0, H);
      if (isDark) {
        og.addColorStop(0, "rgba(0,40,100,0.85)");
        og.addColorStop(1, "rgba(0,8,30,0.97)");
      } else {
        og.addColorStop(0, "rgba(30,130,220,0.88)");
        og.addColorStop(1, "rgba(5,40,130,0.97)");
      }
      ctx.fillStyle = og;
      ctx.fillRect(0, wY + 12, W, H - wY - 12);

      // Reflets
      for (let i = 0; i < 8; i++) {
        const rx = ((i * 0.137 + s.time * 0.02) % 1) * W;
        const ry = wY + 6 + Math.sin(s.time + i * 1.3) * 18;
        const rw = 30 + Math.sin(s.time * 0.5 + i) * 15;
        const ra = 0.06 + Math.sin(s.time * 0.3 + i * 0.7) * 0.04;
        const rg = ctx.createRadialGradient(rx, ry, 0, rx, ry, rw);
        rg.addColorStop(0, `rgba(180,240,255,${ra})`);
        rg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.ellipse(rx, ry, rw, rw * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Jauge droite (mode non compact)
      if (!compact) {
        const gX = W - 32,
          gTop = H * 0.1,
          gBot = H * 0.9,
          gH = gBot - gTop;
        const frac = Math.max(
          0,
          Math.min(1, (H * 0.98 - wY) / (H * 0.98 - H * 0.28)),
        );
        const fH = gH * frac;
        ctx.fillStyle = isDark
          ? "rgba(0,230,255,0.08)"
          : "rgba(0,100,200,0.08)";
        ctx.fillRect(gX, gTop, 6, gH);
        const gf = ctx.createLinearGradient(0, gBot, 0, gBot - fH);
        gf.addColorStop(
          0,
          isDark ? "rgba(0,100,200,0.9)" : "rgba(0,80,180,0.9)",
        );
        gf.addColorStop(
          1,
          isDark ? "rgba(0,230,255,0.9)" : "rgba(80,180,255,0.9)",
        );
        ctx.fillStyle = gf;
        ctx.fillRect(gX, gBot - fH, 6, fH);
        ctx.font = '9px "Space Mono",monospace';
        ctx.fillStyle = isDark ? "rgba(0,230,255,0.7)" : "rgba(0,80,180,0.7)";
        ctx.textAlign = "center";
        ctx.fillText(`+${Math.round(frac * 182)}mm`, gX + 3, gBot - fH - 6);
      }

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [isDark, compact, onRiseComplete]);

  return <canvas ref={canvasRef} className="rising-ocean__canvas" />;
};

// ════════════════════════════════════════════════════════════
// LANDING PAGE
// ════════════════════════════════════════════════════════════

const LandingPage = () => {
  const navigate = useNavigate();
  const { isDark, toggle: toggleTheme } = useTheme();
  const { lang, toggle: toggleLang, t } = useLang();
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleRiseComplete = useCallback(() => {}, []);

  const scenarios = [
    { key: "obs", color: "#00E5FF", label: t("landing", "riseScenarioObs") },
    { key: "ssp1", color: "#69F0AE", label: t("landing", "riseScenarioSSP1") },
    { key: "ssp5", color: "#FF9100", label: t("landing", "riseScenarioSSP5") },
    { key: "ext", color: "#FF1744", label: t("landing", "riseScenarioExt") },
  ];

  const heroStats = [
    {
      v: t("landing", "statSeaRise"),
      l: t("landing", "statSeaRiseLabel"),
      c: "#00E5FF",
    },
    {
      v: t("landing", "statCyclones"),
      l: t("landing", "statCyclonesLabel"),
      c: "#FF9100",
    },
    {
      v: t("landing", "statAtRisk"),
      l: t("landing", "statAtRiskLabel"),
      c: "#FF1744",
    },
  ];

  const urgencyStats = [
    {
      n: t("landing", "urgeStat1Num"),
      u: t("landing", "urgeStat1Unit"),
      s: t("landing", "urgeStat1Sub"),
      c: "#FF5252",
    },
    {
      n: t("landing", "urgeStat2Num"),
      u: t("landing", "urgeStat2Unit"),
      s: t("landing", "urgeStat2Sub"),
      c: "#FF9100",
    },
    {
      n: t("landing", "urgeStat3Num"),
      u: t("landing", "urgeStat3Unit"),
      s: t("landing", "urgeStat3Sub"),
      c: "#FF6B35",
    },
  ];

  return (
    <div className={`landing ${isDark ? "landing--dark" : "landing--light"}`}>
      {/* ══ TOPBAR ═════════════════════════════════════════════ */}
      <div className="landing__topbar">
        <div className="landing__topbar-logo">
          <span className="landing__topbar-logo-icon">🌊</span>
          <span className="landing__topbar-logo-text">
            Pacific<span>Shield</span>
          </span>
        </div>
        <nav className="landing__topbar-nav" aria-label="Navigation principale">
          <button
            onClick={() => navigate("/map")}
            className="landing__topbar-link"
          >
            {t("nav", "map")}
          </button>
          <button
            onClick={() => navigate("/data")}
            className="landing__topbar-link"
          >
            {t("nav", "data")}
          </button>
          <button
            onClick={() => navigate("/about")}
            className="landing__topbar-link"
          >
            {t("nav", "about")}
          </button>
        </nav>
        <div className="landing__topbar-controls">
          <button
            className="landing__topbar-btn"
            onClick={toggleLang}
            aria-label="Changer la langue"
          >
            {lang === "fr" ? "EN" : "FR"}
          </button>
          <button
            className="landing__topbar-btn"
            onClick={toggleTheme}
            aria-label="Changer le thème"
          >
            {isDark ? "☀" : "◐"}
          </button>
        </div>
      </div>

      {/* ══ HERO ════════════════════════════════════════════════ */}
      <section className="landing__hero" aria-label="Introduction">
        <div className="landing__hero-canvas">
          <RisingOcean onRiseComplete={handleRiseComplete} />
        </div>
        <div className="landing__hero-overlay" aria-hidden="true" />
        <div
          className={`landing__hero-content ${heroVisible ? "landing__hero-content--visible" : ""}`}
        >
          <div className="landing__hero-supertitle">
            {t("landing", "heroSupertitle")}
          </div>
          <h1 className="landing__hero-title">
            {t("landing", "heroTitle")
              .split("\n")
              .map((line, i) => (
                <span key={i} className="landing__hero-title-line">
                  {line}
                </span>
              ))}
          </h1>
          <p className="landing__hero-subtitle">
            {t("landing", "heroSubtitle")
              .split("\n")
              .map((line, i) => (
                <span key={i}>
                  {line}
                  {i === 0 && <br />}
                </span>
              ))}
          </p>
          <div className="landing__hero-ctas">
            <button
              className="landing__cta landing__cta--primary"
              onClick={() => navigate("/map")}
            >
              {" "}
              {t("landing", "heroCtaMap")}
            </button>
            <button
              className="landing__cta landing__cta--secondary"
              onClick={() => navigate("/data")}
            >
              {" "}
              {t("landing", "heroCtaData")}
            </button>
          </div>
          <div className="landing__hero-stats">
            {heroStats.map((s) => (
              <div key={s.l} className="landing__hero-stat">
                <div className="landing__hero-stat-val" style={{ color: s.c }}>
                  {s.v}
                </div>
                <div className="landing__hero-stat-lbl">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="landing__scroll-hint" aria-hidden="true">
          <span>{t("landing", "heroScrollHint")}</span>
          <div className="landing__scroll-arrow" />
        </div>
      </section>

      {/* ══ MONTÉE DES EAUX ═════════════════════════════════════ */}
      <section className="landing__rise">
        <div className="landing__rise-inner">
          <div className="landing__rise-left">
            <div className="landing__section-tag">
              {t("landing", "riseTag")}
            </div>
            <h2 className="landing__section-title">
              {t("landing", "riseTitle")}
            </h2>
            <p className="landing__section-text">{t("landing", "riseText")}</p>
            <button
              className="landing__cta landing__cta--primary"
              onClick={() => navigate("/map")}
            >
              {t("landing", "riseCtaMap")}
            </button>
            <div className="landing__rise-scenarios">
              {scenarios.map((sc) => (
                <div key={sc.key} className="landing__rise-scenario">
                  <span
                    className="landing__rise-scenario-dot"
                    style={{ background: sc.color }}
                  />
                  <span className="landing__rise-scenario-label">
                    {sc.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="landing__rise-right">
            <div className="landing__rise-canvas-wrap">
              <RisingOcean compact />
              <div className="landing__rise-canvas-label">
                Simulation · GIEC AR6 · 2025
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CYCLONES ════════════════════════════════════════════ */}
      <section className="landing__cyclones">
        <div className="landing__cyclones-inner">
          <div className="landing__cyclones-right">
            <div className="landing__cyclones-viz">
              <div className="landing__cyclone-spiral">
                {[0, 1, 2, 3, 4].map((ring) => (
                  <div
                    key={ring}
                    className="landing__cyclone-ring"
                    style={{
                      width: `${60 + ring * 40}px`,
                      height: `${60 + ring * 40}px`,
                      animationDelay: `${ring * 0.15}s`,
                      opacity: 1 - ring * 0.15,
                    }}
                  />
                ))}
                <div className="landing__cyclone-eye" />
              </div>
              <div className="landing__cyclones-stats-overlay">
                {[
                  {
                    v: t("landing", "statCat5"),
                    l: t("landing", "statCat5Label"),
                    c: "#FF5252",
                  },
                  {
                    v: t("landing", "statWarm"),
                    l: t("landing", "statWarmLabel"),
                    c: "#FF9100",
                  },
                  {
                    v: t("landing", "statStrong"),
                    l: t("landing", "statStrongLabel"),
                    c: "#FF1744",
                  },
                ].map((s) => (
                  <div key={s.l} className="landing__cyclones-stat">
                    <span
                      className="landing__cyclones-stat-val"
                      style={{ color: s.c }}
                    >
                      {s.v}
                    </span>
                    <span className="landing__cyclones-stat-lbl">{s.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="landing__cyclones-left">
            <div className="landing__section-tag">
              {t("landing", "cyclonesTag")}
            </div>
            <h2 className="landing__section-title">
              {t("landing", "cyclonesTitle")
                .split("\n")
                .map((line, i) => (
                  <span key={i} className="landing__title-line">
                    {line}
                  </span>
                ))}
            </h2>
            <p className="landing__section-text">
              {t("landing", "cyclonesText")}
            </p>
            <button
              className="landing__cta landing__cta--primary"
              onClick={() => navigate("/map")}
            >
              {t("landing", "cyclonesCtaMap")}
            </button>
          </div>
        </div>
      </section>

      {/* ══ DATA PREVIEW ════════════════════════════════════════ */}
      <section className="landing__data">
        <div className="landing__data-inner">
          <div className="landing__data-left">
            <div className="landing__section-tag">
              {t("landing", "dataTag")}
            </div>
            <h2 className="landing__section-title">
              {t("landing", "dataTitle")
                .split("\n")
                .map((line, i) => (
                  <span key={i} className="landing__title-line">
                    {line}
                  </span>
                ))}
            </h2>
            <p className="landing__section-text">{t("landing", "dataText")}</p>
            <div className="landing__data-stats">
              {[
                {
                  v: t("landing", "dataStatRise"),
                  l: t("landing", "dataStatRiseLabel"),
                  c: "#00E5FF",
                },
                {
                  v: t("landing", "dataStatBillion"),
                  l: t("landing", "dataStatBillionLabel"),
                  c: "#FF1744",
                },
                {
                  v: t("landing", "dataStatRate"),
                  l: t("landing", "dataStatRateLabel"),
                  c: "#FF9100",
                },
              ].map((s) => (
                <div key={s.l} className="landing__data-stat">
                  <div
                    className="landing__data-stat-val"
                    style={{ color: s.c }}
                  >
                    {s.v}
                  </div>
                  <div className="landing__data-stat-lbl">{s.l}</div>
                </div>
              ))}
            </div>
            <button
              className="landing__cta landing__cta--primary"
              onClick={() => navigate("/data")}
            >
              {t("landing", "dataCtaExplore")}
            </button>
          </div>
          <div className="landing__data-right">
            <div className="landing__chart-preview">
              <div className="landing__chart-label">
                {t("landing", "dataChartLabel")}
              </div>
              <svg
                viewBox="0 0 320 160"
                preserveAspectRatio="none"
                className="landing__chart-svg"
              >
                <defs>
                  <linearGradient id="gObs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="gSSP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF9100" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#FF9100" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="gExt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF1744" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#FF1744" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[40, 80, 120].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2="320"
                    y2={y}
                    stroke="currentColor"
                    strokeOpacity="0.06"
                    strokeWidth="1"
                  />
                ))}
                <line
                  x1="175"
                  y1="0"
                  x2="175"
                  y2="160"
                  stroke="currentColor"
                  strokeOpacity="0.12"
                  strokeDasharray="4,4"
                  strokeWidth="1"
                />
                <path
                  d="M175,115 L200,108 L230,92 L260,68 L290,35 L320,5"
                  stroke="#FF1744"
                  strokeWidth="1.5"
                  fill="none"
                  strokeDasharray="5,3"
                  opacity="0.7"
                />
                <path
                  d="M175,115 L200,108 L230,92 L260,68 L290,35 L320,5 L320,160 L175,160Z"
                  fill="url(#gExt)"
                />
                <path
                  d="M175,115 L200,112 L230,105 L260,90 L290,68 L320,48"
                  stroke="#FF9100"
                  strokeWidth="1.5"
                  fill="none"
                  strokeDasharray="5,3"
                  opacity="0.8"
                />
                <path
                  d="M175,115 L200,112 L230,105 L260,90 L290,68 L320,48 L320,160 L175,160Z"
                  fill="url(#gSSP)"
                />
                <path
                  d="M175,115 L200,113 L230,108 L260,100 L290,92 L320,85"
                  stroke="#69F0AE"
                  strokeWidth="1.5"
                  fill="none"
                  strokeDasharray="5,3"
                  opacity="0.7"
                />
                <path
                  d="M0,158 L30,152 L60,147 L90,140 L120,133 L150,123 L175,115"
                  stroke="#00E5FF"
                  strokeWidth="2.5"
                  fill="none"
                />
                <path
                  d="M0,158 L30,152 L60,147 L90,140 L120,133 L150,123 L175,115 L175,160 L0,160Z"
                  fill="url(#gObs)"
                />
                {[
                  [30, 152],
                  [60, 147],
                  [90, 140],
                  [120, 133],
                  [150, 123],
                  [175, 115],
                ].map(([x, y], i) => (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="3"
                    fill="#00E5FF"
                    opacity="0.9"
                  />
                ))}
                <text
                  x="5"
                  y="155"
                  fill="currentColor"
                  fillOpacity="0.3"
                  fontSize="9"
                >
                  1993
                </text>
                <text
                  x="168"
                  y="155"
                  fill="currentColor"
                  fillOpacity="0.3"
                  fontSize="9"
                >
                  2025
                </text>
                <text
                  x="305"
                  y="155"
                  fill="currentColor"
                  fillOpacity="0.3"
                  fontSize="9"
                >
                  2100
                </text>
                <text
                  x="285"
                  y="52"
                  fill="#FF1744"
                  fillOpacity="0.7"
                  fontSize="9"
                >
                  +2m
                </text>
                <text
                  x="282"
                  y="95"
                  fill="#FF9100"
                  fillOpacity="0.7"
                  fontSize="9"
                >
                  SSP5
                </text>
                <text
                  x="280"
                  y="138"
                  fill="#69F0AE"
                  fillOpacity="0.7"
                  fontSize="9"
                >
                  SSP1
                </text>
              </svg>
              <div className="landing__chart-badges">
                <span style={{ color: "#00E5FF" }}>
                  {t("landing", "dataBadgeObs")}
                </span>
                <span style={{ color: "#69F0AE" }}>
                  {t("landing", "dataBadgeSSP1")}
                </span>
                <span style={{ color: "#FF9100" }}>
                  {t("landing", "dataBadgeSSP5")}
                </span>
                <span style={{ color: "#FF1744" }}>
                  {t("landing", "dataBadgeExt")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ URGENCE ═════════════════════════════════════════════ */}
      <section className="landing__urgency">
        <div className="landing__urgency-inner">
          <div className="landing__urgency-left">
            <div className="landing__section-tag">
              {t("landing", "urgencyTag")}
            </div>
            <h2 className="landing__section-title">
              {t("landing", "urgencyTitle")
                .split("\n")
                .map((line, i) => (
                  <span key={i} className="landing__title-line">
                    {line}
                  </span>
                ))}
            </h2>
            <p className="landing__section-text">
              {t("landing", "urgencyText")}
            </p>
            <button
              className="landing__cta landing__cta--danger"
              onClick={() => navigate("/data")}
            >
              {t("landing", "urgencyCtaData")}
            </button>
          </div>
          <div className="landing__urgency-right">
            {urgencyStats.map((s) => (
              <div
                key={s.u}
                className="landing__urgency-stat"
                style={{ borderColor: `${s.c}22` }}
              >
                <div className="landing__urgency-num" style={{ color: s.c }}>
                  {s.n}
                </div>
                <div className="landing__urgency-unit">{s.u}</div>
                <div className="landing__urgency-sub">{s.s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ═══════════════════════════════════════════ */}
      <section className="landing__final">
        <div className="landing__final-canvas">
          <RisingOcean />
        </div>
        <div className="landing__final-overlay" aria-hidden="true" />
        <div className="landing__final-content">
          <h2 className="landing__final-title">
            {t("landing", "finalTitle")
              .split("\n")
              .map((line, i) => (
                <span key={i} className="landing__final-title-line">
                  {line}
                </span>
              ))}
          </h2>
          <div className="landing__final-ctas">
            <button
              className="landing__cta landing__cta--primary landing__cta--large"
              onClick={() => navigate("/map")}
            >
              {t("landing", "finalCtaMap")}
            </button>
            <button
              className="landing__cta landing__cta--ghost   landing__cta--large"
              onClick={() => navigate("/data")}
            >
              {t("landing", "finalCtaData")}
            </button>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════ */}
      <footer className="landing__footer">
        <div className="landing__footer-logo">🌊 PacificShield</div>
        <nav className="landing__footer-links" aria-label="Footer navigation">
          <button onClick={() => navigate("/map")}>
            {" "}
            {t("landing", "footerMap")}
          </button>
          <button onClick={() => navigate("/data")}>
            {" "}
            {t("landing", "footerData")}
          </button>
          <button onClick={() => navigate("/about")}>
            {" "}
            {t("landing", "footerAbout")}
          </button>
        </nav>
        <div className="landing__footer-credits">
          {t("landing", "footerCredits")}
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
