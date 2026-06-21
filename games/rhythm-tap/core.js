/* リズムタップ — コアロジック（DOM非依存・テスト可能） */
(function (global) {
  const FEVER_MS = 5000;
  const FEVER_THRESHOLD = 10; // コンボが10の倍数でフィーバー突入

  function comboBonus(combo) { return combo >= 10 ? 2 : combo >= 5 ? 1 : 0; }

  // タップ時の獲得点：良アイテムはコンボボーナス、フィーバー中は2倍。悪アイテムはそのまま。
  function scoreTap(pts, combo, fever) {
    if (pts <= 0) return pts;
    const total = pts + comboBonus(combo);
    return fever ? total * 2 : total;
  }

  function feverShouldStart(combo) { return combo > 0 && combo % FEVER_THRESHOLD === 0; }

  // 出現アイテム種別の抽選（progress: 0..1）。rng は 0..1 を返す関数。
  function pickItemType(progress, rng) {
    const r = (rng || Math.random);
    const badChance = 0.15 + progress * 0.3; // 15% -> 45%
    const goldenChance = 0.06;
    const x = r();
    if (x < goldenChance) return 'golden';
    if (x < goldenChance + badChance) return 'bad';
    return r() < 0.45 ? 'heart' : 'star';
  }

  function spawnInterval(progress, base, min) {
    return Math.max(min, base - progress * 400);
  }
  function itemLifetime(progress, base, min) {
    return Math.max(min, base - progress * 1300);
  }
  function itemSize(progress, base, min) {
    return Math.max(min, base - progress * 12);
  }

  function stageFor(score, thresholds) {
    return thresholds.filter(t => score >= t).length + 1;
  }

  function rank(score) {
    if (score >= 120) return { rank: 'S', emoji: '👑' };
    if (score >= 90) return { rank: 'A', emoji: '🌟' };
    if (score >= 60) return { rank: 'B', emoji: '✨' };
    if (score >= 35) return { rank: 'C', emoji: '🎵' };
    return { rank: 'D', emoji: '🎶' };
  }

  const api = {
    FEVER_MS, FEVER_THRESHOLD, comboBonus, scoreTap, feverShouldStart,
    pickItemType, spawnInterval, itemLifetime, itemSize, stageFor, rank,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) global.RhythmCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
