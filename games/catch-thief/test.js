/* 泥棒をやっつけろ — コアロジックのテスト */
const C = require('./core.js');
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('  ✗ FAIL: ' + m); } }
function section(n) { console.log('\n# ' + n); }

section('レベル設定');
{
  ok(C.getLevelConfig(1).total === 7, 'Lv1は7体');
  ok(C.getLevelConfig(5).total > C.getLevelConfig(1).total, 'レベルで敵が増える');
  ok(C.getLevelConfig(5).speed > C.getLevelConfig(1).speed, 'レベルで速くなる');
  ok(C.getLevelConfig(1).fastChance === 0, 'Lv1は速い泥棒なし');
  ok(C.getLevelConfig(5).fastChance > 0 && C.getLevelConfig(5).sneakyChance > 0, '高レベルで特殊泥棒が出る');
  ok(C.getLevelConfig(20).spawnInterval >= 500, '出現間隔に下限');
}

section('ボス');
ok(C.isBossLevel(5) === true && C.isBossLevel(10) === true, '5の倍数はボス回');
ok(C.isBossLevel(4) === false && C.isBossLevel(7) === false, '通常回はボスなし');
ok(C.getLevelConfig(5).boss === true && C.getLevelConfig(6).boss === false, 'configにbossフラグ');
ok(C.bossHp(10) > C.bossHp(5), '高レベルのボスほど硬い');
ok(C.thiefStats('boss').size > C.thiefStats('normal').size, 'ボスは大きい');

section('コンボ倍率');
ok(C.comboMultiplier(1) === 1, 'コンボ1は等倍');
ok(C.comboMultiplier(20) === 10, 'コンボ倍率は10倍が上限');
ok(C.comboMultiplier(0) === 0, 'コンボ0');

section('得点');
ok(C.thiefBaseScore('boss') > C.thiefBaseScore('sneaky'), 'ボスが最高得点');
ok(C.thiefBaseScore('sneaky') > C.thiefBaseScore('fast'), 'すり抜けは高得点');
ok(C.thiefBaseScore('fast') > C.thiefBaseScore('normal'), '速いほど高得点');
ok(C.scoreFor('normal', 5) === 100 * 5, 'コンボ5で5倍');
ok(C.scoreFor('normal', 0) === 100, 'コンボ0でも素点は入る');
ok(C.scoreFor('normal', 50) === 100 * 10, 'コンボ倍率は10倍まで');

section('タイプ抽選');
{
  const cfg = C.getLevelConfig(6); // sneaky/fast 両方ある
  ok(C.pickType(() => 0.0, cfg) === 'sneaky', '乱数0はすり抜け');
  ok(C.pickType(() => 0.99, cfg) === 'normal', '乱数大は通常');
  ok(C.pickType(() => 0.5, C.getLevelConfig(1)) === 'normal', 'Lv1は常に通常');
}

console.log('\n=====================================');
console.log(`  PASS: ${pass}  FAIL: ${fail}`);
console.log('=====================================');
process.exit(fail === 0 ? 0 : 1);
