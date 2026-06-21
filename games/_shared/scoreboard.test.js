/* scoreboard.js のテスト */
const S = require('./scoreboard.js');
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('  ✗ FAIL: ' + m); } }
function section(n) { console.log('\n# ' + n); }

section('formatBest（高いほど良い）');
ok(S.formatBest('1500', { kind: 'high', unit: '点' }) === '🏆 ベスト 1500点', '高スコアに単位');
ok(S.formatBest('12', { kind: 'high' }) === '🏆 ベスト 12', '単位なしでも表示');
ok(S.formatBest(null, { kind: 'high' }) === null, '記録なし(null)は非表示');
ok(S.formatBest('0', { kind: 'high' }) === null, '0は未プレイ扱い');
ok(S.formatBest('abc', { kind: 'high' }) === null, '不正値は非表示');
ok(S.formatBest('-5', { kind: 'high' }) === null, '負値は非表示');

section('formatBest（タイムは速いほど良い）');
ok(S.formatBest('23', { kind: 'lowTime', unit: '秒' }) === '⏱️ ベスト 23秒', 'タイム表記');
ok(S.formatBest(null, { kind: 'lowTime' }) === null, 'タイム記録なしは非表示');

section('readBest（store経由）');
const store = { _d: { maze_best: '7', empty: null }, getItem(k) { return this._d[k] != null ? this._d[k] : null; } };
ok(S.readBest(store, { key: 'maze_best', kind: 'high', unit: 'レベル' }) === '🏆 ベスト 7レベル', 'storeから読んで整形');
ok(S.readBest(store, { key: 'missing', kind: 'high' }) === null, '無いキーはnull');
ok(S.readBest(null, { key: 'x', kind: 'high' }) === null, 'storeなしはnull');
ok(S.readBest(store, null) === null, 'cfgなしはnull');

console.log('\n=====================================');
console.log(`  PASS: ${pass}  FAIL: ${fail}`);
console.log('=====================================');
process.exit(fail === 0 ? 0 : 1);
