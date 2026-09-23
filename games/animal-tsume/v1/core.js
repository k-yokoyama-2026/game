/* どうぶつ詰めしょうぎ — コアロジック（DOM非依存・テスト可能）
 * ルールは田中哲朗「どうぶつしょうぎの完全解析」(2009) に合わせる:
 *  - 盤は 3列×4段。マス番号 0..11 = 段*3+列。0段目が上（相手の陣）。
 *  - +はあなた（攻め方・下から上へ進む）、-は相手。1=ライオン 2=キリン 3=ゾウ 4=ヒヨコ 5=ニワトリ
 *  - 取った駒は持ち駒（ニワトリはヒヨコに戻る）。持ち駒は [ヒヨコ, キリン, ゾウ]。
 *  - ヒヨコは移動して相手の最奥段に入るとニワトリになる。打ったヒヨコは成らない。
 *  - ライオンを取ったら勝ち。ライオンが相手の最奥段に入り、次に取られなければ勝ち（トライ）。
 *  - 詰めしょうぎ: 攻め方は毎回「王手」（相手がなにもしなければ次にライオンを取れる手）をかける。
 */
(function (global) {
  const LION = 1, KIRIN = 2, ZOU = 3, HIYOKO = 4, NIWATORI = 5;
  const NAME = { 1: 'ライオン', 2: 'キリン', 3: 'ゾウ', 4: 'ヒヨコ', 5: 'ニワトリ' };
  const EMOJI = { 1: '🦁', 2: '🦒', 3: '🐘', 4: '🐤', 5: '🐔' };
  const HAND_PIECES = [HIYOKO, KIRIN, ZOU];       // 持ち駒配列の並び
  // 攻め方（+、上へ進む）から見た動き [段の差, 列の差]
  const DIRS = {
    1: [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]],
    2: [[-1, 0], [0, -1], [0, 1], [1, 0]],
    3: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
    4: [[-1, 0]],
    5: [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0]],
  };
  const INITIAL = {
    board: [-KIRIN, -LION, -ZOU, 0, -HIYOKO, 0, 0, HIYOKO, 0, ZOU, LION, KIRIN],
    handA: [0, 0, 0], handB: [0, 0, 0], turn: 1,
  };

  function clone(s) {
    return { board: s.board.slice(), handA: s.handA.slice(), handB: s.handB.slice(), turn: s.turn };
  }
  function dirsOf(piece, side) {
    const d = DIRS[Math.abs(piece)];
    return side === 1 ? d : d.map(([r, c]) => [-r, -c]);
  }
  // side の駒が sq のマスを取れるか（利きがあるか）
  function attacks(board, sq, side) {
    const tr = Math.floor(sq / 3), tc = sq % 3;
    for (let f = 0; f < 12; f++) {
      const p = board[f];
      if (p === 0 || Math.sign(p) !== side) continue;
      const r = Math.floor(f / 3), c = f % 3;
      for (const [dr, dc] of dirsOf(p, side)) if (r + dr === tr && c + dc === tc) return true;
    }
    return false;
  }
  function legalMoves(s) {
    const side = s.turn, out = [];
    for (let f = 0; f < 12; f++) {
      const p = s.board[f];
      if (p === 0 || Math.sign(p) !== side) continue;
      const r = Math.floor(f / 3), c = f % 3;
      for (const [dr, dc] of dirsOf(p, side)) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr > 3 || nc < 0 || nc > 2) continue;
        const t = nr * 3 + nc;
        if (s.board[t] !== 0 && Math.sign(s.board[t]) === side) continue;
        out.push({ from: f, to: t });
      }
    }
    const hand = side === 1 ? s.handA : s.handB;
    for (let i = 0; i < 3; i++) {
      if (hand[i] <= 0) continue;
      for (let t = 0; t < 12; t++) if (s.board[t] === 0) out.push({ drop: HAND_PIECES[i], to: t });
    }
    return out;
  }
  function sameMove(a, b) {
    if (!a || !b) return false;
    if (a.drop || b.drop) return a.drop === b.drop && a.to === b.to;
    return a.from === b.from && a.to === b.to;
  }
  // 着手して { state, winner, captured } を返す。winner: 勝った側（なければ 0）
  function applyMove(s0, m) {
    const s = clone(s0), side = s.turn;
    let captured = 0, winner = 0;
    if (m.drop) {
      s.board[m.to] = m.drop * side;                     // 打った駒は成らない
      const hand = side === 1 ? s.handA : s.handB;
      hand[HAND_PIECES.indexOf(m.drop)]--;
    } else {
      let p = s.board[m.from];
      captured = s.board[m.to];
      s.board[m.from] = 0;
      const lastRow = side === 1 ? 0 : 3;
      if (Math.abs(p) === HIYOKO && Math.floor(m.to / 3) === lastRow) p = NIWATORI * side;
      s.board[m.to] = p;
      if (captured !== 0) {
        if (Math.abs(captured) === LION) winner = side;
        else {
          const kind = Math.abs(captured) === NIWATORI ? HIYOKO : Math.abs(captured);
          (side === 1 ? s.handA : s.handB)[HAND_PIECES.indexOf(kind)]++;
        }
      }
      if (!winner && Math.abs(p) === LION && Math.floor(m.to / 3) === lastRow && !attacks(s.board, m.to, -side)) {
        winner = side;                                   // トライ成功
      }
    }
    s.turn = -side;
    return { state: s, winner, captured };
  }
  function lionSquare(board, side) { return board.indexOf(LION * side); }
  // 手番の相手（いま指した側）が、次にライオンを取れるか ＝ 王手がかかっているか
  function inCheck(s) {
    const sq = lionSquare(s.board, s.turn);
    return sq >= 0 && attacks(s.board, sq, -s.turn);
  }
  // 詰み上がり: 受け方の手番で王手がかかっていて、どう応じても攻め方がすぐ勝てる（ライオンを取る／トライ）
  function isMateNet(s) {
    if (!inCheck(s)) return false;
    const replies = legalMoves(s);
    if (replies.length === 0) return false;
    for (const m of replies) {
      const r = applyMove(s, m);
      if (r.winner) return false;
      if (!legalMoves(r.state).some(x => applyMove(r.state, x).winner === r.state.turn)) return false;
    }
    return true;
  }
  // 詰み上がりの局面で受け方の応手を 1 つ選ぶ（ライオンが逃げる手を優先）
  function pickReply(s) {
    const ms = legalMoves(s);
    return ms.find(m => !m.drop && Math.abs(s.board[m.from]) === LION) || ms.find(m => !m.drop) || ms[0];
  }
  function perft(s, depth) {
    if (depth === 0) return 1;
    let n = 0;
    for (const m of legalMoves(s)) {
      const r = applyMove(s, m);
      n += r.winner ? 1 : perft(r.state, depth - 1);
    }
    return n;
  }

  /* ---------- 問題の進行 ---------- */
  function startState(pz) {
    return { board: pz.start.board.slice(), handA: pz.start.handA.slice(), handB: pz.start.handB.slice(), turn: 1 };
  }
  function newSession(pz) {
    return { pz, state: startState(pz), step: 0, phase: 'attack', mistakes: 0, hints: 0, history: [] };
  }
  // あと何手（攻め方の手数，田中の数え方）
  function movesLeft(ss) {
    if (ss.phase === 'finish') return 0;
    return ss.pz.line.length - ss.step;
  }
  function correctMove(ss) {
    if (ss.phase === 'attack') return ss.pz.line[ss.step];
    if (ss.phase === 'finish') return legalMoves(ss.state).find(m => applyMove(ss.state, m).winner === 1) || null;
    return null;
  }
  /* プレイヤー（攻め方）の手を試す。戻り値:
   *  { kind: 'illegal' | 'notCheck' | 'wrong' }               … 盤はそのまま（mistakes が増える）
   *  { kind: 'ok', reply, replyState, finish }                 … 正解。reply は相手の応手（なければ null）
   *  { kind: 'solved', winType: 'capture' | 'try' }           … ライオンをとった（またはトライ）
   */
  function play(ss, m) {
    if (ss.phase === 'solved') return { kind: 'solved' };
    if (!legalMoves(ss.state).some(x => sameMove(x, m))) return { kind: 'illegal' };
    const r = applyMove(ss.state, m);
    if (r.winner === 1) {
      ss.history.push(clone(ss.state));
      ss.state = r.state; ss.phase = 'solved';
      return { kind: 'solved', winType: Math.abs(r.captured) === LION ? 'capture' : 'try' };
    }
    if (ss.phase === 'finish') { ss.mistakes++; return { kind: 'wrong', needWin: true }; }
    if (!inCheck(r.state)) { ss.mistakes++; return { kind: 'notCheck' }; }
    // 最後の王手（あと1手）は、詰み上がりになる手ならどれでも正解（最終手余詰は詰めしょうぎでも許される）
    const lastCheck = ss.step === ss.pz.line.length - 1;
    const isLine = sameMove(m, ss.pz.line[ss.step]);
    if (!isLine && !(lastCheck && isMateNet(r.state))) { ss.mistakes++; return { kind: 'wrong' }; }
    ss.history.push(clone(ss.state));
    ss.state = r.state; ss.step++;
    let reply;
    if (ss.step < ss.pz.line.length) { reply = ss.pz.line[ss.step]; ss.step++; }
    else { reply = isLine ? ss.pz.reply : pickReply(ss.state); ss.phase = 'finish'; }
    const rr = applyMove(ss.state, reply);
    ss.state = rr.state;
    return { kind: 'ok', reply, replyState: rr.state, finish: ss.phase === 'finish' };
  }
  function useHint(ss) { ss.hints++; return correctMove(ss); }
  // ★: まちがい・ヒントなしで3、合計2回まで2、それ以上1
  function stars(ss) {
    const k = ss.mistakes + ss.hints;
    return k === 0 ? 3 : k <= 2 ? 2 : 1;
  }

  /* ---------- 級（難易度） ---------- */
  const LEVELS = [
    { level: 1, name: 'ひよこ級', icon: '🐤', moves: '1手詰め', who: 'はじめての人・小学校低学年', color: '#fbc02d' },
    { level: 2, name: 'にわとり級', icon: '🐔', moves: '3手詰め', who: '小学生', color: '#ef6c00' },
    { level: 3, name: 'ぞう級', icon: '🐘', moves: '5手詰め', who: '小学校高学年', color: '#8e24aa' },
    { level: 4, name: 'きりん級', icon: '🦒', moves: '7〜9手詰め', who: '中学生・大人', color: '#43a047' },
    { level: 5, name: 'ライオン級', icon: '🦁', moves: '11〜13手詰め', who: '将棋が得意な人', color: '#e53935' },
    { level: 6, name: '名人級', icon: '👑', moves: '15〜19手詰め', who: '上級者（大人でもむずかしい）', color: '#37474f' },
  ];

  /* ---------- 記録 ---------- */
  // rec = { [id]: stars }。新しい★が多ければ更新
  function recordResult(rec, id, st) {
    const r = Object.assign({}, rec || {});
    if (!(r[id] >= st)) r[id] = st;
    return r;
  }
  function totalStars(rec) { return Object.values(rec || {}).reduce((a, b) => a + (Number(b) || 0), 0); }
  function levelProgress(rec, puzzles, level) {
    const ps = puzzles.filter(p => p.level === level);
    const solved = ps.filter(p => rec && rec[p.id] > 0).length;
    const st = ps.reduce((a, p) => a + ((rec && rec[p.id]) || 0), 0);
    return { solved, total: ps.length, stars: st, maxStars: ps.length * 3 };
  }
  function parseRecord(raw) {
    try { const o = JSON.parse(raw); return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; } catch (e) { return {}; }
  }

  const api = {
    LION, KIRIN, ZOU, HIYOKO, NIWATORI, NAME, EMOJI, HAND_PIECES, INITIAL, LEVELS,
    clone, attacks, legalMoves, sameMove, applyMove, inCheck, isMateNet, pickReply, perft,
    newSession, startState, movesLeft, correctMove, play, useHint, stars,
    recordResult, totalStars, levelProgress, parseRecord,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) global.TsumeCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
