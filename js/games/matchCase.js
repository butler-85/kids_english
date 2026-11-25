/* 大小写配对：出示大写（或小写），从三个选项里点出对应的另一半
 * 语音："Big G! Find little g!" / "Little g! Find big G!"
 * 判定、奖励、干扰项策略与听音找字母一致
 */
const MatchCase = (() => {
  let roundLen = 6, picks = [], roundWrongs = [];
  let qIndex = 0, target = null, mode = 'small', last = null, wrongTries = 0, busy = false, earned = 0;

  let transitioning = false;
  function enter() {
    clearOverlays();
    startRound();
  }

  function startRound() {
    GameUI.prepare('match');
    transitioning = false;
    qIndex = 0; earned = 0; roundWrongs = [];
    const pool = Store.pool();
    roundLen = Math.min(8, Math.max(6, pool.length)); // 轮长随解锁池 6→8 题自适应
    const distinctCount = Math.max(3, roundLen - 2);  // 尾部留 2 个复测槽
    picks = [];
    for (let i = 0; i < Math.min(distinctCount, pool.length); i++) {
      const cand = pool.filter(L => !picks.includes(L));
      picks.push(ABC.helpers.weightedTarget(cand, null, L => Store.letterStat(L)));
    }
    renderDots();
    target = null; busy = true;
    Sound.guide('找一找，哪个字母是它的朋友？点车票，一起坐火车。', { onDone: nextQuestion });
  }

  function renderDots() { GameUI.progress('match', qIndex, roundLen); }

  function nextQuestion() {
    transitioning = false;
    busy = false; wrongTries = 0;
    // 首过：新字母按计划；复测槽：优先本轮答错（间隔≥2题）的字母，否则最弱首过字母
    let L;
    if (qIndex < picks.length) {
      L = picks[qIndex];
    } else {
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
    mode = Math.random() < 0.5 ? 'small' : 'big'; // small=找小写, big=找大写

    // 题面卡
    GameUI.train(target, mode);
    GameUI.feedback('match', mode === 'small' ? '帮大写字母找到小写朋友，一起坐火车！' : '帮小写字母找到大写朋友，一起坐火车！');

    // 选项（与题面相反的大小写）
    const pool = Store.pool();
    const nDist = 2;
    const options = ABC.helpers.shuffle([target, ...ABC.helpers.distractors(target, nDist, pool)]);
    const row = document.getElementById('match-cards');
    row.innerHTML = '';
    options.forEach((L, i) => {
      const card = document.createElement('button');
      card.className = 'game-card';
      card.dataset.l = L;
      const show = mode === 'small' ? L.toLowerCase() : L;
      card.setAttribute('aria-label', '字母 ' + show);
      card.innerHTML = '<span class="ticket-caption" aria-hidden="true">🎫</span><span class="gc-solo">' + show + '</span><span class="ticket-dots" aria-hidden="true">● ● ●</span>';
      card.addEventListener('click', () => tap(card));
      row.appendChild(card);
    });

    renderDots();
    ask();
  }

  function ask() {
    if (!target) return;
    if (mode === 'small') Sound.speakSeq(['Big ' + target + '!', 'Find little ' + target.toLowerCase() + '!']);
    else Sound.speakSeq(['Little ' + target.toLowerCase() + '!', 'Find big ' + target + '!']);
  }
  function repeat() { if (target && !transitioning) ask(); }

  function tap(card) {
    if (busy || !target) return;
    if (card.dataset.l === target) {
      busy = true; transitioning = true;
      Sound.sfx('correct');
      Confetti.burstAtEl(card);
      App.flyStar(card);
      card.classList.add('pop');
      card.classList.add('chosen');
      document.querySelectorAll('#match-cards .game-card').forEach(b => b.disabled = true);
      GameUI.boardTrain(card, mode === 'small' ? target.toLowerCase() : target);
      GameUI.feedback('match', '找到朋友啦！' + target + ' 和 ' + target.toLowerCase() + '，一起出发！', 'happy');

      const newSticker = Store.markCorrect(target);
      Store.addStars(1); earned++;
      App.refreshStars();

      if (newSticker) {
        const it = ABC.byL(target);
        App.after(() => {
          App.toast('⭐ ＋ ' + it.emoji + ' ' + it.L);
          Sound.sfx('star');
        }, 900);
      }

      qIndex++;
      renderDots();
      Sound.speak('Yes! ' + target + ' and ' + target.toLowerCase() + '!', { onDone: () => GameUI.advance(qIndex >= roundLen ? win : nextQuestion) });
    } else {
      card.classList.add('shake');
      GameUI.feedback('match', '这张车票还不对，看看字母的样子，再试试。', 'gentle');
      App.after(() => card.classList.remove('shake'), 500);
      Sound.sfx('wrong');
      // 答错会打断问句队列，这里重播目标（大小写），孩子不用点「再听一次」
      if (mode === 'small') Sound.speakSeq(['Try again!', 'Find little ' + target.toLowerCase() + '!']);
      else Sound.speakSeq(['Try again!', 'Find big ' + target + '!']);
      Store.markWrong(target);
      roundWrongs.push({ L: target, pos: qIndex }); // 记入本轮复测队列
      wrongTries++;
      if (wrongTries >= 2) {
        const right = document.querySelector('#match-cards .game-card[data-l="' + target + '"]');
        if (right) right.classList.add('hint');
      }
    }
  }

  function win() { GameUI.win('match', earned, picks, startRound); }

  function clearOverlays() { document.getElementById('overlay-root').innerHTML = ''; }

  return { enter, repeat, state: () => ({ target, mode, qIndex, busy, roundLen, picks: [...picks], wrongs: roundWrongs.map(w => w.L) }) };
})();
