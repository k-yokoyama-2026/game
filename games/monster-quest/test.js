/* モンスターたんけん — コアロジックのテスト */
const C = require('./core.js');
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('  ✗ FAIL: ' + m); } }
function section(n) { console.log('\n# ' + n); }
function seededRng(seed) { let s = seed >>> 0; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }

section('タイプ相性（三すくみ）');
{
  ok(C.typeMultiplier('ほのお', 'くさ') === 2, 'ほのお→くさ は ばつぐん');
  ok(C.typeMultiplier('くさ', 'みず') === 2, 'くさ→みず は ばつぐん');
  ok(C.typeMultiplier('みず', 'ほのお') === 2, 'みず→ほのお は ばつぐん');
  ok(C.typeMultiplier('ほのお', 'みず') === 0.5, 'ほのお→みず は いまひとつ');
  ok(C.typeMultiplier('くさ', 'ほのお') === 0.5, 'くさ→ほのお は いまひとつ');
  ok(C.typeMultiplier('ノーマル', 'みず') === 1, 'ノーマルは等倍');
  ok(C.typeMultiplier('ほのお', 'ノーマル') === 1, 'ノーマル防御は等倍');
}

section('モンスター生成とステータス');
{
  const m = C.makeMonster('hinoko', 5);
  ok(m.species === 'hinoko' && m.name === 'ヒノコ', '種族と名前');
  ok(m.level === 5 && m.hp === m.maxHp, 'レベルと満タンHP');
  ok(m.maxHp > 0 && m.atk > 0 && m.def > 0 && m.spd > 0, 'ステータスは正');
  const hi = C.makeMonster('hinoko', 50);
  ok(hi.maxHp > m.maxHp && hi.atk > m.atk, 'レベルが高いほど強い');
  ok(m.moves.length >= 1 && m.moves.length <= 4, 'わざは1〜4個');
  ok(m.moves.includes('hinoko'), 'ヒノコは ひのこ を覚えている');
  let threw = false; try { C.makeMonster('nonexist', 5); } catch (e) { threw = true; }
  ok(threw, '存在しない種族はエラー');
}

section('わざの習得（レベル順・最大4）');
{
  ok(C.movesForLevel('hinoko', 1).length === 2, 'Lv1で2わざ');
  ok(C.movesForLevel('hinoko', 25).length <= 4, 'たくさん覚えても4まで');
  ok(C.movesForLevel('hinoko', 25).includes('kaen'), 'Lv20で かえんほうしゃ習得');
}

section('ダメージ計算');
{
  const atk = C.makeMonster('hinoko', 20);
  const grassDef = C.makeMonster('kusamo', 20);
  const waterDef = C.makeMonster('mizuti', 20);
  const dGrass = C.calcDamage(atk, grassDef, 'hinoko', () => 1).damage;
  const dWater = C.calcDamage(atk, waterDef, 'hinoko', () => 1).damage;
  ok(dGrass > dWater, 'ほのお技は くさ に大、みず に小');
  ok(C.calcDamage(atk, grassDef, 'hinoko', () => 1).effectiveness === 2, 'ばつぐん倍率');
  // ダメージは必ず1以上
  const weak = C.makeMonster('nonezu', 1);
  const tank = C.makeMonster('ishigoro', 80);
  ok(C.calcDamage(weak, tank, 'taiatari', () => 0).damage >= 1, 'ダメージは最低1');
  ok(C.effectivenessLabel(2).includes('ばつぐん'), 'ばつぐんラベル');
  ok(C.effectivenessLabel(0.5).includes('いまひとつ'), 'いまひとつラベル');
  ok(C.effectivenessLabel(1) === '', '等倍はラベルなし');
}

section('経験値・レベルアップ・進化');
{
  const m = C.makeMonster('hinoko', 10);
  const before = m.maxHp;
  const ev = C.gainExp(m, 100000); // 大量に与えて一気に上げる
  ok(m.level > 10, 'レベルが上がる');
  ok(m.maxHp > before, 'レベルアップでHP増');
  ok(ev.levelsGained > 0, 'イベントにレベルアップ数');
  // 進化: Lv16以上に上げると カエンドン
  ok(m.species === 'kaendon' && m.name === 'カエンドン', 'Lv16+で進化する');
  ok(ev.evolvedTo === 'カエンドン', '進化イベントが記録される');
  // 進化後タイプは維持
  ok(m.type === 'ほのお', '進化してもタイプ維持');
}
{
  // 少しずつでも閾値を超えればレベルが上がる
  const m = C.makeMonster('nonezu', 3);
  let lv = m.level;
  C.gainExp(m, C.expToNext(3) + 1);
  ok(m.level === lv + 1, 'ちょうど1レベル分でレベル+1');
  ok(C.expToNext(10) > C.expToNext(3), '高レベルほど必要経験値が増える');
}

section('捕獲確率');
{
  const full = C.makeMonster('nonezu', 5); // HP満タン
  const weak = C.makeMonster('nonezu', 5); weak.hp = 1; // 瀕死
  ok(C.catchChance(weak, 'normal') > C.catchChance(full, 'normal'), 'HPが低いほど捕まえやすい');
  ok(C.catchChance(weak, 'super') > C.catchChance(weak, 'normal'), 'スーパーボールの方が捕まえやすい');
  const hi = C.makeMonster('nonezu', 40); hi.hp = 1;
  ok(C.catchChance(hi, 'normal') < C.catchChance(weak, 'normal'), '高レベルは捕まえにくい');
  ok(C.catchChance(full, 'normal') >= 0.02 && C.catchChance(weak, 'super') <= 0.95, '確率は0.02〜0.95に収まる');
  // 瀕死をスーパーで何度も投げれば だいたい捕まる
  const rng = seededRng(42); let caught = 0;
  for (let i = 0; i < 200; i++) { const t = C.makeMonster('nonezu', 5); t.hp = 1; if (C.tryCatch(t, 'super', rng)) caught++; }
  ok(caught > 100, '瀕死＋スーパーなら過半数 捕獲');
}

section('フィールド移動とエンカウント');
{
  const T = C.TILE;
  const grid = [
    [T.TREE,  T.TREE,  T.TREE,  T.TREE],
    [T.TREE,  T.PATH,  T.GRASS, T.TREE],
    [T.TREE,  T.WATER, T.PATH,  T.TREE],
    [T.TREE,  T.TREE,  T.TREE,  T.TREE],
  ];
  ok(C.canWalk(grid, 1, 1), 'PATHは歩ける');
  ok(C.canWalk(grid, 2, 1), 'GRASSは歩ける');
  ok(!C.canWalk(grid, 0, 0), 'TREEは歩けない');
  ok(!C.canWalk(grid, 1, 2), 'WATERは歩けない');
  ok(!C.canWalk(grid, -1, 1), '範囲外は歩けない');
  ok(C.isGrass(grid, 2, 1) && !C.isGrass(grid, 1, 1), '草むら判定');
  // 移動
  ok(C.tryMove(grid, 1, 1, 1, 0).moved === true, 'PATHへ移動成功');
  const blocked = C.tryMove(grid, 1, 1, 0, 1); // 下はWATER
  ok(blocked.moved === false && blocked.x === 1 && blocked.y === 1, '壁/水へは移動しない');
  // エンカウント率
  ok(C.rollEncounter(() => 0.01) === true, '低い乱数でエンカウント');
  ok(C.rollEncounter(() => 0.99) === false, '高い乱数でエンカウントしない');
}

section('野生スポーン（重み付き出現）');
{
  const table = [
    { species: 'nonezu', min: 2, max: 4, weight: 70 },
    { species: 'hanedori', min: 3, max: 5, weight: 30 },
  ];
  const rng = seededRng(7);
  let nonezu = 0, others = 0, badLv = 0;
  for (let i = 0; i < 300; i++) {
    const w = C.spawnWild(table, rng);
    if (w.species === 'nonezu') { nonezu++; if (w.level < 2 || w.level > 4) badLv++; }
    else others++;
  }
  ok(nonezu > others, '重みの大きい種が多く出る');
  ok(badLv === 0, '出現レベルは範囲内');
  ok(nonezu + others === 300, '必ず1匹生成される');
}

section('手持ちユーティリティ');
{
  const a = C.makeMonster('hinoko', 5), b = C.makeMonster('mizuti', 5);
  const party = [a, b];
  ok(C.firstHealthy(party) === 0, '先頭が元気なら0');
  a.hp = 0;
  ok(C.isFainted(a) && !C.partyAllFainted(party), '1匹瀕死でも全滅ではない');
  ok(C.firstHealthy(party) === 1, '次の元気な仲間を探す');
  b.hp = 0;
  ok(C.partyAllFainted(party), '全員瀕死で全滅');
  C.healAll(party);
  ok(a.hp === a.maxHp && b.hp === b.maxHp, '全回復');
  ok(C.firstHealthy(party) === 0, '回復後は先頭が元気');
}

section('敵AIのわざ選択');
{
  const enemy = C.makeMonster('hinoko', 20);
  const grassTarget = C.makeMonster('kusamo', 20);
  const mv = C.chooseEnemyMove(enemy, grassTarget);
  ok(enemy.moves.includes(mv), 'AIは自分の覚えているわざを選ぶ');
  // くさ相手なら ほのお技（ばつぐん）を選びたがる
  ok(mv === 'hinoko' || MOVE_POWER(enemy, mv) >= MOVE_POWER(enemy, 'hikkaki'), 'くさ相手にほのお技を優先しがち');
}
function MOVE_POWER(mon, mid) { return C.calcDamage(mon, C.makeMonster('kusamo', 20), mid, () => 1).damage; }

console.log('\n=====================================');
console.log(`  PASS: ${pass}  FAIL: ${fail}`);
console.log('=====================================');
process.exit(fail === 0 ? 0 : 1);
