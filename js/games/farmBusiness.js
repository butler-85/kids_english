/* Management panels and contextual farming actions. Transactions live in FarmEconomy. */
const FarmBusiness = (() => {
  const E = FarmEconomy;
  const money = n => `<span class="coin-icon" aria-label="金币">●</span> ${n}`;
  const itemRow = (f, order) => Object.entries(order.wants).map(([key, n]) => `<span class="order-item ${E.stock(f, key) >= n ? 'enough' : ''}" aria-label="${E.ITEMS[key].name}，已有 ${E.stock(f, key)}，需要 ${n}">${Array.from({ length: n }, (_, i) => `<i class="${i < E.stock(f, key) ? '' : 'item-missing'}" aria-hidden="true">${E.ITEMS[key].icon}</i>`).join('')}<small>${E.stock(f, key) >= n ? '✓' : '＋'}</small></span>`).join('');
  const questPictures = { plant: '👆 🌱', care: '🥣 💧 🖐️', harvest: '🌽 → 🧺', order: '🧺 → 🐿️', expand: '🌱 ＋ 🌱' };
  function orderCard(f, order) {
    const can = E.ready(f, order);
    return `<article class="neighbor-order"><header><span>${order.avatar}</span><div><h3>${order.name}</h3></div></header><div class="order-items">${itemRow(f, order)}</div><footer><span>${money(order.coins)} <small>⭐ ＋${order.xp}</small></span><button class="picture-action" data-deliver="${order.id}" aria-label="${can ? '把收获送给邻居' : '还缺少订单需要的物品'}" ${can ? '' : 'disabled'}><span>${can ? '🧺 → 🚚' : '🧺 ＋'}</span><small>${can ? '送到' : '收集中'}</small></button></footer></article>`;
  }
  function mount() {
    const f = Store.farm(), b = E.ensure(f), mission = E.mission(f), level = E.level(f);
    const header = document.getElementById('farm-business-header'); if (!header) return;
    header.innerHTML = `<div class="farm-management-bar"><div class="farm-level" aria-label="农场等级 ${level}"><span>⭐${level}</span><div><progress max="25" value="${b.xp % 25}" aria-label="农场等级进度"></progress></div></div><div class="farm-resources"><span>🥣 ${f.food}</span><span>💧 ${f.water}</span><span>🌱 ${Object.values(b.seeds).reduce((a, n) => a + n, 0)}</span></div><nav class="management-nav" aria-label="农场经营"><button class="picture-action" data-panel="orders" aria-label="邻居订单"><span>🚚</span><small>订单 ${b.orders.filter(o => E.ready(f, o)).length || ''}</small></button><button class="picture-action" data-panel="inventory" aria-label="仓库"><span>🧺</span><small>仓库</small></button><button class="picture-action" data-panel="build" aria-label="建设小屋"><span>🔨</span><small>建设</small></button><button class="picture-action" data-panel="zoo" aria-label="去动物园"><span>🦒</span><small>动物园</small></button></nav></div>
      ${mission ? `<div class="farm-quest"><span class="quest-icon">🎁</span><div><div class="scene-cue" aria-label="${mission.title}">${questPictures[mission.id]}</div><span class="quest-progress" aria-label="任务进度">${Array.from({ length: mission.goal }, (_, i) => i < (b.stats[mission.stat] || 0) ? '●' : '○').join(' ')}</span></div><button class="icon-button" id="farm-quest-listen" aria-label="听任务提示">🔊</button><button class="picture-action" id="farm-quest-action" data-mission="${mission.id}" aria-label="${(b.stats[mission.stat] || 0) >= mission.goal ? '领取奖励' : mission.title}"><span>${(b.stats[mission.stat] || 0) >= mission.goal ? '🎁 ＋' + mission.reward : '▶'}</span></button></div>` : '<div class="farm-quest complete" aria-label="新手任务完成">🌟 ✓ 🎉</div>'}`;
    header.querySelectorAll('[data-panel]').forEach(btn => btn.onclick = () => open(btn.dataset.panel));
    header.querySelector('#farm-quest-listen')?.addEventListener('click', () => Sound.guide(mission.hint));
    header.querySelector('#farm-quest-action')?.addEventListener('click', () => {
      if ((b.stats[mission.stat] || 0) >= mission.goal) {
        let ok; Store.farm(g => ok = E.claim(g, mission.id));
        if (ok) { Sound.sfx('star'); Pets.renderFarmScene(); Sound.speak('Well done!', { now: false }); }
      } else if (['orders', 'build'].includes(mission.action)) open(mission.action);
      else { Pets.goZone(mission.action); Sound.guide(mission.hint); }
    });
    document.getElementById('farm-business-bottom').innerHTML = `<section class="farm-order-board"><div class="board-heading"><h2>🚚 邻居订单</h2><span aria-label="已完成 ${b.stats.delivered || 0} 单">✓ ${b.stats.delivered || 0}</span></div><div class="neighbor-orders">${b.orders.map(o => orderCard(f, o)).join('')}</div></section>`;
    bindOrders(document.getElementById('farm-business-bottom'));
  }
  function bindOrders(root) {
    root.querySelectorAll('[data-deliver]').forEach(btn => btn.onclick = () => {
      let order; Store.farm(f => order = E.deliver(f, +btn.dataset.deliver));
      if (!order) return;
      Sound.sfx('win'); App.toast('🚚 ✓ ＋' + money(order.coins));
      Sound.speak('Delivery! Thank you!', { now: false });
      const modal = !!root.closest('.farm-dialog'); Pets.renderFarmScene(); if (modal) open('orders');
    });
  }
  function modal(title, subtitle, content, guide, announce = true) {
    const root = document.getElementById('overlay-root');
    root.innerHTML = `<div class="farm-modal-backdrop"><section class="farm-dialog management-dialog" role="dialog" aria-modal="true" aria-labelledby="business-title"><header class="business-heading"><div><h2 id="business-title">${title}</h2>${subtitle ? '<div class="scene-cue">' + subtitle + '</div>' : ''}</div>${guide ? '<button id="business-listen" aria-label="听玩法提示">🔊</button>' : ''}<button id="business-close" aria-label="关闭面板">×</button></header>${content}</section></div>`;
    document.getElementById('business-close').onclick = close;
    document.getElementById('business-close').focus();
    if (guide) {
      document.getElementById('business-listen').onclick = () => Sound.guide(guide);
      if (announce) Sound.guide(guide, { now: false, dedupe: true });
    }
    return root.querySelector('.farm-dialog');
  }
  function close() { Sound.stop(); document.getElementById('overlay-root').innerHTML = ''; }
  function open(panel) {
    const f = Store.farm(), b = E.ensure(f);
    if (panel === 'zoo') { App.show('zoo'); return; }
    if (panel === 'orders') {
      const root = modal('🚚 送给邻居', '🌽 🧺 → 🐿️ → ' + money(''), `<div class="neighbor-orders">${b.orders.map(o => orderCard(f, o)).join('')}</div>`, '邻居想要这些好吃的。收齐图片里的东西，点小车送给它。');
      bindOrders(root);
    } else if (panel === 'inventory') {
      const items = Object.entries(E.ITEMS).map(([key, item]) => {
        const count = E.stock(f, key), total = count * item.price;
        return `<article><span aria-hidden="true">${item.icon}</span><b>${item.name}</b><strong>× ${count}</strong>
          <small>${item.price} 金币／份</small>
          <button data-sell-stock="${key}" aria-label="卖出全部${item.name}，获得 ${total} 金币" ${count > 0 ? '' : 'disabled'}>卖出全部<br>${money(total)}</button>
        </article>`;
      });
      const root = modal('🧺 仓库', '🌽 🥚 🍯', `<div class="inventory-grid">${items.join('')}</div><h3 class="inventory-heading">🌱 🥣 💧</h3><div class="supply-inventory">${['nut', 'bean', 'corn'].map(key => `<span aria-label="${E.ITEMS[key].name}种子">${E.ITEMS[key].icon}<b>×${b.seeds[key] || 0}</b></span>`).join('')}<span>🥣 <b>×${f.food}</b></span><span>💧 <b>×${f.water}</b></span></div><button class="farm-primary picture-action" id="inventory-shop" aria-label="去商店补货"><span>🧺 ＋</span><small>去商店</small></button>`, '这些都是你的收获。点卖出，就能换金币。');
      root.querySelectorAll('[data-sell-stock]').forEach(btn => btn.onclick = () => {
        const key = btn.dataset.sellStock;
        let count; Store.farm(g => count = E.sell(g, key));
        if (!count) return;
        Pets.renderFarmScene();
        open('inventory');
        Sound.sfx('star');
        App.toast('＋' + money(count * E.ITEMS[key].price));
      });
      root.querySelector('#inventory-shop').onclick = () => Pets.openShop('seed');
    } else if (panel === 'build') {
      const root = modal('🔨 建设', `⭐ ${E.level(f)} · 🌱 ${f.plots.length} · ${money(f.coins)}`, `<div class="building-grid">${['beds', 'coop', 'irrigation'].map(kind => {
        const info = E.upgradeInfo(f, kind), enoughLevel = E.level(f) >= info.level;
        return `<article><span>${info.icon}</span><h3>${info.title}</h3><div class="scene-cue" aria-label="${info.description}">${kind === 'beds' ? '🌱 ＋ 🌱' : kind === 'coop' ? '🐣 → 🏡' : '💧 → 🌱'}</div><details class="parent-note"><summary>ⓘ</summary><p>${info.description}</p></details><small>${info.maxed ? '✓' : '⭐ ' + info.level}</small><button data-build="${kind}" aria-label="${info.maxed ? '已经建好' : !enoughLevel ? '需要农场等级 ' + info.level : f.coins < info.price ? '金币不足' : '建造' + info.title}" ${info.maxed || !enoughLevel || f.coins < info.price ? 'disabled' : ''}>${info.maxed ? '✓' : !enoughLevel ? '🔒 ⭐' + info.level : f.coins < info.price ? '＋' + money(info.price - f.coins) : '🔨 ' + money(info.price)}</button></article>`;
      }).join('')}</div>`, '想让农场变大吗？可以多建几块地，也可以给小动物盖房子。');
      root.querySelectorAll('[data-build]').forEach(btn => btn.onclick = () => {
        let ok; Store.farm(g => ok = E.upgrade(g, btn.dataset.build));
        if (ok) { Pets.renderFarmScene(); open('build'); Confetti.celebrate(); Sound.speak('A bigger farm!', { now: false }); }
      });
    }
  }
  function plantDialog(index) {
    const f = Store.farm(), b = E.ensure(f);
    const root = modal('🌱 种什么？', '👆 🌰 → 🌱', `<div class="seed-picker">${['nut', 'bean', 'corn'].map(key => `<button data-plant="${key}" aria-label="种${E.ITEMS[key].name}" ${b.seeds[key] ? '' : 'disabled'}><span>${E.ITEMS[key].icon}</span><b>${E.ITEMS[key].name}</b><small>×${b.seeds[key] || 0}</small></button>`).join('')}</div><button class="farm-primary picture-action" id="seed-shop" aria-label="去商店买种子"><span>🧺 🌱 ＋</span><small>买种子</small></button>`, '点一个图片，把种子种进土里。');
    root.querySelectorAll('[data-plant]').forEach(btn => btn.onclick = () => {
      let ok; Store.farm(g => ok = E.plant(g, index, btn.dataset.plant));
      if (ok) { close(); Pets.renderFarmScene(); Sound.sfx('tap'); Sound.speak('Plant the ' + E.ITEMS[btn.dataset.plant].word + '!', { now: false }); }
    });
    root.querySelector('#seed-shop').onclick = () => Pets.openShop('seed');
  }
  function growingDialog(index, announce = true) {
    const f = Store.farm(), p = f.plots[index]; if (!p) return;
    const state = E.cropState(p);
    if (!state) return;
    const item = E.ITEMS[p.crop], cost = E.cropWaterCost(f);
    const guide = state.mature ? '已经成熟了，点篮子收获吧。'
      : state.legacy ? (state.watered ? '浇好水啦，等它慢慢长大。' : '点水滴，给作物浇水。')
      : state.watered ? '今天浇好啦，明天长大一点。' : '今天浇水，明天就能长大一点。';
    const button = state.mature
      ? '<button class="farm-primary picture-action" id="harvest-crop"><span>🧺</span><small>收获</small></button>'
      : state.watered
        ? '<button class="farm-primary picture-action" id="water-crop" disabled><span>💧 ✓</span><small>浇好啦</small></button>'
        : f.water < cost
          ? '<button class="farm-primary picture-action" id="shop-water"><span>💧 ＋</span><small>去买水</small></button>'
          : `<button class="farm-primary picture-action" id="water-crop" aria-label="${cost ? '浇水，消耗一份水' : '用灌溉站免费浇水'}"><span>💧 → 🌱</span><small>浇水</small></button>`;
    const stageLabel = E.CROP_STAGES[state.stage - 1];
    const root = modal(item.icon + ' ' + item.name, `${stageLabel} · ${state.stage}/${E.CROP_STAGES.length}`, `<div class="crop-detail">${FarmArt.crop(p.crop, state.stage)}<p>${guide}</p>${button}</div>`, guide, announce);
    root.dataset.cropPlot = index;
    root.querySelector('#harvest-crop')?.addEventListener('click', () => { close(); Pets.tapPlot(index); });
    root.querySelector('#shop-water')?.addEventListener('click', () => Pets.openShop('supply'));
    root.querySelector('#water-crop')?.addEventListener('click', () => {
      let ok; Store.farm(g => ok = E.waterPlot(g, index));
      if (ok) { close(); Pets.renderFarmScene(); Sound.sfx('drink'); Sound.speak('Water the plant!', { now: false }); }
    });
  }
  function refreshCropDialog(f, now) {
    const dialog = document.querySelector('.farm-dialog[data-crop-plot]');
    if (!dialog) return;
    const index = +dialog.dataset.cropPlot, state = E.cropState(f.plots[index], now);
    if (!state) close();
    else if (+dialog.querySelector('.crop-art').dataset.stage !== state.stage) growingDialog(index, false);
  }
  function productionMarkup(f, uid) {
    const p = E.production(f, uid); if (!p) return '';
    const item = E.ITEMS[p.item];
    if (p.action) {
      const progress = p.count ? '准备好啦' : `${p.careDays}/${p.days} 天`;
      return `<div class="animal-production livestock-production"><span aria-hidden="true">${item.icon}</span><div><b>${p.count ? progress : item.name + ' · ' + progress}</b><small>${p.count ? '可收获 1 份' : '每天喂食、喂水'}</small></div><button class="picture-action" data-collect="${uid}" aria-label="${p.label}" ${p.count ? '' : 'disabled'}>${p.label}</button></div>`;
    }
    return `<div class="animal-production"><span aria-hidden="true">${item.icon}</span><div><b>${item.name}</b><small>${p.count ? '地上有 ' + p.count + ' 份' : '每天产出 1 份'}</small></div></div>`;
  }
  function livestockCollection(type, product) {
    const item = E.ITEMS[product.item];
    const root = modal(product.label, '',
      `<div class="livestock-collection" data-collect-action="${product.action}">
        ${FarmArt.animal(type, true, product.action === 'shear')}
        <p class="livestock-result" role="status">${item.icon} ${item.name} 已放在草地上</p>
        <button id="livestock-done" class="farm-primary picture-action">去草地上捡</button>
      </div>`);
    root.classList.add('livestock-dialog');
    root.querySelector('#livestock-done').onclick = () => { close(); Pets.focusProduct(product.item); };
    Sound.stop();
    Sound.sfx(product.action);
  }
  function bindProduction(root) {
    root.querySelectorAll('[data-collect]').forEach(btn => btn.onclick = () => {
      const uid = btn.dataset.collect;
      const type = Store.farm().animals.find(a => a.uid === uid)?.type;
      if (!type) return;
      let p; Store.farm(f => p = E.prepareLivestockProduct(f, uid));
      if (!p) return;
      Pets.renderFarmScene();
      livestockCollection(type, p);
    });
  }
  return { mount, open, plantDialog, growingDialog, refreshCropDialog, productionMarkup, bindProduction };
})();
