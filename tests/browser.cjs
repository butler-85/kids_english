const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createServer } = require('./preview.cjs');

(async () => {
  const server = createServer(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
    await context.addInitScript(() => {
      let active = null;
      window.__spoken = [];
      Object.defineProperty(window, 'speechSynthesis', { value: {
        speaking: false, pending: false, paused: false,
        getVoices: () => [], addEventListener() {}, resume() {},
        cancel() { if (active) { clearTimeout(active.timer); active = null; } this.speaking = this.pending = false; },
        speak(u) {
          window.__spoken.push(u.text); this.speaking = true; u.onstart?.();
          const job = active = { timer: setTimeout(() => { if (active !== job) return; active = null; this.speaking = false; u.onend?.(); }, 35) };
        },
      } });
    });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:' + server.address().port);
    await page.waitForFunction(() => window.__abc?.Profiles.mode === 'guest' || window.__abc?.Store.profileId === 'guest');
    await page.locator('[data-target="farm"]').click();
    await page.locator('#farm-business-header').waitFor();
    assert.equal(await page.evaluate(() => __abc.Store.farm().coins), 50);
    await page.locator('#care-shop').click();
    await page.locator('[data-item="bee"]').click();
    await page.locator('#spell-learn').waitFor();
    await page.locator('#spell-close').click();
    // Unlock letters in this isolated browser profile, never the user's saved farm.
    await page.evaluate(() => __abc.Store.mutateLetters(ls => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(L => ls[L] = { correct: 5, seen: 1, wrong: 0 })));
    await page.locator('[data-item="bee"]').click();
    // The child must recall the spelling: no answer template or next-letter caption.
    assert.equal(await page.locator('.sp-slot:empty').count(), 3);
    assert.equal(await page.locator('.sp-slot').allTextContents().then(parts => parts.join('')), '');
    assert.equal((await page.locator('.farm-dialog').innerText()).includes('BEE'), false);
    assert.equal((await page.locator('[data-item="bee"]').innerText()).includes('BEE'), false);
    assert.ok(await page.locator('.sp-tile').count() > 2, 'letter tray includes distractors');
    const card = page.locator('.spell-word-card');
    const checkWordCard = async (trigger, expected, spoken = true) => {
      await trigger.evaluate(el => el.addEventListener('click', () => { window.__spoken.length = 0; }, { capture: true, once: true }));
      await trigger.click();
      await card.waitFor({ state: 'visible' });
      assert.equal(await card.locator('strong').textContent(), expected);
      assert.equal(await page.locator('.spell-slots').isVisible(), false);
      assert.equal(await page.locator('.sp-tile:not(:disabled)').count(), 0, 'spelling is locked while the whole word is visible');
      assert.equal(await page.locator('#spell-say').isDisabled(), true);
      assert.equal(await page.locator('#spell-hint').isDisabled(), true);
      assert.equal(await page.locator('.farm-dialog').evaluate(el => el.scrollWidth > el.clientWidth), false);
      await card.waitFor({ state: 'hidden' });
      assert.deepEqual(await page.evaluate(() => __spoken), spoken ? [expected.toLowerCase()] : []);
      assert.equal(await page.locator('.sp-slot:empty').count(), expected.length);
      assert.equal(await page.locator('.sp-slot.current').getAttribute('aria-label'), '第 1 个字母，空白');
      assert.equal(await page.locator('.spell-retry, .sp-slot.filled').count(), 0);
      assert.equal((await page.locator('.farm-dialog').innerText()).includes(expected), false);
      assert.match(await page.locator('#spell-feedback').innerText(), /从头再拼/);
    };
    const bTile = page.locator('[data-ch="B"]'), eTile = page.locator('[data-ch="E"]');
    await bTile.click();
    await page.locator('#spell-say').click();
    assert.deepEqual(await page.locator('.sp-slot').allTextContents(), ['B', '', '']);
    await checkWordCard(page.locator('#spell-hint'), 'BEE');
    await eTile.click();
    await eTile.click();
    assert.equal(await card.isVisible(), false, 'the first two errors reveal nothing');
    await bTile.click();
    assert.deepEqual(await page.locator('.sp-slot').allTextContents(), ['B', '', '']);
    // The third mistake still counts after a correct letter.
    await checkWordCard(bTile, 'BEE');
    assert.equal(await page.evaluate(() => __abc.Store.farm().coins), 50);
    assert.equal(await page.evaluate(() => __abc.Store.farm().animals.length), 1);
    await eTile.click();
    assert.equal(await card.isVisible(), false, 'a restart resets the mistake count');
    assert.match(await page.locator('#spell-feedback').getAttribute('aria-label'), /再听一听/);
    for (const ch of 'BEE') await page.locator('[data-ch="' + ch + '"]').click();
    await page.locator('#purchase-home').waitFor();
    assert.equal(await page.evaluate(() => __abc.Store.farm().coins), 42);
    assert.equal(await page.evaluate(() => __abc.Store.farm().animals.length), 2);
    await page.locator('#purchase-home').click();
    await page.locator('[data-care="pet"]').click();
    assert.equal(await page.evaluate(() => Object.values(__abc.Store.farm().care)[1].growth), 0);
    assert.equal(await page.evaluate(() => Object.values(__abc.Store.farm().care)[1].affection), 1);
    // No food opens the supplies category, then one successful feed consumes exactly one unit.
    await page.evaluate(() => { __abc.Store.farm(f => f.food = 0); __abc.Pets.renderFarmScene(); });
    await page.locator('[data-care="food"]').click();
    await page.locator('[data-item="food"]').click();
    for (const ch of 'FEED') await page.locator('[data-ch="' + ch + '"]').click();
    await page.locator('#purchase-home').click();
    await page.locator('[data-care="food"]').click();
    assert.equal(await page.evaluate(() => __abc.Store.farm().food), 2);
    assert.equal(await page.locator('[data-care="food"]').isDisabled(), true);
    // Buying the same species again adds a new companion and never resets the first one's care.
    const firstBee = await page.evaluate(() => __abc.Store.farm().animals.find(a => a.type === 'bee').uid);
    const firstBeeCare = await page.evaluate(uid => ({ ...__abc.Store.farm().care[uid] }), firstBee);
    const repeatCoins = await page.evaluate(() => __abc.Store.farm().coins);
    await page.locator('#care-shop').click();
    assert.equal(await page.locator('[data-item="bee"]').isEnabled(), true);
    assert.match(await page.locator('[data-item="bee"]').getAttribute('aria-label'), /已养 1 只/);
    await page.locator('[data-item="bee"]').click();
    for (const ch of 'BEE') await page.locator('[data-ch="' + ch + '"]').click();
    await page.locator('#purchase-home').click();
    const secondBee = await page.evaluate(first => __abc.Store.farm().animals.find(a => a.type === 'bee' && a.uid !== first).uid, firstBee);
    assert.notEqual(firstBee, secondBee);
    assert.equal(await page.evaluate(() => __abc.Store.farm().coins), repeatCoins - 8);
    assert.equal(await page.locator('.farm-animal').count(), 3);
    assert.equal(await page.locator('.farm-animal.selected').getAttribute('data-animal'), secondBee);
    assert.match(await page.locator('#farm-care h2').innerText(), /蜜蜂 2号/);
    await page.locator('[data-care="food"]').click();
    assert.deepEqual(await page.evaluate(uid => __abc.Store.farm().care[uid], firstBee), firstBeeCare);
    assert.equal(await page.evaluate(uid => __abc.Store.farm().care[uid].growth, secondBee), 0);
    await page.evaluate(uid => __abc.FarmMap.focusAnimal(uid), firstBee);
    await page.locator('[data-animal="' + firstBee + '"]').click();
    assert.match(await page.locator('#farm-care h2').innerText(), /蜜蜂 1号/);
    // Empty bed links to seeds, purchase plants in the tapped bed.
    await page.locator('[data-zone="field"]').click();
    await page.locator('[data-plot="4"]').click();
    await page.locator('#seed-shop').click();
    await page.locator('[data-item="seed-nut"]').click();
    for (const ch of 'NNT') await page.locator('[data-ch="' + ch + '"]').click();
    await checkWordCard(page.locator('[data-ch="N"]'), 'NUT');
    assert.equal(await page.evaluate(() => __abc.Store.farm().plots[4]), null);
    for (const ch of 'NUT') await page.locator('[data-ch="' + ch + '"]').click();
    await page.locator('#purchase-home').click();
    assert.equal(await page.evaluate(() => __abc.Store.farm().plots[4].crop), 'nut');
    const plot = page.locator('[data-plot="4"]'), cropDialog = page.locator('[data-crop-plot="4"]');
    const waterCrop = page.locator('#water-crop');
    const cropArt = new Set();
    await page.evaluate(() => __abc.Store.farm(f => { f.water += 4; }));
    const realNow = Date.now();
    for (let stage = 1; stage <= 4; stage++) {
      await page.clock.setFixedTime(await page.evaluate(n => new Date(2026, 6, n, 12).getTime(), stage));
      await plot.locator(`[data-stage="${stage}"]`).waitFor();
      cropArt.add(await plot.locator('.crop-art').innerHTML());
      await plot.click();
      assert.equal(await cropDialog.locator('.crop-art').getAttribute('data-stage'), String(stage));
      await waterCrop.click();
      assert.equal(await plot.locator('.crop-art').getAttribute('data-stage'), String(stage));
      await plot.click();
      assert.equal(await waterCrop.isDisabled(), true);
      if (stage !== 4) await page.locator('#business-close').click();
    }
    await page.clock.setFixedTime(await page.evaluate(() => new Date(2026, 6, 5, 12).getTime()));
    await plot.locator('[data-stage="5"]').waitFor();
    cropArt.add(await plot.locator('.crop-art').innerHTML());
    assert.equal(cropArt.size, 5, 'the same crop has five distinct drawings');
    await page.locator('#harvest-crop').waitFor();
    await page.locator('#business-close').click();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await plot.click();
    const harvestScene = plot.locator('.harvest-scene');
    const animation = await harvestScene.evaluate(scene => ({
      fruit: scene.querySelectorAll('.harvest-fruit').length,
      basket: scene.querySelector('.harvest-basket').textContent,
      fruitAnimation: getComputedStyle(scene.querySelector('.harvest-fruit')).animationName,
      basketAnimation: getComputedStyle(scene.querySelector('.harvest-basket')).animationName,
    }));
    assert.deepEqual(animation, {
      fruit: 3, basket: '🧺', fruitAnimation: 'harvest-fruit', basketAnimation: 'harvest-basket',
    });
    await plot.evaluate(bed => bed.click());
    assert.equal(await page.locator('.farm-dialog').count(), 0, 'a second click cannot harvest again or plant mid-animation');
    assert.equal(await page.evaluate(() => __abc.Store.farm().fruit.nut), 3, 'the harvest is saved before the animation ends');
    await harvestScene.waitFor({ state: 'detached' });
    assert.equal(await plot.isEnabled(), true);
    assert.match(await plot.getAttribute('aria-label'), /空地/);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.clock.setFixedTime(realNow);
    assert.equal(await page.evaluate(() => __abc.Store.farm().fruit.nut), 3);
    assert.equal(await page.evaluate(() => __abc.Store.farm().plots[4]), null);
    // Closing a completed spelling before narration ends must not purchase anything.
    await page.locator('[data-plot="0"]').click();
    await page.locator('#seed-shop').click();
    await page.locator('[data-item="seed-corn"]').click();
    const coinsBefore = await page.evaluate(() => __abc.Store.farm().coins);
    await page.evaluate(() => { for (const ch of 'CORN') document.querySelector('[data-ch="' + ch + '"]').click(); document.querySelector('#spell-close').click(); });
    await page.waitForTimeout(350);
    assert.equal(await page.evaluate(() => __abc.Store.farm().coins), coinsBefore);
    // Orders consume harvested stock, expansion adds usable beds, production persists after reload.
    await page.locator('#btn-tofarm').click();
    const orderId = await page.evaluate(() => __abc.Store.farm().business.orders[0].id);
    await page.locator('#farm-business-bottom [data-deliver="' + orderId + '"]').click();
    assert.equal(await page.evaluate(() => __abc.Store.farm().business.stats.delivered), 1);
    assert.equal(await page.evaluate(() => __abc.Store.farm().fruit.nut), 1);
    await page.evaluate(() => { __abc.Store.farm(f => { f.business.xp = 25; f.coins = 90; }); __abc.Pets.renderFarmScene(); });
    await page.locator('[data-panel="build"]').click();
    await page.locator('[data-build="beds"]').click();
    assert.equal(await page.evaluate(() => __abc.Store.farm().plots.length), 9);
    await page.locator('#business-close').click();
    await page.locator('[data-zone="field"]').click();
    await page.locator('[data-plot="8"]').click();
    await page.locator('[data-plant="nut"]').click();
    await page.locator('[data-plot="8"]').click();
    await page.locator('#water-crop').click();
    assert.equal(await page.evaluate(() => __abc.FarmEconomy.cropState(__abc.Store.farm().plots[8]).watered), true);
    await page.evaluate(() => {
      __abc.Store.farm(f => {
        f.care['starter-chick'].growth = 5;
        f.business.production['starter-chick'] = { readyAt: Date.now() - 1 };
      });
      __abc.Pets.renderFarmScene();
    });
    const stock = item => page.evaluate(item => __abc.FarmEconomy.stock(__abc.Store.farm(), item), item);
    const pickup = item => page.locator('#farm-map-world [data-pickup="' + item + '"]');
    assert.equal(await pickup('egg').count(), 1);
    assert.equal(await stock('egg'), 0);
    await page.locator('[data-panel="inventory"]').click();
    assert.equal(await page.locator('[data-sell-stock="egg"]').isDisabled(), true);
    await page.locator('#business-close').click();
    await page.reload();
    await page.waitForFunction(() => window.__abc?.Profiles.mode === 'local');
    await page.locator('[data-target="farm"]').click();
    assert.equal(await stock('egg'), 0, 'an uncollected product survives the reload on the ground');
    await page.locator('[data-find-product="egg"]').click();
    assert.equal(await stock('egg'), 0, 'finding the pile only moves the camera');
    await pickup('egg').dblclick();
    assert.equal(await stock('egg'), 1);
    assert.equal(await pickup('egg').count(), 0);
    assert.equal(await page.evaluate(() => __abc.Store.farm().plots.length), 9);
    assert.equal(await page.evaluate(() => __abc.Store.farm().business.seeds.nut), 2);
    assert.equal(await page.evaluate(() => __abc.FarmEconomy.cropState(__abc.Store.farm().plots[8]).watered), true);
    assert.deepEqual(await page.evaluate(uid => __abc.Store.farm().care[uid], firstBee), firstBeeCare);
    assert.equal(await page.evaluate(uid => __abc.Store.farm().care[uid].growth, secondBee), 0);
    // Each mature bee owns its production clock. A shared pile does not reset either clock.
    await page.evaluate(([first, second]) => {
      __abc.Store.farm(f => {
        f.care[first].growth = 5; f.care[second].growth = 4;
        f.care[second].dailyCare = { day: __abc.FarmEconomy.careDay(), food: false, water: true, grew: false };
        f.business.production[first] = { readyAt: Date.now() - 100 };
      }); __abc.Pets.goZone('field');
    }, [firstBee, secondBee]);
    await page.evaluate(uid => __abc.FarmMap.focusAnimal(uid), secondBee);
    await page.locator('[data-animal="' + secondBee + '"]').click();
    await page.locator('[data-care="food"]').click();
    assert.equal(await page.evaluate(uid => __abc.Store.farm().care[uid].growth, secondBee), 5);
    const secondClock = await page.evaluate(uid => __abc.Store.farm().business.production[uid], secondBee);
    assert.equal(await page.locator('[data-collect="' + firstBee + '"]').count(), 0);
    await page.locator('[data-find-product="honey"]').click();
    await pickup('honey').click();
    assert.equal(await stock('honey'), 1);
    assert.deepEqual(await page.evaluate(uid => __abc.Store.farm().business.production[uid], secondBee), secondClock);
    const tomorrow = await page.evaluate(() => {
      const time = new Date();
      time.setDate(time.getDate() + 1);
      time.setHours(12, 0, 0, 0);
      return time.getTime();
    });
    await page.clock.setFixedTime(tomorrow);
    await pickup('honey').waitFor();
    assert.match(await pickup('honey').getAttribute('aria-label'), /2 份/);
    assert.equal(await stock('honey'), 1, 'the daily rollover creates map drops only');
    const remainingBee = await page.evaluate(uid => ({ care: { ...__abc.Store.farm().care[uid] }, clock: { ...__abc.Store.farm().business.production[uid] } }), secondBee);
    await page.locator('#care-shop').click();
    await page.locator('#shop-sell summary').click();
    page.once('dialog', dialog => dialog.accept());
    await page.locator('[data-sell="animal"][data-uid="' + firstBee + '"]').click();
    assert.equal(await page.evaluate(uid => __abc.Store.farm().animals.some(a => a.uid === uid), firstBee), false);
    assert.equal(await page.evaluate(uid => __abc.Store.farm().care[uid], firstBee), undefined);
    assert.deepEqual(await page.evaluate(uid => ({ care: __abc.Store.farm().care[uid], clock: __abc.Store.farm().business.production[uid] }), secondBee), remainingBee);
    await page.locator('#btn-tofarm').click();
    await page.locator('[data-find-product="honey"]').click();
    await pickup('honey').click();
    assert.equal(await stock('honey'), 3, 'the sold bee’s drop remained on the map');
    // A cancelled old welcome/next-question timer cannot speak over another screen.
    await page.evaluate(() => { __abc.App.show('find'); __abc.App.show('farm'); window.__spoken.length = 0; });
    await page.waitForTimeout(1900);
    assert.deepEqual(await page.evaluate(() => __spoken), []);
    // Real exercise flow still advances once after spoken feedback.
    await page.evaluate(() => __abc.App.show('match'));
    await page.waitForFunction(() => __abc.MatchCase.state().target && !__abc.MatchCase.state().busy);
    const target = await page.evaluate(() => __abc.MatchCase.state().target);
    await page.locator('#match-cards [data-l="' + target + '"]').click();
    await page.waitForFunction(() => __abc.MatchCase.state().qIndex === 1 && !__abc.MatchCase.state().busy);
    // Replaying a sound-choice prompt cancels the old narrator chain; mute must not lock answering.
    await page.evaluate(() => __abc.App.show('sound'));
    await page.waitForFunction(() => __abc.SoundMatch.state().target);
    await page.locator('#btn-sreplay').click();
    await page.locator('#btn-sreplay').click();
    await page.locator('#btn-mute').click();
    await page.waitForFunction(() => !__abc.SoundMatch.state().busy);
    const soundTarget = await page.evaluate(() => __abc.SoundMatch.state().target);
    await page.locator('#sound-cards [data-l="' + soundTarget + '"]').click();
    await page.waitForFunction(() => __abc.SoundMatch.state().qIndex === 1 && !__abc.SoundMatch.state().busy);
    await page.locator('#btn-mute').click();
    // Screenshot fixtures include a populated farm and do not touch the server database.
    await page.evaluate(() => {
      __abc.Store.farm(f => {
        f.food = 6; f.water = 4; f.hearts = 12; f.coins = 38;
        f.animals = [{ uid: 'demo-chick', type: 'chick' }, { uid: 'demo-cat', type: 'cat' }, { uid: 'demo-fish', type: 'fish' }];
        f.care = Object.fromEntries(f.animals.map(a => [a.uid, { food: 1, water: 2, growth: a.type === 'chick' ? 5 : 2, ts: Date.now() }]));
        f.business.xp = 32; f.fruit.nut = 4; f.fruit.bean = 2;
        f.business.upgrades.beds = 0;
        f.business.claimed = ['plant', 'care', 'harvest'];
        f.business.production['demo-chick'] = { readyAt: Date.now() - 1000 };
        f.plots = [null, { crop: 'nut', plantedAt: Date.now() - 76 * 60000 }, null, { crop: 'corn', plantedAt: Date.now() - 20 * 60000 }, null, null];
      }); __abc.App.show('farm');
    });
    await page.locator('[data-zone="yard"]').click();
    await page.waitForTimeout(1600); // Let the previous exercise's canvas celebration clear before visual QA.
    fs.mkdirSync('test-results', { recursive: true });
    for (const [name, width, height] of [['desktop', 1440, 1000], ['tablet', 820, 1180], ['mobile', 390, 844]]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: 'test-results/farm-' + name + '.png', fullPage: true });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, name + ' horizontal overflow');
      for (const zone of ['field', 'pets', 'pond', 'yard']) {
        await page.locator('[data-zone="' + zone + '"]').click();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, zone + ' ' + name);
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator('[data-zone="field"]').click();
    await page.screenshot({ path: 'test-results/farm-garden.png', fullPage: true });
    await page.locator('#care-shop').click();
    await page.screenshot({ path: 'test-results/farm-shop.png', fullPage: true });
    await page.locator('[data-item="dog"]').click();
    await page.screenshot({ path: 'test-results/farm-spelling.png' });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: 'test-results/farm-spelling-mobile.png' });
    await page.locator('#spell-close').click();
    // Five-letter words and pictorial controls fit a small phone; listening can unmute explicitly.
    await page.setViewportSize({ width: 320, height: 568 });
    await page.locator('[data-kind="supply"]').click();
    await page.locator('[data-item="water"]').click();
    assert.equal(await page.locator('.sp-slot:empty').count(), 5);
    assert.equal(await page.evaluate(() => document.querySelector('.farm-dialog').scrollWidth > document.querySelector('.farm-dialog').clientWidth), false);
    await page.evaluate(() => document.getElementById('btn-mute').click());
    await checkWordCard(page.locator('#spell-hint'), 'WATER', false);
    await page.locator('#spell-say').click();
    assert.equal(await page.evaluate(() => __abc.Sound.muted), false);
    assert.equal(await page.locator('.sp-slot:empty').count(), 5);
    const spellingButtons = await page.locator('.spelling-dialog button').evaluateAll(els => els.map(el => { const r = el.getBoundingClientRect(); return { width: r.width, height: r.height }; }));
    assert.ok(spellingButtons.every(r => r.width >= 44 && r.height >= 44));
    await page.screenshot({ path: 'test-results/farm-spelling-small.png' });
    await page.locator('#spell-close').click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#btn-tofarm').click();
    await page.locator('[data-panel="orders"]').click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: 'test-results/farm-orders-mobile.png' });
    await page.locator('#business-close').click();
    await page.locator('[data-panel="inventory"]').click();
    await page.screenshot({ path: 'test-results/farm-inventory-mobile.png' });
    await page.locator('#business-close').click();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator('[data-panel="build"]').click();
    assert.ok(await page.locator('.management-dialog').evaluate(el => el.getBoundingClientRect().width > 800));
    await page.screenshot({ path: 'test-results/farm-build.png' });
    await page.locator('#business-close').click();
    // Every companion is mounted in one world, regardless of the camera bookmark.
    await page.evaluate(() => {
      __abc.Store.farm(f => {
        for (const type of ['chick', 'bee', 'cat', 'dog', 'fish']) for (let i = 0; i < 7; i++) __abc.FarmEconomy.addAnimal(f, type);
        f.plots = Array(12).fill(null); f.business.upgrades.beds = 2;
      });
      __abc.Pets.renderFarmScene();
    });
    const expected = await page.evaluate(() => __abc.Store.farm().animals.map(a=>a.uid));
    for (const [name, width, height] of [['desktop', 1440, 1000], ['tablet', 820, 1180], ['mobile', 390, 844], ['small', 320, 568]]) {
      await page.setViewportSize({ width, height });
      for (const zone of ['yard', 'field', 'pets', 'pond']) {
        await page.evaluate(zone => __abc.Pets.goZone(zone), zone);
        assert.deepEqual(await page.locator('[data-animal]').evaluateAll(els=>els.map(el=>el.dataset.animal)),expected);
        assert.equal(await page.locator('[data-herd-page]').count(),0);
        const geometry=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,actors:__abc.FarmLife.state().actors,map:__abc.FarmMap.state()}));
        assert.equal(geometry.overflow,false,name+' '+zone);
        geometry.actors.forEach((a,i)=>{
          assert.ok(a.x>=0 && a.y>=0 && a.x+a.width<=geometry.map.width && a.y+a.height<=geometry.map.height);
          assert.ok(geometry.actors.slice(i+1).every(b=>!(a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y)));
        });
      }
      await page.evaluate(()=>__abc.FarmMap.overview());
      if(name!=='small') await page.locator('.farm-world').screenshot({path:'test-results/farm-map-all-'+name+'.png'});
    }
    assert.deepEqual(errors, []);
    console.log('PASS: whole-word spelling hints and three-error restart, repeated purchases, individual care and production, responsive farm map, five daily crop stages and harvest, orders, expansion, reload and audio lifecycle; no page errors.');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
