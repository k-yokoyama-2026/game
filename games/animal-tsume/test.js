/* どうぶつ詰めしょうぎ — コアロジックと問題集のテスト */
const C = require('./core.js');
const P = require('./puzzles.js');
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('  ✗ FAIL: ' + m); } }
function section(n) { console.log('\n# ' + n); }

section('ルール（perft: 田中 2009 の規則で 4, 17, 123, 980, 8174）');
{
  const want = [1, 4, 17, 123, 980, 8174];
  for (let d = 1; d <= 5; d++) ok(C.perft(C.INITIAL, d) === want[d], `perft(${d}) = ${want[d]}（実際 ${C.perft(C.INITIAL, d)}）`);
}

section('個別のルール');
{
  // 打ったヒヨコは最奥段でも成らない
  const s = { board: [0, 0, 0, 0, -C.LION, 0, 0, 0, 0, 0, C.LION, 0], handA: [1, 0, 0], handB: [0, 0, 0], turn: 1 };
  const r = C.applyMove(s, { drop: C.HIYOKO, to: 0 });
  ok(r.state.board[0] === C.HIYOKO, '打ったヒヨコは成らない');
  ok(r.state.handA[0] === 0, '打つと持ち駒が減る');
  // 移動で最奥段に入ったヒヨコは成る
  const s2 = { board: [0, 0, 0, C.HIYOKO, 0, -C.LION, 0, 0, 0, 0, C.LION, 0], handA: [0, 0, 0], handB: [0, 0, 0], turn: 1 };
  ok(C.applyMove(s2, { from: 3, to: 0 }).state.board[0] === C.NIWATORI, '移動で最奥段に入ると成る');
  // ニワトリを取るとヒヨコとして持ち駒に
  const s3 = { board: [0, -C.LION, 0, 0, -C.NIWATORI, 0, 0, C.KIRIN, 0, 0, C.LION, 0], handA: [0, 0, 0], handB: [0, 0, 0], turn: 1 };
  ok(C.applyMove(s3, { from: 7, to: 4 }).state.handA[0] === 1, 'ニワトリを取るとヒヨコが持ち駒に');
  // ライオンを取ったら勝ち
  const s4 = { board: [0, 0, 0, 0, -C.LION, 0, 0, C.KIRIN, 0, 0, C.LION, 0], handA: [0, 0, 0], handB: [0, 0, 0], turn: 1 };
  ok(C.applyMove(s4, { from: 7, to: 4 }).winner === 1, 'ライオンを取ると勝ち');
  // トライ: 取られないマスなら勝ち、取られるマスなら勝ちではない
  const s5 = { board: [0, 0, 0, C.LION, 0, 0, 0, 0, 0, 0, 0, -C.LION], handA: [0, 0, 0], handB: [0, 0, 0], turn: 1 };
  ok(C.applyMove(s5, { from: 3, to: 0 }).winner === 1, 'トライ成功');
  const s6 = { board: [0, 0, -C.KIRIN, C.LION, 0, 0, 0, 0, 0, 0, 0, -C.LION], handA: [0, 0, 0], handB: [0, 0, 0], turn: 1 };
  ok(C.applyMove(s6, { from: 3, to: 1 }).winner === 0, '取られるマスへのトライは勝ちではない');
  // 王手の判定
  ok(C.inCheck(C.applyMove({ board: [0, -C.LION, 0, 0, 0, 0, 0, C.KIRIN, 0, 0, C.LION, 0], handA: [0, 0, 0], handB: [0, 0, 0], turn: 1 }, { from: 7, to: 4 }).state), 'キリンがライオンの前に来れば王手');
}

section('問題集（全問を正解手順で解き切れる）');
{
  ok(Array.isArray(P) && P.length >= 50, `問題数 ${P.length}`);
  const levels = new Set(P.map(p => p.level));
  ok(levels.size === 6, '6つの級がそろっている');
  for (const L of C.LEVELS) ok(P.some(p => p.level === L.level), `${L.name} に問題がある`);
  let solvedAll = true, checksAll = true, nOk = true, rejectOk = true;
  for (const pz of P) {
    ok(pz.line.length === pz.n, `#${pz.id} 手順の長さ = 手数 ${pz.n}`);
    // 1手目: 正解以外の手はすべて弾かれる（王手でない or 逃げられる）
    const ss0 = C.newSession(pz);
    for (const m of C.legalMoves(ss0.state)) {
      if (C.sameMove(m, pz.line[0])) continue;
      const t = C.newSession(pz);
      const r = C.play(t, m);
      if (r.kind === 'ok') { rejectOk = false; console.error(`  #${pz.id} 正解以外の手 ${JSON.stringify(m)} が通った`); }
      if (r.kind === 'solved') { rejectOk = false; console.error(`  #${pz.id} 1手目でいきなり勝てる`); }
    }
    const ss = C.newSession(pz);
    ok(C.movesLeft(ss) === pz.n, `#${pz.id} 最初は あと${pz.n}手`);
    let r;
    for (let i = 0; i < pz.line.length; i += 2) {
      r = C.play(ss, pz.line[i]);
      if (r.kind !== 'ok') { solvedAll = false; console.error(`  #${pz.id} ${i + 1}手目 ${r.kind}`); break; }
      if (!C.inCheck(C.applyMove(C.startState(pz), pz.line[0]).state)) checksAll = false;
    }
    if (r && r.kind === 'ok') {
      ok(ss.phase === 'finish', `#${pz.id} 最後の王手の後は仕上げ`);
      const win = C.correctMove(ss);
      const r2 = C.play(ss, win);
      if (r2.kind !== 'solved') { solvedAll = false; console.error(`  #${pz.id} 仕上げで勝てない`); }
    }
    if (pz.n !== pz.line.length) nOk = false;
  }
  ok(solvedAll, '全問 正解手順＋仕上げでライオンがとれる');
  ok(checksAll, '全問 1手目が王手');
  ok(rejectOk, '全問 1手目で正解以外の手はすべて不正解になる（唯一解）');
  // 最後の王手: 詰み上がりになる手はどれでも受け付け、ならない手は弾く
  let lastOk = true, lastAlt = 0;
  for (const pz of P) {
    const ss = C.newSession(pz);
    for (let i = 0; i < pz.line.length - 1; i += 2) C.play(ss, pz.line[i]);
    const base = C.clone(ss.state);
    if (!C.isMateNet(C.applyMove(base, pz.line[pz.line.length - 1]).state)) { lastOk = false; console.error(`  #${pz.id} 手順の最後の王手が詰み上がりでない`); }
    for (const m of C.legalMoves(base)) {
      const t = C.newSession(pz);
      for (let i = 0; i < pz.line.length - 1; i += 2) C.play(t, pz.line[i]);
      const after = C.applyMove(base, m);
      const expectOk = !after.winner && C.isMateNet(after.state);
      const r = C.play(t, m);
      if (expectOk !== (r.kind === 'ok')) { lastOk = false; console.error(`  #${pz.id} 最後の王手 ${JSON.stringify(m)}: 期待 ${expectOk} 実際 ${r.kind}`); }
      if (expectOk && !C.sameMove(m, pz.line[pz.line.length - 1])) {
        lastAlt++;
        const w = C.correctMove(t);
        if (!w || C.play(t, w).kind !== 'solved') { lastOk = false; console.error(`  #${pz.id} 別の最後の王手のあと勝てない`); }
      }
    }
  }
  ok(lastOk, '全問 最後の王手は詰み上がりになる手をすべて受け付け、それ以外は弾く');
  console.log(`  （別解として受け付けた最後の王手: ${lastAlt} 手）`);
  ok(nOk, '全問 手数表示と手順が一致');
}

section('間違いとヒントと★');
{
  const pz = P.find(p => p.n === 3);
  const ss = C.newSession(pz);
  const wrong = C.legalMoves(ss.state).find(m => !C.sameMove(m, pz.line[0]));
  const r = C.play(ss, wrong);
  ok(r.kind === 'notCheck' || r.kind === 'wrong', '違う手は不正解: ' + r.kind);
  ok(ss.step === 0, '不正解では盤が進まない');
  ok(C.stars(ss) === 2, '1回まちがえると★2');
  const h = C.useHint(ss);
  ok(C.sameMove(h, pz.line[0]), 'ヒントは正解の手');
  ok(C.stars(ss) === 2, 'まちがい1＋ヒント1で★2');
  ss.mistakes = 5;
  ok(C.stars(ss) === 1, 'たくさんまちがえると★1');
  ok(C.stars(C.newSession(pz)) === 3, 'ノーミスは★3');
  ok(C.play(C.newSession(pz), { from: 99, to: 0 }).kind === 'illegal', 'ありえない手は illegal');
}

section('記録');
{
  let rec = C.recordResult({}, 5, 2);
  ok(rec[5] === 2, '記録される');
  rec = C.recordResult(rec, 5, 1);
  ok(rec[5] === 2, '★が減る記録では上書きしない');
  rec = C.recordResult(rec, 5, 3);
  ok(rec[5] === 3, '★が増えたら更新');
  ok(C.totalStars({ 1: 3, 2: 2 }) === 5, '★の合計');
  const lp = C.levelProgress({ 1: 3 }, P, 1);
  ok(lp.solved === 1 && lp.total === P.filter(p => p.level === 1).length, '級ごとの進み具合');
  ok(Object.keys(C.parseRecord('こわれた')).length === 0, 'こわれた記録は空として読む');
  ok(Object.keys(C.parseRecord('[1,2]')).length === 0, '配列は記録として読まない');
}

console.log('\n=====================================');
console.log(`  PASS: ${pass}  FAIL: ${fail}`);
console.log('=====================================');
process.exit(fail === 0 ? 0 : 1);
