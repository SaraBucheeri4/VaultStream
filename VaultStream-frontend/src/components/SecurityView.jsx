import React, { useState, useEffect } from 'react';
import { Icon } from './Icon.jsx';
import { StatCard, LevelBadge } from './LogsView.jsx';

const SESSIONS = [
  { id: 's-7a2f', user: 'admin@vaultstream.io', role: 'ADMIN',    ip: '192.168.1.42',   location: 'New York, US',    device: 'Chrome / macOS',   started: '22 min ago', current: true  },
  { id: 's-3b9e', user: 'ops@vaultstream.io',   role: 'OPERATOR', ip: '10.0.4.88',      location: 'London, UK',      device: 'Firefox / Ubuntu', started: '1 h ago',    current: false },
  { id: 's-c411', user: 'audit@vaultstream.io', role: 'VIEWER',   ip: '203.0.113.55',   location: 'Singapore, SG',   device: 'Edge / Windows',   started: '2 h ago',    current: false },
  { id: 's-d820', user: 'dev@vaultstream.io',   role: 'DEV',      ip: '172.16.0.22',    location: 'Berlin, DE',      device: 'Safari / macOS',   started: '4 h ago',    current: false },
];

const AUDIT_SEEDS = [
  { level: 'INFO',  user: 'admin@vaultstream.io',  action: 'AUTH_LOGIN',         resource: '/auth/login',              result: 'SUCCESS' },
  { level: 'WARN',  user: 'ops@vaultstream.io',    action: 'PERM_ESCALATION',    resource: '/admin/keys',              result: 'DENIED'  },
  { level: 'INFO',  user: 'admin@vaultstream.io',  action: 'KEY_ROTATE',         resource: '/api/keys/ledger-core',    result: 'SUCCESS' },
  { level: 'ERROR', user: 'unknown',               action: 'AUTH_FAIL',          resource: '/auth/login',              result: 'BLOCKED' },
  { level: 'INFO',  user: 'audit@vaultstream.io',  action: 'EXPORT_AUDIT',       resource: '/audit/export',            result: 'SUCCESS' },
  { level: 'WARN',  user: 'dev@vaultstream.io',    action: 'CONFIG_CHANGE',      resource: '/config/feature-flags',   result: 'PENDING' },
  { level: 'ERROR', user: 'unknown',               action: 'BRUTE_FORCE',        resource: '/auth/login',              result: 'BLOCKED' },
  { level: 'INFO',  user: 'admin@vaultstream.io',  action: 'SNAPSHOT_TRIGGER',   resource: '/ops/snapshot',            result: 'SUCCESS' },
];

const POLICIES = [
  { id: 'pol-001', name: 'MFA Enforcement',         scope: 'All users',           status: 'enforced', updated: '3 d ago' },
  { id: 'pol-002', name: 'IP Allowlist',            scope: 'Admin role only',     status: 'enforced', updated: '1 w ago' },
  { id: 'pol-003', name: 'Session Timeout (30m)',   scope: 'All users',           status: 'enforced', updated: '2 w ago' },
  { id: 'pol-004', name: 'Read-only after 22:00',   scope: 'DEV role',            status: 'draft',    updated: '1 d ago' },
  { id: 'pol-005', name: 'Export Approval Gate',    scope: 'VIEWER role',         status: 'enforced', updated: '5 d ago' },
];

const ROLE_COLORS = {
  ADMIN:    'var(--primary-400)',
  OPERATOR: 'var(--tertiary-400)',
  VIEWER:   'var(--secondary-400)',
  DEV:      'var(--status-warn)',
};

const RESULT_CFG = {
  SUCCESS: { cls: 'status-success',   label: 'SUCCESS' },
  DENIED:  { cls: 'status-throttled', label: 'DENIED'  },
  BLOCKED: { cls: 'status-critical',  label: 'BLOCKED' },
  PENDING: { cls: 'status-throttled', label: 'PENDING' },
};

function tsNow() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function ResultPill({ result }) {
  const cfg = RESULT_CFG[result] || { cls: '', label: result };
  return <span className={`statuspill ${cfg.cls}`}>{cfg.label}</span>;
}

function RoleBadge({ role }) {
  const color = ROLE_COLORS[role] || 'var(--fg-3)';
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 5, font: '700 10px var(--font-mono)',
      letterSpacing: '0.08em', background: `${color}18`, color,
    }}>{role}</span>
  );
}

export default function SecurityView() {
  const [auditLog, setAuditLog] = useState(() =>
    AUDIT_SEEDS.slice(0, 6).map((e, i) => ({ ...e, id: i, ts: tsNow() }))
  );
  const [sessions, setSessions] = useState(SESSIONS);
  const [terminatingId, setTerminatingId] = useState(null);
  const [failedLogins] = useState(14);

  useEffect(() => {
    const t = setInterval(() => {
      const seed = AUDIT_SEEDS[Math.floor(Math.random() * AUDIT_SEEDS.length)];
      setAuditLog(prev => [{ ...seed, id: Date.now(), ts: tsNow() }, ...prev].slice(0, 30));
    }, 3800);
    return () => clearInterval(t);
  }, []);

  const terminate = (id) => {
    setTerminatingId(id);
    setTimeout(() => {
      setSessions(prev => prev.filter(s => s.id !== id));
      setTerminatingId(null);
    }, 900);
  };

  return (
    <>
      <div className="pagehead">
        <h1><span className="lead">Security</span> &amp; Access</h1>
        <p>Live session monitoring, audit trail, and policy enforcement for all operator and system access events.</p>
      </div>

      {/* Stat cards */}
      <div className="statgrid">
        <StatCard
          label="Active Sessions"
          value={sessions.length}
          color="cyan"
          footer={<><Icon name="users-round" size={12} style={{ color: 'var(--tertiary-400)' }} /><span style={{ color: 'var(--tertiary-400)' }}>across {sessions.length} roles</span></>}
          iconBg="users-round"
        />
        <StatCard
          label="Failed Logins (24h)"
          value={failedLogins}
          color="pink"
          footer={<><Icon name="alert-triangle" size={12} style={{ color: 'var(--status-error)' }} /><span style={{ color: 'var(--status-error)' }}>2 blocked IPs</span></>}
          iconBg="shield-check"
        />
        <StatCard
          label="Policies Active"
          value={POLICIES.filter(p => p.status === 'enforced').length}
          color="violet"
          footer={<><Icon name="check" size={12} style={{ color: 'var(--tertiary-400)' }} /><span style={{ color: 'var(--tertiary-400)' }}>of {POLICIES.length} configured</span></>}
          iconBg="lock"
        />
      </div>

      {/* Active sessions */}
      <div className="logcard" style={{ marginBottom: 24 }}>
        <div className="logcard__head">
          <div className="logcard__title">Active Sessions</div>
          <span className="connected-pill"><span className="dot" /> Live</span>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 90px 140px 160px 120px 80px',
          borderTop: '1px solid var(--line-1)',
        }}>
          {['User', 'Role', 'IP Address', 'Location · Device', 'Started', ''].map(h => (
            <div key={h} style={{
              padding: '12px 20px', font: '500 11px var(--font-body)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              color: 'var(--fg-3)', background: 'rgba(255,255,255,0.02)',
            }}>{h}</div>
          ))}
          {sessions.map(s => (
            <React.Fragment key={s.id}>
              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--line-1)', display: 'flex', alignItems: 'center', gap: 10 }}>
                {s.current && <span style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--tertiary-400)', boxShadow: '0 0 6px var(--tertiary-400)', flexShrink: 0 }} />}
                <div>
                  <div style={{ font: '600 13px var(--font-body)', color: 'var(--fg-1)' }}>{s.user}</div>
                  {s.current && <div style={{ font: '11px var(--font-body)', color: 'var(--tertiary-400)', marginTop: 2 }}>This session</div>}
                </div>
              </div>
              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--line-1)', display: 'flex', alignItems: 'center' }}><RoleBadge role={s.role} /></div>
              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--line-1)', display: 'flex', alignItems: 'center', font: '12.5px var(--font-mono)', color: 'var(--fg-2)' }}>{s.ip}</div>
              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--line-1)', display: 'flex', alignItems: 'center' }}>
                <div>
                  <div style={{ font: '13px var(--font-body)', color: 'var(--fg-1)' }}>{s.location}</div>
                  <div style={{ font: '11.5px var(--font-body)', color: 'var(--fg-4)', marginTop: 2 }}>{s.device}</div>
                </div>
              </div>
              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--line-1)', display: 'flex', alignItems: 'center', font: '13px var(--font-body)', color: 'var(--fg-3)' }}>{s.started}</div>
              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--line-1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {!s.current && (
                  <button
                    className="btn btn--sm"
                    style={{ background: 'rgba(244,63,94,0.1)', color: 'var(--status-error)', border: '1px solid rgba(244,63,94,0.22)', cursor: terminatingId === s.id ? 'wait' : 'pointer' }}
                    onClick={() => terminate(s.id)}
                    disabled={!!terminatingId}
                  >
                    {terminatingId === s.id ? '…' : 'Terminate'}
                  </button>
                )}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Audit log + Policies side-by-side */}
      <div className="row2">
        {/* Live audit log */}
        <div className="logcard" style={{ marginBottom: 0 }}>
          <div className="logcard__head">
            <div className="logcard__title">Audit Trail</div>
            <span className="connected-pill"><span className="dot" /> Streaming</span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '60px 1fr 90px 80px',
            borderTop: '1px solid var(--line-1)',
          }}>
            {['Lvl', 'Action · Resource', 'Actor', 'Result'].map(h => (
              <div key={h} style={{
                padding: '10px 16px', font: '500 10.5px var(--font-body)',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                color: 'var(--fg-3)', background: 'rgba(255,255,255,0.02)',
              }}>{h}</div>
            ))}
            {auditLog.slice(0, 8).map(e => (
              <React.Fragment key={e.id}>
                <div style={{ padding: '11px 16px', borderTop: '1px solid var(--line-1)', display: 'flex', alignItems: 'center' }}><LevelBadge level={e.level} /></div>
                <div style={{ padding: '11px 16px', borderTop: '1px solid var(--line-1)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ font: '600 12.5px var(--font-mono)', color: 'var(--fg-1)' }}>{e.action}</div>
                  <div style={{ font: '11px var(--font-body)', color: 'var(--fg-4)', marginTop: 2 }}>{e.resource} · {e.ts}</div>
                </div>
                <div style={{ padding: '11px 16px', borderTop: '1px solid var(--line-1)', display: 'flex', alignItems: 'center', font: '11.5px var(--font-body)', color: 'var(--fg-3)' }}>
                  {e.user.split('@')[0]}
                </div>
                <div style={{ padding: '11px 16px', borderTop: '1px solid var(--line-1)', display: 'flex', alignItems: 'center' }}><ResultPill result={e.result} /></div>
              </React.Fragment>
            ))}
          </div>
          <div className="logcard__foot">
            <span>Showing latest 8 events</span>
            <button className="btn btn--sm btn--outlined"><Icon name="download" size={12} /> Export Full Log</button>
          </div>
        </div>

        {/* Policies */}
        <div className="chartcard">
          <div className="chartcard__head">
            <div>
              <div className="chartcard__title">Access Policies</div>
              <div className="chartcard__subtitle">Enforced and draft security rules.</div>
            </div>
            <button className="btn btn--sm btn--primary"><Icon name="plus" size={12} /> New Policy</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {POLICIES.map((p, i) => (
              <div key={p.id} style={{
                display: 'grid', gridTemplateColumns: '1fr auto',
                gap: 12, padding: '13px 4px',
                borderTop: i === 0 ? 'none' : '1px solid var(--line-1)',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ font: '600 13.5px var(--font-body)', color: 'var(--fg-1)', marginBottom: 3 }}>{p.name}</div>
                  <div style={{ font: '11.5px var(--font-body)', color: 'var(--fg-4)' }}>
                    {p.scope} &nbsp;·&nbsp; updated {p.updated}
                  </div>
                </div>
                <span className={`statuspill ${p.status === 'enforced' ? 'status-success' : 'status-throttled'}`}>
                  {p.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
          <button className="btn btn--outlined" style={{ width: '100%', marginTop: 18 }}>
            View All Policies
          </button>
        </div>
      </div>
    </>
  );
}
