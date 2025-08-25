const button = document.getElementById('notifyButton');
if (!button) {
    const fallback = document.createElement('button');
    fallback.id = 'notifyButton';
    fallback.innerText = '通知を表示';
    document.body.appendChild(fallback);
    console.warn('[PWA Notification App] 想定外: ボタンがHTMLに無かったため動的に生成しました');
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('Service Worker registered'))
        .catch(error => console.error('Service Worker registration failed:', error));
}

// addEventListener は実際の要素参照を用いる（フォールバック生成済なら再取得）
(document.getElementById('notifyButton') || button).addEventListener('click', () => {
    if (Notification.permission === 'granted') {
        new Notification('こんにちは！通知が表示されました。');
    } else if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification('こんにちは！通知が表示されました。');
            }
        });
    }
});