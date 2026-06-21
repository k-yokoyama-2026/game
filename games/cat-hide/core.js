/* にゃんこどこ？ — コアロジック（DOM非依存・テスト可能） */
(function (global) {
  // 隠れ場所（動かせる＝重くないオブジェクト）からランダムに選ぶ
  function pickHider(objects, rng) {
    const r = rng || Math.random;
    const cand = objects.map((o, i) => ({ o, i })).filter(x => !x.o.heavy);
    if (cand.length === 0) return -1;
    return cand[Math.floor(r() * cand.length)].i;
  }

  function makeHint(label, rng) {
    const r = rng || Math.random;
    const templates = [
      `${label}が怪しい…`,
      `${label}のあたりが気になる`,
      `${label}、なんだか動いた気が…`,
      `${label}の陰をのぞいてみて`,
      `${label}にしっぽが見えたかも？`,
    ];
    return templates[Math.floor(r() * templates.length)];
  }

  // 見つけるまでの「ハズレめくり」回数で★評価（少ないほど良い）
  function starsForWrongTaps(wrong) { return wrong === 0 ? 3 : wrong <= 2 ? 2 : 1; }
  function levelPoints(stars) { return stars * 100; }

  // ベストスコア更新（非数値や負値は0扱い）。新記録なら beat=true。
  function bestScore(prev, current) {
    const p = Number.isFinite(prev) && prev > 0 ? prev : 0;
    const c = Number.isFinite(current) && current > 0 ? current : 0;
    return { best: Math.max(p, c), beat: c > p };
  }

  const api = { pickHider, makeHint, starsForWrongTaps, levelPoints, bestScore };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) global.CatCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
