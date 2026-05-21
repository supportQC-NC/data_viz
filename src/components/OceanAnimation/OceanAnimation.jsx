// ============================================================
// src/components/OceanAnimation/OceanAnimation.jsx
//
// Composant canvas 2D haute performance simulant :
//   → Vagues multicouches avec phases décalées
//   → Particules bioluminescentes
//   → Montée des eaux cinématique
//   → Glitch/distorsion atmosphérique
//   → Adaptation dynamique selon le scénario climatique
//
// Pas de dépendances externes — Canvas 2D pur.
// Performance : requestAnimationFrame + optimisations GPU-friendly.
// ============================================================

import React, {
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { interpolateScenario } from '../../data/seaLevelData';

// ─── Utilitaires math ──────────────────────────────────────

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max));

// ─── Palette chromatique dynamique ────────────────────────

const PALETTES = {
  safe: {
    skyTop:     '#020d18',
    skyBottom:  '#041a2e',
    glowColor:  '#00e5ff',
    wave1:      'rgba(0, 180, 255, 0.65)',
    wave2:      'rgba(0, 120, 210, 0.50)',
    wave3:      'rgba(0, 80, 160, 0.40)',
    wave4:      'rgba(0, 50, 130, 0.30)',
    foam:       'rgba(180, 230, 255, 0.75)',
    particle:   '#00e5ff',
    particleAlt:'#80d8ff',
    waterBody:  'rgba(0, 60, 130, 0.92)',
    waterSheen: 'rgba(0, 200, 255, 0.18)',
    shoreLine:  '#00bcd4',
  },
  danger: {
    skyTop:     '#0d0500',
    skyBottom:  '#1a0800',
    glowColor:  '#ff6d00',
    wave1:      'rgba(255, 100, 0, 0.60)',
    wave2:      'rgba(200, 60, 0, 0.48)',
    wave3:      'rgba(140, 30, 0, 0.38)',
    wave4:      'rgba(80, 10, 0, 0.28)',
    foam:       'rgba(255, 200, 120, 0.70)',
    particle:   '#ffab40',
    particleAlt:'#ff6d00',
    waterBody:  'rgba(100, 20, 0, 0.92)',
    waterSheen: 'rgba(255, 100, 0, 0.15)',
    shoreLine:  '#ff6d00',
  },
  critical: {
    skyTop:     '#050000',
    skyBottom:  '#110000',
    glowColor:  '#ff1744',
    wave1:      'rgba(220, 20, 20, 0.65)',
    wave2:      'rgba(160, 10, 10, 0.50)',
    wave3:      'rgba(100, 5, 5, 0.40)',
    wave4:      'rgba(60, 0, 0, 0.30)',
    foam:       'rgba(255, 150, 150, 0.65)',
    particle:   '#ff5252',
    particleAlt:'#ff1744',
    waterBody:  'rgba(80, 0, 0, 0.95)',
    waterSheen: 'rgba(220, 20, 20, 0.12)',
    shoreLine:  '#ff1744',
  },
};

const getPalette = (seaRise) => {
  if (seaRise < 1)   return PALETTES.safe;
  if (seaRise < 3)   return lerp_palette(PALETTES.safe, PALETTES.danger, (seaRise - 1) / 2);
  if (seaRise < 8)   return lerp_palette(PALETTES.danger, PALETTES.critical, (seaRise - 3) / 5);
  return PALETTES.critical;
};

// Interpolation simple sur les couleurs clés (on utilise les extrêmes)
const lerp_palette = (a, b, t) => (t < 0.5 ? a : b);

// ─── Classe Particle ──────────────────────────────────────

class Particle {
  constructor(canvasW, canvasH, waterY, palette) {
    this.reset(canvasW, canvasH, waterY, palette);
    // Début aléatoire dans la vie pour éviter l'effet de spawn simultané
    this.life = rand(0, this.maxLife);
  }

  reset(canvasW, canvasH, waterY, palette) {
    this.x = rand(0, canvasW);
    this.y = rand(waterY - 120, waterY + 80);
    this.vx = rand(-0.4, 0.4);
    this.vy = rand(-1.2, -0.3);
    this.radius = rand(0.8, 3.2);
    this.maxLife = rand(80, 200);
    this.life = 0;
    this.palette = palette;
    this.type = Math.random() > 0.6 ? 'alt' : 'main';
    this.pulse = rand(0, Math.PI * 2);
    this.pulseSpeed = rand(0.04, 0.12);
    this.twinkle = Math.random() > 0.7;
    this.canvasW = canvasW;
    this.canvasH = canvasH;
    this.waterY = waterY;
  }

  update() {
    this.life++;
    this.x += this.vx + Math.sin(this.life * 0.02) * 0.3;
    this.y += this.vy;
    this.pulse += this.pulseSpeed;
    this.vx *= 0.998;
    this.vy *= 0.996;
    return this.life < this.maxLife && this.y > -20;
  }

  draw(ctx) {
    const progress = this.life / this.maxLife;
    const fadeIn  = Math.min(progress * 5, 1);
    const fadeOut = 1 - Math.pow(progress, 2);
    const alpha   = fadeIn * fadeOut;
    const pulseR  = this.twinkle
      ? this.radius * (0.7 + Math.sin(this.pulse) * 0.5)
      : this.radius;

    const color = this.type === 'main'
      ? this.palette.particle
      : this.palette.particleAlt;

    // Halo externe
    const halo = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, pulseR * 4
    );
    halo.addColorStop(0,   hexToRgba(color, alpha * 0.9));
    halo.addColorStop(0.4, hexToRgba(color, alpha * 0.3));
    halo.addColorStop(1,   hexToRgba(color, 0));

    ctx.beginPath();
    ctx.arc(this.x, this.y, pulseR * 4, 0, Math.PI * 2);
    ctx.fillStyle = halo;
    ctx.fill();

    // Core brillant
    ctx.beginPath();
    ctx.arc(this.x, this.y, pulseR, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(color, alpha);
    ctx.fill();
  }
}

// ─── Utilitaire couleur ───────────────────────────────────

const hexCache = {};
const hexToRgba = (hex, alpha) => {
  if (!hexCache[hex]) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    hexCache[hex] = [r, g, b];
  }
  const [r, g, b] = hexCache[hex];
  return `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
};

// ─── Composant principal ──────────────────────────────────

const OceanAnimation = ({
  seaRise = 0,
  width,
  height,
  className = '',
  style = {},
  showStats = false,
}) => {
  const canvasRef      = useRef(null);
  const animFrameRef   = useRef(null);
  const timeRef        = useRef(0);
  const particlesRef   = useRef([]);
  const prevSeaRise    = useRef(seaRise);
  const waterYRef      = useRef(null);
  const targetWaterY   = useRef(null);

  const scenario = useMemo(() => interpolateScenario(seaRise), [seaRise]);
  const palette  = useMemo(() => getPalette(seaRise), [seaRise]);

  // ─── Calcul Y de l'eau ──────────────────────────────────

  const computeBaseWaterY = useCallback((h, rise) => {
    // Cartographie : 0m → 75% du bas, 70m → 10% du bas
    const normalized = clamp(rise / 70, 0, 1);
    const eased      = 1 - Math.pow(1 - normalized, 2.5);
    return h * (0.75 - eased * 0.65);
  }, []);

  // ─── Init particules ─────────────────────────────────────

  const initParticles = useCallback((w, h, waterY, count, pal) => {
    const particles = [];
    for (let i = 0; i < count; i++) {
      particles.push(new Particle(w, h, waterY, pal));
    }
    particlesRef.current = particles;
  }, []);

  // ─── Rendu d'une vague ───────────────────────────────────

  const drawWave = useCallback((
    ctx, w, h,
    waterY, time,
    amplitude, frequency, speed, phase,
    color, yOffset = 0,
  ) => {
    ctx.beginPath();
    ctx.moveTo(0, h + 10);

    for (let x = 0; x <= w; x += 3) {
      const t  = x / w;
      // Superposition de sinusoïdes pour un mouvement organique
      const y1 = Math.sin(t * frequency * Math.PI * 2 + time * speed + phase) * amplitude;
      const y2 = Math.sin(t * frequency * 1.7 * Math.PI * 2 + time * speed * 0.7 + phase * 1.3) * amplitude * 0.4;
      const y3 = Math.sin(t * frequency * 0.5 * Math.PI * 2 + time * speed * 1.3 + phase * 0.7) * amplitude * 0.2;
      const y  = waterY + yOffset + y1 + y2 + y3;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(w, h + 10);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }, []);

  // ─── Dessin de la surface (reflets) ──────────────────────

  const drawWaterSurface = useCallback((ctx, w, h, waterY, time, pal) => {
    // Ligne de surface principale avec shimmer
    for (let x = 0; x < w; x += 4) {
      const shimmer = Math.sin(x * 0.05 + time * 2.1) * 2 +
                      Math.sin(x * 0.02 + time * 1.3) * 1.5;
      const y       = waterY + shimmer;
      const alpha   = 0.6 + Math.abs(Math.sin(x * 0.03 + time)) * 0.4;

      ctx.fillStyle = hexToRgba(pal.shoreLine, alpha * 0.8);
      ctx.fillRect(x, y - 1, 3, 2);
    }
  }, []);

  // ─── Fond sky / atmosphère ───────────────────────────────

  const drawSky = useCallback((ctx, w, h, waterY, pal, time, seaRise) => {
    // Gradient ciel
    const sky = ctx.createLinearGradient(0, 0, 0, waterY);
    sky.addColorStop(0, pal.skyTop);
    sky.addColorStop(1, pal.skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, waterY);

    // Lueur horizon
    const horizonGlow = ctx.createLinearGradient(0, waterY - 80, 0, waterY);
    horizonGlow.addColorStop(0, 'transparent');
    horizonGlow.addColorStop(1, hexToRgba(pal.glowColor, 0.18));
    ctx.fillStyle = horizonGlow;
    ctx.fillRect(0, waterY - 80, w, 80);

    // Étoiles / particules d'atmosphère
    if (seaRise < 8) {
      const starCount = 60 + Math.floor(seaRise * 10);
      // Les étoiles sont fixes — seed déterministe
      for (let i = 0; i < starCount; i++) {
        const sx     = (i * 137.5 % 1) * w;
        const sy     = ((i * 73.1) % 1) * waterY * 0.9;
        const sAlpha = 0.3 + Math.sin(time * 0.5 + i * 0.7) * 0.2;
        const sR     = 0.5 + (i % 3) * 0.4;

        ctx.beginPath();
        ctx.arc(sx, sy, sR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 230, 255, ${sAlpha.toFixed(2)})`;
        ctx.fill();
      }
    }

    // Effet "tempête" pour hauts niveaux
    if (seaRise > 2) {
      const stormAlpha = clamp((seaRise - 2) / 6, 0, 0.6);
      const storm = ctx.createRadialGradient(w * 0.5, 0, w * 0.2, w * 0.5, 0, w * 0.9);
      storm.addColorStop(0, hexToRgba(pal.glowColor, stormAlpha * 0.6));
      storm.addColorStop(1, 'transparent');
      ctx.fillStyle = storm;
      ctx.fillRect(0, 0, w, waterY);
    }
  }, []);

  // ─── Corps d'eau principal ───────────────────────────────

  const drawWaterBody = useCallback((ctx, w, h, waterY, pal) => {
    const water = ctx.createLinearGradient(0, waterY, 0, h);
    water.addColorStop(0,   pal.wave1.replace('0.65', '0.85'));
    water.addColorStop(0.3, pal.waterBody);
    water.addColorStop(1,   pal.waterBody.replace('0.92', '1'));
    ctx.fillStyle = water;
    ctx.fillRect(0, waterY, w, h - waterY);

    // Reflet de lumière sur l'eau
    const sheen = ctx.createLinearGradient(0, waterY, 0, waterY + 60);
    sheen.addColorStop(0, pal.waterSheen);
    sheen.addColorStop(1, 'transparent');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, waterY, w, 60);
  }, []);

  // ─── Foam / Écume ────────────────────────────────────────

  const drawFoam = useCallback((ctx, w, waterY, time, amplitude, pal) => {
    const foamY = waterY + Math.sin(time * 1.8) * amplitude * 0.5;

    ctx.beginPath();
    for (let x = 0; x <= w; x += 2) {
      const t    = x / w;
      const wave = Math.sin(t * 18 + time * 3.2) * amplitude * 0.35
                 + Math.sin(t * 11 + time * 2.1) * amplitude * 0.15;
      const dot  = foamY + wave;
      const r    = 1 + Math.abs(Math.sin(t * 50 + time)) * 1.5;

      if (Math.random() > 0.5) {
        ctx.moveTo(x, dot);
        ctx.arc(x, dot, r * 0.5, 0, Math.PI * 2);
      }
    }
    ctx.fillStyle = pal.foam;
    ctx.fill();
  }, []);

  // ─── Boucle de rendu principale ──────────────────────────

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w   = canvas.width;
    const h   = canvas.height;
    const t   = timeRef.current;

    // ── Smooth water level transition ─────────────────────
    const targetY  = computeBaseWaterY(h, seaRise);
    if (waterYRef.current === null) {
      waterYRef.current = targetY;
    }
    // Interpolation douce (easing)
    waterYRef.current = lerp(waterYRef.current, targetY, 0.03);
    const waterY = waterYRef.current;

    const waveIntensity = scenario.waveIntensity;
    const amp1 = lerp(4,  22, waveIntensity);
    const amp2 = lerp(6,  28, waveIntensity);
    const amp3 = lerp(8,  36, waveIntensity);
    const amp4 = lerp(10, 44, waveIntensity);

    // ── Clear ─────────────────────────────────────────────
    ctx.clearRect(0, 0, w, h);

    // ── Fond / ciel ───────────────────────────────────────
    drawSky(ctx, w, h, waterY, palette, t, seaRise);

    // ── Corps de l'eau ────────────────────────────────────
    drawWaterBody(ctx, w, h, waterY, palette);

    // ── Vagues — couche 4 (fond, la plus lente) ──────────
    drawWave(
      ctx, w, h, waterY, t,
      amp4, 1.2, 0.28, 4.1,
      palette.wave4, amp4 * 0.6,
    );

    // ── Vagues — couche 3 ─────────────────────────────────
    drawWave(
      ctx, w, h, waterY, t,
      amp3, 1.6, 0.38, 2.8,
      palette.wave3, amp3 * 0.3,
    );

    // ── Vagues — couche 2 ─────────────────────────────────
    drawWave(
      ctx, w, h, waterY, t,
      amp2, 2.1, 0.52, 1.4,
      palette.wave2, amp2 * 0.1,
    );

    // ── Vagues — couche 1 (surface, la plus rapide) ───────
    drawWave(
      ctx, w, h, waterY, t,
      amp1, 2.8, 0.72, 0,
      palette.wave1, 0,
    );

    // ── Surface / reflets ─────────────────────────────────
    drawWaterSurface(ctx, w, h, waterY, t, palette);

    // ── Écume ─────────────────────────────────────────────
    drawFoam(ctx, w, waterY, t, amp1, palette);

    // ── Particules bioluminescentes / atmosphère ──────────
    const targetCount = scenario.particleCount;
    const particles   = particlesRef.current;

    // Mise à jour + suppression
    for (let i = particles.length - 1; i >= 0; i--) {
      const alive = particles[i].update();
      if (!alive) {
        particles[i].reset(w, h, waterY, palette);
      } else {
        particles[i].waterY = waterY;
        particles[i].draw(ctx);
      }
    }

    // Ajout de nouvelles particules si besoin
    const delta = targetCount - particles.length;
    if (delta > 0) {
      const toAdd = Math.min(delta, 5); // Cap ajout / frame
      for (let i = 0; i < toAdd; i++) {
        particles.push(new Particle(w, h, waterY, palette));
      }
    } else if (delta < -20) {
      particles.splice(0, 3); // Réduction douce
    }

    // ── Vignette ─────────────────────────────────────────
    const vignette = ctx.createRadialGradient(
      w * 0.5, h * 0.5, h * 0.2,
      w * 0.5, h * 0.5, h * 0.8,
    );
    vignette.addColorStop(0, 'transparent');
    vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    // ── Overlay extrême pour niveaux catastrophiques ───────
    if (seaRise > 10) {
      const extremeAlpha = clamp((seaRise - 10) / 60, 0, 0.35);
      ctx.fillStyle = `rgba(80, 0, 0, ${extremeAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, w, h);
    }

    // ── Avancement du temps ───────────────────────────────
    // Vitesse des vagues proportionnelle à l'intensité
    timeRef.current += 0.008 + waveIntensity * 0.016;

    animFrameRef.current = requestAnimationFrame(render);
  }, [
    seaRise, scenario, palette,
    computeBaseWaterY,
    drawSky, drawWaterBody, drawWave,
    drawWaterSurface, drawFoam,
  ]);

  // ─── Resize observer ─────────────────────────────────────

  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;

    const resize = () => {
      const rect    = container.getBoundingClientRect();
      canvas.width  = rect.width  || width  || 800;
      canvas.height = rect.height || height || 300;
      // Reset waterY au resize pour éviter le saut
      waterYRef.current = null;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [width, height]);

  // ─── Reset particules quand seaRise change brusquement ───

  useEffect(() => {
    const delta = Math.abs(seaRise - prevSeaRise.current);
    prevSeaRise.current = seaRise;

    if (delta > 2) {
      // Gros saut : reset total
      particlesRef.current = [];
    }
  }, [seaRise]);

  // ─── Start / stop boucle ─────────────────────────────────

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      className={`ocean-animation ${className}`}
      style={{
        display:  'block',
        width:    '100%',
        height:   '100%',
        position: 'absolute',
        top:      0,
        left:     0,
        ...style,
      }}
      aria-label={`Animation océan — montée des eaux +${seaRise.toFixed(2)}m`}
    />
  );
};

export default OceanAnimation;