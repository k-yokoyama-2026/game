/* モンスターたんけん — コアロジック（DOM非依存・テスト可能）
 * ポケモン赤緑風RPGの「データ＆計算」部分。描画やキー入力は index.html 側。 */
(function (global) {
  'use strict';

  // ===== タイプ =====
  // ほのお > くさ > みず > ほのお の三すくみ。ノーマルは等倍。
  const TYPES = ['ノーマル', 'ほのお', 'みず', 'くさ'];
  const TYPE_COLOR = { 'ノーマル': '#a8a878', 'ほのお': '#f0843c', 'みず': '#5aa0e0', 'くさ': '#6fbf5a' };

  function typeMultiplier(atkType, defType) {
    if (atkType === 'ほのお' && defType === 'くさ') return 2;
    if (atkType === 'くさ' && defType === 'みず') return 2;
    if (atkType === 'みず' && defType === 'ほのお') return 2;
    if (atkType === 'ほのお' && defType === 'みず') return 0.5;
    if (atkType === 'くさ' && defType === 'ほのお') return 0.5;
    if (atkType === 'みず' && defType === 'くさ') return 0.5;
    return 1;
  }

  // ===== わざ =====
  const MOVES = {
    taiatari:   { id: 'taiatari',   name: 'たいあたり',     type: 'ノーマル', power: 35, acc: 1.0 },
    hikkaki:    { id: 'hikkaki',    name: 'ひっかく',       type: 'ノーマル', power: 40, acc: 1.0 },
    kamituki:   { id: 'kamituki',   name: 'かみつく',       type: 'ノーマル', power: 55, acc: 0.95 },
    hayawaza:   { id: 'hayawaza',   name: 'はやてづき',     type: 'ノーマル', power: 40, acc: 1.0 },
    hinoko:     { id: 'hinoko',     name: 'ひのこ',         type: 'ほのお',   power: 40, acc: 1.0 },
    kaen:       { id: 'kaen',       name: 'かえんほうしゃ', type: 'ほのお',   power: 80, acc: 0.9 },
    mizudep:    { id: 'mizudep',    name: 'みずでっぽう',   type: 'みず',     power: 40, acc: 1.0 },
    bubble:     { id: 'bubble',     name: 'バブルこうせん', type: 'みず',     power: 75, acc: 0.9 },
    happa:      { id: 'happa',      name: 'はっぱカッター', type: 'くさ',     power: 40, acc: 1.0 },
    soraha:     { id: 'soraha',     name: 'リーフブレード', type: 'くさ',     power: 78, acc: 0.9 },
  };

  // ===== しゅぞく（モンスター種） =====
  // base: 種族値, learnset: そのレベルで覚えるわざ, evolveTo/evolveLv: 進化
  const SPECIES = {
    hinoko: {
      id: 'hinoko', name: 'ヒノコ', type: 'ほのお', baseXp: 64,
      base: { hp: 39, atk: 14, def: 11, spd: 13 },
      learnset: [{ lv: 1, m: 'hikkaki' }, { lv: 1, m: 'hinoko' }, { lv: 12, m: 'kamituki' }, { lv: 20, m: 'kaen' }],
      evolveTo: 'kaendon', evolveLv: 16, flavor: 'しっぽの火が げんきのしるし。',
    },
    kaendon: {
      id: 'kaendon', name: 'カエンドン', type: 'ほのお', baseXp: 142,
      base: { hp: 64, atk: 22, def: 18, spd: 20 },
      learnset: [{ lv: 1, m: 'hikkaki' }, { lv: 1, m: 'hinoko' }, { lv: 1, m: 'kamituki' }, { lv: 20, m: 'kaen' }],
      evolveTo: null, evolveLv: null, flavor: 'せなかから ほのおを ふきあげる。',
    },
    mizuti: {
      id: 'mizuti', name: 'ミズチ', type: 'みず', baseXp: 64,
      base: { hp: 44, atk: 12, def: 13, spd: 11 },
      learnset: [{ lv: 1, m: 'taiatari' }, { lv: 1, m: 'mizudep' }, { lv: 12, m: 'kamituki' }, { lv: 20, m: 'bubble' }],
      evolveTo: 'umidora', evolveLv: 16, flavor: 'きれいな みずべに すんでいる。',
    },
    umidora: {
      id: 'umidora', name: 'ウミドラ', type: 'みず', baseXp: 142,
      base: { hp: 68, atk: 18, def: 21, spd: 18 },
      learnset: [{ lv: 1, m: 'taiatari' }, { lv: 1, m: 'mizudep' }, { lv: 1, m: 'kamituki' }, { lv: 20, m: 'bubble' }],
      evolveTo: null, evolveLv: null, flavor: 'うずまく しおを あやつる りゅう。',
    },
    kusamo: {
      id: 'kusamo', name: 'クサモ', type: 'くさ', baseXp: 64,
      base: { hp: 45, atk: 13, def: 13, spd: 10 },
      learnset: [{ lv: 1, m: 'taiatari' }, { lv: 1, m: 'happa' }, { lv: 12, m: 'kamituki' }, { lv: 20, m: 'soraha' }],
      evolveTo: 'morion', evolveLv: 16, flavor: 'せなかの はっぱで ひかりを あびる。',
    },
    morion: {
      id: 'morion', name: 'モリオン', type: 'くさ', baseXp: 142,
      base: { hp: 70, atk: 19, def: 20, spd: 16 },
      learnset: [{ lv: 1, m: 'taiatari' }, { lv: 1, m: 'happa' }, { lv: 1, m: 'kamituki' }, { lv: 20, m: 'soraha' }],
      evolveTo: null, evolveLv: null, flavor: 'もりの ぬしと よばれる だいじゅ。',
    },
    // 野生でよく出る連中
    nonezu: {
      id: 'nonezu', name: 'ノネズ', type: 'ノーマル', baseXp: 51,
      base: { hp: 30, atk: 12, def: 9, spd: 14 },
      learnset: [{ lv: 1, m: 'taiatari' }, { lv: 1, m: 'hayawaza' }, { lv: 10, m: 'kamituki' }],
      evolveTo: 'dekanezu', evolveLv: 14, flavor: 'どこにでも いる ちいさな けもの。',
    },
    dekanezu: {
      id: 'dekanezu', name: 'デカネズ', type: 'ノーマル', baseXp: 110,
      base: { hp: 55, atk: 20, def: 16, spd: 22 },
      learnset: [{ lv: 1, m: 'hikkaki' }, { lv: 1, m: 'hayawaza' }, { lv: 1, m: 'kamituki' }],
      evolveTo: null, evolveLv: null, flavor: 'するどい きばで なんでも かじる。',
    },
    hanedori: {
      id: 'hanedori', name: 'ハネドリ', type: 'ノーマル', baseXp: 55,
      base: { hp: 34, atk: 13, def: 10, spd: 16 },
      learnset: [{ lv: 1, m: 'hikkaki' }, { lv: 1, m: 'hayawaza' }, { lv: 12, m: 'kamituki' }],
      evolveTo: null, evolveLv: null, flavor: 'そらを すばやく とびまわる とり。',
    },
    mushimaru: {
      id: 'mushimaru', name: 'ムシマル', type: 'くさ', baseXp: 50,
      base: { hp: 36, atk: 11, def: 14, spd: 9 },
      learnset: [{ lv: 1, m: 'taiatari' }, { lv: 1, m: 'happa' }, { lv: 12, m: 'kamituki' }],
      evolveTo: null, evolveLv: null, flavor: 'はっぱの かげに かくれている。',
    },
    ishigoro: {
      id: 'ishigoro', name: 'イシゴロ', type: 'ノーマル', baseXp: 60,
      base: { hp: 40, atk: 14, def: 20, spd: 6 },
      learnset: [{ lv: 1, m: 'taiatari' }, { lv: 1, m: 'kamituki' }],
      evolveTo: null, evolveLv: null, flavor: 'いわの ように かたい からだ。',
    },
  };

  // 最初の相棒として選べる3匹
  const STARTERS = ['hinoko', 'mizuti', 'kusamo'];

  // ===== ステータス計算 =====
  function statHp(base, level) { return Math.floor(base * level / 50) + level + 10; }
  function statOther(base, level) { return Math.floor(base * level / 50) + 5; }

  // そのレベルまでに覚えるわざ（最大4つ・新しい順で後ろを残す）
  function movesForLevel(speciesId, level) {
    const sp = SPECIES[speciesId];
    const learned = sp.learnset.filter(e => e.lv <= level).map(e => e.m);
    // 重複除去（後勝ち）しつつ最大4つ
    const uniq = [];
    for (const m of learned) if (!uniq.includes(m)) uniq.push(m);
    return uniq.slice(-4);
  }

  // モンスター実体を作る
  function makeMonster(speciesId, level) {
    const sp = SPECIES[speciesId];
    if (!sp) throw new Error('unknown species: ' + speciesId);
    level = Math.max(1, Math.floor(level));
    const maxHp = statHp(sp.base.hp, level);
    return {
      species: speciesId,
      name: sp.name,
      type: sp.type,
      level: level,
      exp: 0,
      maxHp: maxHp,
      hp: maxHp,
      atk: statOther(sp.base.atk, level),
      def: statOther(sp.base.def, level),
      spd: statOther(sp.base.spd, level),
      moves: movesForLevel(speciesId, level),
    };
  }

  // ステータスをレベルに合わせて再計算（進化・レベルアップ後）。HPは差分を維持。
  function recalcStats(mon) {
    const sp = SPECIES[mon.species];
    const oldMax = mon.maxHp;
    const dmg = oldMax - mon.hp;
    mon.maxHp = statHp(sp.base.hp, mon.level);
    mon.atk = statOther(sp.base.atk, mon.level);
    mon.def = statOther(sp.base.def, mon.level);
    mon.spd = statOther(sp.base.spd, mon.level);
    mon.hp = Math.max(1, mon.maxHp - dmg);
    mon.type = sp.type;
    return mon;
  }

  // ===== ダメージ計算 =====
  function calcDamage(attacker, defender, move, rng) {
    const rand = rng || Math.random;
    const mv = typeof move === 'string' ? MOVES[move] : move;
    const eff = typeMultiplier(mv.type, defender.type);
    const base = Math.floor(((2 * attacker.level / 5 + 2) * mv.power * attacker.atk / Math.max(1, defender.def)) / 50) + 2;
    const variance = 0.85 + rand() * 0.15; // 0.85〜1.0
    let dmg = Math.floor(base * eff * variance);
    if (dmg < 1) dmg = 1;
    return { damage: dmg, effectiveness: eff };
  }

  function effectivenessLabel(eff) {
    if (eff >= 2) return 'こうかは ばつぐんだ！';
    if (eff <= 0.5) return 'こうかは いまひとつ…';
    return '';
  }

  // 命中判定
  function rollHit(move, rng) {
    const rand = rng || Math.random;
    const mv = typeof move === 'string' ? MOVES[move] : move;
    return rand() < mv.acc;
  }

  // ===== 経験値・レベルアップ =====
  // 次のレベルに必要な経験値
  function expToNext(level) { return level * level * 6 + level * 10; }

  // 敵をたおして得る経験値
  function expGain(defeated) {
    return Math.floor(SPECIES[defeated.species].baseXp * defeated.level / 7) + 1;
  }

  // 経験値を与え、レベルアップ/進化を処理。結果イベントを返す（UI演出用）。
  function gainExp(mon, amount) {
    const events = { levelsGained: 0, fromLevel: mon.level, learned: [], evolvedTo: null, exp: amount };
    mon.exp += amount;
    while (mon.level < 100 && mon.exp >= expToNext(mon.level)) {
      mon.exp -= expToNext(mon.level);
      mon.level++;
      events.levelsGained++;
      recalcStats(mon);
      // 新しく覚えたわざ
      const sp = SPECIES[mon.species];
      for (const e of sp.learnset) {
        if (e.lv === mon.level && !mon.moves.includes(e.m)) {
          events.learned.push(e.m);
          mon.moves.push(e.m);
          if (mon.moves.length > 4) mon.moves.shift();
        }
      }
      // 進化判定
      if (sp.evolveTo && sp.evolveLv && mon.level >= sp.evolveLv) {
        const toName = SPECIES[sp.evolveTo].name;
        mon.species = sp.evolveTo;
        mon.name = toName;
        recalcStats(mon);
        events.evolvedTo = toName;
      }
    }
    return events;
  }

  // ===== 捕獲 =====
  const BALLS = {
    normal: { id: 'normal', name: 'モンスターボール', bonus: 1.0 },
    super: { id: 'super', name: 'スーパーボール', bonus: 1.5 },
  };

  // 捕獲確率（0〜1）。HPが低いほど、ballの性能が良いほど、相手レベルが低いほど上がる。
  function catchChance(target, ballId) {
    const ball = BALLS[ballId] || BALLS.normal;
    const hpRatio = target.hp / target.maxHp;
    let p = (1 - hpRatio * 0.85) * 0.55 * ball.bonus + 0.05;
    // 高レベルは捕まえにくい
    p -= Math.max(0, (target.level - 10)) * 0.01;
    return Math.max(0.02, Math.min(0.95, p));
  }

  function tryCatch(target, ballId, rng) {
    const rand = rng || Math.random;
    return rand() < catchChance(target, ballId);
  }

  // ===== フィールド／エンカウント =====
  // タイル種別
  const TILE = { PATH: 0, GRASS: 1, TREE: 2, WATER: 3, BUILDING: 4, FLOOR: 5, FLOWER: 6, SIGN: 7, DOOR: 8 };
  const WALKABLE = new Set([TILE.PATH, TILE.GRASS, TILE.FLOOR, TILE.FLOWER, TILE.DOOR]);

  function tileAt(grid, x, y) {
    if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return TILE.TREE;
    return grid[y][x];
  }
  function canWalk(grid, x, y) { return WALKABLE.has(tileAt(grid, x, y)); }
  function isGrass(grid, x, y) { return tileAt(grid, x, y) === TILE.GRASS; }

  // 移動を試みる。歩けるなら新座標、ダメなら元座標を返す。
  function tryMove(grid, x, y, dx, dy) {
    const nx = x + dx, ny = y + dy;
    if (canWalk(grid, nx, ny)) return { x: nx, y: ny, moved: true };
    return { x, y, moved: false };
  }

  // 草むらでのエンカウント判定
  function rollEncounter(rng, rate) {
    const rand = rng || Math.random;
    return rand() < (rate == null ? 0.16 : rate);
  }

  // 野生モンスターを生成（エリアごとの出現テーブル）
  // table: [{ species, min, max, weight }]
  function spawnWild(table, rng) {
    const rand = rng || Math.random;
    const total = table.reduce((s, e) => s + e.weight, 0);
    let r = rand() * total;
    let pick = table[0];
    for (const e of table) { if (r < e.weight) { pick = e; break; } r -= e.weight; }
    const lv = pick.min + Math.floor(rand() * (pick.max - pick.min + 1));
    return makeMonster(pick.species, lv);
  }

  // ===== 手持ちユーティリティ =====
  function isFainted(mon) { return mon.hp <= 0; }
  function partyAllFainted(party) { return party.every(isFainted); }
  function firstHealthy(party) { return party.findIndex(m => !isFainted(m)); }
  function healAll(party) { party.forEach(m => { m.hp = m.maxHp; }); }

  // AIが選ぶわざ（一番ダメージが大きいものを単純選択）
  function chooseEnemyMove(attacker, defender, rng) {
    let best = attacker.moves[0], bestDmg = -1;
    for (const mid of attacker.moves) {
      const d = calcDamage(attacker, defender, mid, () => 0.92).damage;
      if (d > bestDmg) { bestDmg = d; best = mid; }
    }
    return best;
  }

  const api = {
    TYPES, TYPE_COLOR, typeMultiplier, MOVES, SPECIES, STARTERS, BALLS, TILE, WALKABLE,
    statHp, statOther, movesForLevel, makeMonster, recalcStats,
    calcDamage, effectivenessLabel, rollHit,
    expToNext, expGain, expGain2: expGain, gainExp,
    catchChance, tryCatch,
    tileAt, canWalk, isGrass, tryMove, rollEncounter, spawnWild,
    isFainted, partyAllFainted, firstHealthy, healAll, chooseEnemyMove,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) global.MQCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
