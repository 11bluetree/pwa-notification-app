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
    let data = { title: 'Default Title', body: 'Default Body' };
    try {
        if (event.data) {
            const text = event.data.text();
            console.log('[SW] push raw payload:', text);
            try { data = JSON.parse(text); } catch { data.body = text; }
        }
    } catch (e) {
        console.warn('[SW] push data parse error', e);
    }

    const options = {
        body: data.body,
        icon: 'icon.png',
        badge: 'badge.png',
        data: { url: '/', arrivedAt: Date.now() }
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    const urlToOpen = new URL('/', self.location.origin).href;
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            const focused = clientList.find(c => c.url === urlToOpen);
            if (focused) {
                return focused.focus();
            }
            if (clientList.length > 0) {
                return clientList[0].focus();
            }
            return self.clients.openWindow(urlToOpen);
        })
    );
});