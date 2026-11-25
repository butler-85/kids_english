/* 小朋友档案：启动选择、创建、切换、家长删除
 * 有后端（server/app.py）时走云端 API，进度跨设备同步；
 * 无后端时 App 直接进入访客单机模式（本模块不显示）
 */
const Profiles = (() => {
  const AVATARS = ['🐻', '🐱', '🐶', '🐼', '🦊', '🐯', '🦁', '🐵', '🐸', '🐰', '🐥', '🦄'];
  let mode = 'pending'; // 'cloud' | 'local'
  let list = [];
  let current = null;

  const esc = s => String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- 家长贴纸管理：读云端整档 → 改 letters → 整档回写 ----------
  const dateStr = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const addDaysLocal = n => { const d = new Date(); d.setDate(d.getDate() + n); return dateStr(d); };

  async function saveLetters(pid, mutate) {
    const r = await fetch('/api/profiles/' + pid + '/progress', { cache: 'no-store' });
    const doc = await r.json();
    doc.letters = doc.letters || {};
    mutate(doc.letters);
    await fetch('/api/profiles/' + pid + '/progress', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc), // 整份回写：星星/农场/复习日期原样保留
    });
    // 改的是当前正在玩的档案 → 本机立即生效
    if (current && current.id === pid) {
      Store.bind(pid, doc, true);
      App.refreshStars();
    }
    return doc;
  }

  async function openStickerEditor(pid, box) {
    // pid 为空 = 访客/单机模式，直接读写本机 Store
    const local = !pid;
    let letters = null;
    if (!local) {
      const r = await fetch('/api/profiles/' + pid + '/progress', { cache: 'no-store' });
      const doc = await r.json();
      letters = doc.letters || {};
    }
    const has = L => local
      ? Store.mastered(L)
      : !!(letters[L] && letters[L].correct >= ABC.MASTER_STREAK);

    const apply = async mutate => {
      if (local) { Store.mutateLetters(ls => { letters = ls; mutate(ls); }); }
      else {
        const doc = await saveLetters(pid, mutate);
        letters = doc.letters;
      }
    };

    box.innerHTML =
      '<div class="pm-se-tools">' +
        '<span class="pm-se-count"></span>' +
        '<button class="pm-batch" data-act="all">全部发放</button>' +
        '<button class="pm-batch warn" data-act="none">全部收回</button>' +
      '</div>' +
      '<div class="pm-se-grid">' +
        ABC.letters.map(x => {
          const on = has(x.L);
          const c = ABC.palette[(x.L.charCodeAt(0) - 65) % ABC.palette.length];
          return '<button class="pm-chip' + (on ? ' on' : '') + '" data-l="' + x.L + '" title="' + esc(x.word) + '"' +
                 (on ? ' style="background:' + c + '"' : '') + '>' + x.L + '</button>';
        }).join('') +
      '</div>';
    const refreshCount = () => {
      box.querySelector('.pm-se-count').textContent =
        '贴纸 ' + ABC.letters.filter(x => has(x.L)).length + ' / 26 · 点字母发放/收回';
    };
    refreshCount();

    box.querySelectorAll('.pm-chip').forEach(ch => ch.addEventListener('click', async () => {
      const L = ch.dataset.l;
      const grant = !ch.classList.contains('on');
      ch.disabled = true;
      try {
        await apply(ls => {
          const it = ls[L] = ls[L] || { seen: 0, correct: 0, wrong: 0, box: 0, due: null };
          if (grant) { it.correct = Math.max(it.correct, ABC.MASTER_STREAK); it.box = 5; it.due = addDaysLocal(15); }
          else { it.correct = 0; it.box = 0; it.due = addDaysLocal(1); }
        });
        ch.classList.toggle('on', grant);
        if (grant) ch.style.background = ABC.palette[(L.charCodeAt(0) - 65) % ABC.palette.length];
        else ch.style.background = '';
        refreshCount();
      } catch (e) { App.toast('保存失败，请重试 😢'); }
      ch.disabled = false;
    }));

    box.querySelector('[data-act="all"]').addEventListener('click', async () => {
      await apply(ls => {
        ABC.letters.forEach(x => {
          const it = ls[x.L] = ls[x.L] || { seen: 0, correct: 0, wrong: 0, box: 0, due: null };
          it.correct = Math.max(it.correct, ABC.MASTER_STREAK);
          it.box = 5; it.due = addDaysLocal(15);
        });
      });
      openStickerEditor(pid, box);
    });
    box.querySelector('[data-act="none"]').addEventListener('click', async () => {
      if (!confirm('收回该小朋友的全部贴纸？')) return;
      await apply(ls => {
        ABC.letters.forEach(x => {
          const it = ls[x.L] = ls[x.L] || { seen: 0, correct: 0, wrong: 0, box: 0, due: null };
          it.correct = 0; it.box = 0; it.due = addDaysLocal(1);
        });
      });
      openStickerEditor(pid, box);
    });
  }

  async function detect() {
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 2500);
      const r = await fetch('/api/profiles', { signal: ctl.signal, cache: 'no-store' });
      clearTimeout(t);
      if (r.ok) {
        mode = 'cloud';
        list = await r.json();
        return mode;
      }
    } catch (e) { /* file:// 或服务器不可达 → 单机访客模式 */ }
    mode = 'local';
    return mode;
  }

  async function refresh() {
    try { list = await (await fetch('/api/profiles', { cache: 'no-store' })).json(); } catch (e) {}
    return list;
  }

  async function create(name, avatar) {
    const r = await fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, avatar }),
    });
    if (!r.ok) throw new Error('create failed');
    const p = await r.json();
    list.push(p);
    return p;
  }

  async function remove(id) {
    await fetch('/api/profiles/' + id, { method: 'DELETE' });
    list = list.filter(p => p.id !== id);
    if (current && current.id === id) current = null;
  }

  async function select(p) {
    current = p;
    let doc = null;
    try {
      const r = await fetch('/api/profiles/' + p.id + '/progress', { cache: 'no-store' });
      if (r.ok) doc = await r.json();
    } catch (e) { /* 离线：回退本地缓存 */ }
    Store.bind(p.id, doc, true);
  }

  function selectGuest() {
    current = null;
    Store.bind('guest', null, false);
  }

  // ---------- 选择界面 ----------
  function renderGate() {
    const grid = document.getElementById('gate-list');
    grid.innerHTML = '';
    list.forEach(p => {
      const card = document.createElement('button');
      card.className = 'gp-card';
      card.innerHTML =
        '<div class="gp-avatar">' + esc(p.avatar) + '</div>' +
        '<div class="gp-name">' + esc(p.name) + '</div>';
      card.addEventListener('click', async () => {
        Sound.sfx('tap');
        try {
          await select(p);
          App.enterAs(p);
        } catch (e) {
          App.toast('加载失败，再试一次 😢');
        }
      });
      grid.appendChild(card);
    });
    const add = document.createElement('button');
    add.className = 'gp-card gp-add';
    add.innerHTML = '<div class="gp-avatar">➕</div><div class="gp-name">新小朋友</div>';
    add.addEventListener('click', showCreate);
    grid.appendChild(add);
  }

  function showCreate() {
    let chosen = AVATARS[0];
    const root = document.getElementById('overlay-root');
    root.innerHTML =
      '<div class="overlay">' +
        '<div class="win-title" style="font-size:clamp(26px,6vw,40px)">👋 新小朋友</div>' +
        '<input id="cf-name" class="cf-name" maxlength="12" placeholder="名字" autocomplete="off">' +
        '<div class="cf-avatars" id="cf-avatars">' +
          AVATARS.map((a, i) => '<button class="cf-av' + (i === 0 ? ' sel' : '') + '" data-a="' + a + '">' + a + '</button>').join('') +
        '</div>' +
        '<div class="overlay-btns">' +
          '<button class="ov-btn" data-act="ok">✅</button>' +
          '<button class="ov-btn" data-act="cancel">✖️</button>' +
        '</div>' +
      '</div>';
    const ov = root.firstElementChild;
    ov.querySelectorAll('.cf-av').forEach(b => b.addEventListener('click', () => {
      chosen = b.dataset.a;
      ov.querySelectorAll('.cf-av').forEach(x => x.classList.toggle('sel', x === b));
      Sound.sfx('tap');
    }));
    ov.querySelector('[data-act="cancel"]').addEventListener('click', () => { root.innerHTML = ''; });
    ov.querySelector('[data-act="ok"]').addEventListener('click', async () => {
      const name = ov.querySelector('#cf-name').value.trim();
      if (!name) { ov.querySelector('#cf-name').focus(); return; }
      try {
        const p = await create(name, chosen);
        root.innerHTML = '';
        await select(p);
        App.enterAs(p);
      } catch (e) {
        App.toast('创建失败，请重试 😢');
      }
    });
    setTimeout(() => ov.querySelector('#cf-name').focus(), 100);
  }

  // ---------- 家长弹窗里的用户列表 ----------
  async function renderParentList() {
    const box = document.getElementById('pm-users');
    if (mode !== 'cloud') {
      box.innerHTML =
        '<p class="pm-note">当前是单机访客模式（未连接服务器），进度只保存在本机。</p>' +
        '<div class="pm-row">' +
          '<span style="font-size:24px">👤</span>' +
          '<span>访客小朋友</span>' +
          '<button class="pm-st">🏷 贴纸</button>' +
        '</div>' +
        '<div class="pm-stickers" data-open="0"></div>';
      const stBox = box.querySelector('.pm-stickers');
      box.querySelector('.pm-st').addEventListener('click', () => {
        if (stBox.dataset.open === '1') { stBox.dataset.open = '0'; stBox.innerHTML = ''; return; }
        stBox.dataset.open = '1';
        stBox.innerHTML = '<p class="pm-note">加载中…</p>';
        openStickerEditor(null, stBox); // pid 为空 → 编辑本机数据
      });
      return;
    }
    await refresh();
    if (!list.length) {
      box.innerHTML = '<p class="pm-note">还没有小朋友的档案，回到首页点「切换小朋友 → 新小朋友」创建。</p>';
      return;
    }
    box.innerHTML = '';
    list.forEach(p => {
      const wrap = document.createElement('div');
      wrap.innerHTML =
        '<div class="pm-row">' +
          '<span style="font-size:24px">' + esc(p.avatar) + '</span>' +
          '<span>' + esc(p.name) + '</span>' +
          '<button class="pm-st">🏷 贴纸</button>' +
          '<button class="pm-del" data-id="' + p.id + '">删除</button>' +
        '</div>' +
        '<div class="pm-stickers" data-open="0"></div>';
      const stBox = wrap.querySelector('.pm-stickers');
      wrap.querySelector('.pm-st').addEventListener('click', async () => {
        if (stBox.dataset.open === '1') { stBox.dataset.open = '0'; stBox.innerHTML = ''; return; }
        stBox.dataset.open = '1';
        stBox.innerHTML = '<p class="pm-note">加载中…</p>';
        openStickerEditor(p.id, stBox);
      });
      wrap.querySelector('.pm-del').addEventListener('click', async () => {
        if (!confirm('删除「' + p.name + '」的全部进度？此操作无法撤销。')) return;
        await remove(p.id);
        renderParentList();
        if (!current) { // 删的是当前玩家 → 回选择页
          document.getElementById('parent-modal').classList.add('hidden');
          App.show('gate');
          renderGate();
        }
      });
      box.appendChild(wrap);
    });
  }

  return {
    detect, refresh, create, remove, select, selectGuest,
    renderGate, showCreate, renderParentList,
    AVATARS,
    get mode() { return mode; },
    get list() { return list; },
    get current() { return current; },
  };
})();
