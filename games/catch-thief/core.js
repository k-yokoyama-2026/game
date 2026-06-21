/* 泥棒をやっつけろ — コアロジック（DOM非依存・テスト可能） */
(function (global) {
  function getLevelConfig(lv) {
    const base = 5 + lv * 2;
    const speed = 0.6 + lv * 0.12;
    const sneakyChance = lv >= 4 ? Math.min(0.1 + (lv - 4) * 0.04, 0.35) : 0;
    const fastChance = lv >= 2 ? Math.min(0.1 + (lv - 2) * 0.04, 0.4) : 0;
    const spawnInterval = Math.max(1800 - lv * 80, 500);
    const boss = lv % 5 === 0;          // 5レベルごとにボス
    return { total: base, speed, sneakyChance, fastChance, spawnInterval, boss };
  }

  const BASE_SCORE = { normal: 100, fast: 150, sneaky: 200, boss: 500 };
  function thiefBaseScore(type) { return BASE_SCORE[type] || 100; }

  function comboMultiplier(combo) { return Math.min(combo, 10); }       // 上限10倍
  function scoreFor(type, combo) { return thiefBaseScore(type) * Math.max(1, comboMultiplier(combo)); }

  function isBossLevel(lv) { return lv % 5 === 0; }
  function bossHp(lv) { return 5 + Math.floor(lv / 5) * 2; }

  // 出現タイプの抽選（rng は 0..1）
  function pickType(rng, cfg) {
    const r = (rng || Math.random)();
    if (r < cfg.sneakyChance) return 'sneaky';
    if (r < cfg.sneakyChance + cfg.fastChance) return 'fast';
    return 'normal';
  }

  // タイプ別の素ステータス（速度倍率・大きさ）
  function thiefStats(type) {
    if (type === 'fast') return { speedMult: 1.6, size: 32 };
    if (type === 'sneaky') return { speedMult: 0.8, size: 34 };
    if (type === 'boss') return { speedMult: 0.55, size: 58 };
    return { speedMult: 1, size: 36 };
  }

  const api = { getLevelConfig, thiefBaseScore, comboMultiplier, scoreFor, isBossLevel, bossHp, pickType, thiefStats };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) global.ThiefCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
