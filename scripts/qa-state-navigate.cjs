/**
 * QA runtime navigation — Ka Rise state report (prompt 1/2, reconnaissance only).
 * Drives the real app on :3000 with puppeteer-core, visits every screen,
 * captures a screenshot + console errors per screen. READ-ONLY: clicks only
 * tab buttons; never submits/deletes data.
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:3000';
const OUT = path.join(__dirname, 'shots-state');
fs.mkdirSync(OUT, { recursive: true });

// Top-level tabs (Header) — labels EXACTS tels que rendus (match insensible
// aux accents/casse via norm()).
const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const TOP_TABS = [
  { id: 'system_solo', label: 'SYSTÈME' },
  { id: 'dashboard', label: 'Quêtes' },
  { id: 'workout', label: 'Entraînement' },
  { id: 'focus_timer', label: 'Focus' },
  { id: 'weekly_targets', label: 'Bilan' },
  { id: 'victory_journal', label: 'Hauts Faits' },
  { id: 'notepad', label: 'Notes' },
  { id: 'budget', label: 'Trésorerie' },
];
const SYSTEM_TABS = [
  ['Statut', 'statut'],
  ['Missions', 'missions'],
  ['Donjons', 'donjons'],
  ['Armée Divine', 'armee-divine'],
  ['Forge Royale', 'forge-royale'],
  ['Boutique', 'boutique'],
  ['Classement', 'classement'],
  ['Journal', 'journal'],
  ['Custom', 'custom'],
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--window-size=1400,2400'],
    defaultViewport: { width: 1380, height: 2300 },
  });
  const page = await browser.newPage();

  const records = [];
  const bucket = { errors: [], warnings: [], logs: [], requests: [] };
  page.on('console', (m) => {
    const t = m.type();
    const txt = m.text().slice(0, 400);
    if (t === 'error') bucket.errors.push(txt);
    else if (t === 'warning') bucket.warnings.push(txt);
    else bucket.logs.push(txt);
  });
  page.on('pageerror', (e) => bucket.errors.push('PAGEERROR: ' + String(e).slice(0, 400)));
  page.on('requestfailed', (r) => {
    const failure = r.failure() && r.failure().errorText;
    // ignore aborted (React StrictMode double-effects / navigations)
    if (failure !== 'net::ERR_ABORTED') {
      bucket.requests.push(`${r.method()} ${r.url()} -> ${failure}`);
    }
  });
  page.on('response', (r) => {
    if (r.status() >= 400) bucket.requests.push(`HTTP ${r.status()} ${r.url()}`);
  });

  const flush = (screen, extra) => {
    records.push({
      screen,
      errors: [...bucket.errors],
      warnings: [...bucket.warnings.slice(0, 6)],
      failedRequests: [...bucket.requests],
      ...extra,
    });
    bucket.errors.length = 0;
    bucket.warnings.length = 0;
    bucket.logs.length = 0;
    bucket.requests.length = 0;
  };

  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 4000));
  await page.screenshot({ path: path.join(OUT, '00-boot.png') });
  flush('boot');

  // Detect blocking modals (onboarding / intro tour) without dismissing them.
  const modalInfo = await page.evaluate(() => {
    const body = document.body.innerText;
    return {
      hasOnboarding: /Éveil|onboarding|Bienvenue/i.test(body) && body.length < 4000,
      bodySnippet: body.slice(0, 600),
    };
  });
  records.push({ screen: '_modal-detection', ...modalInfo });

  /** Click the top-level nav button whose label matches (accent-insensitive). */
  async function gotoTop(label) {
    await page.evaluate((lbl) => {
      const target = lbl.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const btns = [...document.querySelectorAll('button, a')];
      const b = btns.find((x) => {
        const t = (x.innerText || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        return t === target;
      });
      if (b) b.click();
    }, label);
    await new Promise((r) => setTimeout(r, 2200));
  }

  for (const t of TOP_TABS) {
    try {
      await gotoTop(t.label);
      await page.screenshot({ path: path.join(OUT, `top-${t.id}.png`) });
      const info = await page.evaluate(() => ({
        h1s: [...document.querySelectorAll('h1,h2')].slice(0, 8).map((h) => h.textContent.trim().slice(0, 80)),
        textLen: document.body.innerText.length,
        emojiPlaceholders: (document.body.innerText.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).length,
      }));
      flush(`top:${t.id}`, info);
      if (t.id === 'system_solo') {
        for (const [label, slug] of SYSTEM_TABS) {
          try {
            await page.evaluate((lbl) => {
              const btns = [...document.querySelectorAll('button[aria-pressed], [role="tab"], button')];
              const b = btns.find((x) => x.getAttribute && x.getAttribute('aria-pressed') !== null &&
                x.innerText && x.innerText.trim() === lbl);
              if (!b) throw new Error('no-tab');
              b.click();
            }, label);
            await new Promise((r) => setTimeout(r, 1800));
            await page.screenshot({ path: path.join(OUT, `sys-${slug}.png`) });
            const sinfo = await page.evaluate(() => ({
              headings: [...document.querySelectorAll('h2,h3')].slice(0, 10).map((h) => h.textContent.trim().slice(0, 70)),
              emojiPlaceholders: (document.body.innerText.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).length,
            }));
            flush(`sys:${slug}`, sinfo);
          } catch (e) {
            flush(`sys:${slug}`, { error: 'TAB_CLICK_FAIL: ' + e.message });
          }
        }
      }
    } catch (e) {
      flush(`top:${t.id}`, { fatal: String(e).slice(0, 300) });
    }
  }

  fs.writeFileSync(path.join(__dirname, 'runtime-results.json'), JSON.stringify(records, null, 2));
  console.log('DONE. Screens in', OUT);
  console.log(JSON.stringify(records.map(r => ({ screen: r.screen, err: r.errors?.length || 0, warn: r.warnings?.length || 0, reqfail: r.failedRequests?.length || 0 })), null, 1));
  await browser.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
