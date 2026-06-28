/* モンスターたんけん — UI スモークテスト（ヘッドレス DOM） */
const path = require('path');
const { loadHtml } = require('../_testlib/dom.js');
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('  ✗ FAIL: ' + m); } }

const H = loadHtml(path.join(__dirname, 'index.html'));
const ctx = H.ctx;

console.log('# 起動');
ok(typeof ctx.startGame === 'function', 'スクリプト読み込み');
ok(typeof ctx.MQCore === 'object', 'コア読み込み');
ok(ctx.MQState.scene === 'title', '初期シーンはタイトル');

console.log('# マップが遊べる（出現位置が歩け、草むらに到達できる）');
{
  const C2 = ctx.MQCore, grid = ctx.MQGrid;
  const sx = ctx.MQState.player.x, sy = ctx.MQState.player.y;
  ok(C2.canWalk(grid, sx, sy), '出現位置は歩けるマス（壁/木の中ではない）');
  // BFSで出現位置から到達できる草むらを数える
  const Hh = grid.length, Ww = grid[0].length;
  const seen = Array.from({ length: Hh }, () => Array(Ww).fill(false));
  let q = [[sx, sy]], grassReach = 0; seen[sy][sx] = true;
  while (q.length) {
    const [x, y] = q.shift();
    if (C2.isGrass(grid, x, y)) grassReach++;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= Ww || ny >= Hh || seen[ny][nx]) continue;
      if (C2.canWalk(grid, nx, ny)) { seen[ny][nx] = true; q.push([nx, ny]); }
    }
  }
  ok(grassReach > 10, '出現位置から草むらにちゃんと到達できる（' + grassReach + 'マス）');
}

console.log('# ぼうけん開始 → スターター選択');
let threw = false;
try { ctx.startGame(); } catch (e) { threw = true; console.error(e); }
ok(!threw, 'startGameで例外が出ない');
ok(ctx.MQState.scene === 'starterSelect', 'スターター選択シーンへ');

console.log('# あいぼう決定');
threw = false;
try { ctx.chooseStarter('hinoko'); } catch (e) { threw = true; console.error(e); }
ok(!threw, 'chooseStarterで例外が出ない');
ok(ctx.MQState.party.length === 1, '手持ちが1匹');
ok(ctx.MQState.scene === 'field', 'フィールドへ移行');

console.log('# フィールド移動');
threw = false;
try { for (let i = 0; i < 60; i++) { ctx.movePlayer(1, 0); ctx.movePlayer(0, 1); ctx.movePlayer(-1, 0); ctx.movePlayer(0, -1); } }
catch (e) { threw = true; console.error(e); }
ok(!threw, '移動連打で例外が出ない');

// バトルを1回最後まで戦うヘルパ（くさ相手にヒノコでばつぐん→勝てるはず）
function runBattle(enemySpecies, lv, action) {
  ctx.beginBattle(ctx.MQCore.makeMonster(enemySpecies, lv));
  let guard = 0;
  while (ctx.MQBattle.active && guard++ < 400) {
    if (ctx.isAwaiting()) { ctx.advanceMsg(); continue; }
    if (ctx.cmdMenuOpen()) { action(); continue; }
    break; // 想定外：メニューも出ずメッセージも無い
  }
  return guard < 400;
}

console.log('# バトル：たたかうで勝利');
threw = false; let finished = false;
try { finished = runBattle('kusamo', 3, () => ctx.playerMove(ctx.MQState.party[ctx.MQBattle.mineIdx].moves[0])); }
catch (e) { threw = true; console.error(e); }
ok(!threw, 'たたかうバトルで例外が出ない');
ok(finished, 'バトルがちゃんと終了する（無限ループしない）');
ok(ctx.MQState.scene === 'field', '勝利後フィールドに戻る');
ok(ctx.MQState.party[0].exp >= 0, '経験値が反映される');

console.log('# バトル：ボールで捕獲を試みる');
threw = false;
try {
  ctx.MQState.balls.normal = 50;
  finished = runBattle('nonezu', 2, () => ctx.throwBall('normal'));
} catch (e) { threw = true; console.error(e); }
ok(!threw, 'ボール投げで例外が出ない');
ok(finished, 'ボールバトルも終了する');

console.log('# バトル：にげる');
threw = false;
try { finished = runBattle('ishigoro', 3, () => ctx.tryRun()); } catch (e) { threw = true; console.error(e); }
ok(!threw, 'にげるで例外が出ない');

console.log('# バトル：いれかえ（仲間が2匹以上いるとき）');
threw = false;
try {
  // 2匹目を確保
  if (ctx.MQState.party.length < 2) ctx.MQState.party.push(ctx.MQCore.makeMonster('mizuti', 5));
  ctx.beginBattle(ctx.MQCore.makeMonster('nonezu', 2));
  let g = 0;
  // まず1回いれかえ、その後たたかうで決着
  let switched = false;
  while (ctx.MQBattle.active && g++ < 400) {
    if (ctx.isAwaiting()) { ctx.advanceMsg(); continue; }
    if (ctx.cmdMenuOpen()) {
      if (!switched) { switched = true; const other = ctx.MQBattle.mineIdx === 0 ? 1 : 0; ctx.doSwitch(other); }
      else ctx.playerMove(ctx.MQState.party[ctx.MQBattle.mineIdx].moves[0]);
      continue;
    }
    break;
  }
} catch (e) { threw = true; console.error(e); }
ok(!threw, 'いれかえで例外が出ない');

console.log('# モーダル（てもち／ずかん）');
threw = false;
try { ctx.openParty(); ctx.closeModal(); ctx.openDex(); ctx.closeModal(); } catch (e) { threw = true; console.error(e); }
ok(!threw, 'てもち/ずかんモーダルで例外が出ない');

console.log('# 図鑑の永続化');
ok(ctx.localStorage.getItem('mq_dex') !== null, 'ずかんが localStorage に保存される');
ok(ctx.MQState.dex.has('hinoko'), '相棒が図鑑に登録される');

console.log('\n=====================================');
console.log(`  SMOKE PASS: ${pass}  FAIL: ${fail}`);
console.log('=====================================');
process.exit(fail === 0 ? 0 : 1);
