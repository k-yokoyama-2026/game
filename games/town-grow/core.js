/* まちづくり物語 — コアロジック（DOM非依存・テスト可能） */
(function (global) {
  const DISASTER = -999;

  function isDisaster(pop) { return pop === DISASTER; }

  // 一番住民が増える（最善の）選択肢のインデックス
  function bestChoiceIndex(choices) {
    let best = 0, bestPop = -Infinity;
    choices.forEach((c, i) => { if (c.pop !== DISASTER && c.pop > bestPop) { bestPop = c.pop; best = i; } });
    return best;
  }

  // 最善を選び続けた連鎖ボーナス（最大+5）
  function streakBonus(streak) { return Math.min(Math.max(streak, 0), 5); }

  // 選択の解決：最善を選ぶと連鎖ボーナス、別の安全策だと連鎖リセット。
  // さらに結果に毎回ランダムなブレ（twist）を入れ、丸暗記で常に最適にならないようにする。
  function resolveChoice(choices, choiceIdx, streak, rng) {
    const r = rng || Math.random;
    const c = choices[choiceIdx];
    if (!c || c.pop === DISASTER) return { disaster: true, popDelta: 0, bonus: 0, newStreak: 0, isBest: false, twist: false };
    const isBest = choiceIdx === bestChoiceIndex(choices);
    const newStreak = isBest ? streak + 1 : 0;
    const bonus = isBest ? streakBonus(newStreak) : 0;
    let popDelta = c.pop + bonus;
    let twist = false;
    const t = r();
    if (t < 0.2) { popDelta = Math.max(1, Math.floor(popDelta * 0.5)); twist = 'down'; }   // 思ったほど伸びない
    else if (t > 0.85) { popDelta = popDelta + 2; twist = 'up'; }                            // うれしい誤算
    return { disaster: false, popDelta, bonus, newStreak, isBest, twist };
  }

  function isWin(pop, goal) { return pop >= goal; }

  const api = { DISASTER, isDisaster, bestChoiceIndex, streakBonus, resolveChoice, isWin };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) global.TownCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
