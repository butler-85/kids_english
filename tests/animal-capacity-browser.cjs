const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createServer } = require('./preview.cjs');
(async () => {
  const server = createServer(); await new Promise(r => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
    await context.addInitScript(() => {
      let timer;
      Object.defineProperty(window, 'speechSynthesis', { value: {
        speaking: false, pending: false, paused: false, getVoices: () => [], addEventListener() {}, resume() {},
        cancel() { clearTimeout(timer); this.speaking = false; },
        speak(u) { this.speaking = true; u.onstart?.(); timer = setTimeout(() => { this.speaking = false; u.onend?.(); }, 25); },
      } });
    });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:' + server.address().port);
    await page.waitForFunction(() => window.__abc?.Profiles.mode === 'local');
    await page.locator('[data-target="farm"]').click();
    await page.evaluate(() => {
      __abc.Store.mutateLetters(ls => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(L => ls[L] = { correct: 5, seen: 1, wrong: 0 }));
      __abc.Store.farm(f => {
        f.coins = 200; f.animals = []; f.care = {};
        for (let i = 0; i < 5; i++) { const a = __abc.FarmEconomy.addAnimal(f, 'bee'); f.care[a.uid].growth = 5; }
        for (let i = 0; i < 6; i++) { const a = __abc.FarmEconomy.addAnimal(f, i < 2 ? 'hen' : 'chick'); f.care[a.uid].growth = 5; }
      });
      __abc.Pets.openShop();
    });
    const capacity = type => page.evaluate(type => __abc.FarmEconomy.animalCapacity(__abc.Store.farm(), type), type);
    const coins = () => page.evaluate(() => __abc.Store.farm().coins);
    async function buy(type, word) {
      await page.locator('[data-item="' + type + '"]').click();
      for (const ch of word) await page.locator('[data-ch="' + ch + '"]').click();
      await page.locator('#purchase-home').waitFor();
      await page.locator('#spell-close').click();
    }
    assert.equal((await capacity('bee')).remaining, 1);
    const before = await coins();
    await buy('bee', 'BEE');
    assert.equal((await capacity('bee')).count, 6);
    assert.equal(await coins(), before - 8);
    assert.equal(await page.locator('[data-item="bee"]').getAttribute('aria-disabled'), 'true');
    assert.equal(await page.locator('[data-item="bee"] .occupied').count(), 6);
    // Full cards still explain the limit when touched, but cannot enter spelling or charge coins.
    await page.locator('[data-item="bee"]').dispatchEvent('click');
    assert.equal(await page.locator('.spelling-dialog').count(), 0);
    assert.equal(await coins(), before - 8);
    await page.locator('#shop-sell summary').click();
    const sold = await page.evaluate(() => __abc.Store.farm().animals.find(a => a.type === 'bee').uid);
    page.once('dialog', d => d.accept());
    await page.locator('[data-sell="animal"][data-uid="' + sold + '"]').click();
    assert.equal((await capacity('bee')).remaining, 1);
    assert.equal(await page.locator('[data-item="bee"]').getAttribute('aria-disabled'), 'false');
    await buy('bee', 'BEE');
    assert.equal((await capacity('bee')).count, 6);
    assert.equal(await page.evaluate(() => Math.max(...__abc.Store.farm().animals.filter(a => a.type === 'bee').map(a => a.serial))), 7);
    // Adult hens are sellable and free a chick slot in the same shared limit.
    assert.equal(await page.locator('[data-item="chick"]').getAttribute('aria-disabled'), 'true');
    await page.locator('#shop-sell summary').click();
    const hen = await page.evaluate(() => __abc.Store.farm().animals.find(a => a.type === 'hen').uid);
    page.once('dialog', d => d.accept());
    await page.locator('[data-sell="animal"][data-uid="' + hen + '"]').click();
    assert.equal((await capacity('chick')).remaining, 1);
    await buy('chick', 'EGG');
    assert.equal((await capacity('chick')).count, 6);
    // Capacity can change during narration: the final transaction must recheck before deducting.
    await page.evaluate(() => __abc.Store.farm(f => { for (let i = 0; i < 5; i++) __abc.FarmEconomy.addAnimal(f, 'cat'); }));
    await page.locator('[data-item="cat"]').click();
    await page.evaluate(() => __abc.Store.farm(f => __abc.FarmEconomy.addAnimal(f, 'cat')));
    const beforeStale = await coins();
    for (const ch of 'CAT') await page.locator('[data-ch="' + ch + '"]').click();
    await page.waitForFunction(() => !document.querySelector('.farm-dialog'));
    assert.equal((await capacity('cat')).count, 6);
    assert.equal(await coins(), beforeStale);
    assert.equal(await page.locator('#purchase-home').count(), 0);
    await page.reload();
    await page.waitForFunction(() => window.__abc?.Profiles.mode === 'local');
    await page.evaluate(() => __abc.Pets.openShop());
    assert.equal((await capacity('bee')).count, 6);
    assert.equal(await page.locator('[data-item="bee"]').getAttribute('aria-disabled'), 'true');
    await page.setViewportSize({ width: 320, height: 844 });
    fs.mkdirSync('test-results', { recursive: true });
    await page.screenshot({ path: 'test-results/animal-capacity-mobile.png', fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.equal(await page.locator('.animal-capacity').evaluateAll(els => els.some(el => el.scrollWidth > el.clientWidth)), false);
    assert.deepEqual(errors, []);
    console.log('PASS: sixth purchase, blocked seventh, live sale/rebuy beyond serial six, shared chick/hen slots, stale spelling transaction without charge, reload and 320px pictorial capacity UI.');
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
