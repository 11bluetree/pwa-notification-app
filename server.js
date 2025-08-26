const express = require('express');
const path = require('path');
const fs = require('fs');
const webPush = require('web-push');

// --- VAPID Key Handling (dev friendly) ---
function ensureVapidKeys() {
    const pubEnv = process.env.VAPID_PUBLIC_KEY;
    const privEnv = process.env.VAPID_PRIVATE_KEY;
    if (pubEnv && privEnv) {
        return { publicKey: pubEnv, privateKey: privEnv, fromEnv: true };
    }
    const keyFile = path.join(__dirname, 'vapid-keys.json');
    if (fs.existsSync(keyFile)) {
        const stored = JSON.parse(fs.readFileSync(keyFile, 'utf-8'));
        return { ...stored, fromEnv: false };
    }
    const generated = webPush.generateVAPIDKeys();
    fs.writeFileSync(keyFile, JSON.stringify(generated, null, 2));
    console.log('[VAPID] 新規キーを生成しました (開発用途). 本番では環境変数に設定してください。');
    return { ...generated, fromEnv: false };
}

const vapidKeys = ensureVapidKeys();
webPush.setVapidDetails('mailto:example@example.com', vapidKeys.publicKey, vapidKeys.privateKey);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// メモリ上に購読を保持（本番ではDBなどを利用） + 簡易ファイル永続化
const subscriptions = new Set();
const subsFile = path.join(__dirname, 'subscriptions.json');
function loadSubs() {
    if (fs.existsSync(subsFile)) {
        try {
            const arr = JSON.parse(fs.readFileSync(subsFile, 'utf-8'));
            if (!app.locals.subscriptionMap) app.locals.subscriptionMap = new Map();
            arr.forEach(s => {
                if (s && s.endpoint) {
                    subscriptions.add(s.endpoint);
                    app.locals.subscriptionMap.set(s.endpoint, s);
                }
            });
            if (arr.length) console.log(`サブスク数 ${arr.length}`);
        } catch (_) { /* ignore */ }
    }
}
function persistSubs() {
    const map = app.locals.subscriptionMap || new Map();
    const arr = [...map.values()];
    fs.writeFileSync(subsFile, JSON.stringify(arr, null, 2));
}
loadSubs();

// クライアントが公開鍵取得用
app.get('/vapidPublicKey', (req, res) => {
    res.json({ publicKey: vapidKeys.publicKey });
});

// 購読情報登録
app.post('/subscribe', (req, res) => {
    const subscription = req.body;
    if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Invalid subscription' });
    }
    const key = subscription.endpoint;
    if (!app.locals.subscriptionMap) app.locals.subscriptionMap = new Map();
    app.locals.subscriptionMap.set(key, subscription);
    subscriptions.add(key);
    persistSubs();
    const count = app.locals.subscriptionMap.size;
    console.log('サブスク完了');
    console.log(`サブスク数 ${count}`);
    res.json({ status: 'ok' });
});

// テスト送信用（body: {title, body}）
app.post('/send', async (req, res) => {
    const { title = 'サーバー通知', body = 'Pushメッセージです' } = req.body || {};
    const payload = JSON.stringify({ title, body });
    const map = app.locals.subscriptionMap || new Map();
    const results = [];
    for (const [endpoint, sub] of map.entries()) {
        try {
            await webPush.sendNotification(sub, payload);
            results.push({ endpoint, status: 'sent' });
        } catch (e) {
            results.push({ endpoint, status: 'failed', code: e.statusCode });
            if (e.statusCode === 410 || e.statusCode === 404) {
                map.delete(endpoint);
                subscriptions.delete(endpoint);
                persistSubs();
                console.log('サブスク終了');
                console.log(`サブスク数 ${map.size}`);
            }
        }
    }
    res.json({ results });
});

// 明示的な購読解除
app.post('/unsubscribe', (req, res) => {
    const { endpoint } = req.body || {};
    if (!endpoint) return res.status(400).json({ error: 'Invalid endpoint' });
    const map = app.locals.subscriptionMap || new Map();
    if (map.delete(endpoint)) {
        subscriptions.delete(endpoint);
        persistSubs();
        console.log('サブスク終了');
        console.log(`サブスク数 ${map.size}`);
    }
    res.json({ status: 'ok' });
});

// デバッグ: 現在の購読確認
app.get('/debug/subscriptions', (req, res) => {
    const map = app.locals.subscriptionMap || new Map();
    res.json({ count: map.size, endpoints: [...map.keys()] });
});

// 生の購読データ（鍵含む）を返す: 開発専用
app.get('/debug/subscriptions/raw', (req, res) => {
    const map = app.locals.subscriptionMap || new Map();
    res.json({ count: map.size, subscriptions: [...map.values()] });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    if (!vapidKeys.fromEnv) {
        console.log(`[VAPID] 公開鍵: ${vapidKeys.publicKey}`);
    }
});