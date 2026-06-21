/* にゃんこどこ？ — UI スモークテスト（ヘッドレス DOM） */
const path = require('path');
const { loadHtml } = require('../_testlib/dom.js');
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('  ✗ FAIL: ' + m); } }

const H = loadHtml(path.join(__dirname, 'index.html'));
const ctx = H.ctx, doc = ctx.document;
const fakeLevel = { catEmoji: '🐱', foundMsg: 'みつけた！' };

console.log('# 起動');
ok(typeof ctx.CatCore === 'object', 'コア読み込み');
ok(typeof ctx.startGame === 'function', 'startGame あり');

console.log('# レベル読み込みと隠れ場所');
let threw = false;
try { ctx.startGame(); } catch (e) { threw = true; console.error(e); }
ok(!threw, 'startGameで例外が出ない');
const kids = doc.getElementById('room').children;
ok(kids.length > 1, '部屋にオブジェクトが配置される');
const hider = kids.find(c => c.dataset && c.dataset.hidesCat === 'true');
ok(!!hider, '隠れ場所(hider)が決まっている');
const wrong = kids.find(c => c.dataset && c.dataset.hidesCat !== 'true' && c.dataset.heavy === 'false');

console.log('# ハズレめくり→当たり（★評価）');
threw = false;
try {
  if (wrong) ctx.handleTap(wrong, { heavy: false }, fakeLevel); // ハズレ1回
  ctx.handleTap(hider, { heavy: false }, fakeLevel);            // 当たり
  H.fireTimeouts(); H.fireTimeouts(); H.fireTimeouts(); // ネストしたsetTimeoutを順に消化
} catch (e) { threw = true; console.error(e); }
ok(!threw, 'タップ処理で例外が出ない');
ok(doc.getElementById('found-overlay')._cls.has('show'), '発見オーバーレイが出る');
ok(/点/.test(doc.getElementById('found-message').innerHTML), 'スコアが表示される: ' + doc.getElementById('found-message').innerHTML.replace(/<[^>]+>/g, ' '));

console.log('\n=====================================');
console.log(`  SMOKE PASS: ${pass}  FAIL: ${fail}`);
console.log('=====================================');
process.exit(fail === 0 ? 0 : 1);
