const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createServer } = require('./preview.cjs');

(async () => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, serviceWorkers: 'block' });
    await page.addInitScript(() => {
      const wall = performance.now.bind(performance);
      window.zooTimeOffset = 0;
      Object.defineProperty(performance, 'now', { value: () => wall() + window.zooTimeOffset });
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:' + server.address().port);
    await page.waitForFunction(() => window.__abc?.Profiles.mode === 'local');
    const action = name => page.locator(`[data-zoo-action="${name}"]`);
    const tab = name => page.locator(`[data-zoo-animal="${name}"]`);
    const zoo = page.locator('section[data-screen="zoo"]');
    const stage = page.locator('.zoo-stage');
    const greetWithMouse = async () => {
      const target = action('pet').locator('.zoo-pet-target');
      await stage.scrollIntoViewIfNeeded();
      const box = await target.boundingBox();
      // Approach the moving animal as a mouse user would; hover lets it wait for the child.
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    };
    const balance = () => page.evaluate(() => __abc.Store.farm().coins);
    const holdings = () => page.evaluate(() => __abc.Store.farm().zoo);
    const advance = ms => page.evaluate(ms => { window.zooTimeOffset += ms; }, ms);
    const waitForPhase = name => page.waitForFunction(name => document.querySelector('.zoo-stage').dataset.phase === name, name);

    await page.locator('[data-target="zoo"]').click();
    assert.equal(await zoo.isVisible(), true);
    assert.equal(await page.locator('[data-zoo-animal]').count(), 9);
    assert.equal(await page.locator('.zoo-animal-thumb').count(), 9);
    assert.equal(await tab('seal').count(), 0);
    assert.equal(await tab('dolphin').count(), 0);
    assert.equal(await action('admit').isDisabled(), true);
    assert.match(await action('admit').innerText(), /还差 340 金币/);
    assert.equal(await action('feed').count(), 0);
    assert.equal(await action('show').count(), 0);
    assert.equal(await action('pet').count(), 0);
    assert.equal(await stage.evaluate(el => el.getAnimations({ subtree: true }).length), 0, 'locked previews are completely static');
    assert.equal(await holdings(), undefined);
    await action('admit').dispatchEvent('click');
    assert.equal(await balance(), 20, 'a disabled action cannot charge the wallet');
    await action('farm').click();
    const aquariumResidents = { seal: true, dolphin: true };
    await page.evaluate(owned => __abc.Store.farm(f => {
      f.coins = 7276;
      f.zoo = owned;
    }), aquariumResidents);
    await page.locator('[data-panel="zoo"]').click();
    assert.equal(await stage.getAttribute('data-animal'), 'elephant', 'a retired species cannot open as the default tab');
    assert.match(await page.locator('#zoo-wallet').innerText(), /7276/);
    assert.equal(await balance(), 7276, 'opening a legacy save does not rebill or refund admissions');
    assert.deepEqual(await holdings(), aquariumResidents);

    let remaining = 7276;
    const residents = [
      ['elephant', 360, 12, 24, ['elephant-reach-and-curl','elephant-lift-hay','elephant-chew'], ['elephant-fill','elephant-spray','elephant-finale']],
      ['giraffe', 520, 16, 32, ['giraffe-reach','giraffe-strip-leaf','giraffe-tongue'], ['giraffe-look','giraffe-parade','giraffe-bow']],
      ['monkey', 360, 20, 40, ['monkey-lift-banana','monkey-peel-banana','monkey-eat-banana'], ['monkey-climb','monkey-swing','monkey-wave']],
      ['panda', 840, 22, 46, ['panda-lift-paw','panda-lift-bamboo','panda-nibble'], ['panda-hold','panda-roll','panda-wave']],
      ['penguin', 480, 24, 52, ['penguin-snap','penguin-swallow-fish','penguin-open-bill'], ['penguin-walk','penguin-slide','penguin-jump']],
      ['parrot', 540, 26, 58, ['parrot-lift-claw','parrot-carry-nut','parrot-drop-shell'], ['parrot-stretch','parrot-flight','parrot-settle']],
      ['kangaroo', 1200, 28, 64, ['kangaroo-graze','kangaroo-pull-grass','kangaroo-chew'], ['kangaroo-crouch','kangaroo-bounds','kangaroo-tail']],
      ['snake', 680, 32, 72, ['snake-extend-neck','snake-swallow-egg','snake-egg-bulge'], ['snake-peek','snake-slither','snake-flick-tongue']],
      ['lion', 1520, 36, 80, ['lion-hunt','lion-hunt-forepaw','rabbit-bound','rabbit-kick','hunt-landing-dust'], ['lion-step','lion-stretch','lion-mane']],
    ];
    fs.mkdirSync('test-results', { recursive: true });
    for (const [id, admission, feed, show, feedAnimations, showAnimations] of residents) {
      await tab(id).click();
      assert.equal(await stage.getAttribute('data-animal'), id);
      assert.equal(await action('pet').count(), 0, 'locked animals have no greeting target');
      assert.equal(await stage.evaluate(el => el.getAnimations({ subtree: true }).length), 0, 'each locked habitat has no activity');
      assert.match(await action('admit').innerText(), new RegExp(admission + '\\s*金币'));
      await action('admit').click();
      assert.equal(await balance(), remaining, 'previewing and asking for confirmation are free');
      await action('cancel').click();
      assert.equal(await balance(), remaining);
      assert.equal(await stage.evaluate(el => el.getAnimations({ subtree: true }).length), 0, 'cancelling admission does not unlock movement');
      await action('admit').click();
      await action('confirm').click();
      remaining -= admission;
      assert.equal(await balance(), remaining);
      assert.equal((await holdings())[id], true);
      assert.equal(await action('admit').count(), 0);
      assert.equal(await action('pet').count(), 1, 'admission unlocks direct interaction');
      const depth = await stage.evaluate(el => {
        const motion = el.getAnimations({ subtree: true }).find(a => a.animationName?.startsWith('zoo-wander'));
        if (!motion) return null;
        const time = motion.currentTime, duration = motion.effect.getTiming().duration;
        const frames = [.4, .75].map(fraction => {
          motion.currentTime = duration * fraction;
          const matrix = new DOMMatrix(getComputedStyle(motion.effect.target).transform);
          return { size: matrix.a, x: matrix.e, y: matrix.f };
        });
        motion.currentTime = time;
        return frames;
      });
      assert.ok(depth && depth[0].size !== depth[1].size && depth[0].y !== depth[1].y, id + ' moves through scene depth after admission');
      const movement = await stage.evaluate((el, id) => {
        const sample = (selector, fraction, property = 'transform') => {
          const target = el.querySelector(selector);
          const animation = target.getAnimations().find(a => a.animationName?.startsWith('zoo-'));
          if (!animation) throw new Error('Missing movement for ' + selector);
          const original = animation.currentTime;
          animation.currentTime = Number(animation.effect.getTiming().duration) * fraction;
          const value = getComputedStyle(target)[property];
          animation.currentTime = original;
          return value;
        };
        if (['elephant', 'giraffe', 'lion', 'penguin'].includes(id)) {
          const leg = id === 'lion' ? '.lion-forepaw' : id === 'penguin' ? '.penguin-foot' : '.zoo-walk-leg';
          return { rest: sample(leg, .04), restLater: sample(leg, .37), step: sample(leg, id === 'penguin' ? .18 : .17) };
        }
        if (id === 'parrot') return {
          perched: sample('.wing-near', .4, 'opacity'), flying: sample('.wing-near', .23, 'opacity'), folded: sample('.parrot-wing', .23, 'opacity'),
        };
        if (id === 'kangaroo') return { shadow: sample('.zoo-contact-shadow', .22), legs: sample('.kangaroo-leg', .22) };
        return null;
      }, id);
      if (movement?.rest) {
        assert.equal(movement.rest, movement.restLater, id + ' rests its feet when standing');
        assert.notEqual(movement.rest, movement.step, id + ' takes steps while moving');
      }
      if (id === 'parrot') assert.deepEqual(movement, { perched: '0', flying: '1', folded: '0' }, 'the parrot unfolds its flight wings only in the air');
      if (id === 'kangaroo') {
        const shadow = movement.shadow.match(/matrix\(([^)]+)\)/)[1].split(',').map(Number);
        assert.ok(shadow[5] > 20 && shadow[0] < .9, 'the jumping kangaroo leaves a smaller shadow down on the ground');
        assert.notEqual(movement.legs, 'none', 'the kangaroo tucks its legs during a jump');
      }
      if (id === 'elephant') { await action('pet').focus(); await action('pet').press('Enter'); }
      else await greetWithMouse();
      assert.equal(await stage.getAttribute('data-petting'), 'true');
      assert.equal(await balance(), remaining, 'greeting and wandering never charge coins');

      if (id === 'lion') assert.match(await action('feed').innerText(), /看狮子追兔子/);
      await action('feed').click();
      remaining -= feed;
      assert.equal(await balance(), remaining);
      assert.equal(await stage.getAttribute('data-activity'), 'feed');
      assert.equal(await action('pet').count(), 0, 'feeding suspends direct interaction');
      const tracks = await stage.evaluate((el, expected) => {
        const animations = el.getAnimations({ subtree: true });
        return expected.map(name => {
          const animation = animations.find(track => track.animationName === name);
          if (!animation) return { name };
          const { duration } = animation.effect.getTiming();
          const previousTime = animation.currentTime;
          const frames = [0, .4, .53, .67, .8].map(fraction => {
            animation.currentTime = duration * fraction;
            const style = getComputedStyle(animation.effect.target);
            return [style.transform, style.opacity, style.d, style.strokeDashoffset].join('|');
          });
          animation.currentTime = previousTime;
          return { name, duration, changes: new Set(frames).size > 1 };
        });
      }, feedAnimations);
      const duration = id === 'lion' ? 5500 : 4000;
      assert.deepEqual(tracks, feedAnimations.map(name => ({ name, duration, changes: true })));
      await action('feed').dispatchEvent('click');
      await action('show').dispatchEvent('click');
      assert.equal(await balance(), remaining, 'an active animation cannot charge again');
      await page.waitForFunction(() => document.querySelector('.zoo-stage').dataset.activity === '');
      if (id === 'lion') {
        assert.equal(await page.locator('#zoo-feedback').textContent(), '狮子抓住兔子啦！');
        assert.equal(await stage.locator('[data-zoo-prey]').count(), 0);
        assert.match(await action('feed').innerText(), /看狮子追小鸡/);
        await action('feed').click();
        remaining -= feed;
        assert.equal(await balance(), remaining);
        assert.equal(await stage.locator('[data-zoo-prey="chicken"]').isVisible(), true);
        const running = await stage.evaluate(el => el.getAnimations({ subtree: true }).map(a => a.animationName));
        assert.ok(running.includes('chicken-dash') && running.includes('chicken-flap'));
        assert.ok(!running.includes('rabbit-bound'));
        await page.waitForFunction(() => document.querySelector('.zoo-stage').dataset.activity === '');
        assert.equal(await page.locator('#zoo-feedback').textContent(), '狮子抓住小鸡啦！');
        assert.match(await action('feed').innerText(), /看狮子追兔子/);
      } else {
        assert.match(await page.locator('#zoo-feedback').textContent(), /吃完啦/);
        assert.equal(await stage.locator('.zoo-feeding').first().isVisible(), false);
      }
      await action('show').click();
      remaining -= show;
      assert.equal(await balance(), remaining);
      const progress = page.locator('#zoo-show-progress');
      assert.equal(await progress.getAttribute('max'), '30');
      const labels = [];
      for (const [phase, ms, animation] of [
        ['intro', 0, showAnimations[0]], ['middle', 8200, showAnimations[1]], ['finale', 12000, showAnimations[2]],
      ]) {
        if (ms) await advance(ms);
        await waitForPhase(phase);
        const names = await stage.evaluate(el => el.getAnimations({ subtree: true }).map(a => a.animationName));
        assert.ok(names.includes(animation), id + ' plays ' + animation + ' during ' + phase);
        labels.push(await page.locator('#zoo-show-act').textContent());
        assert.equal(await action('show').isDisabled(), true);
      }
      assert.equal(new Set(labels).size, 3);
      await action('show').dispatchEvent('click');
      assert.equal(await balance(), remaining);
      if (id === 'monkey') {
        await page.locator('#zoo-body').screenshot({ path: 'test-results/zoo-show-desktop.png' });
        await action('farm').click();
        await page.locator('[data-panel="zoo"]').click();
        assert.equal(await stage.getAttribute('data-activity'), '', 'reentering cancels the departed performance');
        assert.equal(await balance(), remaining);
      } else {
        if (id === 'elephant') {
          await page.evaluate(() => {
            window.testZooHidden = true;
            Object.defineProperty(document,'hidden',{configurable:true,get: () => window.testZooHidden});
            document.dispatchEvent(new Event('visibilitychange'));
          });
          await advance(15000);
          assert.equal(await stage.evaluate(el => el.classList.contains('zoo-paused')), true);
          assert.equal(await stage.getAttribute('data-activity'), 'show');
          await page.evaluate(() => {
            window.testZooHidden = false;
            document.dispatchEvent(new Event('visibilitychange'));
          });
        }
        await advance(10000);
        await page.waitForFunction(() => document.querySelector('.zoo-stage').dataset.activity === '');
        assert.equal(await page.locator('#zoo-feedback').textContent(), '表演结束');
      }
    }
    assert.equal(remaining, 56);
    await page.reload();
    await page.waitForFunction(() => window.__abc?.Profiles.mode === 'local');
    await page.locator('[data-target="zoo"]').click();
    assert.deepEqual(await holdings(), {
      ...aquariumResidents,
      ...Object.fromEntries(residents.map(([id]) => [id, true])),
    });
    assert.equal(await balance(), 56);
    await tab('monkey').click();
    await action('feed').click();
    assert.equal(await balance(), 36, 'feeding again after reopening charges the same price');
    await page.waitForFunction(() => document.querySelector('.zoo-stage').dataset.activity === '');
    assert.equal(await action('show').isDisabled(), true);
    assert.match(await action('show').innerText(), /还差 4 金币/);
    await action('show').dispatchEvent('click');
    assert.equal(await balance(), 36);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 320, height: 640 });
    await tab('elephant').click();
    await greetWithMouse();
    assert.equal(await stage.evaluate(el => el.getAnimations({ subtree: true }).length), 0, 'reduced motion also applies to greetings');
    assert.equal(await stage.locator('.zoo-touch-response').evaluate(el => getComputedStyle(el).opacity), '1');
    await action('feed').click();
    assert.equal(await balance(), 24);
    assert.equal(await stage.evaluate(el => el.getAnimations({ subtree: true }).length), 0);
    assert.equal(await stage.locator('.feed-elephant-hay').isVisible(), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.locator('#zoo-body').screenshot({ path: 'test-results/zoo-feed-mobile.png' });
    await action('farm').click();
    assert.equal(await page.locator('.farm-wallet b').first().innerText(), '24');
    await page.evaluate(() => {
      __abc.Store.bind('other-child', { stars: 0, letters: {} }, false);
      __abc.App.show('zoo');
    });
    assert.equal(await holdings(), undefined, 'admitted animals are scoped to the active child');
    assert.equal(await action('admit').isDisabled(), true);
    assert.deepEqual(errors, []);

    const touch = await browser.newPage({ viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true, serviceWorkers: 'block' });
    touch.on('pageerror', error => errors.push(error.message));
    await touch.goto('http://127.0.0.1:' + server.address().port);
    await touch.waitForFunction(() => window.__abc?.Profiles.mode === 'local');
    await touch.evaluate(() => {
      __abc.Store.farm(f => { f.coins = 1000; });
      __abc.App.show('zoo');
    });
    await touch.locator('[data-zoo-animal="parrot"]').tap();
    await touch.locator('[data-zoo-action="admit"]').tap();
    await touch.locator('[data-zoo-action="confirm"]').tap();
    const touchStage = touch.locator('.zoo-stage');
    await touchStage.scrollIntoViewIfNeeded();
    const target = await touch.locator('.zoo-pet-target').boundingBox();
    await touch.touchscreen.tap(target.x + target.width / 2, target.y + target.height / 2);
    assert.equal(await touchStage.getAttribute('data-petting'), 'true');
    await touch.waitForFunction(() => !document.querySelector('.zoo-stage').dataset.petting);
    assert.equal(await touch.locator('.zoo-roam').evaluate(el => getComputedStyle(el).animationPlayState), 'running', 'a touch greeting resumes roaming without a sticky hover or focus pause');
    assert.equal(await touch.evaluate(() => __abc.Store.farm().coins), 460, 'touch greetings are free');
    await touch.screenshot({ path: 'test-results/zoo-depth-tablet-v65.png', fullPage: true });
    await touch.close();
    assert.deepEqual(errors, []);
    console.log('PASS: locked previews stay static; admission unlocks depth movement and free greetings; touch resumes roaming; nine feeding animations, reduced motion, 27 show acts, timer/background pause, wallet, save/reload and 320px layout.');
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
