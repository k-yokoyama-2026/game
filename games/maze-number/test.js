/* 数字迷路 — コアロジックのテスト */
const C = require('./core.js');
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('  ✗ FAIL: ' + m); } }
function section(n) { console.log('\n# ' + n); }
function seededRng(seed) { let s = seed >>> 0; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }

section('レベル設定');
{
  const c1 = C.getLevelConfig(1);
  ok(c1.cols % 2 === 1 && c1.rows % 2 === 1, '迷路サイズは奇数');
  ok(c1.enemyCount === 0, 'レベル1は敵なし');
  ok(C.getLevelConfig(3).enemyCount === 1, 'レベル3から敵が出る');
  ok(C.getLevelConfig(6).enemyEvery === 1 && C.getLevelConfig(3).enemyEvery === 2, '高レベルほど敵が速い');
  ok(C.getLevelConfig(10).cols >= C.getLevelConfig(1).cols, 'レベルで迷路が大きくなる');
  ok(C.getLevelConfig(100).cols <= 45, '迷路サイズに上限');
}

section('迷路生成');
{
  const m = C.generateMaze(11, 11, seededRng(1));
  ok(m.length === 11 && m[0].length === 11, '指定サイズで生成');
  ok(m[1][1] === C.PATH, 'スタート(1,1)は通路');
  ok(m[0][0] === C.WALL && m[0][5] === C.WALL, '外周は壁');
  ok(C.isConnected(m), '全通路が連結している');
  // 別シードでも連結
  ok(C.isConnected(C.generateMaze(21, 17, seededRng(123))), '大きい迷路でも連結');
}

section('数字ルール');
{
  ok(C.applyNumber(2, 1).dead === false, '小さい数字は取れる');
  ok(C.applyNumber(2, 1).newNum === 3, '取ると成長(2+1=3)');
  ok(C.applyNumber(2, 2).dead === true, '同じ数字はアウト');
  ok(C.applyNumber(5, 9).dead === true, '大きい数字はアウト');
}

section('敵の追跡（BFS）');
{
  // 1行の通路: P . . . . E  → 敵は左に1歩寄る
  const maze = [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1],
  ];
  const player = [1, 1], enemy = [5, 1];
  const step = C.bfsNextStep(maze, enemy, player);
  ok(step[0] === 4 && step[1] === 1, '敵はプレイヤーへ1歩近づく');
  // すでに隣 → プレイヤーマスへ
  const step2 = C.bfsNextStep(maze, [2, 1], [1, 1]);
  ok(step2[0] === 1 && step2[1] === 1, '隣接なら捕まえる');
  // 同じ位置
  const step3 = C.bfsNextStep(maze, [3, 1], [3, 1]);
  ok(step3[0] === 3 && step3[1] === 1, '同じ位置なら動かない');
}

section('追跡で距離が縮む（擬似プレイ）');
{
  const maze = C.generateMaze(15, 15, seededRng(7));
  const cells = C.pathCells(maze);
  let player = [1, 1];
  // プレイヤーから一番遠い通路に敵を置く
  let enemy = cells.reduce((a, b) => (C.dist(b, player) > C.dist(a, player) ? b : a), cells[0]).slice();
  const startD = C.dist(player, enemy);
  // プレイヤーは動かず、敵だけ追跡を続ける → いつか捕まえる
  let caught = false;
  for (let i = 0; i < 500; i++) {
    enemy = C.bfsNextStep(maze, enemy, player);
    if (enemy[0] === player[0] && enemy[1] === player[1]) { caught = true; break; }
  }
  ok(startD > 0, '初期距離 > 0');
  ok(caught, '追跡し続ければ必ず捕まえられる（経路が存在）');
}

console.log('\n=====================================');
console.log(`  PASS: ${pass}  FAIL: ${fail}`);
console.log('=====================================');
process.exit(fail === 0 ? 0 : 1);
