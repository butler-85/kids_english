const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync('js/games/farmEconomy.js', 'utf8') + ';globalThis.E = FarmEconomy;', context);
const E = context.E;
const fresh = () => ({ coins: 50, animals: [], care: {}, food: 0, water: 0, hearts: 0, fruit: {}, plots: Array(6).fill(null) });
const careTime = (day, hour = 12, minute = 0) => new Date(2026, 10, day, hour, minute).getTime();
test('starter gift is granted exactly once and preserves existing animals and crops', () => {
  const f = fresh(); E.start(f, 1000); E.start(f, 2000);
  assert.equal(f.animals.length, 1); assert.equal(f.food, 3); assert.equal(f.business.seeds.nut, 3);
  assert.equal(f.business.orders.length, 3); assert.equal(f.coins, 50);
  const old = fresh(); old.animals.push({ uid: 'old', type: 'cat' }); old.plots[0] = { crop: 'corn', plantedAt: 10 };
  E.start(old, 1000); assert.equal(old.animals.length, 1); assert.equal(old.animals[0].uid, 'old'); assert.equal(old.plots[0].plantedAt, 10);
});
test('plant, water and harvest form an atomic inventory cycle with no duplicate harvest', () => {
  const day = n => new Date(2026, 10, n, 12).getTime();
  let f = fresh(); E.start(f, day(19)); f.water = 4;
  assert.equal(E.plant(f, 4, 'nut'), true); assert.equal(f.business.seeds.nut, 2);
  assert.equal(E.plant(f, 4, 'nut'), false);
  assert.equal(E.plant(f, -1, 'nut'), false);
  assert.equal(E.plant(f, 6, 'nut'), false);
  assert.equal(E.cropState(f.plots[4], day(21)).stage, 1, 'no growth before watering');
  assert.equal(E.waterPlot(f, 4, day(21)), true);
  assert.equal(E.waterPlot(f, 4, day(21)), false);
  assert.equal(E.cropState(f.plots[4], day(21)).stage, 1);
  assert.equal(E.cropState(f.plots[4], new Date(2026, 10, 22, 0).getTime()).stage, 2);
  f = JSON.parse(JSON.stringify(f));
  assert.equal(E.cropState(f.plots[4], day(28)).stage, 2, 'time away can only grant the previously watered stage');
  for (const [offset, stage] of [[28, 2], [29, 3], [30, 4]]) {
    assert.equal(E.cropState(f.plots[4], day(offset)).stage, stage);
    assert.equal(E.harvest(f, 4, day(offset)), false);
    assert.equal(E.waterPlot(f, 4, day(offset)), true);
    assert.equal(E.harvest(f, 4, day(offset)), false);
  }
  assert.equal(f.water, 0);
  assert.equal(E.cropState(f.plots[4], day(31)).stage, 5);
  assert.equal(E.waterPlot(f, 4, day(31)), false);
  assert.equal(E.harvest(f, 4, day(31)).count, 3); assert.equal(f.fruit.nut, 3);
  assert.equal(E.harvest(f, 4, day(31)), false); assert.equal(f.business.stats.harvested, 1);
});
test('legacy crops retain their original maturity time and yield', () => {
  const f = fresh(); E.start(f, 1000);
  f.plots[0] = { crop: 'corn', plantedAt: 1000 };
  f.plots[1] = { crop: 'bean', plantedAt: 1000, readyAt: 91000, watered: true };
  const legacyMaturity = 1000 + 75 * 60000;
  assert.equal(E.harvest(f, 0, legacyMaturity - 1), false);
  assert.equal(E.harvest(f, 0, legacyMaturity).count, 2);
  assert.equal(E.waterPlot(f, 1, 90000), false);
  assert.equal(E.harvest(f, 1, 90999), false);
  assert.equal(E.harvest(f, 1, 91000).count, 3);
});
test('orders consume the requested stock exactly once, award coins/XP and issue a new id', () => {
  const f = fresh(); E.start(f, 0); const id = f.business.orders[0].id;
  assert.equal(E.deliver(f, id), false); f.fruit.nut = 3;
  const order = E.deliver(f, id);
  assert.equal(order.coins, 8); assert.equal(f.fruit.nut, 1); assert.equal(f.coins, 58); assert.equal(f.business.xp, 8);
  assert.equal(E.deliver(f, id), false); assert.equal(f.business.stats.delivered, 1);
});
test('daily production stays on the ground until picked up, with offline caps and no repeat pickup', () => {
  let f = fresh(); E.start(f, careTime(1));
  f.care['starter-chick'].growth = 5; E.syncProducers(f, careTime(1, 23, 59));
  assert.equal(E.pickUpProduct(f, 'egg', careTime(1, 23, 59)), false);
  E.syncProducers(f, careTime(2, 0));
  assert.equal(E.groundStock(f).egg, 1);
  assert.equal(E.stock(f, 'egg'), 0);
  assert.equal(f.business.xp, 0);
  const saved = JSON.stringify(f);
  f = JSON.parse(saved); E.syncProducers(f, careTime(2));
  assert.equal(JSON.stringify(f), saved);
  assert.equal(E.pickUpProduct(f, 'egg', careTime(2)).count, 1);
  assert.equal(E.pickUpProduct(f, 'egg', careTime(2)), false);
  assert.equal(E.stock(f, 'egg'), 1);
  assert.equal(f.business.xp, 1);
  E.syncProducers(f, careTime(10));
  assert.equal(E.groundStock(f).egg, 3);
  E.sellAnimal(f, 'starter-chick', careTime(10));
  f = JSON.parse(JSON.stringify(f));
  for (let i = 0; i < 3; i++) assert.equal(E.pickUpProduct(f, 'egg', careTime(11)).count, 1, 'individual drops outlive the animal');
  assert.equal(E.pickUpProduct(f, 'egg', careTime(12)), false);
  assert.equal(E.stock(f, 'egg'), 4);
});
test('legacy piles split without loss and a picked unit cannot collect another unit or reuse its identity', () => {
  let f = fresh();
  const b = E.ensure(f);
  b.groundProducts = {
    sold: { item: 'egg', count: 3 }, other: { item: 'egg', count: 2 },
    bee: { item: 'honey', count: 2 }, fish: { item: 'pearl', count: 2 },
    cow: { item: 'milk', count: 2 }, sheep: { item: 'wool', count: 2 },
  };
  const original = E.groundDrops(f);
  assert.equal(original.length, 13);
  assert.equal(new Set(original.map(d => d.id)).size, 13);
  assert.equal(new Set(original.filter(d => d.item === 'egg').map(d => d.slot)).size, 5);
  assert.equal(E.stock(f, 'egg'), 0);
  const target = original.find(d => d.uid === 'other');
  assert.equal(E.pickUpProduct(f, 'honey', careTime(1), target.id), false);
  assert.equal(E.pickUpProduct(f, 'egg', careTime(1), target.id).count, 1);
  assert.equal(E.pickUpProduct(f, 'egg', careTime(1), target.id), false);
  assert.equal(b.xp, 1);
  assert.equal(E.stock(f, 'egg'), 1);
  assert.equal(JSON.stringify(E.groundDrops(f)), JSON.stringify(original.filter(d => d.id !== target.id)), 'other drops keep their ids and slots');
  f = JSON.parse(JSON.stringify(f)); E.syncProducers(f, careTime(1));
  const afterReload = JSON.stringify(E.groundDrops(f));
  E.groundDrops(f);
  assert.equal(JSON.stringify(E.groundDrops(f)), afterReload, 'reading and reloading do not redistribute or duplicate drops');
  const hen = E.addAnimal(f, 'chick', careTime(1)); f.care[hen.uid].growth = 5;
  E.syncProducers(f, careTime(1)); E.syncProducers(f, careTime(2));
  const freshDrop = E.groundDrops(f).find(d => d.uid === hen.uid);
  assert.equal(freshDrop.slot, target.slot, 'new production can use the freed location');
  assert.notEqual(freshDrop.id, target.id, 'a stale tap cannot collect replacement production');
  assert.equal(E.pickUpProduct(f, 'egg', careTime(2), target.id), false);
  for (const drop of E.groundDrops(f)) assert.equal(E.pickUpProduct(f, drop.item, careTime(2), drop.id).count, 1);
  assert.equal(E.groundDrops(f).length, 0);
  assert.equal(E.stock(f, 'egg'), 6);
  for (const item of ['honey','pearl','milk','wool']) assert.equal(E.stock(f, item), 2);
  assert.equal(f.business.xp, 14);
});

test('repeat adoption gives each animal a unique id, stable number and independent care, even in the same millisecond', () => {
  const f = fresh(); E.start(f, 1000);
  const a = E.addAnimal(f, 'chick', 1000), b = E.addAnimal(f, 'chick', 1000);
  assert.equal(f.animals.length, 3);
  assert.equal(new Set(f.animals.map(a => a.uid)).size, 3);
  assert.deepEqual(f.animals.map(a => a.serial), [1, 2, 3]);
  f.care[a.uid].growth = 3; f.care[a.uid].food = 0;
  assert.equal(f.care[b.uid].growth, 0); assert.equal(f.care[b.uid].food, 2);
  f.animals = f.animals.filter(animal => animal.uid !== b.uid); delete f.care[b.uid];
  const restored = JSON.parse(JSON.stringify(f)); E.start(restored, 2000);
  const c = E.addAnimal(restored, 'chick', 3000);
  assert.equal(c.serial, 4); assert.equal(restored.animals.find(animal => animal.uid === a.uid).serial, 2);
});
test('upgrading legacy companions preserves care, stored products and output from the old timer', () => {
  const f = fresh();
  f.animals = [{ uid: 'legacy', type: 'hen' }, { uid: 'young', type: 'chick' }];
  f.care.legacy = { food: 1, water: 2, growth: 5, ts: 12 };
  f.care.young = { food: 2, water: 1, growth: 2, ts: 13 };
  const business = E.ensure(f);
  business.products.egg = 2;
  business.upgrades.coop = 1;
  business.production.legacy = { readyAt: careTime(1) - 300000 };
  const care = JSON.stringify(f.care);
  E.start(f, careTime(1)); E.start(f, careTime(1, 16));
  assert.deepEqual(f.animals.map(a => a.serial), [1, 2]);
  assert.equal(JSON.stringify(f.care), care);
  assert.equal(E.groundStock(f).egg, 3, 'legacy elapsed intervals convert once using the old upgraded speed');
  assert.equal(E.stock(f, 'egg'), 2);
  E.syncProducers(f, careTime(7));
  assert.equal(E.groundStock(f).egg, 5, 'the upgraded ground limit is still five per animal');
});

test('each species has six current residents; rejected adoptions never change the farm', () => {
  const f = fresh();
  for (const type of ['chick', 'bee', 'cat', 'dog', 'fish']) {
    for (let i = 0; i < 6; i++) assert.ok(E.addAnimal(f, type, 1000));
    assert.equal(E.animalCapacity(f, type).remaining, 0);
    const saved = JSON.stringify(f);
    assert.equal(E.addAnimal(f, type, 1000), null);
    assert.equal(JSON.stringify(f), saved, 'no charge, care reset or serial advancement');
  }
  assert.equal(f.animals.length, 30, 'species have independent limits');
});

test('sold animals and their historical serial numbers do not consume current capacity', () => {
  const f = fresh();
  for (let i = 0; i < 6; i++) E.addAnimal(f, 'bee', 1000);
  const sold = f.animals.shift(); delete f.care[sold.uid];
  // Leftover production/history records also must not count as residents.
  E.ensure(f).production[sold.uid] = { readyAt: 1000 };
  const restored = JSON.parse(JSON.stringify(f));
  assert.equal(E.animalCapacity(restored, 'bee').remaining, 1);
  const replacement = E.addAnimal(restored, 'bee', 2000);
  assert.equal(replacement.serial, 7);
  assert.equal(E.animalCapacity(restored, 'bee').count, 6);
  assert.equal(E.addAnimal(restored, 'bee', 3000), null);
});

test('chicks and hens share capacity; existing farms above the limit retain every animal', () => {
  const f = fresh();
  for (let i = 0; i < 3; i++) { E.addAnimal(f, 'chick', 1000); E.addAnimal(f, 'hen', 1000); }
  assert.equal(E.animalCapacity(f, 'chick').count, 6);
  assert.equal(E.addAnimal(f, 'hen', 1000), null);
  f.animals.push({ uid: 'legacy-extra', type: 'hen', serial: 9 });
  f.care['legacy-extra'] = { food: 1, water: 2, growth: 5, ts: 12 };
  E.ensure(f).production['legacy-extra'] = { readyAt: 555 };
  E.start(f, 1000);
  assert.equal(f.animals.length, 7);
  assert.equal(f.care['legacy-extra'].growth, 5);
  assert.equal(E.production(f, 'legacy-extra').count, 1);
  assert.equal(E.animalCapacity(f, 'chick').remaining, 0);
  assert.equal(E.addAnimal(f, 'chick', 1000), null);
});
test('same-species companions mature and produce independently across reload and collection', () => {
  const f = fresh(); E.start(f, careTime(1));
  const a = E.addAnimal(f, 'bee', careTime(1)), b = E.addAnimal(f, 'bee', careTime(1));
  f.care[a.uid].growth = 5; E.syncProducers(f, careTime(1));
  assert.equal(E.production(f, b.uid), null);
  f.care[b.uid].growth = 5; E.syncProducers(f, careTime(2));
  const restored = JSON.parse(JSON.stringify(f)); E.start(restored, careTime(2));
  assert.equal(E.production(restored, a.uid).count, 1);
  assert.equal(E.production(restored, b.uid).count, 0);
  assert.equal(E.pickUpProduct(restored, 'honey', careTime(2)).count, 1);
  assert.equal(E.pickUpProduct(restored, 'honey', careTime(2)), false);
  assert.equal(E.pickUpProduct(restored, 'honey', careTime(3)).count, 1);
  assert.equal(E.groundStock(restored).honey, 1);
  assert.equal(E.pickUpProduct(restored, 'honey', careTime(3)).count, 1);
  assert.equal(E.stock(restored, 'honey'), 3);
});
test('expansion enforces level, price and maximum, and preserves planted beds', () => {
  const f = fresh(); E.start(f, 0); E.plant(f, 0, 'nut', 0);
  assert.equal(E.upgrade(f, 'beds'), false); f.business.xp = 25; f.coins = 24;
  assert.equal(E.upgrade(f, 'beds'), false); f.coins = 100;
  assert.equal(E.upgrade(f, 'beds'), true); assert.equal(f.plots.length, 9); assert.equal(f.plots[0].crop, 'nut');
  assert.equal(f.coins, 75); assert.equal(E.upgrade(f, 'beds'), false);
  f.business.xp = 50; assert.equal(E.upgrade(f, 'beds'), true); assert.equal(f.plots.length, 12);
  assert.equal(E.upgrade(f, 'beds'), false); assert.equal(E.upgrade(f, 'unknown'), false);
});
test('irrigation saves water on existing and new plots without accelerating stages', () => {
  const today = new Date(2026, 10, 21, 12).getTime(), tomorrow = new Date(2026, 10, 22, 12).getTime();
  const f = fresh(); E.start(f, today); E.plant(f, 0, 'nut'); f.business.xp = 50; f.water = 0;
  const unwatered = JSON.stringify(f.plots[0]);
  assert.equal(E.waterPlot(f, 0, today), false);
  assert.equal(JSON.stringify(f.plots[0]), unwatered);
  assert.equal(E.upgrade(f, 'irrigation'), true); E.plant(f, 1, 'bean');
  for (const index of [0, 1]) {
    assert.equal(E.waterPlot(f, index, today), true);
    assert.equal(E.waterPlot(f, index, today), false);
    assert.equal(E.cropState(f.plots[index], today).stage, 1);
    assert.equal(E.cropState(f.plots[index], tomorrow).stage, 2);
  }
  assert.equal(f.water, 0);
});
test('mission rewards are ordered and can only be claimed once', () => {
  const f = fresh(); E.start(f, 0); assert.equal(E.claim(f, 'plant'), false);
  E.plant(f, 0, 'nut', 0); assert.equal(E.claim(f, 'plant'), true); assert.equal(f.coins, 55);
  assert.equal(E.claim(f, 'plant'), false); assert.equal(E.mission(f).id, 'care');
});
test('serialized state preserves seeds, construction, orders and production across reloads', () => {
  const f = fresh(); E.start(f, 0); f.business.xp = 25; E.upgrade(f, 'beds');
  f.care['starter-chick'].growth = 5; E.syncProducers(f, 1000);
  const saved = JSON.stringify(f), restored = JSON.parse(saved); E.start(restored, 2000);
  assert.equal(JSON.stringify(restored), saved);
});

test('petting builds capped affection without growth, currency or input costs', () => {
  const f = fresh(); E.start(f, 0); const a = E.addAnimal(f, 'cat', 0);
  const coins = f.coins, hearts = f.hearts, food = f.food, water = f.water, xp = f.business.xp;
  for (let i = 0; i < 20; i++) E.careAnimal(f, a.uid, 'pet', 1);
  assert.equal(f.care[a.uid].affection, 5); assert.equal(f.care[a.uid].growth, 0);
  assert.equal(f.care[a.uid].growCostThirds, 0);
  assert.deepEqual([f.coins, f.hearts, f.food, f.water, f.business.xp], [coins, hearts, food, water, xp]);
  assert.equal(E.sellAnimal(f, a.uid), null, 'affection cannot make a baby sellable');
});

test('adult prices are fixed by species and animal products pay the posted unit prices once', () => {
  const f = fresh();
  E.start(f, 0);
  f.care['starter-chick'].growth = E.GROW_MAX;
  assert.equal(E.animalQuote(f, 'starter-chick').price, 20, 'the starter gift has the regular species price');
  f.animals.push({ uid: 'legacy-hen', type: 'hen' });
  assert.equal(E.animalQuote(f, 'legacy-hen').price, 20, 'old hens have the same fixed price');
  for (const [type, price] of [['chick', 20], ['bee', 26], ['cat', 34], ['dog', 34], ['fish', 26], ['cow', 45], ['sheep', 41]]) {
    const a = E.addAnimal(f, type, 0);
    const care = f.care[a.uid];
    assert.equal(E.sellAnimal(f, a.uid), null);
    care.growth = E.GROW_MAX;
    assert.equal(E.animalQuote(f, a.uid).price, price);
    care.growCostThirds = 48;
    care.purchasePrice += 10;
    care.affection = E.AFFECTION_MAX;
    const coins = f.coins, quote = E.animalQuote(f, a.uid);
    assert.equal(quote.growCost, 16);
    assert.equal(quote.price, price);
    assert.equal(E.sellAnimal(f, a.uid).price, price);
    assert.equal(E.sellAnimal(f, a.uid), null);
    assert.equal(f.coins, coins + price);
  }
  for (const [key, price] of [['egg', 3], ['honey', 5], ['pearl', 6], ['milk', 8], ['wool', 8]]) {
    const coins = f.coins;
    f.business.products[key] = 2;
    assert.equal(E.sell(f, key), 2);
    assert.equal(E.sell(f, key), false);
    assert.equal(E.stock(f, key), 0);
    assert.equal(f.coins, coins + 2 * price);
  }
});

test('cow and sheep mature in five care days and produce one item every three adult care days', () => {
  const date = day => new Date(2026, 10, day, 12).getTime();
  let f = fresh();
  E.start(f, date(1)); f.food = f.water = 50;
  const cow = E.addAnimal(f, 'cow', date(1)), sheep = E.addAnimal(f, 'sheep', date(1));
  const care = (animal, day) => {
    assert.ok(E.careAnimal(f, animal.uid, 'food', date(day)));
    assert.equal(E.careAnimal(f, animal.uid, 'food', date(day)), null);
    assert.ok(E.careAnimal(f, animal.uid, 'water', date(day)));
  };
  for (const animal of [cow, sheep]) {
    assert.equal(E.growthDays(animal.type), 5);
    assert.ok(E.careAnimal(f, animal.uid, 'water', date(1)));
    assert.equal(f.care[animal.uid].growth, 0);
    for (const [i, day] of [2, 4, 5, 7, 8].entries()) {
      care(animal, day);
      assert.equal(f.care[animal.uid].growth, i + 1);
      assert.equal(E.adult(f, animal), i === 4);
    }
    assert.equal(E.production(f, animal.uid, date(8)).careDays, 0);
    assert.equal(E.production(f, animal.uid, date(29)).count, 0);
    assert.ok(E.careAnimal(f, animal.uid, 'food', date(10)));
    assert.equal(E.production(f, animal.uid, date(10)).careDays, 0);
    care(animal, 11);
    care(animal, 14);
    assert.equal(E.prepareLivestockProduct(f, animal.uid), false);
    f = JSON.parse(JSON.stringify(f));
    assert.equal(E.production(f, animal.uid, date(15)).careDays, 2);
    care(animal, 15);
    care(animal, 16);
    assert.equal(E.production(f, animal.uid, date(16)).count, 1);
    const result = E.prepareLivestockProduct(f, animal.uid);
    assert.equal(result.item, animal.type === 'cow' ? 'milk' : 'wool');
    assert.equal(result.count, 1);
    assert.equal(E.stock(f, result.item), 0);
    assert.equal(E.groundStock(f)[result.item], 1);
    assert.equal(E.prepareLivestockProduct(f, animal.uid), false);
    assert.equal(E.pickUpProduct(f, result.item, date(16)).count, 1);
    assert.equal(E.stock(f, result.item), 1);
    assert.equal(E.careAnimal(f, animal.uid, 'water', date(16)), null);
    assert.equal(E.production(f, animal.uid, date(17)).careDays, 0);
    care(animal, 17);
    assert.equal(E.production(f, animal.uid, date(17)).careDays, 1);
  }
});
test('three complete care days grow the original species with either feeding order and exactly 100% net profit', () => {
  for (const type of Object.keys(E.ANIMAL_PRICES).filter(type => E.growthDays(type) === E.GROW_DAYS)) for (let mix = 0; mix < 8; mix++) {
    const f = fresh(); E.start(f, 0); f.food = f.water = 20;
    const a = E.addAnimal(f, type, 0);
    for (let i = 0; i < 3; i++) {
      // Care days need not be consecutive. Missing days neither grow nor shrink the animal.
      const now = careTime([1, 4, 9][i]), order = mix & (1 << i) ? ['food', 'water'] : ['water', 'food'];
      const before = f.care[a.uid].growth;
      assert.equal(E.careAnimal(f, a.uid, order[0], now).grew, false);
      assert.equal(f.care[a.uid].growth, before);
      const result = E.careAnimal(f, a.uid, order[1], now);
      assert.equal(result.grew, true); assert.equal(result.grewUp, i === 2);
      assert.equal(f.care[a.uid].growth, E.GROW_MAX * (i + 1) / E.GROW_DAYS);
      const saved = JSON.stringify(f);
      for (const kind of order) assert.equal(E.careAnimal(f, a.uid, kind, now), null);
      assert.equal(JSON.stringify(f), saved, 'repeat care changes neither stock, rewards, cost nor growth');
    }
    const q = E.animalQuote(f, a.uid);
    assert.equal(q.growCostThirds, 15); assert.equal(q.estimated, false);
    assert.equal(q.totalCost, E.ANIMAL_PRICES[type] + 5);
    assert.equal(q.profitRate, 1); assert.equal(f.food, 17); assert.equal(f.water, 17);
    for (const kind of ['food', 'water']) {
      assert.equal(E.careAnimal(f, a.uid, kind, careTime(10)).grew, false);
      assert.equal(E.careAnimal(f, a.uid, kind, careTime(10)), null, 'adults also have daily limits');
    }
    assert.equal(E.animalQuote(f, a.uid).price, q.price, 'adult upkeep cannot inflate resale price');
    const restored = JSON.parse(JSON.stringify(f)), coins = restored.coins;
    assert.equal(E.sellAnimal(restored, a.uid).price, q.price);
    assert.equal(restored.coins, coins + q.price); assert.equal(E.sellAnimal(restored, a.uid), null);
    assert.equal(restored.care[a.uid], undefined); assert.equal(restored.business.production[a.uid], undefined);
  }
});

test('daily allowances persist through reload, roll over at local midnight and belong to each animal', () => {
  let f = fresh(); E.start(f, 0);
  const a = E.addAnimal(f, 'cat', 0), b = E.addAnimal(f, 'cat', 1);
  const evening = careTime(9, 23, 59), morning = careTime(10, 0, 0);
  assert.equal(E.careDay(evening), '2026-11-09'); assert.equal(E.careDay(morning), '2026-11-10');
  E.careAnimal(f, a.uid, 'food', evening);
  f = JSON.parse(JSON.stringify(f)); E.start(f, evening);
  assert.equal(E.careAnimal(f, a.uid, 'food', evening), null);
  assert.equal(E.dailyCare(f, b.uid, evening).food, false);
  assert.ok(E.careAnimal(f, b.uid, 'food', evening), 'same-species companions have separate allowances');
  const saved = JSON.stringify(f);
  assert.equal(E.dailyCare(f, a.uid, morning).food, false);
  assert.equal(JSON.stringify(f), saved, 'checking the next day does not write saves or grant growth');
  assert.equal(E.careAnimal(f, a.uid, 'water', morning).grew, false, 'yesterday’s food cannot pair with today’s water');
  assert.equal(f.care[a.uid].growth, 0);
  assert.equal(E.careAnimal(f, a.uid, 'food', morning).grew, true);
  assert.equal(f.care[a.uid].growth, E.GROW_MAX / E.GROW_DAYS);
  assert.equal(f.care[a.uid].growCostThirds, 8, 'incomplete-day supplies still count toward real rearing costs');
});

test('missing supplies do not consume daily allowance and legacy progress is preserved', () => {
  const f = fresh(); E.start(f, 0); const a = E.addAnimal(f, 'dog', 0), now = careTime(9);
  f.care[a.uid].growth = 4; f.care[a.uid].affection = 3;
  f.care[a.uid].food = f.care[a.uid].water = 3; // Old fullness does not block the new daily care.
  f.water = 0; E.careAnimal(f, a.uid, 'food', now);
  const saved = JSON.stringify(f);
  assert.equal(E.careAnimal(f, a.uid, 'water', now), null); assert.equal(JSON.stringify(f), saved);
  assert.equal(f.care[a.uid].growth, 4); assert.equal(E.dailyCare(f, a.uid, now).water, false);
  f.water = 1; assert.equal(E.careAnimal(f, a.uid, 'water', now).grewUp, true);
  assert.equal(f.care[a.uid].affection, 3); assert.equal(f.care[a.uid].growth, E.GROW_MAX);
});

test('rejected care costs nothing and legacy investments remain explicitly estimated', () => {
  const f = fresh(); E.start(f, 0); const a = E.addAnimal(f, 'dog', 0);
  f.food = 0; const saved = JSON.stringify(f);
  assert.equal(E.careAnimal(f, a.uid, 'food'), null); assert.equal(JSON.stringify(f), saved);
  delete f.care[a.uid].purchasePrice; delete f.care[a.uid].growCostThirds; f.care[a.uid].growth = 4;
  const q = E.animalQuote(f, a.uid); assert.equal(q.estimated, true);
  f.food = 1; E.careAnimal(f, a.uid, 'food');
  assert.equal(E.animalQuote(f, a.uid).growCostThirds, q.growCostThirds + 3);
  assert.equal(E.animalQuote(f, a.uid).estimated, true);
});
