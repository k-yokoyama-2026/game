/* キラめき探検隊 — コアロジック（DOM非依存・テスト可能） */
(function (global) {
  const GOAL = 10;       // 集めるとクリア
  const KIRA_CAP = 16;   // キラの所持上限
  const MAX_HOLD = 6;    // アイテム所持枠

  const crystalDefs = [
    { id: 1, emoji: '👁️', cost: 1, name: '透視' },
    { id: 2, emoji: '⚔️', cost: 1, name: '攻撃' },
    { id: 3, emoji: '💥', cost: 2, name: '強化攻撃' },
    { id: 4, emoji: '💖', cost: 3, name: '万能' },
  ];
  function crystalCost(id) { const d = crystalDefs.find(c => c.id === id); return d ? d.cost : 0; }
  function canUseCrystal(hasCrystal, kira, id) { return !!hasCrystal && kira >= crystalCost(id); }

  function isWin(collected) { return collected >= GOAL; }
  function canPickKira(kira) { return kira < KIRA_CAP; }

  // 中心からの方角ヒント
  function hintDir(px, py, worldW, worldH) {
    const dx = px - worldW / 2;
    const dy = py - worldH / 2;
    if (Math.abs(dy) > Math.abs(dx)) return dy < 0 ? '北' : '南';
    return dx < 0 ? '西' : '東';
  }

  // クリア評価（★1〜3）：体力温存・キラ節約・速さ
  function clearStars(hpLeft, maxHp, kiraSpent, seconds) {
    let s = 1;
    if (hpLeft >= maxHp * 0.6) s++;
    if (kiraSpent <= 6 && seconds <= 120) s++;
    return Math.min(3, s);
  }

  const api = { GOAL, KIRA_CAP, MAX_HOLD, crystalDefs, crystalCost, canUseCrystal, isWin, canPickKira, hintDir, clearStars };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) global.GemCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
