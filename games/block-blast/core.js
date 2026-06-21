/* ブロックブラスト — コアロジック（DOM非依存・テスト可能） */
(function (global) {
  const N = 8;

  const COLORS = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa', '#f783ac', '#3bc9db'];

  const SHAPES = [
    [[0, 0]],
    [[0, 0], [0, 1]],
    [[0, 0], [1, 0]],
    [[0, 0], [0, 1], [0, 2]],
    [[0, 0], [1, 0], [2, 0]],
    [[0, 0], [0, 1], [0, 2], [0, 3]],
    [[0, 0], [1, 0], [2, 0], [3, 0]],
    [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
    [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
    [[0, 0], [0, 1], [1, 0], [1, 1]],
    [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]],
    [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]],
    [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]],
    [[0, 0], [1, 0], [1, 1]],
    [[0, 1], [1, 0], [1, 1]],
    [[0, 0], [0, 1], [1, 1]],
    [[0, 0], [0, 1], [1, 0]],
    [[0, 0], [1, 0], [2, 0], [2, 1]],
    [[0, 1], [1, 1], [2, 1], [2, 0]],
    [[0, 0], [0, 1], [0, 2], [1, 0]],
    [[0, 0], [0, 1], [0, 2], [1, 2]],
    [[0, 0], [1, 0], [1, 1], [2, 1]],
    [[0, 1], [1, 0], [1, 1], [2, 0]],
    [[0, 0], [0, 1], [1, 1], [1, 2]],
    [[1, 0], [1, 1], [0, 1], [0, 2]],
    [[0, 0], [0, 1], [0, 2], [1, 1]],
    [[0, 1], [1, 0], [1, 1], [2, 1]],
  ];
  const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function normalize(shape) {
    const minR = Math.min(...shape.map(s => s[0]));
    const minC = Math.min(...shape.map(s => s[1]));
    return shape.map(([r, c]) => [r - minR, c - minC]);
  }
  function dims(shape) {
    return [Math.max(...shape.map(s => s[0])) + 1, Math.max(...shape.map(s => s[1])) + 1];
  }
  function makeGrid() { return Array.from({ length: N }, () => Array(N).fill(null)); }

  function canPlace(grid, shape, r, c) {
    for (const [dr, dc] of shape) {
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || rr >= N || cc < 0 || cc >= N) return false;
      if (grid[rr][cc]) return false;
    }
    return true;
  }

  // 完成している行・列を返す
  function fullLines(grid) {
    const rows = [], cols = [];
    for (let r = 0; r < N; r++) if (grid[r].every(v => v)) rows.push(r);
    for (let c = 0; c < N; c++) { let f = true; for (let r = 0; r < N; r++) if (!grid[r][c]) { f = false; break; } if (f) cols.push(c); }
    return { rows, cols, count: rows.length + cols.length };
  }

  // 1配置ぶんの得点（連鎖 streak でボーナス）
  function scoreForClear(lines, streak) {
    if (lines <= 0) return 0;
    const base = lines * 10 + (lines - 1) * 5 * lines;     // 同時消しコンボ
    const chain = Math.max(0, streak - 1) * 10;            // 連鎖ボーナス
    return base + chain;
  }

  // 評価関数（ヒント／プレイヤー判断材料）
  function evaluateAt(grid, shape, r, c) {
    const g = grid.map(row => row.map(v => !!v));
    for (const [dr, dc] of shape) g[r + dr][c + dc] = true;

    const cRows = [], cCols = [];
    for (let i = 0; i < N; i++) if (g[i].every(v => v)) cRows.push(i);
    for (let j = 0; j < N; j++) { let f = true; for (let i = 0; i < N; i++) if (!g[i][j]) { f = false; break; } if (f) cCols.push(j); }
    const lines = cRows.length + cCols.length;

    let score = 0;
    score += lines * 30;
    if (lines >= 2) score += (lines - 1) * 20;

    let adj = 0;
    for (const [dr, dc] of shape) {
      const rr = r + dr, cc = c + dc;
      for (const [a, b] of NB) {
        const nr = rr + a, nc = cc + b;
        if (nr < 0 || nr >= N || nc < 0 || nc >= N) adj++;
        else if (grid[nr][nc]) adj++;
      }
    }
    score += adj * 2;

    const g2 = g.map(row => row.slice());
    cRows.forEach(i => { for (let j = 0; j < N; j++) g2[i][j] = false; });
    cCols.forEach(j => { for (let i = 0; i < N; i++) g2[i][j] = false; });

    let holes = 0, tight = 0, filled = 0;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      if (g2[i][j]) { filled++; continue; }
      let f = 0;
      for (const [a, b] of NB) { const ni = i + a, nj = j + b; if (ni < 0 || ni >= N || nj < 0 || nj >= N || g2[ni][nj]) f++; }
      if (f === 4) holes++;
      else if (f === 3) tight++;
    }
    score -= holes * 15 + tight * 3;
    score -= filled * 0.5;

    return { score: Math.round(score), lines };
  }

  // 未使用ピース（shape配列）のどれかが盤に置けるか
  function anyMovePossible(grid, shapes) {
    for (const shape of shapes) {
      if (!shape) continue;
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (canPlace(grid, shape, r, c)) return true;
    }
    return false;
  }

  // ランダムなピース1個（1x2/2x1 は常に除外、1x1 は allowSingle のときのみ）
  function randomPiece(rng, allowSingle) {
    const r = rng || Math.random;
    const pool = SHAPES.filter(s => s.length !== 2 && (allowSingle || s.length > 1));
    const shape = normalize(pool[Math.floor(r() * pool.length)]);
    const color = COLORS[Math.floor(r() * COLORS.length)];
    return { shape, color, used: false };
  }

  const api = { N, COLORS, SHAPES, NB, normalize, dims, makeGrid, canPlace, fullLines, scoreForClear, evaluateAt, anyMovePossible, randomPiece };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) global.BlockCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
