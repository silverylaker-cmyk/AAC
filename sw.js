const CACHE_NAME = 'aac-shell-v12';
const SHELL = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './icon.svg',
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(SHELL)));
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    // ARASAAC 검색/이미지는 캐시하지 않음 (선택된 그림은 IndexedDB에 저장됨)
    if (e.request.url.includes('arasaac')) return;
    // stale-while-revalidate: 캐시를 즉시 보여주되, 백그라운드에서 최신본을 받아
    // 캐시를 갱신한다. 그래서 앱을 업데이트하면 다음 실행 때 자동 반영된다.
    e.respondWith(
        caches.open(CACHE_NAME).then(cache =>
            cache.match(e.request).then(cached => {
                const network = fetch(e.request).then(res => {
                    if (res && res.ok && e.request.method === 'GET') cache.put(e.request, res.clone());
                    return res;
                }).catch(() => cached);
                return cached || network;
            })
        )
    );
});
