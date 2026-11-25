/* 字母数据、配色、形近易混映射、出题辅助函数 */
const ABC = {
  // 解锁贴纸需要的连续答对次数（答错一次清零重计；已解锁的贴纸不收回）
  MASTER_STREAK: 5,

  // 锚定词选择原则：3-4 岁熟悉的具体名词、emoji 在 Windows/手机上都能正常显示
  letters: [
    { L: 'A', word: 'Apple',     emoji: '🍎' },
    { L: 'B', word: 'Bear',      emoji: '🐻' },
    { L: 'C', word: 'Cat',       emoji: '🐱' },
    { L: 'D', word: 'Dog',       emoji: '🐶' },
    { L: 'E', word: 'Elephant',  emoji: '🐘' },
    { L: 'F', word: 'Fish',      emoji: '🐟' },
    { L: 'G', word: 'Grapes',    emoji: '🍇' },
    { L: 'H', word: 'Hat',       emoji: '🎩' },
    { L: 'I', word: 'Ice cream', emoji: '🍦' },
    { L: 'J', word: 'Juice',     emoji: '🧃' },
    { L: 'K', word: 'Kite',      emoji: '🪁' },
    { L: 'L', word: 'Lion',      emoji: '🦁' },
    { L: 'M', word: 'Moon',      emoji: '🌙' },
    { L: 'N', word: 'Nose',      emoji: '👃' },
    { L: 'O', word: 'Orange',    emoji: '🍊' },
    { L: 'P', word: 'Panda',     emoji: '🐼' },
    { L: 'Q', word: 'Queen',     emoji: '👸' },
    { L: 'R', word: 'Rainbow',   emoji: '🌈' },
    { L: 'S', word: 'Sun',       emoji: '🌞' },
    { L: 'T', word: 'Tiger',     emoji: '🐯' },
    { L: 'U', word: 'Umbrella',  emoji: '☂️' },
    { L: 'V', word: 'Violin',    emoji: '🎻' },
    { L: 'W', word: 'Watermelon', emoji: '🍉' },
    { L: 'X', word: 'Fox',       emoji: '🦊' },  // x 的读音 /ks/ 出现在 fox 结尾，是自然拼读的标准教法
    { L: 'Y', word: 'Yo-yo',     emoji: '🪀' },
    { L: 'Z', word: 'Zebra',     emoji: '🦓' },
  ],

  palette: ['#FF6B6B', '#F7964A', '#F4B942', '#59A96A', '#4D96FF', '#845EC2', '#F15BB5'],

  // 形近易混字母（b/d/p/q、m/w 等）——出题时优先用作干扰项，答错后也会加重复习
  confusables: {
    A: ['H', 'V', 'R'],          B: ['D', 'P', 'Q', 'R'],
    C: ['G', 'O', 'S'],          D: ['B', 'P', 'Q', 'E'],
    E: ['F', 'B', 'L'],          F: ['E', 'T', 'P'],
    G: ['C', 'O', 'Q', 'J'],     H: ['A', 'N', 'K'],
    I: ['L', 'J', 'T'],          J: ['I', 'L', 'G'],
    K: ['X', 'R', 'H'],          L: ['I', 'J', 'E'],
    M: ['W', 'N'],               N: ['M', 'H', 'U'],
    O: ['C', 'Q', 'D', 'U'],     P: ['B', 'D', 'Q', 'R'],
    Q: ['B', 'D', 'P', 'G', 'O'], R: ['K', 'A', 'P'],
    S: ['Z', 'C', 'E'],          T: ['F', 'I', 'J'],
    U: ['V', 'N', 'W'],          V: ['U', 'W', 'Y'],
    W: ['M', 'V', 'N'],          X: ['Z', 'K', 'Y'],
    Y: ['V', 'X', 'Z'],          Z: ['S', 'E', 'X'],
  },

  byL(L) { return this.letters.find(x => x.L === L); },

  helpers: {
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },

    // 加权选目标字母：未掌握的优先、答错过的复习、到期字母加权（遗忘曲线）、避免连续重复
    weightedTarget(pool, avoid, stat) {
      const t = new Date();
      const today = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
      const weights = pool.map(L => {
        const s = stat(L) || { correct: 0, wrong: 0 };
        let w = 1 + Math.max(0, ABC.MASTER_STREAK - s.correct) * 2 + Math.min(s.wrong, 5);
        if (s.due && s.due <= today) w *= 2.5; // 到复习日期的字母优先出现
        if (L === avoid) w = 0.15;
        return w;
      });
      let r = Math.random() * weights.reduce((a, b) => a + b, 0);
      for (let i = 0; i < pool.length; i++) {
        r -= weights[i];
        if (r <= 0) return pool[i];
      }
      return pool[pool.length - 1];
    },

    // 干扰项：优先「形近且已解锁」，其次任意形近字母，最后随机补齐
    distractors(target, n, pool) {
      const out = [];
      const conf = ABC.confusables[target] || [];
      for (const L of ABC.helpers.shuffle([...conf])) {
        if (out.length < n && pool.includes(L) && !out.includes(L)) out.push(L);
      }
      for (const L of ABC.helpers.shuffle([...conf])) {
        if (out.length < n && !out.includes(L)) out.push(L);
      }
      const all = ABC.letters.map(x => x.L);
      for (const L of ABC.helpers.shuffle(all)) {
        if (out.length < n && L !== target && !out.includes(L)) out.push(L);
      }
      return out;
    },
  },
};
