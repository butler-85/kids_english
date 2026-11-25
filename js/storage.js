/* 进度存储：绑定到某个小朋友档案
 * - 本地缓存 localStorage（键 abc_park_p_<id>），断网也能继续玩
 * - 云端同步：节流 1.2s PUT /api/profiles/<id>/progress；关页/回网自动补发
 * - 无后端（file:// 双击打开或服务器不可达）时为访客单机模式，行为与旧版一致
 */
const Store = (() => {
  const LEGACY_KEY = 'abc_park_progress_v1'; // v1 单机版的进度键，自动迁移到访客档案
  // 艾宾浩斯/莱特纳复习间隔（天）：答对升一级，答错归零次日复习
  const REVIEW_INTERVALS = [1, 2, 4, 7, 15];
  let data = { stars: 0, letters: {}, muted: false };
  let profileId = 'guest';
  let cloudEnabled = false;
  let cloudTimer = null;
  let pendingCloud = false;

  const fresh = () => ({ stars: 0, letters: {}, muted: false });
  const localKey = pid => 'abc_park_p_' + pid;
  const pad = n => String(n).padStart(2, '0');
  const dateStr = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const todayStr = () => dateStr(new Date());
  const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return dateStr(d); };

  function persistLocal() {
    try { localStorage.setItem(localKey(profileId), JSON.stringify(data)); } catch (e) {}
  }

  function scheduleCloud() {
    if (!cloudEnabled) return;
    pendingCloud = true;
    clearTimeout(cloudTimer);
    cloudTimer = setTimeout(flush, 1200);
  }

  async function flush() {
    if (!cloudEnabled || !pendingCloud) return;
    pendingCloud = false;
    persistLocal();
    try {
      const r = await fetch('/api/profiles/' + profileId + '/progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!r.ok) pendingCloud = true;
    } catch (e) { pendingCloud = true; } // 断网：下次变更或回网时重试
  }

  window.addEventListener('pagehide', () => {
    persistLocal();
    if (cloudEnabled && pendingCloud) {
      try {
        fetch('/api/profiles/' + profileId + '/progress', {
          method: 'PUT', keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } catch (e) {}
    }
  });
  window.addEventListener('online', () => flush());

  // 绑定档案：doc 为云端进度（可空 {}），缺失时回退本地缓存
  function bind(pid, doc, cloud) {
    profileId = pid;
    cloudEnabled = !!cloud;
    let d = null;
    if (doc && typeof doc === 'object' && doc.letters) d = Object.assign(fresh(), doc);
    if (!d) {
      try { d = JSON.parse(localStorage.getItem(localKey(pid))) || null; } catch (e) {}
      if (!d || !d.letters) d = fresh();
    }
    if (pid === 'guest') { // 一次性迁移 v1 单机进度
      try {
        const legacy = localStorage.getItem(LEGACY_KEY);
        const cached = localStorage.getItem(localKey('guest'));
        if (legacy && !cached) d = Object.assign(fresh(), JSON.parse(legacy));
      } catch (e) {}
    }
    data = d;
    persistLocal();
  }

  const letter = L => (data.letters[L] = data.letters[L] || { seen: 0, correct: 0, wrong: 0 });
  const touch = () => { persistLocal(); scheduleCloud(); };

  return {
    bind, flush,
    get profileId() { return profileId; },
    get stars() { return data.stars; },
    addStars(n) { data.stars += n; touch(); },
    letterStat(L) { return data.letters[L] || { seen: 0, correct: 0, wrong: 0, box: 0, due: null }; },
    markSeen(L) { letter(L).seen++; touch(); },
    // 第 N 次连续答对恰好达到 MASTER_STREAK 时返回 true（新贴纸时刻）
    // 同时按记忆等级安排下次复习日期（1/2/4/7/15 天后）
    markCorrect(L) {
      const it = letter(L);
      it.correct++;
      it.box = Math.min(REVIEW_INTERVALS.length, (it.box || 0) + 1);
      it.due = addDays(REVIEW_INTERVALS[it.box - 1]);
      touch();
      return it.correct === ABC.MASTER_STREAK;
    },
    // 贴纸规则：连续答对 5 次解锁；未解锁前答错一次，连续计数清零；已解锁的贴纸不收回
    // 记忆法：答错 → 记忆等级归零，次日到期复习
    markWrong(L) {
      const it = letter(L);
      it.wrong++;
      if (it.correct < ABC.MASTER_STREAK) {
        it.correct = 0;
        it.box = 0;
        it.due = addDays(1);
      }
      touch();
    },
    // 是否到了该复习的日期（新字母视为待学）
    isDue(L) {
      const s = data.letters[L];
      return !s || !s.due || s.due <= todayStr();
    },
    mastered(L) { const s = data.letters[L]; return !!s && s.correct >= ABC.MASTER_STREAK; },
    masteredCount() { return ABC.letters.filter(x => this.mastered(x.L)).length; },
    unlockedCount() { return Math.min(26, 6 + this.masteredCount()); },
    pool() { return ABC.letters.slice(0, this.unlockedCount()).map(x => x.L); },
    get muted() { return !!data.muted; },
    setMuted(m) { data.muted = !!m; touch(); },
    reset() { data = fresh(); touch(); },

    // 养殖模块数据（与进度一起云同步）：animals/补给/爱心/照顾状态/金币/农田/果实仓库
    farm(fn) {
      if (!data.farm) data.farm = { animals: [], food: 0, water: 0, hearts: 0, care: {} };
      const f = data.farm;
      // 旧档案迁移：补齐经济系统字段
      if (typeof f.coins !== 'number') f.coins = 20;
      if (!Array.isArray(f.plots)) f.plots = [];
      while (f.plots.length < 6) f.plots.push(null); // 农田 6 块
      if (!f.fruit) f.fruit = {};
      Object.values(f.care).forEach(c => { if (typeof c.growth !== 'number') c.growth = 5; }); // 旧动物视为成年
      if (fn) { fn(f); touch(); }
      return f;
    },

    // 家长贴纸管理（访客/单机模式）：直接改本机 letters 文档
    mutateLetters(fn) { fn(data.letters); touch(); return data.letters; },
  };
})();
