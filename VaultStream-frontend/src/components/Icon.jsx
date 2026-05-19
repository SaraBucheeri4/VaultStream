// Icon.jsx — Lucide-style icon loader (renders inline SVGs by name)
// Uses currentColor on stroke. For gradient strokes, pass gradient="brand".

const ICON_PATHS = {
  'activity':       ['M22 12h-4l-3 9L9 3l-3 9H2'],
  'alert-triangle': ['M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z', 'M12 9v4', 'M12 17h.01'],
  'bell':           ['M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9', 'M10.3 21a1.94 1.94 0 0 0 3.4 0'],
  'bug':            ['M8 2l1.5 1.5', 'M14.5 2 16 3.5', 'M9 7.5h6', 'M5 8h14v5a7 7 0 1 1-14 0z', 'M5 13H2', 'M22 13h-3', 'M5 17l-3 2', 'M19 17l3 2'],
  'chevron-down':   ['m6 9 6 6 6-6'],
  'chevron-right':  ['m9 18 6-6-6-6'],
  'clock':          ['M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z','M12 6v6l4 2'],
  'database':       ['M4 5c0 1.657 3.582 3 8 3s8-1.343 8-3-3.582-3-8-3-8 1.343-8 3z','M4 5v6c0 1.657 3.582 3 8 3s8-1.343 8-3V5','M4 11v6c0 1.657 3.582 3 8 3s8-1.343 8-3v-6'],
  'download':       ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4','M7 10l5 5 5-5','M12 15V3'],
  'filter':         ['M22 3H2l8 9.46V19l4 2v-8.54L22 3z'],
  'info':           ['M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z','M12 16v-4','M12 8h.01'],
  'key-round':      ['M2 18a4 4 0 0 1 4-4h.5a3.5 3.5 0 1 0 0-7H6a4 4 0 0 0-4 4v7z','M15.5 7.5l2 2L22 5l-2-2-1.5 1.5-2-2L15 4l2 2-1.5 1.5z'],
  'layers':         ['M12 2 2 7l10 5 10-5-10-5z','M2 17l10 5 10-5','M2 12l10 5 10-5'],
  'line-chart':     ['M3 3v18h18','M7 14l4-4 4 4 6-6'],
  'log-out':        ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4','M16 17l5-5-5-5','M21 12H9'],
  'menu':           ['M4 6h16','M4 12h16','M4 18h16'],
  'search':         ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z','m21 21-4.3-4.3'],
  'server':         ['M2 4h20v6H2zM2 14h20v6H2z','M6 7h.01','M6 17h.01'],
  'settings':       ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z','M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'],
  'shield-check':   ['M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3v8z','m9 12 2 2 4-4'],
  'users-round':    ['M18 21a8 8 0 0 0-16 0','M10 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z','M22 21a6 6 0 0 0-5-5.91','M16 3.13a5 5 0 0 1 0 9.74'],
  'x':              ['M18 6 6 18','M6 6l12 12'],
  'zap':            ['M13 2 3 14h9l-1 8 10-12h-9l1-8z'],
  'refresh-cw':     ['M21 12a9 9 0 1 1-3-6.7L21 8','M21 3v5h-5'],
  'arrow-up-right': ['M7 17 17 7','M7 7h10v10'],
  'arrow-down-right':['M7 7l10 10','M17 7v10H7'],
  'eye':            ['M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z','M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'],
  'check':          ['M20 6 9 17l-5-5'],
  'globe':          ['M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z','M2 12h20','M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'],
  'cpu':            ['M4 4h16v16H4z','M9 9h6v6H9z','M9 1v3','M15 1v3','M9 20v3','M15 20v3','M20 9h3','M20 14h3','M1 9h3','M1 14h3'],
  'play':           ['M5 3l14 9-14 9z'],
  'pause':          ['M6 4h4v16H6z','M14 4h4v16h-4z'],
  'sparkles':       ['M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z','M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z'],
  'grid':           ['M3 3h7v7H3z','M14 3h7v7h-7z','M3 14h7v7H3z','M14 14h7v7h-7z'],
  'wallet':         ['M20 12V8H6a2 2 0 0 1 0-4h12v4','M4 6v12a2 2 0 0 0 2 2h14v-4','M18 12a2 2 0 0 0 0 4h4v-4z'],
  'help-circle':    ['M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z','M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3','M12 17h.01'],
  'code':           ['m16 18 6-6-6-6','m8 6-6 6 6 6'],
  'chevron-left':   ['m15 18-6-6 6-6'],
  'more-horizontal':['M12 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2z','M19 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2z','M5 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2z'],
  'sliders':        ['M4 21v-7','M4 10V3','M12 21v-9','M12 8V3','M20 21v-5','M20 12V3','M1 14h6','M9 8h6','M17 16h6'],
  'box':            ['M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z','M3.27 6.96 12 12.01l8.73-5.05','M12 22.08V12'],
  'stopwatch':      ['M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z','M12 6v6l4 2','M10 1h4'],
  'alert-octagon':  ['M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86L7.86 2z','M12 8v4','M12 16h.01'],
};

export function Icon({ name, size = 18, stroke = 1.5, gradient = null, style = {}, className = '' }) {
  const d = ICON_PATHS[name];
  if (!d) return null;
  const strokeAttr = gradient ? `url(#grad-${gradient})` : 'currentColor';
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke={strokeAttr} strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round"
      style={style} className={className}
    >
      {d.map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

// Inline gradient defs (mount once at app root)
export function GradientDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <defs>
        <linearGradient id="grad-brand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="50%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
        <linearGradient id="grad-brand-h" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="50%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
        <linearGradient id="grad-brand-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EC4899" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="grad-violet" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="grad-pink" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#E91E8C" />
        </linearGradient>
        <linearGradient id="grad-cyan" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="100%" stopColor="#0891B2" />
        </linearGradient>
      </defs>
    </svg>
  );
}
