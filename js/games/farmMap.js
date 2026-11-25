/* One connected farm. World coordinates stay independent of the camera and the saved farm. */
const FarmMap = (() => {
  function layout(animals) {
    const counts = { land: 0, bee: 0, fish: 0 };
    animals.forEach(a => counts[a.type === 'bee' ? 'bee' : a.type === 'fish' ? 'fish' : 'land']++);
    const unit = Math.max(1, Math.sqrt(counts.land / 30), Math.sqrt(counts.bee / 12), Math.sqrt(counts.fish / 6));
    const box = (x, y, width, height) => ({ x: x * unit, y: y * unit, width: width * unit, height: height * unit });
    const land = box(65, 195, 760, 950), flowers = box(950, 115, 660, 220), pond = box(995, 855, 640, 300);
    const barn = box(80, 180, 250, 235);
    return { width: 1760 * unit, height: 1240 * unit, unit,
      habitats: { land: { ...land, obstacles: [barn] }, bee: flowers, fish: { ...pond, pond: true } },
      homes: { chick: box(390, 240, 330, 220), hen: box(390, 240, 330, 220), cat: box(120, 755, 320, 220), dog: box(405, 815, 320, 220),
        cow: box(310, 725, 415, 240), sheep: box(140, 920, 470, 220) },
      zones: { yard: box(90, 160, 700, 430), field: box(1000, 360, 500, 350), pets: box(85, 685, 740, 460), pond },
      pickups: { egg: [650 * unit, 465 * unit], honey: [1235 * unit, 290 * unit], pearl: [1095 * unit, 855 * unit],
        milk: [661 * unit, 923 * unit], wool: [311 * unit, 1065 * unit] },
      plots: Array.from({ length: 12 }, (_, i) => ({ x: (1025 + (i % 3) * 145) * unit, y: (350 + Math.floor(i / 3) * 90) * unit, width: 124, height: 82 })) };
  }
  function art(map) {
    const trees = [[85,90],[330,70],[710,95],[1650,110],[1690,530],[80,1170],[720,1175],[1680,1190]];
    // Separate west/east junctions leave room for all four crop rows above the east road.
    // The barn approach joins from below, without cutting through the chick lawn.
    const roads = 'M870-20C850 200 890 420 870 640S850 1040 885 1260M-20 620Q380 560 870 620M865 780H1780M205 405V600';
    const tree = (x,y,i) => `<g transform="translate(${x} ${y})"><path d="M0 0v65" stroke="#9a8058" stroke-width="16"/><circle cx="-24" cy="-8" r="40" fill="#83a980"/><circle cx="25" cy="-18" r="45" fill="#91b58b"/><circle cy="-40" r="42" fill="${i % 2 ? '#acc995' : '#a0c290'}"/></g>`;
    return `<svg class="connected-landscape" viewBox="0 0 1760 1240" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id="map-grass" width="94" height="78" patternUnits="userSpaceOnUse"><path d="m17 40 5-7 4 9m43 20 4-8 6 7" stroke="#acc38b" stroke-width="3" fill="none" opacity=".7"/></pattern></defs>
      <rect width="1760" height="1240" rx="65" fill="#cfdfac"/><rect width="1760" height="1240" fill="url(#map-grass)"/>
      <path data-terrain="yard" d="M365 215Q555 185 755 230L755 490Q565 520 365 490Z" fill="#c2d498"/><ellipse data-terrain="meadow" cx="415" cy="935" rx="370" ry="225" fill="#c4d89e"/>
      <rect data-terrain="garden" x="985" y="325" width="495" height="390" rx="28" fill="#afbf85"/><path data-terrain="flowers" d="M972 130Q1250 85 1630 150L1620 340Q1270 315 970 300Z" fill="#d8e2ab"/>
      <path data-map-road d="${roads}" stroke="#b6be8f" stroke-width="92" fill="none" stroke-linejoin="round"/>
      <path d="${roads}" stroke="#e9d9ad" stroke-width="76" fill="none" stroke-linejoin="round"/>
      <g transform="translate(80 180)"><path d="M0 70h250v165H0" fill="#cf9879"/><path d="m-20 75 145-105L270 75Z" fill="#aa725d" stroke="#f7edcf" stroke-width="9" stroke-linejoin="round"/><rect x="83" y="125" width="85" height="110" rx="5" fill="#8e7057"/><path d="m90 133 69 92m0-92-69 92" stroke="#e7d2ab" stroke-width="6"/><rect x="101" y="46" width="48" height="43" rx="6" fill="#f4e5b8"/><path d="M125 48v40m-22-20h44" stroke="#ad8061" stroke-width="5"/></g>
      <ellipse data-terrain="pond" cx="1315" cy="1005" rx="348" ry="165" fill="#9fb88d"/><ellipse cx="1315" cy="1005" rx="320" ry="150" fill="#a6d0c8"/><ellipse cx="1315" cy="1001" rx="304" ry="138" fill="#afd9d2"/>
      <g stroke="#e2f1d9" stroke-width="5" stroke-linecap="round"><path d="M1110 925h80m185 180h85m-220-100h55m200-95h55"/></g><g fill="#7ea884"><ellipse cx="1530" cy="1115" rx="35" ry="18"/><ellipse cx="1120" cy="1095" rx="29" ry="15"/></g><path d="m1520 1108 10-25 14 25" fill="#edc8ba"/>
      <g stroke="#f9efd3" stroke-width="9" stroke-linecap="round"><path d="M380 175h370M100 690h220m220 0h255M960 110h180m220 0h260"/>${[380,450,520,590,660,730].map(x=>`<path d="M${x} 155v42"/>`).join('')}${[100,170,240,540,610,680,750].map(x=>`<path d="M${x} 670v45"/>`).join('')}</g>
      ${trees.map(([x,y],i)=>tree(x,y,i)).join('')}
      ${Array.from({length:30},(_,i)=>{const x=970+(i*137)%650,y=145+(i*47)%145;return `<g transform="translate(${x} ${y})"><path d="M0 0v16" stroke="#7f9a64" stroke-width="4"/><circle r="8" fill="${i%2?'#fff4d5':'#e4b99c'}"/><circle r="3" fill="#d8b763"/></g>`;}).join('')}
      <g fill="#fff4d2">${Array.from({length:22},(_,i)=>`<circle cx="${115+(i*151)%610}" cy="${755+(i*63)%335}" r="4"/>`).join('')}</g>
      </svg>`;
  }
  let viewport = null, world = null, map = null, cleanup = [], camera = null, profile = null;
  let gesture = null, suppressClick = false, dragging = false;
  const pointers = new Map();
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  function limits() { return { min: Math.min(viewport.clientWidth / map.width, viewport.clientHeight / map.height) * .97, max: 1.5 }; }
  function apply() {
    if (!viewport || !camera) return;
    const w = viewport.clientWidth, h = viewport.clientHeight;
    camera.scale = clamp(camera.scale, limits().min, limits().max);
    camera.x = map.width * camera.scale <= w ? (w - map.width * camera.scale) / 2 : clamp(camera.x, w - map.width * camera.scale, 0);
    camera.y = map.height * camera.scale <= h ? (h - map.height * camera.scale) / 2 : clamp(camera.y, h - map.height * camera.scale, 0);
    world.style.transform = `translate3d(${camera.x}px,${camera.y}px,0) scale(${camera.scale})`;
    const box = viewport.querySelector('.mini-camera');
    if (box) { box.style.cssText = `left:${Math.max(0,-camera.x/camera.scale/map.width)*100}%;top:${Math.max(0,-camera.y/camera.scale/map.height)*100}%;width:${Math.min(1,w/camera.scale/map.width)*100}%;height:${Math.min(1,h/camera.scale/map.height)*100}%`; }
  }
  function center(x,y,scale=camera?.scale || .9) {
    if (!viewport) return;
    camera = { x: viewport.clientWidth/2-x*scale, y: viewport.clientHeight/2-y*scale, scale }; apply();
  }
  function zoom(factor, x, y) {
    if (!viewport) return;
    x ??= viewport.clientWidth/2; y ??= viewport.clientHeight/2;
    const scale = clamp(camera.scale*factor, limits().min, limits().max);
    const wx=(x-camera.x)/camera.scale, wy=(y-camera.y)/camera.scale;
    camera = { x:x-wx*scale, y:y-wy*scale, scale }; apply();
  }
  function overview() { if (viewport) center(map.width/2,map.height/2,limits().min); }
  function focusZone(zone) {
    if (!viewport || !map.zones[zone]) return;
    const z=map.zones[zone];
    const scale = zone === 'field' ? Math.min(1,viewport.clientWidth/(z.width+24),viewport.clientHeight/(z.height+30)) : .9;
    center(z.x+z.width/2,z.y+z.height/2,scale);
  }
  function focusAnimal(uid) {
    const a=FarmLife.state().actors.find(a=>a.uid===uid);
    if (a) center(a.x+a.width/2,a.y+a.height/2,.95);
  }
  function focusProduct(item) {
    const spot = map?.pickups[item];
    if (spot) center(spot[0], spot[1], .95);
  }
  function setDragging(on) { if (dragging===on) return; dragging=on; viewport?.classList.toggle('is-dragging',on); document.dispatchEvent(new CustomEvent('farm-camera-drag',{detail:on})); }
  function detach() {
    cleanup.forEach(fn=>fn()); cleanup=[]; pointers.clear(); gesture=null; suppressClick=false;
    setDragging(false); viewport=null; world=null; map=null;
  }
  function stop() { detach(); camera=null; profile=null; }
  function mount(nextMap, profileId, initialUid) {
    detach(); if (profile!==profileId) { camera=null; profile=profileId; }
    map=nextMap; viewport=document.getElementById('farm-map-viewport'); world=document.getElementById('farm-map-world');
    if (!camera) { camera={x:0,y:0,scale:.9}; if (viewport.clientWidth>=700) overview(); else { focusZone('yard'); focusAnimal(initialUid); } }
    apply();
    function down(e) {
      if (e.button !== 0) return;
      suppressClick=false;
      const control=e.target.closest('.map-controls button, .farm-minimap, .map-guide');
      if (control && e.pointerType !== 'touch') return;
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if (pointers.size===1) gesture={x:e.clientX,y:e.clientY,cx:camera.x,cy:camera.y,control:!!control,target:control || e.target.closest('[data-animal], [data-plot], [data-pickup]')};
      else {
        const [a,b]=[...pointers.values()], r=viewport.getBoundingClientRect(), x=(a.x+b.x)/2-r.x,y=(a.y+b.y)/2-r.y;
        gesture={pinch:true,distance:Math.hypot(a.x-b.x,a.y-b.y),scale:camera.scale,wx:(x-camera.x)/camera.scale,wy:(y-camera.y)/camera.scale}; setDragging(true);
      }
    }
    function move(e) {
      if (!pointers.has(e.pointerId) || !gesture) return;
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if (gesture.control) return;
      if (gesture.pinch && pointers.size>=2) {
        const [a,b]=[...pointers.values()],r=viewport.getBoundingClientRect(),x=(a.x+b.x)/2-r.x,y=(a.y+b.y)/2-r.y;
        const scale=clamp(gesture.scale*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,gesture.distance),limits().min,limits().max);
        camera={x:x-gesture.wx*scale,y:y-gesture.wy*scale,scale}; apply(); e.preventDefault(); return;
      }
      if (gesture.pinch) return;
      const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
      if (!dragging && Math.hypot(dx,dy)<8) return;
      setDragging(true); camera.x=gesture.cx+dx; camera.y=gesture.cy+dy; apply(); e.preventDefault();
      try { viewport.setPointerCapture(e.pointerId); } catch (_) {}
    }
    function up(e) {
      if (!pointers.has(e.pointerId)) return;
      const tap = e.type==='pointerup' && e.pointerType==='touch' && !dragging && !gesture?.pinch && gesture?.target
        && Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)<8 ? gesture.target : null;
      pointers.delete(e.pointerId); suppressClick=dragging || gesture?.pinch || gesture?.control || !!tap;
      try { if(viewport.hasPointerCapture(e.pointerId)) viewport.releasePointerCapture(e.pointerId); } catch (_) {}
      if (!pointers.size) { gesture=null; setDragging(false); }
      // Touch activation is tied to this completed tap, independent of delayed compatibility clicks.
      if(tap?.isConnected) { e.preventDefault(); tap.click(); }
    }
    function click(e) { if (suppressClick && e.detail!==0) { suppressClick=false; e.preventDefault(); e.stopImmediatePropagation(); } }
    function wheel(e) { if(e.ctrlKey) { const r=viewport.getBoundingClientRect(); zoom(e.deltaY<0?1.12:1/1.12,e.clientX-r.x,e.clientY-r.y); e.preventDefault(); } }
    function key(e) {
      const shift={ArrowLeft:[85,0],ArrowRight:[-85,0],ArrowUp:[0,85],ArrowDown:[0,-85]}[e.key];
      if(shift) { camera.x+=shift[0]; camera.y+=shift[1]; apply(); e.preventDefault(); }
      else if(['+','=','-','0'].includes(e.key)) { e.key==='0'?overview():zoom(e.key==='-'?1/1.2:1.2); e.preventDefault(); }
    }
    function cancelGesture() {
      for (const id of pointers.keys()) { try { if(viewport.hasPointerCapture(id)) viewport.releasePointerCapture(id); } catch (_) {} }
      pointers.clear(); gesture=null; suppressClick=true; setDragging(false);
    }
    function visibility() { if(document.hidden) cancelGesture(); }
    const listen=(el,event,fn,opts)=>{el.addEventListener(event,fn,opts);cleanup.push(()=>el.removeEventListener(event,fn,opts));};
    listen(viewport,'pointerdown',down);listen(window,'pointermove',move,{passive:false});listen(window,'pointerup',up);listen(window,'pointercancel',up);
    listen(viewport,'click',click,true);listen(viewport,'wheel',wheel,{passive:false});listen(viewport,'keydown',key);
    listen(window,'blur',cancelGesture);listen(document,'visibilitychange',visibility);
    viewport.querySelector('[data-map="in"]').onclick=()=>zoom(1.25);
    viewport.querySelector('[data-map="out"]').onclick=()=>zoom(.8);
    viewport.querySelector('[data-map="all"]').onclick=overview;
    viewport.querySelector('.farm-minimap').onclick=overview;
    const resize=new ResizeObserver(apply);resize.observe(viewport);cleanup.push(()=>resize.disconnect());
  }
  return { layout, art, mount, detach, stop, focusZone, focusAnimal, focusProduct, overview, zoom,
    state:()=>({mounted:!!viewport,dragging,camera:camera?{...camera}:null,width:map?.width||0,height:map?.height||0}) };
})();
