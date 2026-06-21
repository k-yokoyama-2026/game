/* キラめき探検隊 — UI スモークテスト（ヘッドレス DOM） */
const path = require('path');
const { loadHtml } = require('../_testlib/dom.js');
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('  ✗ FAIL: ' + m); } }

const H = loadHtml(path.join(__dirname, 'index.html'));
const ctx = H.ctx, doc = ctx.document;

console.log('# 起動（genWorldは自動実行）');
ok(typeof ctx.GemCore === 'object', 'コア読み込み');
ok(typeof ctx.update === 'function', 'update あり');

console.log('# 更新ループ');
let threw = false;
try { for (let i = 0; i < 120; i++) { ctx.update(0.1); ctx.render(); } } catch (e) { threw = true; console.error(e); }
ok(!threw, 'update/renderを回しても例外が出ない');

console.log('# 水晶使用（未所持でも安全）');
threw = false;
try { for (let id = 1; id <= 4; id++) ctx.useCrystal(id); } catch (e) { threw = true; console.error(e); }
ok(!threw, 'useCrystalで例外が出ない');

console.log('# クリア画面と★評価');
threw = false;
try { ctx.showEnd(true); } catch (e) { threw = true; console.error(e); }
ok(!threw, 'showEndで例外が出ない');
ok(/⭐|☆/.test(doc.getElementById('endText').innerHTML), '★評価が表示される: ' + doc.getElementById('endText').innerHTML.replace(/<[^>]+>/g, ' '));

ok(ctx.localStorage.getItem('gem_best_time') !== null, '最速タイムが永続化される');
console.log('\n=====================================');
console.log(`  SMOKE PASS: ${pass}  FAIL: ${fail}`);
console.log('=====================================');
process.exit(fail === 0 ? 0 : 1);
