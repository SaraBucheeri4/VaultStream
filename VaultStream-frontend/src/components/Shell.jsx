// Shell.jsx — FINTECH_OS top nav +  sidebar

import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "./Icon.jsx";

function useAlerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const token = sessionStorage.getItem('fos_token') || '';
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    async function check() {
      const found = [];
      try {
        const [metricsRes, statsRes] = await Promise.all([
          fetch('/api/metrics/summary', { headers }),
          fetch('/api/logs/stats',      { headers }),
        ]);
        const metrics = metricsRes.ok ? await metricsRes.json() : null;
        const stats   = statsRes.ok   ? await statsRes.json()   : null;

        if (metrics) {
          const { statCards, nodes, serviceHealth } = metrics;

          if (statCards?.errorRate > 1)
            found.push({ id: 'err-rate', level: 'error',
              title: 'High Error Rate',
              body: `${statCards.errorRate.toFixed(2)}% of requests are failing — investigate immediately.` });

          if (statCards?.avgLatencyMs > 500)
            found.push({ id: 'latency', level: 'warn',
              title: 'Elevated Latency',
              body: `Avg response time is ${statCards.avgLatencyMs.toFixed(0)} ms (threshold: 500 ms).` });

          (nodes || []).forEach(n => {
            if (n.cpuPct > 85)
              found.push({ id: `cpu-${n.region}`, level: 'error',
                title: `CPU Critical — ${n.region}`,
                body: `${n.region} CPU at ${n.cpuPct.toFixed(1)}%. Risk of service degradation.` });
            else if (n.cpuPct > 70)
              found.push({ id: `cpu-warn-${n.region}`, level: 'warn',
                title: `CPU Elevated — ${n.region}`,
                body: `${n.region} CPU at ${n.cpuPct.toFixed(1)}%.` });

            const heapPct = n.heapMaxMb > 0 ? (n.heapUsedMb / n.heapMaxMb) * 100 : 0;
            if (heapPct > 85)
              found.push({ id: `heap-${n.region}`, level: 'error',
                title: `Heap Pressure — ${n.region}`,
                body: `Heap at ${heapPct.toFixed(1)}% (${n.heapUsedMb}/${n.heapMaxMb} MB). OOM risk.` });
          });

          (serviceHealth || []).forEach(s => {
            if (s.pct < 90)
              found.push({ id: `svc-${s.name}`, level: 'error',
                title: `Service Degraded — ${s.name}`,
                body: `${s.name} uptime at ${s.pct.toFixed(2)}%. Needs immediate attention.` });
            else if (s.pct < 99)
              found.push({ id: `svc-warn-${s.name}`, level: 'warn',
                title: `Service Degraded — ${s.name}`,
                body: `${s.name} uptime at ${s.pct.toFixed(2)}%.` });
          });
        }

        if (stats) {
          const errorCount = stats.errorCount ?? stats.byLevel?.ERROR ?? 0;
          const total      = stats.total ?? 0;
          if (errorCount > 0 && total > 0) {
            const pct = (errorCount / total * 100).toFixed(2);
            found.push({ id: 'log-errors', level: errorCount > 50 ? 'error' : 'warn',
              title: `${errorCount} ERROR Log${errorCount > 1 ? 's' : ''}`,
              body: `${pct}% of log entries are errors. Review the System Logs for details.` });
          }
        }
      } catch (_) { /* API unavailable — no alerts */ }

      setAlerts(found);
    }

    check();
    const t = setInterval(check, 30_000);
    return () => clearInterval(t);
  }, []);

  return alerts;
}

export function TopNav({ user, onSignOut }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const alerts = useAlerts();
  const hasError = alerts.some(a => a.level === 'error');
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const tabs = [
    { id: "overview", label: "Overview", path: "/analytics" },
    { id: "logs", label: "System Logs", path: "/logs" },
  ];
  const activeTabId = tabs.find((t) => t.path === pathname)?.id;

  // close menus on outside click
  useEffect(() => {
    if (!menuOpen && !notifOpen) return;
    const close = () => { setMenuOpen(false); setNotifOpen(false); };
    const t = setTimeout(() => window.addEventListener("click", close), 0);
    return () => {
      clearTimeout(t);
      window.removeEventListener("click", close);
    };
  }, [menuOpen, notifOpen]);

  return (
    <header className="topnav">
      <div className="topnav__brand">
        <img src="/assets/logo.png" alt="Vault Stash" style={{ height: 36, width: "auto" }} />
        Vault Stash
      </div>

      <nav className="topnav__tabs">
        {tabs.map((t) => (
          <span
            key={t.id}
            className={`topnav__tab ${activeTabId === t.id ? "active" : ""}`}
            onClick={() => navigate(t.path)}
          >
            {t.label}
          </span>
        ))}
      </nav>

      <div className="topnav__spacer" />

      <label className="topnav__search">
        <Icon name="search" size={13} />
        <input placeholder="Search" />
      </label>

      <span className="adminpill">
        <span className="d" /> ADMIN
      </span>

      <div style={{ position: 'relative' }} ref={notifRef} onClick={e => e.stopPropagation()}>
        <button
          className="iconbtn"
          title="Notifications"
          onClick={() => { setNotifOpen(o => !o); setMenuOpen(false); }}
        >
          <Icon name="bell" size={15} />
          {alerts.length > 0 && (
            <span className="dot" style={hasError ? { background: 'var(--status-error)', boxShadow: '0 0 6px var(--status-error)' } : {}} />
          )}
        </button>

        {notifOpen && (
          <div className="notif-panel">
            <div className="notif-panel__head">
              <span className="notif-panel__title">Alerts</span>
              <span className="notif-panel__count">{alerts.length} active</span>
            </div>
            {alerts.length === 0 ? (
              <div className="notif-panel__empty">
                <Icon name="check-circle" size={20} />
                All systems operational
              </div>
            ) : (
              <div className="notif-panel__list">
                {alerts.map(a => (
                  <div key={a.id} className={`notif-item notif-item--${a.level}`}>
                    <Icon name={a.level === 'error' ? 'alert-octagon' : 'alert-triangle'} size={14} />
                    <div>
                      <div className="notif-item__title">{a.title}</div>
                      <div className="notif-item__body">{a.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div
        className="avatar"
        title={user?.email || "Operator"}
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((o) => !o);
        }}
      />

      {menuOpen && (
        <div className="usermenu" onClick={(e) => e.stopPropagation()}>
          <div className="usermenu__head">
            <div className="usermenu__name">
              {user?.email?.split("@")[0]?.replace(".", " ") || "Operator"}
            </div>
            <div className="usermenu__email">
              {user?.email || "operator@fintech.os"}
            </div>
            <div className="usermenu__role">
              <Icon name="shield-check" size={10} /> ADMIN
            </div>
          </div>
          <div className="usermenu__item">
            <Icon name="settings" size={15} /> Account settings
          </div>
          <div className="usermenu__item">
            <Icon name="key-round" size={15} /> Rotate credentials
          </div>
          <div className="usermenu__item">
            <Icon name="eye" size={15} /> Active sessions · 1
          </div>
          <div className="divider" style={{ margin: "6px 4px" }} />
          <div
            className="usermenu__item usermenu__item--danger"
            onClick={onSignOut}
          >
            <Icon name="log-out" size={15} /> Sign out
          </div>
        </div>
      )}
    </header>
  );
}

export function Sidebar({ activeNodes = 12, onSignOut }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const items = [
    { path: "/analytics", icon: "line-chart", label: "Analytics" },
    { path: "/logs", icon: "database", label: "Logs" },
  ];

  return (
    <aside className="sidebar scroll-hide">
      <div className="sidebar__head">
      </div>

      <div className="sidebar__nav">
        {items.map((it) => (
          <div
            key={it.path}
            className={`navitem ${pathname === it.path ? "active" : ""}`}
            onClick={() => navigate(it.path)}
          >
            <Icon name={it.icon} size={18} />
            <span>{it.label}</span>
          </div>
        ))}
      </div>

      <div className="sidebar__spacer" />

      <div className="sidebar__foot">
        <div className="sidebar__footitem">
          <Icon name="help-circle" size={16} /> Support
        </div>
        {onSignOut && (
          <div className="sidebar__footitem sidebar__footitem--danger" onClick={onSignOut} style={{ cursor: "pointer" }}>
            <Icon name="log-out" size={16} /> Sign out
          </div>
        )}
      </div>
    </aside>
  );
}
