// src/components/SeaLevelControl/SeaLevelControl.jsx
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import './SeaLevelControl.scss';
import { SEA_LEVEL_SCENARIOS } from '../data/seaLevelData';

const UI_MAX = 12;

const getPopAtRisk = (rise) => {
  const pts = [[0,0],[0.3,70e6],[1,190e6],[2,340e6],[5,630e6],[12,1100e6]];
  for (let i = 0; i < pts.length - 1; i++) {
    const [a,va] = pts[i], [b,vb] = pts[i+1];
    if (rise >= a && rise <= b) return Math.round(va + (rise-a)/(b-a)*(vb-va));
  }
  return 1100e6;
};

const fmtPop = (n) =>
  n >= 1e9 ? `${(n/1e9).toFixed(1)} Md`
  : n >= 1e6 ? `${Math.round(n/1e6)} M`
  : `${Math.round(n/1e3)} k`;

const getClosest = (rise) =>
  SEA_LEVEL_SCENARIOS.reduce((p,c) =>
    Math.abs(c.rise - rise) < Math.abs(p.rise - rise) ? c : p);

const getInterp = (rise) => {
  for (let i = 0; i < SEA_LEVEL_SCENARIOS.length - 1; i++) {
    const a = SEA_LEVEL_SCENARIOS[i], b = SEA_LEVEL_SCENARIOS[i+1];
    if (rise >= a.rise && rise <= b.rise) {
      const t = (rise - a.rise) / (b.rise - a.rise);
      return {
        waveIntensity: (a.waveIntensity||0.15) + t*((b.waveIntensity||1)-(a.waveIntensity||0.15)),
        tempAnomaly: a.tempAnomaly != null && b.tempAnomaly != null
          ? a.tempAnomaly + t*(b.tempAnomaly - a.tempAnomaly) : a.tempAnomaly,
      };
    }
  }
  return { waveIntensity: 1, tempAnomaly: null };
};

const SeaLevelControl = ({ seaRise, onChange }) => {
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef(null);
  const valRef = useRef(seaRise);

  const closest = useMemo(() => getClosest(seaRise), [seaRise]);
  const interp  = useMemo(() => getInterp(seaRise),  [seaRise]);
  const pop     = useMemo(() => getPopAtRisk(seaRise), [seaRise]);

  const color = closest.color || '#00e5ff';
  const pct   = Math.min(seaRise / UI_MAX, 1) * 100;

  const dangerCol =
    seaRise < 0.5 ? '#69f0ae'
    : seaRise < 2 ? '#ffd740'
    : seaRise < 5 ? '#ffab40'
    : '#ff5252';

  const stop = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    setPlaying(false);
  }, []);

  const play = useCallback(() => {
    setPlaying(true);
    const tick = () => {
      valRef.current = (valRef.current + 0.003) % UI_MAX;
      onChange(parseFloat(valRef.current.toFixed(3)));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [onChange]);

  useEffect(() => { valRef.current = seaRise; }, [seaRise]);
  useEffect(() => () => stop(), [stop]);

  const set = (v) => { stop(); onChange(parseFloat(v)); };

  return (
    <div className="slc">
      <div className="slc__panel">

        {/* HEAD */}
        <div className="slc__head">
          <div
            className="slc__icon"
            style={{
              '--slc-color': color,
              background:    `${color}20`,
              border:        `1.5px solid ${color}`,
            }}
          >🌊</div>

          <div className="slc__titles">
            <span className="slc__eyebrow">Montée des eaux</span>
            <div className="slc__name" style={{ color, textShadow: `0 0 24px ${color}88` }}>
              {closest.label}
            </div>
          </div>

          <div className="slc__badge">
            <div className="slc__badge-num" style={{ color, textShadow: `0 0 28px ${color}` }}>
              +{seaRise < 10 ? seaRise.toFixed(2) : seaRise.toFixed(1)}
              <span className="slc__badge-unit">m</span>
            </div>
            <div className="slc__badge-year">{closest.year}</div>
          </div>
        </div>

        {/* BODY */}
        <div className="slc__body">

          {/* Barre d'eau */}
          <div className="slc__wbar">
            <div
              className="slc__wbar-fill"
              style={{ height: `${pct}%`, background: `linear-gradient(to top, ${color}cc, ${color}40)`, color }}
            />
            <div className="slc__wbar-label">Niveau actuel · {closest.year}</div>
          </div>

          {/* Slider */}
          <div className="slc__slider">
            <input
              type="range" min={0} max={UI_MAX} step={0.01}
              value={Math.min(seaRise, UI_MAX)}
              onChange={e => set(e.target.value)}
              className="slc__range"
              style={{
                '--slc-color': color,
                background: `linear-gradient(to right,
                  ${color} 0%, ${color} ${pct}%,
                  rgba(255,255,255,0.14) ${pct}%, rgba(255,255,255,0.14) 100%)`,
              }}
            />
            <div className="slc__ticks">
              {SEA_LEVEL_SCENARIOS.filter(s => s.rise <= UI_MAX).map(s => (
                <div
                  key={s.id}
                  className="slc__tick"
                  title={s.label}
                  onClick={() => set(s.rise)}
                  style={{
                    background: s.rise <= seaRise ? s.color : 'rgba(255,255,255,0.18)',
                    boxShadow:  s.rise <= seaRise ? `0 0 6px ${s.color}` : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Scénarios */}
          <div className="slc__scenes">
            {SEA_LEVEL_SCENARIOS.filter(s => s.rise <= UI_MAX).map(s => {
              const active = Math.abs(seaRise - s.rise) < 0.07;
              return (
                <button
                  key={s.id}
                  onClick={() => set(s.rise)}
                  className={`slc__scene${active ? ' slc__scene--active' : ''}`}
                  style={active ? {
                    background:   `${s.color}22`,
                    borderColor:   s.color,
                    boxShadow:    `0 0 14px ${s.color}44`,
                  } : {}}
                >
                  <div className="slc__scene__dot" style={{
                    background: s.color,
                    boxShadow:  active ? `0 0 10px ${s.color}` : 'none',
                  }}/>
                  <span className="slc__scene__label" style={{ color: active ? s.color : 'rgba(255,255,255,0.52)' }}>
                    {s.shortLabel}
                  </span>
                  {s.ipccScenario && <span className="slc__scene__sub">{s.ipccScenario}</span>}
                </button>
              );
            })}
          </div>

          {/* Stats */}
          <div className="slc__stats">
            <span className="slc__stats-title">Indicateurs</span>

            <div className="slc__stat">
              <span className="slc__stat-label">👥 Pop. à risque</span>
              <span className="slc__stat-value" style={{ color: dangerCol }}>{fmtPop(pop)}</span>
            </div>

            {interp.tempAnomaly != null && (
              <div className="slc__stat">
                <span className="slc__stat-label">🌡 Anomalie temp.</span>
                <span className="slc__stat-value" style={{
                  color: interp.tempAnomaly > 4 ? '#ff1744'
                    : interp.tempAnomaly > 2 ? '#ff6d00' : '#ffd740'
                }}>
                  +{interp.tempAnomaly.toFixed(1)} °C
                </span>
              </div>
            )}

            {closest.ipccScenario && (
              <div className="slc__stat">
                <span className="slc__stat-label">📋 GIEC</span>
                <span className="slc__stat-value" style={{ color: 'rgba(255,255,255,0.82)' }}>
                  {closest.ipccScenario}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="slc__desc">{closest.description}</div>

          {/* Contrôles */}
          <div className="slc__controls">
            <button
              className="slc__btn-play"
              onClick={() => playing ? stop() : play()}
              style={{
                background:   playing ? 'rgba(255,82,82,0.15)' : `${color}18`,
                borderColor:   playing ? '#ff5252' : color,
                color:         playing ? '#ff5252' : color,
              }}
            >
              {playing ? '⏹ Arrêter' : '▶ Simuler la montée'}
            </button>
            <button className="slc__btn-reset" onClick={() => { stop(); onChange(0); }} title="Réinitialiser">
              ↺
            </button>
          </div>

          <div className="slc__credit">Données mockées · IPCC AR6 · NOAA · NASA · SPREP</div>
        </div>

        <div className="slc__foot-bar" style={{
          background: `linear-gradient(to right, transparent, ${color}, transparent)`,
        }}/>
      </div>
    </div>
  );
};

export default SeaLevelControl;