/**
 * Generates a Web Push VAPID key pair and prints them so you can paste them
 * into .env.local (NOT .env.example — these are secrets).
 *
 * Usage:  node scripts/generate-vapid-keys.mjs
 * The keys work for both the server push relay (.env.local) and the client
 * subscription handshake (served via /api/push/config).
 */
import webpush from 'web-push';

const { publicKey, privateKey } = webpush.generateVAPIDKeys();

console.log('── Web Push VAPID Keys ───────────────────────────────');
console.log('Add these to your local .env.local (never commit them):');
console.log('');
console.log(`VAPID_PUBLIC_KEY=${publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${privateKey}`);
console.log(`VAPID_SUBJECT=mailto:pharaon@system-solo-leveling.local`);
console.log('');
console.log('Note: VAPID_PUBLIC_KEY is also exposed client-side (safe) so the');
console.log('browser can include it in the pushManager.subscribe() handshake.');