// src/pages/LandingPage/LandingPage.jsx
// ============================================================
// LandingPage v3.0 — Pacific Dataviz Challenge 2026
// Navigation mise à jour + section Data Preview
// ============================================================

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.scss';

// ═══════════════════════════════════════════════════════════
// COMPOSANT : Animation "L'eau qui monte"
// ═══════════════════════════════════════════════════════════

const RisingOcean = ({ onRiseComplete }) => {
  const canvasRef  = useRef(null);
  const animRef    = useRef(null);
  const stateRef   = useRef({
    time:       0,
    waterY:     null,
    targetY:    null,
    rising:     true,
    pauseFrames: 0,
    phase:      'rise',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width  = canvas.offsetWidth  * (window.devicePixelRatio || 1);
      canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
      canvas.style.width  = canvas.offsetWidth  + 'px';
      canvas.style.height = canvas.offsetHeight + 'px';
      const ctx = canvas.getContext('2d');
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
      stateRef.current.waterY = null;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement || canvas);
    resize();

    const lerp = (a, b, t) => a + (b - a) * t;

    const drawCityline = (ctx, w, h, waterY, time) => {
      const buildings = [
        { x: 0.05, w: 0.04, h: 0.22 }, { x: 0.10, w: 0.03, h: 0.30 },
        { x: 0.14, w: 0.05, h: 0.18 }, { x: 0.20, w: 0.04, h: 0.38 },
        { x: 0.25, w: 0.03, h: 0.25 }, { x: 0.30, w: 0.05, h: 0.42 },
        { x: 0.36, w: 0.04, h: 0.20 }, { x: 0.41, w: 0.03, h: 0.32 },
        { x: 0.45, w: 0.05, h: 0.15 }, { x: 0.51, w: 0.04, h: 0.45 },
        { x: 0.56, w: 0.03, h: 0.28 }, { x: 0.60, w: 0.05, h: 0.35 },
        { x: 0.66, w: 0.04, h: 0.20 }, { x: 0.71, w: 0.06, h: 0.50 },
        { x: 0.78, w: 0.03, h: 0.26 }, { x: 0.82, w: 0.05, h: 0.33 },
        { x: 0.88, w: 0.04, h: 0.18 }, { x: 0.93, w: 0.03, h: 0.40 },
      ];

      buildings.forEach(({ x, w: bw, h: bh }) => {
        const bx = x * w, bWidth = bw * w, bTop = h - bh * h, bBot = h + 5;
        const submergedFrac = Math.max(0, Math.min(1, (waterY - bTop) / (bBot - bTop)));
        const alpha = Math.max(0.05, 1 - submergedFrac * 1.8);

        ctx.fillStyle = `rgba(5, 15, 35, ${alpha})`;
        ctx.fillRect(bx, bTop, bWidth, bBot - bTop);

        if (alpha > 0.2) {
          const rows = Math.floor(bh * h / 18), cols = Math.floor(bWidth / 10);
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const wx = bx + 3 + c * 10, wy = bTop + 6 + r * 16;
              if (wy > waterY) continue;
              const lit = Math.sin(time * 0.3 + r * 2.1 + c * 1.7 + bx * 0.05) > 0.4;
              if (lit) { ctx.fillStyle = `rgba(255, 220, 100, ${alpha * 0.7})`; ctx.fillRect(wx, wy, 5, 9); }
            }
          }
        }
      });
    };

    const drawMangroves = (ctx, w, h, waterY, time) => {
      const groups = [
        { x: 0.02, scale: 0.9 }, { x: 0.08, scale: 1.1 }, { x: 0.15, scale: 0.8 },
        { x: 0.85, scale: 1.0 }, { x: 0.91, scale: 1.2 }, { x: 0.97, scale: 0.85 },
      ];

      groups.forEach(({ x, scale }) => {
        const bx = x * w, sway = Math.sin(time * 0.35 + bx * 0.02) * 4 * scale;
        const h0 = 90 * scale, baseY = waterY + 10;
        const treeTop = baseY - h0, subFrac = Math.max(0, Math.min(1, (waterY - treeTop + 20) / (h0 + 20)));
        const alpha = Math.max(0.05, 1 - subFrac * 2);
        if (alpha <= 0.05) return;

        const rootColor = `rgba(5, 28, 10, ${alpha})`;
        const leafColor = `rgba(8, 45, 15, ${alpha * 0.9})`;

        [{ dx: -20 * scale }, { dx: -8 * scale }, { dx: 8 * scale }, { dx: 20 * scale }].forEach(({ dx }) => {
          ctx.beginPath();
          ctx.moveTo(bx + sway * 0.3, baseY);
          ctx.quadraticCurveTo(bx + dx * 0.5 + sway * 0.5, baseY - h0 * 0.35, bx + dx + sway, baseY - h0 * 0.65);
          ctx.strokeStyle = rootColor; ctx.lineWidth = 3 * scale; ctx.stroke();
        });

        ctx.beginPath();
        ctx.moveTo(bx + sway * 0.3, baseY - h0 * 0.5);
        ctx.lineTo(bx + sway, baseY - h0);
        ctx.strokeStyle = rootColor; ctx.lineWidth = 5 * scale; ctx.stroke();

        [
          { dx: -24 * scale, dy: -14 * scale, r: 24 * scale },
          { dx:  24 * scale, dy: -10 * scale, r: 22 * scale },
          { dx:  -4 * scale, dy: -28 * scale, r: 30 * scale },
          { dx:  16 * scale, dy: -22 * scale, r: 19 * scale },
        ].forEach(({ dx, dy, r }) => {
          ctx.beginPath(); ctx.arc(bx + sway + dx, baseY - h0 + dy, r, 0, Math.PI * 2);
          ctx.fillStyle = leafColor; ctx.fill();
        });
      });
    };

    const render = () => {
      const ctx = canvas.getContext('2d');
      const W = canvas.offsetWidth, H = canvas.offsetHeight;
      const s = stateRef.current;

      if (s.waterY === null) {
        s.waterY  = H * 0.98;
        s.targetY = H * 0.28;
      }

      const { time, waterY, targetY, phase } = s;

      if (phase === 'rise') {
        s.waterY = lerp(waterY, targetY, 0.004);
        if (Math.abs(s.waterY - targetY) < 1) {
          s.waterY = targetY; s.phase = 'hold'; s.pauseFrames = 180;
        }
      } else if (phase === 'hold') {
        s.pauseFrames--;
        if (s.pauseFrames <= 0) { s.phase = 'recede'; if (onRiseComplete) onRiseComplete(); }
      } else if (phase === 'recede') {
        s.waterY = lerp(s.waterY, H * 0.98, 0.006);
        if (Math.abs(s.waterY - H * 0.98) < 1) { s.waterY = H * 0.98; s.phase = 'rise'; s.targetY = H * 0.28; }
      }

      const wY = s.waterY;

      // Fond
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      const darkRatio = Math.max(0, (H - wY) / H);
      bg.addColorStop(0, `rgba(2, 6, 14, 1)`);
      bg.addColorStop(Math.max(0, wY / H - 0.1), `rgba(3, 9, 22, 1)`);
      bg.addColorStop(wY / H, `rgba(0, 28, 58, ${0.3 + darkRatio * 0.5})`);
      bg.addColorStop(1, `rgba(0, 18, 40, 1)`);
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Étoiles
      for (let i = 0; i < 60; i++) {
        const sx = ((i * 137.5) % 1) * W, sy = ((i * 59.2) % 1) * (wY * 0.7);
        const a = 0.1 + Math.sin(time * 0.2 + i) * 0.07;
        ctx.beginPath(); ctx.arc(sx, sy, 0.5 + (i % 3) * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 220, 255, ${a})`; ctx.fill();
      }

      drawCityline(ctx, W, H, wY, time);
      drawMangroves(ctx, W, H, wY, time);

      // Vagues multicouches
      const waveColors = [
        [0.15, 0.32, 0.50, '#023e8a'],
        [0.22, 0.52, 0.38, '#0077b6'],
        [0.18, 0.78, 0.28, '#0096c7'],
      ];

      waveColors.forEach(([amp, spd, opa, col], li) => {
        const a2 = amp * (1 + Math.max(0, (H * 0.85 - wY) / H * 2));
        ctx.beginPath(); ctx.moveTo(0, H);
        for (let x = 0; x <= W; x += 2) {
          const r = x / W;
          const y = wY + Math.sin(r * 4 * Math.PI + time * spd) * a2 * 18
                       + Math.sin(r * 7 * Math.PI + time * spd * 0.6) * a2 * 6;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H); ctx.closePath();
        ctx.fillStyle = col + Math.round(opa * 255).toString(16).padStart(2,'0');
        ctx.fill();
      });

      // Corps eau
      const wg = ctx.createLinearGradient(0, wY, 0, H);
      wg.addColorStop(0, 'rgba(0, 90, 160, 0.65)');
      wg.addColorStop(1, 'rgba(0, 30, 65, 0.92)');
      ctx.fillStyle = wg; ctx.fillRect(0, wY + 15, W, H);

      // Reflets
      for (let x = 0; x < W; x += 4) {
        const sh = Math.sin(x * 0.06 + time * 1.8) * 2;
        const a = 0.15 + Math.abs(Math.sin(x * 0.03 + time)) * 0.2;
        ctx.fillStyle = `rgba(100, 210, 255, ${a})`;
        ctx.fillRect(x, wY + sh, 3, 1.5);
      }

      // Niveau +182mm
      if (wY < H * 0.8) {
        ctx.beginPath(); ctx.setLineDash([4, 4]);
        ctx.moveTo(10, wY); ctx.lineTo(W - 10, wY);
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = 'bold 12px "DM Mono", monospace';
        ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(0, 229, 255, 0.8)';
        ctx.shadowColor = '#00E5FF'; ctx.shadowBlur = 8;
        ctx.fillText('+182mm depuis 1993', W - 14, wY - 8);
        ctx.shadowBlur = 0;
      }

      s.time += 0.012;
      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [onRiseComplete]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      aria-hidden="true"
    />
  );
};

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

const LandingPage = () => {
  const navigate   = useNavigate();
  const [riseComplete, setRiseComplete] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e) => setMousePos({
      x: (e.clientX / window.innerWidth  - 0.5) * 8,
      y: (e.clientY / window.innerHeight - 0.5) * 8,
    });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return (
    <div className="landing">

      {/* ══ HERO SECTION ══════════════════════════════════ */}
      <section className="landing__hero">
        <div className="landing__hero-canvas">
          <RisingOcean onRiseComplete={() => setRiseComplete(true)} />
        </div>
        <div className="landing__hero-overlay" />

        {/* NAV mise à jour avec lien Données */}
        <nav className="landing__nav">
          <div className="landing__logo">🌊 PacificShield</div>
          <div className="landing__nav-links">
            <button className="landing__nav-link" onClick={() => navigate('/data')}>Données</button>
            <button className="landing__nav-link" onClick={() => navigate('/about')}>À propos</button>
            <button className="landing__nav-cta"  onClick={() => navigate('/map')}>Explorer →</button>
          </div>
        </nav>

        {/* Contenu principal */}
        <div
          className="landing__hero-content"
          style={{ transform: `translate(${mousePos.x * 0.35}px, ${mousePos.y * 0.35}px)` }}
        >
          <div className="landing__eyebrow">
            <span className="landing__eyebrow-dot" />
            Pacific Dataviz Challenge 2026
            <span className="landing__eyebrow-sep">·</span>
            Océan Pacifique
          </div>

          <h1 className="landing__title">
            <span className="landing__title-l1">L'océan</span>
            <span className="landing__title-l2">monte.</span>
            <span className="landing__title-l3">Maintenant.</span>
          </h1>

          <p className="landing__subtitle">
            Mangroves, récifs, atolls — visualisez les écosystèmes
            qui protègent le Pacifique face à la montée inexorable des eaux.
          </p>

          <div className={`landing__cta-group ${riseComplete ? 'landing__cta-group--visible' : ''}`}>
            <button className="landing__btn-primary" onClick={() => navigate('/map')}>
              <span>🌊</span>
              Explorer la carte
              <span className="landing__btn-arr">→</span>
            </button>
            <button className="landing__btn-secondary" onClick={() => navigate('/data')}>
              Voir les données →
            </button>
          </div>

          <div className="landing__live-badge">
            <span className="landing__live-dot" />
            NOAA · Données temps réel
            <span className="landing__live-val">+4.2 mm/an</span>
          </div>
        </div>

        {/* Stats flottantes droite */}
        <div className="landing__hero-stats">
          {[
            { v: '+182mm',  l: 'Montée depuis 1993',   c: '#FF6B35' },
            { v: '-40%',    l: 'Mangroves perdues',     c: '#69F0AE' },
            { v: '190M',    l: 'Personnes à risque',    c: '#FF5252' },
            { v: '5 îles',  l: 'Salomon disparues',     c: '#FFD740' },
          ].map((s) => (
            <div key={s.l} className="landing__hstat" style={{ '--sc': s.c }}>
              <div className="landing__hstat-val" style={{ color: s.c }}>{s.v}</div>
              <div className="landing__hstat-lbl">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="landing__scroll">
          <div className="landing__scroll-line" />
          <span>Scroll</span>
        </div>
      </section>

      {/* ══ FEATURES ═════════════════════════════════════ */}
      <section className="landing__features">
        <div className="landing__feat-header">
          <div className="landing__feat-tag">Ce que vous découvrez</div>
          <h2 className="landing__feat-title">Trois crises.<br/>Une carte.</h2>
        </div>

        <div className="landing__feat-grid">
          {[
            {
              num: '01', icon: '🌿', name: 'Mangroves',
              desc: "Cartographiez la santé des forêts côtières du Pacifique. Zones de déforestation, densité de couvert, capacité de protection contre les cyclones et la submersion.",
              data: 'JAXA Global Mangrove Watch',
              cls: '--mangrove', active: true,
            },
            {
              num: '02', icon: '🌊', name: 'Montée des eaux',
              desc: "Simulez les scénarios IPCC AR6 de 0 à +12m. Visualisez les zones inondables, les populations déplacées, l'impact sur chaque île du Pacifique.",
              data: 'NOAA · NASA · IPCC AR6',
              cls: '--sealevel', active: true,
            },
            {
              num: '03', icon: '🌀', name: 'Cyclones historiques',
              desc: "Replay animé de Winston, Pam, Harold. Trajectoires, intensités, corrélation avec la montée des eaux. La violence du Pacifique racontée par les données.",
              data: 'IBTrACS (NOAA Best Track)',
              cls: '--cyclones', active: false, soon: true,
            },
          ].map((card) => (
            <div key={card.name}
              className={`landing__feat-card landing__feat-card${card.cls}${card.soon ? ' landing__feat-card--soon' : ''}`}>
              {card.soon && <div className="landing__feat-soon">Bientôt</div>}
              <div className="landing__feat-num">{card.num}</div>
              <div className="landing__feat-icon-wrap">
                <span className="landing__feat-icon">{card.icon}</span>
              </div>
              <h3 className="landing__feat-name">{card.name}</h3>
              <p className="landing__feat-desc">{card.desc}</p>
              <div className="landing__feat-data">📡 {card.data}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ DATA PREVIEW — NOUVELLE SECTION ═════════════ */}
      <section className="landing__data-preview">
        <div className="landing__dp-inner">
          <div className="landing__dp-left">
            <div className="landing__dp-tag">📊 Analyse de données</div>
            <h2 className="landing__dp-title">
              6 graphiques.<br/>1 planète en crise.
            </h2>
            <p className="landing__dp-text">
              Montée des eaux projetée jusqu'en 2300, corrélation température/cyclones,
              effondrement des mangroves, populations à risque par scénario.
              Chaque graphique est un signal d'alarme documenté.
            </p>
            <div className="landing__dp-stats">
              {[
                { v: '182 mm', l: 'Montée satellite 1993–2025', c: '#00E5FF' },
                { v: '1 Md',   l: 'personnes à risque à +12m',  c: '#FF1744' },
                { v: '5.8',    l: 'mm/an de montée actuelle',    c: '#FF9100' },
              ].map(s => (
                <div key={s.l} className="landing__dp-stat" style={{ '--dpc': s.c }}>
                  <div className="landing__dp-stat-val" style={{ color: s.c }}>{s.v}</div>
                  <div className="landing__dp-stat-lbl">{s.l}</div>
                </div>
              ))}
            </div>
            <button className="landing__dp-cta" onClick={() => navigate('/data')}>
              Explorer les données →
            </button>
          </div>
          <div className="landing__dp-right">
            <div className="landing__dp-chart-preview">
              <div className="landing__dp-chart-label">Montée des eaux · 1993–2100</div>
              <div className="landing__dp-fake-chart">
                {/* Mini chart SVG simulé */}
                <svg viewBox="0 0 320 160" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                  <defs>
                    <linearGradient id="fgObs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.4"/>
                      <stop offset="100%" stopColor="#00E5FF" stopOpacity="0"/>
                    </linearGradient>
                    <linearGradient id="fgSSP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF9100" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="#FF9100" stopOpacity="0"/>
                    </linearGradient>
                    <linearGradient id="fgExt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF1744" stopOpacity="0.2"/>
                      <stop offset="100%" stopColor="#FF1744" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  {/* Grille */}
                  <line x1="0" y1="40"  x2="320" y2="40"  stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                  <line x1="0" y1="80"  x2="320" y2="80"  stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                  <line x1="0" y1="120" x2="320" y2="120" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                  {/* Ligne verticale séparation obs/projections */}
                  <line x1="175" y1="0" x2="175" y2="160" stroke="rgba(255,255,255,0.1)" strokeDasharray="4,4" strokeWidth="1"/>
                  {/* Scénario extrême */}
                  <path d="M175,115 L200,108 L230,92 L260,68 L290,35 L320,5"
                    stroke="#FF1744" strokeWidth="1.5" fill="none" strokeDasharray="5,3" opacity="0.7"/>
                  <path d="M175,115 L200,108 L230,92 L260,68 L290,35 L320,5 L320,160 L175,160Z"
                    fill="url(#fgExt)"/>
                  {/* SSP5-8.5 */}
                  <path d="M175,115 L200,112 L230,105 L260,90 L290,68 L320,48"
                    stroke="#FF9100" strokeWidth="1.5" fill="none" strokeDasharray="5,3" opacity="0.8"/>
                  <path d="M175,115 L200,112 L230,105 L260,90 L290,68 L320,48 L320,160 L175,160Z"
                    fill="url(#fgSSP)"/>
                  {/* SSP1-2.6 */}
                  <path d="M175,115 L200,113 L230,108 L260,100 L290,92 L320,85"
                    stroke="#69F0AE" strokeWidth="1.5" fill="none" strokeDasharray="5,3" opacity="0.7"/>
                  {/* Observé */}
                  <path d="M0,158 L30,152 L60,147 L90,140 L120,133 L150,123 L175,115"
                    stroke="#00E5FF" strokeWidth="2.5" fill="none"/>
                  <path d="M0,158 L30,152 L60,147 L90,140 L120,133 L150,123 L175,115 L175,160 L0,160Z"
                    fill="url(#fgObs)"/>
                  {/* Points observés */}
                  {[[30,152],[60,147],[90,140],[120,133],[150,123],[175,115]].map(([x,y],i) => (
                    <circle key={i} cx={x} cy={y} r="3" fill="#00E5FF" opacity="0.9"/>
                  ))}
                  {/* Labels axes */}
                  <text x="5"   y="155" fill="rgba(255,255,255,0.3)" fontSize="9">1993</text>
                  <text x="168" y="155" fill="rgba(255,255,255,0.3)" fontSize="9">2025</text>
                  <text x="305" y="155" fill="rgba(255,255,255,0.3)" fontSize="9">2100</text>
                  <text x="285" y="52"  fill="rgba(255,23,68,0.7)"   fontSize="9">+2m</text>
                  <text x="282" y="95"  fill="rgba(255,145,0,0.7)"   fontSize="9">SSP5</text>
                  <text x="280" y="138" fill="rgba(105,240,174,0.7)" fontSize="9">SSP1</text>
                </svg>
              </div>
              <div className="landing__dp-chart-badges">
                <span style={{ color: '#00E5FF' }}>● Observé</span>
                <span style={{ color: '#69F0AE' }}>- SSP1-2.6</span>
                <span style={{ color: '#FF9100' }}>- SSP5-8.5</span>
                <span style={{ color: '#FF1744' }}>- Extrême</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ URGENCE ══════════════════════════════════════ */}
      <section className="landing__urgency">
        <div className="landing__urgency-inner">
          <div className="landing__urgency-left">
            <div className="landing__urgency-tag">🚨 Urgence</div>
            <h2 className="landing__urgency-title">Des nations<br/>vont disparaître</h2>
            <p className="landing__urgency-text">
              Tuvalu, Kiribati — ces pays insulaires sont en première ligne
              d'une crise qu'ils n'ont pas causée. Altitude maximale : 2 mètres.
              Montée prévue d'ici 2100 : jusqu'à 1 mètre.
            </p>
            <button className="landing__urgency-cta" onClick={() => navigate('/data')}>
              Voir les données →
            </button>
          </div>
          <div className="landing__urgency-right">
            {[
              { n: '5',    u: 'îles Salomon',  s: 'déjà englouties (2016)',  c: '#FF5252' },
              { n: '1m',   u: 'de montée',     s: "prévu d'ici 2100 GIEC",   c: '#FF9100' },
              { n: '190M', u: 'personnes',     s: 'à déplacer si +1m',       c: '#FF6B35' },
            ].map((s) => (
              <div key={s.u} className="landing__urg-stat" style={{ '--uc': s.c, borderColor: `${s.c}22` }}>
                <div className="landing__urg-num" style={{ color: s.c }}>{s.n}</div>
                <div className="landing__urg-unit">{s.u}</div>
                <div className="landing__urg-sub">{s.s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ════════════════════════════════════ */}
      <section className="landing__final">
        <div className="landing__final-ocean">
          <RisingOcean />
        </div>
        <div className="landing__final-overlay" />
        <div className="landing__final-content">
          <h2 className="landing__final-title">Voyez ce qui se joue<br/>dans le Pacifique</h2>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="landing__final-btn" onClick={() => navigate('/map')}>
              Lancer la carte
            </button>
            <button className="landing__final-btn landing__final-btn--data" onClick={() => navigate('/data')}>
              Voir les données
            </button>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════ */}
      <footer className="landing__footer">
        <div className="landing__footer-logo">🌊 PacificShield</div>
        <div className="landing__footer-links">
          <button onClick={() => navigate('/map')}>Carte</button>
          <button onClick={() => navigate('/data')}>Données</button>
          <button onClick={() => navigate('/about')}>À propos</button>
        </div>
        <div className="landing__footer-credits">
          Pacific Dataviz Challenge 2026 · NOAA · NASA · JAXA · SPREP · IPCC AR6 · CC BY 4.0
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;