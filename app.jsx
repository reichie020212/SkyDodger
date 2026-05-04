// Sky Dodger — main app
const { useState: aUseState, useEffect: aUseEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "showAds": true,
  "soundOn": true,
  "startDifficulty": "normal",
  "startSignedIn": true
}/*EDITMODE-END*/;

function loadTweaks() {
  try {
    const saved = localStorage.getItem('sd_tweaks');
    if (saved) return { ...TWEAK_DEFAULTS, ...JSON.parse(saved) };
  } catch {}
  return TWEAK_DEFAULTS;
}

function App() {
  const [tweaks, setTweaks] = aUseState(loadTweaks());
  const [editMode, setEditMode] = aUseState(false);
  const [route, setRoute] = aUseState(() => localStorage.getItem('sd_route') || 'play');
  const [profileTarget, setProfileTarget] = aUseState(null);
  const [user, setUser] = aUseState(() => {
    if (loadTweaks().startSignedIn) {
      return { ...window.SkyDodgerData.CURRENT_USER };
    }
    return null;
  });
  const [signInOpen, setSignInOpen] = aUseState(false);
  const [soundOn, setSoundOn] = aUseState(loadTweaks().soundOn);

  aUseEffect(() => { localStorage.setItem('sd_route', route); }, [route]);
  aUseEffect(() => {
    localStorage.setItem('sd_tweaks', JSON.stringify(tweaks));
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: tweaks }, '*');
  }, [tweaks]);

  // Tweaks protocol
  aUseEffect(() => {
    const onMsg = (e) => {
      if (e.data && e.data.type === '__activate_edit_mode') setEditMode(true);
      if (e.data && e.data.type === '__deactivate_edit_mode') setEditMode(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // Expose nav globally for child components
  aUseEffect(() => {
    window.skyDodgerNav = (r, profile) => {
      if (r === 'profile') setProfileTarget(profile || null);
      setRoute(r);
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
  }, []);

  function handleSignIn() {
    setUser({ ...window.SkyDodgerData.CURRENT_USER });
    setSignInOpen(false);
  }

  function handleSignOut() { setUser(null); setRoute('play'); }

  function handleSaveScore(res) {
    // In production this calls POST /api/scores → Prisma → Postgres
    // Here we just acknowledge — the dashboard data is pre-seeded
    console.log('[mock] POST /api/scores', res);
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand" onClick={() => setRoute('play')}>
            <div className="brand-mark" />
            <span>Sky Dodger</span>
          </div>
          <nav className="nav">
            <button className={'nav-link' + (route === 'play' ? ' active' : '')} onClick={() => setRoute('play')}>Play</button>
            <button className={'nav-link' + (route === 'leaderboards' ? ' active' : '')} onClick={() => setRoute('leaderboards')}>Leaderboards</button>
            {user && <button className={'nav-link' + (route === 'dashboard' ? ' active' : '')} onClick={() => setRoute('dashboard')}>Dashboard</button>}
            {user && <button className={'nav-link' + (route === 'profile' && (!profileTarget || profileTarget.userId === 'me') ? ' active' : '')} onClick={() => { setProfileTarget(null); setRoute('profile'); }}>Profile</button>}
          </nav>
          <div className="topbar-spacer" />
          {user ? (
            <div className="user-chip" onClick={() => { setProfileTarget(null); setRoute('profile'); }}>
              <Avatar name={user.name} hue={user.avatarHue} />
              <span>{user.name.split(' ')[0]}</span>
            </div>
          ) : (
            <button className="btn btn-google btn-sm" onClick={() => setSignInOpen(true)}>
              <GoogleG /> Sign in
            </button>
          )}
        </div>
      </header>

      <main className="page">
        {route === 'play' && (
          <GameScreen
            user={user}
            soundOn={soundOn}
            onSetSound={(s) => { setSoundOn(s); setTweaks(t => ({ ...t, soundOn: s })); }}
            initialDifficulty={tweaks.startDifficulty}
            onSignInPrompt={() => setSignInOpen(true)}
            onSaveScore={handleSaveScore}
          />
        )}
        {route === 'leaderboards' && <LeaderboardsScreen />}
        {route === 'dashboard' && user && <Dashboard user={user} />}
        {route === 'profile' && <ProfileScreen profile={profileTarget} />}
        {route === 'dashboard' && !user && (
          <div className="card card-pad" style={{ textAlign: 'center', padding: 60 }}>
            <h2 className="h2">Sign in to see your dashboard</h2>
            <p className="muted">Track your runs, climb the leaderboards, earn badges.</p>
            <button className="btn btn-google btn-lg" onClick={() => setSignInOpen(true)} style={{ margin: '0 auto' }}>
              <GoogleG /> Continue with Google
            </button>
          </div>
        )}
      </main>

      <footer className="footer">
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 8, fontSize: 12 }}>
          <a style={{ color: 'inherit', textDecoration: 'none' }}>About</a>
          <a style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</a>
          <a style={{ color: 'inherit', textDecoration: 'none' }}>Terms</a>
          <a style={{ color: 'inherit', textDecoration: 'none' }}>Contact</a>
          {user && <a style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }} onClick={handleSignOut}>Sign out</a>}
        </div>
        <div>© 2026 Sky Dodger · Original game · Not affiliated with any other product</div>
      </footer>

      {/* Sign-in modal */}
      {signInOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'oklch(0.22 0.02 280 / 0.5)', display: 'grid', placeItems: 'center', zIndex: 200, padding: 20 }} onClick={() => setSignInOpen(false)}>
          <div className="card card-pad" style={{ width: '100%', maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <h2 className="h1" style={{ marginBottom: 6 }}>Sign in to Sky Dodger</h2>
            <p className="muted" style={{ marginBottom: 20 }}>Save runs, earn badges, climb the global leaderboard.</p>
            <button className="btn btn-google btn-lg" style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }} onClick={handleSignIn}>
              <GoogleG /> Continue with Google
            </button>
            <p style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'center', margin: '14px 0 0' }}>
              By signing in, you agree to our Terms and Privacy Policy.
              <br />Mock OAuth flow · production uses NextAuth.js
            </p>
          </div>
        </div>
      )}

      {/* Tweaks panel */}
      {editMode && (
        <div className="tweaks">
          <h4>Tweaks <span style={{ color: 'var(--ink-3)' }}>·</span></h4>
          <div className="tweak-row">
            <label>Show ad slots</label>
            <Toggle on={tweaks.showAds} onChange={(v) => setTweaks(t => ({ ...t, showAds: v }))} />
          </div>
          <div className="tweak-row">
            <label>Sound on by default</label>
            <Toggle on={tweaks.soundOn} onChange={(v) => { setTweaks(t => ({ ...t, soundOn: v })); setSoundOn(v); }} />
          </div>
          <div className="tweak-row">
            <label>Start difficulty</label>
            <select value={tweaks.startDifficulty} onChange={e => setTweaks(t => ({ ...t, startDifficulty: e.target.value }))}>
              <option value="easy">Easy</option>
              <option value="normal">Normal</option>
              <option value="hard">Hard</option>
              <option value="insane">Insane</option>
            </select>
          </div>
          <div className="tweak-row">
            <label>Signed in</label>
            <Toggle on={!!user} onChange={(v) => v ? setUser({ ...window.SkyDodgerData.CURRENT_USER }) : setUser(null)} />
          </div>
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 10, marginTop: 10, fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.5 }}>
            Toggle ad slots to preview the layout for users with ad blockers enabled.
          </div>
        </div>
      )}

      {/* Hide ads via tweak */}
      <style>{tweaks.showAds ? '' : '.ad-slot, .ad-wrap { display: none !important; }'}</style>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
