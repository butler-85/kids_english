/* Service Worker：公共部署（HTTPS）时启用，离线也能玩
 * 策略：字体/图标缓存优先；页面与代码网络优先（更新即时生效）+ 离线回退
 * 本地 http:// 访问时不注册（见 app.js），避免开发时缓存旧文件
 */
const VERSION = 'v63';
const CACHE = 'abc-park-' + VERSION;
const ASSET_V = '?v=63'; // 与 index.html 中的资源版本号保持一致
const FARM_AUDIO = [
  'chick', 'hen', 'kitten', 'cat', 'puppy', 'dog', 'purr', 'bee', 'fish', 'calf', 'cow', 'lamb', 'sheep',
  ...['chick', 'cat', 'dog', 'bee', 'fish', 'cow', 'sheep'].flatMap(species =>
    ['young', 'adult'].flatMap(age => ['food', 'water'].map(action => `${species}-${age}-${action}`))),
].map(clip => `sounds/farm-v1/${clip}.mp3`);
const CORE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css' + ASSET_V,
  'css/farm.css' + ASSET_V,
  'css/games.css' + ASSET_V,
  'css/child.css' + ASSET_V,
  'css/farm-life.css' + ASSET_V,
  'css/farm-map.css' + ASSET_V,
  'css/farm-growth.css' + ASSET_V,
  'css/farm-care.css' + ASSET_V,
  'css/zoo.css' + ASSET_V,
  'js/data.js' + ASSET_V,
  'js/farm-call-recordings.js' + ASSET_V,
  'js/audio.js' + ASSET_V,
  'js/storage.js' + ASSET_V,
  'js/profiles.js' + ASSET_V,
  'js/confetti.js' + ASSET_V,
  'js/games/gameUI.js' + ASSET_V,
  'js/games/letterPark.js' + ASSET_V,
  'js/games/skins.js' + ASSET_V,
  'js/games/listenFind.js' + ASSET_V,
  'js/games/soundMatch.js' + ASSET_V,
  'js/games/matchCase.js' + ASSET_V,
  'js/games/farmArt.js' + ASSET_V,
  'js/games/farmMotion.js' + ASSET_V,
  'js/games/farmLife.js' + ASSET_V,
  'js/games/farmMap.js' + ASSET_V,
  'js/games/farmEconomy.js' + ASSET_V,
  'js/games/farmBusiness.js' + ASSET_V,
  'js/games/pets.js' + ASSET_V,
  'js/games/zooArt.js' + ASSET_V,
  'js/games/zoo.js' + ASSET_V,
  'js/games/stickers.js' + ASSET_V,
  'js/app.js' + ASSET_V,
  'fonts/andika-400.woff2',
  'fonts/andika-700.woff2',
  'fonts/baloo2-700.woff2',
  'fonts/baloo2-800.woff2',
  'icons/icon-192.png',
  'icons/icon-512.png',
  ...FARM_AUDIO,
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function farmAudio(request) {
  const stored = await (await caches.open(CACHE)).match(request.url);
  if (!stored) return fetch(request);
  const range = /^bytes=(\d+)-(\d*)$/.exec(request.headers.get('Range') || '');
  if (!range) return stored;
  // Safari probes media with byte ranges, including when playing offline.
  const body = await stored.arrayBuffer();
  const start = Number(range[1]);
  const end = range[2] ? Math.min(Number(range[2]), body.byteLength - 1) : body.byteLength - 1;
  if (start > end) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${body.byteLength}` } });
  return new Response(body.slice(start, end + 1), { status: 206, headers: {
    'Content-Type': 'audio/mpeg',
    'Content-Length': String(end - start + 1),
    'Accept-Ranges': 'bytes',
    'Content-Range': `bytes ${start}-${end}/${body.byteLength}`,
  } });
}

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || e.request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return; // API 永远直连，离线由前端自行降级

  if (url.pathname.includes('/sounds/farm-v1/') && url.pathname.endsWith('.mp3')) {
    e.respondWith(farmAudio(e.request));
    return;
  }

  if (url.pathname.endsWith('.woff2') || url.pathname.includes('/icons/')) {
    // 稳定资源：缓存优先，未命中再取网络并写回
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
        const cp = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, cp));
        return r;
      }))
    );
    return;
  }

  // 页面与代码：网络优先（更新即时生效），离线回退缓存
  e.respondWith(
    fetch(e.request).then(r => {
      const cp = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, cp));
      return r;
    }).catch(() => caches.match(e.request).then(hit => hit || caches.match('./index.html')))
  );
});
