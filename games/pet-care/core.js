/* ペットそだて — コアロジック（DOM非依存・テスト可能）
 * ブラウザでは window.PetCore、Nodeでは module.exports で利用する。 */
(function (global) {
  const MAX_LEVEL = 100;

  const ANIMALS = {
    cat:     { name: 'ねこ',       faces: { happy: '😸', normal: '🐱', sad: '😿' } },
    dog:     { name: 'いぬ',       faces: { happy: '🐶', normal: '🐶', sad: '🥺' } },
    hamster: { name: 'ハムスター', faces: { happy: '🐹', normal: '🐹', sad: '😣' } },
  };
  const ANIMAL_ORDER = ['cat', 'dog', 'hamster'];

  // お世話アクション（id は悩みの need と対応）
  const ACTIONS = [
    { id: 'feed',  label: 'ごはん', emoji: '🍚', stat: 'hunger' },
    { id: 'water', label: 'おみず', emoji: '💧', stat: 'hunger' },
    { id: 'bath',  label: 'おふろ', emoji: '🛁', stat: 'clean'  },
    { id: 'clean', label: 'そうじ', emoji: '🧹', stat: 'clean'  },
    { id: 'play',  label: 'あそぶ', emoji: '🎾', stat: 'mood'   },
    { id: 'pet',   label: 'なでる', emoji: '🤚', stat: 'mood'   },
    { id: 'sleep', label: 'ねんね', emoji: '🛏️', stat: 'mood'   },
  ];

  const WORRIES = {
    feed:  'おなかペコペコだよ〜',
    water: 'のどが カラカラ…',
    bath:  'からだが ベタベタする…',
    clean: 'おうちが よごれてるよ',
    play:  'たいくつで つまんない！',
    pet:   'さみしいよ、なでて〜',
    sleep: 'ねむくて たまらない…',
  };

  const STAT_GROUP = {
    hunger: ['feed', 'water'],
    clean:  ['bath', 'clean'],
    mood:   ['play', 'pet', 'sleep'],
  };

  const GACHA = [
    { id: 'normal', name: 'ノーマル',     cost: 30,  color: '#5b9bd5', icon: '🎁',
      pool: ['🎀', '🧶', '⚽', '🦴', '🍪', '🧦', '🪀', '🍬', '🎈'] },
    { id: 'rare',   name: 'レア',         cost: 120, color: '#7c4dff', icon: '💜',
      pool: ['👑', '🎩', '🕶️', '🎸', '🛹', '🎮', '🏅', '🧁'] },
    { id: 'super',  name: 'スーパーレア', cost: 400, color: '#ff9800', icon: '🌟',
      pool: ['💎', '🦄', '🌈', '🚀', '🐉', '👽', '🏆', '✨'] },
  ];

  // ガチャ景品の一部は装備すると能力アップ（ゲーム性のための要素）
  const ITEM_BUFFS = {
    '🎀': { type: 'patience', mult: 0.82, desc: 'がまん +' },
    '🧶': { type: 'patience', mult: 0.82, desc: 'がまん +' },
    '🍪': { type: 'coin',     mult: 1.25, desc: 'コイン +' },
    '🧁': { type: 'coin',     mult: 1.25, desc: 'コイン +' },
    '👑': { type: 'coin',     mult: 1.5,  desc: 'コイン ++' },
    '🏅': { type: 'patience', mult: 0.75, desc: 'がまん ++' },
    '💎': { type: 'heart',    amount: 1,  desc: 'ハート +1' },
    '🦄': { type: 'patience', mult: 0.7,  desc: 'がまん ++' },
    '🏆': { type: 'coin',     mult: 1.8,  desc: 'コイン +++' },
    '🐉': { type: 'heart',    amount: 1,  desc: 'ハート +1' },
  };

  // 難易度カーブ
  function stepsForLevel(lv) { return Math.min(3 + Math.floor((lv - 1) / 12), 8); }
  function drainPerSec(lv)   { return 11 + lv * 0.7; } // がまんゲージの減少率（%/秒）

  function createGame(opts) {
    opts = opts || {};
    const rng = opts.rng || Math.random;
    const saved = opts.save || {};

    const state = {
      animal: null,
      level: 1,
      progress: 0,
      stepsNeeded: 3,
      hearts: 3,
      maxHearts: 3,
      coins: saved.coins || 0,
      collection: saved.collection || {},
      cleared: saved.cleared || [],
      equipped: saved.equipped || null,
      combo: 0,
      bestCombo: 0,
      stats: { hunger: 70, clean: 70, mood: 70 },
      worry: null, // { need, patience(0..100) }
      status: 'select', // select | playing | cleared
    };

    function buff() { return ITEM_BUFFS[state.equipped] || null; }
    function baseMaxHearts() { const b = buff(); return 3 + (b && b.type === 'heart' ? b.amount : 0); }
    function patienceMult()  { const b = buff(); return b && b.type === 'patience' ? b.mult : 1; }
    function coinMult()      { const b = buff(); return b && b.type === 'coin' ? b.mult : 1; }
    function avgStat()       { return (state.stats.hunger + state.stats.clean + state.stats.mood) / 3; }

    function startAnimal(key, level) {
      state.animal = key;
      state.level = level || 1;
      state.progress = 0;
      state.stepsNeeded = stepsForLevel(state.level);
      state.maxHearts = baseMaxHearts();
      state.hearts = state.maxHearts;
      state.combo = 0;
      state.stats = { hunger: 70, clean: 70, mood: 70 };
      state.status = 'playing';
      newWorry();
    }

    function newWorry() {
      // 一番低いステータスのグループから出やすい（たまにランダム）
      const entries = Object.entries(state.stats).sort((a, b) => a[1] - b[1]);
      const stat = rng() < 0.7 ? entries[0][0] : entries[Math.floor(rng() * 3)][0];
      const group = STAT_GROUP[stat];
      const need = group[Math.floor(rng() * group.length)];
      state.worry = { need: need, patience: 100 };
    }

    function rewardCoins() {
      const base = 3 + Math.floor(state.level / 10);             // インフレ抑制（緩やかに増加）
      const comboMult = 1 + Math.min(state.combo - 1, 4) * 0.5; // 最大3倍
      const neglect = avgStat() < 30 ? 0.5 : 1;                 // 放置しすぎると半減
      const gained = Math.max(1, Math.round(base * comboMult * coinMult() * neglect));
      state.coins += gained;
      return gained;
    }

    function tap(actionId) {
      if (state.status !== 'playing') return { ignored: true };
      const act = ACTIONS.find(a => a.id === actionId);
      if (!act) return { ignored: true };

      state.stats[act.stat] = Math.min(100, state.stats[act.stat] + 16);

      if (state.worry && actionId === state.worry.need) {
        // 悩み解決 ＝ ステップクリア
        state.stats[act.stat] = Math.min(100, state.stats[act.stat] + 20);
        state.stats.mood = Math.min(100, state.stats.mood + 6);
        state.combo++;
        state.bestCombo = Math.max(state.bestCombo, state.combo);
        const gained = rewardCoins();
        state.progress++;
        let leveledUp = false, cleared = false, bonus = 0;
        if (state.progress >= state.stepsNeeded) {
          const r = levelUp();
          leveledUp = true; cleared = r.cleared; bonus = r.bonus;
        } else {
          newWorry();
        }
        return { correct: true, resolved: true, coinsGained: gained, combo: state.combo, leveledUp, cleared, bonus };
      }

      // お世話ちがい
      if (state.worry) state.worry.patience = Math.max(0, state.worry.patience - 18);
      state.combo = 0;
      state.stats.mood = Math.max(0, state.stats.mood - 4);
      let lostHeart = false, failed = false;
      if (state.worry && state.worry.patience <= 0) {
        const r = loseHeart();
        lostHeart = true; failed = r.failed;
      }
      return { correct: false, wrong: true, lostHeart, failed };
    }

    function tick(dtSec) {
      if (state.status !== 'playing' || !state.worry) return {};
      const neglect = avgStat() < 30 ? 1.3 : 1;
      state.worry.patience -= drainPerSec(state.level) * patienceMult() * neglect * dtSec;
      for (const k of ['hunger', 'clean', 'mood']) {
        state.stats[k] = Math.max(0, state.stats[k] - 1.2 * dtSec);
      }
      if (state.worry.patience <= 0) {
        state.worry.patience = 0;
        const r = loseHeart();
        return { timeout: true, lostHeart: true, failed: r.failed };
      }
      return {};
    }

    function loseHeart() {
      state.combo = 0;
      state.hearts--;
      state.stats.mood = Math.max(0, state.stats.mood - 10);
      if (state.hearts <= 0) {
        // レベル失敗 → そのレベルをやりなおし（コイン・コレクションは保持）
        state.hearts = state.maxHearts;
        state.progress = 0;
        newWorry();
        return { failed: true };
      }
      newWorry();
      return { failed: false };
    }

    function levelUp() {
      state.progress = 0;
      state.level++;
      const bonus = 8 + Math.floor(state.level / 4);            // レベルアップ報酬も緩やかに
      state.coins += bonus;
      if (state.level > MAX_LEVEL) {
        if (!state.cleared.includes(state.animal)) state.cleared.push(state.animal);
        state.status = 'cleared';
        state.worry = null;
        return { cleared: true, bonus };
      }
      state.stepsNeeded = stepsForLevel(state.level);
      state.maxHearts = baseMaxHearts();
      state.hearts = state.maxHearts;
      newWorry();
      return { cleared: false, bonus };
    }

    function spinGacha(tierId) {
      const g = GACHA.find(t => t.id === tierId);
      if (!g) return { ok: false, reason: 'tier' };
      if (state.coins < g.cost) return { ok: false, reason: 'coins' };
      state.coins -= g.cost;
      const item = g.pool[Math.floor(rng() * g.pool.length)];
      state.collection[item] = (state.collection[item] || 0) + 1;
      return { ok: true, item, tier: g, cost: g.cost };
    }

    function equip(item) {
      if (!state.collection[item]) return false;
      state.equipped = state.equipped === item ? null : item;
      state.maxHearts = baseMaxHearts();
      if (state.hearts > state.maxHearts) state.hearts = state.maxHearts;
      return true;
    }

    // コレクションのアイテムをペットに使う（1個消費して効果を発動）
    function useItem(item) {
      if (state.status !== 'playing') return { ok: false, reason: 'state' };
      if (!state.collection[item]) return { ok: false, reason: 'none' };
      state.collection[item]--;
      if (state.collection[item] <= 0) {
        delete state.collection[item];
        if (state.equipped === item) {
          state.equipped = null;
          state.maxHearts = baseMaxHearts();
          if (state.hearts > state.maxHearts) state.hearts = state.maxHearts;
        }
      }
      // 効果：ペットを元気にする（全ステータス回復＋いまの悩みのがまんも回復）
      for (const k of ['hunger', 'clean', 'mood']) state.stats[k] = Math.min(100, state.stats[k] + 35);
      let healedHeart = false, coinGain = 0;
      const b = ITEM_BUFFS[item];
      if (b && b.type === 'heart' && state.hearts < state.maxHearts) { state.hearts++; healedHeart = true; }
      if (b && b.type === 'coin') { coinGain = 20; state.coins += coinGain; }
      if (state.worry) state.worry.patience = 100;
      return { ok: true, healedHeart, coinGain };
    }

    return {
      state,
      startAnimal, newWorry, tap, tick, levelUp, loseHeart, spinGacha, equip, useItem,
      patienceMult, coinMult, baseMaxHearts, avgStat,
    };
  }

  const api = {
    createGame, MAX_LEVEL, ANIMALS, ANIMAL_ORDER, ACTIONS, WORRIES,
    STAT_GROUP, GACHA, ITEM_BUFFS, stepsForLevel, drainPerSec,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) global.PetCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
