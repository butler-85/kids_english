/* Small autonomous companions. Coordinates and animation clocks are ephemeral, never farm save data. */
const FarmMotion = (() => {
  const HABITS = {
    chick: { speed: 25, range: 145, idle: ['peck', 'look', 'hop'], touch: ['flutter', 'hop'], bond: 'happyhop' },
    cat: { speed: 27, range: 160, idle: ['playpaw', 'look', 'nap'], touch: ['pounce', 'playpaw'], bond: 'kittenroll' },
    dog: { speed: 34, range: 190, idle: ['headtilt', 'playpaw', 'sniff'], touch: ['puppyhop', 'bow'], bond: 'puppydance' },
    bee: { speed: 31, range: 150, idle: ['wobble', 'hover'], touch: ['twirl', 'wobble'], bond: 'heartloop' },
    fish: { speed: 30, range: 140, idle: ['dartpeek', 'bubble'], touch: ['splash', 'bubble'], bond: 'bubblekiss' },
    cow: { speed: 24, range: 145, idle: ['look', 'sniff'], touch: ['headtilt', 'hop'], bond: 'happyhop' },
    sheep: { speed: 27, range: 160, idle: ['look', 'sniff'], touch: ['hop', 'headtilt'], bond: 'happyhop' },
  };
  const ADULT_HABITS = {
    chick: { speed: 17, range: 230, idle: ['peck', 'scratch', 'look'], touch: ['ruffle', 'scratch'], bond: 'winghug' },
    cat: { speed: 18, range: 260, idle: ['groom', 'stretch', 'nap'], touch: ['nuzzle', 'stretch'], bond: 'bellyroll' },
    dog: { speed: 25, range: 310, idle: ['sniff', 'watch', 'wag'], touch: ['wag', 'shake'], bond: 'loyalspin' },
    bee: { speed: 23, range: 280, idle: ['forage', 'cleanantennae', 'hover'], touch: ['pollendance', 'forage'], bond: 'flowerheart' },
    fish: { speed: 19, range: 250, idle: ['glide', 'bubble'], touch: ['fantail', 'glide'], bond: 'heartfin' },
    cow: { speed: 16, range: 250, idle: ['sniff', 'look'], touch: ['nuzzle', 'headtilt'], bond: 'nuzzle' },
    sheep: { speed: 20, range: 235, idle: ['sniff', 'look'], touch: ['ruffle', 'headtilt'], bond: 'happyhop' },
  };
  const ICONS = { nap: '💤', groom: '✨', stretch: '☀', sniff: '🐾', peck: '♪', forage: '🌼',
    flutter: '♪', hop: '💛', nuzzle: '💛', bow: '💛', wag: '💛', twirl: '🌼', splash: '💦', bubble: '○', eat: '🥣', drink: '💧',
    playpaw: '🐾', pounce: '🐾', puppyhop: '💛', headtilt: '❔', ruffle: '✨', scratch: '♪', watch: '☀', pollendance: '🌼', cleanantennae: '✨', fantail: '💦' };
  function create(animals, bounds, { random = Math.random, memory = new Map() } = {}) {
    let time = 0;
    const { width, height, animalWidth: w, animalHeight: h, pond = false } = bounds;
    const actors = [], held = new Set();
    const pick = list => list[Math.floor(random() * list.length)];
    const fallback = { x: 0, y: 0, width, height, pond };
    function inside(x, y, a) {
      const r = a?.habitat || fallback;
      if (x < r.x || y < r.y || x + w > r.x + r.width || y + h > r.y + r.height) return false;
      if (r.obstacles?.some(o => x < o.x + o.width + 5 && x + w + 5 > o.x && y < o.y + o.height + 5 && y + h + 5 > o.y)) return false;
      if (!r.pond) return true;
      const rx = Math.max(1, (r.width - w) / 2), ry = Math.max(1, (r.height - h) / 2);
      return ((x - r.x - rx) / rx) ** 2 + ((y - r.y - ry) / ry) ** 2 <= .96;
    }
    const overlaps = (x, y, other) => x < other.x + other.w + 3 && x + w + 3 > other.x && y < other.y + other.h + 3 && y + h + 3 > other.y;
    const available = (x, y, self) => inside(x, y, self) && actors.every(a => a === self || !overlaps(x, y, a));
    function spots(a) {
      const r = a.habitat, result = [];
      const spanX = (r.width - w) * (r.pond ? .68 : 1), spanY = (r.height - h) * (r.pond ? .68 : 1);
      const cols = Math.max(1, Math.floor(spanX / (w + 4)) + 1), rows = Math.max(1, Math.floor(spanY / (h + 4)) + 1);
      for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
        const x = r.x + (r.width - w - spanX) / 2 + spanX * (cols === 1 ? .5 : col / (cols - 1));
        const y = r.y + (r.height - h - spanY) / 2 + spanY * (rows === 1 ? .5 : row / (rows - 1));
        if (inside(x, y, a)) result.push({ x, y });
      }
      const home = bounds.homes?.[a.type] || r;
      return result.sort((p, q) => Math.hypot(p.x + w/2 - home.x - home.width/2, p.y + h/2 - home.y - home.height/2) - Math.hypot(q.x + w/2 - home.x - home.width/2, q.y + h/2 - home.y - home.height/2));
    }
    animals.forEach(animal => {
      const adult = !!animal.adult || animal.type === 'hen', species = animal.type === 'hen' ? 'chick' : animal.type;
      const type = species === 'chick' && adult ? 'hen' : species;
      const habit = (adult ? ADULT_HABITS : HABITS)[species] || HABITS.chick;
      const saved = memory.get(animal.uid);
      const habitat = bounds.habitats?.[type === 'bee' ? 'bee' : type === 'fish' ? 'fish' : 'land'] || fallback;
      const a = { uid: animal.uid, type, adult, affection: Math.min(5,Math.max(0,animal.affection || 0)), habitat, x: -10000, y: -10000, w, h, face: saved?.face || 1,
        mode: 'idle', icon: '', until: .5 + random() * 1.8, holdUntil: 0,
        speed: habit.speed * (.8 + random() * .4), habit, visits: 0, reaction: saved?.reaction || 0, forceWalk: true };
      const spot = saved && available(saved.x * (width-w), saved.y * (height-h), a)
        ? { x: saved.x * (width-w), y: saved.y * (height-h) } : spots(a).find(p => available(p.x, p.y, a));
      if (spot) { a.x = a.tx = spot.x; a.y = a.ty = spot.y; }
      actors.push(a);
    });
    // One remembered animal in the middle of a narrow viewport can block every other spawn.
    // Reflow the whole group together in that case, rather than accepting an overlapping last animal.
    if (actors.some(a => !available(a.x, a.y, a))) {
      actors.forEach(a => { a.x = a.y = -10000; });
      actors.forEach(a => {
        const p = spots(a).find(p => available(p.x, p.y, a));
        if (!p) throw new Error('Farm habitat has insufficient space');
        a.x = a.tx = p.x; a.y = a.ty = p.y;
      });
    }
    function idle(a, delay = (a.adult ? 1.2 : .5) + random() * (a.adult ? 2.2 : 1.3)) { a.mode = 'idle'; a.icon = ''; a.until = time + delay; }
    function choose(a) {
      if (a.forceWalk || random() < (a.adult ? .56 : .74)) {
        a.forceWalk = false;
        for (let i = 0; i < 32; i++) {
          const angle = random() * Math.PI * 2, distance = 30 + random() * a.habit.range;
          const x = a.x + Math.cos(angle) * distance, y = a.y + Math.sin(angle) * distance;
          if (!available(x, y, a) || Math.hypot(x - a.x, y - a.y) < 18) continue;
          a.tx = x; a.ty = y; a.mode = 'walk'; a.icon = ''; a.until = time + distance / a.speed + 1;
          a.face = x < a.x ? -1 : 1; return;
        }
      }
      a.mode = pick(a.habit.idle); a.icon = ICONS[a.mode] || ''; a.until = time + (a.adult ? 2 : 1) + random() * 2;
    }
    function step(seconds, wander = true) {
      const dt = Math.min(.08, Math.max(0, seconds)); time += dt;
      actors.forEach(a => {
        if (held.has(a.uid) || time < a.holdUntil) { if (time >= a.until) idle(a, .5); return; }
        if (!wander) { if (a.mode === 'walk' || time >= a.until) idle(a, 1); return; }
        if (time >= a.until) { choose(a); return; }
        if (a.mode !== 'walk') return;
        const dx = a.tx - a.x, dy = a.ty - a.y, distance = Math.hypot(dx, dy);
        if (distance < 1) { a.visits++; idle(a); return; }
        const fraction = Math.min(1, a.speed * dt / distance), x = a.x + dx * fraction, y = a.y + dy * fraction;
        if (available(x, y, a)) { a.x = x; a.y = y; }
        else idle(a, .3 + random() * .6);
      });
    }
    function react(uid, kind = 'touch') {
      const a = actors.find(a => a.uid === uid); if (!a) return null;
      const bond = kind === 'pet' && a.affection >= 5;
      a.mode = bond ? a.habit.bond : kind === 'food' ? 'eat' : kind === 'water' ? 'drink' : a.habit.touch[a.reaction % a.habit.touch.length];
      const care = kind === 'food' || kind === 'water';
      const foodIcon = a.type === 'bee' ? '🌸' : a.type === 'fish' ? '🟤' : ['chick', 'hen'].includes(a.type) ? '🌾' : ['cow', 'sheep'].includes(a.type) ? '🌿' : '🥣';
      a.reaction++; a.icon = bond ? '💗' : care ? (kind === 'food' ? foodIcon : a.type === 'fish' ? '🫧' : '💧') : ICONS[a.mode] || '💛';
      a.until = time + (care ? 4.4 : bond ? 2.8 : 1.8); a.holdUntil = 0;
      a.tx = a.x; a.ty = a.y; return a;
    }
    function remember() {
      actors.forEach(a => memory.set(a.uid, { x: a.x / Math.max(1, width - w), y: a.y / Math.max(1, height - h), face: a.face, reaction: a.reaction }));
    }
    return { actors, step, react, remember, hold: (uid, on) => {
      if (on) { held.add(uid); const a = actors.find(a => a.uid === uid); if (a?.mode === 'walk') idle(a); }
      else held.delete(uid);
    },
      settle: uid => { const a = actors.find(a => a.uid === uid); if (a) a.holdUntil = time + .8; },
      get time() { return time; } };
  }
  return { create, HABITS, ADULT_HABITS };
})();
