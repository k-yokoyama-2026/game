/* 数字迷路 — コアロジック（DOM非依存・テスト可能） */
(function (global) {
  const WALL = 1, PATH = 0;

  function getLevelConfig(lv) {
    const baseCols = 7 + Math.floor(lv * 1.4);
    const baseRows = 7 + Math.floor(lv * 1.2);
    const c = Math.min(baseCols, 45);
    const r = Math.min(baseRows, 37);
    const mc = c % 2 === 0 ? c + 1 : c;
    const mr = r % 2 === 0 ? r + 1 : r;
    const numCount = 3 + Math.floor(lv * 1.5);
    const maxNum = Math.min(2 + lv * 3, 80);
    // 追いかけてくる敵（おに）：レベル3から登場、上のレベルほど速い
    const enemyCount = lv >= 3 ? 1 : 0;
    const enemyEvery = lv >= 6 ? 1 : 2; // 何手ごとに1歩動くか
    return { cols: mc, rows: mr, numCount, maxNum, enemyCount, enemyEvery };
  }

  function generateMaze(c, r, rng) {
    const rand = rng || Math.random;
    const grid = [];
    for (let y = 0; y < r; y++) { grid[y] = []; for (let x = 0; x < c; x++) grid[y][x] = WALL; }
    const stack = [];
    grid[1][1] = PATH; stack.push([1, 1]);
    const dirs = [[0, -2], [0, 2], [-2, 0], [2, 0]];
    while (stack.length > 0) {
      const [cx, cy] = stack[stack.length - 1];
      const shuffled = dirs.slice().sort(() => rand() - 0.5);
      let found = false;
      for (const [dx, dy] of shuffled) {
        const nx = cx + dx, ny = cy + dy;
        if (nx > 0 && nx < c - 1 && ny > 0 && ny < r - 1 && grid[ny][nx] === WALL) {
          grid[cy + dy / 2][cx + dx / 2] = PATH;
          grid[ny][nx] = PATH;
          stack.push([nx, ny]);
          found = true; break;
        }
      }
      if (!found) stack.pop();
    }
    if (c > 15 || r > 15) {
      const extra = Math.floor((c * r) / 40);
      for (let i = 0; i < extra; i++) {
        const wx = 1 + Math.floor(rand() * (c - 2));
        const wy = 1 + Math.floor(rand() * (r - 2));
        if (grid[wy][wx] === WALL) {
          let p = 0;
          if (wy > 0 && grid[wy - 1][wx] === PATH) p++;
          if (wy < r - 1 && grid[wy + 1][wx] === PATH) p++;
          if (wx > 0 && grid[wy][wx - 1] === PATH) p++;
          if (wx < c - 1 && grid[wy][wx + 1] === PATH) p++;
          if (p >= 2) grid[wy][wx] = PATH;
        }
      }
    }
    return grid;
  }

  function dist(a, b) { return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]); }

  function pathCells(maze) {
    const out = [];
    for (let y = 0; y < maze.length; y++) for (let x = 0; x < maze[0].length; x++) if (maze[y][x] === PATH) out.push([x, y]);
    return out;
  }

  // from から to へ最短で1歩進む次のマス（BFS）。進めなければ from を返す。
  function bfsNextStep(maze, from, to) {
    const R = maze.length, Cc = maze[0].length;
    if (from[0] === to[0] && from[1] === to[1]) return from.slice();
    const dist2 = Array.from({ length: R }, () => Array(Cc).fill(-1));
    const q = [to]; dist2[to[1]][to[0]] = 0;
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of dirs) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= Cc || ny < 0 || ny >= R) continue;
        if (maze[ny][nx] === WALL) continue;
        if (dist2[ny][nx] !== -1) continue;
        dist2[ny][nx] = dist2[y][x] + 1;
        q.push([nx, ny]);
      }
    }
    let best = from, bestD = dist2[from[1]][from[0]];
    if (bestD === -1) return from.slice();
    for (const [dx, dy] of dirs) {
      const nx = from[0] + dx, ny = from[1] + dy;
      if (nx < 0 || nx >= Cc || ny < 0 || ny >= R) continue;
      if (maze[ny][nx] === WALL) continue;
      const d = dist2[ny][nx];
      if (d !== -1 && d < bestD) { bestD = d; best = [nx, ny]; }
    }
    return best.slice ? best.slice() : best;
  }

  // 数字に触れたときの結果：自分以上ならアウト、未満なら吸収して成長
  function applyNumber(playerNum, val) {
    if (val >= playerNum) return { dead: true, newNum: playerNum };
    return { dead: false, newNum: playerNum + val };
  }

  // 全PATHマスが (1,1) から到達可能か（連結性チェック）
  function isConnected(maze) {
    const all = pathCells(maze);
    if (!all.length) return false;
    const R = maze.length, Cc = maze[0].length;
    const seen = Array.from({ length: R }, () => Array(Cc).fill(false));
    const q = [[1, 1]]; seen[1][1] = true; let cnt = 1;
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of dirs) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= Cc || ny < 0 || ny >= R) continue;
        if (maze[ny][nx] === WALL || seen[ny][nx]) continue;
        seen[ny][nx] = true; cnt++; q.push([nx, ny]);
      }
    }
    return cnt === all.length;
  }

  const api = { WALL, PATH, getLevelConfig, generateMaze, dist, pathCells, bfsNextStep, applyNumber, isConnected };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) global.MazeCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
