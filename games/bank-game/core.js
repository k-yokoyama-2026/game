/* 銀行ゲーム — コアの計算ロジック（DOM非依存・テスト可能） */
(function (global) {
  // 月利（年利を12で割る）
  function loanInterest(loans, loanRate) { return Math.floor(loans * (loanRate / 100) / 12); }
  function depositInterest(deposits, depositRate) { return Math.floor(deposits * (depositRate / 100) / 12); }
  function operatingCost(deposits) { return 200000 + Math.floor(deposits * 0.001); }

  // 金利で客足が変わる：預金金利が高いほど預金客↑、融資金利が低いほど借り手↑
  function demandCounts(reputation, depositRate, loanRate) {
    const base = 2 + Math.floor(reputation / 2);
    const depositPull = Math.max(0, Math.round((depositRate - 1.0) * 1.2));
    const loanPull = Math.max(0, Math.round((3.0 - loanRate) * 0.8));
    return { depositCount: base + depositPull, loanCount: base + loanPull };
  }

  // 流動性リスク：現金が預金の10%未満だと取り付け騒ぎの危険
  function bankRunRisk(cash, deposits) {
    if (deposits <= 0) return false;
    return cash < deposits * 0.10;
  }

  // 融資1件の月次処理（デフォルト or 一部返済）
  function loanOutcome(customer, rng) {
    const r = (rng || Math.random)();
    if (r < customer.riskChance / 12) {
      return { defaulted: true, repay: 0, loss: customer.amount };
    }
    const repay = Math.floor(customer.amount * 0.08);
    return { defaulted: false, repay, loss: 0 };
  }

  // 終了判定
  function endState(cash, assets, month, maxMonth, target) {
    if (cash < 0 || assets < 0) return 'lose';
    if (month > maxMonth) return assets >= target ? 'win' : 'lose';
    return 'continue';
  }

  // 月次の損益（参考値）
  function monthlyProfit(loans, deposits, loanRate, depositRate) {
    return loanInterest(loans, loanRate) - depositInterest(deposits, depositRate) - operatingCost(deposits);
  }

  const api = { loanInterest, depositInterest, operatingCost, demandCounts, bankRunRisk, loanOutcome, endState, monthlyProfit };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) global.BankCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
