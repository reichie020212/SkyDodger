// Sky Dodger — dashboard, leaderboards, profile

function Dashboard({ user }) {
  const D = window.SkyDodgerData;
  const [diffFilter, setDiffFilter] = React.useState('all');
  const filteredHistory = diffFilter === 'all' ? D.MY_HISTORY : D.MY_HISTORY.filter(h => h.difficulty === diffFilter);
  const totalPipes = D.MY_HISTORY.reduce((s, h) => s + h.score, 0);
  const totalTime = D.MY_HISTORY.reduce((s, h) => s + h.duration, 0);
  const avgScore = Math.round(D.MY_HISTORY.reduce((s, h) => s + h.score, 0) / D.MY_HISTORY.length);
  const earnedBadges = D.BADGES.filter(b => b.threshold(D.MY_BEST));

  return (
    <div className="grid-2">
      <div className="col">
        <div>
          <div className="flex-between" style={{ marginBottom: 14 }}>
            <div>
              <div className="h1">Welcome back, {user.name.split(' ')[0]}</div>
              <div className="muted">Member since {new Date(D.CURRENT_USER.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
            </div>
            <button className="btn btn-coral btn-lg" onClick={() => window.skyDodgerNav('play')}>Play now →</button>
          </div>

          <div className="stat-grid">
            <Stat label="Best score" value={D.MY_BEST} trend="↑ on Hard" />
            <Stat label="Games played" value={D.MY_TOTAL_GAMES} trend={`${Math.round(totalTime/60)} min total`} />
            <Stat label="Average" value={avgScore} trend="last 30 runs" />
            <Stat label="Global rank" value="#12" trend="↑ 3 this week" />
          </div>
        </div>

        <div className="card card-pad">
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h3 className="h2" style={{ margin: 0 }}>Score progression</h3>
            <div className="tabs">
              {['all', 'easy', 'normal', 'hard', 'insane'].map(d => (
                <button key={d} className={'tab' + (diffFilter === d ? ' active' : '')} onClick={() => setDiffFilter(d)}>
                  {d[0].toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <ScoreChart data={filteredHistory} />
          <div style={{ marginTop: 18 }}>
            <div className="h3" style={{ marginBottom: 8, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>Difficulty mix</div>
            <DiffDistribution history={D.MY_HISTORY} />
          </div>
        </div>

        {/* In-feed native ad between dashboard sections */}
        <div className="card" style={{ padding: 0 }}>
          <AdSlot kind="native" label="Google AdSense · in-feed native unit" />
        </div>

        <div className="card card-pad">
          <h3 className="h2">Badges <span className="muted" style={{ fontWeight: 400, fontSize: 14 }}>· {earnedBadges.length}/{D.BADGES.length}</span></h3>
          <div className="badges-grid">
            {D.BADGES.map(b => {
              const earned = b.threshold(D.MY_BEST);
              return (
                <div key={b.id} className={'badge ' + (earned ? 'earned' : 'locked')}>
                  <div className="badge-icon">{b.glyph}</div>
                  <div className="badge-name">{b.name}</div>
                  <div className="badge-desc">{b.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card card-pad">
          <h3 className="h2">Recent runs</h3>
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Mode</th>
                <th style={{ textAlign: 'right' }}>Score</th>
                <th style={{ textAlign: 'right' }}>Duration</th>
              </tr>
            </thead>
            <tbody>
              {D.MY_HISTORY.slice().reverse().slice(0, 8).map(h => (
                <tr key={h.id}>
                  <td className="muted">{fmtAgo(h.createdAt)}</td>
                  <td><Tag kind={diffTagKind(h.difficulty)}>{h.difficulty}</Tag></td>
                  <td className="mono" style={{ textAlign: 'right', fontWeight: 700 }}>{h.score}</td>
                  <td className="mono muted" style={{ textAlign: 'right' }}>{fmtTime(h.duration)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="col">
        <AdSlot kind="rectangle" label="Google AdSense · 300×250 (above-fold)" />

        <div className="card card-pad">
          <h3 className="h3">This week's top</h3>
          <LeaderboardTable rows={window.SkyDodgerData.WEEKLY} limit={6} showDifficulty={false} />
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }} onClick={() => window.skyDodgerNav('leaderboards')}>
            See full leaderboards →
          </button>
        </div>

        <AdSlot kind="skyscraper" label="Google AdSense · 160×600 (sidebar sticky)" />
      </div>
    </div>
  );
}

function LeaderboardsScreen() {
  const D = window.SkyDodgerData;
  const [tab, setTab] = React.useState('alltime');
  const [diff, setDiff] = React.useState('all');
  const sources = { alltime: D.ALL_TIME, monthly: D.MONTHLY, weekly: D.WEEKLY, today: D.TODAY };
  const rows = (sources[tab] || D.ALL_TIME).filter(r => diff === 'all' || r.difficulty === diff);

  const podium = rows.slice(0, 3);

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 18 }}>
        <div>
          <div className="h1">Global leaderboards</div>
          <div className="muted">Compete with players worldwide. Updated in real-time.</div>
        </div>
        <div className="tabs">
          {[['today', 'Today'], ['weekly', 'Week'], ['monthly', 'Month'], ['alltime', 'All-time']].map(([k, l]) => (
            <button key={k} className={'tab' + (tab === k ? ' active' : '')} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
      </div>

      {/* Top leaderboard ad */}
      <div style={{ marginBottom: 22 }}>
        <AdSlot kind="leaderboard" />
      </div>

      {/* Podium */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 22 }}>
        {[1, 0, 2].map((i, idx) => {
          const r = podium[i]; if (!r) return <div key={i} />;
          const heights = [180, 220, 160];
          const colors = ['rank-2', 'rank-1', 'rank-3'];
          return (
            <div key={r.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div className="card" style={{ padding: 18, textAlign: 'center', height: heights[idx], display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)' }}>
                  <Avatar name={r.name} hue={r.avatarHue} size="lg" />
                </div>
                <div className={'rank-medal ' + colors[idx]} style={{ position: 'absolute', top: 14, right: 14 }}>{i + 1}</div>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>{r.name}</div>
                <div className="mono" style={{ fontSize: 24, fontWeight: 700 }}>{r.score}</div>
                <Tag kind={diffTagKind(r.difficulty)} >{r.difficulty}</Tag>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, alignSelf: 'center', marginRight: 8 }}>Filter:</span>
          {['all', 'easy', 'normal', 'hard', 'insane'].map(d => (
            <button key={d} className={'tab' + (diff === d ? ' active' : '')} onClick={() => setDiff(d)} style={{ padding: '6px 12px' }}>
              {d[0].toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
        <LeaderboardTableWithAds rows={rows} />
      </div>
    </div>
  );
}

// Leaderboard with native ad row inserted at position 5
function LeaderboardTableWithAds({ rows }) {
  const top = rows.slice(0, 5);
  const rest = rows.slice(5, 25);
  return (
    <div>
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: 50 }}>#</th>
            <th>Player</th>
            <th style={{ width: 90, textAlign: 'right' }}>Score</th>
            <th style={{ width: 80 }}>Mode</th>
            <th style={{ width: 110 }}>Duration</th>
            <th style={{ width: 90 }}>When</th>
          </tr>
        </thead>
        <tbody>
          {top.map((r, i) => <LbRow key={r.id} r={r} i={i} />)}
        </tbody>
      </table>
      <div style={{ padding: '4px 12px' }}>
        <AdSlot kind="native" label="Google AdSense · in-feed native (between top 5 and rest)" />
      </div>
      <table className="table">
        <tbody>
          {rest.map((r, i) => <LbRow key={r.id} r={r} i={i + 5} />)}
        </tbody>
      </table>
    </div>
  );
}

function LbRow({ r, i }) {
  const me = r.isMe;
  const medal = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-other';
  return (
    <tr className={me ? 'me' : ''}>
      <td style={{ width: 50 }}><div className={'rank-medal ' + medal}>{i + 1}</div></td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
             onClick={() => window.skyDodgerNav('profile', r)}>
          <Avatar name={r.name} hue={r.avatarHue} />
          <span style={{ fontWeight: me ? 700 : 500 }}>{r.name}{me && <span className="muted" style={{ fontWeight: 400 }}> · you</span>}</span>
        </div>
      </td>
      <td className="mono" style={{ textAlign: 'right', fontWeight: 700, fontSize: 15, width: 90 }}>{r.score}</td>
      <td style={{ width: 80 }}><Tag kind={diffTagKind(r.difficulty)}>{r.difficulty}</Tag></td>
      <td className="mono muted" style={{ width: 110 }}>{fmtTime(r.duration)}</td>
      <td className="muted" style={{ fontSize: 12, width: 90 }}>{fmtAgo(r.createdAt)}</td>
    </tr>
  );
}

function ProfileScreen({ profile }) {
  const D = window.SkyDodgerData;
  const isMe = !profile || profile.userId === 'me' || profile.id === 'me';
  const p = isMe ? { name: D.CURRENT_USER.name, avatarHue: D.CURRENT_USER.avatarHue, joinedAt: D.CURRENT_USER.joinedAt }
                 : { name: profile.name, avatarHue: profile.avatarHue, joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 120 };
  const history = isMe ? D.MY_HISTORY : window.SkyDodgerData.ALL_TIME.filter(r => r.userId === profile.userId).slice(0, 30).map((r, i) => ({
    ...r, score: Math.max(2, r.score - i * 2),
  }));
  const best = Math.max(...history.map(h => h.score));
  const earnedBadges = D.BADGES.filter(b => b.threshold(best));

  return (
    <div>
      <div className="profile-hero">
        <Avatar name={p.name} hue={p.avatarHue} size="xl" />
        <div style={{ flex: 1 }}>
          <div className="h1" style={{ marginBottom: 4 }}>{p.name}</div>
          <div className="muted" style={{ marginBottom: 8 }}>Joined {new Date(p.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} · {history.length} games played</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Tag kind="coral">Best · {best}</Tag>
            <Tag kind="teal">Top 12 globally</Tag>
            <Tag>{earnedBadges.length} badges</Tag>
          </div>
        </div>
        {!isMe && <button className="btn btn-ghost">Follow</button>}
      </div>

      <div className="grid-2">
        <div className="col">
          <div className="card card-pad">
            <h3 className="h2">Score progression</h3>
            <ScoreChart data={history} />
          </div>

          <AdSlot kind="leaderboard" label="Google AdSense · responsive (mid-profile)" />

          <div className="card card-pad">
            <h3 className="h2">Recent runs</h3>
            <table className="table">
              <thead><tr><th>When</th><th>Mode</th><th style={{ textAlign: 'right' }}>Score</th><th style={{ textAlign: 'right' }}>Time</th></tr></thead>
              <tbody>
                {history.slice().reverse().slice(0, 10).map(h => (
                  <tr key={h.id}>
                    <td className="muted">{fmtAgo(h.createdAt)}</td>
                    <td><Tag kind={diffTagKind(h.difficulty)}>{h.difficulty}</Tag></td>
                    <td className="mono" style={{ textAlign: 'right', fontWeight: 700 }}>{h.score}</td>
                    <td className="mono muted" style={{ textAlign: 'right' }}>{fmtTime(h.duration)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="col">
          <div className="card card-pad">
            <h3 className="h2">Badges</h3>
            <div className="badges-grid">
              {D.BADGES.map(b => {
                const earned = b.threshold(best);
                return (
                  <div key={b.id} className={'badge ' + (earned ? 'earned' : 'locked')}>
                    <div className="badge-icon">{b.glyph}</div>
                    <div className="badge-name">{b.name}</div>
                    <div className="badge-desc">{b.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <AdSlot kind="rectangle" label="Google AdSense · 300×250 (profile sidebar)" />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard, LeaderboardsScreen, ProfileScreen });
