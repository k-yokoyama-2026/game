/* まちづくり物語 — コアロジックのテスト */
const C = require('./core.js');
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('  ✗ FAIL: ' + m); } }
function section(n) { console.log('\n# ' + n); }

const sample = [{ pop: 3 }, { pop: -999 }, { pop: 1 }]; // 0が最善, 1が災害, 2が安全策

section('災害判定と最善手');
ok(C.isDisaster(-999) === true, '-999は災害');
ok(C.isDisaster(3) === false, '正の値は災害でない');
ok(C.bestChoiceIndex(sample) === 0, '一番増えるのが最善');
ok(C.bestChoiceIndex([{ pop: 2 }, { pop: 5 }, { pop: -999 }]) === 1, '最大popを選ぶ');

section('連鎖ボーナス');
ok(C.streakBonus(0) === 0, '連鎖0はボーナス0');
ok(C.streakBonus(3) === 3, '連鎖3で+3');
ok(C.streakBonus(99) === 5, 'ボーナス上限+5');

section('選択の解決');
{
  const disaster = C.resolveChoice(sample, 1, 2);
  ok(disaster.disaster === true && disaster.newStreak === 0, '災害は即アウト＆連鎖リセット');

  const best = C.resolveChoice(sample, 0, 0);
  ok(best.disaster === false && best.isBest === true, '最善を選べた');
  ok(best.newStreak === 1, '最善で連鎖+1');
  ok(best.popDelta === 3 + 1, '最善はボーナス込み(3+連鎖1)');

  const best2 = C.resolveChoice(sample, 0, 2); // 既に連鎖2
  ok(best2.newStreak === 3 && best2.popDelta === 3 + 3, '連鎖が伸びるとボーナス増');

  const safe = C.resolveChoice(sample, 2, 4); // 安全だが最善でない
  ok(safe.disaster === false && safe.isBest === false, '安全策だが最善でない');
  ok(safe.newStreak === 0 && safe.bonus === 0, '最善でないと連鎖リセット・ボーナスなし');
  ok(safe.popDelta === 1, '安全策はそのままの増加');
}

section('クリア判定');
ok(C.isWin(30, 30) === true, '目標到達でクリア');
ok(C.isWin(29, 30) === false, '未達は継続');

console.log('\n=====================================');
console.log(`  PASS: ${pass}  FAIL: ${fail}`);
console.log('=====================================');
process.exit(fail === 0 ? 0 : 1);
