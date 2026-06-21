/* 泥棒をやっつけろ — UI スモークテスト（ヘッドレス DOM） */
const path = require('path');
const { loadHtml } = require('../_testlib/dom.js');
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('  ✗ FAIL: ' + m); } }

const H = loadHtml(path.join(__dirname, 'index.html'));
const ctx = H.ctx;

console.log('# 起動');
ok(typeof ctx.ThiefCore === 'object', 'コア読み込み');
ok(typeof ctx.startLevel === 'function', 'startLevel あり');

console.log('# レベル1を回す');
let threw = false;
try {
  ctx.startLevel(1);
  for (let i = 0; i < 600; i++) { ctx.update(); ctx.drawGame(); }
} catch (e) { threw = true; console.error(e); }
ok(!threw, 'update/drawを回しても例外が出ない');

console.log('# ボス回（Lv5）');
threw = false;
try {
  ctx.startLevel(5);
  for (let i = 0; i < 30; i++) ctx.spawnThief();
  for (let i = 0; i < 300; i++) { ctx.update(); ctx.handleTap(0, 0); }
} catch (e) { threw = true; console.error(e); }
ok(!threw, 'ボス回でも例外が出ない');

console.log('# 道具と入力');
threw = false;
try {
  ctx.startLevel(2);
  ctx.handleTap(100, 100);
  ctx.update();
} catch (e) { threw = true; console.error(e); }
ok(!threw, '入力処理で例外が出ない');

console.log('\n=====================================');
console.log(`  SMOKE PASS: ${pass}  FAIL: ${fail}`);
console.log('=====================================');
process.exit(fail === 0 ? 0 : 1);
