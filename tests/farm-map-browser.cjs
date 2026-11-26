const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { createServer } = require('./preview.cjs');
const fs = require('node:fs');
(async () => {
  const server=createServer(); await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    fs.mkdirSync('test-results',{recursive:true});
    for (const [width,touch] of [[1440,false],[390,true],[320,true]]) {
      const context=await browser.newContext({viewport:{width,height:1000},hasTouch:touch,reducedMotion:'reduce',serviceWorkers:'block'});
      const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto('http://127.0.0.1:'+server.address().port);
      await page.waitForFunction(()=>window.__abc?.Profiles.mode==='local');
      await page.locator('[data-target="farm"]').click();
      await page.evaluate(()=>{
        __abc.Store.farm(f=>{
          f.animals=[];f.care={};f.food=10;f.water=10;
          for(const type of ['chick','cat','dog','bee','fish']) for(let i=0;i<4;i++) __abc.FarmEconomy.addAnimal(f,type);
          f.plots=Array(12).fill(null);
        });
        __abc.Pets.renderFarmScene(); __abc.Sound.stop();
        window.__calls=[];__abc.Sound.voice=(...args)=>__calls.push(args);
        window.__world=document.getElementById('farm-map-world');
      });
      const viewport=page.locator('#farm-map-viewport');
      await viewport.scrollIntoViewIfNeeded();
      const camera=()=>page.evaluate(()=>__abc.FarmMap.state().camera);
      const farm=()=>page.evaluate(()=>JSON.stringify(__abc.Store.farm()));
      const uid=await page.locator('[data-species="cat"]').last().getAttribute('data-animal');
      const button=page.locator('[data-animal="'+uid+'"]');
      for(const zone of ['yard','field','pets','pond']) {
        await page.evaluate(zone=>__abc.Pets.goZone(zone),zone);
        assert.equal(await page.locator('[data-animal]').count(),20);
        assert.equal(await page.evaluate(()=>window.__world===document.getElementById('farm-map-world')),true,'bookmarks move camera without rebuilding world');
      }
      await page.evaluate(uid=>__abc.FarmMap.focusAnimal(uid),uid);
      await viewport.scrollIntoViewIfNeeded();
      await page.waitForTimeout(70);
      const box=await button.boundingBox(),before=await camera(),saved=await farm();
      const selected=await page.locator('.farm-animal.selected').getAttribute('data-animal');
      const x=box.x+box.width/2,y=box.y+box.height/2;
      const cdp=touch?await context.newCDPSession(page):null;
      async function drag(x,y,dx,dy) {
        if(touch) {
          await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
          for(let n=1;n<=6;n++) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*n/6,y:y+dy*n/6,id:1}]});
          await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        } else {
          await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y+dy,{steps:6});await page.mouse.up();
        }
      }
      await drag(x,y,-85,-70);
      assert.notDeepEqual(await camera(),before,'drag moves the map at '+width+' '+JSON.stringify({box,before,after:await camera(),calls:await page.evaluate(()=>__calls)}));
      assert.equal(await farm(),saved,'drag cannot feed or pet an animal');
      assert.equal(await page.locator('.farm-animal.selected').getAttribute('data-animal'),selected,'drag cannot select its starting animal');
      assert.deepEqual(await page.evaluate(()=>__calls),[],'drag cannot play an animal reaction');
      assert.equal(await page.evaluate(()=>__abc.FarmMap.state().dragging),false);
      await page.evaluate(uid=>__abc.FarmMap.focusAnimal(uid),uid);
      const target=await button.boundingBox();
      if(touch) await page.touchscreen.tap(target.x+target.width/2,target.y+target.height/2);
      else await page.mouse.click(target.x+target.width/2,target.y+target.height/2);
      assert.equal(await button.getAttribute('aria-pressed'),'true','tap selects animal at '+width);
      await page.waitForTimeout(350); // A delayed browser click must not play a second reaction.
      assert.deepEqual(await page.evaluate(()=>__calls),[['cat','touch',{adult:false}]]);
      const beforeCare=await camera();
      await clickControl('[data-scene-care="food"]');
      assert.deepEqual(await camera(),beforeCare,'care keeps camera position');
      assert.equal(await page.evaluate(uid=>__abc.Store.farm().care[uid].food,uid),3);
      await page.evaluate(()=>__abc.Pets.goZone('field'));
      await viewport.scrollIntoViewIfNeeded();
      const plot=page.locator('[data-plot="4"]'),r=await plot.boundingBox();
      await drag(r.x+r.width/2,r.y+r.height/2,-65,-40);
      assert.equal(await page.locator('.farm-dialog').count(),0,'dragging from a crop cannot open planting');
      await page.evaluate(()=>__abc.Pets.goZone('field'));
      await plot.click();assert.equal(await page.locator('.farm-dialog').count(),1);
      await page.locator('#business-close').click();
      await viewport.scrollIntoViewIfNeeded();
      if(touch) {
        const r=await viewport.boundingBox(),x=r.x+r.width/2,y=r.y+r.height/2,old=await camera();
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-35,y,id:1},{x:x+35,y,id:2}]});
        await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-65,y,id:1},{x:x+65,y,id:2}]});
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        assert.ok((await camera()).scale>old.scale,'two fingers zoom the map');
        assert.equal(await page.locator('.farm-dialog').count(),0);
      }
      async function clickControl(selector) {
        const control=page.locator(selector);
        await control.scrollIntoViewIfNeeded();
        if(touch) {
          // Put the touch target below the fixed app toolbar, as a user would by scrolling.
          await control.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
          const r=await control.boundingBox();await page.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);await page.waitForTimeout(350);
        }
        else await control.click();
      }
      await clickControl('[data-map="all"]');
      const overview=await camera();
      await clickControl('[data-map="in"]');assert.ok((await camera()).scale>overview.scale);
      await clickControl('.farm-minimap');assert.deepEqual(await camera(),overview);
      await page.locator('.farm-world').screenshot({path:'test-results/farm-map-'+width+'.png'});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      await page.evaluate(() => {
        __abc.Store.farm(f => {
          const chick = f.animals.find(a => a.type === 'chick');
          f.care[chick.uid].growth = 5;
          f.business.production[chick.uid] = { readyAt: Date.now() - 100 };
        });
        __abc.Pets.renderFarmScene();
      });
      const pickup = page.locator('#farm-map-world [data-pickup="egg"]');
      const eggs = () => page.evaluate(() => __abc.FarmEconomy.stock(__abc.Store.farm(), 'egg'));
      await clickControl('[data-find-product="egg"]');
      const pile = await pickup.boundingBox();
      await drag(pile.x + pile.width / 2, pile.y + pile.height / 2, -64, -32);
      assert.equal(await eggs(), 0, 'dragging from a drop cannot pick it up');
      await clickControl('[data-find-product="egg"]');
      const drop = await pickup.boundingBox();
      if (touch) await page.touchscreen.tap(drop.x + drop.width / 2, drop.y + drop.height / 2);
      else await page.mouse.click(drop.x + drop.width / 2, drop.y + drop.height / 2);
      await pickup.waitFor({ state: 'detached' });
      assert.equal(await eggs(), 1, 'tapping a drop moves exactly one item into storage');
      // Legacy piles become separate targets; a tap and a delayed duplicate cannot sweep a region.
      await page.evaluate(() => {
        __abc.Store.farm(f => {
          f.business.groundProducts = Object.fromEntries(['egg','honey','pearl','milk','wool'].map(item => ['demo-' + item, { item, count: 3 }]));
        });
        __abc.Pets.renderFarmScene();
      });
      assert.equal(await page.locator('[data-pickup]').count(), 15);
      assert.equal(await page.locator('.farm-ground-item small').count(), 0);
      for (const item of ['egg','honey','pearl','milk','wool']) {
        const selector = `[data-pickup="${item}"]`;
        const before = await page.evaluate(item => __abc.FarmEconomy.stock(__abc.Store.farm(), item), item);
        const remaining = await page.locator(selector).evaluateAll(els => els.slice(1).map(el => ({ id: el.dataset.dropId, left: el.style.left, top: el.style.top })));
        await clickControl(`[data-find-product="${item}"]`);
        const first = page.locator(selector).first();
        await first.evaluate(el => { window.__oldDrop = el; });
        const r = await first.boundingBox();
        assert.ok(r.width >= 44 && r.height >= 44, 'focused pickups have touch-sized targets');
        if (touch) await page.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 2);
        else await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
        await page.evaluate(() => window.__oldDrop.click());
        assert.equal(await page.locator(selector).count(), 2);
        assert.equal(await page.evaluate(item => __abc.FarmEconomy.stock(__abc.Store.farm(), item), item), before + 1);
        assert.deepEqual(await page.locator(selector).evaluateAll(els => els.map(el => ({ id: el.dataset.dropId, left: el.style.left, top: el.style.top }))), remaining);
      }
      await page.evaluate(() => __abc.FarmMap.overview());
      await viewport.screenshot({ path: 'test-results/farm-scattered-products-' + width + '.png' });
      const remainingDrops = await page.locator('[data-pickup]').evaluateAll(els => els.map(el => ({ id: el.dataset.dropId, left: el.style.left, top: el.style.top })));
      await page.reload();
      await page.waitForFunction(() => window.__abc?.Profiles.mode === 'local');
      await page.locator('[data-target="farm"]').click();
      assert.deepEqual(await page.locator('[data-pickup]').evaluateAll(els => els.map(el => ({ id: el.dataset.dropId, left: el.style.left, top: el.style.top }))), remainingDrops);
      // Empty farms still allow map navigation.
      await page.evaluate(()=>{__abc.Store.farm(f=>{f.animals=[];f.care={};});__abc.Pets.renderFarmScene();});
      assert.equal(await page.locator('[data-animal]').count(),0);
      await page.locator('[data-map="in"]').click();
      await page.evaluate(()=>__abc.App.show('home'));
      assert.equal(await page.evaluate(()=>__abc.FarmMap.state().mounted),false);
      assert.equal(await page.evaluate(()=>__abc.FarmLife.state().count),0);
      await page.evaluate(()=>{__abc.Store.bind('map-test-second-child',{letters:{}},false);__abc.App.show('farm');});
      assert.equal(await page.locator('[data-animal]').count(),1,'new child gets their own farm');
      assert.notDeepEqual(await camera(),beforeCare,'new child cannot inherit the previous camera');
      assert.deepEqual(errors,[]);
      await context.close();
    }
    console.log('PASS: unified map, camera bookmarks, tap-only product pickup, mouse/touch dragging, care camera retention, pinch/zoom/overview and route cleanup at 320/390/1440px.');
  } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
