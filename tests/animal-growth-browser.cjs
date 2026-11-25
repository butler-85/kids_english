const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createServer } = require('./preview.cjs');
(async () => {
  const server = createServer(); await new Promise(r => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
    const page = await context.newPage(), errors = [];
    const careDate = new Date(2026, 10, 9, 12);
    await page.clock.setFixedTime(careDate);
    page.on('pageerror', e => errors.push(e.message));
    const origin = 'http://127.0.0.1:' + server.address().port;
    await page.goto(origin); await page.waitForFunction(() => window.__abc?.Profiles.mode === 'local');
    await page.locator('[data-target="farm"]').click();
    fs.mkdirSync('test-results', { recursive: true });
    await page.setViewportSize({ width: 320, height: 800 });
    await page.waitForFunction(() => !document.querySelector('.toast'));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'daily guide fits small phones');
    await page.locator('#farm-care').screenshot({ path: 'test-results/animal-growth-daily-care-mobile.png' });
    await page.setViewportSize({ width: 1440, height: 1100 });
    const pairs = await page.evaluate(() => {
      const pairs = {};
      __abc.Store.farm(f => {
        f.animals = []; f.care = {}; f.food = f.water = 100;
        for (const type of ['chick', 'cat', 'dog', 'bee', 'fish']) {
          const young = __abc.FarmEconomy.addAnimal(f, type), adult = __abc.FarmEconomy.addAnimal(f, type);
          for (let day = 2; day >= 0; day--) {
            const now = new Date(Date.now()); now.setDate(now.getDate() - day);
            for (const kind of ['food', 'water']) __abc.FarmEconomy.careAnimal(f, adult.uid, kind, +now);
          }
          pairs[type] = [young.uid, adult.uid];
        }
      });
      __abc.Pets.renderFarmScene(); __abc.Sound.stop();
      return pairs;
    });
    const modes = { chick: ['happyhop', 'winghug'], cat: ['kittenroll', 'bellyroll'], dog: ['puppydance', 'loyalspin'], bee: ['heartloop', 'flowerheart'], fish: ['bubblekiss', 'heartfin'] };
    const prices = { chick: 20, cat: 34, dog: 34, bee: 26, fish: 26 };
    async function select(uid) {
      await page.evaluate(uid => __abc.FarmMap.focusAnimal(uid), uid);
      await page.locator('[data-animal="' + uid + '"]').click();
    }
    for (const [type, uids] of Object.entries(pairs)) {
      for (let stage = 0; stage < 2; stage++) {
        const uid = uids[stage], button = page.locator('[data-animal="' + uid + '"]');
        assert.equal(await button.locator('svg').getAttribute('data-age'), stage ? 'adult' : 'young');
        await select(uid);
        const before = await page.evaluate(uid => ({ growth: __abc.Store.farm().care[uid].growth, quote: __abc.FarmEconomy.animalQuote(__abc.Store.farm(), uid) }), uid);
        for (let i = 0; i < 5; i++) await page.locator('[data-scene-care="pet"]').click();
        assert.equal(await button.getAttribute('data-behavior'), modes[type][stage]);
        assert.equal(await page.evaluate(uid => __abc.Store.farm().care[uid].growth, uid), before.growth);
        assert.equal(await page.evaluate(uid => __abc.Store.farm().care[uid].affection, uid), 5);
        assert.deepEqual(await page.evaluate(uid => __abc.FarmEconomy.animalQuote(__abc.Store.farm(), uid), uid), before.quote);
        assert.equal(await page.locator('.care-affection .full').count(), 5);
      }
      // Three calendar days of paired care change the sprite/name, preserving friendship and identity.
      const uid = uids[0]; await select(uid);
      assert.equal(await page.locator('.care-growth .need-pip').count(), 3);
      for (let day = 0; day < 3; day++) {
        if (day) {
          careDate.setDate(careDate.getDate() + 1); await page.clock.setFixedTime(careDate);
          // The open farm refreshes at midnight without a reload or a test-driven rerender.
          await page.waitForFunction(() => !document.querySelector('[data-scene-care="food"]').disabled);
        }
        assert.equal(await page.locator('.care-growth .full').count(), day, 'a new date alone cannot grow an animal');
        const order = day % 2 ? ['water', 'food'] : ['food', 'water'];
        for (const [index, kind] of order.entries()) {
          const stock = await page.evaluate(kind => __abc.Store.farm()[kind], kind);
          await page.locator('[data-scene-care="' + kind + '"]').click();
          assert.equal(await page.locator('[data-scene-care="' + kind + '"]').isDisabled(), true);
          assert.equal(await page.locator('[data-care="' + kind + '"]').isDisabled(), true);
          assert.equal(await page.evaluate(kind => __abc.Store.farm()[kind], kind), stock - 1);
          assert.equal(await page.locator('.care-growth .full').count(), day + index);
          const saved = await page.evaluate(() => JSON.stringify(__abc.Store.farm()));
          await page.locator('[data-scene-care="' + kind + '"]').evaluate(el => el.click());
          assert.equal(await page.evaluate(() => JSON.stringify(__abc.Store.farm())), saved);
          if (type === 'chick' && day === 0 && index === 0) {
            await page.reload(); await page.waitForFunction(() => window.__abc?.Profiles.mode === 'local');
            await page.locator('[data-target="farm"]').click(); await select(uid);
            assert.equal(await page.locator('[data-scene-care="food"]').isDisabled(), true);
            assert.equal(await page.locator('[data-scene-care="water"]').isEnabled(), true);
          }
        }
        assert.equal(await page.locator('.daily-care .done').count(), 2);
        assert.equal(await page.locator('[data-animal="' + uid + '"] .animal-need').count(), 0);
      }
      assert.equal(await page.locator('[data-animal="' + uid + '"] svg').getAttribute('data-age'), 'adult');
      assert.equal(await page.locator('.care-portrait svg').getAttribute('data-age'), 'adult');
      if(type === 'chick') assert.match(await page.locator('#farm-care h2').innerText(), /母鸡/);
      const q = await page.evaluate(uid => __abc.FarmEconomy.animalQuote(__abc.Store.farm(), uid), uid);
      assert.equal(q.price, prices[type]); assert.equal(q.profitRate, 1); assert.equal(q.growCost, 5);
      assert.match(await page.locator('#care-sell').getAttribute('aria-label'), new RegExp(prices[type] + ' 金币'));
      await page.locator('[data-scene-care="pet"]').click();
      assert.equal(await page.locator('[data-animal="' + uid + '"]').getAttribute('data-behavior'), modes[type][1]);
    }
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await select(pairs.cat[0]); await page.locator('[data-scene-care="pet"]').click();
    assert.equal(await page.locator('.care-portrait .creature-pose').evaluate(el => getComputedStyle(el).animationName), 'cat-roll');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.locator('.care-portrait .creature-pose').evaluate(el => getComputedStyle(el).animationName), 'none');
    await page.setViewportSize({ width: 390, height: 844 });
    await select(pairs.fish[0]);
    await page.waitForFunction(() => !document.querySelector('.toast'));
    await page.locator('#farm-care').screenshot({ path: 'test-results/animal-growth-care-mobile.png' });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.reload(); await page.waitForFunction(() => window.__abc?.Profiles.mode === 'local');
    await page.locator('[data-target="farm"]').click();
    await select(pairs.fish[0]);
    assert.equal(await page.locator('[data-care="food"]').isDisabled(), true);
    assert.equal(await page.locator('[data-care="water"]').isDisabled(), true);
    await select(pairs.chick[0]);
    assert.equal(await page.evaluate(uid => __abc.Store.farm().care[uid].affection, pairs.chick[0]), 5);
    assert.match(await page.locator('#farm-care h2').innerText(), /母鸡/);
    await page.locator('#care-shop').click(); await page.locator('#shop-sell summary').click();
    const coins = await page.evaluate(() => __abc.Store.farm().coins);
    page.once('dialog', d => d.accept()); await page.locator('[data-sell="animal"][data-uid="' + pairs.chick[0] + '"]').click();
    assert.equal(await page.evaluate(() => __abc.Store.farm().coins), coins + 20);
    assert.equal(await page.evaluate(() => __abc.FarmEconomy.animalCapacity(__abc.Store.farm(), 'chick').count), 1);
    const gallery = await page.evaluate(() => ['chick','cat','dog','bee','fish'].map(type => ({type,young:FarmArt.animal(type,false),adult:FarmArt.animal(type,true)})));
    const preview = await context.newPage(); await preview.setViewportSize({width:1100,height:650});
    await preview.setContent(`<html lang="zh"><head><link rel="stylesheet" href="${origin}/css/farm-life.css?v=48"><link rel="stylesheet" href="${origin}/css/farm-growth.css?v=48"><style>body{margin:0;padding:28px;background:#f8f5e9;font-family:Arial,'Microsoft YaHei',sans-serif;color:#506544}h1{font-size:24px;margin:0 0 22px}main{display:grid;grid-template-columns:repeat(5,1fr);gap:14px}article{padding:14px;background:#fffdf6;border:1px solid #dce3cc;border-radius:22px;text-align:center}h2{font-size:16px;margin:0 0 8px}svg{width:150px;height:150px;display:block;margin:auto}small{display:block;color:#81916d;font-size:14px}.arrow{font-size:22px;margin:5px}</style></head><body><h1>长大了，会变成什么样？</h1><main>${gallery.map((g,i)=>`<article><h2>${['小鸡 → 母鸡','小猫 → 猫咪','小狗 → 狗狗','小蜜蜂 → 蜜蜂','小鱼 → 大鱼'][i]}</h2>${g.young}<small>幼年</small><div class="arrow">↓</div>${g.adult}<small>成年</small></article>`).join('')}</main></body></html>`);
    fs.mkdirSync('test-results',{recursive:true}); await preview.screenshot({path:'test-results/animal-growth-comparison.png'});
    assert.deepEqual(errors,[]);
    console.log('PASS: ten age forms and friendship responses, three-day paired-care maturation, per-day limits, midnight UI rollover, saved partial/full care, exact 100% resale profit, reduced motion, selling and mobile care layout.');
  } finally { await browser.close(); server.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
