/* テトリス — コアロジック（DOM非依存・テスト可能） */
(function (global) {
  const COLS = 10;
  const ROWS = 20;

  // 各テトロミノの出現時の形（正方行列）と色。'1' が埋まっているマス。
  const PIECES = {
    I: { color: '#4dd2ff', m: ['0000', '1111', '0000', '0000'] },
    O: { color: '#ffd43b', m: ['11', '11'] },
    T: { color: '#b083f0', m: ['010', '111', '000'] },
    S: { color: '#69db7c', m: ['011', '110', '000'] },
    Z: { color: '#ff6b6b', m: ['110', '011', '000'] },
    J: { color: '#4dabf7', m: ['100', '111', '000'] },
    L: { color: '#ffa94d', m: ['001', '111', '000'] },
  };
  const TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

  // 文字列表現 -> 0/1 の2次元配列
  function toMatrix(rows) {
    return rows.map(r => r.split('').map(ch => (ch === '1' ? 1 : 0)));
  }
  function pieceMatrix(type) { return toMatrix(PIECES[type].m); }

  // 正方行列を時計回りに90°回転
  function rotateCW(m) {
    const n = m.length;
    const out = Array.from({ length: n }, () => Array(n).fill(0));
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) out[c][n - 1 - r] = m[r][c];
    return out;
  }
  // 反時計回りに90°回転
  function rotateCCW(m) {
    const n = m.length;
    const out = Array.from({ length: n }, () => Array(n).fill(0));
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) out[n - 1 - c][r] = m[r][c];
    return out;
  }

  // 行列内の埋まっているマスの座標 [r,c] 一覧
  function cellsOf(m) {
    const out = [];
    for (let r = 0; r < m.length; r++) for (let c = 0; c < m[r].length; c++) if (m[r][c]) out.push([r, c]);
    return out;
  }

  function makeGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  // 行列 m を盤の (row,col) を左上として置けるか。天井より上(rr<0)は許容。
  function valid(grid, m, row, col) {
    for (const [dr, dc] of cellsOf(m)) {
      const rr = row + dr, cc = col + dc;
      if (cc < 0 || cc >= COLS) return false;      // 横のはみ出し
      if (rr >= ROWS) return false;                // 床の下
      if (rr >= 0 && grid[rr][cc]) return false;   // 既存ブロックと重なり
    }
    return true;
  }

  // ピースを盤に固定した新しい盤を返す（元の盤は変更しない）
  function merge(grid, m, row, col, color) {
    const g = grid.map(r => r.slice());
    for (const [dr, dc] of cellsOf(m)) {
      const rr = row + dr, cc = col + dc;
      if (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS) g[rr][cc] = color;
    }
    return g;
  }

  // すべて埋まっている行の番号一覧
  function fullRows(grid) {
    const rows = [];
    for (let r = 0; r < ROWS; r++) if (grid[r].every(v => v)) rows.push(r);
    return rows;
  }

  // 揃った行を消し、上に空行を足した盤を返す
  function clearRows(grid) {
    const kept = grid.filter(row => !row.every(v => v));
    const cleared = ROWS - kept.length;
    const empty = Array.from({ length: cleared }, () => Array(COLS).fill(null));
    return { grid: empty.concat(kept), cleared };
  }

  // 消したライン数×レベルの得点（1=100, 2=300, 3=500, 4=800 が基準）
  function scoreForLines(lines, level) {
    const table = [0, 100, 300, 500, 800];
    const base = table[Math.max(0, Math.min(4, lines))] || 0;
    return base * Math.max(1, level);
  }

  // 消した総ライン数からレベル（10ラインごとに1つ上がる、1始まり）
  function levelFor(totalLines) {
    return 1 + Math.floor(Math.max(0, totalLines) / 10);
  }

  // レベルに応じた落下間隔(ms)。上がるほど速い。
  function dropInterval(level) {
    return Math.max(80, 800 - (Math.max(1, level) - 1) * 70);
  }

  // ゴースト（ハードドロップ先）の行。現在(row,col)から落とせる一番下。
  function ghostRow(grid, m, row, col) {
    let r = row;
    while (valid(grid, m, r + 1, col)) r++;
    return r;
  }

  // シャッフルした7種1セット（7-bag）。rng は 0..1 の乱数関数。
  function bag(rng) {
    const r = rng || Math.random;
    const arr = TYPES.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  // 出現位置（盤の中央）に置いたときの初期列
  function spawnCol(m) {
    return Math.floor((COLS - m.length) / 2);
  }

  const api = {
    COLS, ROWS, PIECES, TYPES,
    toMatrix, pieceMatrix, rotateCW, rotateCCW, cellsOf,
    makeGrid, valid, merge, fullRows, clearRows,
    scoreForLines, levelFor, dropInterval, ghostRow, bag, spawnCol,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) global.TetrisCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
