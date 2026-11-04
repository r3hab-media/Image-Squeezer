// Generated into /sw.js by build.mjs. Edit this file, not the generated one.
// VERSION is a hash of the precached files, so it changes only when they do.
const VERSION = '__VERSION__';
const CACHE = 'image-squeezer-' + VERSION;

const OFFLINE_PAGE = 'offline.html';
const PRECACHE = __PRECACHE__;

// Shared files are parked here for the page to collect, so it survives version changes.
const SHARE_CACHE = 'image-squeezer-shared';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== SHARE_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// The share sheet POSTs here. Stash the files, then redirect to a normal page load.
async function receiveShare(request) {
  try {
    const form = await request.formData();
    const files = form.getAll('images').filter((f) => f && typeof f.name === 'string');
    const cache = await caches.open(SHARE_CACHE);
    for (const key of await cache.keys()) await cache.delete(key);
    await Promise.all(
      files.slice(0, 25).map((file, i) =>
        cache.put(
          new Request(`shared-${String(i).padStart(2, '0')}`),
          new Response(file, {
            headers: {
              'Content-Type': file.type || 'application/octet-stream',
              'X-Shared-Name': encodeURIComponent(file.name),
            },
          })
        )
      )
    );
  } catch {}
  return Response.redirect('./?shared=1', 303);
}

// Serve from cache first and refresh the cached copy in the background.
// Files not listed above (the HEIC decoder, for one) are cached the first time they are used.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.method === 'POST' && url.pathname.endsWith('/share-target')) {
    event.respondWith(receiveShare(req));
    return;
  }
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);
      if (cached) {
        event.waitUntil(network);
        return cached;
      }
      const res = await network;
      if (res) return res;
      if (req.mode === 'navigate') {
        const offline = await cache.match(OFFLINE_PAGE);
        if (offline) return offline;
      }
      return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
    })
  );
});
