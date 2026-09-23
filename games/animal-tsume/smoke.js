/* どうぶつ詰めしょうぎ — UI スモークテスト（ヘッドレス DOM） */
const path = require('path');
const { loadHtml } = require('../_testlib/dom.js');
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('  ✗ FAIL: ' + m); } }

const H = loadHtml(path.join(__dirname, 'index.html'));
const ctx = H.ctx, doc = ctx.document;
const C = ctx.TsumeCore, P = ctx.TSUME_PUZZLES;

console.log('# 起動');
ok(typeof C === 'object', 'コア読み込み');
ok(Array.isArray(P) && P.length > 0, '問題集読み込み');
ok(doc.getElementById('levels').children.length === C.LEVELS.length, `ホームに${C.LEVELS.length}つの級`);
ok(/★|あつめた/.test(doc.getElementById('totalStars').textContent), '★の合計を表示');

console.log('# 級→問題一覧');
let threw = false;
try { ctx.openLevel(2); } catch (e) { threw = true; console.error(e); }
ok(!threw, 'openLevel で例外が出ない');
ok(doc.getElementById('plist').children.length === P.filter(p => p.level === 2).length, '問題ボタンが並ぶ');

console.log('# 盤で解く（タップ操作）');
function tapMove(m) {
  if (m.drop) { ctx.tapHand(m.drop); ctx.tapSquare(m.to); }
  else { ctx.tapSquare(m.from); ctx.tapSquare(m.to); }
  H.fireTimeouts();
}
function solveByTaps(pz) {
  ctx.startPuzzle(pz.id);
  for (let i = 0; i < pz.line.length; i += 2) tapMove(pz.line[i]);
  // 仕上げ: ライオンを取る手をヒントで知ってタップ
  ctx.useHintBtn();
  const hint = C.correctMove(H.eval('session'));
  tapMove(hint);
}
threw = false;
const pz3 = P.find(p => p.n === 3);
try {
  ctx.startPuzzle(pz3.id);
  ok(doc.getElementById('board').children.length === 12, '盤に12マス');
  ok(/あと 3 手/.test(doc.getElementById('pLeft').textContent), '「あと3手」を表示');
  // まちがい: 正解でない合法手
  const wrong = C.legalMoves(H.eval('session').state).find(m => !C.sameMove(m, pz3.line[0]));
  tapMove(wrong);
  ok(doc.getElementById('msg')._cls.has('bad'), 'まちがいでメッセージが赤になる');
  ok(H.eval('session').step === 0, 'まちがいでは進まない');
  tapMove(pz3.line[0]);
  ok(H.eval('session').step === 2, '正解で相手が応手して2手進む');
  ok(/あと 1 手/.test(doc.getElementById('pLeft').textContent), '「あと1手」に変わる');
  tapMove(pz3.line[2]);
  ok(H.eval('session').phase === 'finish', '最後の王手で仕上げへ');
  ctx.useHintBtn();
  tapMove(C.correctMove(H.eval('session')));
} catch (e) { threw = true; console.error(e); }
ok(!threw, 'タップ操作で例外が出ない');
ok(doc.getElementById('clear')._cls.has('show'), 'クリア画面が出る');
ok(/★/.test(doc.getElementById('clearStars').textContent), '★を表示');
const rec = JSON.parse(ctx.localStorage.getItem('animaltsume_record'));
ok(rec[pz3.id] === 1 || rec[pz3.id] === 2, 'まちがい1＋ヒント1の★が記録される: ' + rec[pz3.id]);
ok(Number(ctx.localStorage.getItem('animaltsume_best')) >= 1, 'ホーム用の★合計が保存される');

console.log('# 全問をタップで解ける（打ち・長手数を含む）');
threw = false;
let allClear = true;
try {
  for (const pz of P) {
    solveByTaps(pz);
    if (H.eval('session').phase !== 'solved') { allClear = false; console.error('  未クリア #' + pz.id); }
  }
} catch (e) { threw = true; console.error(e); }
ok(!threw && allClear, `全 ${P.length} 問をタップ操作でクリア`);

console.log('# 画面遷移');
threw = false;
try { ctx.renderRules(); ctx.showHome(); ctx.openLevel(6); ctx.openLevel(7); } catch (e) { threw = true; console.error(e); }
ok(!threw, 'あそびかた・ホーム・名人級へ移れる');
ok(doc.getElementById('lvTable').children.length === C.LEVELS.length, 'あそびかたに級の表');

console.log('\n=====================================');
console.log(`  SMOKE PASS: ${pass}  FAIL: ${fail}`);
console.log('=====================================');
process.exit(fail === 0 ? 0 : 1);
