/* Three visual adventures share the same listening, scoring and unlock rules. */
const Skins = (() => {
  const DEFS = [
    { id: 'balloon', name: '气球嘉年华', icon: '🎈', minStars: 0, instruction: '听一听，找到会说这个字母的气球' },
    { id: 'bubble', name: '海底泡泡', icon: '🔵', minStars: 10, instruction: '听一听，戳破藏着字母的泡泡' },
    { id: 'egg', name: '破壳小伙伴', icon: '🥚', minStars: 25, instruction: '听一听，帮字母蛋里的小伙伴出来' },
  ];
  const stage = () => document.getElementById('game-stage');
  function render(id, options, cb) {
    const def = DEFS.find(d => d.id === id) || DEFS[0];
    const colors = ABC.helpers.shuffle(['#df978b', '#e7c46e', '#8bb5a5', '#9aaed0']);
    stage().dataset.theme = def.id;
    stage().innerHTML = GameUI.scenery(def.id) + '<div class="adventure-label" aria-label="' + def.name + '"><b>' + def.icon + '</b></div><div class="adventure-options options-' + options.length + '"></div><div class="scene-ground-note" aria-hidden="true">' + def.icon + ' → ⭐</div>';
    const row = stage().querySelector('.adventure-options');
    options.forEach((L, i) => {
      const button = document.createElement('button');
      button.className = 'adventure-choice ' + def.id;
      button.dataset.l = L; button.setAttribute('aria-label', '字母 ' + L);
      button.style.setProperty('--choice-color', colors[i]);
      button.style.setProperty('--float-delay', (-i * .7) + 's');
      const art = def.id === 'egg' ? GameUI.character(GameUI.CHARACTERS[(L.charCodeAt(0) - 65) % GameUI.CHARACTERS.length].id) : def.id === 'bubble' ? GameUI.character('frog') : '<span class="prize-star">★</span>';
      button.innerHTML = '<span class="choice-object"><span class="choice-letter">' + L + '</span>' + (def.id === 'balloon' ? '<small class="choice-lower">' + L.toLowerCase() + '</small>' : '') + '<span class="shell-crack" aria-hidden="true"></span></span><span class="choice-prize" aria-hidden="true">' + art + '<b>' + L + ' <small>' + L.toLowerCase() + '</small></b></span><span class="choice-shadow" aria-hidden="true"></span><span class="choice-hint" aria-hidden="true">☝</span>';
      button.onclick = () => cb.onPick(button); row.appendChild(button);
    });
    GameUI.feedback('find', def.instruction);
  }
  function correct(id, el) {
    stage().querySelector('.adventure-options').classList.add('solved');
    stage().querySelectorAll('[data-l]').forEach(b => b.disabled = true);
    el.classList.add('revealed');
    Sound.sfx(id === 'balloon' ? 'pop' : id === 'bubble' ? 'bubble' : 'crack');
    App.after(() => Sound.sfx('correct'), id === 'egg' ? 400 : 180);
    GameUI.feedback('find', id === 'egg' ? '咔嚓！你找到一个新朋友！' : id === 'bubble' ? '啵！字母朋友找到啦！' : '找到啦！送你一颗小星星！', 'happy');
  }
  function wrong(id, el) {
    el.classList.remove('try-again'); void el.offsetWidth; el.classList.add('try-again');
    App.after(() => el.classList.remove('try-again'), 600);
    GameUI.feedback('find', '没关系，再听一听，试试另一个。', 'gentle');
  }
  function hint(id, el) { el.classList.add('gentle-hint'); }
  function unlockedIds() { return DEFS.filter(d => Store.stars >= d.minStars).map(d => d.id); }
  function newlyUnlocked(stars) { return DEFS.filter(d => d.minStars > 0 && d.minStars === stars); }
  return { render, correct, wrong, hint, unlockedIds, newlyUnlocked, DEFS };
})();
