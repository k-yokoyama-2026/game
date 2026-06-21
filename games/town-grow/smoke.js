/* まちづくり物語 — UI スモークテスト（ヘッドレス DOM） */
const path = require('path');
const { loadHtml } = require('../_testlib/dom.js');
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('  ✗ FAIL: ' + m); } }

const H = loadHtml(path.join(__dirname, 'index.html'));
const ctx = H.ctx, doc = ctx.document;
const fakeBtn = () => doc.createElement('button');
// events[0] は「カラス」: choices[0]=最善(+3), choices[1]=災害(-999), choices[2]=安全(+1)

console.log('# 起動');
ok(typeof ctx.TownCore === 'object', 'コア読み込み');
ok(typeof ctx.startGame === 'function', 'startGame あり');

console.log('# ゲーム開始');
let threw = false;
try { ctx.startGame(30); } catch (e) { threw = true; console.error(e); }
ok(!threw, 'startGameで例外が出ない');
ok(doc.getElementById('popVal').textContent === '5', '初期人口5');
ok(doc.getElementById('eventText').textContent.length > 0, 'イベント文が表示');

console.log('# 最善を選んで連鎖');
threw = false;
try { ctx.choose(0, 0, fakeBtn()); } catch (e) { threw = true; console.error(e); }
ok(!threw, '選択で例外が出ない');
ok(parseInt(doc.getElementById('popVal').textContent, 10) > 5, '最善で人口が増えた: ' + doc.getElementById('popVal').textContent);
ok(/連鎖/.test(doc.getElementById('result').textContent), 'さいぜん連鎖ボーナスが表示: ' + doc.getElementById('result').textContent);

console.log('# 安全策（最善でない）で連鎖リセット');
threw = false;
try { ctx.choose(0, 2, fakeBtn()); } catch (e) { threw = true; console.error(e); }
ok(!threw, '安全策でも例外が出ない');

console.log('# 災害を選ぶとゲームオーバー');
threw = false;
try { ctx.choose(0, 1, fakeBtn()); H.fireTimeouts(); } catch (e) { threw = true; console.error(e); }
ok(!threw, '災害選択で例外が出ない');
ok(/ゲームオーバー/.test(doc.getElementById('endTitle').textContent), 'ゲームオーバー画面: ' + doc.getElementById('endTitle').textContent);

ok(ctx.localStorage.getItem('town_best') !== null, '最高人口が永続化される');
console.log('\n=====================================');
console.log(`  SMOKE PASS: ${pass}  FAIL: ${fail}`);
console.log('=====================================');
process.exit(fail === 0 ? 0 : 1);
