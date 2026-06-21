/* 八事ウォーク — UI スモークテスト（ヘッドレス DOM、擬似GPSで周遊） */
const path = require('path');
const { loadHtml } = require('../_testlib/dom.js');
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('  ✗ FAIL: ' + m); } }

const H = loadHtml(path.join(__dirname, 'index.html'));
const ctx = H.ctx, doc = ctx.document;
// index.html と同じ暫定座標（const CHECKPOINTS は外から読めないため）
const CP = [
  { lat: 35.1356, lng: 136.9588 }, { lat: 35.1372, lng: 136.9598 },
  { lat: 35.1388, lng: 136.9618 }, { lat: 35.1330, lng: 136.9636 },
  { lat: 35.1408, lng: 136.9566 }, { lat: 35.1329, lng: 136.9606 },
  { lat: 35.1518, lng: 136.9686 },
];

console.log('# 起動（地図なし環境）');
ok(typeof ctx.YagotoCore === 'object', 'コア読み込み');
ok(typeof ctx.handlePosition === 'function', 'handlePosition あり');
ok(doc.getElementById('panel').children.length > 0, 'チェックポイント一覧が描画');

console.log('# 遠くにいると獲得できない');
let threw = false;
try { ctx.handlePosition(35.30, 137.10); } catch (e) { threw = true; console.error(e); }
ok(!threw, '位置更新で例外が出ない');
ok(doc.getElementById('scoreVal').textContent === '0', '遠ければスコア0のまま');

console.log('# 各チェックポイントに到達して周遊');
threw = false;
try {
  for (const c of CP) ctx.handlePosition(c.lat, c.lng);
} catch (e) { threw = true; console.error(e); }
ok(!threw, '全CP訪問で例外が出ない');
ok(parseInt(doc.getElementById('scoreVal').textContent, 10) > 0, 'スコアが加算される: ' + doc.getElementById('scoreVal').textContent);
const n = CP.length;
ok(doc.getElementById('progVal').textContent === `${n}/${n}`, '全CP達成: ' + doc.getElementById('progVal').textContent);
ok(doc.getElementById('clear').classList.contains('show'), 'クリア画面が出る');

console.log('# 二重取得しない');
const scoreAfter = doc.getElementById('scoreVal').textContent;
ctx.handlePosition(CP[0].lat, CP[0].lng);
ok(doc.getElementById('scoreVal').textContent === scoreAfter, '訪問済みCBでスコアは増えない');

console.log('# テストモード切替');
threw = false;
try { ctx.toggleTestMode(); } catch (e) { threw = true; console.error(e); }
ok(!threw, 'テストモード切替で例外が出ない');

console.log('\n=====================================');
console.log(`  SMOKE PASS: ${pass}  FAIL: ${fail}`);
console.log('=====================================');
process.exit(fail === 0 ? 0 : 1);
