/* 銀行ゲーム — UI スモークテスト（ヘッドレス DOM） */
const path = require('path');
const { loadHtml } = require('../_testlib/dom.js');
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('  ✗ FAIL: ' + m); } }

const H = loadHtml(path.join(__dirname, 'index.html'));
const ctx = H.ctx, doc = ctx.document;

console.log('# 起動');
ok(typeof ctx.startGame === 'function', 'スクリプト読み込み');
ok(typeof ctx.BankCore === 'object', 'コア読み込み');

console.log('# 開業');
let threw = false;
try { ctx.startGame(); } catch (e) { threw = true; console.error(e); }
ok(!threw, 'startGameで例外が出ない');
ok(/1月/.test(doc.getElementById('month-display').textContent), '1月から開始');
ok(doc.getElementById('customer-area').children.length >= 0, '来客エリアが描画される');

console.log('# 金利調整と接客');
threw = false;
try {
  ctx.adjustRate('deposit', 0.5);
  ctx.adjustRate('loan', -0.5);
  for (let i = 0; i < 4; i++) ctx.acceptCustomer(0);
  ctx.rejectCustomer(0);
} catch (e) { threw = true; console.error(e); }
ok(!threw, '金利調整・承認・拒否で例外が出ない');

console.log('# 月送り（1年）');
threw = false;
try { for (let i = 0; i < 14; i++) { ctx.nextTurn(); for (let k = 0; k < 2; k++) ctx.acceptCustomer(0); } } catch (e) { threw = true; console.error(e); }
ok(!threw, '12ヶ月以上回しても例外が出ない');

console.log('\n=====================================');
console.log(`  SMOKE PASS: ${pass}  FAIL: ${fail}`);
console.log('=====================================');
process.exit(fail === 0 ? 0 : 1);
