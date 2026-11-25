/* 主控：屏幕路由、顶栏（星星/静音/主页）、家长弹窗、通用动效 */
const App = (() => {
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  const MODULES = {
    park: LetterPark, find: ListenFind, sound: SoundMatch, match: MatchCase,
    farm: { enter: () => Pets.enterFarm(), leave: () => Pets.leave() },
    shop: { enter: () => Pets.enterShop(), leave: () => Pets.leave() },
    zoo: Zoo,
    stickers: Stickers,
  };

  function refreshStars() { $('#star-count').textContent = Store.stars; }

  const screenTimers = new Set();
  function after(fn, ms) {
    const id = setTimeout(() => { screenTimers.delete(id); fn(); }, ms);
    screenTimers.add(id);
    return id;
  }
  function show(name) {
    screenTimers.forEach(clearTimeout); screenTimers.clear();
    const previous = MODULES[document.body.dataset.screen];
    if (previous && previous.leave) previous.leave();
    Sound.stop();
    Confetti.stop();
    document.querySelectorAll('.play-flight, .toast').forEach(el => el.remove());
    document.getElementById('overlay-root').innerHTML = '';
    $$('[data-screen]').forEach(s => s.classList.toggle('active', s.dataset.screen === name));
    document.body.dataset.screen = name;
    $('#topbar').classList.toggle('gate-hidden', name === 'gate'); // 档案选择页隐藏顶栏
    refreshStars();
    if (name === 'home') updateWhoChip();
    const mod = MODULES[name];
    if (mod && mod.enter) mod.enter();
    window.scrollTo(0, 0);
  }

  // 选好小朋友进入主页（guest 为 null）
  function enterAs(p) {
    Sound.setMuted(Store.muted);
    applyMuteIcon();
    show('home');
    const nm = p && /^[\x20-\x7e]+$/.test(p.name) ? p.name : '';
    Sound.speak(nm ? 'Hi ' + nm + "! Let's play!" : "Hi! Let's play!");
  }

  // 主页上的「当前玩家」按钮
  function updateWhoChip() {
    const btn = $('#btn-switch');
    if (!btn) return;
    const p = Profiles.current;
    btn.innerHTML = p
      ? '👤 ' + p.avatar + ' ' + p.name + ' · 点此切换'
      : '👥 切换小朋友 / 创建档案';
  }

  // 顶部滑出的提示条（新贴纸等）
  function toast(html, ms = 2600) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = html;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), ms);
  }

  // 小星星从某元素飞向顶栏星星计数
  function flyStar(fromEl) {
    const from = fromEl.getBoundingClientRect();
    const to = $('#star-box').getBoundingClientRect();
    const s = document.createElement('div');
    s.className = 'fly-star';
    s.textContent = '⭐';
    s.style.left = (from.left + from.width / 2 - 17) + 'px';
    s.style.top = (from.top + from.height / 2 - 17) + 'px';
    document.body.appendChild(s);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      s.style.left = (to.left + to.width / 2 - 17) + 'px';
      s.style.top = (to.top + to.height / 2 - 17) + 'px';
      s.style.opacity = '0.15';
      s.style.transform = 'scale(.45)';
    }));
    setTimeout(() => s.remove(), 950);
  }

  function applyMuteIcon() { $('#btn-mute').textContent = Store.muted ? '🔇' : '🔊'; }

  function init() {
    // 浏览器音频策略：第一次触摸/点击时解锁 AudioContext 与语音
    document.addEventListener('pointerdown', () => Sound.init(), { capture: true });

    $$('.tile').forEach(b => b.addEventListener('click', () => {
      Sound.sfx('tap');
      show(b.dataset.target);
    }));

    $('#btn-home').addEventListener('click', () => { Sound.sfx('tap'); show('home'); });
    $('#btn-mute').addEventListener('click', () => {
      const m = !Store.muted;
      Store.setMuted(m);
      Sound.setMuted(m);
      applyMuteIcon();
    });

    $('#btn-replay').addEventListener('click', () => { Sound.sfx('tap'); ListenFind.repeat(); });
    $('#btn-mreplay').addEventListener('click', () => { Sound.sfx('tap'); MatchCase.repeat(); });
    $('#btn-sreplay').addEventListener('click', () => { Sound.sfx('tap'); SoundMatch.repeat(); });
    $('#btn-tofarm').addEventListener('click', () => { Sound.sfx('tap'); App.show('farm'); });

    // 切换小朋友 / 访客模式
    $('#btn-switch').addEventListener('click', async () => {
      Sound.sfx('tap');
      await Store.flush();
      if (Profiles.mode === 'cloud') {
        await Profiles.refresh();
        show('gate');
        Profiles.renderGate();
      } else {
        toast('未连接服务器，当前为访客模式');
      }
    });
    $('#btn-guest').addEventListener('click', () => {
      Sound.sfx('tap');
      Profiles.selectGuest();
      enterAs(null);
    });

    // 家长弹窗
    $('#btn-parent').addEventListener('click', () => {
      $('#parent-modal').classList.remove('hidden');
      Profiles.renderParentList();
    });
    $('#btn-close-parent').addEventListener('click', () => $('#parent-modal').classList.add('hidden'));
    $('#parent-modal').addEventListener('click', e => {
      if (e.target.id === 'parent-modal') $('#parent-modal').classList.add('hidden');
    });
    $('#btn-reset').addEventListener('click', () => {
      if (confirm('确定要清空当前小朋友的全部进度吗？（星星、贴纸、解锁记录都会消失）') &&
          confirm('真的重置吗？这个操作无法撤销。')) {
        Store.reset();
        location.reload();
      }
    });

    Sound.setMuted(Store.muted);
    applyMuteIcon();
    refreshStars();
    Sound.probeSounds();
  }

  init();

  // 启动流程：探测后端 → 云模式显示档案选择页；单机模式直接访客进入
  (async function boot() {
    await Profiles.detect();
    if (Profiles.mode === 'cloud') {
      show('gate');
      Profiles.renderGate();
      if (!Profiles.list.length) Profiles.showCreate(); // 全新部署：直接弹创建表单
    } else {
      Profiles.selectGuest();
      Sound.setMuted(Store.muted); applyMuteIcon();
      show('home');
    }
  })();

  // Service Worker：仅 HTTPS（公网部署）或 localhost 下注册，离线可玩
  if ('serviceWorker' in navigator &&
      (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname))) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  return { show, after, enterAs, refreshStars, toast, flyStar };
})();

// 浏览器自动化测试钩子
window.__abc = { App, Store, Sound, Confetti, ABC, Profiles, Skins, LetterPark, ListenFind, SoundMatch, MatchCase, Pets, FarmEconomy, FarmBusiness, FarmLife, FarmMap, Stickers };
