import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon.jsx';
import { StatCard, LevelBadge } from './LogsView.jsx';

const QUICK_ACTIONS = [
  { id: 'flush-cache',      label: 'Flush Cache',        icon: 'trash-2',      color: 'var(--secondary-400)', desc: 'Clear all in-memory caches across nodes' },
  { id: 'rotate-keys',      label: 'Rotate API Keys',    icon: 'key-round',    color: 'var(--primary-400)',   desc: 'Issue new API keys and revoke old ones' },
  { id: 'pause-ingestion',  label: 'Pause Ingestion',    icon: 'pause',        color: 'var(--status-warn)',   desc: 'Halt all inbound data pipelines' },
  { id: 'snapshot',         label: 'Trigger Snapshot',   icon: 'database',     color: 'var(--tertiary-400)', desc: 'Create a full state snapshot immediately' },
  { id: 'restart-svc',      label: 'Restart Service',    icon: 'refresh-cw',   color: 'var(--primary-300)',   desc: 'Gracefully restart a selected microservice' },
  { id: 'export-audit',     label: 'Export Audit Log',   icon: 'download',     color: 'var(--tertiary-400)', desc: 'Download full audit trail as CSV' },
];

const CRON_JOBS = [
  { id: 'cj-001', name: 'Ledger Reconciliation',   schedule: '0 2 * * *',   next: '02:00 UTC',   status: 'active',   lastRun: '2 h ago',  duration: '4m 12s' },
  { id: 'cj-002', name: 'KYC Batch Processor',     schedule: '0 */6 * * *', next: '06:00 UTC',   status: 'active',   lastRun: '6 h ago',  duration: '9m 04s' },
  { id: 'cj-003', name: 'Notification Digest',     schedule: '*/15 * * * *',next: 'in 7 min',    status: 'active',   lastRun: '8 min ago',duration: '0m 22s' },
  { id: 'cj-004', name: 'DB Index Maintenance',    schedule: '0 4 * * 0',   next: 'Sun 04:00',   status: 'paused',   lastRun: '7 d ago',  duration: '11m 38s' },
  { id: 'cj-005', name: 'Cache Warmup',            schedule: '0 * * * *',   next: 'in 32 min',   status: 'active',   lastRun: '28 min ago',duration: '0m 41s' },
];

const EVENT_SEEDS = [
  { level: 'INFO',  msg: 'snapshot.triggered by operator@vaultstream — target: primary-us-east-1' },
  { level: 'INFO',  msg: 'cache.flush completed — 2.1 GB freed across 3 nodes' },
  { level: 'WARN',  msg: 'rotate-keys: ledger-core service restarting to pick up new credentials' },
  { level: 'INFO',  msg: 'ingestion.resumed — pipeline lag: 0ms' },
  { level: 'INFO',  msg: 'cron.run: ledger-reconciliation finished in 4m 12s' },
  { level: 'ERROR', msg: 'restart-svc: notification-svc failed health check on attempt 1/3' },
  { level: 'INFO',  msg: 'export.audit: 1,284,502 entries packaged — download link issued' },
  { level: 'WARN',  msg: 'ingestion.paused — queue depth: 8,241 events pending' },
];

function tsNow() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function StatusPill({ status }) {
  const cfg = {
    active: { cls: 'status-success', label: 'ACTIVE' },
    paused: { cls: 'status-throttled', label: 'PAUSED' },
    failed: { cls: 'status-critical', label: 'FAILED' },
  }[status] || { cls: '', label: status.toUpperCase() };
  return <span className={`statuspill ${cfg.cls}`}>{cfg.label}</span>;
}

export default function CommandView() {
  const [events, setEvents] = useState(() =>
    EVENT_SEEDS.slice(0, 5).map((e, i) => ({
      ...e, id: i, ts: tsNow(),
    }))
  );
  const [firing, setFiring] = useState(null);
  const [jobs, setJobs] = useState(CRON_JOBS);
  const bottomRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => {
      const seed = EVENT_SEEDS[Math.floor(Math.random() * EVENT_SEEDS.length)];
      setEvents(prev => [{ ...seed, id: Date.now(), ts: tsNow() }, ...prev].slice(0, 20));
    }, 4500);
    return () => clearInterval(t);
  }, []);

  const fire = (action) => {
    setFiring(action.id);
    setTimeout(() => {
      setFiring(null);
      const seed = EVENT_SEEDS[Math.floor(Math.random() * EVENT_SEEDS.length)];
      setEvents(prev => [{ ...seed, id: Date.now(), ts: tsNow() }, ...prev].slice(0, 20));
    }, 1200);
  };

  const toggleJob = (id) => {
    setJobs(prev => prev.map(j =>
      j.id === id ? { ...j, status: j.status === 'active' ? 'paused' : 'active' } : j
    ));
  };

  return (
    <>
      <div className="pagehead">
        <h1><span className="lead">Command</span> Center</h1>
        <p>Operator control surface — trigger system actions, manage scheduled jobs, and monitor the live event stream.</p>
      </div>

      {/* Stat cards */}
      <div className="statgrid">
        <StatCard
          label="Active Cron Jobs"
          value={jobs.filter(j => j.status === 'active').length}
          color="cyan"
          footer={<><Icon name="clock" size={12} style={{ color: 'var(--tertiary-400)' }} /><span style={{ color: 'var(--tertiary-400)' }}>of {jobs.length} scheduled</span></>}
          iconBg="clock"
        />
        <StatCard
          label="Commands Executed"
          value="1,048"
          color="violet"
          footer={<><Icon name="arrow-up-right" size={12} style={{ color: 'var(--tertiary-400)' }} /><span style={{ color: 'var(--tertiary-400)' }}>+8 in last hour</span></>}
          iconBg="terminal"
        />
        <StatCard
          label="Last Action"
          value="4m"
          unit="ago"
          color="pink"
          footer={<><Icon name="zap" size={12} style={{ color: 'var(--secondary-400)' }} /><span style={{ color: 'var(--secondary-400)' }}>cache.flush by admin</span></>}
          iconBg="activity"
        />
      </div>

      {/* Quick actions */}
      <div className="chartcard" style={{ marginBottom: 24 }}>
        <div className="chartcard__head">
          <div>
            <div className="chartcard__title">Quick Actions</div>
            <div className="chartcard__subtitle">One-click operator commands — all actions are logged to audit trail.</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {QUICK_ACTIONS.map(a => (
            <button
              key={a.id}
              onClick={() => fire(a)}
              disabled={!!firing}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 14,
                padding: '16px 18px', borderRadius: 12,
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${firing === a.id ? a.color : 'rgba(255,255,255,0.07)'}`,
                color: 'var(--fg-1)', cursor: firing ? 'wait' : 'pointer',
                textAlign: 'left', transition: 'all 0.18s ease',
                boxShadow: firing === a.id ? `0 0 18px -6px ${a.color}55` : 'none',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                background: `${a.color}18`,
                border: `1px solid ${a.color}33`,
                display: 'grid', placeItems: 'center', color: a.color,
              }}>
                <Icon name={firing === a.id ? 'loader' : a.icon} size={17} />
              </div>
              <div>
                <div style={{ font: '600 13.5px var(--font-body)', marginBottom: 4 }}>{a.label}</div>
                <div style={{ font: '400 12px var(--font-body)', color: 'var(--fg-4)', lineHeight: 1.4 }}>{a.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cron jobs + event stream */}
      <div className="row2">
        {/* Scheduled jobs */}
        <div className="chartcard">
          <div className="chartcard__head">
            <div>
              <div className="chartcard__title">Scheduled Jobs</div>
              <div className="chartcard__subtitle">Cron tasks — click to pause / resume.</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {jobs.map((j, i) => (
              <div key={j.id} style={{
                display: 'grid', gridTemplateColumns: '1fr auto auto',
                alignItems: 'center', gap: 16, padding: '13px 4px',
                borderTop: i === 0 ? 'none' : '1px solid var(--line-1)',
              }}>
                <div>
                  <div style={{ font: '600 13.5px var(--font-body)', color: 'var(--fg-1)', marginBottom: 3 }}>{j.name}</div>
                  <div style={{ font: '400 11.5px var(--font-mono)', color: 'var(--fg-4)' }}>
                    {j.schedule} &nbsp;·&nbsp; next: {j.next} &nbsp;·&nbsp; last {j.lastRun} ({j.duration})
                  </div>
                </div>
                <StatusPill status={j.status} />
                <button
                  className="iconbtn"
                  title={j.status === 'active' ? 'Pause' : 'Resume'}
                  onClick={() => toggleJob(j.id)}
                  style={{ width: 30, height: 30 }}
                >
                  <Icon name={j.status === 'active' ? 'pause' : 'play'} size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Live event stream */}
        <div className="logcard" style={{ marginBottom: 0 }}>
          <div className="logcard__head">
            <div className="logcard__title">Event Stream</div>
            <span className="connected-pill"><span className="dot" /> Live</span>
          </div>
          <div style={{ padding: '0 0 8px', maxHeight: 340, overflowY: 'auto' }} className="scroll-hide">
            {events.map(e => (
              <div key={e.id} style={{
                display: 'grid', gridTemplateColumns: '80px 1fr',
                gap: 12, padding: '10px 22px',
                borderTop: '1px solid var(--line-1)',
                alignItems: 'flex-start',
              }}>
                <LevelBadge level={e.level} />
                <div>
                  <div style={{ font: '400 12.5px var(--font-body)', color: 'var(--fg-1)', lineHeight: 1.5 }}>{e.msg}</div>
                  <div style={{ font: '11px var(--font-mono)', color: 'var(--fg-4)', marginTop: 3 }}>{e.ts}</div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>
    </>
  );
}
