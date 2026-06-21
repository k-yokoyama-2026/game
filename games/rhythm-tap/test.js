/* リズムタップ — コアロジックのテスト */
const C = require('./core.js');
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('  ✗ FAIL: ' + m); } }
function section(n) { console.log('\n# ' + n); }

section('コンボボーナス');
ok(C.comboBonus(1) === 0, 'コンボ低はボーナスなし');
ok(C.comboBonus(5) === 1, 'コンボ5で+1');
ok(C.comboBonus(10) === 2, 'コンボ10で+2');

section('得点計算');
ok(C.scoreTap(2, 0, false) === 2, '通常の良アイテムは素点');
ok(C.scoreTap(2, 10, false) === 4, 'コンボ10でボーナス込み(2+2)');
ok(C.scoreTap(2, 10, true) === 8, 'フィーバー中は2倍((2+2)*2)');
ok(C.scoreTap(-2, 10, true) === -2, '悪アイテムはコンボ/フィーバーの影響なし');
ok(C.scoreTap(2, 0, true) === 4, 'フィーバー中は素点も2倍');

section('フィーバー突入');
ok(C.feverShouldStart(10) === true, 'コンボ10で突入');
ok(C.feverShouldStart(20) === true, 'コンボ20で突入');
ok(C.feverShouldStart(9) === false, 'コンボ9では突入しない');
ok(C.feverShouldStart(0) === false, 'コンボ0では突入しない');
ok(C.FEVER_MS > 0, 'フィーバー時間が設定されている');

section('アイテム抽選');
ok(C.pickItemType(0, () => 0.0) === 'golden', '乱数極小は金ハート');
ok(C.pickItemType(0, () => 0.10) === 'bad', '乱数中(badレンジ)は悪アイテム');
{
  // progress 0 で golden0.06+bad0.15=0.21 より上は良アイテム。0.5→2回目の乱数で heart/star
  let seq = [0.5, 0.4]; let i = 0;
  const t = C.pickItemType(0, () => seq[i++]);
  ok(t === 'heart' || t === 'star', '高い乱数は良アイテム(heart/star)');
}
ok(C.pickItemType(1, () => 0.30) === 'bad', '終盤は悪アイテム率が上がる(0.30はbad)');
ok(C.pickItemType(0, () => 0.30) !== 'bad', '序盤の0.30は悪でない');

section('難易度カーブ');
ok(C.spawnInterval(0, 600, 200) > C.spawnInterval(1, 600, 200), '進むほど出現が速い');
ok(C.spawnInterval(1, 600, 200) >= 200, '出現間隔に下限');
ok(C.itemLifetime(0, 2200, 900) > C.itemLifetime(1, 2200, 900), '進むほど寿命が短い');
ok(C.itemLifetime(1, 2200, 900) >= 900, '寿命に下限');

section('ステージとランク');
ok(C.stageFor(0, [15, 35, 60, 100]) === 1, 'スコア0はステージ1');
ok(C.stageFor(40, [15, 35, 60, 100]) === 3, '閾値を2つ超えるとステージ3');
ok(C.rank(130).rank === 'S', '120以上はSランク');
ok(C.rank(95).rank === 'A', '90以上はAランク');
ok(C.rank(0).rank === 'D', '低スコアはDランク');

console.log('\n=====================================');
console.log(`  PASS: ${pass}  FAIL: ${fail}`);
console.log('=====================================');
process.exit(fail === 0 ? 0 : 1);
