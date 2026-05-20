// MetricsView.jsx — Performance Metrics surface, data from /api/metrics/summary

import React, { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon.jsx';

// ── Animated counter ──────────────────────────────────────────────────────────
function useCounter(target, durationMs = 700) {
  const [val, setVal] = useState(target);
  const prev = useRef(target);
  const rafRef = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const from = prev.current;
    cancelAnimationFrame(rafRef.current);
    const tick = (t) => {
      const p = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(from + (target - from) * eased);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else prev.current = target;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, durationMs]);
  return val;
}

// ── Fake-drift line chart (infra load — JVM CPU %) ───────────────────────────
function useSeries(seed, len = 60, opts = {}) {
  const { min = 0, max = 100, drift = 0.06 } = opts;
  const [series, setSeries] = useState(() => {
    const a = []; let v = seed;
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

// ── Stat card ─────────────────────────────────────────────────────────────────
function MStatCard({ label, value, unit, icon, footer }) {
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

// ── Infrastructure load chart ─────────────────────────────────────────────────
function InfraLoadChart({ seedCpu = 50, height = 240 }) {
  const series = useSeries(seedCpu, 60, { min: 0, max: 100, drift: 0.12 });
  const w = 620;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const step = w / (series.length - 1);
  const pts = series.map((v, i) => [i * step, 18 + (height - 36) * (1 - (v - min) / range)]);
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
      {[0.25, 0.5, 0.75].map(p => (
        <line key={p} x1="0" x2={w} y1={height * p} y2={height * p}
              stroke="rgba(255,255,255,.04)" strokeWidth="1"/>
      ))}
      <path d={area} fill="url(#infra-fill)" />
      <path d={line} fill="none" stroke="#A78BFA" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Node row ──────────────────────────────────────────────────────────────────
function NodeRow({ region, location, load, color }) {
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

// ── Service health row ────────────────────────────────────────────────────────
function SvcHealthRow({ name, pct, color }) {
  return (
    <div className="svchealth__row">
      <div className="svchealth__top">
        <span className="svchealth__name">{name}</span>
        <span className="svchealth__pct" style={{ color }}>{pct.toFixed(2)}%</span>
      </div>
      <div className="svchealth__bar">
        <i style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────
export default function MetricsView() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchSummary = () => {
    const token = sessionStorage.getItem('fos_token');
    fetch('/api/metrics/summary', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  };

  useEffect(() => {
    fetchSummary();
    const id = setInterval(fetchSummary, 10_000);
    return () => clearInterval(id);
  }, []);

  const cards  = data?.statCards  ?? {};
  const nodes  = data?.nodes      ?? [];
  const health = data?.serviceHealth ?? [];

  const seedCpu = nodes[0]?.cpuPct ?? 50;

  const reqs    = useCounter(cards.requestCount ?? 0, 800);
  const latency = useCounter(cards.avgLatencyMs ?? 0, 600);
  const errRate = useCounter(cards.errorRate    ?? 0, 700);
  const users   = useCounter(cards.totalUsers   ?? 0, 800);

  const fmtK = (n) => n >= 1_000_000
    ? (n / 1_000_000).toFixed(1) + 'M'
    : n >= 1000
    ? (n / 1000).toFixed(1) + 'k'
    : Math.round(n).toString();

  const svcColor = (pct) =>
    pct >= 99 ? 'var(--tertiary-400)' :
    pct >= 90 ? 'var(--status-warn)'  :
                'var(--status-error)';

  const nodeColor = (pct) =>
    pct < 50 ? 'var(--primary-400)' :
    pct < 80 ? 'var(--secondary-400)' :
               'var(--status-error)';

  return (
    <>
      <div className="pagehead">
        <h1 style={{ color: 'var(--primary-400)' }}>System Performance Metrics</h1>
        <p>Real-time health monitoring of global deployment clusters.</p>
      </div>

      {error && (
        <div className="login-error" style={{ marginBottom: 20 }}>
          <Icon name="alert-triangle" size={13} /> Could not reach /api/metrics/summary — {error}
        </div>
      )}

      {/* 4 stat cards */}
      <div className="statgrid statgrid--4">
        <MStatCard
          label="REQUEST COUNT" value={loading ? '—' : fmtK(reqs)} unit="/total" icon="box"
          footer={{
            topRight: <span className="deltapill deltapill--cyan"><Icon name="activity" size={11}/> HTTP</span>,
            viz: (
              <div className="minibars">
                <i style={{ height: 12 }}/><i style={{ height: 22 }}/>
                <i style={{ height: 14 }}/><i style={{ height: 26 }} className="hi"/>
              </div>
            )
          }}
        />
        <MStatCard
          label="AVG RESPONSE TIME" value={loading ? '—' : latency.toFixed(1)} unit="ms" icon="stopwatch"
          footer={{
            topRight: <span className="deltapill deltapill--pink"><Icon name="zap" size={11}/> LIVE</span>,
            viz: <div className="gradprog"><i style={{ width: `${Math.min(100, latency / 5)}%` }}/></div>
          }}
        />
        <MStatCard
          label="ERROR RATE" value={loading ? '—' : errRate.toFixed(3)} unit="%" icon="alert-octagon"
          footer={{
            topRight: (
              <span className={`deltapill ${errRate === 0 ? 'deltapill--cyan' : 'deltapill--bad'}`}>
                <Icon name={errRate === 0 ? 'check' : 'alert-triangle'} size={11}/>
                {errRate === 0 ? 'CLEAN' : 'ERRORS'}
              </span>
            ),
            viz: (
              <div className="dots">
                <i className={errRate === 0 ? 'active' : ''}/><i/><i/><i/>
              </div>
            )
          }}
        />
        <MStatCard
          label="REGISTERED USERS" value={loading ? '—' : fmtK(users)} icon="users-round"
          footer={{
            topRight: (
              <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'3px 10px',
                borderRadius:99, background:'rgba(34,211,238,.10)', color:'var(--tertiary-400)',
                font:'500 11px var(--font-body)' }}>
                <span style={{ width:5, height:5, borderRadius:99, background:'var(--tertiary-400)',
                  boxShadow:'0 0 6px var(--tertiary-400)' }}/>
                DB
              </span>
            ),
            viz: (
              <div className="avatarstack">
                <span className="avatarstack__more" style={{ marginLeft: 0 }}>
                  {loading ? '…' : `${Math.round(users)} total`}
                </span>
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
              <div className="chartcard__subtitle">
                CPU load trend — current: {loading ? '…' : `${seedCpu.toFixed(1)}%`}
              </div>
            </div>
            <div className="segctl">
              <span className="on">Live</span><span>1H</span><span>24H</span>
            </div>
          </div>
          <div style={{ marginTop: 18 }}>
            <InfraLoadChart seedCpu={seedCpu} height={240} />
          </div>
        </div>

        <div className="chartcard">
          <div className="chartcard__head" style={{ marginBottom: 10 }}>
            <div>
              <div className="chartcard__title">App Node</div>
              <div className="chartcard__subtitle" style={{ color: 'var(--tertiary-400)' }}>
                <span style={{ display:'inline-block', width:6, height:6, borderRadius:99,
                  background:'var(--tertiary-400)', marginRight:7,
                  boxShadow:'0 0 6px var(--tertiary-400)', verticalAlign:'middle' }}/>
                {loading ? 'Connecting…' : 'System operational'}
              </div>
            </div>
          </div>
          <div>
            {loading
              ? <div style={{ color: 'var(--fg-4)', padding: '12px 0' }}>Loading…</div>
              : nodes.map(n => (
                <NodeRow
                  key={n.region}
                  region={n.region}
                  location={`${n.location} · Heap ${n.heapUsedMb}/${n.heapMaxMb} MB`}
                  load={n.cpuPct}
                  color={nodeColor(n.cpuPct)}
                />
              ))
            }
          </div>

          {/* Service health */}
          <div style={{ marginTop: 20 }}>
            <div className="chartcard__title" style={{ fontSize: 14, marginBottom: 14 }}>Service Health</div>
            <div className="svchealth">
              {loading
                ? <div style={{ color: 'var(--fg-4)' }}>Loading…</div>
                : health.map(s => (
                  <SvcHealthRow key={s.name} name={s.name} pct={s.pct} color={svcColor(s.pct)} />
                ))
              }
            </div>
          </div>

          <button className="btn btn--outlined" style={{ width: '100%', marginTop: 22 }}>
            View Network Topology
          </button>
        </div>
      </div>
    </>
  );
}
