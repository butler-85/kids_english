/* 花样找字母（核心游戏）：每题随机换一种表现形式（皮肤）
 * 语音说 "Find the letter B!"，在当前皮肤场景里找到对应元素
 * - 跨天复习：到期字母优先出题（遗忘曲线，见 storage.js）
 * - 轮内结构（记忆法）：前段首过新字母（互不重复）+ 尾部 2 个复测槽，
 *   本轮答错的字母间隔≥2题后复现；轮长随解锁池 6→8 题自适应
 * - 皮肤见 skins.js：打气球 / 泡泡（10星解锁）/ 破蛋（25星解锁）
 */
const ListenFind = (() => {
  let roundLen = 6, picks = [], roundWrongs = [];
  let qIndex = 0, target = null, last = null, wrongTries = 0, busy = false, earned = 0;
  let skinId = 'balloon', lastSkin = null;

  let transitioning = false;
  function enter() {
    clearOverlays();
    startRound();
  }

  function startRound() {
    GameUI.prepare('find');
    transitioning = false;
    qIndex = 0; earned = 0; lastSkin = null; roundWrongs = [];
    const pool = Store.pool();
    roundLen = Math.min(8, Math.max(6, pool.length)); // 解锁越多轮越长：6→8 题
    const distinctCount = Math.max(3, roundLen - 2);  // 尾部留 2 个复测槽
    picks = [];
    for (let i = 0; i < Math.min(distinctCount, pool.length); i++) {
      const cand = pool.filter(L => !picks.includes(L));
      picks.push(ABC.helpers.weightedTarget(cand, null, L => Store.letterStat(L)));
    }
    renderDots();
    target = null; busy = true;
    Sound.guide('听一听，再点出你听到的字母。', { onDone: nextQuestion });
  }

  function renderDots() { GameUI.progress('find', qIndex, roundLen); }

  // 换皮：已解锁皮肤里随机，且不与上一题相同
  function pickSkin() {
    const ids = Skins.unlockedIds();
    const cands = ids.filter(id => id !== lastSkin);
    return cands[Math.floor(Math.random() * cands.length)] || ids[0];
  }

  function nextQuestion() {
    transitioning = false;
    busy = false; wrongTries = 0;
    const distinctCount = picks.length;
    let L;
    if (qIndex < distinctCount) {
      L = picks[qIndex]; // 首过：新字母按计划出题
    } else {
      // 复测槽：优先「本轮答错且间隔≥2题」的字母；否则复测掌握度最低的首过字母
      const wrongCands = roundWrongs.filter(w => qIndex - w.pos >= 2).map(w => w.L);
      const rest = picks.filter(p => !roundWrongs.some(w => w.L === p));
      let cand = (wrongCands.length ? wrongCands : rest).filter(x => x !== last);
      if (!cand.length) cand = picks.filter(x => x !== last);
      if (!cand.length) cand = picks;
      cand.sort((a, b) => (Store.letterStat(a).correct - Store.letterStat(b).correct)
                        || (Store.letterStat(a).wrong - Store.letterStat(b).wrong));
      L = cand[0];
    }
    target = L;
    last = target;

    const pool = Store.pool();
    const nDist = Store.stars > 30 ? 3 : 2;
    const options = ABC.helpers.shuffle([target, ...ABC.helpers.distractors(target, nDist, pool)]);
    skinId = pickSkin();
    lastSkin = skinId;
    Skins.render(skinId, options, { onPick: tap });
    renderDots();
    ask();
  }

  function ask() {
    // 不播皮肤提示，直接说找字母：'Find the letter,'（停顿）'B!'（停顿）'B!'
    Sound.speakSeq([
      'Find the letter,',
      target + '!',
      target + '!',
    ]);
  }
  function repeat() { if (target && !transitioning) ask(); }

  function tap(el) {
    if (busy || !target) return;
    if (el.dataset.l === target) {
      busy = true; transitioning = true;
      Skins.correct(skinId, el);
      Confetti.burstAtEl(el);
      App.flyStar(el);

      const it = ABC.byL(target);
      const newSticker = Store.markCorrect(target);
      Store.addStars(1); earned++;
      App.refreshStars();


      Skins.newlyUnlocked(Store.stars).forEach(d => {
        App.after(() => {
          App.toast('🎉 🔓 ' + d.icon);
          Sound.sfx('star');
        }, 1100);
      });
      if (newSticker) {
        App.after(() => {
          App.toast('⭐ ＋ ' + it.emoji + ' ' + it.L);
          Sound.sfx('star');

        }, 2100);
      }

      qIndex++;
      renderDots();
      Sound.speakSeq(['Yes! ' + target + '!', ...(newSticker ? ['Wow! New sticker! ' + it.word + '!'] : [])], 200, {}, () => GameUI.advance(qIndex >= roundLen ? win : nextQuestion));
    } else {
      Skins.wrong(skinId, el);
      Sound.sfx('wrong');
      // 答错会打断问句队列，这里重播目标字母，孩子不用点「再听一次」
      Sound.speakSeq(['Try again!', target + '!']);
      Store.markWrong(target);
      roundWrongs.push({ L: target, pos: qIndex }); // 记入本轮复测队列
      wrongTries++;
      if (wrongTries >= 2) {
        const right = document.querySelector('#game-stage [data-l="' + target + '"]');
        if (right) Skins.hint(skinId, right);
      }
    }
  }

  function win() { GameUI.win('find', earned, picks, startRound); }

  function clearOverlays() { document.getElementById('overlay-root').innerHTML = ''; }

  return { enter, repeat, state: () => ({ target, qIndex, busy, skin: skinId, roundLen, picks: [...picks], wrongs: roundWrongs.map(w => w.L) }) };
})();
