/* 字母乐园：26 个字母自由探索，点击看大卡、听发音，首次认识 +1 星 */
const LetterPark = (() => {
  let built = false;

  function enter() {
    build();
    Sound.guide('点一个字母，听它的声音。');
  }

  function build() {
    if (built) return;
    built = true;
    const grid = document.getElementById('park-grid');
    ABC.letters.forEach((it, i) => {
      const color = ABC.palette[i % ABC.palette.length];
      const card = document.createElement('button');
      card.className = 'lp-card';
      card.style.borderColor = color;
      card.style.color = color;
      card.setAttribute('aria-label', it.L + ' ' + it.word);
      card.innerHTML =
        '<div class="lp-pair">' + it.L + '<span>' + it.L.toLowerCase() + '</span></div>' +
        '<div class="lp-emoji">' + it.emoji + '</div>';
      card.addEventListener('click', () => openFocus(it, color));
      grid.appendChild(card);
    });
  }

  function openFocus(it, color) {
    Sound.sfx('tap');
    Sound.letterIntro(it);

    const firstTime = Store.letterStat(it.L).seen === 0;
    Store.markSeen(it.L);
    if (firstTime) {
      Store.addStars(1);
      App.refreshStars();
      App.flyStar(document.getElementById('topbar')); // 从顶栏飞出反馈
      Sound.sfx('star');
    }

    const root = document.getElementById('overlay-root');
    root.innerHTML =
      '<div class="overlay">' +
        '<div class="focus-pair" style="color:' + color + '">' + it.L + ' ' + it.L.toLowerCase() + '</div>' +
        '<div class="focus-emoji">' + it.emoji + '</div>' +
        '<div class="focus-word">' + it.L + ' is for ' + it.word + '</div>' +
        '<div class="overlay-btns">' +
          '<button class="ov-btn" data-act="replay" aria-label="Play again">🔁</button>' +
          '<button class="ov-btn" data-act="close" aria-label="Close">✖️</button>' +
        '</div>' +
      '</div>';
    const overlay = root.firstElementChild;
    overlay.querySelector('[data-act="replay"]').addEventListener('click', () => Sound.letterIntro(it));
    overlay.querySelector('[data-act="close"]').addEventListener('click', () => { Sound.stop(); root.innerHTML = ''; });
    overlay.addEventListener('click', e => { if (e.target === overlay) { Sound.stop(); root.innerHTML = ''; } });
  }

  return { enter };
})();
