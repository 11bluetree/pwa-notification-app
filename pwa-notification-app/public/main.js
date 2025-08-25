const button = document.createElement('button');
button.innerText = '通知を表示';
document.body.appendChild(button);

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('Service Worker registered'))
        .catch(error => console.error('Service Worker registration failed:', error));
}

button.addEventListener('click', () => {
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