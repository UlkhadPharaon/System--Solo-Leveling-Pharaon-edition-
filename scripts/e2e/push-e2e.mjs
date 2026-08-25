// E2E: real Chrome + real service worker + REAL push through the live FCM/GCM endpoint.
import puppeteer from 'puppeteer-core';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:3001';
const tmp = 'C:/Users/ulric/AppData/Local/Temp/karise-e2e-profile';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: false,
  args: [
    `--user-data-dir=${tmp}`, '--no-first-run', '--no-default-browser-check',
    '--autoplay-policy=no-user-gesture-required'
  ],
});
const page = await browser.newPage();
page.on('console', m => console.log('[console]', m.type(), m.text()));
page.on('pageerror', e => console.log('[pageerror]', e.message));

await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 });

await page.evaluate(() => localStorage.setItem('aura_onboarding_completed', 'true'));
await page.reload({ waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 1500));

const sw = await page.evaluate(async () => {
  const reg = await navigator.serviceWorker.ready;
  return { scope: reg.scope, controlling: !!navigator.serviceWorker.controller,
           pushSupported: 'PushManager' in window, perm: Notification.permission };
});
console.log('SW STATE:', JSON.stringify(sw));

await page.evaluate(() => Notification.requestPermission());
console.log('PERM after request:', await page.evaluate(() => Notification.permission));

const sub = await page.evaluate(async () => {
  const reg = await navigator.serviceWorker.ready;
  const cfg = await fetch('/api/push/config').then(r => r.json());
  if (!cfg.enabled) return { error: 'push disabled server-side' };
  const b64 = cfg.vapidPublicKey;
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  const key = new Uint8Array([...raw].map(c => c.charCodeAt(0)));
  let s = await reg.pushManager.getSubscription();
  if (!s) s = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  await fetch('/api/push/subscribe', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: s.toJSON() })
  });
  return s.toJSON();
});
console.log('SUB endpoint:', String(sub.endpoint || '').slice(0, 80), '… keys:', Object.keys(sub.keys || {}));

const sent = await fetch(BASE + '/api/push/send', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ payload: { title: 'E2E-REPRO', body: 'probe', tag: 'e2e-probe', url: '/' } })
}).then(r => r.json());
console.log('SEND RESULT:', JSON.stringify(sent));
await new Promise(r => setTimeout(r, 4000));

const notifs = await page.evaluate(async () => {
  const reg = await navigator.serviceWorker.ready;
  return reg.getNotifications();
});
console.log('VISIBLE NOTIFICATIONS:', notifs.length, notifs.map(n => n.title).join('|'));
console.log(notifs.some(n => n.title === 'E2E-REPRO') ? 'PUSH-DELIVERED=YES' : 'PUSH-DELIVERED=NO');

await browser.close();
