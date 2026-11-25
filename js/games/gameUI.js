/* Shared local illustrations and feedback for the three learning adventures. */
const GameUI = (() => {
  const CHARACTERS = [
    { id: 'bear', name: '小熊', color: '#dfae79' },
    { id: 'rabbit', name: '小兔', color: '#edc5bb' },
    { id: 'cat', name: '小猫', color: '#e9bd7c' },
    { id: 'frog', name: '小青蛙', color: '#a9c78a' },
    { id: 'dog', name: '小狗', color: '#c5a58c' },
  ];
  let feedbackAt = 0;
  function character(id = 'bear') {
    const c = CHARACTERS.find(c => c.id === id) || CHARACTERS[0];
    let ears = '<circle cx="37" cy="37" r="17"/><circle cx="103" cy="37" r="17"/>';
    if (id === 'rabbit') ears = '<ellipse cx="47" cy="30" rx="13" ry="29"/><ellipse cx="93" cy="30" rx="13" ry="29"/><g fill="#e4a8a4"><ellipse cx="47" cy="28" rx="6" ry="20"/><ellipse cx="93" cy="28" rx="6" ry="20"/></g>';
    if (id === 'cat') ears = '<path d="m27 62 2-48 39 28m44 20-1-48-39 28"/>';
    if (id === 'frog') ears = '<circle cx="42" cy="42" r="22"/><circle cx="98" cy="42" r="22"/>';
    if (id === 'dog') ears = '<ellipse cx="28" cy="61" rx="16" ry="30" fill="#a68269"/><ellipse cx="112" cy="61" rx="16" ry="30" fill="#a68269"/>';
    return `<svg class="play-character" viewBox="0 0 140 150" aria-hidden="true" focusable="false"><g fill="${c.color}">${ears}<ellipse cx="70" cy="117" rx="34" ry="31"/><ellipse cx="70" cy="72" rx="49" ry="42"/><ellipse class="character-hand left" cx="31" cy="113" rx="13" ry="21" transform="rotate(26 31 113)"/><ellipse class="character-hand right" cx="109" cy="113" rx="13" ry="21" transform="rotate(-26 109 113)"/></g><ellipse cx="70" cy="124" rx="22" ry="22" fill="#fff8e6"/><g fill="#3e4a42"><circle cx="51" cy="69" r="4"/><circle cx="89" cy="69" r="4"/></g><g fill="#ec9d91" opacity=".65"><ellipse cx="39" cy="82" rx="9" ry="5"/><ellipse cx="101" cy="82" rx="9" ry="5"/></g><path d="m65 80 5 5 5-5" fill="#8e6653"/><ellipse class="character-mouth" cx="70" cy="91" rx="7" ry="4" fill="#754e43"/><path d="m60 106 10 6 10-6-10 20z" fill="${id === 'frog' ? '#dba766' : '#799d91'}"/></svg>`;
  }
  function scenery(type) {
    let content = '';
    if (type === 'bubble') content = `<path d="M0 0h1000v500H0z" fill="#c7e9ed"/><path d="M0 90Q250 45 500 90T1000 90" fill="none" stroke="#e5f8f5" stroke-width="20"/><path d="M0 430Q200 380 470 433T1000 419V500H0" fill="#e9d9ae"/><g fill="none" stroke="#8dc4ab" stroke-width="16" stroke-linecap="round"><path d="M40 454q-35-66 4-132m13 138q31-60 9-94M922 448q-24-77 9-137m22 143q34-57 14-86"/></g><g fill="#eefbfa99" stroke="#fff9" stroke-width="3"><circle cx="91" cy="167" r="12"/><circle cx="889" cy="193" r="19"/><circle cx="947" cy="74" r="9"/></g><g fill="#e4b090"><path d="m125 445 12-35 11 35 32-16-24 30 15 24-34-12-23 14 9-28-23-20z"/></g>`;
    else if (type === 'theater') content = `<path d="M0 0h1000v500H0z" fill="#e8e3cf"/><path d="M0 0h1000v355H0z" fill="#cedcc1"/><path d="M0 0h1000v33H0z" fill="#bd8b74"/><path d="M0 20q65 220 145 220L80 330H0M1000 20q-65 220-145 220l65 90h80" fill="#d89f87"/><path d="M0 360h1000v140H0z" fill="#cda98a"/><g stroke="#b68c6c" stroke-width="3" opacity=".5"><path d="M0 400h1000M0 455h1000m-800-95-55 140m355-140v140m300-140 55 140"/></g><path d="M120 40Q500 150 880 40" fill="none" stroke="#8b9773" stroke-width="3"/>${[210, 360, 500, 640, 790].map((x, i) => `<path d="m${x} ${i === 2 ? 92 : 75} 7 16 17 1-13 11 4 17-15-9-15 9 4-17-13-11 17-1z" fill="#f6d276"/>`).join('')}`;
    else content = `<path d="M0 0h1000v500H0z" fill="${type === 'egg' ? '#e7efd2' : '#d8eced'}"/><circle cx="846" cy="84" r="42" fill="#f5d486"/><g fill="#fffaf0"><path d="M95 98q-18-22 10-28q8-32 34-17q27-16 36 13q33 0 22 32z"/><path d="M620 143q-18-22 10-28q8-32 34-17q27-16 36 13q33 0 22 32z"/></g><path d="M0 352Q230 256 500 350T1000 320V500H0" fill="#baceaa"/><path d="M0 412Q280 350 530 410T1000 385V500H0" fill="#d0deaf"/>${type === 'balloon' ? `<path d="M0 20Q500 200 1000 20" fill="none" stroke="#a6b2a0" stroke-width="3"/>${[80, 210, 340, 470, 600, 730, 860].map((x, i) => `<path d="m${x} ${35 + Math.sin(x / 1000 * Math.PI) * 69} 38 9-25 39z" fill="${['#d7a589', '#edcb7c', '#98bdb0'][i % 3]}"/>`).join('')}` : ''}<g fill="#fdf8d7">${[55, 130, 873, 954].map((x, i) => `<circle cx="${x}" cy="${450 + i % 2 * 26}" r="5"/>`).join('')}</g>`;
    return `<svg class="adventure-scenery" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${content}</svg>`;
  }
  function prepare(screen) {
    feedbackAt = 0;
    Confetti.stop();
    const coach = document.getElementById(screen + '-coach');
    coach.innerHTML = `<span class="coach-friend">${character(screen === 'match' ? 'rabbit' : 'bear')}</span><div><div class="coach-cue" id="${screen}-cue" aria-hidden="true">${screen === 'match' ? 'A ↔ a → 🚂' : screen === 'sound' ? '👀 → 👂 → 🐻' : '👂 → 👆 → 🎈'}</div><p id="${screen}-message" role="status" aria-live="polite">一起玩</p></div><span class="coach-spark" aria-hidden="true">✦</span>`;
    const scene = document.querySelector(`[data-screen="${screen}"].play-screen .scene-background`);
    if (scene) scene.innerHTML = scenery(screen === 'sound' ? 'theater' : 'train');
    const stage = document.getElementById(screen === 'find' ? 'game-stage' : screen + '-cards');
    if (stage) stage.innerHTML = '';
    document.getElementById(screen + '-prompt')?.replaceChildren();
    document.querySelectorAll('.play-flight').forEach(el => el.remove());
  }
  function progress(screen, index, total) {
    const el = document.getElementById(screen + '-progress');
    el.setAttribute('aria-label', `已完成 ${index} / ${total} 题`);
    el.innerHTML = `<div class="journey-track">${Array.from({ length: total }, (_, i) => `<span class="journey-stop ${i < index ? 'done' : i === index ? 'current' : ''}" aria-hidden="true">${i < index ? '★' : i + 1}</span>`).join('')}<span class="journey-finish" aria-hidden="true">⚑</span></div><span class="journey-count">${Math.min(index + 1, total)} / ${total}</span>`;
  }
  function feedback(screen, text, mood = '') {
    const el = document.getElementById(screen + '-message');
    const muted = text.includes('声音关着');
    if (el) { el.textContent = mood === 'happy' ? '太棒啦' : mood === 'gentle' ? '再试试' : muted ? '开声音' : screen === 'match' || text.includes('轮到你') ? '点一点' : '听一听'; el.setAttribute('aria-label', text); }
    const cue = document.getElementById(screen + '-cue');
    if (cue) cue.textContent = mood === 'happy' ? '🎉 ⭐ 🙌' : mood === 'gentle' ? '💛 👂 ↻' : muted ? '🔇 → 🔊' : screen === 'match' ? 'A ↔ a → 🚂' : screen === 'sound' ? '👀 → 👂 → 🐻' : '👂 → 👆 → 🎈';
    const coach = document.getElementById(screen + '-coach');
    if (coach) coach.dataset.mood = mood;
    if (mood === 'happy') feedbackAt = performance.now();
  }
  function advance(next) { App.after(next, Math.max(350, 1200 - (performance.now() - feedbackAt))); }
  function train(letter, mode) {
    document.getElementById('match-prompt').innerHTML = `<div class="letter-train"><div class="train-engine"><span class="train-chimney"></span><span class="engine-window">${character('rabbit')}</span><span class="engine-nose"></span></div><div class="train-car"><span class="train-letter">${mode === 'small' ? letter : letter.toLowerCase()}</span></div><div class="train-car empty"><span class="match-seat" aria-label="等待配对字母">?</span></div><span class="train-track"></span></div>`;
  }
  function boardTrain(el, letter) {
    const seat = document.querySelector('.match-seat');
    if (!seat) return;
    const from = el.getBoundingClientRect(), to = seat.getBoundingClientRect();
    const token = document.createElement('span'); token.className = 'play-flight'; token.textContent = letter;
    token.style.cssText = `left:${from.left}px;top:${from.top}px;width:${from.width}px;height:${from.height}px;--flight-x:${to.left + to.width / 2 - from.left - from.width / 2}px;--flight-y:${to.top + to.height / 2 - from.top - from.height / 2}px`;
    document.body.appendChild(token);
    App.after(() => { token.remove(); seat.textContent = letter; seat.closest('.train-car').classList.add('paired'); document.querySelector('.letter-train')?.classList.add('all-aboard'); }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 600);
  }
  function win(screen, earned, letters, again) {
    const words = [...new Set(letters)].slice(0, 6);
    const root = document.getElementById('overlay-root');
    root.innerHTML = `<div class="play-win-backdrop"><section class="play-win" role="dialog" aria-modal="true" aria-labelledby="play-win-title"><div class="party-friends">${character('rabbit')}<span class="party-star">★</span>${character('bear')}</div><h2 id="play-win-title">太棒啦！</h2><div class="round-letters">${words.map(L => `<span>${L}<small>${L.toLowerCase()}</small></span>`).join('')}</div><div class="round-reward" aria-label="获得 ${earned} 颗星星">⭐ ×${earned}</div><button class="play-again" data-act="again" aria-label="再玩一轮">↻ 再玩</button><div class="play-win-links"><button data-act="home" aria-label="回主页">🏠 回家</button><button data-act="farm" aria-label="去农场">🐣 农场</button></div></section></div>`;
    root.querySelector('[data-act="again"]').onclick = () => { root.innerHTML = ''; again(); };
    root.querySelector('[data-act="home"]').onclick = () => App.show('home');
    root.querySelector('[data-act="farm"]').onclick = () => App.show('farm');
    root.querySelector('[data-act="again"]').focus();
    Confetti.celebrate(); Sound.sfx('win'); Sound.speakSeq(['Great job! You are a super star!', 'Play again?']);
  }
  document.addEventListener('keydown', e => {
    const dialog = document.querySelector('.play-win'); if (!dialog) return;
    if (e.key === 'Escape') App.show('home');
    if (e.key === 'Tab') {
      const buttons = [...dialog.querySelectorAll('button')], first = buttons[0], last = buttons.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  return { CHARACTERS, character, scenery, prepare, progress, feedback, advance, train, boardTrain, win };
})();
