// Sky Dodger — shared UI components
const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ---- Avatar ----
function Avatar({ name, hue = 200, size = 'sm' }) {
  const initials = (name || '?').split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase();
  const cls = 'avatar' + (size === 'lg' ? ' lg' : size === 'xl' ? ' xl' : size === 'sm' ? ' sm' : '');
  const bg = `linear-gradient(135deg, oklch(0.72 0.16 ${hue}), oklch(0.6 0.18 ${(hue + 40) % 360}))`;
  return <div className={cls} style={{ background: bg }}>{initials}</div>;
}

// ---- Tag ----
function Tag({ children, kind = '' }) {
  return <span className={'tag ' + kind}>{children}</span>;
}

function diffTagKind(d) {
  return ({ easy: 'green', normal: 'teal', hard: 'coral', insane: 'red' })[d] || '';
}

// ---- Toggle ----
function Toggle({ on, onChange }) {
  return <div className={'toggle' + (on ? ' on' : '')} onClick={() => onChange(!on)} />;
}

// ---- Ad slots ----
function AdSlot({ kind = 'leaderboard', label }) {
  const map = {
    leaderboard: { cls: 'ad-leaderboard', sz: '728 × 90' },
    'banner-mobile': { cls: 'ad-banner-mobile', sz: '320 × 100' },
    rectangle: { cls: 'ad-rectangle', sz: '300 × 250' },
    skyscraper: { cls: 'ad-skyscraper', sz: '160 × 600' },
    native: { cls: 'ad-native', sz: 'In-feed native' },
    interstitial: { cls: 'ad-interstitial', sz: '300 × 250' },
  };
  const m = map[kind] || map.leaderboard;
  return (
    <div className="ad-wrap" style={{ margin: '0 auto', width: 'fit-content', maxWidth: '100%' }}>
      <div className={'ad-slot ' + m.cls}>
        <div style={{ textAlign: 'center', lineHeight: 1.4 }}>
          {label || `Google AdSense · ${m.sz}`}
          <div style={{ fontSize: 9, opacity: 0.65, marginTop: 4 }}>data-ad-slot rendered here</div>
        </div>
      </div>
    </div>
  );
}

// ---- Format helpers ----
function fmtTime(s) {
  const m = Math.floor(s / 60), r = Math.floor(s % 60);
  return m > 0 ? `${m}:${String(r).padStart(2, '0')}` : `${r}s`;
}
function fmtAgo(t) {
  const d = (Date.now() - t) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return Math.floor(d / 60) + 'm ago';
  if (d < 86400) return Math.floor(d / 3600) + 'h ago';
  return Math.floor(d / 86400) + 'd ago';
}

// ---- Difficulty selector ----
function DifficultyPicker({ value, onChange }) {
  const cfg = window.SkyDodgerEngine.DIFFICULTY;
  const colors = { easy: 'var(--green)', normal: 'var(--teal)', hard: 'var(--coral)', insane: 'var(--red)' };
  return (
    <div className="diff-grid">
      {Object.entries(cfg).map(([k, v]) => (
        <button
          key={k}
          className={'diff-card' + (value === k ? ' selected' : '')}
          onClick={() => onChange(k)}
        >
          <div className="diff-name">
            <span className="diff-dot" style={{ background: colors[k] }} />
            {v.label}
          </div>
          <div className="diff-meta">
            gap {v.pipeGap}px · spd {v.pipeSpeed.toFixed(1)}
          </div>
        </button>
      ))}
    </div>
  );
}

// ---- Leaderboard table ----
function LeaderboardTable({ rows, limit = 10, showDifficulty = true, currentUserId = 'me' }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th style={{ width: 50 }}>#</th>
          <th>Player</th>
          <th style={{ width: 90, textAlign: 'right' }}>Score</th>
          {showDifficulty && <th style={{ width: 80 }}>Mode</th>}
          <th style={{ width: 90 }}>When</th>
        </tr>
      </thead>
      <tbody>
        {rows.slice(0, limit).map((r, i) => {
          const me = r.userId === currentUserId || r.isMe;
          const medal = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-other';
          return (
            <tr key={r.id} className={me ? 'me' : ''}>
              <td><div className={'rank-medal ' + medal}>{i + 1}</div></td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={r.name} hue={r.avatarHue} />
                  <span style={{ fontWeight: me ? 700 : 500 }}>{r.name}{me && <span className="muted" style={{ fontWeight: 400 }}> · you</span>}</span>
                </div>
              </td>
              <td className="mono" style={{ textAlign: 'right', fontWeight: 700, fontSize: 15 }}>{r.score}</td>
              {showDifficulty && <td><Tag kind={diffTagKind(r.difficulty)}>{r.difficulty}</Tag></td>}
              <td className="muted" style={{ fontSize: 12 }}>{fmtAgo(r.createdAt)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ---- Stats tile ----
function Stat({ label, value, trend }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {trend && <div className="stat-trend">{trend}</div>}
    </div>
  );
}

// ---- Score chart (handrolled SVG, no external libs) ----
function ScoreChart({ data, height = 200 }) {
  const W = 600, H = height, pad = { l: 32, r: 16, t: 16, b: 28 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const max = Math.max(20, ...data.map(d => d.score));
  const min = 0;
  const xStep = innerW / Math.max(1, data.length - 1);
  const points = data.map((d, i) => ({
    x: pad.l + i * xStep,
    y: pad.t + innerH - ((d.score - min) / (max - min)) * innerH,
    score: d.score,
    diff: d.difficulty,
  }));
  const pathD = points.map((p, i) => (i === 0 ? 'M' : 'L') + p.x + ',' + p.y).join(' ');
  const areaD = pathD + ` L${points[points.length - 1].x},${pad.t + innerH} L${points[0].x},${pad.t + innerH} Z`;

  const yTicks = [0, max * 0.5, max].map(v => Math.round(v));
  const xTicks = [0, Math.floor(data.length / 2), data.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.68 0.18 35)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="oklch(0.68 0.18 35)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* gridlines */}
      {yTicks.map((v, i) => {
        const y = pad.t + innerH - (v / max) * innerH;
        return (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="oklch(0.88 0.015 85)" strokeDasharray="2 4" />
            <text x={pad.l - 8} y={y + 4} fontSize="10" fill="oklch(0.62 0.015 280)" textAnchor="end" fontFamily="JetBrains Mono">{v}</text>
          </g>
        );
      })}
      {/* x labels */}
      {xTicks.map((idx, i) => {
        const d = data[idx]; if (!d) return null;
        const x = pad.l + idx * xStep;
        const dt = new Date(d.createdAt);
        const lbl = `${dt.getMonth() + 1}/${dt.getDate()}`;
        return <text key={i} x={x} y={H - 8} fontSize="10" fill="oklch(0.62 0.015 280)" textAnchor="middle" fontFamily="JetBrains Mono">{lbl}</text>;
      })}
      <path d={areaD} fill="url(#area)" />
      <path d={pathD} stroke="oklch(0.55 0.18 32)" strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="oklch(0.99 0.008 85)" stroke="oklch(0.55 0.18 32)" strokeWidth="2" />
      ))}
    </svg>
  );
}

// ---- Difficulty distribution bar ----
function DiffDistribution({ history }) {
  const counts = history.reduce((acc, h) => { acc[h.difficulty] = (acc[h.difficulty] || 0) + 1; return acc; }, {});
  const total = history.length;
  const order = ['easy', 'normal', 'hard', 'insane'];
  const colors = { easy: 'var(--green)', normal: 'var(--teal)', hard: 'var(--coral)', insane: 'var(--red)' };
  return (
    <div>
      <div style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', background: 'var(--bg-deep)' }}>
        {order.map(d => {
          const w = ((counts[d] || 0) / total) * 100;
          if (!w) return null;
          return <div key={d} style={{ width: w + '%', background: colors[d] }} />;
        })}
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
        {order.map(d => (
          <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: colors[d] }} />
            <span style={{ textTransform: 'capitalize' }}>{d}</span>
            <span className="mono muted">{counts[d] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  Avatar, Tag, Toggle, AdSlot, DifficultyPicker, LeaderboardTable, Stat, ScoreChart, DiffDistribution,
  fmtTime, fmtAgo, diffTagKind,
});
