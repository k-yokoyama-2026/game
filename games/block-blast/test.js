/* ブロックブラスト — コアロジックのテスト */
const C = require('./core.js');
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('  ✗ FAIL: ' + m); } }
function section(n) { console.log('\n# ' + n); }
function seededRng(seed) { let s = seed >>> 0; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }

section('ピース定義');
ok(C.N === 8, '盤は8x8');
ok(C.SHAPES.length > 10, 'ピースが複数定義');
{
  const norm = C.normalize([[2, 3], [2, 4]]);
  ok(norm[0][0] === 0 && norm[0][1] === 0, 'normalizeで左上が(0,0)');
  const d = C.dims([[0, 0], [0, 1], [1, 0]]);
  ok(d[0] === 2 && d[1] === 2, 'dimsで縦横サイズ');
}

section('配置の可否');
{
  const g = C.makeGrid();
  ok(C.canPlace(g, [[0, 0], [0, 1]], 0, 0) === true, '空き盤に置ける');
  ok(C.canPlace(g, [[0, 0]], 7, 7) === true, '端に置ける');
  ok(C.canPlace(g, [[0, 0]], 8, 0) === false, '盤外は置けない');
  ok(C.canPlace(g, [[0, 0], [0, 1]], 0, 7) === false, 'はみ出しは置けない');
  g[0][0] = '#fff';
  ok(C.canPlace(g, [[0, 0]], 0, 0) === false, '埋まったマスには置けない');
}

section('ライン検出と消去');
{
  const g = C.makeGrid();
  for (let c = 0; c < C.N; c++) g[3][c] = '#fff'; // 3行目を埋める
  const fl = C.fullLines(g);
  ok(fl.rows.length === 1 && fl.rows[0] === 3, '埋めた行を検出');
  ok(fl.count === 1, '完成ライン数=1');

  const g2 = C.makeGrid();
  for (let i = 0; i < C.N; i++) { g2[2][i] = '#fff'; g2[i][5] = '#fff'; } // 1行+1列（十字）
  ok(C.fullLines(g2).count === 2, '行＋列で2ライン');
}

section('スコアと連鎖');
{
  ok(C.scoreForClear(0, 0) === 0, '0ラインは0点');
  ok(C.scoreForClear(1, 1) === 10, '1ライン・連鎖1は10点');
  ok(C.scoreForClear(2, 1) > C.scoreForClear(1, 1), '2ライン同時は1ラインより高得点');
  ok(C.scoreForClear(1, 3) > C.scoreForClear(1, 1), '連鎖が続くほど高得点');
  ok(C.scoreForClear(1, 5) - C.scoreForClear(1, 4) === 10, '連鎖ボーナスは1段あたり+10');
}

section('評価関数');
{
  const g = C.makeGrid();
  for (let c = 0; c < C.N - 1; c++) g[0][c] = '#fff'; // 0行目をあと1マスで完成
  const fill = C.evaluateAt(g, [[0, 0]], 0, 7); // 最後の1マスを埋める＝1ライン消し
  ok(fill.lines === 1, '完成させる配置はlines=1');
  const noClear = C.evaluateAt(g, [[0, 0]], 5, 5); // 関係ない場所
  ok(fill.score > noClear.score, 'ライン消し配置のほうが高評価');
}

section('手詰まり判定');
{
  const empty = C.makeGrid();
  ok(C.anyMovePossible(empty, [[[0, 0]]]) === true, '空き盤なら置ける');
  // 盤を完全に埋める → どこにも置けない
  const full = C.makeGrid();
  for (let r = 0; r < C.N; r++) for (let c = 0; c < C.N; c++) full[r][c] = '#fff';
  ok(C.anyMovePossible(full, [[[0, 0]]]) === false, '満杯盤は手詰まり');
}

section('ピース生成（1x2/2x1除外・1x1は初回のみ）');
{
  const rng = seededRng(99);
  let sawDomino = false, sawSingle = false;
  for (let i = 0; i < 400; i++) {
    const p = C.randomPiece(rng, false);
    if (p.shape.length === 2) sawDomino = true;
    if (p.shape.length === 1) sawSingle = true;
  }
  ok(!sawDomino, '通常配布で2マスの駒(1x2/2x1)は出ない');
  ok(!sawSingle, '通常配布で1x1は出ない');
  let sawSingleFirst = false;
  for (let i = 0; i < 400; i++) { if (C.randomPiece(rng, true).shape.length === 1) { sawSingleFirst = true; break; } }
  ok(sawSingleFirst, '初回配布(allowSingle)では1x1が出る');
}

section('擬似プレイ：連鎖でスコアが伸びる');
{
  // 行を1マス残しで複数用意し、連続で消して連鎖ボーナスを確認
  let grid = C.makeGrid();
  for (let r = 0; r < 3; r++) for (let c = 0; c < C.N - 1; c++) grid[r][c] = '#fff';
  let score = 0, streak = 0;
  for (let r = 0; r < 3; r++) {
    // (r,7) に 1マス置く
    grid[r][7] = '#fff';
    const fl = C.fullLines(grid);
    if (fl.count > 0) {
      streak++;
      score += C.scoreForClear(fl.count, streak);
      fl.rows.forEach(i => { for (let j = 0; j < C.N; j++) grid[i][j] = null; });
      fl.cols.forEach(j => { for (let i = 0; i < C.N; i++) grid[i][j] = null; });
    } else streak = 0;
  }
  ok(streak === 3, '3連鎖した');
  ok(score > C.scoreForClear(1, 1) * 3, '連鎖ぶんスコアが上乗せされた: ' + score);
}

console.log('\n=====================================');
console.log(`  PASS: ${pass}  FAIL: ${fail}`);
console.log('=====================================');
process.exit(fail === 0 ? 0 : 1);
