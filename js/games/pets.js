/* Storybook farm. Existing saved animals, crops, currency and mastery rules are retained. */
const Pets = (() => {
  const SHOP = [
    { id: 'seed-nut',  emoji: '🌰', word: 'NUT',  kind: 'seed', crop: 'nut',  price: 2,  name: 'Nut Seed 坚果种子' },
    { id: 'seed-bean', emoji: '🫘', word: 'BEAN', kind: 'seed', crop: 'bean', price: 4,  name: 'Bean Seed 豆种子' },
    { id: 'seed-corn', emoji: '🌽', word: 'CORN', kind: 'seed', crop: 'corn', price: 6,  name: 'Corn Seed 玉米种子' },
    { id: 'chick', emoji: '🐣', word: 'EGG',  kind: 'animal', price: FarmEconomy.ANIMAL_PRICES.chick,  name: 'Chick 小鸡' },
    { id: 'bee',   emoji: '🐝', word: 'BEE',  kind: 'animal', price: FarmEconomy.ANIMAL_PRICES.bee,  name: 'Bee 蜜蜂' },
    { id: 'cat',   emoji: '🐱', word: 'CAT',  kind: 'animal', price: FarmEconomy.ANIMAL_PRICES.cat, name: 'Cat 猫咪' },
    { id: 'dog',   emoji: '🐶', word: 'DOG',  kind: 'animal', price: FarmEconomy.ANIMAL_PRICES.dog, name: 'Dog 狗狗' },
    { id: 'fish',  emoji: '🐟', word: 'FISH', kind: 'animal', price: FarmEconomy.ANIMAL_PRICES.fish,  name: 'Fish 小鱼' },
    { id: 'cow', emoji: '🐄', word: 'COW', kind: 'animal', price: FarmEconomy.ANIMAL_PRICES.cow, name: 'Cow 小牛' },
    { id: 'sheep', emoji: '🐑', word: 'SHEEP', kind: 'animal', price: FarmEconomy.ANIMAL_PRICES.sheep, name: 'Sheep 小羊' },
    { id: 'food',  emoji: '🥣', word: 'FEED',  kind: 'supply', gives: { food: FarmEconomy.SUPPLIES.food.amount },  price: FarmEconomy.SUPPLIES.food.price, name: 'Feed 饲料×3' },
    { id: 'water', emoji: '💧', word: 'WATER', kind: 'supply', gives: { water: FarmEconomy.SUPPLIES.water.amount }, price: FarmEconomy.SUPPLIES.water.price, name: 'Water 水×3' },
  ];
  const GROW_MAX = FarmEconomy.GROW_MAX;
  const byId = id => SHOP.find(x => x.id === (id === 'hen' ? 'chick' : id));
  const ZONES = {
    yard: { icon: '🏡', name: '小院', en: 'Little yard', hint: '点一点小鸡，和它做朋友', speech: 'Tap the chick!' },
    field: { icon: '🌱', name: '菜园', en: 'Growing garden', hint: '今天浇水，明天长大一点', speech: 'Tap a garden bed!' },
    pets: { icon: '🐾', name: '草地', en: 'Cozy meadow', hint: '摸摸小伙伴，和它更亲近', speech: 'Tap an animal!' },
    pond: { icon: '💧', name: '池塘', en: 'Little pond', hint: '看看水里的小鱼，今天过得好吗', speech: 'Tap the fish!' },
  };
  const ZONE_OF = { chick: 'yard', hen: 'yard', bee: 'field', cat: 'pets', dog: 'pets', fish: 'pond', cow: 'pets', sheep: 'pets' };
  const animalName = a => {
    const young = { chick: '小鸡', cat: '小猫', dog: '小狗', bee: '小蜜蜂', fish: '小鱼', cow: '小牛', sheep: '小羊' };
    const mature = { chick: '母鸡', hen: '母鸡', cat: '猫咪', dog: '狗狗', bee: '蜜蜂', fish: '大鱼', cow: '奶牛', sheep: '绵羊' };
    return ((grown(Store.farm(), a.uid) ? mature : young)[a.type] || '小伙伴') + (a.serial ? ' ' + a.serial + '号' : '');
  };
  const shopArt = item => item.id === 'chick' ? '<span>🥚</span>' : item.kind === 'animal' ? FarmArt.animal(item.id) : '<span>' + item.emoji + '</span>';
  const coinIcon = '<span class="coin-icon" aria-label="金币">●</span>';
  const meter = (icon, value, max) => Array.from({ length: max }, (_, i) => `<i class="need-pip ${i < value ? 'full' : ''}" style="opacity:${.2 + .8 * Math.min(1, Math.max(0, value - i))}" aria-hidden="true">${icon}</i>`).join('');
  let curZone = 'yard', selected = null, ticker = null, shopKind = 'animal', spellToken = 0, pendingPlot = null, focusOnReturn = null, renderedCareDay = null;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const grown = (f, uid) => { const a = f.animals.find(a => a.uid === uid); return !!a && FarmEconomy.adult(f, a); };
  const careOf = (f, uid) => f.care[uid] || { food: 3, water: 3, growth: GROW_MAX, ts: Date.now() };

  function leave() { clearInterval(ticker); ticker = null; spellToken++; FarmMap.detach(); FarmLife.stop(); }
  function enterFarm() {
    if (!Store.farm().welcomed) {
      Store.farm(f => { f.welcomed = true; f.coins = Math.max(f.coins, 50); });
      App.toast('🎁 ' + coinIcon + ' 50');
    }
    Store.farm(f => FarmEconomy.start(f));
    pendingPlot = null;
    renderFarmScene();
    if (focusOnReturn) { focusOnReturn === 'field' ? FarmMap.focusZone('field') : FarmMap.focusAnimal(focusOnReturn); focusOnReturn = null; }
    Sound.guide('欢迎回家！拖动地图逛农场，点小动物照顾它。点地上的收获，就能捡进仓库。');
    clearInterval(ticker);
    ticker = setInterval(() => {
      if (document.hidden) return;
      const now = Date.now();
      if (renderedCareDay !== FarmEconomy.careDay(now)) renderFarmScene();
      const f = Store.farm();
      document.querySelectorAll('.garden-bed').forEach(btn => {
        const p = f.plots[+btn.dataset.plot];
        updatePlot(btn, p, FarmEconomy.cropState(p, now));
      });
      FarmBusiness.refreshCropDialog(f, now);
    }, 1000);
  }

  const plotStatus = (p, state) => state ? [p.crop, state.stage, state.watered].join('-') : 'empty';
  function plotLabel(index, p, state) {
    const bed = `第 ${index + 1} 块地`;
    if (!state) return bed + '，空地，点这里播种';
    const label = FarmEconomy.ITEMS[p.crop].name + '，' + FarmEconomy.CROP_STAGES[state.stage - 1];
    return bed + '，' + label + '，' + (state.mature ? '可以收获' : state.watered ? '已浇水' : '可以浇水');
  }
  function plotContent(p, state) {
    if (!state) return '<span class="bed-icon" aria-hidden="true">🌱＋</span>';
    const need = !state.mature && !state.watered ? `<span class="animal-need crop-water-need" aria-hidden="true"><svg viewBox="0 0 32 36"><path d="M16 3C13 10 5 17 5 23a11 11 0 0 0 22 0c0-6-8-13-11-20Z" fill="#46b5e1" stroke="#2486b3" stroke-width="2"/><path d="M10 22q-1 6 5 7" fill="none" stroke="#e9faff" stroke-width="3" stroke-linecap="round"/></svg></span>` : '';
    const harvest = state.mature ? `<span class="bed-status" aria-hidden="true">🧺 ×${state.yieldCount}</span>` : '';
    return `<span class="bed-icon ${state.mature ? 'ready' : ''}">${FarmArt.crop(p.crop, state.stage)}</span>${harvest}${need}`;
  }
  function updatePlot(bed, p, state) {
    const status = plotStatus(p, state);
    if (bed.dataset.cropStatus === status) return;
    bed.dataset.cropStatus = status;
    bed.setAttribute('aria-label', plotLabel(+bed.dataset.plot, p, state));
    bed.innerHTML = plotContent(p, state);
  }
  function openShop(kind = 'animal') { shopKind = kind; App.show('shop'); }
  function focusProduct(item) {
    const drop = document.querySelector(`#farm-map-drops [data-pickup="${item}"]`);
    if (!drop) return;
    FarmMap.focusProduct(item, drop.dataset.dropId);
    document.getElementById('farm-map-viewport').scrollIntoView({ block: 'nearest' });
    drop.focus({ preventScroll: true });
  }
  function renderGroundProducts(f, map) {
    const layer = document.getElementById('farm-map-drops');
    const guide = document.getElementById('farm-pickup-guide');
    const counts = FarmEconomy.groundStock(f);
    const drops = FarmEconomy.groundDrops(f);
    const items = Object.keys(counts).filter(item => counts[item] > 0);
    layer.innerHTML = drops.map(({ item, id, slot }) => {
      const { name, icon } = FarmEconomy.ITEMS[item], { x, y } = map.dropSpots[item][slot];
      return `<button class="farm-ground-item" data-pickup="${item}" data-drop-id="${id}" style="left:${x}px;top:${y}px;--drop-tilt:${(id * 7) % 19 - 9}deg" aria-label="拾取 1 份${name}">
        <span class="ground-item-icon" aria-hidden="true">${icon}</span></button>`;
    }).join('');
    guide.hidden = !items.length;
    guide.innerHTML = items.length ? '<b aria-hidden="true">🧺 👆</b>' + items.map(item => {
      const { name, icon } = FarmEconomy.ITEMS[item];
      return `<button data-find-product="${item}" aria-label="在地图上找${name}，还有 ${counts[item]} 份"><span aria-hidden="true">${icon}</span></button>`;
    }).join('') : '';
    guide.querySelectorAll('[data-find-product]').forEach(button => {
      button.onclick = () => focusProduct(button.dataset.findProduct);
    });
    layer.querySelectorAll('[data-pickup]').forEach(button => {
      const item = button.dataset.pickup, id = Number(button.dataset.dropId);
      button.onfocus = () => { if (button.matches(':focus-visible')) FarmMap.focusProduct(item, id); };
      button.onclick = () => {
        if (!button.isConnected) return;
        const hadFocus = document.activeElement === button;
        let picked;
        Store.farm(g => picked = FarmEconomy.pickUpProduct(g, item, Date.now(), id));
        if (!picked) return;
        const updated = Store.farm();
        if (FarmEconomy.groundDrops(updated).some(d => !map.dropSpots[d.item]?.[d.slot])) renderFarmScene();
        else { renderGroundProducts(updated, map); FarmBusiness.mount(); renderCare(); }
        if (hadFocus) document.getElementById('farm-map-viewport').focus({ preventScroll: true });
        const { icon, word } = FarmEconomy.ITEMS[item];
        Sound.sfx('star');
        Sound.speak(word + '! Into the basket!', { now: false, dedupe: true });
        App.toast(icon + ' → 🧺');
      };
    });
  }
  function renderFarmScene() {
    FarmMap.detach(); FarmLife.detach();
    const now = Date.now();
    renderedCareDay = FarmEconomy.careDay(now);
    const f = Store.farm(), animals = f.animals;
    if (FarmEconomy.needsProductionSync(f, now)) Store.farm(g => FarmEconomy.syncProducers(g, now));
    const map = FarmMap.layout(animals, FarmEconomy.groundDrops(f));
    if (!animals.some(a => a.uid === selected)) selected = animals[0]?.uid || null;
    document.getElementById('farm-body').innerHTML = `
      <div class="farm-shell connected-farm">
        <header class="farm-heading"><div><h1>🐣 我的农场</h1></div>
          <div class="farm-wallet"><span>${coinIcon} <b>${f.coins}</b><small>金币</small></span><span>♡ <b>${f.hearts}</b><small>爱心</small></span></div>
        </header>
        <div id="farm-business-header"></div>
        <div class="farm-layout">
          <div class="farm-world">
            <div id="farm-scene"><div id="farm-map-viewport" tabindex="0" role="region" aria-label="完整农场地图，可以拖动、双指缩放，或用方向键移动">
              <div id="farm-map-world" style="width:${map.width}px;height:${map.height}px">
                ${FarmMap.art(map)}
                <div class="farm-herd life-area map-actors" role="group" aria-label="农场里的全部小伙伴">${animals.map(a => {
                  const today = FarmEconomy.dailyCare(f, a.uid);
                  const product = FarmEconomy.PRODUCERS[a.type]?.action ? FarmEconomy.production(f, a.uid) : null;
                  const ready = product?.count > 0;
                  return `<button class="farm-animal ${selected === a.uid ? 'selected' : ''}" data-animal="${esc(a.uid)}" data-species="${a.type}" aria-label="照顾${animalName(a)}${ready ? '，可以' + product.label : ''}" aria-pressed="${selected === a.uid}">
                    ${ready ? '<span class="animal-need livestock-ready" aria-hidden="true">' + FarmEconomy.ITEMS[product.item].icon + '</span>' : !today.food || !today.water ? '<span class="animal-need">' + (!today.food ? '🥣' : '💧') + '</span>' : ''}
                    <span class="animal-emote" aria-hidden="true"></span>${FarmArt.animal(a.type, grown(f, a.uid), ready)}<span class="animal-label">${animalName(a)}</span><span class="animal-ripple" aria-hidden="true"></span></button>`;
                }).join('')}</div>
                <div class="map-crops" role="group" aria-label="菜园">${f.plots.map((p,i) => {
                  const r = map.plots[i], state = FarmEconomy.cropState(p, now);
                  return `<button class="garden-bed" style="left:${r.x}px;top:${r.y}px;width:${r.width * map.unit}px;height:${r.height * map.unit}px" data-plot="${i}" data-crop-status="${plotStatus(p, state)}" aria-label="${plotLabel(i, p, state)}">${plotContent(p, state)}</button>`;
                }).join('')}</div>
                <span class="map-sign" style="left:${390*map.unit}px;top:${120*map.unit}px" aria-hidden="true">🏡</span>
                <span class="map-sign" style="left:${1480*map.unit}px;top:${490*map.unit}px" aria-hidden="true">🌱</span>
                <span class="map-sign" style="left:${380*map.unit}px;top:${1130*map.unit}px" aria-hidden="true">🐾</span>
                <div class="map-drops" id="farm-map-drops" role="group" aria-label="农场地上可以拾取的产物"></div>
              </div>
              <button class="map-guide" id="farm-listen" aria-label="听拖动地图和照顾动物的提示"><span aria-hidden="true">👆 ↔</span><span aria-hidden="true">🔊</span></button>
              <div class="map-controls" aria-label="地图缩放"><button data-map="in" aria-label="放大地图">＋</button><button data-map="out" aria-label="缩小地图">−</button><button data-map="all" aria-label="查看整个农场">⛶</button></div>
              <button class="farm-minimap" aria-label="小地图，点这里查看整个农场"><span class="mini-yard">🏡</span><span class="mini-garden">🌱</span><span class="mini-meadow">🐾</span><span class="mini-pond"></span><span class="mini-road"></span><span class="mini-camera"></span></button>
              <span class="map-count" aria-label="共有 ${animals.length} 只动物">🐾 ${animals.length}</span>
            </div></div>
            <div class="farm-pickup-guide" id="farm-pickup-guide" role="group" aria-label="定位农场产物" hidden></div>
            ${animals.length ? '<div id="farm-quick-care" class="farm-quick-care" aria-label="就地照顾动物"></div>' : '<button class="farm-primary picture-action" id="farm-adopt" aria-label="去商店带小动物回家"><span>🐣 ＋</span></button>'}
            <nav class="farm-zones map-bookmarks" aria-label="移动地图到这里">${Object.entries(ZONES).map(([key,v]) => `<button data-zone="${key}" aria-label="移到${v.name}"><span>${v.icon}</span><b>${v.name}</b></button>`).join('')}</nav>
          </div>
          <aside class="farm-companion" id="farm-care" aria-label="照顾小伙伴"></aside>
        </div>
        <div id="farm-business-bottom"></div>
        <footer class="farm-footer"><span aria-hidden="true">🌼 🌼 🌼</span><button class="picture-action" id="farm-learn" aria-label="去学字母"><span>🎈 🔤</span><small>去玩</small></button></footer>
      </div>`;
    document.querySelectorAll('[data-zone]').forEach(btn => btn.onclick = () => { goZone(btn.dataset.zone); Sound.sfx('tap'); });
    document.querySelectorAll('[data-animal]').forEach(btn => btn.onclick = () => {
      selectAnimal(btn.dataset.animal);
      if (FarmMap.state().camera?.scale < .65) FarmMap.focusAnimal(selected);
      FarmLife.react(selected);
    });
    document.querySelectorAll('[data-plot]').forEach(btn => btn.onclick = () => tapPlot(+btn.dataset.plot));
    document.getElementById('farm-listen').onclick = () => Sound.guide('拖动地图逛农场。点小动物照顾它，点地上的鸡蛋或蜂蜜，就能捡进仓库。');
    document.getElementById('farm-adopt')?.addEventListener('click', () => openShop());
    document.getElementById('farm-learn').onclick = () => App.show('find');
    renderCare(); FarmBusiness.mount();
    FarmLife.mount(animals.map(a => ({ ...a, adult: grown(f, a.uid), affection: careOf(f, a.uid).affection || 0 })), Store.profileId, map);
    FarmMap.mount(map, Store.profileId, selected);
    renderGroundProducts(f, map);
  }
  function selectAnimal(uid) {
    selected = uid;
    document.querySelectorAll('[data-animal]').forEach(b => { b.classList.toggle('selected', b.dataset.animal === uid); b.setAttribute('aria-pressed', String(b.dataset.animal === uid)); });
    renderCare();
  }

  function renderCare() {
    const f = Store.farm(), a = f.animals.find(a => a.uid === selected), box = document.getElementById('farm-care');
    if (!box) return;
    const c = a ? careOf(f, a.uid) : null;
    const today = a ? FarmEconomy.dailyCare(f, a.uid) : null;
    const growDays = FarmEconomy.growthDays(a?.type);
    const producer = FarmEconomy.PRODUCERS[a?.type];
    const product = producer?.action ? FarmEconomy.production(f, a.uid) : null;
    const isAdult = a && grown(f, a.uid);
    const foodIcon = a?.type === 'bee' ? '🌸' : a?.type === 'fish' ? '🟤' : ['chick', 'hen'].includes(a?.type) ? '🌾' : producer?.action ? '🌿' : '🥣';
    const feedIcon = producer?.action ? foodIcon : '🥣';
    const waterLabel = a?.type === 'fish' ? '添清水' : '喂水';
    const quick = document.getElementById('farm-quick-care');
    if (quick && a) {
      quick.innerHTML = `<span class="quick-friend">${animalName(a)}</span><button data-scene-care="pet" aria-label="摸摸头">🖐️💛</button><button data-scene-care="food" aria-label="${today.food ? '今天已喂食，明天再来' : '今天喂食一次'}" ${today.food ? 'disabled' : ''}>${feedIcon}${today.food ? '✓' : f.food ? '' : '＋'}</button><button data-scene-care="water" aria-label="${today.water ? '今天已' + waterLabel + '，明天再来' : '今天' + waterLabel + '一次'}" ${today.water ? 'disabled' : ''}>💧${today.water ? '✓' : f.water ? '' : '＋'}</button>`;
      if (product?.count) quick.insertAdjacentHTML('beforeend', `<button data-collect="${esc(a.uid)}" aria-label="${product.label}">${FarmEconomy.ITEMS[product.item].icon}</button>`);
      quick.querySelectorAll('[data-scene-care]').forEach(btn => btn.onclick = () => care(btn.dataset.sceneCare));
      FarmBusiness.bindProduction(quick);
    }
    box.innerHTML = a ? `<div class="care-portrait" data-animal-portrait="${esc(a.uid)}">${FarmArt.animal(a.type, isAdult, !!product?.count)}</div>
      <h2>${animalName(a)}</h2><button id="care-listen" class="care-subtitle care-listen" aria-label="听每日照顾和成长规则">${isAdult ? '🌼 💛 🔊' : '☀️ 🥣＋💧 → 🌱 🔊'}</button>
      <div class="care-growth" aria-label="成长 ${Math.round(c.growth / GROW_MAX * 100)}%，${growDays} 个照顾日成年"><span>🌱</span><span class="picture-meter">${meter('🌼', c.growth * growDays / GROW_MAX, growDays)}</span></div>
      <div class="care-growth-preview" aria-label="幼年到成年"><span>${FarmArt.animal(a.type === 'hen' ? 'chick' : a.type, false)}</span><i aria-hidden="true">→</i><span>${FarmArt.animal(a.type, true)}</span></div>
      <div class="care-affection" aria-label="好感度 ${c.affection || 0}/5，摸摸增加好感，满了有特别动作"><span>💗</span><span class="picture-meter">${meter('💗', c.affection || 0, FarmEconomy.AFFECTION_MAX)}</span></div>
      <div class="care-needs daily-care" aria-label="今天的照顾"><i aria-hidden="true">☀️</i><span class="${today.food ? 'done' : ''}" aria-label="今天${today.food ? '已' : '未'}喂食"><span>🥣</span><b aria-hidden="true">${today.food ? '✓' : '○'}</b></span><span class="${today.water ? 'done' : ''}" aria-label="今天${today.water ? '已' : '未'}${waterLabel}"><span>💧</span><b aria-hidden="true">${today.water ? '✓' : '○'}</b></span></div>
      <div class="care-actions"><button data-care="pet" aria-label="摸摸头"><span>🖐️💛</span><b>摸摸</b></button><button data-care="food" aria-label="${today.food ? '今天已喂食，明天再来' : f.food ? '今天喂食一次' : '去商店找食物'}" ${today.food ? 'disabled' : ''}><span>${today.food ? feedIcon + '✓' : f.food ? feedIcon : '🧺' + feedIcon}</span><b>${today.food ? '喂过啦' : '喂食'}</b><small>×${f.food}</small></button><button data-care="water" aria-label="${today.water ? '今天已' + waterLabel + '，明天再来' : f.water ? '今天' + waterLabel + '一次' : '去商店找水'}" ${today.water ? 'disabled' : ''}><span>${today.water ? '💧✓' : f.water ? '💧' : '🧺💧'}</span><b>${today.water ? (a.type === 'fish' ? '添过啦' : '喝过啦') : waterLabel}</b><small>×${f.water}</small></button></div>
      <p class="care-note" id="care-note" role="status" aria-label="点按钮照顾小动物">👆 🥣 💧 🖐️</p>` : `<div class="care-portrait welcome">${FarmArt.animal('chick')}</div><h2>找朋友</h2><div class="picture-cue" aria-label="学字母，购物，带小动物回家">🔤 → 🧺 → 🐣</div><button class="farm-primary picture-action" id="care-start" aria-label="${curZone === 'field' ? '去买种子' : '去找小动物'}"><span>${curZone === 'field' ? '🌱 ＋' : '🐣 ＋'}</span></button>`;
    if (a) box.innerHTML += `<div class="care-replays" aria-label="回看照顾动作，不消耗补给">${today.food ? `<button class="care-replay" data-replay-care="food" aria-label="再看${animalName(a)}吃饭，不消耗食物">${foodIcon} ↻ 🔊</button>` : ''}${today.water ? `<button class="care-replay" data-replay-care="water" aria-label="再看${animalName(a)}${waterLabel}，不消耗水">💧 ↻ 🔊</button>` : ''}</div>`;
    box.innerHTML += '<div id="production-slot">' + (a ? FarmBusiness.productionMarkup(f, a.uid) : '') + '</div>';
    const quote = isAdult ? FarmEconomy.animalQuote(f, a.uid) : null;
    if (quote?.sellable) {
      box.innerHTML += `<button class="animal-sell-button" id="care-sell" aria-label="出售${animalName(a)}，获得 ${quote.price} 金币">
        <span>🏡 出售</span><span>${coinIcon} ${quote.price}</span></button>`;
    }
    box.innerHTML += '<div class="farm-shop-link"><div class="scene-cue" aria-hidden="true">🐣 🌱 🥣</div><button id="care-shop" aria-label="打开小小商店">🧺 →</button></div>';
    box.querySelector('#care-sell')?.addEventListener('click', () => {
      if (sellAnimal(a.uid)) renderFarmScene();
    });
    FarmBusiness.bindProduction(box);
    box.querySelectorAll('[data-care]').forEach(btn => btn.onclick = () => care(btn.dataset.care));
    box.querySelectorAll('[data-replay-care]').forEach(btn => btn.onclick = () => {
      const portrait = box.querySelector('.care-portrait'), r = portrait?.getBoundingClientRect();
      if (r && (r.top < 72 || r.bottom > innerHeight)) portrait.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      FarmLife.react(a.uid, btn.dataset.replayCare);
    });
    document.getElementById('care-listen')?.addEventListener('click', () => {
      if (isAdult && producer?.action) Sound.guide('长大后继续每天喂食、喂水。照顾满三天，就可以' + producer.label + '啦。');
      else Sound.guide('每天喂一次食物，再喝一次水，小动物就长大一点。点亮' + (growDays === 5 ? '五' : '三') + '朵花，就长大啦！摸摸它，会更喜欢你哦。');
    });
    document.getElementById('care-start')?.addEventListener('click', () => openShop(curZone === 'field' ? 'seed' : 'animal'));
    document.getElementById('care-shop').onclick = () => openShop();
  }

  function care(kind) {
    const f = Store.farm(), a = f.animals.find(x => x.uid === selected);
    if (!a) return;
    if (kind !== 'pet' && FarmEconomy.dailyCare(f, a.uid)[kind]) return;
    if (kind !== 'pet' && f[kind] < 1) { openShop('supply'); return; }
    let result; Store.farm(g => result = FarmEconomy.careAnimal(g, a.uid, kind));
    if (!result) return;
    renderFarmScene();
    FarmLife.react(a.uid, kind);
    const message = kind === 'pet' ? (result.bonded ? '💗 ✨ 💗' : '🖐️ → 💗') : result.grew ? '🥣✓ 💧✓ → 🌱✨' : kind === 'food' ? '🥣 😋' : '💧 😊';
    document.getElementById('care-note').textContent = message;
    if (result.grewUp) {
      document.querySelector('.farm-animal.selected')?.classList.add('just-grown');
      document.querySelector('.care-portrait')?.classList.add('just-grown');
      Confetti.celebrate(); App.toast('🌱 → 🌼 🎉');
    }
  }

  function tapPlot(i) {
    const bed = document.querySelector(`.garden-bed[data-plot="${i}"]`);
    if (bed?.getAttribute('aria-disabled') === 'true') return;
    const state = FarmEconomy.cropState(Store.farm().plots[i]);
    if (!state) { pendingPlot = i; FarmBusiness.plantDialog(i); return; }
    if (!state.mature) { FarmBusiness.growingDialog(i); return; }
    let harvest; Store.farm(f => harvest = FarmEconomy.harvest(f, i));
    if (!harvest) return;
    FarmBusiness.mount();
    if (bed) updatePlot(bed, null, null);
    const { crop, count } = harvest, fruit = FarmEconomy.ITEMS[crop].icon;
    const showResult = () => {
      Sound.speak('Harvest! Well done!', { now: false, dedupe: true });
      App.toast(fruit + ' ×' + count + ' → 🧺');
    };
    if (!bed || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      showResult();
      return;
    }

    bed.setAttribute('aria-disabled', 'true');
    bed.setAttribute('aria-label', '正在收获' + FarmEconomy.ITEMS[crop].name);
    const fruitSprites = `<span class="harvest-fruit">${fruit}</span>`.repeat(count);
    bed.insertAdjacentHTML('afterbegin', `
      <span class="harvest-scene" aria-hidden="true">
        <span class="harvest-plant">${FarmArt.crop(crop, state.stage)}</span>
        <span class="harvest-fruits">${fruitSprites}</span>
        <span class="harvest-basket">🧺</span>
        <span class="harvest-count">+ ${count}</span>
      </span>`);
    Sound.sfx('pop');
    App.after(() => {
      if (!bed.isConnected) return;
      bed.querySelector('.harvest-scene')?.remove();
      bed.removeAttribute('aria-disabled');
      bed.setAttribute('aria-label', plotLabel(i, null, null));
      showResult();
    }, 1320);
  }

  function enterShop() { Store.farm(f => FarmEconomy.identifyAnimals(f)); renderShop(); renderSell(); Sound.guide('想带谁回家？点一个图片，听单词，拼一拼。'); }
  function missingLetters(item) { return [...new Set(item.word.split('').filter(ch => !Store.mastered(ch)))]; }
  function renderShop() {
    const f = Store.farm();
    FarmEconomy.ensure(f);
    document.getElementById('shop-coins').textContent = f.coins;
    document.getElementById('shop-tabs').innerHTML = [['animal', '🐣', '动物'], ['seed', '🌱', '种子'], ['supply', '🥣💧', '补给']].map(([kind, icon, label]) => `<button data-kind="${kind}" aria-label="${label}" aria-pressed="${kind === shopKind}" class="${kind === shopKind ? 'active' : ''}"><span class="action-picture" aria-hidden="true">${icon}</span><small>${label}</small></button>`).join('');
    document.querySelectorAll('[data-kind]').forEach(btn => btn.onclick = () => { shopKind = btn.dataset.kind; renderShop(); });
    document.getElementById('shop-grid').innerHTML = SHOP.filter(item => item.kind === shopKind).map(item => {
      const miss = missingLetters(item), capacity = item.kind === 'animal' ? FarmEconomy.animalCapacity(f, item.id) : null;
      const label = item.name.split(' ').slice(item.kind === 'seed' ? 2 : 1).join(' ');
      return `<button class="shop-card-v2 ${capacity?.full ? 'is-full' : ''}" data-item="${item.id}" aria-disabled="${!!capacity?.full}" aria-label="${esc(label)}，${item.price} 金币${capacity ? '，已养 ' + capacity.count + ' 只，最多 ' + capacity.limit + ' 只，' + (capacity.full ? '小家住满了' : '还有 ' + capacity.remaining + ' 个名额') : ''}"><div class="shop-art">${shopArt(item)}</div><span>${esc(label)}</span><div class="shop-price"><span class="coin-icon" aria-label="金币">●</span> ${item.price}</div>${capacity ? `<div class="animal-capacity" aria-label="还可养 ${capacity.remaining} 只"><span class="capacity-slots" aria-hidden="true">${Array.from({length:capacity.limit},(_,i)=>`<i class="${i<capacity.count?'occupied':''}">${i<capacity.count?'🐾':'○'}</i>`).join('')}</span><span class="shop-owned">🏡 ${capacity.count} / ${capacity.limit}</span></div>` : ''}<div class="shop-badges"><span aria-label="${capacity?.full ? '小家住满了' : miss.length ? '需要先学字母' : '听单词，拼写购买'}">${capacity?.full ? '🏡 ✓' : miss.length ? '🔒 ⭐' : '🔊 → 🧩'}</span>${capacity?.full ? '<small>住满啦</small>' : ''}</div></button>`;
    }).join('');
    document.querySelectorAll('[data-item]').forEach(btn => btn.onclick = () => openSpell(byId(btn.dataset.item)));
  }
  function sellAnimal(uid) {
    const f = Store.farm(), animal = f.animals.find(a => a.uid === uid);
    const quote = FarmEconomy.animalQuote(f, uid);
    if (!quote?.sellable || !confirm('出售' + animalName(animal) + '？它会去新家，你会获得 ' + quote.price + ' 金币。')) return false;
    let sale; Store.farm(g => sale = FarmEconomy.sellAnimal(g, uid));
    if (!sale) return false;
    Sound.sfx('star');
    App.toast('🏡 → ＋' + coinIcon + ' ' + sale.price);
    return true;
  }
  function renderSell() {
    const f = Store.farm(), box = document.getElementById('shop-sell');
    const rows = [];
    if (f.hearts >= 10) rows.push(`<button data-sell="hearts" aria-label="爱心兑换金币">♡ ×${Math.floor(f.hearts / 10) * 10}<span>→ ${coinIcon} ${Math.floor(f.hearts / 10) * 5}</span></button>`);
    Object.entries(FarmEconomy.ITEMS).forEach(([key, item]) => {
      const count = FarmEconomy.stock(f, key);
      if (!count) return;
      rows.push(`<button data-sell="${key}" aria-label="卖出全部${item.name} ${count} 份，获得 ${count * item.price} 金币">${item.icon} ${item.name} ×${count}<span>${coinIcon} ${item.price}/份 → ${coinIcon} ${count * item.price}</span></button>`);
    });
    f.animals.filter(a => grown(f, a.uid) && byId(a.type)).forEach(a => {
      const quote = FarmEconomy.animalQuote(f, a.uid);
      rows.push(`<button data-sell="animal" data-uid="${esc(a.uid)}" aria-label="让${animalName(a)}去新家，换 ${quote.price} 金币" title="购买 ${quote.purchasePrice}，培育 ${quote.growCost.toFixed(2)}，售价 ${quote.price}${quote.estimated ? '（含旧档案估算）' : ''}">${byId(a.type).emoji} ${animalName(a)}<span>→ 🏡 ${coinIcon} ${quote.price}</span></button>`);
    });
    box.innerHTML = '<details><summary>🧺 出售动物与收获 ' + coinIcon + ' <span>' + rows.length + '</span></summary><div class="harvest-items">' + rows.join('') + '</div></details>';
    box.querySelectorAll('[data-sell]').forEach(btn => btn.onclick = () => {
      const kind = btn.dataset.sell;
      if (kind === 'animal') {
        if (!sellAnimal(btn.dataset.uid)) return;
      } else if (kind === 'hearts') {
        Store.farm(g => { const n = Math.floor(g.hearts / 10); g.coins += n * 5; g.hearts -= n * 10; });
        Sound.sfx('star');
      } else {
        let count; Store.farm(g => count = FarmEconomy.sell(g, kind));
        if (!count) return;
        Sound.sfx('star');
        App.toast('＋' + coinIcon + ' ' + count * FarmEconomy.ITEMS[kind].price);
      }
      renderSell(); renderShop();
    });
  }

  function closeSpell() { spellToken++; Sound.stop(); document.getElementById('overlay-root').innerHTML = ''; }
  function showAnimalLimit(item) {
    const capacity = FarmEconomy.animalCapacity(Store.farm(), item.id);
    App.toast(item.emoji + ' 🏡 ' + capacity.count + ' / ' + capacity.limit);
    Sound.guide('这个小家住满啦。长大的小动物去了新家，就能再带新朋友回来。');
  }
  function openSpell(item) {
    const f = Store.farm(), miss = missingLetters(item), root = document.getElementById('overlay-root');
    if (item.kind === 'animal' && FarmEconomy.animalCapacity(f, item.id).full) { renderShop(); showAnimalLimit(item); return; }
    if (f.coins < item.price) { App.toast(coinIcon + ' ' + f.coins + ' → ' + item.price + ' 🌱'); Sound.guide('金币还不够。去农场收获，再来看看吧。'); return; }

    const token = ++spellToken, profile = Store.profileId;
    if (miss.length) {
      root.innerHTML = `<div class="farm-modal-backdrop"><section class="farm-dialog" role="dialog" aria-modal="true" aria-labelledby="spell-title"><span class="dialog-symbol">🔒 ⭐</span><h2 id="spell-title">学字母</h2><div class="picture-cue" aria-label="学字母，收集贴纸，再来购物">🔤 <i>→</i> ⭐ <i>→</i> 🧺</div><button class="farm-primary picture-action" id="spell-learn" aria-label="去找字母，收集贴纸"><span>🎈</span><small>去玩</small></button><button class="farm-plain" id="spell-close" aria-label="回商店">↩ 🧺</button></section></div>`;
      document.getElementById('spell-learn').onclick = () => App.show('find');
      document.getElementById('spell-close').onclick = closeSpell;
      document.getElementById('spell-learn').focus();
      Sound.guide('先去找字母，拿到星星贴纸，再来带它回家。'); return;
    }
    let pos = 0, mistakes = 0;
    const needed = [...new Set(item.word)];
    const extras = ABC.helpers.shuffle(ABC.letters.map(it => it.L).filter(L => !needed.includes(L) && Store.mastered(L))).slice(0, 2);
    const letters = ABC.helpers.shuffle([...needed, ...extras]);
    root.innerHTML = `<div class="farm-modal-backdrop"><section class="farm-dialog spelling-dialog" role="dialog" aria-modal="true" aria-labelledby="spell-title"><header class="spell-heading"><h2 id="spell-title">拼一拼</h2><span class="shop-price"><span class="coin-icon" aria-label="金币">●</span> ${item.price}</span><button class="icon-button" id="spell-close" aria-label="取消购买，回商店">✕</button></header><div class="spell-art">${shopArt(item)}</div><div class="spell-slots" aria-label="拼写区域">${[...item.word].map((_, i) => `<span class="sp-slot ${i === 0 ? 'current' : ''}" aria-label="第 ${i + 1} 个字母，空白"></span>`).join('')}</div><div class="spell-word-card" hidden tabindex="-1"><strong lang="en"></strong><small>记住字母的顺序</small></div><div class="spell-tools"><button class="picture-action" id="spell-say" aria-label="听单词"><span>${Sound.muted ? '🔇' : '🔊'}</span><small>听一听</small></button><button class="picture-action" id="spell-hint" aria-label="看整词，记住拼写"><span>💡</span><small>帮帮我</small></button></div><div class="spell-tray">${letters.map(ch => `<button class="sp-tile" data-ch="${ch}" aria-label="字母 ${ch}">${ch}</button>`).join('')}</div><div id="spell-feedback" class="picture-cue" role="status" aria-label="听单词，再点字母拼写">👂 <i>→</i> 👆 <i>→</i> 🧩</div></section></div>`;
    const dialog = root.querySelector('.farm-dialog');
    const slots = dialog.querySelectorAll('.sp-slot');
    const slotsRow = dialog.querySelector('.spell-slots');
    const tiles = dialog.querySelectorAll('[data-ch]');
    const card = dialog.querySelector('.spell-word-card');
    const cardWord = card.querySelector('strong');
    const say = document.getElementById('spell-say');
    const hint = document.getElementById('spell-hint');
    const word = item.word.toLowerCase();
    const current = () => token === spellToken && profile === Store.profileId && dialog.isConnected;
    document.getElementById('spell-close').onclick = closeSpell;
    const feedback = (picture, label) => {
      const el = dialog.querySelector('#spell-feedback');
      el.textContent = picture;
      el.setAttribute('aria-label', label);
    };
    function disableInput(disabled) {
      say.disabled = hint.disabled = disabled;
      tiles.forEach(tile => { tile.disabled = disabled; });
    }
    function showWordCard() {
      if (!current() || !card.hidden || pos >= item.word.length) return;
      disableInput(true);
      slotsRow.hidden = true;
      cardWord.textContent = item.word;
      card.hidden = false;
      card.focus();
      feedback('👀 → 👂', '看整词，听一遍，记住字母的顺序');

      const shownAt = performance.now();
      const studyTime = 2200 + 250 * item.word.length;
      let restarted = false;
      function startOver() {
        if (!current() || restarted) return;
        restarted = true;
        clearTimeout(speechDeadline);
        pos = mistakes = 0;
        slots.forEach((slot, i) => {
          slot.textContent = '';
          slot.classList.remove('filled');
          slot.classList.toggle('current', i === 0);
          slot.setAttribute('aria-label', '第 ' + (i + 1) + ' 个字母，空白');
        });
        tiles.forEach(tile => tile.classList.remove('spell-retry'));
        const restoreFocus = document.activeElement === card;
        card.hidden = true;
        cardWord.textContent = '';
        slotsRow.hidden = false;
        disableInput(false);
        feedback('↻ 从头再拼', '从第一个字母重新拼');
        if (restoreFocus) hint.focus();
      }
      // The spelling controls must recover even if the speech engine never calls back.
      const speechDeadline = App.after(() => {
        if (!current() || restarted) return;
        Sound.stop();
        startOver();
      }, 7000);
      Sound.speak(word, { once: true, onDone: () => {
        App.after(startOver, Math.max(0, studyTime - (performance.now() - shownAt)));
      } });
    }
    hint.onclick = showWordCard;
    say.onclick = () => {
      if (Sound.muted) document.getElementById('btn-mute').click();
      say.querySelector('span').textContent = '🔊';
      Sound.speak(word);
    };
    say.focus();
    Sound.guide('听一听，按顺序点字母，拼出它的名字。');
    Sound.speak(word, { now: false });
    tiles.forEach(btn => btn.onclick = () => {
      if (!current() || !card.hidden || pos >= item.word.length) return;
      if (btn.dataset.ch !== item.word[pos]) {
        if (++mistakes === 3) { showWordCard(); return; }
        btn.classList.remove('spell-retry'); void btn.offsetWidth; btn.classList.add('spell-retry');
        feedback('👂 🔊 ↻', '再听一听，再试一次');
        Sound.speak(word, { now: false, dedupe: true });
        return;
      }
      slots[pos].className = 'sp-slot filled';
      slots[pos].textContent = btn.dataset.ch; slots[pos].setAttribute('aria-label', '第 ' + (pos + 1) + ' 个字母 ' + btn.dataset.ch);
      Sound.speak(btn.dataset.ch, { now: false }); pos++;
      if (pos < item.word.length) { slots[pos].classList.add('current'); feedback('👍 👆', '拼对了，继续试试下一个字母'); }
      else {
        feedback('🎉 ✓', '拼好了');
        disableInput(true);
        // This can be cancelled by closing the dialog, changing screen or switching profile.
        Sound.speak(word, { now: false, onDone: () => {
          if (current()) purchase(item);
        } });
      }
    });
  }
  function purchase(item) {
    const f = Store.farm();
    if (f.coins < item.price || missingLetters(item).length) { closeSpell(); return; }
    const plot = pendingPlot !== null && pendingPlot < f.plots.length && !f.plots[pendingPlot] ? pendingPlot : null;
    let purchased = false;
    Store.farm(g => {
      if (g.coins < item.price) return;
      if (item.kind === 'animal') {
        const animal = FarmEconomy.addAnimal(g, item.id);
        if (!animal) return;
        selected = animal.uid; curZone = ZONE_OF[item.id]; focusOnReturn = animal.uid;
      } else if (item.kind === 'seed') {
        const business = FarmEconomy.ensure(g);
        business.seeds[item.crop] = (business.seeds[item.crop] || 0) + 1;
        if (plot !== null) FarmEconomy.plant(g, plot, item.crop);
        curZone = 'field'; focusOnReturn = 'field';
      }
      else { g.food += item.gives.food || 0; g.water += item.gives.water || 0; }
      g.coins -= item.price; purchased = true;
    });
    if (!purchased) { closeSpell(); renderShop(); if (item.kind === 'animal') showAnimalLimit(item); return; }
    pendingPlot = null; spellToken++;
    document.getElementById('overlay-root').innerHTML = `<div class="farm-modal-backdrop"><section class="farm-dialog" role="dialog" aria-modal="true" aria-label="购买成功"><span class="dialog-symbol">🎉 ${item.emoji}</span><h2>${item.word}</h2><div class="picture-cue" aria-label="带回农场">${item.emoji} <i>→</i> 🏡</div><button class="farm-primary picture-action" id="purchase-home" aria-label="回农场看看"><span>🏡</span><small>回家</small></button><button class="farm-plain" id="spell-close" aria-label="继续逛商店">🧺 再逛逛</button></section></div>`;
    document.getElementById('purchase-home').onclick = () => App.show('farm');
    document.getElementById('spell-close').onclick = closeSpell;
    document.getElementById('purchase-home').focus();
    Confetti.celebrate(); Sound.speak('Well done!'); renderShop(); renderSell();
  }
  document.addEventListener('keydown', e => {
    const dialog = document.querySelector('.farm-dialog');
    if (!dialog) return;
    if (e.key === 'Escape') closeSpell();
    if (e.key === 'Tab') {
      const buttons = [...dialog.querySelectorAll('button:not(:disabled)')], first = buttons[0], last = buttons[buttons.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  function goZone(zone) {
    if (!ZONES[zone]) return;
    curZone = zone;
    const a = Store.farm().animals.find(a => (ZONE_OF[a.type] || 'pets') === zone);
    if (a) selectAnimal(a.uid);
    FarmMap.focusZone(zone);
  }
  return { goZone, openShop, enterFarm, enterShop, leave, renderFarmScene, renderShop, focusProduct, tapPlot, SHOP, missingLetters, state: () => ({ farm: Store.farm() }) };
})();
