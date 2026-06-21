/* ブロックブラスト — UI スモークテスト（ヘッドレス DOM） */
const path = require('path');
const { loadHtml } = require('../_testlib/dom.js');
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('  ✗ FAIL: ' + m); } }

const H = loadHtml(path.join(__dirname, 'index.html'));
const ctx = H.ctx, doc = ctx.document;
const $ = id => doc.getElementById(id);

console.log('# 起動');
ok(typeof ctx.newGame === 'function', 'スクリプト読み込み');
ok(typeof ctx.BlockCore === 'object', 'コア読み込み');
ok($('board').children.length === 64, '盤は8x8=64マス');
ok($('tray').children.length === 3, 'トレイに3ピース');

console.log('# ピースを置く');
let threw = false;
const before = parseInt($('score').textContent || '0', 10);
try { ctx.place(0, 0, 0); } catch (e) { threw = true; console.error(e); }
ok(!threw, '配置で例外が出ない');
const after = parseInt($('score').textContent || '0', 10);
ok(after > before, '配置でスコアが増える: ' + before + ' -> ' + after);

console.log('# ヒント（評価）');
let bm = null; threw = false;
try { bm = ctx.bestMove(); } catch (e) { threw = true; console.error(e); }
ok(!threw, 'bestMoveで例外が出ない');
ok(bm && typeof bm.score === 'number', 'ヒントが評価値を返す');

console.log('# 遅延処理');
threw = false;
try { H.fireTimeouts(); } catch (e) { threw = true; console.error(e); }
ok(!threw, '遅延描画/判定で例外が出ない');

console.log('\n=====================================');
console.log(`  SMOKE PASS: ${pass}  FAIL: ${fail}`);
console.log('=====================================');
process.exit(fail === 0 ? 0 : 1);
