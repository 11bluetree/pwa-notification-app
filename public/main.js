const button = document.getElementById('notifyButton');
const unsubButton = document.getElementById('unsubButton');
const statusEl = document.getElementById('status');

if ('serviceWorker' in navigator) {
    // キャッシュ更新のため適当にバージョンクエリ付与
    navigator.serviceWorker.register('/sw.js?v=2')
        .then(reg => { console.log('Service Worker registered', reg.scope); })
        .catch(error => console.error('Service Worker registration failed:', error));
}

// addEventListener は実際の要素参照を用いる（フォールバック生成済なら再取得）
async function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

async function ensureSubscription() {
    if (!('serviceWorker' in navigator)) return null;
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
        const vapidRes = await fetch('/vapidPublicKey');
        const { publicKey } = await vapidRes.json();
        const keyBuf = await urlBase64ToUint8Array(publicKey);
        sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: keyBuf
        });
    }
    // サブスク完了 (新規/既存同期共通)
    try {
        await fetch('/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sub)
        });
        console.log('サブスク完了');
    } catch (_) { /* 失敗時は黙殺 */ }
    return sub;
}

async function requestPermissionIfNeeded() {
    if (Notification.permission === 'default') {
        await Notification.requestPermission();
    }
    return Notification.permission === 'granted';
}

async function triggerServerPush() {
    const res = await fetch('/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'サーバーPush', body: 'ブラウザ閉じても届くはずです。' })
    });
    const json = await res.json();
    console.log('[Client] /send 結果', json);
}

(document.getElementById('notifyButton') || button).addEventListener('click', async () => {
    const ok = await requestPermissionIfNeeded();
    if (!ok) {
        alert('通知が許可されていません');
        return;
    }
    await ensureSubscription();
    new Notification('購読完了');
    triggerServerPush();
    if (statusEl) statusEl.textContent = '購読中';
});

// ページ読み込み後、既に通知許可済みなら購読を自動同期
window.addEventListener('load', async () => {
    if (Notification.permission === 'granted') {
        try { await ensureSubscription(); } catch (_) {}
        if (statusEl) statusEl.textContent = '購読中';
    }
});

// 解除処理
if (unsubButton) {
    unsubButton.addEventListener('click', async () => {
        if (!('serviceWorker' in navigator)) return;
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
            try { await sub.unsubscribe(); } catch (_) {}
            if (statusEl) statusEl.textContent = '未購読';
            console.log('サブスク終了');
        } else {
            if (statusEl) statusEl.textContent = '未購読';
        }
    });
}