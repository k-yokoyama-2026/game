/* テトリス — コアロジックのテスト */
const C = require('./core.js');
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('  ✗ FAIL: ' + m); } }
function section(n) { console.log('\n# ' + n); }
function seededRng(seed) { let s = seed >>> 0; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }

section('盤とミノ定義');
ok(C.COLS === 10 && C.ROWS === 20, '盤は10x20');
ok(C.TYPES.length === 7, 'ミノは7種類');
{
  let allGood = true;
  for (const t of C.TYPES) {
    const states = C.SHAPES[t];
    if (states.length !== 4) allGood = false;
    for (const st of states) if (st.length !== 4) allGood = false;
  }
  ok(allGood, '各ミノは4回転×4ブロック');
  ok(!!C.COLORS.I && !!C.COLORS.L, '各ミノに色がある');
}

section('出現とブロック座標');
{
  const p = C.spawn('T');
  ok(p.type === 'T' && p.rot === 0, 'spawnで向き0');
  const bs = C.blocks(p);
  ok(bs.length === 4, 'blocksは4マス');
  ok(bs.every(([r, c]) => c >= 0 && c < C.COLS), '出現位置は盤内の列');
}

section('衝突判定');
{
  const g = C.makeGrid();
  ok(C.collides(g, C.spawn('O')) === false, '空盤の出現位置は衝突しない');
  // 左端より外
  ok(C.collides(g, { type: 'O', rot: 0, r: 0, c: -2 }) === true, '左にはみ出すと衝突');
  // 右端より外
  ok(C.collides(g, { type: 'O', rot: 0, r: 0, c: C.COLS }) === true, '右にはみ出すと衝突');
  // 底より下
  ok(C.collides(g, { type: 'O', rot: 0, r: C.ROWS, c: 3 }) === true, '底より下は衝突');
  // 既存ブロックと重なる
  g[1][1] = '#fff';
  ok(C.collides(g, { type: 'O', rot: 0, r: 0, c: 0 }) === true, '既存ブロックと重なると衝突');
}

section('平行移動');
{
  const g = C.makeGrid();
  const p = C.spawn('T');
  const left = C.tryMove(g, p, 0, -1);
  ok(left && left.c === p.c - 1, '左に動ける');
  const down = C.tryMove(g, p, 1, 0);
  ok(down && down.r === p.r + 1, '下に動ける');
  // 左端まで寄せたミノはさらに左へ動けない（Oは列1,2が実体なのでc=-1が左端）
  const atEdge = { type: 'O', rot: 0, r: 0, c: -1 };
  ok(C.collides(g, atEdge) === false, '左端に寄せたOは盤内');
  const cannot = C.tryMove(g, atEdge, 0, -1);
  ok(cannot === null, '左端からさらに左は動けない(null)');
}

section('回転');
{
  const g = C.makeGrid();
  const p = C.spawn('T');
  const r1 = C.tryRotate(g, p, 1);
  ok(r1 && r1.rot === 1, '右回転で向き1');
  const r2 = C.tryRotate(g, r1, -1);
  ok(r2 && r2.rot === 0, '左回転で元の向き');
  // Oミノは回しても形が変わらない
  const o = C.spawn('O');
  const or = C.tryRotate(g, o, 1);
  ok(or && or.rot === 1, 'Oも回転状態は進む');
  // 壁けり：右端に寄せたミノを回しても盤内に収まる
  const wall = { type: 'T', rot: 0, r: 5, c: 8 };
  const wr = C.tryRotate(g, wall, 1);
  ok(wr === null || C.blocks(wr).every(([r, c]) => c >= 0 && c < C.COLS), '回転後は盤内 or 不可');
}

section('ゴースト（落下先）');
{
  const g = C.makeGrid();
  const p = C.spawn('O');
  const gh = C.ghost(g, p);
  ok(gh.r > p.r, 'ゴーストは下に落ちる');
  // これ以上は落ちない
  ok(C.tryMove(g, gh, 1, 0) === null, 'ゴーストの下は床');
  // Oミノ(box下端が1)は最下段まで → r = ROWS-2
  ok(gh.r === C.ROWS - 2, 'Oは底まで落ちる');
}

section('固定とライン消去');
{
  let g = C.makeGrid();
  // 最下段を1マス残して埋める
  for (let c = 0; c < C.COLS; c++) if (c !== 0) g[C.ROWS - 1][c] = '#fff';
  // 縦I(rot1)は col中央だが、ここでは直接残り1マスを埋める盤で確認
  let g2 = C.makeGrid();
  for (let c = 0; c < C.COLS; c++) g2[C.ROWS - 1][c] = '#fff';
  const res = C.clearLines(g2);
  ok(res.count === 1 && res.rows[0] === C.ROWS - 1, '揃った行を検出して消す');
  ok(res.grid[C.ROWS - 1].every(v => !v), '消去後は空行');

  // 2行同時消し＋上のブロックが下に詰まる
  let g3 = C.makeGrid();
  for (let c = 0; c < C.COLS; c++) { g3[C.ROWS - 1][c] = '#fff'; g3[C.ROWS - 2][c] = '#fff'; }
  g3[C.ROWS - 3][4] = '#aaa'; // 上に浮くブロック
  const res3 = C.clearLines(g3);
  ok(res3.count === 2, '2行同時消し');
  ok(res3.grid[C.ROWS - 1][4] === '#aaa', '上のブロックが下に詰まる');
}

section('merge は元盤を壊さない');
{
  const g = C.makeGrid();
  const p = { type: 'O', rot: 0, r: 0, c: 0 };
  const g2 = C.merge(g, p);
  ok(g[0][1] === null, '元の盤は変わらない');
  ok(g2[0][1] === C.COLORS.O, '新しい盤にミノが乗る');
}

section('得点・レベル・落下速度');
{
  ok(C.scoreForLines(1, 1) === 100, 'シングル=100');
  ok(C.scoreForLines(4, 1) === 800, 'テトリス=800');
  ok(C.scoreForLines(4, 3) === 2400, '得点はレベル倍');
  ok(C.scoreForLines(0, 5) === 0, '0列は0点');
  ok(C.levelFor(0) === 1, '開始はレベル1');
  ok(C.levelFor(10) === 2, '10行でレベル2');
  ok(C.levelFor(25) === 3, '25行でレベル3');
  ok(C.dropInterval(1) > C.dropInterval(2), 'レベルが上がると速くなる');
  ok(C.dropInterval(100) >= 80, '落下間隔には下限がある');
}

section('7-bag ランダマイザ');
{
  const rng = seededRng(42);
  const bag = C.newBag(rng);
  ok(bag.length === 7, '1袋は7個');
  ok(new Set(bag).size === 7, '7種すべて1回ずつ');
  ok(C.TYPES.every(t => bag.includes(t)), '全種類を含む');
  // 決定的：同じ種でも順序は袋内で全種そろう
  const bag2 = C.newBag(seededRng(7));
  ok(new Set(bag2).size === 7, '別シードでも7種そろう');
}

console.log('\n=====================================');
console.log(`  PASS: ${pass}  FAIL: ${fail}`);
console.log('=====================================');
process.exit(fail === 0 ? 0 : 1);
