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
const filled = $('board').children.filter(el => el.classList.contains('filled')).length;
ok(filled >= 2 && filled <= 4, 'アクティブなピースが盤に描画される: ' + filled);
ok($('board').children.length === 200, '開始後も盤は200マス');

console.log('# 操作');
threw = false;
try { ctx.move(-1); ctx.move(1); ctx.rotateActive(1); ctx.rotateActive(-1); } catch (e) { threw = true; console.error(e); }
ok(!threw, '移動・回転で例外が出ない');

threw = false;
try { ctx.hold(); } catch (e) { threw = true; console.error(e); }
ok(!threw, 'ホールドで例外が出ない');

console.log('# 落下と重力');
threw = false;
try { for (let i = 0; i < 30; i++) ctx.step(); } catch (e) { threw = true; console.error(e); }
ok(!threw, '重力ステップを繰り返しても例外が出ない');

threw = false;
try { ctx.hardDrop(); } catch (e) { threw = true; console.error(e); }
ok(!threw, 'ハードドロップで例外が出ない');

console.log('# スコア更新');
let bumped = false, safe = true;
try {
  for (let i = 0; i < 400 && !ctx.gameOver; i++) {
    ctx.hardDrop();
    if (parseInt($('score').textContent || '0', 10) > 0) bumped = true;
  }
} catch (e) { safe = false; console.error(e); }
ok(safe, 'ハードドロップを繰り返しても例外が出ない');
ok(bumped, 'プレイでスコアが増える');

console.log('# タイマー発火');
threw = false;
try { H.fireIntervals(2); } catch (e) { threw = true; console.error(e); }
ok(!threw, '落下タイマーが例外なく発火する');

console.log('\n=====================================');
console.log(`  SMOKE PASS: ${pass}  FAIL: ${fail}`);
console.log('=====================================');
process.exit(fail === 0 ? 0 : 1);
