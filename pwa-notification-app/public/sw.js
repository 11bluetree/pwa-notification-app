self.addEventListener('install', event => {
    event.waitUntil(
        self.skipWaiting()
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        self.clients.claim()
    );
});

self.addEventListener('push', event => {
    const data = event.data ? event.data.json() : { title: 'Default Title', body: 'Default Body' };

    const options = {
        body: data.body,
        icon: 'icon.png', // Specify your icon path
        badge: 'badge.png' // Specify your badge path
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});