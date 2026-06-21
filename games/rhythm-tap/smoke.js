/* リズムタップ — UI スモークテスト（ヘッドレス DOM） */
const path = require('path');
const { loadHtml } = require('../_testlib/dom.js');
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('  ✗ FAIL: ' + m); } }

const H = loadHtml(path.join(__dirname, 'index.html'));
const ctx = H.ctx, doc = ctx.document;

function makeItem(pts) {
  const el = doc.createElement('div');
  el.dataset.pts = String(pts);
  el.dataset.color = '#fff';
  el.dataset.type = pts > 0 ? 'heart' : 'bomb';
  return el;
}

console.log('# 起動');
ok(typeof ctx.RhythmCore === 'object', 'コア読み込み');
ok(typeof ctx.startGame === 'function', 'startGame あり');

console.log('# ゲーム開始と自動スポーン');
let threw = false;
try { ctx.startGame(); H.fireTimeouts(); for (let i = 0; i < 20; i++) ctx.spawnItem(); } catch (e) { threw = true; console.error(e); }
ok(!threw, '開始とスポーンで例外が出ない');

console.log('# 良いアイテムを連続タップ→フィーバー');
threw = false;
try { for (let i = 0; i < 12; i++) ctx.tapItem(makeItem(2)); } catch (e) { threw = true; console.error(e); }
ok(!threw, '連続タップで例外が出ない');
ok(parseInt(doc.getElementById('hud-score').textContent, 10) > 0, 'スコアが入る: ' + doc.getElementById('hud-score').textContent);
ok(/フィーバー/.test(doc.getElementById('hud-combo').textContent), 'コンボ10でフィーバー表示: ' + doc.getElementById('hud-combo').textContent);

console.log('# 悪いアイテムでミス');
threw = false;
try { ctx.tapItem(makeItem(-2)); } catch (e) { threw = true; console.error(e); }
ok(!threw, 'ミスでも例外が出ない');
ok(!/フィーバー/.test(doc.getElementById('hud-combo').textContent), 'ミスでフィーバー終了');

console.log('# 結果画面');
threw = false;
try { ctx.showResult(); } catch (e) { threw = true; console.error(e); }
ok(!threw, '結果表示で例外が出ない');
ok(/ランク/.test(doc.getElementById('result-rank').textContent), 'ランクが表示される: ' + doc.getElementById('result-rank').textContent);

ok(ctx.localStorage.getItem('rhythm_best') !== null, 'ベストスコアが永続化される');
console.log('\n=====================================');
console.log(`  SMOKE PASS: ${pass}  FAIL: ${fail}`);
console.log('=====================================');
process.exit(fail === 0 ? 0 : 1);
