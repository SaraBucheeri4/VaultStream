// LogsView.jsx — System Logs surface (matches comp)

import React, { useEffect, useState } from 'react';
import { Icon } from './Icon.jsx';

const SERVICES = ['api-gateway','auth-service','ledger-core','notification-svc','kyc-manager','session-store','metrics-edge'];
const LOG_SEEDS = [
  ['INFO',  'api-gateway',     'Database query execution: 42ms'],
  ['ERROR', 'auth-service',    'Failed to validate JWT signature: issuer mismatch'],
  ['INFO',  'ledger-core',     'Transaction commit successful: tx_9921200'],
  ['WARN',  'api-gateway',     'High latency detected on endpoint /v1/ledger (420ms)'],
  ['DEBUG', 'notification-svc','Dispatching push notification to device id 0x882…'],
  ['INFO',  'kyc-manager',     'User documents uploaded for processing'],
  ['INFO',  'session-store',   'session.created idle_ttl=3600s'],
  ['WARN',  'metrics-edge',    'queue.backlog growing depth=412'],
  ['DEBUG', 'auth-service',    'retry attempt 2/3 backoff=400ms'],
  ['ERROR', 'ledger-core',     'db.connection.refused upstream=primary-us-east-1'],
  ['INFO',  'auth-service',    'auth.token.issued for user_4f2a (region: us-east-1)'],
];

const hex8 = () => Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
const cid = (svc) => {
  const prefixes = { 'auth-service':'auth', 'ledger-core':'tx', 'api-gateway':'gw',
                     'notification-svc':'not', 'kyc-manager':'kyc', 'session-store':'sess',
                     'metrics-edge':'met' };
  const p = prefixes[svc] || 'evt';
  return `${p}_${hex8().slice(0,3)}${(Math.random()>.5?'j':'k')}_${hex8().slice(0,2)}${Math.floor(Math.random()*9)}`;
};

function tsString(d) {
  const pad = n => String(n).padStart(2,'0');
  const y = d.getFullYear(), m = pad(d.getMonth()+1), day = pad(d.getDate());
  const h = pad(d.getHours()), mi = pad(d.getMinutes()), s = pad(d.getSeconds());
  const ms = String(d.getMilliseconds()).padStart(3,'0');
  return `${y}-${m}-${day} ${h}:${mi}:${s}.${ms}`;
}

function seedLogs(n = 6) {
  const out = [];
  const now = Date.now();
  for (let i = 0; i < n; i++) {
    const [lvl, svc, msg] = LOG_SEEDS[i % LOG_SEEDS.length];
    out.push({
      id: i, ts: new Date(now - i * 1200), level: lvl, svc, msg,
      cid: cid(svc),
    });
  }
  return out;
}

export function StatCard({ label, value, unit, footer, color = 'violet', iconBg }) {
  return (
    <div className="statcard">
      {iconBg && (
        <div className="statcard__icon-bg">
          <Icon name={iconBg} size={110} stroke={1} />
        </div>
      )}
      <div className="statcard__head">
        <span className="statcard__label">{label}</span>
      </div>
      <div className={`statcard__value statcard__value--${color}`}>
        {value}
        {unit && <span className="unit">{unit}</span>}
      </div>
      <div className="statcard__foot">{footer}</div>
    </div>
  );
}

export function LevelBadge({ level }) {
  return <span className={`lvlbadge lvl-${level.toLowerCase()}`}>{level}</span>;
}

function getToken() {
  return sessionStorage.getItem('fos_token') || '';
}

function apiLogsToRows(entries) {
  return entries.map(e => ({
    id: e.id,
    ts: new Date(e.timestamp),
    level: e.level,
    svc: e.serviceName || 'unknown',
    msg: e.message,
    cid: e.correlationId || '—',
  }));
}

export default function LogsView() {
  const [logs, setLogs] = useState(() => seedLogs(6));
  const [streaming, setStreaming] = useState(true);
  const [totalLogs, setTotalLogs] = useState(1284502);
  const [page, setPage] = useState(1);
  const [liveMode, setLiveMode] = useState(false); // true = backend connected

  // Initial fetch from backend
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch('/api/logs?page=0&size=25', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const rows = apiLogsToRows(data.content || []);
        if (rows.length > 0) { setLogs(rows); setLiveMode(true); }
        if (data.page?.totalElements) setTotalLogs(data.page.totalElements);
      })
      .catch(() => {});
  }, []);

  // Stats fetch
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch('/api/logs/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(stats => { if (stats?.total) setTotalLogs(stats.total); })
      .catch(() => {});
  }, []);

  // Live polling when backend is connected; seed animation when not
  useEffect(() => {
    if (!streaming) return;
    if (liveMode) {
      const token = getToken();
      const t = setInterval(() => {
        fetch('/api/logs?page=0&size=25', { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (!data) return;
            setLogs(apiLogsToRows(data.content || []).slice(0, 6));
            if (data.page?.totalElements) setTotalLogs(data.page.totalElements);
          })
          .catch(() => {});
      }, 5000);
      return () => clearInterval(t);
    } else {
      const t = setInterval(() => {
        const [lvl, svc, msg] = LOG_SEEDS[Math.floor(Math.random()*LOG_SEEDS.length)];
        const entry = { id: Date.now()+Math.random(), ts: new Date(), level: lvl, svc, msg, cid: cid(svc) };
        setLogs(prev => [entry, ...prev].slice(0, 6));
        setTotalLogs(c => c + 1 + Math.floor(Math.random()*4));
      }, 2200);
      return () => clearInterval(t);
    }
  }, [streaming, liveMode]);

  // Mini bar chart values for "Logs Volume (24h)"
  const volumes = [38, 60, 72, 88, 78, 110, 124, 96, 64, 92, 142, 128, 84]; // 00:00 → NOW
  const maxVol = Math.max(...volumes);
  const labels = ['00:00','','06:00','','','12:00','','','18:00','','','','NOW'];
  const hiIndex = 5; // highlight the bar at 12:00 (matches comp)

  return (
    <>
      <div className="pagehead">
        <h1><span className="lead">System Logs</span> &amp; Activity</h1>
        <p>Real-time stream of authentication and infrastructure events across all microservices.</p>
      </div>

      <div className="statgrid">
        <StatCard
          label="Total Logs Today"
          value={totalLogs.toLocaleString()}
          color="violet"
          footer={
            <>
              <Icon name="arrow-up-right" size={12} style={{ color: 'var(--tertiary-400)' }} />
              <span style={{ color: 'var(--tertiary-400)' }}>+12.5% from yesterday</span>
            </>
          }
          iconBg="line-chart"
        />
        <StatCard
          label="System Error Rate"
          value="0.042"
          unit="%"
          color="pink"
          footer={
            <>
              <Icon name="check" size={12} style={{ color: 'var(--secondary-400)' }} />
              <span style={{ color: 'var(--secondary-400)' }}>Within safety threshold</span>
            </>
          }
          iconBg="alert-octagon"
        />
        <StatCard
          label="Active Microservices"
          value="12 / 12"
          color="cyan"
          footer={
            <div className="dots" style={{ marginTop: 2 }}>
              {[0,1,2,3].map(i => <i key={i} className="active" style={{ background: 'var(--tertiary-400)', boxShadow: '0 0 6px var(--tertiary-400)' }} />)}
            </div>
          }
          iconBg="grid"
        />
      </div>

      <div className="filterbar">
        <div className="filterbar__filter-icon"><Icon name="sliders" size={16} /></div>
        <div className="filterbar__search">
          <Icon name="search" size={14} style={{ color: 'var(--fg-4)' }} />
          <input placeholder="Search logs by correlation ID, message, or service…" />
        </div>
        <button className="btn btn--secondary">All Levels <Icon name="chevron-down" size={12} /></button>
        <button className="btn btn--secondary"><Icon name="clock" size={14} /> Last 15m</button>
        <button className="btn btn--primary">Export</button>
      </div>

      <div className="logcard">
        <div className="logcard__head">
          <div className="logcard__title">Live Stream</div>
          <div className="logcard__head-right">
            <span className="connected-pill">
              <span className="dot" /> Real-time Connected
            </span>
            <button className="iconbtn" onClick={() => setStreaming(s => !s)} title={streaming ? 'Pause' : 'Resume'}>
              <Icon name={streaming ? 'pause' : 'play'} size={15} />
            </button>
          </div>
        </div>

        <div className="logtable">
          <div className="logtable__header">
            <div>Timestamp</div>
            <div>Level</div>
            <div>Service</div>
            <div>Message</div>
            <div>Correlation ID</div>
          </div>
          {logs.map(l => (
            <div key={l.id} className="logtable__row">
              <div className="logtable__ts">{tsString(l.ts)}</div>
              <div><LevelBadge level={l.level} /></div>
              <div className="logtable__svc">{l.svc}</div>
              <div>{l.msg}</div>
              <div className="logtable__cid">{l.cid}</div>
            </div>
          ))}
        </div>

        <div className="logcard__foot">
          <span>Showing 1-25 of {totalLogs.toLocaleString()} entries</span>
          <div className="pagination">
            <button className="pagebtn pagebtn--icon"><Icon name="chevron-left" size={14} /></button>
            {[1,2,3].map(n => (
              <button key={n}
                      className={`pagebtn ${n === page ? 'active' : ''}`}
                      onClick={() => setPage(n)}>{n}</button>
            ))}
            <button className="pagebtn pagebtn--icon"><Icon name="chevron-right" size={14} /></button>
          </div>
        </div>
      </div>

      <div className="row2">
        {/* Logs Volume (24h) */}
        <div className="chartcard">
          <div className="chartcard__head">
            <div>
              <div className="chartcard__title">Logs Volume (24h)</div>
            </div>
            <div className="chartcard__more"><Icon name="more-horizontal" size={16} /></div>
          </div>
          <div className="barchart-wrap">
            <div className="barchart">
              {volumes.map((v, i) => (
                <i key={i}
                   className={i === hiIndex ? 'hi' : ''}
                   style={{ height: `${(v / maxVol) * 100}%` }} />
              ))}
            </div>
            <div className="barchart-axis">
              {labels.map((l, i) => <span key={i}>{l}</span>)}
            </div>
          </div>
        </div>

        {/* Service Health Distribution */}
        <div className="chartcard">
          <div className="chartcard__head">
            <div>
              <div className="chartcard__title">Service Health Distribution</div>
            </div>
            <div className="chartcard__more"><Icon name="more-horizontal" size={16} /></div>
          </div>
          <div className="svchealth">
            {[
              ['Auth Service',  99.98, 'var(--tertiary-400)'],
              ['Ledger Engine', 100.0, 'var(--tertiary-400)'],
              ['API Gateway',   92.4,  'var(--secondary-400)'],
            ].map(([name, pct, color]) => (
              <div key={name} className="svchealth__row">
                <div className="svchealth__top">
                  <span className="svchealth__name">{name}</span>
                  <span className="svchealth__pct" style={{ color }}>{pct}%</span>
                </div>
                <div className="svchealth__bar">
                  <i style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn--outlined" style={{ width: '100%', marginTop: 18 }}>
            View Cluster Topology
          </button>
        </div>
      </div>
    </>
  );
}
