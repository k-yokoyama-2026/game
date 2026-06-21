/* 銀行ゲーム — コアロジックのテスト */
const C = require('./core.js');
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('  ✗ FAIL: ' + m); } }
function section(n) { console.log('\n# ' + n); }

section('利息と運営コスト');
ok(C.loanInterest(1200000, 12) === 12000, '融資利息=元本*年利/12');
ok(C.depositInterest(1200000, 12) === 12000, '預金利息=残高*年利/12');
ok(C.loanInterest(0, 5) === 0, '融資0なら利息0');
ok(C.operatingCost(0) === 200000, '基本運営コスト20万');
ok(C.operatingCost(1000000) === 200000 + 1000, '預金が増えると運営コスト増');

section('金利で客足が変わる');
{
  const lowDep = C.demandCounts(3, 1.0, 3.0);
  const highDep = C.demandCounts(3, 4.0, 3.0);
  ok(highDep.depositCount > lowDep.depositCount, '預金金利を上げると預金客が増える');
  const highLoanRate = C.demandCounts(3, 1.0, 9.0);
  const lowLoanRate = C.demandCounts(3, 1.0, 1.0);
  ok(lowLoanRate.loanCount > highLoanRate.loanCount, '融資金利を下げると借り手が増える');
  ok(C.demandCounts(5, 1, 3).depositCount > C.demandCounts(1, 1, 3).depositCount, '評判が高いと客が増える');
}

section('流動性リスク（取り付け）');
ok(C.bankRunRisk(50000, 1000000) === true, '現金が預金の10%未満は危険');
ok(C.bankRunRisk(500000, 1000000) === false, '現金が十分なら安全');
ok(C.bankRunRisk(0, 0) === false, '預金ゼロならリスクなし');

section('融資の月次結果');
{
  // riskChance/12 より小さい乱数 → デフォルト
  const def = C.loanOutcome({ amount: 1000000, riskChance: 1.2 }, () => 0.0);
  ok(def.defaulted === true && def.loss === 1000000, '低い乱数でデフォルト＝全損');
  const ok2 = C.loanOutcome({ amount: 1000000, riskChance: 0.12 }, () => 0.99);
  ok(ok2.defaulted === false && ok2.repay === 80000, '高い乱数なら一部返済(8%)');
}

section('終了判定');
ok(C.endState(-1, 5000000, 3, 12, 12000000) === 'lose', '現金マイナスは敗北');
ok(C.endState(1000000, -1, 3, 12, 12000000) === 'lose', '総資産マイナスは敗北');
ok(C.endState(5000000, 13000000, 13, 12, 12000000) === 'win', '期限到達で目標達成は勝利');
ok(C.endState(5000000, 8000000, 13, 12, 12000000) === 'lose', '期限到達で目標未達は敗北');
ok(C.endState(5000000, 8000000, 6, 12, 12000000) === 'continue', '期間中は継続');

section('擬似経営：堅実な金利なら利益が出やすい');
{
  // 融資1000万@5%、預金500万@1% を1年回した粗利
  let profit = 0;
  for (let m = 0; m < 12; m++) profit += C.monthlyProfit(10000000, 5000000, 5.0, 1.0);
  ok(profit > -2400000, '12ヶ月の粗利が運営コスト圏内: ' + profit);
  ok(C.loanInterest(10000000, 5.0) > C.depositInterest(5000000, 1.0), '利ザヤがプラス');
}

console.log('\n=====================================');
console.log(`  PASS: ${pass}  FAIL: ${fail}`);
console.log('=====================================');
process.exit(fail === 0 ? 0 : 1);
