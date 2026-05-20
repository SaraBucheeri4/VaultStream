import React, { useState } from 'react';
import { Icon } from './Icon.jsx';
import { StatCard } from './LogsView.jsx';

const ASSET_TYPES = ['All', 'Fiat', 'Crypto', 'Equity', 'Bond'];

const ASSETS = [
  { id: 'ast-0001', name: 'US Dollar Reserve',    type: 'Fiat',   ticker: 'USD',  value: 48_200_000, change: +0.00,  status: 'active',   custodian: 'JPMorgan Chase',  updated: '2 min ago' },
  { id: 'ast-0002', name: 'Bitcoin Holdings',     type: 'Crypto', ticker: 'BTC',  value: 12_840_000, change: +3.42,  status: 'active',   custodian: 'Coinbase Prime',  updated: '1 min ago' },
  { id: 'ast-0003', name: 'Ethereum Vault',       type: 'Crypto', ticker: 'ETH',  value:  5_340_000, change: -1.18,  status: 'active',   custodian: 'Coinbase Prime',  updated: '1 min ago' },
  { id: 'ast-0004', name: 'Euro Liquidity Pool',  type: 'Fiat',   ticker: 'EUR',  value:  9_100_000, change: -0.22,  status: 'active',   custodian: 'Deutsche Bank',   updated: '5 min ago' },
  { id: 'ast-0005', name: 'S&P 500 ETF',          type: 'Equity', ticker: 'SPY',  value:  3_600_000, change: +0.87,  status: 'active',   custodian: 'Fidelity',        updated: '10 min ago' },
  { id: 'ast-0006', name: 'US Treasury 10Y',      type: 'Bond',   ticker: 'T10Y', value:  7_250_000, change: +0.04,  status: 'active',   custodian: 'BNY Mellon',      updated: '30 min ago' },
  { id: 'ast-0007', name: 'GBP Reserve',          type: 'Fiat',   ticker: 'GBP',  value:  2_900_000, change: -0.35,  status: 'flagged',  custodian: 'Barclays',        updated: '1 h ago' },
  { id: 'ast-0008', name: 'Solana Position',      type: 'Crypto', ticker: 'SOL',  value:    820_000, change: +5.60,  status: 'active',   custodian: 'Fireblocks',      updated: '3 min ago' },
  { id: 'ast-0009', name: 'NVIDIA Equity Block',  type: 'Equity', ticker: 'NVDA', value:  1_440_000, change: +2.14,  status: 'active',   custodian: 'Fidelity',        updated: '15 min ago' },
  { id: 'ast-0010', name: 'Corporate Bond Pkg',   type: 'Bond',   ticker: 'CBP',  value:  4_100_000, change: +0.12,  status: 'frozen',   custodian: 'BNY Mellon',      updated: '2 h ago' },
];

const TYPE_COLORS = {
  Fiat:   'var(--tertiary-400)',
  Crypto: 'var(--primary-400)',
  Equity: 'var(--secondary-400)',
  Bond:   'var(--status-warn)',
};

const STATUS_CFG = {
  active:  { cls: 'status-success',   label: 'ACTIVE'  },
  flagged: { cls: 'status-throttled', label: 'FLAGGED' },
  frozen:  { cls: 'status-critical',  label: 'FROZEN'  },
};

function fmtUSD(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n}`;
}

function TypeBadge({ type }) {
  const color = TYPE_COLORS[type] || 'var(--fg-3)';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 6,
      background: `${color}18`, color,
      font: '600 10.5px var(--font-mono)', letterSpacing: '0.07em',
    }}>
      {type.toUpperCase()}
    </span>
  );
}

function StatusPill({ status }) {
  const cfg = STATUS_CFG[status] || { cls: '', label: status.toUpperCase() };
  return <span className={`statuspill ${cfg.cls}`}>{cfg.label}</span>;
}

export default function AssetsView() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const totalValue = ASSETS.reduce((s, a) => s + a.value, 0);
  const activeCount = ASSETS.filter(a => a.status === 'active').length;
  const flaggedCount = ASSETS.filter(a => a.status !== 'active').length;

  const visible = ASSETS.filter(a => {
    const matchType = filter === 'All' || a.type === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || a.name.toLowerCase().includes(q) || a.ticker.toLowerCase().includes(q) || a.custodian.toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  const alloc = ASSET_TYPES.slice(1).map(t => {
    const sum = ASSETS.filter(a => a.type === t).reduce((s, a) => s + a.value, 0);
    return { type: t, pct: (sum / totalValue) * 100, color: TYPE_COLORS[t] };
  });

  return (
    <>
      <div className="pagehead">
        <h1><span className="lead">Asset</span> Registry</h1>
        <p>Managed vault holdings — real-time values, custodian assignments, and compliance status across all asset classes.</p>
      </div>

      {/* Stat cards */}
      <div className="statgrid">
        <StatCard
          label="Total AUM"
          value={fmtUSD(totalValue)}
          color="violet"
          footer={<><Icon name="arrow-up-right" size={12} style={{ color: 'var(--tertiary-400)' }} /><span style={{ color: 'var(--tertiary-400)' }}>+1.4% today</span></>}
          iconBg="wallet"
        />
        <StatCard
          label="Active Assets"
          value={activeCount}
          color="cyan"
          footer={<><Icon name="check" size={12} style={{ color: 'var(--tertiary-400)' }} /><span style={{ color: 'var(--tertiary-400)' }}>of {ASSETS.length} total</span></>}
          iconBg="box"
        />
        <StatCard
          label="Flagged / Frozen"
          value={flaggedCount}
          color="pink"
          footer={<><Icon name="alert-triangle" size={12} style={{ color: 'var(--status-error)' }} /><span style={{ color: 'var(--status-error)' }}>requires review</span></>}
          iconBg="alert-octagon"
        />
      </div>

      {/* Filter bar */}
      <div className="filterbar">
        <div className="filterbar__filter-icon"><Icon name="sliders" size={16} /></div>
        <div className="filterbar__search">
          <Icon name="search" size={14} style={{ color: 'var(--fg-4)' }} />
          <input
            placeholder="Search by name, ticker, or custodian…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        {ASSET_TYPES.map(t => (
          <button
            key={t}
            className={`btn btn--sm ${filter === t ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => { setFilter(t); setPage(1); }}
          >
            {t}
          </button>
        ))}
        <button className="btn btn--primary btn--sm"><Icon name="download" size={13} /> Export</button>
      </div>

      {/* Asset table */}
      <div className="logcard" style={{ marginBottom: 24 }}>
        <div className="logcard__head">
          <div className="logcard__title">Holdings</div>
          <span style={{ font: '500 12px var(--font-body)', color: 'var(--fg-4)' }}>{visible.length} assets</span>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '100px 1fr 90px 130px 140px 150px 100px',
          borderTop: '1px solid var(--line-1)',
        }}>
          {/* Header */}
          {['ID', 'Asset', 'Type', 'Value (USD)', '24h Change', 'Custodian', 'Status'].map(h => (
            <div key={h} style={{
              padding: '12px 18px', font: '500 11px var(--font-body)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              color: 'var(--fg-3)', background: 'rgba(255,255,255,0.02)',
            }}>{h}</div>
          ))}
          {/* Rows */}
          {visible.map(a => {
            const isPos = a.change >= 0;
            return (
              <React.Fragment key={a.id}>
                <div style={{ padding: '14px 18px', borderTop: '1px solid var(--line-1)', font: '12px var(--font-mono)', color: 'var(--fg-4)', display: 'flex', alignItems: 'center' }}>{a.id}</div>
                <div style={{ padding: '14px 18px', borderTop: '1px solid var(--line-1)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: `${TYPE_COLORS[a.type]}18`,
                    display: 'grid', placeItems: 'center',
                    font: '700 10px var(--font-mono)', color: TYPE_COLORS[a.type],
                  }}>{a.ticker}</div>
                  <div>
                    <div style={{ font: '600 13.5px var(--font-body)', color: 'var(--fg-1)' }}>{a.name}</div>
                    <div style={{ font: '11.5px var(--font-body)', color: 'var(--fg-4)', marginTop: 2 }}>Updated {a.updated}</div>
                  </div>
                </div>
                <div style={{ padding: '14px 18px', borderTop: '1px solid var(--line-1)', display: 'flex', alignItems: 'center' }}><TypeBadge type={a.type} /></div>
                <div style={{ padding: '14px 18px', borderTop: '1px solid var(--line-1)', display: 'flex', alignItems: 'center', font: '600 14px var(--font-brand)', color: 'var(--fg-1)' }}>{fmtUSD(a.value)}</div>
                <div style={{ padding: '14px 18px', borderTop: '1px solid var(--line-1)', display: 'flex', alignItems: 'center', font: '600 13px var(--font-body)', color: isPos ? 'var(--tertiary-400)' : 'var(--status-error)' }}>
                  <Icon name={isPos ? 'trending-up' : 'trending-down'} size={13} style={{ marginRight: 5 }} />
                  {isPos ? '+' : ''}{a.change.toFixed(2)}%
                </div>
                <div style={{ padding: '14px 18px', borderTop: '1px solid var(--line-1)', display: 'flex', alignItems: 'center', font: '13px var(--font-body)', color: 'var(--fg-2)' }}>{a.custodian}</div>
                <div style={{ padding: '14px 18px', borderTop: '1px solid var(--line-1)', display: 'flex', alignItems: 'center' }}><StatusPill status={a.status} /></div>
              </React.Fragment>
            );
          })}
        </div>
        <div className="logcard__foot">
          <span>Showing {visible.length} of {ASSETS.length} assets</span>
          <div className="pagination">
            <button className="pagebtn pagebtn--icon"><Icon name="chevron-left" size={14} /></button>
            {[1, 2].map(n => (
              <button key={n} className={`pagebtn ${n === page ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>
            ))}
            <button className="pagebtn pagebtn--icon"><Icon name="chevron-right" size={14} /></button>
          </div>
        </div>
      </div>

      {/* Allocation breakdown */}
      <div className="chartcard">
        <div className="chartcard__head">
          <div>
            <div className="chartcard__title">Portfolio Allocation</div>
            <div className="chartcard__subtitle">Distribution by asset class — total AUM {fmtUSD(totalValue)}</div>
          </div>
        </div>
        <div className="svchealth" style={{ paddingTop: 8 }}>
          {alloc.map(a => (
            <div key={a.type} className="svchealth__row">
              <div className="svchealth__top">
                <span className="svchealth__name" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 99, background: a.color, flexShrink: 0 }} />
                  {a.type}
                </span>
                <span className="svchealth__pct" style={{ color: a.color }}>{a.pct.toFixed(1)}%</span>
              </div>
              <div className="svchealth__bar">
                <i style={{ width: `${a.pct}%`, background: a.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
