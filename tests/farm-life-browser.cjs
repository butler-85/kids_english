const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createServer } = require('./preview.cjs');
(async () => {
  const server = createServer(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, serviceWorkers: 'block' });
    await context.addInitScript(() => {
      let timer;
      window.__spoken = []; window.__writes = 0;
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        return play.call(this).then(() => { window.__playedAnimal = this.src; });
      };
      const write = Storage.prototype.setItem;
      Storage.prototype.setItem = function(...args) { window.__writes++; return write.apply(this, args); };
      Object.defineProperty(window, 'speechSynthesis', { value: {
        speaking: false, pending: false, paused: false, getVoices: () => [], addEventListener() {}, resume() {},
        cancel() { clearTimeout(timer); this.speaking = false; },
        speak(u) { window.__spoken.push(u.text); this.speaking = true; u.onstart?.(); timer = setTimeout(() => { this.speaking = false; u.onend?.(); }, 35); },
      } });
    });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:' + server.address().port);
    await page.waitForFunction(() => window.__abc?.Profiles.mode === 'local');
    await page.locator('[data-target="farm"]').click();
    await page.evaluate(() => {
      __abc.Store.farm(f => {
        f.animals = []; f.care = {}; f.food = 20; f.water = 20;
        for (const type of ['cat', 'dog', 'cat', 'dog', 'chick', 'chick', 'chick', 'chick', 'bee', 'bee', 'bee', 'fish', 'fish', 'fish', 'fish']) __abc.FarmEconomy.addAnimal(f, type);
      });
      const voice = __abc.Sound.voice;
      window.__animalCalls = [];
      __abc.Sound.voice = (...args) => { __animalCalls.push(args); return voice(...args); };
      __abc.Pets.renderFarmScene(); __abc.Pets.goZone('pets'); window.__writes = 0;
    });
    await page.locator('#farm-map-viewport').scrollIntoViewIfNeeded();
    await page.mouse.move(5, 5);
    const positions = () => page.evaluate(() => __abc.FarmLife.state().actors);
    const start = await positions();
    await page.waitForTimeout(5200);
    const moved = await positions();
    assert.ok(moved.filter((a, i) => Math.hypot(a.x - start[i].x, a.y - start[i].y) > 5).length >= 2, 'animals autonomously change position');
    assert.equal(await page.evaluate(() => __writes), 0, 'wandering does not persist movement or award care');
    async function touch(uid) {
      await page.mouse.move(5, 5);
      const button = page.locator('[data-animal="' + uid + '"]');
      await page.evaluate(uid=>__abc.FarmMap.focusAnimal(uid),uid);
      await page.locator('#farm-map-viewport').scrollIntoViewIfNeeded();
      const box = await button.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(70);
      const stable = await button.boundingBox(); await page.waitForTimeout(150);
      const after = await button.boundingBox();
      assert.ok(Math.abs(stable.x - after.x) < 1 && Math.abs(stable.y - after.y) < 1, 'pointer approach holds the tap target');
      await page.evaluate(() => __spoken.length = 0);
      const scroll = await page.evaluate(() => scrollY);
      await page.mouse.click(after.x + after.width / 2, after.y + after.height / 2);
      assert.equal(await page.evaluate(() => scrollY), scroll, 'touch stays on the animal instead of scrolling to the sidebar');
    }
    fs.mkdirSync('test-results', { recursive: true });
    for (const [zone, type, mode] of [['pets', 'cat', 'pounce'], ['pets', 'dog', 'puppyhop'], ['yard', 'chick', 'flutter'], ['field', 'bee', 'twirl'], ['pond', 'fish', 'splash']]) {
      await page.evaluate(zone => __abc.Pets.goZone(zone), zone);
      await page.locator('#farm-map-viewport').scrollIntoViewIfNeeded();
      const uid = await page.locator('[data-species="' + type + '"]').first().getAttribute('data-animal');
      await touch(uid);
      assert.equal(await page.locator('[data-animal="' + uid + '"]').getAttribute('data-behavior'), mode);
      assert.deepEqual(await page.evaluate(() => __animalCalls.at(-1)), [type, 'touch', { adult: false }]);
      const clip = ({cat: 'kitten', dog: 'puppy'})[type] || type;
      await page.waitForFunction(clip => window.__playedAnimal?.endsWith('/' + clip + '.mp3'), clip);
      assert.deepEqual(await page.evaluate(() => __spoken), [], 'touch uses an animal call, not spoken names');
      await page.waitForTimeout(280);
      await page.locator('.farm-world').screenshot({ path: 'test-results/animal-' + type + '-reaction.png' });
    }
    // Care keeps positions, changes only the selected companion, and uses care-specific sounds.
    await page.evaluate(() => __abc.Pets.goZone('pets'));
    const selected = await page.locator('.farm-animal.selected').getAttribute('data-animal');
    const feed = page.locator('[data-scene-care="food"]');
    await feed.evaluate(button => {
      // Measure around the handler in the same frame so ordinary wandering is excluded.
      const snapshot = () => ({ care: structuredClone(__abc.Store.farm().care), animals: __abc.FarmLife.state().actors });
      button.addEventListener('click', () => { window.__beforeCare = snapshot(); }, { capture: true, once: true });
      button.addEventListener('click', () => { window.__afterCare = snapshot(); }, { once: true });
    });
    await feed.click();
    const [old, current] = await page.evaluate(() => [window.__beforeCare, window.__afterCare]);
    assert.equal(current.care[selected].growth, old.care[selected].growth, 'food alone does not grow an animal');
    for (const uid of Object.keys(old.care).filter(uid => uid !== selected)) assert.deepEqual(current.care[uid], old.care[uid]);
    assert.equal(await page.locator('.farm-animal.selected').getAttribute('data-behavior'), 'eat');
    assert.deepEqual(await page.evaluate(() => __animalCalls.at(-1)), ['cat', 'food', { adult: false }]);
    current.animals.forEach((a, i) => assert.ok(Math.hypot(a.x - old.animals[i].x, a.y - old.animals[i].y) < 3, 'care does not teleport the herd'));
    await page.locator('[data-scene-care="water"]').click();
    assert.equal(await page.evaluate(uid => __abc.Store.farm().care[uid].growth, selected), old.care[selected].growth + 5 / 3);
    assert.equal(await page.locator('.farm-animal.selected').getAttribute('data-behavior'), 'drink');
    await page.locator('[data-scene-care="pet"]').click();
    await page.locator('#btn-mute').click();
    assert.equal(await page.evaluate(() => __abc.Sound.activeAnimalSounds), 0, 'mute silences scheduled sounds');
    await page.locator('[data-scene-care="pet"]').click();
    assert.equal(await page.evaluate(() => __abc.Sound.activeAnimalSounds), 0);
    await page.locator('#btn-mute').click();
    // Popups/background suspend animation and calls; returning resumes without a large time jump.
    await page.locator('[data-panel="inventory"]').click();
    await page.waitForTimeout(100);
    assert.equal(await page.evaluate(() => __abc.FarmLife.state().running), false);
    const paused = await positions(); await page.waitForTimeout(250); assert.deepEqual(await positions(), paused);
    await page.locator('#business-close').click();
    await page.locator('#farm-map-viewport').scrollIntoViewIfNeeded();
    await page.evaluate(() => { window.__testHidden = true; Object.defineProperty(document, 'hidden', { configurable: true, get: () => __testHidden }); document.dispatchEvent(new Event('visibilitychange')); });
    assert.equal(await page.evaluate(() => __abc.FarmLife.state().running), false);
    await page.evaluate(() => { __testHidden = false; document.dispatchEvent(new Event('visibilitychange')); });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(200);
    const still = await positions(); await page.waitForTimeout(350); assert.deepEqual(await positions(), still, 'reduced motion holds locations');
    for (const width of [320, 390, 820]) {
      await page.setViewportSize({ width, height: 900 });
      for (const zone of ['yard', 'pets', 'field', 'pond']) {
        await page.evaluate(zone => __abc.Pets.goZone(zone), zone);
        await page.locator('#farm-map-viewport').scrollIntoViewIfNeeded();
        await page.waitForTimeout(70);
        const boxes = await page.evaluate(() => {
          const rect = el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
          return { root: rect(document.querySelector('.life-area')), animals: [...document.querySelectorAll('[data-animal]')].map(rect) };
        });
        boxes.animals.forEach((a, i) => {
          assert.ok(a.width > 0 && a.height > 0 && a.x >= boxes.root.x - 1 && a.right <= boxes.root.right + 1 && a.bottom <= boxes.root.bottom + 1, 'all animals remain tappable');
          boxes.animals.slice(i + 1).forEach(b => assert.ok(!(a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y), 'no overlap after resizing'));
        });
        if (width === 390) await page.locator('.farm-world').screenshot({ path: 'test-results/farm-life-' + zone + '-mobile.png' });
      }
    }
    await page.evaluate(() => __abc.App.show('home'));
    assert.deepEqual(await page.evaluate(() => __abc.FarmLife.state()), { running: false, count: 0, actors: [] });
    assert.equal(await page.evaluate(() => __abc.Sound.activeAnimalSounds), 0);
    assert.deepEqual(errors, []);
    console.log('PASS: autonomous movement, stable tap targets, five species-specific reactions and local animal recordings; individual care without teleporting; mute, modal/background/route cleanup, reduced motion and responsive habitats.');
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
