/* 八事ウォーク（位置ゲー）— コアロジック（DOM非依存・テスト可能） */
(function (global) {
  const EARTH_R = 6371000; // m
  const COMBO_WINDOW_MS = 5 * 60 * 1000; // 5分以内に次のCPでコンボ継続
  const DEFAULT_RADIUS = 45; // m 到達判定半径

  function toRad(d) { return d * Math.PI / 180; }

  // 2点間の距離（メートル, Haversine）
  function haversine(lat1, lng1, lat2, lng2) {
    const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_R * Math.asin(Math.min(1, Math.sqrt(a)));
  }

  // 現在地に一番近いチェックポイント
  function nearest(pos, checkpoints) {
    let best = -1, bestD = Infinity;
    checkpoints.forEach((c, i) => {
      const d = haversine(pos.lat, pos.lng, c.lat, c.lng);
      if (d < bestD) { bestD = d; best = i; }
    });
    return { index: best, dist: bestD };
  }

  function withinRadius(dist, radius) { return dist <= (radius == null ? DEFAULT_RADIUS : radius); }

  // 直前の取得からの時間でコンボ継続を判定
  function comboFor(lastTime, now, prevCombo, windowMs) {
    const w = windowMs == null ? COMBO_WINDOW_MS : windowMs;
    if (lastTime > 0 && now - lastTime <= w) return prevCombo + 1;
    return 1;
  }

  // 獲得点：基礎点＋コンボボーナス（コンボ2連目以降に+20ずつ）
  function scoreForVisit(basePoints, combo) { return basePoints + Math.max(0, combo - 1) * 20; }

  function allVisited(visitedCount, total) { return total > 0 && visitedCount >= total; }

  // 現在地で1つチェックポイントを獲得できるか評価（純粋関数）
  // state: { visited:Set<number>, score, combo, lastTime }
  function evaluateVisit(state, pos, checkpoints, opts) {
    opts = opts || {};
    const radius = opts.radius == null ? DEFAULT_RADIUS : opts.radius;
    const now = opts.now == null ? Date.now() : opts.now;
    const { index, dist } = nearest(pos, checkpoints);
    if (index < 0 || state.visited.has(index) || !withinRadius(dist, radius)) {
      return { collected: false, index, dist };
    }
    const combo = comboFor(state.lastTime, now, state.combo);
    const cp = checkpoints[index];
    const points = scoreForVisit(cp.points || 100, combo);
    const visitedCount = state.visited.size + 1;
    let total = points;
    const done = allVisited(visitedCount, checkpoints.length);
    if (done) total += 500; // 全制覇ボーナス
    return {
      collected: true, index, dist, combo, points: total,
      score: state.score + total, allDone: done, now,
    };
  }

  const api = {
    EARTH_R, COMBO_WINDOW_MS, DEFAULT_RADIUS,
    haversine, nearest, withinRadius, comboFor, scoreForVisit, allVisited, evaluateVisit,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) global.YagotoCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
