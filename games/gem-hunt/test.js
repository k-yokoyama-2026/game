/* キラめき探検隊 — コアロジックのテスト */
const C = require('./core.js');
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('  ✗ FAIL: ' + m); } }
function section(n) { console.log('\n# ' + n); }

section('クリア条件と所持上限');
ok(C.GOAL === 10, '目標は10個');
ok(C.isWin(10) === true && C.isWin(9) === false, '10個以上でクリア');
ok(C.KIRA_CAP === 16, 'キラ上限16');
ok(C.canPickKira(15) === true, '15個ならまだ拾える');
ok(C.canPickKira(16) === false, '16個では拾えない');

section('水晶（クリスタル）');
ok(C.crystalDefs.length === 4, '水晶は4種類');
ok(C.crystalCost(1) === 1, '透視はキラ1');
ok(C.crystalCost(3) === 2, '強化攻撃はキラ2');
ok(C.crystalCost(4) === 3, '万能はキラ3');
ok(C.canUseCrystal(true, 3, 4) === true, '持っていてキラ十分なら使える');
ok(C.canUseCrystal(true, 2, 4) === false, 'キラ不足なら使えない');
ok(C.canUseCrystal(false, 9, 1) === false, '未所持なら使えない');

section('方角ヒント');
ok(C.hintDir(800, 100, 1600, 1200) === '北', '上方は北');
ok(C.hintDir(800, 1100, 1600, 1200) === '南', '下方は南');
ok(C.hintDir(100, 600, 1600, 1200) === '西', '左方は西');
ok(C.hintDir(1500, 600, 1600, 1200) === '東', '右方は東');

section('クリア評価（★）');
ok(C.clearStars(5, 5, 2, 60) === 3, '無傷・節約・速攻で★3');
ok(C.clearStars(1, 5, 20, 300) === 1, 'ボロボロ・浪費・遅いと★1');
ok(C.clearStars(5, 5, 20, 300) === 2, '体力温存だけなら★2');
ok(C.clearStars(1, 5, 2, 60) === 2, '効率だけなら★2');
ok(C.clearStars(5, 5, 2, 60) <= 3, '★は最大3');

console.log('\n=====================================');
console.log(`  PASS: ${pass}  FAIL: ${fail}`);
console.log('=====================================');
process.exit(fail === 0 ? 0 : 1);
