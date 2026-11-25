/* Farm rules are independent of the DOM. All transactions validate current inventory. */
const FarmEconomy = (() => {
  const MINUTE = 60000;
  const DAY = 24 * 60 * MINUTE;
  const ANIMAL_LIMITS = Object.freeze({ chick: 6, bee: 6, cat: 6, dog: 6, fish: 6, cow: 6, sheep: 6 });
  const ANIMAL_PRICES = Object.freeze({ chick: 5, bee: 8, cat: 12, dog: 12, fish: 8, cow: 14, sheep: 12 });
  const ADULT_SALE_PRICES = Object.freeze({ chick: 20, bee: 26, cat: 34, dog: 34, fish: 26, cow: 45, sheep: 41 });
  const SUPPLIES = Object.freeze({ food: { price: 3, amount: 3 }, water: { price: 2, amount: 3 } });
  // Retain the saved 0..5 growth scale so existing adults and partial progress survive.
  const GROW_MAX = 5, GROW_DAYS = 3, AFFECTION_MAX = 5;
  const CROP_STAGES = ['种子', '发芽', '长叶', '开花', '成熟'];
  function careDay(now = Date.now()) {
    const d = new Date(now);
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  }
  function dailyCare(f, uid, now = Date.now()) {
    const day = careDay(now), saved = f.care[uid]?.dailyCare;
    return saved?.day === day ? { ...saved } : { day, food: false, water: false, grew: false };
  }
  const species = type => type === 'hen' ? 'chick' : type;
  function animalCapacity(f, type) {
    const key = species(type), limit = ANIMAL_LIMITS[key] || 0;
    const count = f.animals.filter(a => species(a.type) === key).length;
    return { count, limit, remaining: Math.max(0, limit - count), full: count >= limit };
  }
  const ITEMS = {
    nut: { name: '坚果', word: 'nut', icon: '🌰', price: 2, seed: 2 },
    bean: { name: '豆子', word: 'bean', icon: '🫘', price: 3, seed: 4 },
    corn: { name: '玉米', word: 'corn', icon: '🌽', price: 5, seed: 6 },
    egg: { name: '鸡蛋', word: 'egg', icon: '🥚', price: 3 },
    honey: { name: '蜂蜜', word: 'honey', icon: '🍯', price: 5 },
    pearl: { name: '珍珠', word: 'pearl', icon: '⚪', price: 6 },
    milk: { name: '牛奶', word: 'milk', icon: '🥛', price: 8 },
    wool: { name: '羊毛', word: 'wool', icon: '🧶', price: 8 },
  };
  const PRODUCERS = {
    chick: { item: 'egg', legacyMinutes: 3 }, hen: { item: 'egg', legacyMinutes: 3 },
    bee: { item: 'honey', legacyMinutes: 5 }, fish: { item: 'pearl', legacyMinutes: 6 },
    cow: { item: 'milk', days: 3, growDays: 5, action: 'milk', label: '挤牛奶' },
    sheep: { item: 'wool', days: 3, growDays: 5, action: 'shear', label: '剪羊毛' },
  };
  const growthDays = type => PRODUCERS[type]?.growDays || GROW_DAYS;
  const RECIPES = [
    { name: '松鼠的早餐', avatar: '🐿️', wants: { nut: 2 }, coins: 8, xp: 8 },
    { name: '兔子的野餐', avatar: '🐰', wants: { bean: 2 }, coins: 11, xp: 10 },
    { name: '小熊的玉米汤', avatar: '🐻', wants: { corn: 2 }, coins: 16, xp: 12 },
    { name: '狐狸的早餐篮', avatar: '🦊', wants: { egg: 2 }, coins: 12, xp: 10 },
    { name: '森林下午茶', avatar: '🐻', wants: { honey: 1, nut: 2 }, coins: 16, xp: 14 },
    { name: '小兔的礼物', avatar: '🐰', wants: { pearl: 1, corn: 1 }, coins: 18, xp: 16 },
  ];
  const MISSIONS = [
    { id: 'plant', title: '种下第一颗种子', hint: '开张礼包里有种子，点菜园里的空地试试。', goal: 1, reward: 5, xp: 4, stat: 'planted', action: 'field' },
    { id: 'care', title: '照顾小伙伴 3 次', hint: '喂食、喂水、摸摸头，都算一次陪伴。', goal: 3, reward: 5, xp: 4, stat: 'cared', action: 'yard' },
    { id: 'harvest', title: '收获一块农田', hint: '成熟作物会亮起来，点一下就能收进仓库。', goal: 1, reward: 5, xp: 4, stat: 'harvested', action: 'field' },
    { id: 'order', title: '完成第一张邻居订单', hint: '把收获交给邻居，拿到更多金币和经验。', goal: 1, reward: 8, xp: 5, stat: 'delivered', action: 'orders' },
    { id: 'expand', title: '把菜园扩大一点', hint: '到建设小屋解锁 3 块新农田。', goal: 1, reward: 8, xp: 6, stat: 'expanded', action: 'build' },
  ];
  function ensure(f) {
    if (!f.business) f.business = { version: 1, started: false, xp: 0, seeds: {}, products: {}, production: {}, upgrades: { beds: 0, coop: 0, irrigation: 0 }, stats: {}, claimed: [], orders: [], nextOrder: 0 };
    return f.business;
  }
  function level(f) { return 1 + Math.floor(ensure(f).xp / 25); }
  // Stable display numbers distinguish companions without changing their saved uid or care.
  function identifyAnimals(f) {
    const serials = ensure(f).animalSerials ||= {};
    f.animals.forEach(a => {
      if (Number.isInteger(a.serial) && a.serial > 0) serials[species(a.type)] = Math.max(serials[species(a.type)] || 0, a.serial);
    });
    f.animals.forEach(a => {
      if (!Number.isInteger(a.serial) || a.serial < 1) {
        const key = species(a.type);
        a.serial = serials[key] = (serials[key] || 0) + 1;
      }
    });
  }
  function addAnimal(f, type, now = Date.now()) {
    if (animalCapacity(f, type).full) return null;
    identifyAnimals(f);
    const base = type + '-' + now.toString(36);
    const b = ensure(f);
    let uid = base, suffix = 0;
    while (f.animals.some(a => a.uid === uid) || f.care[uid] || b.production[uid] || b.groundProducts?.[uid]) uid = base + '-' + (++suffix);
    const animal = { uid, type };
    f.animals.push(animal);
    f.care[uid] = { food: 2, water: 2, growth: 0, affection: 0, purchasePrice: ANIMAL_PRICES[species(type)], growCostThirds: 0, ts: now };
    identifyAnimals(f);
    return animal;
  }
  function nextOrder(f) {
    const b = ensure(f), id = ++b.nextOrder;
    const pool = level(f) >= 2 ? RECIPES : RECIPES.slice(0, 3);
    const recipe = pool[(id - 1) % pool.length];
    return { ...recipe, wants: { ...recipe.wants }, id };
  }
  function start(f, now = Date.now()) {
    const b = ensure(f);
    if (!b.started) {
      b.started = true;
      b.seeds.nut = (b.seeds.nut || 0) + 3; b.seeds.bean = (b.seeds.bean || 0) + 1;
      f.food += 3; f.water += 3;
      if (!f.animals.length) {
        const uid = 'starter-chick';
        f.animals.push({ uid, type: 'chick' }); f.care[uid] = { food: 2, water: 2, growth: 0, affection: 0, purchasePrice: 0, growCostThirds: 0, ts: now };
      }
    }
    while (b.orders.length < 3) b.orders.push(nextOrder(f));
    identifyAnimals(f);
    syncProducers(f, now);
  }
  // Number the local calendar days in UTC so short or long daylight-saving days count once.
  const productionDay = now => Date.parse(careDay(now) + 'T00:00:00Z') / DAY;
  function producerNeedsSync(f, a, clock, day) {
    const producer = PRODUCERS[a.type];
    return producer && adult(f, a) && (!clock || (!producer.days && !(clock.lastDropDay >= day)));
  }
  function needsProductionSync(f, now = Date.now()) {
    const day = productionDay(now), clocks = ensure(f).production;
    return f.animals.some(a => producerNeedsSync(f, a, clocks[a.uid], day));
  }
  function addGroundProduct(b, uid, item, count) {
    const drops = b.groundProducts ||= {};
    const drop = drops[uid] ||= { item, count: 0 };
    drop.count += count;
  }
  function syncProducers(f, now = Date.now()) {
    const b = ensure(f);
    const day = productionDay(now), cap = b.upgrades.coop ? 5 : 3;
    for (const a of f.animals) {
      const clock = b.production[a.uid];
      if (!producerNeedsSync(f, a, clock, day)) continue;
      const producer = PRODUCERS[a.type];
      if (producer.days) {
        b.production[a.uid] = { careDays: 0 };
        continue;
      }
      let elapsed = 0;
      if (Number.isInteger(clock?.lastDropDay)) elapsed = day - clock.lastDropDay;
      else if (Number.isFinite(clock?.readyAt) && now >= clock.readyAt) {
        const oldInterval = producer.legacyMinutes * MINUTE * (b.upgrades.coop ? .8 : 1);
        elapsed = 1 + Math.floor((now - clock.readyAt) / oldInterval);
      }
      const space = cap - (b.groundProducts?.[a.uid]?.count || 0);
      const count = Math.min(space, elapsed);
      if (count > 0) addGroundProduct(b, a.uid, producer.item, count);
      b.production[a.uid] = { lastDropDay: day };
    }
  }
  function production(f, uid) {
    const a = f.animals.find(a => a.uid === uid), b = ensure(f), clock = b.production[uid];
    const producer = PRODUCERS[a?.type];
    if (!producer || !clock || !adult(f, a)) return null;
    if (producer.days) {
      return { item: producer.item, count: Number(clock.careDays >= producer.days), careDays: clock.careDays,
        days: producer.days, action: producer.action, label: producer.label, cap: 1 };
    }
    return { item: producer.item, count: b.groundProducts?.[uid]?.count || 0 };
  }
  function prepareLivestockProduct(f, uid) {
    const p = production(f, uid);
    if (!p?.action || !p.count) return false;
    const b = ensure(f);
    addGroundProduct(b, uid, p.item, p.count);
    b.production[uid].careDays = 0;
    return p;
  }
  function groundStock(f) {
    const counts = {};
    for (const { item, count } of Object.values(ensure(f).groundProducts || {})) counts[item] = (counts[item] || 0) + count;
    return counts;
  }
  function pickUpProduct(f, item, now = Date.now()) {
    syncProducers(f, now);
    const b = ensure(f), drops = b.groundProducts || {};
    let count = 0;
    for (const [uid, drop] of Object.entries(drops)) {
      if (drop.item !== item) continue;
      count += drop.count;
      delete drops[uid];
    }
    if (!count) return false;
    b.products[item] = (b.products[item] || 0) + count;
    b.xp += count;
    return { item, count };
  }
  function stock(f, key) { const b = ensure(f); return ITEMS[key]?.seed ? (f.fruit[key] || 0) : (b.products[key] || 0); }
  function consume(f, key, count) { if (ITEMS[key].seed) f.fruit[key] -= count; else ensure(f).products[key] -= count; }
  function ready(f, order) { return Object.entries(order.wants).every(([key, count]) => stock(f, key) >= count); }
  function deliver(f, id) {
    const b = ensure(f), index = b.orders.findIndex(o => o.id === id), order = b.orders[index];
    if (!order || !ready(f, order)) return false;
    Object.entries(order.wants).forEach(([key, count]) => consume(f, key, count));
    f.coins += order.coins; b.xp += order.xp; b.stats.delivered = (b.stats.delivered || 0) + 1;
    b.orders[index] = nextOrder(f); return order;
  }
  function plant(f, index, crop) {
    const b = ensure(f);
    if (!Number.isInteger(index) || index < 0 || index >= f.plots.length || f.plots[index] || !ITEMS[crop]?.seed || !(b.seeds[crop] > 0)) return false;
    b.seeds[crop]--; f.plots[index] = { crop, stage: 1, lastWaterDay: null };
    b.stats.planted = (b.stats.planted || 0) + 1; b.xp++; return true;
  }
  function legacyReadyAt(p) { return p.readyAt ?? (p.plantedAt + 75 * MINUTE); }
  function cropState(p, now = Date.now()) {
    if (!p || !ITEMS[p.crop]?.seed) return null;
    const lastStage = CROP_STAGES.length;
    // Existing timestamp-based plots finish on their original schedule.
    if (p.stage === undefined) {
      const ready = legacyReadyAt(p), mature = now >= ready;
      const progress = Math.max(0, (now - p.plantedAt) / (ready - p.plantedAt));
      const stage = mature ? lastStage : Math.min(lastStage - 1, 1 + Math.floor(progress * (lastStage - 1)));
      return { stage, mature, watered: !!p.watered, yieldCount: p.watered ? 3 : 2, legacy: true };
    }
    const day = careDay(now);
    const watered = !!p.lastWaterDay && day <= p.lastWaterDay;
    // A single watering is worth one stage after midnight, even after several days away.
    const stage = Math.min(lastStage, p.stage + (p.lastWaterDay && !watered ? 1 : 0));
    return { stage, mature: stage === lastStage, watered, yieldCount: 3, legacy: false };
  }
  function cropWaterCost(f) { return ensure(f).upgrades.irrigation ? 0 : 1; }
  function waterPlot(f, index, now = Date.now()) {
    const p = f.plots[index], state = cropState(p, now);
    if (!state || state.mature || state.watered) return false;
    const cost = cropWaterCost(f);
    if (f.water < cost) return false;
    f.water -= cost;
    if (state.legacy) {
      const ready = legacyReadyAt(p);
      p.watered = true;
      p.readyAt = Math.max(now, ready - (ready - p.plantedAt) * .25);
    } else {
      p.stage = state.stage;
      p.lastWaterDay = careDay(now);
    }
    return true;
  }
  function harvest(f, index, now = Date.now()) {
    const p = f.plots[index], state = cropState(p, now);
    if (!state?.mature) return false;
    const count = state.yieldCount, b = ensure(f);
    f.fruit[p.crop] = (f.fruit[p.crop] || 0) + count; f.plots[index] = null;
    b.xp += 3; b.stats.harvested = (b.stats.harvested || 0) + 1; return { crop: p.crop, count };
  }
  function upgradeInfo(f, kind) {
    const b = ensure(f);
    if (kind === 'beds') return { title: '扩建菜园', icon: '🌱', description: '增加 3 块农田，种更多作物', price: b.upgrades.beds ? 45 : 25, level: b.upgrades.beds + 2, maxed: b.upgrades.beds >= 2 };
    if (kind === 'coop') return { title: '舒适动物小屋', icon: '🏡', description: '每只动物最多可在农场留 5 份鸡蛋、蜂蜜或珍珠', price: 30, level: 2, maxed: b.upgrades.coop >= 1 };
    if (kind === 'irrigation') return { title: '菜园灌溉站', icon: '💧', description: '给作物浇水时不消耗库存里的水', price: 35, level: 3, maxed: b.upgrades.irrigation >= 1 };
    return null;
  }
  function upgrade(f, kind) {
    const info = upgradeInfo(f, kind), b = ensure(f);
    if (!info || info.maxed || f.coins < info.price || level(f) < info.level) return false;
    f.coins -= info.price; b.upgrades[kind]++;
    if (kind === 'beds') { f.plots.push(null, null, null); b.stats.expanded = (b.stats.expanded || 0) + 1; }
    b.xp += 5; return true;
  }
  function mission(f) { const b = ensure(f); return MISSIONS.find(m => !b.claimed.includes(m.id)) || null; }
  function claim(f, id) {
    const m = mission(f), b = ensure(f);
    if (!m || m.id !== id || (b.stats[m.stat] || 0) < m.goal) return false;
    b.claimed.push(id); f.coins += m.reward; b.xp += m.xp; return true;
  }
  function sell(f, key) {
    if (!ITEMS[key]) return false;
    const count = stock(f, key); if (!(count > 0)) return false;
    consume(f, key, count); f.coins += count * ITEMS[key].price; return count;
  }
  function adult(f, animal) { return animal.type === 'hen' || (f.care[animal.uid]?.growth ?? GROW_MAX) >= GROW_MAX; }
  function animalQuote(f, uid) {
    const a = f.animals.find(a => a.uid === uid); if (!a) return null;
    const c = f.care[uid] || {};
    const knownPurchase = Number.isFinite(c.purchasePrice) && c.purchasePrice >= 0;
    const knownCare = Number.isInteger(c.growCostThirds) && c.growCostThirds >= 0;
    const purchasePrice = knownPurchase ? c.purchasePrice : ANIMAL_PRICES[species(a.type)] || 0;
    // Older saves have no feeding ledger. Estimate their past growth once at the mean unit cost.
    const growCostThirds = knownCare ? c.growCostThirds : Math.round(Math.min(GROW_MAX, Math.max(0, c.growth ?? GROW_MAX)) * 2.5);
    const growCost = growCostThirds / 3, totalCost = purchasePrice + growCost;
    const price = ADULT_SALE_PRICES[species(a.type)] || 0;
    const profit = price - totalCost;
    return { purchasePrice, growCostThirds, growCost, totalCost, price, profit, profitRate: totalCost ? profit / totalCost : 0,
      estimated: !knownPurchase || !knownCare || !!c.costEstimated, sellable: price > 0 && adult(f, a) };
  }
  function careAnimal(f, uid, kind, now = Date.now()) {
    const a = f.animals.find(a => a.uid === uid);
    if (!a || !['pet', 'food', 'water'].includes(kind)) return null;
    const c = f.care[uid] || { food: 3, water: 3, growth: GROW_MAX, ts: now };
    const today = dailyCare(f, uid, now);
    if (kind !== 'pet' && (today[kind] || !(f[kind] > 0))) return null;
    const wasAdult = adult(f, a), b = ensure(f), producer = PRODUCERS[a.type];
    let grew = false;
    f.care[uid] = c;
    if (kind === 'pet') c.affection = Math.min(AFFECTION_MAX, Math.max(0, c.affection || 0) + 1);
    else {
      if (!wasAdult) {
        const quote = animalQuote(f, uid);
        c.purchasePrice = quote.purchasePrice;
        c.growCostThirds = quote.growCostThirds + 3 * SUPPLIES[kind].price / SUPPLIES[kind].amount;
        c.costEstimated = quote.estimated;
      }
      f[kind]--; c[kind] = 3; f.hearts++; b.xp++;
      today[kind] = true;
      if (today.food && today.water) {
        if (!wasAdult && !today.grew) {
          const days = growthDays(a.type);
          c.growth = Math.min(GROW_MAX, (Math.round(Math.max(0, c.growth) * days) + GROW_MAX) / days);
          today.grew = grew = true;
        } else if (wasAdult && producer?.days) {
          const clock = b.production[uid] ||= { careDays: 0 };
          if (!clock.lastCareDay || today.day > clock.lastCareDay) {
            clock.careDays = Math.min(producer.days, clock.careDays + 1);
            clock.lastCareDay = today.day;
          }
        }
      }
      c.dailyCare = today;
    }
    b.stats.cared = (b.stats.cared || 0) + 1;
    syncProducers(f, now);
    return { grew, grewUp: !wasAdult && adult(f, a), bonded: (c.affection || 0) >= AFFECTION_MAX };
  }
  function sellAnimal(f, uid, now = Date.now()) {
    const quote = animalQuote(f, uid); if (!quote?.sellable) return null;
    syncProducers(f, now);
    f.coins += quote.price; f.animals = f.animals.filter(a => a.uid !== uid);
    delete f.care[uid]; delete ensure(f).production[uid];
    return quote;
  }
  return { ITEMS, PRODUCERS, MISSIONS, ANIMAL_LIMITS, ANIMAL_PRICES, SUPPLIES, GROW_MAX, GROW_DAYS, AFFECTION_MAX, CROP_STAGES, careDay, dailyCare, growthDays, animalCapacity, adult, animalQuote, careAnimal, sellAnimal, ensure, start, level, identifyAnimals, addAnimal, needsProductionSync, syncProducers, production, prepareLivestockProduct, groundStock, pickUpProduct, stock, ready, deliver, plant, cropState, cropWaterCost, waterPlot, harvest, upgradeInfo, upgrade, mission, claim, sell };
})();
