// Sky Dodger — game screen + game-over overlay
const { useState: gUseState, useEffect: gUseEffect, useRef: gUseRef } = React;

function GameScreen({ user, soundOn, onSetSound, initialDifficulty = 'normal', onSignInPrompt, onSaveScore }) {
  const canvasRef = gUseRef(null);
  const engineRef = gUseRef(null);
  const [difficulty, setDifficulty] = gUseState(initialDifficulty);
  const [score, setScore] = gUseState(0);
  const [phase, setPhase] = gUseState('menu'); // menu | playing | gameover
  const [lastResult, setLastResult] = gUseState(null);
  const [bestThisSession, setBestThisSession] = gUseState(0);

  gUseEffect(() => {
    const eng = window.SkyDodgerEngine.createGame(canvasRef.current, {
      difficulty,
      soundOn,
      onScore: (s) => setScore(s),
      onGameOver: (res) => {
        setLastResult(res);
        setBestThisSession(b => Math.max(b, res.score));
        setPhase('gameover');
        if (user && onSaveScore) onSaveScore(res);
      },
    });
    engineRef.current = eng;
    eng.reset();
    const onKey = (e) => eng.handleInput(e);
    window.addEventListener('keydown', onKey);
    const onResize = () => eng.resize();
    window.addEventListener('resize', onResize);
    return () => {
      eng.stop();
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  gUseEffect(() => { engineRef.current && engineRef.current.setDifficulty(difficulty); }, [difficulty]);
  gUseEffect(() => { engineRef.current && engineRef.current.setSound(soundOn); }, [soundOn]);

  function startGame() {
    setScore(0);
    setPhase('playing');
    engineRef.current.start();
  }

  function tryAgain() {
    setScore(0);
    setPhase('playing');
    engineRef.current.start();
  }

  function backToMenu() {
    setPhase('menu');
    engineRef.current.reset();
  }

  function handleCanvasClick() {
    if (phase === 'playing') engineRef.current.jump();
  }

  return (
    <div className="grid-2">
      <div>
        {/* Top leaderboard ad — desktop */}
        <div style={{ marginBottom: 16, display: 'none' }} className="ad-desktop-only">
          <AdSlot kind="leaderboard" />
        </div>

        <div className="game-frame">
          <div className="game-canvas-wrap" onClick={handleCanvasClick} onTouchStart={(e) => { e.preventDefault(); if (phase === 'playing') engineRef.current.jump(); }}>
            <canvas ref={canvasRef} />

            {/* HUD */}
            {phase === 'playing' && (
              <div className="hud-top">
                <div />
                <div className="hud-score mono">{score}</div>
                <div className="hud-pill" onClick={(e) => { e.stopPropagation(); onSetSound(!soundOn); }}>
                  {soundOn ? '♪ ON' : '♪ OFF'}
                </div>
              </div>
            )}

            {/* Menu overlay */}
            {phase === 'menu' && (
              <div className="overlay">
                <div className="overlay-card">
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                    {user ? 'Saving to your account' : 'Anonymous play'}
                  </div>
                  <h2 style={{ margin: '0 0 18px', fontSize: 22, letterSpacing: '-0.01em' }}>Choose difficulty</h2>
                  <DifficultyPicker value={difficulty} onChange={setDifficulty} />
                  <button className="btn btn-coral btn-lg" style={{ width: '100%', marginTop: 18, justifyContent: 'center' }} onClick={startGame}>
                    Start flying
                  </button>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, fontSize: 12 }}>
                    <span className="muted">Tap, click, or press Space</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="muted">Sound</span>
                      <Toggle on={soundOn} onChange={onSetSound} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Game over overlay */}
            {phase === 'gameover' && lastResult && (
              <div className="overlay">
                <div className="overlay-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                        Run complete
                      </div>
                      <div className="mono" style={{ fontSize: 56, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.03em' }}>
                        {lastResult.score}
                      </div>
                      <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>obstacles passed</div>
                    </div>
                    <Tag kind={diffTagKind(lastResult.difficulty)}>{lastResult.difficulty}</Tag>
                  </div>

                  <div style={{ display: 'flex', gap: 14, paddingTop: 14, borderTop: '1px solid var(--line)', marginBottom: 14 }}>
                    <div style={{ flex: 1 }}>
                      <div className="muted" style={{ fontSize: 11 }}>Time</div>
                      <div className="mono" style={{ fontWeight: 700, fontSize: 16 }}>{fmtTime(lastResult.duration)}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="muted" style={{ fontSize: 11 }}>Best (session)</div>
                      <div className="mono" style={{ fontWeight: 700, fontSize: 16 }}>{Math.max(bestThisSession, lastResult.score)}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="muted" style={{ fontSize: 11 }}>Status</div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: user ? 'var(--green)' : 'var(--ink-3)' }}>
                        {user ? 'Saved ✓' : 'Not saved'}
                      </div>
                    </div>
                  </div>

                  {!user && (
                    <div style={{ background: 'oklch(0.62 0.14 195 / 0.08)', border: '1px solid oklch(0.62 0.14 195 / 0.2)', padding: 12, borderRadius: 10, marginBottom: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Sign in to save?</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.45, marginBottom: 10 }}>
                        Track your progress, climb the global leaderboard, earn badges.
                      </div>
                      <button className="btn btn-google btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={onSignInPrompt}>
                        <GoogleG /> Continue with Google
                      </button>
                    </div>
                  )}

                  {/* Interstitial-style ad on game over — high attention moment */}
                  <div style={{ marginBottom: 14 }}>
                    <AdSlot kind="interstitial" label="Google AdSense · 300×250 (game-over)" />
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={backToMenu}>Menu</button>
                    <button className="btn btn-coral" style={{ flex: 2, justifyContent: 'center' }} onClick={tryAgain}>Try again</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 8px 2px', color: 'oklch(0.78 0.01 280)', fontSize: 12 }}>
            <span>Mode: <span style={{ color: 'white' }}>{difficulty}</span></span>
            <span className="mono">Sky Dodger v1.0</span>
          </div>
        </div>

        {/* Mobile banner below game */}
        <div style={{ marginTop: 16 }}>
          <AdSlot kind="banner-mobile" label="Google AdSense · responsive banner (below-game)" />
        </div>
      </div>

      {/* Sidebar */}
      <div className="col">
        <div className="card card-pad">
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <h3 className="h3" style={{ margin: 0 }}>Live · Today</h3>
            <Tag>top 5</Tag>
          </div>
          <LeaderboardTable rows={window.SkyDodgerData.TODAY} limit={5} showDifficulty={false} />
        </div>

        <AdSlot kind="rectangle" label="Google AdSense · 300×250 (sidebar)" />

        <div className="card card-pad">
          <h3 className="h3">How it works</h3>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.7 }}>
            <li>Tap or press <span className="mono" style={{ background: 'var(--bg-deep)', padding: '1px 6px', borderRadius: 4 }}>Space</span> to flap</li>
            <li>Avoid the slabs · keep your altitude</li>
            <li>Each obstacle passed = 1 point</li>
            <li>Sign in to save runs and earn badges</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.3-.1-2.6-.4-3.5z"/>
    </svg>
  );
}

Object.assign(window, { GameScreen, GoogleG });
