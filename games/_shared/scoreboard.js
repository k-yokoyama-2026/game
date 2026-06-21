/* ホーム画面のベストスコア表示（DOM非依存・テスト可能） */
(function (global) {
  // raw(localStorageの文字列|null) を人が読める表記にする。記録なしは null。
  // cfg = { kind: 'high' | 'lowTime', unit?: string, label?: string }
  function formatBest(raw, cfg) {
    const n = parseFloat(raw);
    if (!Number.isFinite(n) || n <= 0) return null; // 未プレイ/不正値
    const c = cfg || {};
    if (c.kind === 'lowTime') {
      return `⏱️ ベスト ${n}${c.unit || '秒'}`;
    }
    // 既定: 高いほど良い
    return `🏆 ベスト ${n}${c.unit || ''}`;
  }

  // store = localStorage 互換（getItem を持つ）。なければ null。
  function readBest(store, cfg) {
    if (!store || !cfg || !cfg.key) return null;
    let raw = null;
    try { raw = store.getItem(cfg.key); } catch (e) { return null; }
    return formatBest(raw, cfg);
  }

  const api = { formatBest, readBest };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) global.Scoreboard = api;
})(typeof window !== 'undefined' ? window : globalThis);
