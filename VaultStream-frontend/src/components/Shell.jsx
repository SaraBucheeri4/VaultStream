// Shell.jsx — FINTECH_OS top nav +  sidebar

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "./Icon.jsx";

export function TopNav({ user, onSignOut }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const tabs = [
    { id: "overview", label: "Overview", path: "/analytics" },
    { id: "logs", label: "System Logs", path: "/logs" },
    { id: "security", label: "Security", path: "/security" },
  ];
  const activeTabId = tabs.find((t) => t.path === pathname)?.id;

  // close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    const t = setTimeout(() => window.addEventListener("click", close), 0);
    return () => {
      clearTimeout(t);
      window.removeEventListener("click", close);
    };
  }, [menuOpen]);

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

      <button className="iconbtn" title="Notifications">
        <Icon name="bell" size={15} />
        <span className="dot" />
      </button>

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
    { path: "/command", icon: "grid", label: "Command" },
    { path: "/analytics", icon: "line-chart", label: "Analytics" },
    { path: "/asset-registry", icon: "wallet", label: "Assets" },
    { path: "/logs", icon: "database", label: "Logs" },
    { path: "/security", icon: "shield-check", label: "Security" },
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

      <button className="sidebar__cta">DEPLOY NODE</button>

      <div className="sidebar__foot">
        <div className="sidebar__footitem">
          <Icon name="help-circle" size={16} /> Support
        </div>
        <div className="sidebar__footitem">
          <Icon name="code" size={16} /> API
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
