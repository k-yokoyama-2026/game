/* 八事ウォーク — コアロジックのテスト */
const C = require('./core.js');
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('  ✗ FAIL: ' + m); } }
function section(n) { console.log('\n# ' + n); }

const CP = [
  { name: '八事日赤駅', lat: 35.1357, lng: 136.9588, points: 100 },
  { name: '八事日赤病院', lat: 35.1365, lng: 136.9606, points: 150 },
  { name: '興正寺', lat: 35.1390, lng: 136.9620, points: 200 },
];

section('距離計算（Haversine）');
ok(C.haversine(35.1357, 136.9588, 35.1357, 136.9588) === 0, '同じ点は0m');
{
  const d = C.haversine(35.0, 136.0, 36.0, 136.0); // 緯度1度 ≈ 111km
  ok(Math.abs(d - 111195) < 500, '緯度1度はおよそ111km: ' + Math.round(d) + 'm');
  const near = C.haversine(CP[0].lat, CP[0].lng, CP[1].lat, CP[1].lng);
  ok(near > 0 && near < 500, '隣のCPは数百m以内: ' + Math.round(near) + 'm');
}

section('最寄りと到達判定');
{
  const n = C.nearest({ lat: 35.1357, lng: 136.9588 }, CP);
  ok(n.index === 0 && n.dist < 5, '駅の上では駅が最寄り');
  ok(C.withinRadius(30, 45) === true, '半径内は到達');
  ok(C.withinRadius(60, 45) === false, '半径外は未到達');
}

section('コンボ判定');
ok(C.comboFor(0, 1000, 0) === 1, '初回はコンボ1');
ok(C.comboFor(1000, 1000 + 60000, 1) === 2, '5分以内ならコンボ継続');
ok(C.comboFor(1000, 1000 + 6 * 60000, 3) === 1, '5分超でコンボリセット');

section('得点');
ok(C.scoreForVisit(100, 1) === 100, 'コンボ1は基礎点');
ok(C.scoreForVisit(100, 3) === 140, 'コンボ3で+40');
ok(C.scoreForVisit(200, 2) > C.scoreForVisit(200, 1), 'コンボが乗ると高得点');

section('訪問の評価（純粋関数）');
{
  const state = { visited: new Set(), score: 0, combo: 0, lastTime: 0 };
  const onSpot = C.evaluateVisit(state, { lat: 35.1357, lng: 136.9588 }, CP, { now: 1000 });
  ok(onSpot.collected === true && onSpot.index === 0, '駅の上で駅を取得');
  ok(onSpot.score === 100, '基礎点100を獲得');

  const farAway = C.evaluateVisit(state, { lat: 35.20, lng: 136.99 }, CP, { now: 1000 });
  ok(farAway.collected === false, '遠ければ取得できない');

  // 既訪問は取れない
  const s2 = { visited: new Set([0]), score: 100, combo: 1, lastTime: 1000 };
  const again = C.evaluateVisit(s2, { lat: 35.1357, lng: 136.9588 }, CP, { now: 2000 });
  ok(again.collected === false, '同じCPは二重取得できない');
}

section('全制覇ボーナス');
{
  const state = { visited: new Set([0, 1]), score: 250, combo: 1, lastTime: 0 };
  const last = C.evaluateVisit(state, { lat: 35.1390, lng: 136.9620 }, CP, { now: 9_999_999_999 });
  ok(last.collected === true && last.allDone === true, '最後のCPで全制覇');
  ok(last.points >= 200 + 500, '全制覇ボーナス+500が入る: ' + last.points);
}

console.log('\n=====================================');
console.log(`  PASS: ${pass}  FAIL: ${fail}`);
console.log('=====================================');
process.exit(fail === 0 ? 0 : 1);
