/* 贴纸墙：每个字母答对 3 次解锁一枚动物贴纸；点击已解锁贴纸可重温发音 */
const Stickers = (() => {
  function enter() {
    render();
    Sound.speak('Wow! Look at your stickers!');
  }

  function render() {
    const n = Store.masteredCount();
    document.getElementById('sticker-summary').innerHTML =
      '⭐ ' + Store.stars + ' &nbsp;·&nbsp; 🧸 ' + n + ' / 26';

    const grid = document.getElementById('sticker-grid');
    grid.innerHTML = '';
    ABC.letters.forEach((it, i) => {
      const on = Store.mastered(it.L);
      const color = ABC.palette[i % ABC.palette.length];
      const card = document.createElement('button');
      card.className = 'st-card ' + (on ? 'on' : 'off');
      if (on) card.style.borderColor = color;
      card.innerHTML =
        '<div class="st-emoji">' + (on ? it.emoji : '❓') + '</div>' +
        '<div class="st-pair" style="color:' + (on ? color : '') + '">' + it.L + ' ' + it.L.toLowerCase() + '</div>';
      if (on) {
        card.addEventListener('click', () => {
          Sound.sfx('tap');
          Sound.letterIntro(it);
        });
      }
      grid.appendChild(card);
    });
  }

  return { enter };
})();
