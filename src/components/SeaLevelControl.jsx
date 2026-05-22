// SeaLevelControl v5.0 — Collapsible + Contraste maximal + Données enrichies
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import './SeaLevelControl.scss';
import { SEA_LEVEL_SCENARIOS } from '../data/seaLevelData';

const UI_MAX = 12;
const lerp = (a, b, t) => a + (b - a) * t;

const NC_DATA = {
  zones: [
    { name: 'Ouvéa',     elev: 1, pop: 3400,  riseAt: 1.0, color: '#FF1744', lat: -20.65, lon: 166.57 },
    { name: 'Nouméa',    elev: 2, pop: 94285,  riseAt: 2.0, color: '#FF5252', lat: -22.28, lon: 166.44 },
    { name: 'Lifou',     elev: 3, pop: 9275,   riseAt: 3.0, color: '#FF9100', lat: -20.90, lon: 167.10 },
    { name: 'Koumac',    elev: 3, pop: 3500,   riseAt: 3.0, color: '#FF9100', lat: -20.57, lon: 164.28 },
    { name: 'Bourail',   elev: 5, pop: 5200,   riseAt: 5.0, color: '#FFD740', lat: -21.57, lon: 165.49 },
    { name: 'Poindimié', elev: 4, pop: 5100,   riseAt: 4.0, color: '#FFAB40', lat: -20.93, lon: 165.34 },
  ],
  mangroves: { totalHa: 21300, healthPct: 54, lossRate: 1.3, lossTotal: 4800 },
  coral: { coveragePct: 38, bleachingEvents: 4, mpaPct: 22 },
  seaRise: { median2100: 0.45, high2100: 0.85, observed: '+5.8mm/an' },
};

const PACIFIC_FACTS = [
  { icon: '🌊', val: '+5.8mm/an', label: 'Montée annuelle Pacifique Sud', color: '#00E5FF' },
  { icon: '🏝️', val: '5 îles',   label: 'Îles Salomon englouties (2016)', color: '#FF5252' },
  { icon: '🪸',  val: '−78%',    label: 'Coraux blanchis Pacifique 2024', color: '#FF9100' },
  { icon: '🌀',  val: '×1.8',    label: 'Cyclones cat.5 vs décennie 80',  color: '#FFD740' },
];

const getPopAtRisk = r => {
  const pts = [[0,0],[0.3,70e6],[1,190e6],[2,340e6],[5,630e6],[12,1100e6]];
  for (let i = 0; i < pts.length-1; i++) {
    const [a,va]=[pts[i][0],pts[i][1]], [b,vb]=[pts[i+1][0],pts[i+1][1]];
    if (r>=a && r<=b) return Math.round(va+(r-a)/(b-a)*(vb-va));
  }
  return 1100e6;
};

const fmtPop = n =>
  n>=1e9 ? `${(n/1e9).toFixed(1)} Md`
  : n>=1e6 ? `${Math.round(n/1e6)} M`
  : `${Math.round(n/1e3)}k`;

const getClosest = r =>
  SEA_LEVEL_SCENARIOS.reduce((p,c)=>Math.abs(c.rise-r)<Math.abs(p.rise-r)?c:p);

// ── Mini Ocean Canvas ────────────────────────────────────

const MiniOcean = ({ seaRise, color }) => {
  const cvs = useRef(null);
  const raf = useRef(null);
  const t   = useRef(0);

  useEffect(() => {
    const c = cvs.current;
    if (!c) return;
    c.width  = c.offsetWidth  || 320;
    c.height = c.offsetHeight || 110;

    const W = c.width, H = c.height;

    const draw = () => {
      const ctx = c.getContext('2d');
      const time = t.current;

      ctx.clearRect(0,0,W,H);

      // Ciel nuit
      ctx.fillStyle = '#010912';
      ctx.fillRect(0,0,W,H);

      // Niveau eau
      const norm = Math.min(seaRise/UI_MAX, 1);
      const ease = 1 - Math.pow(1-norm, 2.2);
      const wY   = H*(0.80 - ease*0.68);

      // Étoiles
      for (let i=0;i<25;i++) {
        const sx=((i*137)%1)*W, sy=((i*59)%1)*wY*0.8;
        const a=0.15+Math.sin(time*0.3+i)*0.1;
        ctx.beginPath(); ctx.arc(sx,sy,0.6+(i%3)*0.25,0,Math.PI*2);
        ctx.fillStyle=`rgba(200,220,255,${a})`; ctx.fill();
      }

      // Horizon glow
      const hg=ctx.createLinearGradient(0,wY-20,0,wY+10);
      hg.addColorStop(0,'transparent'); hg.addColorStop(1,`${color}18`);
      ctx.fillStyle=hg; ctx.fillRect(0,wY-20,W,30);

      // Île / NC silhouette — verte et qui disparaît
      const islandAlpha = Math.max(0.05, 1-norm*1.8);
      ctx.beginPath();
      ctx.moveTo(0,H);
      ctx.lineTo(0, wY+25);
      ctx.bezierCurveTo(W*0.12,wY+8, W*0.22,wY+20, W*0.3,wY+2);
      ctx.bezierCurveTo(W*0.38,wY-18, W*0.5,wY+5, W*0.6,wY);
      ctx.bezierCurveTo(W*0.72,wY-8, W*0.88,wY+12, W,wY+18);
      ctx.lineTo(W,H); ctx.closePath();
      ctx.fillStyle=`rgba(12,40,18,${islandAlpha})`; ctx.fill();

      // Mangroves (disparaissent si submersion > 40%)
      if (norm < 0.6) {
        const ma = Math.max(0,(0.6-norm)/0.6);
        [0.18,0.38,0.58,0.76].forEach((xr,i)=>{
          const mx=xr*W, my=wY+(i%2?2:-2);
          ctx.beginPath(); ctx.arc(mx,my-9,7*(1-norm*0.6),0,Math.PI*2);
          ctx.fillStyle=`rgba(10,55,18,${ma*0.9})`; ctx.fill();
          ctx.beginPath(); ctx.moveTo(mx,my); ctx.lineTo(mx,my-7);
          ctx.strokeStyle=`rgba(8,45,14,${ma})`; ctx.lineWidth=2; ctx.stroke();
        });
      }

      // Vagues
      const r2=parseInt(color.slice(1,3),16)||0;
      const g2=parseInt(color.slice(3,5),16)||100;
      const b2=parseInt(color.slice(5,7),16)||200;
      [[0.35,0.22,0.30],[0.25,0.38,0.20],[0.16,0.60,0.14]].forEach(([amp,spd,opa])=>{
        const a2=amp*(1+norm*1.8);
        ctx.beginPath(); ctx.moveTo(0,H);
        for(let x=0;x<=W;x+=2){
          const r=x/W;
          const y=wY+Math.sin(r*4*Math.PI+time*spd)*a2+Math.sin(r*7*Math.PI+time*spd*0.7)*a2*0.3;
          ctx.lineTo(x,y);
        }
        ctx.lineTo(W,H); ctx.closePath();
        ctx.fillStyle=`rgba(${r2},${g2},${b2},${opa})`; ctx.fill();
      });

      // Eau pleine
      const wg=ctx.createLinearGradient(0,wY,0,H);
      wg.addColorStop(0,`rgba(${r2},${g2},${b2},0.55)`);
      wg.addColorStop(1,`rgba(${Math.max(0,r2-10)},${Math.max(0,g2-15)},${Math.max(0,b2-20)},0.92)`);
      ctx.fillStyle=wg; ctx.fillRect(0,wY+12,W,H);

      // Reflets
      for(let x=0;x<W;x+=5){
        const sh=Math.sin(x*0.09+time*2)*1.5;
        const a3=0.2+Math.abs(Math.sin(x*0.04+time))*0.3;
        ctx.fillStyle=`rgba(${Math.min(255,r2+80)},${Math.min(255,g2+120)},${Math.min(255,b2+130)},${a3})`;
        ctx.fillRect(x,wY+sh,4,1.5);
      }

      // Compteur + ligne niveau
      if (seaRise>0.01) {
        ctx.beginPath(); ctx.setLineDash([3,3]);
        ctx.moveTo(6,wY); ctx.lineTo(W-6,wY);
        ctx.strokeStyle=`${color}70`; ctx.lineWidth=0.8; ctx.stroke();
        ctx.setLineDash([]);
        ctx.font='bold 11px "DM Mono",monospace';
        ctx.textAlign='right'; ctx.fillStyle=color;
        ctx.shadowColor=color; ctx.shadowBlur=6;
        ctx.fillText(`+${seaRise.toFixed(2)}m`,W-6,wY-4);
        ctx.shadowBlur=0;
      }

      // Particules
      for(let i=0;i<10;i++){
        const px=((i*73+Math.sin(time*0.1+i)*18)%W+W)%W;
        const py=wY+8+Math.sin(time*0.4+i*1.3)*18+i*4;
        if(py>H-2) continue;
        const pa=0.12+Math.sin(time*0.8+i*0.5)*0.12;
        ctx.beginPath(); ctx.arc(px,py,1.3,0,Math.PI*2);
        ctx.fillStyle=`rgba(${Math.min(255,r2+60)},${Math.min(255,g2+180)},${Math.min(255,b2+200)},${pa})`;
        ctx.fill();
      }

      t.current += 0.015;
      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return ()=>cancelAnimationFrame(raf.current);
  }, [seaRise, color]);

  return <canvas ref={cvs} style={{width:'100%',height:'100%',display:'block',borderRadius:'8px'}} aria-hidden="true"/>;
};

// ── NCZone Bar ────────────────────────────────────────────

const NCZoneBar = ({ zone, seaRise }) => {
  const pct = Math.min(100, (seaRise/zone.riseAt)*100);
  const sub = seaRise >= zone.riseAt;
  const par = !sub && seaRise > zone.riseAt*0.5;
  return (
    <div className={`slc__ncz${sub?' slc__ncz--sub':''}`}>
      <div className="slc__ncz-head">
        <span className="slc__ncz-name">{zone.name}</span>
        <span className="slc__ncz-alt">{zone.elev}m</span>
        <span className="slc__ncz-status" style={{color:sub?'#FF1744':par?'#FF9100':'#43A047'}}>
          {sub?'🌊 SUBMERGÉ':par?'⚠ MENACÉ':'✓ OK'}
        </span>
      </div>
      <div className="slc__ncz-bar">
        <div className="slc__ncz-fill" style={{
          width:`${pct}%`,
          background:sub?'#FF1744':par?'#FF9100':'#29B6F6',
          boxShadow:sub?'0 0 8px #FF1744aa':'none',
        }}/>
      </div>
      <div className="slc__ncz-meta">{(zone.pop/1000).toFixed(0)}k hab · risque à +{zone.riseAt}m</div>
    </div>
  );
};

// ── Composant principal ───────────────────────────────────

const SeaLevelControl = ({
  seaRise, effectiveSeaRise, onChange,
  noaaStations=[], noaaStationId, onNoaaStationChange,
  noaaLevel, noaaLoading, noaaError,
  includeNoaaLevel, onIncludeNoaaLevelChange, onRefreshNoaa,
}) => {
  const [playing,   setPlaying]   = useState(false);
  const [tab,       setTab]       = useState('sim');
  const [collapsed, setCollapsed] = useState(false);  // ← NOUVEAU
  const rafRef = useRef(null);
  const valRef = useRef(seaRise);

  const vr      = Number.isFinite(effectiveSeaRise) ? effectiveSeaRise : seaRise;
  const closest = useMemo(()=>getClosest(vr),[vr]);
  const pop     = useMemo(()=>getPopAtRisk(vr),[vr]);
  const color   = closest.color||'#00E5FF';
  const pct     = Math.min(seaRise/UI_MAX,1)*100;

  const dangerCol = vr<0.5?'#69F0AE':vr<2?'#FFD740':vr<5?'#FF9100':'#FF1744';

  const stop = useCallback(()=>{
    if(rafRef.current){cancelAnimationFrame(rafRef.current);rafRef.current=null;}
    setPlaying(false);
  },[]);

  const play = useCallback(()=>{
    setPlaying(true);
    const tick=()=>{
      valRef.current=(valRef.current+0.005)%UI_MAX;
      onChange(parseFloat(valRef.current.toFixed(3)));
      rafRef.current=requestAnimationFrame(tick);
    };
    rafRef.current=requestAnimationFrame(tick);
  },[onChange]);

  useEffect(()=>{valRef.current=seaRise;},[seaRise]);
  useEffect(()=>()=>stop(),[stop]);

  const set = v=>{stop();onChange(parseFloat(v));};
  const obs = Number.isFinite(noaaLevel?.value)?noaaLevel.value:null;
  const uiScenarios = SEA_LEVEL_SCENARIOS.filter(s=>s.rise<=UI_MAX);

  return (
    <div className="slc">
      <div className="slc__panel">

        {/* ── HEADER (toujours visible) ── */}
        <div className="slc__header" style={{'--c':color}}>
          <div className="slc__header-left">
            <div className="slc__hdr-label" style={{color}}>{closest.label}</div>
            <div className="slc__hdr-year">{closest.year}</div>
          </div>
          <div className="slc__header-right">
            <div className="slc__hdr-value" style={{color, textShadow:`0 0 20px ${color}60`}}>
              +{vr<10?vr.toFixed(2):vr.toFixed(1)}
            </div>
            <div className="slc__hdr-unit">mètres</div>
          </div>
          {/* Bouton réduire/déplier */}
          <button
            className="slc__collapse-btn"
            onClick={()=>setCollapsed(v=>!v)}
            title={collapsed?'Déplier':'Réduire'}
            aria-label={collapsed?'Déplier le panneau':'Réduire le panneau'}
          >
            {collapsed ? '▲' : '▼'}
          </button>
        </div>

        {/* ── CONTENU (masqué si collapsed) ── */}
        {!collapsed && (
          <>
            {/* Ocean canvas */}
            <div className="slc__ocean">
              <MiniOcean seaRise={vr} color={color}/>
              <div className="slc__ocean-fade"/>
              {closest.ipccScenario&&(
                <div className="slc__ocean-badge" style={{borderColor:`${color}50`,color}}>
                  {closest.ipccScenario}
                </div>
              )}
            </div>

            {/* Slider */}
            <div className="slc__slider-sec">
              <div className="slc__slider-nums">
                <span>0 m</span>
                <span style={{color, fontWeight:700}}>+{seaRise.toFixed(2)} m</span>
                <span>+12 m</span>
              </div>
              <div className="slc__track">
                <div className="slc__track-fill" style={{
                  width:`${pct}%`,
                  background:`linear-gradient(to right,#29B6F6,${color})`,
                  boxShadow:`0 0 10px ${color}50`,
                }}/>
                <input type="range" min={0} max={UI_MAX} step={0.01}
                  value={Math.min(seaRise,UI_MAX)}
                  onChange={e=>set(e.target.value)}
                  className="slc__range"/>
              </div>
              <div className="slc__ticks">
                {uiScenarios.map(s=>(
                  <div key={s.id} className="slc__tick"
                    style={{left:`${(s.rise/UI_MAX)*100}%`}}
                    onClick={()=>set(s.rise)} title={s.label}>
                    <div className="slc__tick-dot" style={{
                      background:s.rise<=seaRise?s.color:'rgba(255,255,255,0.18)',
                      boxShadow:s.rise<=seaRise?`0 0 5px ${s.color}`:'none',
                    }}/>
                    <div className="slc__tick-lbl" style={{
                      color:s.rise<=seaRise?s.color:'rgba(255,255,255,0.3)'
                    }}>{s.shortLabel}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scénarios grid */}
            <div className="slc__scenarios">
              {uiScenarios.map(s=>{
                const active=Math.abs(seaRise-s.rise)<0.07;
                return (
                  <button key={s.id}
                    className={`slc__sc${active?' slc__sc--on':''}`}
                    style={active?{background:`${s.color}1A`,borderColor:s.color,boxShadow:`0 0 14px ${s.color}30`}:{}}
                    onClick={()=>set(s.rise)}>
                    <div className="slc__sc-dot" style={{background:s.color,boxShadow:active?`0 0 7px ${s.color}`:'none'}}/>
                    <div className="slc__sc-info">
                      <div className="slc__sc-name" style={{color:active?s.color:'rgba(255,255,255,0.8)'}}>
                        {s.shortLabel}
                      </div>
                      {s.ipccScenario&&<div className="slc__sc-code">{s.ipccScenario}</div>}
                    </div>
                    <div className="slc__sc-rise" style={{color:active?s.color:'rgba(255,255,255,0.35)'}}>+{s.rise}m</div>
                  </button>
                );
              })}
            </div>

            {/* Tabs */}
            <div className="slc__tabs">
              {[['sim','🌊 Données'],['nc','🇳🇨 Calédonie'],['noaa','📡 NOAA']].map(([id,lbl])=>(
                <button key={id}
                  className={`slc__tab${tab===id?' slc__tab--on':''}`}
                  onClick={()=>setTab(id)}>{lbl}</button>
              ))}
            </div>

            {/* Tab contenu */}
            <div className="slc__body">

              {tab==='sim'&&(
                <div className="slc__stats">

                  {/* Facts Pacifique */}
                  <div className="slc__facts-grid">
                    {PACIFIC_FACTS.map(f=>(
                      <div key={f.label} className="slc__fact">
                        <div className="slc__fact-icon">{f.icon}</div>
                        <div className="slc__fact-val" style={{color:f.color}}>{f.val}</div>
                        <div className="slc__fact-lbl">{f.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="slc__divider"/>

                  {/* Stats clés */}
                  {[
                    ['👥','Population mondiale à risque', fmtPop(pop), dangerCol],
                    ['🌡','Anomalie temp. (vs préind.)',  closest.tempAnomaly!=null?`+${closest.tempAnomaly.toFixed(1)} °C`:'—',
                      closest.tempAnomaly>4?'#FF1744':closest.tempAnomaly>2?'#FF9100':'#FFD740'],
                    ['🧊','Fonte glaces arctiques', closest.arcticIceLoss!=null?`−${closest.arcticIceLoss}%`:'—','#80D8FF'],
                    ['🌿','Mangroves Pac. perdues', vr<0.5?'−8%':vr<2?'−22%':vr<5?'−51%':'−78%', '#69F0AE'],
                    ['🪸','Coraux blanchis NC',     vr<0.5?'38%':vr<1?'55%':vr<2?'72%':'91%',    '#FF9100'],
                  ].map(([ico,lbl,val,vc])=>(
                    <div key={lbl} className="slc__row">
                      <span className="slc__row-ico">{ico}</span>
                      <span className="slc__row-lbl">{lbl}</span>
                      <span className="slc__row-val" style={{color:vc}}>{val}</span>
                    </div>
                  ))}

                  <div className="slc__desc">{closest.description}</div>
                </div>
              )}

              {tab==='nc'&&(
                <div className="slc__nc">
                  {/* Header NC */}
                  <div className="slc__nc-top">
                    <div className="slc__nc-title">🇳🇨 Nouvelle-Calédonie</div>
                    <div className="slc__nc-meta">
                      <span>IPCC médiane 2100</span>
                      <span style={{color:'#29B6F6',fontWeight:700}}>+{NC_DATA.seaRise.median2100}m</span>
                    </div>
                    <div className="slc__nc-meta">
                      <span>Tendance observée</span>
                      <span style={{color:'#FF9100',fontWeight:700}}>{NC_DATA.seaRise.observed}</span>
                    </div>
                  </div>

                  {/* Zones */}
                  <div className="slc__nc-zones">
                    {NC_DATA.zones.map(z=><NCZoneBar key={z.name} zone={z} seaRise={vr}/>)}
                  </div>

                  {/* Mangroves NC */}
                  <div className="slc__nc-mang">
                    <div className="slc__nc-mang-ttl">🌿 Mangroves NC</div>
                    <div className="slc__nc-mang-row">
                      {[
                        [NC_DATA.mangroves.totalHa.toLocaleString('fr-FR')+' ha','Surface totale','#4CAF50'],
                        [NC_DATA.mangroves.healthPct+'%','Santé','#FFD740'],
                        ['−'+NC_DATA.mangroves.lossRate+'%/an','Dégradation','#FF5252'],
                      ].map(([v,l,c])=>(
                        <div key={l} className="slc__nc-mang-item">
                          <div style={{color:c,fontWeight:700,fontSize:'16px',fontFamily:'DM Mono,monospace'}}>{v}</div>
                          <div style={{fontSize:'11px',color:'rgba(255,255,255,0.45)',marginTop:'2px'}}>{l}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Coraux NC */}
                  <div className="slc__nc-coral">
                    <div className="slc__nc-mang-ttl">🪸 Récifs coralliens NC</div>
                    <div className="slc__nc-mang-row">
                      {[
                        [NC_DATA.coral.coveragePct+'%', 'Couverture vivante','#00E5FF'],
                        [NC_DATA.coral.bleachingEvents+'×','Événements blanchissement','#FF9100'],
                        [NC_DATA.coral.mpaPct+'%','Zones marines protégées','#69F0AE'],
                      ].map(([v,l,c])=>(
                        <div key={l} className="slc__nc-mang-item">
                          <div style={{color:c,fontWeight:700,fontSize:'16px',fontFamily:'DM Mono,monospace'}}>{v}</div>
                          <div style={{fontSize:'11px',color:'rgba(255,255,255,0.45)',marginTop:'2px'}}>{l}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="slc__alert">
                    ⚠ Ouvéa submergée à +1m · Plan DIMENC avant 2040 · {NC_DATA.zones.filter(z=>vr>=z.riseAt).length} zone{NC_DATA.zones.filter(z=>vr>=z.riseAt).length>1?'s':''} à risque actuellement
                  </div>
                </div>
              )}

              {tab==='noaa'&&(
                <div className="slc__noaa">
                  {[
                    {ico:'📍',lbl:'Station active',
                      content:<select className="slc__select" value={noaaStationId} onChange={e=>onNoaaStationChange?.(e.target.value)}>
                        {noaaStations.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    },
                    {ico:'🌊',lbl:'Niveau observé (MSL)',
                      content:<div className="slc__noaa-val" style={{color:obs==null?'#FFD740':'#00E5FF'}}>
                        {noaaLoading?'⏳ Chargement…':obs==null?'— indisponible':`${obs>=0?'+':''}${obs.toFixed(3)} m`}
                      </div>
                    },
                    {ico:'🕒',lbl:'Dernière mesure',
                      content:<div style={{fontSize:'13px',color:'rgba(255,255,255,0.65)'}}>
                        {noaaLevel?.time
                          ? new Date((noaaLevel.time.includes('T')?noaaLevel.time:noaaLevel.time.replace(' ','T')+'Z'))
                              .toLocaleString('fr-FR',{dateStyle:'short',timeStyle:'short'})
                          : '—'}
                      </div>
                    },
                  ].map(({ico,lbl,content})=>(
                    <div key={lbl} className="slc__noaa-row">
                      <span className="slc__noaa-ico">{ico}</span>
                      <div className="slc__noaa-body">
                        <div className="slc__noaa-lbl">{lbl}</div>
                        {content}
                      </div>
                    </div>
                  ))}

                  <label className="slc__noaa-row slc__noaa-row--toggle">
                    <span className="slc__noaa-ico">➕</span>
                    <div className="slc__noaa-body">
                      <div className="slc__noaa-lbl">Ajouter à la simulation</div>
                      <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)'}}>Cumul obs. + scénario IPCC</div>
                    </div>
                    <div className="slc__toggle">
                      <input type="checkbox" id="noaa-toggle"
                        checked={Boolean(includeNoaaLevel)}
                        onChange={e=>onIncludeNoaaLevelChange?.(e.target.checked)}/>
                      <label htmlFor="noaa-toggle" className="slc__toggle-track">
                        <div className="slc__toggle-thumb"/>
                      </label>
                    </div>
                  </label>

                  {noaaError&&<div className="slc__noaa-err">⚠ {noaaError}</div>}
                </div>
              )}
            </div>

            {/* Contrôles */}
            <div className="slc__controls">
              <button className="slc__play"
                onClick={()=>playing?stop():play()}
                style={playing
                  ?{borderColor:'#FF5252',color:'#FF5252',background:'rgba(255,82,82,0.1)'}
                  :{borderColor:color,color,background:`${color}12`}}>
                {playing?'⏹ Stop':'▶ Simuler la montée'}
              </button>
              <button className="slc__icon-btn" onClick={()=>{stop();onChange(0);}} title="Réinitialiser">↺</button>
              <button className="slc__icon-btn" onClick={onRefreshNoaa} disabled={noaaLoading} title="Rafraîchir NOAA">📡</button>
            </div>

            <div className="slc__foot" style={{background:`linear-gradient(to right,transparent,${color},transparent)`}}/>
            <div className="slc__credit">IPCC AR6 · NOAA CO-OPS · NASA · SPREP · DIMENC · IRD</div>
          </>
        )}

        {/* En mode collapsed : petit résumé */}
        {collapsed && (
          <div className="slc__collapsed-summary">
            <div className="slc__cs-row">
              <span style={{color:'rgba(255,255,255,0.5)',fontSize:'12px'}}>Simulation</span>
              <span style={{color,fontFamily:'DM Mono,monospace',fontSize:'16px',fontWeight:600}}>+{vr.toFixed(2)} m</span>
            </div>
            <div className="slc__cs-row">
              <span style={{fontSize:'12px',color:'rgba(255,255,255,0.4)'}}>{closest.ipccScenario||'Référence'}</span>
              <span style={{fontSize:'12px',color:'rgba(255,255,255,0.5)'}}>{closest.year}</span>
            </div>
            <input type="range" min={0} max={UI_MAX} step={0.01}
              value={Math.min(seaRise,UI_MAX)}
              onChange={e=>set(e.target.value)}
              className="slc__range slc__range--mini"
              style={{
                background:`linear-gradient(to right,${color} 0%,${color} ${pct}%,rgba(255,255,255,0.12) ${pct}%,rgba(255,255,255,0.12) 100%)`,
              }}/>
          </div>
        )}

      </div>
    </div>
  );
};

export default SeaLevelControl;