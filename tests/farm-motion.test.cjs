const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync('js/games/farmMotion.js', 'utf8') + ';globalThis.Motion = FarmMotion;', context);
const Motion = context.Motion;
vm.runInContext(fs.readFileSync('js/games/farmMap.js', 'utf8') + ';globalThis.MapLayout = FarmMap.layout;', context);
function seeded(seed) { return () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296); }
const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
test('multiple companions wander independently, stay in bounds and never overlap across habitat sizes', () => {
  for (const [width, height, w, h, count, type, pond] of [
    [256, 350, 76, 94, 4, 'chick', false], [900, 360, 124, 142, 4, 'dog', false],
    [256, 175, 64, 82, 3, 'bee', false], [256, 320, 72, 90, 4, 'fish', true],
  ]) {
    const world = Motion.create(Array.from({ length: count }, (_, i) => ({ uid: 'pet-' + i, type })),
      { width, height, animalWidth: w, animalHeight: h, pond }, { random: seeded(123) });
    const start = world.actors.map(a => ({ x: a.x, y: a.y })), actions = new Set();
    for (let frame = 0; frame < 2400; frame++) {
      world.step(.05);
      world.actors.forEach((a, i) => {
        actions.add(a.mode);
        assert.ok(a.x >= 0 && a.y >= 0 && a.x + w <= width && a.y + h <= height, 'inside habitat');
        assert.ok(world.actors.slice(i + 1).every(b => !overlaps(a, b)), 'no overlap');
        if (pond) {
          const rx = (width - w) / 2, ry = (height - h) / 2;
          assert.ok(((a.x - rx) / rx) ** 2 + ((a.y - ry) / ry) ** 2 <= .961, 'fish stay inside water');
        }
      });
    }
    assert.ok(world.actors.every((a, i) => Math.hypot(a.x - start[i].x, a.y - start[i].y) > 5), type + ' moved');
    assert.ok(actions.size >= 3, type + ' alternates movement and idle habits');
  }
});
test('touch, care and adult reactions are species-specific and do not edit saved animal records', () => {
  const expected = { chick: 'flutter', cat: 'pounce', dog: 'puppyhop', bee: 'twirl', fish: 'splash' };
  for (const [type, mode] of Object.entries(expected)) {
    const animals = [{ uid: 'one', type }], before = JSON.stringify(animals);
    const world = Motion.create(animals, { width: 500, height: 360, animalWidth: 100, animalHeight: 120 });
    assert.equal(world.react('one').mode, mode);
    assert.equal(world.react('one', 'food').mode, 'eat');
    assert.equal(world.react('one', 'water').mode, 'drink');
    assert.equal(JSON.stringify(animals), before);
  }
  const world = Motion.create([{ uid: 'grown', type: 'chick', adult: true }], { width: 500, height: 360, animalWidth: 100, animalHeight: 120 });
  assert.equal(world.actors[0].type, 'hen');
});
test('pointer holds and reduced motion keep targets still; reactions finish without resuming wandering', () => {
  const world = Motion.create([{ uid: 'a', type: 'cat' }], { width: 400, height: 350, animalWidth: 100, animalHeight: 120 });
  const { x, y } = world.actors[0];
  world.hold('a', true); for (let i = 0; i < 200; i++) world.step(.05);
  assert.equal(world.actors[0].x, x); assert.equal(world.actors[0].y, y);
  world.hold('a', false); world.react('a');
  for (let i = 0; i < 200; i++) world.step(.05, false);
  assert.equal(world.actors[0].x, x); assert.equal(world.actors[0].mode, 'idle');
});
test('rerender memory preserves positions without saving movement into the farm', () => {
  const memory = new Map(), bounds = { width: 500, height: 360, animalWidth: 100, animalHeight: 120 };
  const animals = [{ uid: 'a', type: 'dog' }, { uid: 'b', type: 'dog' }];
  const first = Motion.create(animals, bounds, { memory, random: seeded(2) });
  for (let i = 0; i < 100; i++) first.step(.05);
  first.remember(); const next = Motion.create(animals, bounds, { memory, random: seeded(3) });
  next.actors.forEach((a, i) => { assert.ok(Math.abs(a.x - first.actors[i].x) < .001); assert.ok(Math.abs(a.y - first.actors[i].y) < .001); });
});
test('crowded remembered positions reflow the entire group after resizing or adding companions', () => {
  const memory = new Map([['a', { x: .5, y: .5 }]]);
  const world = Motion.create(['a', 'b', 'c', 'd'].map(uid => ({ uid, type: 'cat' })),
    { width: 360, height: 350, animalWidth: 124, animalHeight: 142 }, { memory, random: seeded(9) });
  world.actors.forEach((a, i) => assert.ok(world.actors.slice(i + 1).every(b => !overlaps(a, b))));
});

test('young and adult companions have distinct daily habits and full friendship responses', () => {
  for (const type of ['chick', 'cat', 'dog', 'bee', 'fish']) {
    const records = [{ uid: 'young', type, adult: false, affection: 5 }, { uid: 'adult', type, adult: true, affection: 5 }];
    const saved = JSON.stringify(records), memory = new Map();
    const world = Motion.create(records, { width: 800, height: 500, animalWidth: 88, animalHeight: 106 }, { random: seeded(7), memory });
    assert.notDeepEqual(world.actors[0].habit.idle, world.actors[1].habit.idle);
    assert.notEqual(world.react('young').mode, world.react('adult').mode);
    assert.notEqual(world.react('young', 'pet').mode, world.react('adult', 'pet').mode);
    assert.equal(world.actors[0].icon, '💗');
    assert.equal(world.actors[1].icon, '💗');
    world.remember();
    const grown = Motion.create(records.map(a => ({ ...a, adult: true })), { width: 800, height: 500, animalWidth: 88, animalHeight: 106 }, { memory });
    assert.ok(Math.abs(grown.actors[0].x - world.actors[0].x) < .001);
    assert.ok(Math.abs(grown.actors[0].y - world.actors[0].y) < .001);
    assert.equal(JSON.stringify(records), saved);
  }
});

test('individual products have separate hit areas in their own regions, including large legacy stocks', () => {
  const items = ['egg','honey','pearl','milk','wool'];
  for (const count of [1, 30, 85]) {
    const drops = items.flatMap(item => Array.from({ length: count }, (_, slot) => ({ item, slot })));
    const map = context.MapLayout([], drops), u = map.unit;
    const boxes = drops.map(d => ({ item: d.item, ...map.dropSpots[d.item][d.slot], w: 60, h: 60 }));
    boxes.forEach((p, i) => {
      const box = { ...p, x: p.x - 30, y: p.y - 30 };
      assert.ok(box.x >= 0 && box.y >= 0 && box.x + 60 <= map.width && box.y + 60 <= map.height);
      assert.ok(boxes.slice(i + 1).every(q => !overlaps(box, { ...q, x: q.x - 30, y: q.y - 30 })), 'individual pickup targets never overlap');
      assert.ok(map.plots.every(q => !overlaps(box, { ...q, w: q.width * u, h: q.height * u })), 'products do not cover crops');
      assert.ok(box.x + 60 < 824 * u || box.x > 936 * u, 'products stay off the main road');
      if (p.item === 'egg') assert.ok(p.x / u > 345 && p.y / u < 530, 'eggs stay beside the coop, above the west road');
      if (p.item === 'honey') assert.ok(p.x / u > 950 && p.y / u < 315, 'honey stays in the flower field');
      if (p.item === 'pearl') assert.ok(((p.x / u - 1315) / 335) ** 2 + ((p.y / u - 1005) / 155) ** 2 <= 1, 'pearls stay in the pond shallows');
    });
    assert.equal(JSON.stringify(context.MapLayout([], drops)), JSON.stringify(map), 'a restored save has deterministic positions');
  }
});

test('one expanded farm contains every companion, with shared land, safe buildings and water boundaries', () => {
  for (const count of [1, 9, 25]) {
    const animals = ['chick', 'cat', 'dog', 'bee', 'fish'].flatMap(type => Array.from({ length: count }, (_, i) => ({ uid: type+i, type })));
    const map = context.MapLayout(animals);
    const world = Motion.create(animals, { ...map, animalWidth: 88, animalHeight: 106 }, { random: seeded(100) });
    assert.equal(world.actors.length, animals.length);
    assert.equal(world.actors[0].habitat, world.actors[count].habitat, 'land animals share terrain');
    for (let frame = 0; frame < 600; frame++) {
      world.step(.05);
      world.actors.forEach((a,i) => {
        const r=a.habitat;
        assert.ok(a.x>=r.x && a.y>=r.y && a.x+a.w<=r.x+r.width && a.y+a.h<=r.y+r.height);
        assert.ok(world.actors.slice(i+1).every(b=>!overlaps(a,b)));
        assert.ok((r.obstacles||[]).every(b=>!overlaps(a,{...b,w:b.width,h:b.height})), 'no animal inside barn');
        assert.ok(map.plots.every(b=>!overlaps(a,{...b,w:b.width*map.unit,h:b.height*map.unit})), 'crops stay accessible');
        if(r.pond) {
          const rx=(r.width-a.w)/2,ry=(r.height-a.h)/2;
          assert.ok(((a.x-r.x-rx)/rx)**2+((a.y-r.y-ry)/ry)**2<=.961);
        }
      });
    }
  }
});
