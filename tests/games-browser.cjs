const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createServer } = require('./preview.cjs');

(async () => {
  const server = createServer(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 960 }, serviceWorkers: 'block' });
    await context.addInitScript(() => {
      let active = null;
      window.__spoken = [];
      Object.defineProperty(window, 'speechSynthesis', { value: {
        speaking: false, pending: false, paused: false, getVoices: () => [], addEventListener() {}, resume() {},
        cancel() { if (active) clearTimeout(active); active = null; this.speaking = this.pending = false; },
        speak(u) {
          window.__spoken.push(u.text); this.speaking = true; u.onstart?.();
          active = setTimeout(() => { active = null; this.speaking = false; u.onend?.(); }, 100);
        },
      } });
    });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:' + server.address().port);
    await page.waitForFunction(() => window.__abc?.Profiles.mode === 'local');
    fs.mkdirSync('test-results', { recursive: true });
    async function start(screen) {
      await page.evaluate(name => __abc.App.show(name), screen);
      const module = { find: 'ListenFind', sound: 'SoundMatch', match: 'MatchCase' }[screen];
      await page.waitForFunction(name => __abc[name].state().target, module);
      return module;
    }
    async function ready(module) { await page.waitForFunction(name => !__abc[name].state().busy, module); }
    async function choose(screen, module, correct = true) {
      await ready(module);
      const target = await page.evaluate(name => __abc[name].state().target, module);
      const root = screen === 'find' ? '#game-stage' : '#' + screen + '-cards';
      const selector = correct ? '[data-l="' + target + '"]' : '[data-l]:not([data-l="' + target + '"])';
      await page.locator(root + ' ' + selector).first().click();
    }
    // The first unlocked game still has three options; wrong answers are gentle and do not award stars.
    let module = await start('find');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(450);
    assert.equal(await page.locator('#game-stage [data-l]').count(), 3);
    const first = page.locator('#game-stage [data-l]').first();
    const before = await first.boundingBox(); await page.waitForTimeout(350); const after = await first.boundingBox();
    assert.ok(Math.abs(before.x - after.x) < 1 && Math.abs(before.y - after.y) < 1, 'tap target remains still while artwork floats');
    const target = await page.evaluate(() => __abc.ListenFind.state().target);
    const wrong = page.locator('#game-stage [data-l]:not([data-l="' + target + '"])').first();
    await wrong.click(); await wrong.click();
    assert.equal(await page.evaluate(() => __abc.Store.stars), 0);
    assert.equal(await page.locator('#game-stage [data-l="' + target + '"]').getAttribute('class').then(s => s.includes('gentle-hint')), true);
    const total = await page.evaluate(() => __abc.ListenFind.state().roundLen);
    for (let i = 0; i < total; i++) {
      await choose('find', module);
      if (i < total - 1) await page.waitForFunction(index => __abc.ListenFind.state().qIndex === index && !__abc.ListenFind.state().busy, i + 1);
    }
    await page.locator('.play-win').waitFor();
    assert.equal(await page.evaluate(() => __abc.Store.stars), total);
    await page.screenshot({ path: 'test-results/game-round-complete.png' });
    await page.locator('[data-act="again"]').click();
    await ready(module);
    assert.equal(await page.evaluate(() => __abc.ListenFind.state().qIndex), 0);
    // All three illustrated skins at four options, including their reveal state.
    for (const theme of ['balloon', 'bubble', 'egg']) {
      await page.evaluate(id => __abc.Skins.render(id, ['B', 'D', 'P', 'Q'], { onPick: el => __abc.Skins.correct(id, el) }), theme);
      await page.screenshot({ path: 'test-results/game-find-' + theme + '.png' });
      await page.locator('#game-stage [data-l="B"]').click();
      await page.waitForTimeout(650);
      assert.equal(await page.locator('#game-stage .revealed .choice-prize').evaluate(el => +getComputedStyle(el).opacity > .9), true);
      await page.screenshot({ path: 'test-results/game-find-' + theme + '-reward.png' });
    }
    // Theater spotlight follows real start events; replay and silent mode recover without a stuck answer lock.
    await page.evaluate(() => __abc.Store.addStars(40));
    module = await start('sound');
    await page.locator('#sound-cards .talking').first().waitFor();
    assert.equal(await page.locator('#sound-cards .snd-btn:disabled').count(), 4);
    await page.screenshot({ path: 'test-results/game-sound-speaking.png' });
    await page.locator('#btn-sreplay').click(); await page.locator('#btn-sreplay').click();
    await ready(module);
    assert.equal(await page.locator('#sound-cards .talking').count(), 0);
    assert.equal(await page.locator('#sound-cards .snd-btn:disabled').count(), 0);
    await page.screenshot({ path: 'test-results/game-sound.png' });
    for (let i = 0; i < total; i++) {
      await choose('sound', module);
      if (i < total - 1) await page.waitForFunction(index => __abc.SoundMatch.state().qIndex === index && !__abc.SoundMatch.state().busy, i + 1);
    }
    await page.locator('.play-win').waitFor();
    // The train uses the same color for every option so matching is based on letter shape.
    module = await start('match'); await ready(module);
    assert.equal(await page.locator('#match-cards .gc-solo').evaluateAll(els => new Set(els.map(el => getComputedStyle(el).color)).size), 1);
    await page.screenshot({ path: 'test-results/game-match.png' });
    await choose('match', module);
    await page.waitForFunction(() => document.querySelector('.train-car.paired'));
    await page.screenshot({ path: 'test-results/game-match-paired.png' });
    await page.waitForFunction(() => __abc.MatchCase.state().qIndex === 1 && !__abc.MatchCase.state().busy);
    for (let i = 1; i < total; i++) {
      await choose('match', module);
      if (i < total - 1) await page.waitForFunction(index => __abc.MatchCase.state().qIndex === index && !__abc.MatchCase.state().busy, i + 1);
    }
    await page.locator('.play-win').waitFor();
    await page.locator('[data-act="farm"]').click();
    await page.locator('#farm-business-header').waitFor();
    // Leaving mid-flight clears particles, floating letter and pending sounds.
    module = await start('match'); await choose('match', module);
    await page.evaluate(() => { __abc.App.toast('旧页面提示'); __abc.App.show('home'); __spoken.length = 0; });
    await page.waitForTimeout(1400);
    assert.equal(await page.locator('.play-flight, .toast').count(), 0); assert.deepEqual(await page.evaluate(() => __spoken), []);
    // Phone, small phone and tablet: every choice fits, four options remain large enough to tap.
    await page.evaluate(() => __abc.Store.mutateLetters(ls => 'ABCDEFGHIJKL'.split('').forEach(L => ls[L] = { correct: 5, seen: 1, wrong: 0 })));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const [width, height] of [[390, 844], [320, 568], [820, 1180]]) {
      await page.setViewportSize({ width, height });
      for (const screen of ['find', 'sound', 'match']) {
        module = await start(screen); await ready(module);
        assert.equal(await page.evaluate(name => __abc[name].state().roundLen, module), 8);
        if (screen === 'find') await page.evaluate(() => __abc.Skins.render('bubble', ['B', 'D', 'P', 'Q'], { onPick: el => __abc.Skins.correct('bubble', el) }));
        await page.evaluate(() => window.scrollTo(0, 0));
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, screen + ' horizontal overflow at ' + width);
        const root = screen === 'find' ? '#game-stage' : '#' + screen + '-cards';
        const boxes = await page.locator(root + ' [data-l]').evaluateAll(els => els.map(el => { const r = el.getBoundingClientRect(); return { x: r.x, right: r.right, width: r.width, height: r.height }; }));
        assert.ok(boxes.every(r => r.x >= 0 && r.right <= width && r.width >= 44 && r.height >= 44), screen + ' touch target geometry');
        if (width !== 320) await page.screenshot({ path: 'test-results/game-' + screen + '-' + width + '.png', fullPage: true });
      }
    }
    assert.deepEqual(errors, []);
    console.log('PASS: all three complete rounds, gentle hints, stable animated targets, 3 skins and reveals, speech spotlight/replay, letter train, route cleanup, 320/390/820 responsive layouts.');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
