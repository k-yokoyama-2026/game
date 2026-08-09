/* テトリス — UI スモークテスト（ヘッドレス DOM） */
const path = require('path');
const { loadHtml } = require('../_testlib/dom.js');
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('  ✗ FAIL: ' + m); } }

const H = loadHtml(path.join(__dirname, 'index.html'));
const ctx = H.ctx, doc = ctx.document;
const $ = id => doc.getElementById(id);

console.log('# 起動');
ok(typeof ctx.newGame === 'function', 'スクリプト読み込み');
ok(typeof ctx.TetrisCore === 'object', 'コア読み込み');
ok($('board').children.length === 200, '盤は10x20=200マス');

console.log('# ゲーム開始');
let threw = false;
try { ctx.newGame(); } catch (e) { threw = true; console.error(e); }
ok(!threw, 'newGameで例外が出ない');
ok($('next').children.length === 8, 'NEXTミニ表示が4x2');
ok($('level').textContent === '1', '開始レベルは1');

console.log('# 操作');
threw = false;
try { ctx.move(-1); ctx.move(1); ctx.rotate(1); ctx.rotate(-1); ctx.softDrop(); } catch (e) { threw = true; console.error(e); }
ok(!threw, '移動・回転・ソフトドロップで例外が出ない');

console.log('# ハードドロップで固定＆スコア加算');
const before = parseInt($('score').textContent || '0', 10);
threw = false;
try { ctx.hardDrop(); } catch (e) { threw = true; console.error(e); }
ok(!threw, 'hardDropで例外が出ない');
const after = parseInt($('score').textContent || '0', 10);
ok(after > before, 'ハードドロップでスコアが増える: ' + before + ' -> ' + after);

console.log('# ホールド');
threw = false;
try { ctx.hold(); } catch (e) { threw = true; console.error(e); }
ok(!threw, 'holdで例外が出ない');
ok($('hold').children.length === 8, 'HOLDミニ表示が出る');

console.log('# 一時停止トグル');
threw = false;
try { ctx.togglePause(); ctx.togglePause(); } catch (e) { threw = true; console.error(e); }
ok(!threw, 'pauseトグルで例外が出ない');

console.log('# 遅延処理');
threw = false;
try { H.fireTimeouts(); } catch (e) { threw = true; console.error(e); }
ok(!threw, '遅延描画で例外が出ない');

console.log('\n=====================================');
console.log(`  SMOKE PASS: ${pass}  FAIL: ${fail}`);
console.log('=====================================');
process.exit(fail === 0 ? 0 : 1);
