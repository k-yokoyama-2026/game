/* ペットそだて — UI スモークテスト（ヘッドレス DOM で実際に操作してみる）
 * 実行: node games/pet-care/smoke.js */
const path = require('path');
const { loadHtml } = require('../_testlib/dom.js');

let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('  ✗ FAIL: ' + m); } }

const H = loadHtml(path.join(__dirname, 'index.html'));
const ctx = H.ctx;
const doc = ctx.document;
const PetCore = ctx.PetCore;
const $ = id => doc.getElementById(id);

// 悩み文 → need の逆引き
const TEXT2NEED = {};
Object.entries(PetCore.WORRIES).forEach(([need, txt]) => { TEXT2NEED[txt] = need; });

function currentNeed() { return TEXT2NEED[$('bubble').textContent]; }
function clickAction(id) {
  const idx = PetCore.ACTIONS.findIndex(a => a.id === id);
  $('actions').children[idx].onclick();
}

console.log('# 起動と選択画面');
ok(typeof ctx.chooseAnimal === 'function', 'スクリプトが読み込まれた');
ok($('animalList').children.length === 3, '動物カードが3枚');

console.log('# ゲーム開始');
ctx.chooseAnimal('cat');
ok($('actions').children.length === PetCore.ACTIONS.length + 2, 'お世話ボタン＋ガチャ＋コレクション');
ok(getComputedShow('game'), 'ゲーム画面が表示');
ok(currentNeed(), '悩みが出ている: ' + $('bubble').textContent);

console.log('# お世話を続けてレベルアップ');
let levelText0 = $('lvText').textContent;
let threw = false;
try {
  for (let i = 0; i < 40; i++) {
    const need = currentNeed();
    if (!need) break;
    clickAction(need);
  }
} catch (e) { threw = true; console.error(e); }
ok(!threw, 'お世話の連打で例外が出ない');
ok(parseInt($('coinText').textContent, 10) > 0, 'コインが貯まった: ' + $('coinText').textContent);
ok($('lvText').textContent !== levelText0, 'レベルが上がった: ' + levelText0 + ' -> ' + $('lvText').textContent);

console.log('# 不正解のお世話');
threw = false;
try {
  const need = currentNeed();
  const wrong = PetCore.ACTIONS.find(a => a.id !== need).id;
  clickAction(wrong);
} catch (e) { threw = true; console.error(e); }
ok(!threw, '不正解でも例外が出ない');

console.log('# ガチャ');
ctx.openGacha();
const tiers = $('gachaTiers').children;
ok(tiers.length === 3, 'ガチャは3種類');
const coins = parseInt($('coinText').textContent, 10);
const affordable = PetCore.GACHA.find(g => g.cost <= coins);
ok(affordable, '回せるガチャがある（コイン: ' + coins + '）');
threw = false;
try {
  const idx = PetCore.GACHA.indexOf(affordable);
  $('gachaTiers').children[idx].onclick();
  H.fireIntervals(20); // スピン演出を進める
} catch (e) { threw = true; console.error(e); }
ok(!threw, 'ガチャ回転で例外が出ない');
ok(/ゲット/.test($('gachaResult').innerHTML), 'ガチャ結果が表示: ' + $('gachaResult').innerHTML.replace(/<[^>]+>/g, ' '));

console.log('# ガチャ中はライフ（時間）が止まる');
const heartsDuringGacha = $('heartText').textContent;
H.fireIntervals(200); // ガチャモーダルを開いたまま時間を進めても…
ok($('heartText').textContent === heartsDuringGacha, 'ガチャ中はハートが減らない: ' + $('heartText').textContent);
ctx.closeGacha();

console.log('# コレクションと「つかう」');
ctx.openColl();
const collItems = $('collGrid').children;
ok(collItems.length >= 1, 'コレクションにアイテムがある');
ok(/つかう/.test(collItems[0].innerHTML), 'アイテムに「つかう」ボタンがある');

console.log('# モーダルを閉じると時間が再開（タイムアウト→ハート減少）');
doc.getElementById('collModal').classList.remove('show'); // 閉じる
threw = false;
try { H.fireIntervals(200); } catch (e) { threw = true; console.error(e); }
ok(!threw, 'ループ実行で例外が出ない');
ok(/🤍/.test($('heartText').textContent), 'モーダルを閉じた後は時間が進みハートが減る: ' + $('heartText').textContent);

console.log('# クリア画面');
threw = false;
try { ctx.endCleared(); } catch (e) { threw = true; console.error(e); }
ok(!threw, 'クリア処理で例外が出ない');
ok($('clearMsg').innerHTML.length > 0, 'クリアメッセージが入る');
ok(getComputedShow('clear'), 'クリア画面が表示');

function getComputedShow(id) { return doc.getElementById(id)._cls && doc.getElementById(id)._cls.has('show'); }

console.log('\n=====================================');
console.log(`  SMOKE PASS: ${pass}  FAIL: ${fail}`);
console.log('=====================================');
process.exit(fail === 0 ? 0 : 1);
