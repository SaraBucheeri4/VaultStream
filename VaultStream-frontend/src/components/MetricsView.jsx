// MetricsView.jsx — Performance Metrics surface (matches comp)
// Flat solids only — no gradient strokes or text.

import React, { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon.jsx';

function useCounter(target, durationMs = 700) {
  const [val, setVal] = useState(target);
  const prev = useRef(target);
  const rafRef = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const from = prev.current;
    const to = target;
    cancelAnimationFrame(rafRef.current);
    const tick = (t) => {
      const p = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(from + (to - from) * eased);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else prev.current = to;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, durationMs]);
  return val;
}

function useSeries(len = 60, opts = {}) {
  const { min = 0, max = 100, start = 50, drift = 0.06 } = opts;
  const [series, setSeries] = useState(() => {
    const a = []; let v = start;
    for (let i = 0; i < len; i++) {
      v += (Math.random() - 0.5) * (max - min) * drift;
      v = Math.max(min, Math.min(max, v));
      a.push(v);
    }
    return a;
  });
  useEffect(() => {
    const t = setInterval(() => {
      setSeries(prev => {
        const last = prev[prev.length - 1];
        let next = last + (Math.random() - 0.48) * (max - min) * drift;
        next = Math.max(min, Math.min(max, next));
        return [...prev.slice(1), next];
      });
    }, 1100);
    return () => clearInterval(t);
  }, [min, max, drift]);
  return series;
}

// ------------------- Stat cards (4 unique footers) -------------------

export function MStatCard({ label, value, unit, icon, footer }) {
  return (
    <div className="mstat">
      <div className="mstat__head">
        <div className="mstat__icon"><Icon name={icon} size={17} /></div>
        {footer.topRight}
      </div>
      <div className="mstat__label">{label}</div>
      <div className="mstat__value">{value}{unit && <span className="unit"> {unit}</span>}</div>
      <div className="mstat__viz">{footer.viz}</div>
    </div>
  );
}

// ------------------- Infrastructure Load chart (solid color) -------------------

export function InfraLoadChart({ height = 240 }) {
  const series = useSeries(60, { min: 25, max: 95, start: 55, drift: 0.18 });
  const w = 620;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const step = w / (series.length - 1);
  const pts = series.map((v, i) => [i * step, 18 + (height - 36) * (1 - (v - min) / range)]);
  // Smooth via Catmull-Rom → cubic Bezier
  const smooth = (pts) => {
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
      const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
      const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
      const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d;
  };
  const line = smooth(pts);
  const area = `${line} L${w},${height} L0,${height} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      <defs>
        <linearGradient id="infra-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* horizontal grid */}
      {[0.25, 0.5, 0.75].map(p => (
        <line key={p} x1="0" x2={w} y1={height * p} y2={height * p} stroke="rgba(255,255,255,.04)" strokeWidth="1"/>
      ))}
      <path d={area} fill="url(#infra-fill)" />
      <path d={line} fill="none" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ------------------- Global Nodes panel -------------------

export function NodeRow({ region, location, load, color }) {
  return (
    <div className="noderow">
      <div className="noderow__icon"><Icon name="server" size={17} /></div>
      <div>
        <div className="noderow__name">{region}</div>
        <div className="noderow__region">{location}</div>
      </div>
      <div className="noderow__loadwrap">
        <div className="noderow__loadtxt">{load}% Load</div>
        <div className="noderow__loadbar">
          <i style={{ width: `${load}%`, background: color }} />
        </div>
      </div>
    </div>
  );
}

// ------------------- Live Activity Stream table -------------------

const ACTIVITY_SEED = [
  ['#EV-0912-A', 'Auth_Service_V2',     'SUCCESS',   '12:42:15.002'],
  ['#EV-0912-B', 'Storage_Worker_04',   'THROTTLED', '12:41:02.190'],
  ['#EV-0912-C', 'Kafka_Ingress_Mirror','CRITICAL',  '12:39:55.441'],
];

export function ActivityTable() {
  return (
    <div className="activity">
      <div className="activity__head">
        <div className="activity__title">Live Activity Stream</div>
        <span className="alertpill"><span className="d"/> 2 Alerts</span>
      </div>
      <div className="activitytable">
        <div className="activitytable__head" style={{ display: 'contents' }}>
          <div>Event ID</div>
          <div>Resource</div>
          <div>Status</div>
          <div>Timestamp</div>
        </div>
        {ACTIVITY_SEED.map(([id, resource, status, ts]) => (
          <div key={id} className="activitytable__row" style={{ display: 'contents' }}>
            <div className="activitytable__id">{id}</div>
            <div className="activitytable__resource">{resource}</div>
            <div>
              <span className={`statuspill status-${status.toLowerCase()}`}>{status}</span>
            </div>
            <div className="activitytable__ts">{ts}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ------------------- View -------------------

export default function MetricsView() {
  const reqs    = useCounter(1241000, 800);
  const latency = useCounter(42, 600);
  const errRate = useCounter(0.04, 700);
  const sessions= useCounter(84200, 800);

  const fmtK = (n) => n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : (n / 1000).toFixed(1) + 'k';

  return (
    <>
      <div className="pagehead">
        <h1 style={{ color: 'var(--primary-400)' }}>System Performance Metrics</h1>
        <p>Real-time health monitoring of global deployment clusters.</p>
      </div>

      {/* 4 stat cards */}
      <div className="statgrid statgrid--4">
        <MStatCard
          label="REQUEST COUNT" value={fmtK(reqs)} unit="/hr" icon="box"
          footer={{
            topRight: <span className="deltapill deltapill--cyan"><Icon name="arrow-up-right" size={11}/> +12.5%</span>,
            viz: (
              <div className="minibars">
                <i style={{ height: 12 }}/>
                <i style={{ height: 22 }}/>
                <i style={{ height: 14 }}/>
                <i style={{ height: 26 }} className="hi"/>
              </div>
            )
          }}
        />
        <MStatCard
          label="RESPONSE TIME" value={latency.toFixed(0)} unit="ms avg" icon="stopwatch"
          footer={{
            topRight: <span className="deltapill deltapill--pink"><Icon name="zap" size={11}/> FAST</span>,
            viz: <div className="gradprog"><i style={{ width: '38%' }}/></div>
          }}
        />
        <MStatCard
          label="ERROR RATE" value={errRate.toFixed(2)} unit="%" icon="alert-octagon"
          footer={{
            topRight: <span className="deltapill deltapill--cyan"><Icon name="arrow-down-right" size={11}/> -0.02%</span>,
            viz: (
              <div className="dots">
                <i className="active"/><i/><i/><i/>
              </div>
            )
          }}
        />
        <MStatCard
          label="ACTIVE SESSIONS" value={fmtK(sessions)} icon="users-round"
          footer={{
            topRight: (
              <span style={{ display:'inline-flex',alignItems:'center',gap:6,padding:'3px 10px',borderRadius:99,background:'rgba(34,211,238,.10)',color:'var(--tertiary-400)',font:'500 11px var(--font-body)'}}>
                <span style={{width:5,height:5,borderRadius:99,background:'var(--tertiary-400)',boxShadow:'0 0 6px var(--tertiary-400)'}}/>
                Live
              </span>
            ),
            viz: (
              <div className="avatarstack">
                <div className="avatarstack__group">
                  <div className="a" style={{ backgroundImage: 'url(https://i.pravatar.cc/40?img=24)' }}/>
                  <div className="a" style={{ backgroundImage: 'url(https://i.pravatar.cc/40?img=32)' }}/>
                  <div className="a" style={{ backgroundImage: 'url(https://i.pravatar.cc/40?img=47)' }}/>
                </div>
                <span className="avatarstack__more">+84k</span>
              </div>
            )
          }}
        />
      </div>

      {/* Infrastructure Load + Global Nodes row */}
      <div className="row-2-1">
        <div className="chartcard">
          <div className="chartcard__head">
            <div>
              <div className="chartcard__title">Infrastructure Load</div>
              <div className="chartcard__subtitle">Compute vs Memory distribution across nodes.</div>
            </div>
            <div className="segctl">
              <span className="on">Live</span><span>1H</span><span>24H</span>
            </div>
          </div>
          <div style={{ marginTop: 18 }}>
            <InfraLoadChart height={240} />
          </div>
        </div>

        <div className="chartcard">
          <div className="chartcard__head" style={{ marginBottom: 10 }}>
            <div>
              <div className="chartcard__title">Global Nodes</div>
              <div className="chartcard__subtitle" style={{ color: 'var(--tertiary-400)' }}>
                <span style={{
                  display: 'inline-block', width: 6, height: 6, borderRadius: 99,
                  background: 'var(--tertiary-400)', marginRight: 7,
                  boxShadow: '0 0 6px var(--tertiary-400)', verticalAlign: 'middle',
                }}/>
                All systems operational
              </div>
            </div>
          </div>
          <div>
            <NodeRow region="US-EAST-1" location="Virginia, USA" load={98.2} color="var(--tertiary-400)" />
            <NodeRow region="EU-WEST-2" location="London, UK"   load={42.1} color="var(--secondary-400)" />
            <NodeRow region="AP-SOUTH-1" location="Mumbai, IN"  load={12.5} color="var(--primary-400)" />
          </div>
          <button className="btn btn--outlined" style={{ width: '100%', marginTop: 22 }}>
            View Network Topology
          </button>
        </div>
      </div>

      <ActivityTable />
    </>
  );
}
