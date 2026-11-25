/* 看字选音（字形→读音，反向回忆训练）：
 * 出示大字母卡，几个小动物各"说"一个字母读音（点击即播放，角色音调），
 * 点中说对读音的动物即答对。答错时动物说出的是干扰字母（本身就是反馈）。
 * 出题调度与其他游戏一致：记忆法间隔复习 + 轮内首过/复测、连击贴纸、云同步。
 */
const SoundMatch = (() => {
  const ANIMALS = GameUI.CHARACTERS;
  let roundLen = 6, picks = [], roundWrongs = [];
  let qIndex = 0, target = null, last = null, wrongTries = 0, busy = false, earned = 0;

  let transitioning = false;
  function enter() {
    clearOverlays();
    startRound();
  }

  function startRound() {
    GameUI.prepare('sound');
    transitioning = false;
    qIndex = 0; earned = 0; roundWrongs = [];
    const pool = Store.pool();
    roundLen = Math.min(8, Math.max(6, pool.length));
    const distinctCount = Math.max(3, roundLen - 2);
    picks = [];
    for (let i = 0; i < Math.min(distinctCount, pool.length); i++) {
      const cand = pool.filter(L => !picks.includes(L));
      picks.push(ABC.helpers.weightedTarget(cand, null, L => Store.letterStat(L)));
    }
    renderDots();
    target = null; busy = true;
    Sound.guide('看字母，听小动物说话。谁说得对，就点谁。', { onDone: nextQuestion });
  }

  function renderDots() { GameUI.progress('sound', qIndex, roundLen); }

  function nextQuestion() {
    transitioning = false;
    busy = false; wrongTries = 0;
    // 首过：按计划出字母；复测槽：优先本轮答错（间隔≥2题）的字母，否则最弱首过字母
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

    // 大字母卡（不播目标读音——那就是答案本身）
    const promptBox = document.getElementById('sound-prompt');
    promptBox.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'mp-card';
    card.textContent = target + ' ' + target.toLowerCase();
    promptBox.appendChild(card);

    // 发音按钮：随机动物 + 选项字母（目标 + 形近干扰）
    const pool = Store.pool();
    const nDist = Store.stars > 30 ? 3 : 2;
    const options = ABC.helpers.shuffle([target, ...ABC.helpers.distractors(target, nDist, pool)]);
    const animals = ABC.helpers.shuffle([...ANIMALS]).slice(0, options.length);
    const row = document.getElementById('sound-cards');
    row.innerHTML = '';
    row.dataset.count = options.length;
    options.forEach((L2, i) => {
      const btn = document.createElement('button');
      btn.className = 'snd-btn';
      btn.dataset.l = L2;
      btn.dataset.name = animals[i].name;
      btn.setAttribute('aria-label', '选择' + animals[i].name);
      btn.innerHTML =
        '<span class="sound-spotlight" aria-hidden="true"></span><span class="sound-speech" aria-hidden="true"><i></i><i></i><i></i></span>' +
        '<span class="sound-character">' + GameUI.character(animals[i].id) + '</span>' +
        '<span class="sound-podium"><b>' + animals[i].name + '</b><small aria-hidden="true">🔊</small></span>';
      btn.addEventListener('click', () => tap(btn));
      row.appendChild(btn);
    });

    renderDots();
    ask();
  }

  // 出题播报：先提示看字母 → 每个动物轮流高亮、用角色音把自己的字母读两遍 → 问"谁说的是它"
  // 全部读完才开放作答（busy），「再听一次」重播整套
  let narration = 0;
  function ask() {
    const my = ++narration;
    document.querySelectorAll('#sound-cards .talking').forEach(b => b.classList.remove('talking'));
    busy = true;
    const btns = [...document.querySelectorAll('#sound-cards .snd-btn')];
    btns.forEach(b => b.disabled = true);
    GameUI.feedback('sound', Sound.muted ? '声音关着，点右上角打开声音，再听一次吧。' : '先看字母，再听小伙伴轮流说。');
    Sound.speakSeq(['Look at the letter!'], 200, {}, () => {
      let i = 0;
      const announceNext = () => {
        if (my !== narration) return;
        if (i >= btns.length) {
          busy = false;
          btns.forEach(b => b.disabled = false);
          GameUI.feedback('sound', Sound.muted ? '声音关着，点右上角打开声音，再听一次吧。' : '轮到你啦！谁说的是上面的字母？');
          Sound.speak('Who says it? Tap it!', { now: false });
          return;
        }
        const b = btns[i++];
        Sound.speakSeq([b.dataset.l + '!', b.dataset.l + '!'], 200, { pitch: 1.15, onStart: () => {
          if (my !== narration || !b.isConnected) return;
          b.classList.add('talking'); GameUI.feedback('sound', b.dataset.name + '正在说，仔细听一听。');
        } }, () => {
          b.classList.remove('talking');
          App.after(announceNext, 250);
        });
      };
      announceNext();
    });
  }
  function repeat() { if (target && !transitioning) ask(); }

  function tap(btn) {
    if (busy || !target) return;
    const L = btn.dataset.l;
    // 点谁谁先"说"自己的字母（角色音调，音调略高以区分旁白）
    Sound.speak(L, { pitch: 1.2 });
    if (L === target) {
      busy = true; transitioning = true;
      btn.classList.add('pop');
      btn.classList.add('chosen');
      document.querySelectorAll('#sound-cards .snd-btn').forEach(b => b.disabled = true);
      GameUI.feedback('sound', '听出来啦！' + btn.dataset.name + '说得和字母一样！', 'happy');
      App.after(() => Sound.sfx('correct'), 700); // 等小动物说完再庆祝
      Confetti.burstAtEl(btn);
      App.flyStar(btn);

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
        const it = ABC.byL(target);
        App.after(() => {
          App.toast('⭐ ＋ ' + it.emoji + ' ' + it.L);
          Sound.sfx('star');

        }, 2100);
      }

      qIndex++;
      renderDots();
      Sound.speakSeq(['Yes!', ...(newSticker ? ['Wow! New sticker! ' + ABC.byL(target).word + '!'] : [])], 200, { now: false }, () => GameUI.advance(qIndex >= roundLen ? win : nextQuestion));
    } else {
      btn.classList.add('shake');
      GameUI.feedback('sound', '仔细听，刚才是另一个字母。再试试吧。', 'gentle');
      App.after(() => btn.classList.remove('shake'), 500);
      Store.markWrong(target);
      roundWrongs.push({ L: target, pos: qIndex });
      wrongTries++;
      Sound.speak('Try again!', { now: false });
      if (wrongTries >= 2) {
        const right = document.querySelector('#sound-cards .snd-btn[data-l="' + target + '"]');
        if (right) right.classList.add('hint');
      }
    }
  }

  function win() { GameUI.win('sound', earned, picks, startRound); }

  function clearOverlays() { document.getElementById('overlay-root').innerHTML = ''; }

  return { enter, repeat, state: () => ({ target, qIndex, busy, roundLen, picks: [...picks], wrongs: roundWrongs.map(w => w.L) }) };
})();
