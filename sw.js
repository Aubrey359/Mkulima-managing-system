// Service worker: keeps a copy of the app on each device so it opens even without internet.
// - The app's own files: fetched fresh when online (so updates show straight away), with the
//   saved copy used when offline or when the network takes longer than a few seconds.
// - The pinned libraries from CDNs: saved copy first (their content never changes).
// - Everything else (Supabase sign-in and data) is left alone; syncing handles being offline.
var CACHE = 'mk-app-v1';
var NETWORK_WAIT_MS = 4000;
var CDN = [
  'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js'
];
var INDEX = new URL('index.html', self.registration.scope).href;

// Save index.html plus every file it links to under assets/, and the CDN libraries
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(async function (cache) {
      var res = await fetch(INDEX, { cache: 'no-cache' });
      var html = await res.clone().text();
      await cache.put(INDEX, res);
      var local = [];
      html.replace(/(?:src|href)="(assets\/[^"]+)"/g, function (m, path) {
        local.push(new URL(path, self.registration.scope).href);
      });
      await Promise.allSettled(
        local
          .map(function (u) {
            return fetch(u, { cache: 'no-cache' }).then(function (r) {
              if (r.ok) return cache.put(u, r);
            });
          })
          .concat(
            CDN.map(function (u) {
              return fetch(new Request(u, { mode: 'no-cors' })).then(function (r) {
                if (r.ok || r.type === 'opaque') return cache.put(u, r);
              });
            })
          )
      );
      await self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (k) {
              return k !== CACHE;
            })
            .map(function (k) {
              return caches.delete(k);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

async function networkFirst(request, key) {
  var cache = await caches.open(CACHE);
  var net = fetch(request).then(function (r) {
    if (r.ok) cache.put(key, r.clone());
    return r;
  });
  try {
    return await Promise.race([
      net,
      new Promise(function (resolve, reject) {
        setTimeout(reject, NETWORK_WAIT_MS);
      })
    ]);
  } catch (e) {
    var saved = await cache.match(key, { ignoreSearch: true });
    return saved || net;
  }
}

async function cacheFirst(request) {
  var cache = await caches.open(CACHE);
  var saved = await cache.match(request.url);
  if (saved) return saved;
  var r = await fetch(request);
  if (r.ok || r.type === 'opaque') cache.put(request.url, r.clone());
  return r;
}

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin === self.location.origin) {
    var key = req.mode === 'navigate' ? INDEX : url.origin + url.pathname;
    event.respondWith(networkFirst(req, key));
  } else if (CDN.indexOf(url.href) >= 0) {
    event.respondWith(cacheFirst(req));
  }
});
