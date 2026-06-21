/* 数字迷路 — UI スモークテスト（ヘッドレス DOM） */
const path = require('path');
const { loadHtml } = require('../_testlib/dom.js');
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('  ✗ FAIL: ' + m); } }

const H = loadHtml(path.join(__dirname, 'index.html'));
const ctx = H.ctx;

console.log('# 起動');
ok(typeof ctx.startGame === 'function', 'スクリプト読み込み');
ok(typeof ctx.MazeCore === 'object', 'コア読み込み');

console.log('# ゲーム開始');
let threw = false;
try { ctx.startGame(); } catch (e) { threw = true; console.error(e); }
ok(!threw, 'startGameで例外が出ない');
ok(ctx.document.getElementById('levelDisp').textContent.indexOf('レベル 1') >= 0, 'レベル1表示');

console.log('# 移動');
threw = false;
try {
  // いろいろな方向に動かしても例外が出ない
  for (let i = 0; i < 30; i++) { ctx.movePlayer(1, 0); ctx.movePlayer(0, 1); ctx.movePlayer(-1, 0); ctx.movePlayer(0, -1); }
} catch (e) { threw = true; console.error(e); }
ok(!threw, '移動の連打で例外が出ない');

console.log('# 高レベル（敵あり）に進めても落ちない');
threw = false;
try {
  for (let lv = 0; lv < 6; lv++) { ctx.nextLevel(); for (let i = 0; i < 20; i++) ctx.movePlayer(1, 0); }
} catch (e) { threw = true; console.error(e); }
ok(!threw, '敵ありレベルでも例外が出ない');

ok(ctx.localStorage.getItem('maze_best') !== null, '最高記録が永続化される');
console.log('\n=====================================');
console.log(`  SMOKE PASS: ${pass}  FAIL: ${fail}`);
console.log('=====================================');
process.exit(fail === 0 ? 0 : 1);
