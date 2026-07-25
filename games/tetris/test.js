/* テトリス — コアロジックのテスト */
const C = require('./core.js');
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('  ✗ FAIL: ' + m); } }
function section(n) { console.log('\n# ' + n); }
function seededRng(seed) { let s = seed >>> 0; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }

section('盤とピース定義');
ok(C.COLS === 10 && C.ROWS === 20, '盤は10x20');
ok(C.TYPES.length === 7, 'テトロミノは7種');
ok(C.TYPES.every(t => C.PIECES[t] && C.PIECES[t].color), '各ピースに色が定義されている');
{
  const oCells = C.cellsOf(C.pieceMatrix('O'));
  ok(oCells.length === 4, 'Oピースは4マス');
  ok(C.cellsOf(C.pieceMatrix('I')).length === 4, 'Iピースは4マス');
  ok(C.cellsOf(C.pieceMatrix('T')).length === 4, 'Tピースは4マス');
}

section('回転');
{
  const t = C.pieceMatrix('T');
  const r1 = C.rotateCW(t);
  ok(C.cellsOf(r1).length === 4, '回転してもマス数は4のまま');
  // 4回まわすと元に戻る
  const back = C.rotateCW(C.rotateCW(C.rotateCW(C.rotateCW(t))));
  ok(JSON.stringify(back) === JSON.stringify(t), 'CW4回で元に戻る');
  // CWのあとCCWで元に戻る
  ok(JSON.stringify(C.rotateCCW(C.rotateCW(t))) === JSON.stringify(t), 'CW→CCWで元に戻る');
  // Oピースは回転しても不変
  const o = C.pieceMatrix('O');
  ok(JSON.stringify(C.rotateCW(o)) === JSON.stringify(o), 'Oは回転しても同じ');
}

section('配置の可否');
{
  const g = C.makeGrid();
  const t = C.pieceMatrix('T');
  ok(C.valid(g, t, 0, C.spawnCol(t)) === true, '空き盤の出現位置に置ける');
  ok(C.valid(g, t, -1, 3) === true, '天井より上は許容される');
  ok(C.valid(g, t, C.ROWS, 3) === false, '床より下は置けない');
  ok(C.valid(g, t, 0, -2) === false, '左にはみ出しは置けない');
  ok(C.valid(g, t, 0, C.COLS) === false, '右にはみ出しは置けない');
  g[5][4] = '#fff';
  // Tの中央下マスがぶつかる位置
  ok(C.valid(g, t, 4, 3) === false, '既存ブロックと重なる位置は置けない');
}

section('固定とライン消去');
{
  let g = C.makeGrid();
  const o = C.pieceMatrix('O');
  g = C.merge(g, o, 18, 0, '#ffd43b');
  ok(g[18][0] === '#ffd43b' && g[19][1] === '#ffd43b', 'mergeでピースが盤に固定される');

  // 最下段を1マス残して埋める → 未完成
  let g2 = C.makeGrid();
  for (let c = 0; c < C.COLS - 1; c++) g2[19][c] = '#fff';
  ok(C.fullRows(g2).length === 0, '1マス空きは未完成');
  g2[19][C.COLS - 1] = '#fff';
  ok(C.fullRows(g2).length === 1 && C.fullRows(g2)[0] === 19, '全部埋めると完成行を検出');

  const res = C.clearRows(g2);
  ok(res.cleared === 1, '1行消える');
  ok(res.grid.length === C.ROWS, '消去後も行数は20のまま');
  ok(res.grid[19].every(v => v === null), '消去後の最下段は空');
}

section('複数ライン消去でブロックが落ちる');
{
  let g = C.makeGrid();
  // 18,19行目を満杯に、17行目に1マスだけ乗せる
  for (let c = 0; c < C.COLS; c++) { g[18][c] = '#fff'; g[19][c] = '#fff'; }
  g[17][3] = '#abc';
  const res = C.clearRows(g);
  ok(res.cleared === 2, '2行同時に消える');
  ok(res.grid[19][3] === '#abc', '上に乗っていたブロックが最下段まで落ちる');
  ok(res.grid[18].every(v => v === null), '消えた分だけ空行が上に補充される');
}

section('スコアとレベル');
{
  ok(C.scoreForLines(0, 1) === 0, '0ラインは0点');
  ok(C.scoreForLines(1, 1) === 100, 'シングルは100点(Lv1)');
  ok(C.scoreForLines(4, 1) === 800, 'テトリス(4)は800点');
  ok(C.scoreForLines(4, 1) > C.scoreForLines(1, 1) * 4, '4ライン同時は1ライン×4より高得点');
  ok(C.scoreForLines(1, 3) === 300, 'レベルが上がると同じライン数でも高得点');

  ok(C.levelFor(0) === 1, '開始はレベル1');
  ok(C.levelFor(9) === 1, '9ラインまではレベル1');
  ok(C.levelFor(10) === 2, '10ラインでレベル2');
  ok(C.levelFor(25) === 3, '25ラインでレベル3');

  ok(C.dropInterval(1) > C.dropInterval(2), 'レベルが上がると落下が速くなる');
  ok(C.dropInterval(100) >= 80, '落下間隔には下限がある');
}

section('ゴースト位置');
{
  const g = C.makeGrid();
  const o = C.pieceMatrix('O');
  const gr = C.ghostRow(g, o, 0, 0);
  ok(gr === C.ROWS - 2, '空き盤ではゴーストは一番下(2マス高の分)');
  const g2 = C.makeGrid();
  for (let c = 0; c < C.COLS; c++) g2[19][c] = '#fff'; // 最下段が埋まっている
  ok(C.ghostRow(g2, o, 0, 0) === C.ROWS - 3, '床にブロックがあればその上で止まる');
}

section('7-bag');
{
  const b = C.bag(seededRng(1));
  ok(b.length === 7, '1バッグは7ピース');
  ok(new Set(b).size === 7, '1バッグに7種すべてが1回ずつ');
  ok(C.TYPES.every(t => b.includes(t)), '全種類が含まれる');
  // 同じシードなら同じ順、別シードなら基本的に別順
  ok(JSON.stringify(C.bag(seededRng(1))) === JSON.stringify(b), '同じシードは同じ並び');
}

console.log('\n=====================================');
console.log(`  TEST PASS: ${pass}  FAIL: ${fail}`);
console.log('=====================================');
process.exit(fail === 0 ? 0 : 1);
