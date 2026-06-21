/* 共通サウンド + ミュート（全ゲーム共有） — DOM/ブラウザでもNodeテストでも安全 */
(function (global) {
  const KEY = 'games_muted';
  let actx = null;
  let muted = false;
  try { muted = localStorage.getItem(KEY) === '1'; } catch (e) {}

  function unlock() {
    if (!actx) { try { actx = new (global.AudioContext || global.webkitAudioContext)(); } catch (e) {} }
    if (actx && actx.state === 'suspended') actx.resume();
    return actx;
  }

  // 1音を合成して鳴らす（ミュート中は無音）
  function tone(freq, dur, type, gain, when) {
    if (muted) return;
    const a = unlock(); if (!a) return;
    const t = a.currentTime + (when || 0);
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
  }

  function isMuted() { return muted; }
  function setMuted(b) {
    muted = !!b;
    try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch (e) {}
    updateButton();
  }
  function toggle() { setMuted(!muted); }

  let btn = null;
  function updateButton() { if (btn) btn.textContent = muted ? '🔇' : '🔊'; }

  // 画面に🔊/🔇トグルを1つだけ設置（重複設置しない）
  function mountButton() {
    if (typeof document === 'undefined') return;
    if (btn || document.getElementById('muteBtn')) return;
    btn = document.createElement('button');
    btn.id = 'muteBtn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'サウンドのオン/オフ');
    btn.textContent = muted ? '🔇' : '🔊';
    btn.style.cssText = [
      'position:fixed', 'left:max(8px,env(safe-area-inset-left))', 'bottom:max(8px,env(safe-area-inset-bottom))',
      'width:42px', 'height:42px', 'border-radius:50%', 'border:none', 'cursor:pointer',
      'font-size:20px', 'background:rgba(0,0,0,0.45)', 'color:#fff', 'z-index:2147483000',
      'display:flex', 'align-items:center', 'justify-content:center', 'box-shadow:0 2px 8px rgba(0,0,0,0.3)',
      'touch-action:manipulation', '-webkit-tap-highlight-color:transparent',
    ].join(';');
    btn.addEventListener('click', (e) => { e.stopPropagation(); unlock(); toggle(); });
    (document.body || document.documentElement).appendChild(btn);
  }

  // 最初の操作でオーディオを起こす
  if (typeof global.addEventListener === 'function') {
    const wake = () => unlock();
    global.addEventListener('pointerdown', wake, { passive: true });
    global.addEventListener('keydown', wake, { passive: true });
    global.addEventListener('touchstart', wake, { passive: true });
  }

  global.AudioFX = { unlock, tone, isMuted, setMuted, toggle, mountButton };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.AudioFX;
})(typeof window !== 'undefined' ? window : globalThis);
