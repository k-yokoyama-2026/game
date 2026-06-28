#!/usr/bin/env bash
# 全ゲームの core テスト + UI スモークテストを一括実行する。
# 使い方: bash games/test-all.sh
set -u
cd "$(dirname "$0")/.." || exit 1

games=(monster-quest pet-care block-blast maze-number bank-game catch-thief rhythm-tap gem-hunt town-grow cat-hide yagoto-walk)

total_fail=0
printf "%-14s %-10s %-10s\n" "GAME" "TEST" "SMOKE"
printf -- "----------------------------------\n"
for g in "${games[@]}"; do
  t="-"; s="-"
  if [ -f "games/$g/test.js" ]; then
    if out=$(node "games/$g/test.js" 2>&1); then
      t=$(printf '%s' "$out" | grep -oE 'PASS: [0-9]+' | head -1 | grep -oE '[0-9]+')
      t="ok($t)"
    else
      t="FAIL"; total_fail=$((total_fail+1)); echo "$out" | tail -3
    fi
  fi
  if [ -f "games/$g/smoke.js" ]; then
    if out=$(node "games/$g/smoke.js" 2>&1); then
      s=$(printf '%s' "$out" | grep -oE 'SMOKE PASS: [0-9]+' | head -1 | grep -oE '[0-9]+')
      s="ok($s)"
    else
      s="FAIL"; total_fail=$((total_fail+1)); echo "$out" | tail -3
    fi
  fi
  printf "%-14s %-10s %-10s\n" "$g" "$t" "$s"
done

printf -- "----------------------------------\n"
# 共有モジュールのテスト（games/_shared/*.test.js）
for tf in games/_shared/*.test.js; do
  [ -f "$tf" ] || continue
  name="_shared/$(basename "$tf" .test.js)"
  if out=$(node "$tf" 2>&1); then
    p=$(printf '%s' "$out" | grep -oE 'PASS: [0-9]+' | head -1 | grep -oE '[0-9]+')
    printf "%-14s %-10s\n" "$name" "ok($p)"
  else
    printf "%-14s %-10s\n" "$name" "FAIL"; total_fail=$((total_fail+1)); echo "$out" | tail -3
  fi
done

printf -- "----------------------------------\n"
if [ "$total_fail" -eq 0 ]; then
  echo "ALL GREEN ✅"
  exit 0
else
  echo "FAILURES: $total_fail ❌"
  exit 1
fi
