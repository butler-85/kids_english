/* All map companions share one simulation, paused only while the whole viewport is hidden or blocked. */
const FarmLife = (() => {
  let root = null, world = null, frame = 0, last = 0, inView = true, portraitInView = false, cleanup = [], profile = null;
  let records = [], buttons = new Map(), dragging = false;
  const memory = new Map(), reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function blocked() { return !root?.isConnected || dragging || document.hidden || (!inView && !portraitInView) || !!document.querySelector('.farm-dialog, #parent-modal:not(.hidden)'); }
  function paint() {
    if (!world) return;
    const portrait = document.querySelector('[data-animal-portrait]');
    world.actors.forEach(a => {
      const button = buttons.get(a.uid); if (!button) return;
      button.style.transform = `translate3d(${a.x.toFixed(2)}px,${a.y.toFixed(2)}px,0)`;
      button.style.zIndex = Math.round(a.y + a.h);
      button.dataset.behavior = a.mode;
      button.dataset.age = a.adult ? 'adult' : 'young';
      button.style.setProperty('--facing', ['bee', 'fish'].includes(a.type) ? -a.face : a.face);
      button.querySelector('.animal-emote').textContent = a.icon;
      if (portrait?.dataset.animalPortrait === a.uid) { portrait.dataset.behavior = a.mode; portrait.dataset.age = a.adult ? 'adult' : 'young'; }
    });
  }
  function tick(now) {
    frame = 0;
    if (blocked()) { last = 0; return; }
    if (last) world.step((now - last) / 1000, inView && !reduced.matches);
    last = now; paint();
    if (!reduced.matches || world.actors.some(a => a.mode !== 'idle')) frame = requestAnimationFrame(tick);
  }
  function resume() {
    cancelAnimationFrame(frame); frame = 0; last = 0;
    if (!root) return;
    root.classList.toggle('life-paused', blocked());
    document.querySelector('.care-portrait')?.classList.toggle('life-paused', blocked());
    if (blocked()) Sound.stopAnimals();
    if (!blocked()) frame = requestAnimationFrame(tick);
  }
  function detach() {
    world?.remember(); cancelAnimationFrame(frame); frame = 0; last = 0;
    cleanup.forEach(fn => fn()); cleanup = []; root = null; world = null; buttons.clear();
    Sound.stopAnimals();
  }
  function stop() { detach(); memory.clear(); profile = null; records = []; }
  function mount(animals, profileId, map) {
    detach();
    if (profile !== profileId) { memory.clear(); profile = profileId; }
    root = document.querySelector('.farm-herd'); if (!root) return;
    records = animals; inView = true; portraitInView = false; dragging = false;
    buttons = new Map([...root.querySelectorAll('[data-animal]')].map(b => [b.dataset.animal, b]));
    let measured = '';
    function measure() {
      if (!root?.isConnected) return;
      const first = buttons.values().next().value;
      const size = [root.clientWidth, root.clientHeight, first?.offsetWidth || 88, first?.offsetHeight || 106].join(',');
      if (world && size === measured) return;
      measured = size; world?.remember();
      world = FarmMotion.create(records, { width: root.clientWidth, height: root.clientHeight,
        animalWidth: first?.offsetWidth || 88, animalHeight: first?.offsetHeight || 106,
        habitats: map?.habitats, homes: map?.homes, pond: root.dataset.habitat === 'pond' }, { memory });
      paint(); resume();
    }
    buttons.forEach((b, uid) => {
      b.onpointerenter = e => { if (e.pointerType === 'mouse') world?.hold(uid, true); };
      b.onpointerleave = () => world?.hold(uid, false);
      b.onpointerdown = e => { world?.settle(uid); if(e.pointerType !== 'mouse') world?.hold(uid,true); };
      b.onpointerup = b.onpointercancel = () => world?.hold(uid,false);
      b.onfocus = () => { if (b.matches(':focus-visible')) { world?.hold(uid, true); if (map) FarmMap.focusAnimal(uid); } };
      b.onblur = () => world?.hold(uid, false);
    });
    measure();
    const resize = new ResizeObserver(measure); resize.observe(root);
    // On phones the care card is below the map; its animation/sound must keep working there.
    const intersection = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.target.id === 'farm-care') portraitInView = entry.isIntersecting; else inView = entry.isIntersecting; });
      resume();
    });
    intersection.observe(document.getElementById('farm-map-viewport') || root);
    const careCard = document.getElementById('farm-care'); if (careCard) intersection.observe(careCard);
    const overlays = new MutationObserver(resume); overlays.observe(document.getElementById('overlay-root'), { childList: true });
    const parent = document.getElementById('parent-modal'); overlays.observe(parent, { attributes: true, attributeFilter: ['class'] });
    const cameraDrag = e => { dragging = e.detail; buttons.forEach((_,uid) => world?.hold(uid,false)); resume(); };
    document.addEventListener('farm-camera-drag', cameraDrag);
    document.addEventListener('visibilitychange', resume); reduced.addEventListener('change', resume);
    cleanup.push(() => resize.disconnect(), () => intersection.disconnect(), () => overlays.disconnect(),
      () => document.removeEventListener('visibilitychange', resume), () => reduced.removeEventListener('change', resume),
      () => document.removeEventListener('farm-camera-drag', cameraDrag));
  }
  function react(uid, kind = 'touch') {
    const a = world?.react(uid, kind); if (!a) return;
    const b = buttons.get(uid);
    b.classList.remove('animal-reacting'); void b.offsetWidth; b.classList.add('animal-reacting');
    const currentPortrait = () => {
      const el = document.querySelector('.care-portrait');
      return el?.dataset.animalPortrait === uid ? el : null;
    };
    const portrait = currentPortrait();
    if (portrait) { portrait.dataset.behavior = a.mode; portrait.classList.remove('animal-reacting'); void portrait.offsetWidth; portrait.classList.add('animal-reacting'); }
    Sound.stop();
    paint();
    // Replaying the same behavior keeps its data attribute, so restart the CSS timelines explicitly.
    const rewind = () => {
      [b, currentPortrait()].filter(Boolean).forEach(el => el.getAnimations({ subtree: true }).forEach(animation => { animation.currentTime = 0; }));
    };
    rewind();
    const opts = { adult: a.adult };
    if ((a.type === 'cow' || a.type === 'sheep') && (kind === 'food' || kind === 'water')) {
      const reactionWorld = world, reaction = a.reaction, mode = a.mode, beganAt = world.time;
      opts.onStart = () => {
        if (world !== reactionWorld || a.reaction !== reaction || a.mode !== mode || world.time >= a.until) return;
        // Align the ongoing response to media start, including slow or failed file loads.
        a.until += world.time - beganAt;
        rewind();
      };
    }
    Sound.voice(a.type, kind, opts);
    resume();
  }
  return { mount, detach, stop, react, state: () => ({ running: !!frame, count: world?.actors.length || 0,
    actors: world?.actors.map(a => ({ uid: a.uid, type: a.type, adult: a.adult, affection: a.affection, x: a.x, y: a.y, width: a.w, height: a.h, behavior: a.mode })) || [] }) };
})();
