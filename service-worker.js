const CACHE_NAME = 'swipe-todo-v1';
const ASSETS = [
    'index.html',
    'style.css',
    'app.js',
    'manifest.json'
];

// インストール時にコアファイルをキャッシュ
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// ネットワークがオフラインでもキャッシュから即座に読み込む
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});