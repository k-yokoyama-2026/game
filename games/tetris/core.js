/* テトリス — コアロジック（DOM非依存・テスト可能） */
(function (global) {
  const COLS = 10;
  const ROWS = 20;

  const TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

  const COLORS = {
    I: '#4dd7f0',
    O: '#ffd43b',
    T: '#b06bf0',
    S: '#69db7c',
    Z: '#ff6b6b',
    J: '#4d7bf0',
    L: '#ffa94d',
  };

  // 各ミノの4回転ぶんの相対座標 [row, col]（ガイドライン準拠のスポーン向き）
  const SHAPES = {
    I: [
      [[1, 0], [1, 1], [1, 2], [1, 3]],
      [[0, 2], [1, 2], [2, 2], [3, 2]],
      [[2, 0], [2, 1], [2, 2], [2, 3]],
      [[0, 1], [1, 1], [2, 1], [3, 1]],
    ],
    O: [
      [[0, 1], [0, 2], [1, 1], [1, 2]],
      [[0, 1], [0, 2], [1, 1], [1, 2]],
      [[0, 1], [0, 2], [1, 1], [1, 2]],
      [[0, 1], [0, 2], [1, 1], [1, 2]],
    ],
    T: [
      [[0, 1], [1, 0], [1, 1], [1, 2]],
      [[0, 1], [1, 1], [1, 2], [2, 1]],
      [[1, 0], [1, 1], [1, 2], [2, 1]],
      [[0, 1], [1, 0], [1, 1], [2, 1]],
    ],
    S: [
      [[0, 1], [0, 2], [1, 0], [1, 1]],
      [[0, 1], [1, 1], [1, 2], [2, 2]],
      [[1, 1], [1, 2], [2, 0], [2, 1]],
      [[0, 0], [1, 0], [1, 1], [2, 1]],
    ],
    Z: [
      [[0, 0], [0, 1], [1, 1], [1, 2]],
      [[0, 2], [1, 1], [1, 2], [2, 1]],
      [[1, 0], [1, 1], [2, 1], [2, 2]],
      [[0, 1], [1, 0], [1, 1], [2, 0]],
    ],
    J: [
      [[0, 0], [1, 0], [1, 1], [1, 2]],
      [[0, 1], [0, 2], [1, 1], [2, 1]],
      [[1, 0], [1, 1], [1, 2], [2, 2]],
      [[0, 1], [1, 1], [2, 0], [2, 1]],
    ],
    L: [
      [[0, 2], [1, 0], [1, 1], [1, 2]],
      [[0, 1], [1, 1], [2, 1], [2, 2]],
      [[1, 0], [1, 1], [1, 2], [2, 0]],
      [[0, 0], [0, 1], [1, 1], [2, 1]],
    ],
  };

  // 回転時に横ずれ（壁けり）を試す順番
  const KICKS = [[0, 0], [0, -1], [0, 1], [0, -2], [0, 2], [-1, 0]];

  function makeGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  // 出現直後のミノ。上端中央から出す。
  function spawn(type) {
    return { type, rot: 0, r: 0, c: 3 };
  }

  // ミノの絶対座標（盤面のマス）を返す
  function blocks(piece) {
    return SHAPES[piece.type][piece.rot & 3].map(([dr, dc]) => [piece.r + dr, piece.c + dc]);
  }

  // その配置が盤面と衝突する（はみ出し or 重なり）か
  function collides(grid, piece) {
    for (const [r, c] of blocks(piece)) {
      if (c < 0 || c >= COLS || r >= ROWS) return true;
      if (r >= 0 && grid[r][c]) return true;
    }
    return false;
  }

  // 平行移動を試す。置ければ新しいミノ、無理なら null
  function tryMove(grid, piece, dr, dc) {
    const np = { type: piece.type, rot: piece.rot, r: piece.r + dr, c: piece.c + dc };
    return collides(grid, np) ? null : np;
  }

  // 回転を試す（壁けりつき）。dir: +1で右回り、-1で左回り
  function tryRotate(grid, piece, dir) {
    const nrot = (piece.rot + (dir > 0 ? 1 : 3)) & 3;
    for (const [dr, dc] of KICKS) {
      const np = { type: piece.type, rot: nrot, r: piece.r + dr, c: piece.c + dc };
      if (!collides(grid, np)) return np;
    }
    return null;
  }

  // 落下できる一番下までミノを落とした状態を返す
  function ghost(grid, piece) {
    let p = piece;
    while (true) {
      const n = tryMove(grid, p, 1, 0);
      if (!n) return p;
      p = n;
    }
  }

  // ミノを盤面に固定した新しい盤面を返す（元は変更しない）
  function merge(grid, piece) {
    const g = grid.map(row => row.slice());
    for (const [r, c] of blocks(piece)) {
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) g[r][c] = COLORS[piece.type];
    }
    return g;
  }

  // 揃った行を消して詰める。{ grid, rows, count } を返す
  function clearLines(grid) {
    const rows = [];
    for (let r = 0; r < ROWS; r++) {
      if (grid[r].every(v => v)) rows.push(r);
    }
    if (rows.length === 0) return { grid, rows, count: 0 };
    const kept = grid.filter((_, r) => !rows.includes(r));
    while (kept.length < ROWS) kept.unshift(Array(COLS).fill(null));
    return { grid: kept, rows, count: rows.length };
  }

  // 消した行数×レベルの得点（1/2/3/4列でシングル〜テトリス）
  function scoreForLines(count, level) {
    const base = [0, 100, 300, 500, 800][count] || 0;
    return base * (level || 1);
  }

  // 消した合計行数からレベル（10行ごとに1レベル）
  function levelFor(totalLines) {
    return 1 + Math.floor(totalLines / 10);
  }

  // レベルごとの落下間隔（ミリ秒）。レベルが上がるほど速い
  function dropInterval(level) {
    return Math.max(80, 800 - (level - 1) * 65);
  }

  // 7種を1袋に詰めてシャッフルした順番（フィッシャー–イェーツ）
  function newBag(rng) {
    const bag = TYPES.slice();
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor((rng ? rng() : Math.random()) * (i + 1));
      const t = bag[i]; bag[i] = bag[j]; bag[j] = t;
    }
    return bag;
  }

  const api = {
    COLS, ROWS, TYPES, COLORS, SHAPES, KICKS,
    makeGrid, spawn, blocks, collides, tryMove, tryRotate,
    ghost, merge, clearLines, scoreForLines, levelFor, dropInterval, newBag,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) global.TetrisCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
