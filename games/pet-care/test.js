/* ペットそだて — コアロジックのテスト（TDD）
 * 実行: node games/pet-care/test.js */
const C = require('./core.js');

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.error('  ✗ FAIL: ' + msg); }
}
function section(name) { console.log('\n# ' + name); }

// 決定的な擬似乱数（テストの再現性）
function seededRng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// ---- 難易度カーブ ----
section('難易度カーブ');
ok(C.stepsForLevel(1) === 3, 'Lv1のステップ数は3');
ok(C.stepsForLevel(100) === 8, 'Lv100のステップ数は8（上限）');
ok(C.stepsForLevel(1) < C.stepsForLevel(100), 'ステップ数はレベルで増える');
ok(C.drainPerSec(1) < C.drainPerSec(50) && C.drainPerSec(50) < C.drainPerSec(100), 'がまんゲージ減少はレベルで速くなる');
{
  const t1 = 100 / C.drainPerSec(1);
  const t100 = 100 / C.drainPerSec(100);
  ok(t1 > 5, 'Lv1のがまん時間は余裕がある(>5s): ' + t1.toFixed(1) + 's');
  ok(t100 < 2.5, 'Lv100のがまん時間は短い(<2.5s): ' + t100.toFixed(2) + 's');
}

// ---- 基本のお世話／正解・不正解 ----
section('お世話の正解・不正解');
{
  const g = C.createGame({ rng: seededRng(1) });
  g.startAnimal('cat');
  ok(g.state.status === 'playing', '開始でplaying');
  ok(g.state.worry && g.state.worry.need, '悩みが出ている');
  ok(g.state.hearts === 3, 'ハート初期値3');

  const need = g.state.worry.need;
  const wrong = C.ACTIONS.find(a => a.id !== need).id;
  const before = g.state.combo;
  const r = g.tap(wrong);
  ok(r.correct === false, '違うお世話は不正解');
  ok(g.state.combo === 0, '不正解でコンボ0');
  ok(g.state.worry.patience < 100, '不正解でがまんゲージ減少');

  const r2 = g.tap(g.state.worry.need);
  ok(r2.correct === true && r2.resolved, '合うお世話で解決');
  ok(r2.coinsGained > 0, '解決でコイン獲得');
  ok(g.state.combo === 1, '解決でコンボ1');
}

// ---- コンボでコインが増える ----
section('コンボでコイン増加');
{
  const g = C.createGame({ rng: seededRng(2) });
  g.startAnimal('cat');
  // 同一レベルに留めるためレベルは固定的に見る：最初の解決と数回後の解決を比較
  const first = g.tap(g.state.worry.need).coinsGained;
  let later = first;
  for (let i = 0; i < 4; i++) {
    if (g.state.status !== 'playing') break;
    const r = g.tap(g.state.worry.need);
    if (r.coinsGained) later = r.coinsGained;
  }
  ok(later >= first, 'コンボが乗るとコインは減らない（増える）: ' + first + ' -> ' + later);
  ok(g.state.bestCombo >= 2, 'ベストコンボが伸びる');
}

// ---- タイムアウトでハートを失う／レベル失敗でやりなおし ----
section('タイムアウトとレベル失敗');
{
  const g = C.createGame({ rng: seededRng(7) });
  g.startAnimal('dog');
  let timeouts = 0, failed = false;
  for (let i = 0; i < 5000 && !failed; i++) {
    const r = g.tick(0.25); // 放置（タップしない）
    if (r.timeout) timeouts++;
    if (r.failed) failed = true;
  }
  ok(timeouts >= 3, 'タイムアウトが3回以上起きた: ' + timeouts);
  ok(failed === true, 'ハート全消失でレベル失敗');
  ok(g.state.hearts === g.state.maxHearts, '失敗後はハート回復');
  ok(g.state.progress === 0, '失敗後は進捗リセット');
  ok(g.state.status === 'playing', '失敗してもゲームは続く');
  ok(g.state.level === 1, '失敗ではレベルは上がらない');
}

// ---- 完璧プレイでLv100クリアできる ----
section('Lv100クリア（完璧プレイ）');
{
  const g = C.createGame({ rng: seededRng(42) });
  g.startAnimal('cat');
  let taps = 0;
  while (g.state.status === 'playing' && taps < 100000) {
    taps++;
    if (g.state.worry) g.tap(g.state.worry.need);
    else break;
  }
  ok(g.state.status === 'cleared', 'クリア状態になる');
  ok(g.state.cleared.includes('cat'), 'クリア済みにcatが入る');
  ok(g.state.coins > 0, 'コインが貯まっている: ' + g.state.coins);
  ok(g.state.coins < 25000, 'コインのインフレが抑えられている(<25000): ' + g.state.coins);
  ok(g.state.level > C.MAX_LEVEL, 'レベルが100を超えた: ' + g.state.level);
  console.log('  → クリアまでのタップ数: ' + taps + ' / 最終コイン: ' + g.state.coins + ' / ベストコンボ: ' + g.state.bestCombo);
}

// ---- ガチャ ----
section('ガチャ');
{
  const g = C.createGame({ rng: seededRng(3) });
  g.state.coins = 1000;
  const before = g.state.coins;
  const r = g.spinGacha('rare');
  ok(r.ok === true, 'コイン足りればガチャ成功');
  ok(g.state.coins === before - 120, 'レアは120コイン消費');
  ok(g.state.collection[r.item] === 1, '景品がコレクションに追加');

  g.state.coins = 10;
  const r2 = g.spinGacha('super');
  ok(r2.ok === false && r2.reason === 'coins', 'コイン不足だと回せない');
}

// ---- 装備バフ ----
section('装備バフ');
{
  const g = C.createGame({ rng: seededRng(5) });
  g.startAnimal('cat');
  g.state.collection['🦄'] = 1; // patience 0.7
  ok(g.patienceMult() === 1, '装備前は等倍');
  ok(g.equip('🦄') === true, '装備できる');
  ok(g.patienceMult() < 1, 'がまんバフでゲージが減りにくい');
  ok(g.equip('🦄') === true && g.state.equipped === null, '同じものを再タップで外れる');

  g.state.collection['💎'] = 1; // heart +1
  g.equip('💎');
  ok(g.baseMaxHearts() === 4, 'ハートバフで最大ハート+1');

  g.state.collection['🍪'] = 1; // coin 1.25
  g.equip('🍪');
  ok(g.coinMult() > 1, 'コインバフでコイン倍率アップ');
}

// ---- アイテムをペットに使う ----
section('アイテムをペットに使う');
{
  const g = C.createGame({ rng: seededRng(11) });
  g.startAnimal('cat');
  // ステータスを減らしておく
  g.state.stats.hunger = 20; g.state.stats.clean = 20; g.state.stats.mood = 20;
  g.state.collection['🍬'] = 2;
  if (g.state.worry) g.state.worry.patience = 30;
  const r = g.useItem('🍬');
  ok(r.ok === true, 'アイテムを使える');
  ok(g.state.collection['🍬'] === 1, '使うと1個減る');
  ok(g.state.stats.hunger > 20 && g.state.stats.mood > 20, '使うとステータス回復');
  ok(!g.state.worry || g.state.worry.patience === 100, '使うと悩みのがまんが回復');

  // 最後の1個を使い切ると消える
  g.useItem('🍬');
  ok(!('🍬' in g.state.collection), '使い切ると一覧から消える');

  // 持ってないものは使えない
  ok(g.useItem('🚀').ok === false, '持っていないアイテムは使えない');

  // ハート系アイテムは減ったハートを1回復
  g.state.hearts = 1; g.state.maxHearts = 3;
  g.state.collection['💎'] = 1;
  const rh = g.useItem('💎');
  ok(rh.healedHeart === true && g.state.hearts === 2, 'ハート系アイテムでハート回復');

  // コイン系アイテムはコインを得る
  const coinsBefore = g.state.coins;
  g.state.collection['🍪'] = 1;
  const rc = g.useItem('🍪');
  ok(rc.coinGain > 0 && g.state.coins > coinsBefore, 'コイン系アイテムでコイン獲得');

  // 使うと装備も外れる（使い切った場合）
  g.state.collection['🦄'] = 1; g.equip('🦄');
  ok(g.state.equipped === '🦄', '装備中');
  g.useItem('🦄');
  ok(g.state.equipped === null, '使い切ると装備が外れる');
}

// ---- まとめ ----
console.log('\n=====================================');
console.log(`  PASS: ${pass}  FAIL: ${fail}`);
console.log('=====================================');
process.exit(fail === 0 ? 0 : 1);
