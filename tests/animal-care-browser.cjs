const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { resolve } = require('node:path');
const { createServer } = require('./preview.cjs');
(async () => {
  const server = createServer(); await new Promise(r => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, serviceWorkers: 'block' });
    await context.route('**/cow-young-food.mp3', async route => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.continue();
    });
    const page = await context.newPage(), errors = [], performances = new Set();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:' + server.address().port);
    await page.waitForFunction(() => window.__abc?.Profiles.mode === 'local');
    await page.locator('[data-target="farm"]').click();
    const animals = await page.evaluate(() => {
      __abc.Store.farm(f => {
        f.animals=[]; f.care={}; f.food=f.water=50;
        for (const type of ['cow','sheep','chick','cat','dog','bee','fish']) for (const adult of [false,true]) {
          const a=__abc.FarmEconomy.addAnimal(f,type); if(adult) f.care[a.uid].growth=5;
        }
      });
      __abc.Pets.renderFarmScene(); __abc.Sound.stop();
      const voice=__abc.Sound.voice; window.__calls=[]; window.__played=[];
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        return play.call(this).then(() => { __played.push(this.src); });
      };
      __abc.Sound.voice=(type, action, opts)=>{
        const { onStart, adult } = opts;
        __calls.push([type, action, { adult, sync: typeof onStart === 'function' }]);
        if (!onStart) return voice(type, action, opts);
        const clock = () => document.querySelector('.care-portrait .creature-head').getAnimations()[0]?.currentTime;
        return voice(type, action, { ...opts, onStart: () => {
          const before = clock();
          onStart();
          window.__careSync = { type, action, before, after: clock() };
        } });
      };
      return __abc.Store.farm().animals.map(a=>({...a,adult:__abc.FarmEconomy.adult(__abc.Store.farm(),a)}));
    });
    for (const a of animals) for (const kind of ['food','water']) {
      await page.evaluate(uid=>__abc.FarmMap.focusAnimal(uid),a.uid);
      await page.locator(`[data-animal="${a.uid}"]`).click();
      const before = await page.evaluate(()=>JSON.parse(JSON.stringify(__abc.Store.farm())));
      await page.locator(`[data-scene-care="${kind}"]`).click();
      const clip = `${a.type}-${a.adult ? 'adult' : 'young'}-${kind}.mp3`;
      await page.waitForFunction(clip => __played.at(-1)?.endsWith('/' + clip), clip);
      const mode = kind==='food'?'eat':'drink';
      assert.equal(await page.locator('.farm-animal.selected').getAttribute('data-behavior'), mode);
      assert.equal(await page.locator('.care-portrait').getAttribute('data-behavior'), mode);
      const primary = ['bee','fish'].includes(a.type)?'.creature-pose':'.creature-head';
      const animation=await page.locator('.care-portrait '+primary).evaluate(el=>({name:getComputedStyle(el).animationName,duration:getComputedStyle(el).animationDuration}));
      assert.notEqual(animation.name,'none'); assert.notEqual(animation.name,'care-still');
      const livestock = a.type === 'cow' || a.type === 'sheep';
      if (livestock) {
        const expected = a.type === 'cow' ? (kind === 'food' ? 'long-grass' : 'water-trough') : (kind === 'food' ? 'short-grass' : 'shallow-water');
        assert.equal(await page.locator('.care-portrait .care-' + kind).getAttribute('data-prop'), expected);
        await page.waitForFunction(([type, action]) => window.__careSync?.type === type && window.__careSync?.action === action, [a.type, kind]);
        const sync = await page.evaluate(() => __careSync);
        assert.equal(sync.after, 0, 'care animations align to the start of the audio');
        if (a.type === 'cow' && !a.adult && kind === 'food') assert.ok(sync.before > 250);
        const mouth = page.locator('.care-portrait .livestock-jaw');
        assert.notEqual(await mouth.evaluate(el => getComputedStyle(el).animationName), 'none');
      } else {
        assert.ok(!performances.has(animation.name),'each original species/age/action uses a distinct primary pose');
        performances.add(animation.name);
      }
      assert.equal(animation.duration,'4.2s');
      for (const parent of ['.farm-animal.selected','.care-portrait']) {
        assert.equal(await page.locator(`${parent} .care-${kind}`).evaluate(el=>getComputedStyle(el).display),'block');
        assert.equal(await page.locator(`${parent} .care-${kind==='food'?'water':'food'}`).evaluate(el=>getComputedStyle(el).display),'none');
      }
      assert.equal(await page.evaluate(()=>__abc.Sound.activeAnimalSounds>0),true);
      assert.deepEqual(await page.evaluate(()=>__calls.at(-1)),[a.type==='chick'&&a.adult?'hen':a.type,kind,{adult:a.adult,sync:livestock}]);
      const saved=await page.evaluate(()=>JSON.stringify(__abc.Store.farm()));
      assert.equal(JSON.parse(saved)[kind],before[kind]-1);
      assert.equal(await page.locator(`[data-scene-care="${kind}"]`).isDisabled(),true);
      await page.locator(`[data-replay-care="${kind}"]`).click();
      assert.equal(await page.evaluate(()=>JSON.stringify(__abc.Store.farm())),saved,'replay never consumes resources or increases growth/affection');
    }
    assert.equal(performances.size,20);
    // Real time advances a care pose while the animal stays in its map position.
    await page.locator('[data-replay-care="water"]').click();
    const p=page.locator('.care-portrait .creature-pose');
    const first=await p.evaluate(el=>getComputedStyle(el).transform);
    await page.waitForTimeout(700);
    assert.notEqual(await p.evaluate(el=>getComputedStyle(el).transform),first);
    await p.evaluate(el=>el.getAnimations().forEach(a=>a.finish()));
    await page.locator('[data-replay-care="water"]').click();
    assert.ok(await p.evaluate(el=>el.getAnimations()[0].currentTime < 250),'replaying the same action restarts its pose');
    await page.waitForTimeout(300);
    assert.ok(await p.evaluate(el=>el.getAnimations()[0].currentTime>200),'a finished CSS animation runs again on replay');
    await page.waitForFunction(()=>document.querySelector('.care-portrait').dataset.behavior!=='drink',null,{timeout:7000});
    assert.equal(await page.locator('.care-portrait .care-water').evaluate(el=>getComputedStyle(el).display),'none','props disappear when the performance ends');
    await page.locator('[data-replay-care="water"]').click(); await page.locator('#btn-mute').click();
    assert.equal(await page.evaluate(()=>__abc.Sound.activeAnimalSounds),0);
    await page.locator('[data-replay-care="food"]').click();
    assert.equal(await page.evaluate(()=>__abc.Sound.activeAnimalSounds),0);
    await page.locator('#btn-mute').click();
    await page.emulateMedia({reducedMotion:'reduce'}); await page.locator('[data-replay-care="water"]').click();
    assert.equal(await p.evaluate(el=>getComputedStyle(el).animationName),'none');
    assert.equal(await page.locator('.care-portrait .care-water').evaluate(el=>getComputedStyle(el).display),'block');
    for(const width of [320,390,820]) {
      await page.setViewportSize({width,height:1000});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      assert.ok((await page.locator('[data-replay-care="water"]').boundingBox()).height>=44);
      await page.locator('[data-replay-care="water"]').click();
      await page.waitForTimeout(150);
      assert.ok(await page.evaluate(()=>__abc.Sound.activeAnimalSounds>0),'care sound works with the map scrolled off screen');
      await page.waitForFunction(()=>{const r=document.querySelector('.care-portrait').getBoundingClientRect();return r.top>=64&&r.bottom<=innerHeight;});
    }
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.locator('[data-replay-care="water"]').click();
    await page.locator('[data-panel="inventory"]').click();
    assert.equal(await page.evaluate(()=>__abc.Sound.activeAnimalSounds),0);
    assert.equal(await p.evaluate(el=>getComputedStyle(el).animationPlayState),'paused');
    await page.locator('#business-close').click();
    await page.locator('[data-replay-care="water"]').click(); await page.locator('#care-shop').click();
    assert.equal(await page.evaluate(()=>__abc.Sound.activeAnimalSounds),0);
    // Decode the same local recordings used during play.
    const audioStats = await page.evaluate(async () => {
      const decoder = new OfflineAudioContext(1, 44100, 44100);
      const calls = ['chick', 'hen', 'kitten', 'cat', 'puppy', 'dog', 'bee', 'fish', 'purr', 'calf', 'cow', 'lamb', 'sheep'];
      const care = ['chick','cat','dog','bee','fish','cow','sheep'].flatMap(type =>
        ['young','adult'].flatMap(age => ['food','water'].map(action => [type, age, action].join('-'))));
      return Promise.all([...calls, ...care].map(async clip => {
        const response = await fetch('sounds/farm-v1/' + clip + '.mp3');
        if (!response.ok) throw new Error('Missing farm audio: ' + clip);
        const decoded = await decoder.decodeAudioData(await response.arrayBuffer());
        const samples = decoded.getChannelData(0);
        let peak = 0, energy = 0, last = 0;
        for (let i = 0; i < samples.length; i++) {
          const v = Math.abs(samples[i]);
          peak = Math.max(peak, v); energy += v * v;
          if (v > .004) last = i;
        }
        return { clip, peak, rms: Math.sqrt(energy / samples.length), duration: decoded.duration,
          lastSound: last / decoded.sampleRate, care: care.includes(clip) };
      }));
    });
    for (const sound of audioStats) {
      assert.ok(sound.peak > .035 && sound.rms > .002, JSON.stringify(sound) + ' must be audible');
      assert.ok(sound.peak < .55, 'peak stays gentle and unclipped');
      if (sound.care) assert.ok(sound.lastSound > 2.5 && sound.duration <= 4.2, 'care audio fits the gesture');
      else assert.ok(sound.duration <= 1.8, 'a greeting is short');
    }
    fs.mkdirSync('test-results',{recursive:true}); fs.writeFileSync('test-results/animal-care-audio-check.json',JSON.stringify(audioStats,null,2));
    const gallery = await page.evaluate(() => [false, true].flatMap(adult =>
      ['chick', 'cat', 'dog', 'bee', 'fish', 'cow', 'sheep'].map(type => {
        const habits = (adult ? FarmMotion.ADULT_HABITS : FarmMotion.HABITS)[type];
        return { type, adult, svg: FarmArt.animal(type, adult), touch: habits.touch[0], pet: habits.bond };
      })));
    const names = { chick: ['小鸡','母鸡'], cat: ['小猫','成年猫'], dog: ['小狗','成年狗'],
      bee: ['小蜜蜂','成年蜜蜂'], fish: ['小鱼','大鱼'], cow: ['小牛','奶牛'], sheep: ['小羊','绵羊'] };
    const css = ['farm-life','farm-growth','farm-care'].map(f => fs.readFileSync(`css/${f}.css`,'utf8')).join('\n');
    const cards = gallery.map(g => `
      <article class="care-portrait" data-type="${g.type}" data-adult="${g.adult}"
        data-touch="${g.touch}" data-pet="${g.pet}">
        <h2>${names[g.type][+g.adult]}</h2>${g.svg}
        <div class="listen-buttons">
          <button data-call="touch">听回应</button><button data-call="pet">摸摸</button>
          <button data-call="food">进食</button><button data-call="water">饮水</button>
        </div>
      </article>`).join('');
    const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><base href="../">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>农场动物声音试听</title><style>${css}
      body{margin:0;padding:12px;background:#f7f4e9;color:#506544;font-family:Arial,'Microsoft YaHei',sans-serif}
      h1{font-size:23px;margin:0 0 8px}h2{font-size:16px;margin:0}
      main{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:8px;max-width:900px}
      article{background:#fffdf7;border:1px solid #d8dfcc;border-radius:18px;text-align:center;padding:8px}
      article svg{display:block;width:130px;height:140px;margin:auto;overflow:visible}\n      .listen-buttons{display:grid;grid-template-columns:repeat(2,1fr);gap:4px}
      button{font:inherit;font-size:13px;color:inherit;background:#edf4e2;border:1px solid #c9d6bc;border-radius:8px;padding:4px;cursor:pointer;min-height:44px}
      </style><header><h1>农场动物声音试听</h1><p>每种动物都有幼年和成年形象。点击按钮试听回应、摸摸、进食和饮水。</p></header>
      <main>${cards}</main><script src="js/farm-call-recordings.js"></script><script>${fs.readFileSync('js/audio.js','utf8')}</script>
      <script>
        document.querySelectorAll('[data-call]').forEach(button => {
          button.onclick = () => {
            const card = button.closest('article');
            const action = button.dataset.call;
            card.removeAttribute('data-behavior');
            void card.offsetWidth;
            card.dataset.behavior = {food: 'eat', water: 'drink', touch: card.dataset.touch, pet: card.dataset.pet}[action];
            Sound.voice(card.dataset.type, action, {adult: card.dataset.adult === 'true'});
          };
        });
      </script></html>`;
    fs.mkdirSync('test-results',{recursive:true}); fs.writeFileSync('test-results/animal-care-preview.html',html);
    const preview=await context.newPage(); await preview.setViewportSize({width:1180,height:1150});
    await preview.goto(pathToFileURL(resolve('test-results/animal-care-preview.html')).href);
    await preview.evaluate(() => {
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        return play.call(this).then(() => { window.previewPlayed = this.src; });
      };
    });
    await preview.locator('[data-type="cat"][data-adult="false"] [data-call="touch"]').click();
    await preview.waitForFunction(() => window.previewPlayed?.endsWith('/kitten.mp3'));
    await preview.evaluate(()=>document.getAnimations().forEach(a=>{a.pause();a.currentTime=1100;}));
    await preview.screenshot({path:'test-results/animal-care-preview.png',fullPage:true});

    // The actual site also plays the recordings when opened directly from the project folder.
    const local = await context.newPage();
    await local.goto(pathToFileURL(resolve('index.html')).href);
    await local.evaluate(() => {
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        return play.call(this).then(() => { window.filePlayed = this.src; });
      };
    });
    await local.locator('[data-target="farm"]').click();
    await local.locator('[data-species="chick"]').click();
    await local.waitForFunction(() => window.filePlayed?.endsWith('/chick.mp3'));
    await local.close();

    // Force failed and stalled playback without touching the audio files or the existing browser profile.
    const fallbackContext = await browser.newContext({ serviceWorkers: 'block', reducedMotion: 'reduce' });
    const fallback = await fallbackContext.newPage();
    fallback.on('pageerror', e => errors.push(e.message));
    await fallback.route('**/sounds/farm-v1/*.mp3', route => route.fulfill({ status: 404 }));
    await fallback.goto(page.url());
    await fallback.locator('[data-target="farm"]').click();
    await fallback.evaluate(() => {
      window.backupCalls = [];
      const labels = new WeakMap();
      const decode = AudioContext.prototype.decodeAudioData;
      AudioContext.prototype.decodeAudioData = function (bytes, success, failure) {
        const encoded = btoa(String.fromCharCode(...new Uint8Array(bytes)));
        const call = Object.keys(FARM_CALL_RECORDINGS).find(key => FARM_CALL_RECORDINGS[key] === encoded);
        return decode.call(this, bytes, buffer => { labels.set(buffer, call); success(buffer); }, failure);
      };
      const start = AudioBufferSourceNode.prototype.start;
      AudioBufferSourceNode.prototype.start = function (...args) {
        const result = start.apply(this, args);
        const call = labels.get(this.buffer);
        if (call) window.backupCalls.push({ call, duration: this.buffer.duration, state: this.context.state });
        return result;
      };
    });
    const chick = fallback.locator('[data-species="chick"]').first();
    await chick.click();
    await fallback.waitForFunction(() => window.backupCalls.length > 0);
    const [greeting] = await fallback.evaluate(() => window.backupCalls);
    assert.equal(greeting.call, 'chick');
    assert.equal(greeting.state, 'running');
    assert.ok(greeting.duration > 0);
    await fallback.locator('[data-care="food"]').click();
    await fallback.waitForFunction(() => window.backupCalls.length === 2);
    assert.equal(await fallback.evaluate(() => window.backupCalls[1].call), 'chick', 'missing care audio still plays the selected animal');
    await fallback.locator('#btn-mute').click();
    assert.equal(await fallback.evaluate(() => __abc.Sound.activeAnimalSounds), 0);
    await chick.click();
    assert.equal(await fallback.evaluate(() => window.backupCalls.length), 2);
    await fallback.locator('#btn-mute').click();
    await fallback.unroute('**/sounds/farm-v1/*.mp3');
    await fallback.evaluate(() => { HTMLMediaElement.prototype.play = () => new Promise(() => {}); });
    await chick.click();
    await fallback.waitForFunction(() => window.backupCalls.length === 3);
    await chick.click();
    await fallback.locator('#btn-home').click();
    await fallback.waitForTimeout(1250);
    assert.equal(await fallback.evaluate(() => window.backupCalls.length), 3, 'navigation cancels a pending fallback');
    await fallbackContext.close();

    const offline = await browser.newContext();
    const offlinePage = await offline.newPage();
    await offlinePage.goto(page.url());
    await offlinePage.waitForFunction(() => !!navigator.serviceWorker.controller);
    await offline.setOffline(true);
    const range = await offlinePage.evaluate(async () => {
      const part = await fetch('sounds/farm-v1/chick.mp3', { headers: { Range: 'bytes=0-1' } });
      return { status: part.status, range: part.headers.get('Content-Range'), length: (await part.arrayBuffer()).byteLength };
    });
    assert.equal(range.status, 206);
    assert.match(range.range, /^bytes 0-1\/\d+$/);
    assert.equal(range.length, 2, 'offline Safari media probe gets exactly two bytes');
    await offlinePage.reload();
    await offlinePage.locator('[data-target="farm"]').click();
    await offlinePage.evaluate(() => {
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        return play.call(this).then(() => { window.offlinePlayed = this.src; });
      };
    });
    await offlinePage.locator('[data-species="chick"]').click();
    await offlinePage.waitForFunction(() => window.offlinePlayed?.endsWith('/chick.mp3'));
    await offline.close();
    assert.deepEqual(errors,[]);
    console.log('PASS: 28 care interactions, 41 decoded recordings, synchronized cow/sheep poses, local and offline playback, recovery, free replays, mute, overlays and mobile layouts.');
  } finally { await browser.close(); server.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
