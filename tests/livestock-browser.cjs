const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createServer } = require('./preview.cjs');

(async () => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 1200, height: 960 }, reducedMotion: 'reduce', serviceWorkers: 'block',
    });
    await context.addInitScript(() => {
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        return play.call(this).then(() => { window.lastClip = this.src; });
      };
      Object.defineProperty(window, 'speechSynthesis', { value: {
        speaking: false, paused: false, pending: false, getVoices: () => [], resume() {}, addEventListener() {},
        cancel() { clearTimeout(this.timer); this.speaking = false; },
        speak(line) {
          this.speaking = true; line.onstart?.();
          this.timer = setTimeout(() => { this.speaking = false; line.onend?.(); }, 25);
        },
      } });
    });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const day = n => new Date(2026, 10, n, 12);
    await page.clock.setFixedTime(day(1));
    await page.goto('http://127.0.0.1:' + server.address().port);
    await page.waitForFunction(() => window.__abc?.Profiles.mode === 'local');
    await page.locator('[data-target="farm"]').click();
    await page.evaluate(() => {
      __abc.Store.farm(f => { f.food = f.water = 30; });
      __abc.Store.mutateLetters(ls => {
        for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') ls[letter] = { correct: 5, seen: 5, wrong: 0 };
      });
    });

    async function select(type) {
      const animal = page.locator('[data-species="' + type + '"]');
      const uid = await animal.getAttribute('data-animal');
      await page.evaluate(uid => __abc.FarmMap.focusAnimal(uid), uid);
      await animal.click();
      assert.equal(await animal.getAttribute('aria-pressed'), 'true');
      return animal;
    }
    for (const type of ['cow', 'sheep']) {
      await page.locator('#care-shop').click();
      await page.locator('[data-item="' + type + '"]').click();
      for (const letter of type.toUpperCase()) await page.locator('[data-ch="' + letter + '"]').click();
      await page.locator('#purchase-home').click();
      const animal = await select(type);
      assert.equal(await animal.locator('.farm-creature').getAttribute('data-age'), 'young');
      assert.equal(await page.locator('.care-growth .need-pip').count(), 5);
      assert.equal(await page.locator('#care-sell').count(), 0);
      await page.waitForFunction(clip => window.lastClip?.endsWith('/' + clip + '.mp3'), type === 'cow' ? 'calf' : 'lamb');
    }
    assert.equal(await page.evaluate(() => __abc.Store.farm().coins), 24);

    for (let date = 1; date <= 8; date++) {
      await page.clock.setFixedTime(day(date));
      await page.evaluate(() => __abc.Pets.renderFarmScene());
      for (const type of ['cow', 'sheep']) {
        const animal = await select(type);
        await page.locator('[data-scene-care="food"]').click();
        await page.locator('[data-scene-care="water"]').click();
        assert.equal(await page.locator('.care-growth .full').count(), Math.min(date, 5));
        assert.equal(await animal.locator('.farm-creature').getAttribute('data-age'), date < 5 ? 'young' : 'adult');
        if (date >= 5) {
          const action = page.locator('#production-slot [data-collect]');
          assert.equal(await action.isEnabled(), date === 8);
          if (date !== 8) assert.match(await page.locator('#production-slot').innerText(), new RegExp((date - 5) + '/3'));
        }
      }
      if (date === 7) {
        await page.reload();
        await page.waitForFunction(() => window.__abc?.Profiles.mode === 'local');
        await page.locator('[data-target="farm"]').click();
      }
    }
    const sheep = page.locator('[data-species="sheep"]');
    assert.equal(await sheep.locator('.farm-creature').getAttribute('data-fleece'), 'full');
    assert.equal(await sheep.locator('.sheep-fleece').isVisible(), true);
    await page.setViewportSize({ width: 320, height: 640 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);

    fs.mkdirSync('test-results', { recursive: true });
    for (const [type, action, item, prop, animation] of [
      ['sheep', 'shear', 'wool', '.shears', 'shears-sweep'],
      ['cow', 'milk', 'milk', '.milk-stream', 'milk-stream'],
    ]) {
      await select(type);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      const collect = page.locator('#farm-quick-care [data-collect]');
      await collect.click();
      const scene = page.locator('[data-collect-action="' + action + '"]');
      await scene.waitFor();
      assert.equal(await scene.locator(prop).evaluate(el => getComputedStyle(el).animationName), animation);
      assert.equal(await page.evaluate(item => __abc.FarmEconomy.stock(__abc.Store.farm(), item), item), 0);
      assert.equal(await page.evaluate(item => __abc.FarmEconomy.groundStock(__abc.Store.farm())[item], item), 1);
      // Show the exact pose mid-action for visual verification.
      await scene.evaluate(el => el.getAnimations({ subtree: true }).forEach(a => { a.pause(); a.currentTime = 700; }));
      await scene.screenshot({ path: 'test-results/livestock-' + action + '.png' });
      await page.locator('#livestock-done').click();
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(await page.locator('#production-slot [data-collect]').isDisabled(), true);
      assert.match(await page.locator('#production-slot').innerText(), /0\/3/);
      assert.equal(await collect.count(), 0, 'ready quick action disappears after taking one item');
      await page.locator('#farm-map-world [data-pickup="' + item + '"]').click();
      assert.equal(await page.evaluate(item => __abc.FarmEconomy.stock(__abc.Store.farm(), item), item), 1);
    }
    assert.equal(await sheep.locator('.farm-creature').getAttribute('data-fleece'), 'short');
    assert.equal(await sheep.locator('.sheep-fleece').isVisible(), false);
    await page.locator('[data-panel="inventory"]').click();
    const milk = page.locator('[data-sell-stock="milk"]');
    assert.equal(await milk.isEnabled(), true);
    assert.equal(await page.locator('[data-sell-stock="wool"]').isEnabled(), true);
    assert.match(await milk.locator('xpath=..').innerText(), /8 金币／份/);
    const balance = () => page.evaluate(() => __abc.Store.farm().coins);
    const beforeSales = await balance();
    await milk.click();
    assert.equal(await balance(), beforeSales + 8);
    assert.equal(await milk.isDisabled(), true);
    await page.locator('#business-close').click();
    await select('cow');
    const sell = page.locator('#care-sell');
    assert.match(await sell.getAttribute('aria-label'), /45 金币/);
    page.once('dialog', d => d.dismiss());
    await sell.click();
    assert.equal(await page.locator('[data-species="cow"]').count(), 1);
    assert.equal(await balance(), beforeSales + 8);
    page.once('dialog', d => d.accept());
    await sell.click();
    await page.locator('[data-species="cow"]').waitFor({ state: 'detached' });
    assert.equal(await balance(), beforeSales + 8 + 45);
    await page.locator('#care-shop').click();
    await page.locator('#shop-sell summary').click();
    await page.locator('[data-sell="wool"]').click();
    assert.equal(await balance(), beforeSales + 8 + 45 + 8);
    assert.equal(await page.evaluate(() => __abc.Store.farm().business.products.wool), 0);
    assert.deepEqual(errors, []);
    console.log('PASS: five-day growth, three-day production, milking and shearing at 320px, direct sale and cancellation, and product sales in warehouse and shop.');
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
