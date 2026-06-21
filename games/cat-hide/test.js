/* にゃんこどこ？ — コアロジックのテスト */
const C = require('./core.js');
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('  ✗ FAIL: ' + m); } }
function section(n) { console.log('\n# ' + n); }

const objs = [
  { label: 'ダンボール', heavy: false },
  { label: 'タンス', heavy: true },
  { label: 'イス', heavy: false },
];

section('隠れ場所の選択');
{
  // 重いものは選ばれない（rngを変えても）
  let everHeavy = false;
  for (let i = 0; i < 50; i++) {
    const idx = C.pickHider(objs, () => i / 50);
    if (objs[idx].heavy) everHeavy = true;
  }
  ok(!everHeavy, '重いオブジェクトは隠れ場所にならない');
  ok(C.pickHider(objs, () => 0) === 0, 'rng=0で最初の軽いもの');
  ok(C.pickHider([{ label: 'x', heavy: true }], () => 0) === -1, '候補なしは-1');
}

section('ヒント生成');
{
  const h = C.makeHint('ソファ', () => 0);
  ok(h.indexOf('ソファ') >= 0, 'ヒントにラベルが入る');
  // 別のrngで別テンプレ
  ok(C.makeHint('箱', () => 0) !== C.makeHint('箱', () => 0.9), 'rngでテンプレが変わる');
}

section('★評価とスコア');
ok(C.starsForWrongTaps(0) === 3, '一発で見つけたら★3');
ok(C.starsForWrongTaps(2) === 2, 'ハズレ2回までは★2');
ok(C.starsForWrongTaps(5) === 1, 'ハズレが多いと★1');
ok(C.levelPoints(3) === 300, '★3は300点');
ok(C.levelPoints(1) === 100, '★1は100点');
ok(C.levelPoints(3) > C.levelPoints(2), '★が多いほど高得点');

console.log('\n=====================================');
console.log(`  PASS: ${pass}  FAIL: ${fail}`);
console.log('=====================================');
process.exit(fail === 0 ? 0 : 1);
