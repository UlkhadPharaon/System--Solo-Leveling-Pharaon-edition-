/**
 * Responsive audit script — renders the app at several mobile viewports and
 * reports layout defects: horizontal overflow, off-screen content, overlap.
 *
 * Run: node scripts/responsive-audit.mjs
 * Requires dev server on :3000 (or set BASE_URL env).
 */
import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const VIEWPORTS = [
  { name: 'iPhone SE (old, 320)', width: 320, height: 568, isMobile: true, hasTouch: true },
  { name: 'iPhone 12 (390)',      width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: 'Pixel (412)',          width: 412, height: 915, isMobile: true, hasTouch: true },
  { name: 'Small tablet (600)',   width: 600, height: 960, isMobile: true, hasTouch: true },
];

// Tabs that exist in the mobile bottom nav (primary) + "Plus" sheet entries.
const TABS = ['system_solo', 'dashboard', 'workout', 'focus_timer', 'weekly_targets', 'victory_journal', 'notepad', 'budget'];

function findOverflowingEls() {
  const results = [];
  document.querySelectorAll('body *').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    // Skip fixed overlays that are intentionally off-canvas (dropdowns closed).
    // Off-right overflow:
    if (r.right > window.innerWidth + 2 && !el.closest('.fixed') && !el.closest('#header')?.querySelector) {
      // report any horizontally-overflowing non-fixed element
      results.push({
        type: 'h-overflow',
        tag: el.tagName.toLowerCase(),
        cls: (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || '').toString().slice(0, 80),
        right: Math.round(r.right),
        width: Math.round(r.width),
        left: Math.round(r.left),
        rect: `L${Math.round(r.left)} T${Math.round(r.top)} R${Math.round(r.right)} B${Math.round(r.bottom)}`,
        text: (el.textContent || '').trim().slice(0, 40),
      });
    }
  });
  return results;
}

function audit() {
  const doc = document.documentElement;
  const body = document.body;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const out = {
    viewport: { w, h },
    scrollWidth: doc.scrollWidth,
    scrollHeight: doc.scrollHeight,
    bodyScrollWidth: body.scrollWidth,
    docClientW: doc.clientWidth,
    hasHScroll: doc.scrollWidth > w + 2,
    overflowEls: [],
  };
  // Collect all elements that overflow document width
  document.querySelectorAll('body *').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    if (el.closest('.fixed')) return; // skip fixed overlays unless visible
    const st = getComputedStyle(el);
    if (st.position === 'fixed') return;
    if (r.right > w + 2) {
      out.overflowEls.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className?.baseVal ?? el.className ?? '').toString().slice(0, 90),
        right: Math.round(r.right),
        w: Math.round(r.width),
        text: (el.textContent || '').trim().slice(0, 30),
      });
    }
  });
  out.overflowCount = out.overflowEls.length;
  return out;
}

function overlapCheck() {
  const bad = [];
  const els = [...document.querySelectorAll('button, a, span, div, p, label')]
    .filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
  for (let i = 0; i < els.length; i++) {
    const a = els[i];
    const ra = a.getBoundingClientRect();
    const ta = (a.textContent || '').trim();
    if (!ta || ta.length < 4) continue;
    // only compare against siblings-ish (text overlap is meaningful between visible text nodes)
    for (let j = i + 1; j < els.length; j++) {
      const b = els[j];
      const rb = b.getBoundingClientRect();
      const tb = (b.textContent || '').trim();
      if (!tb || tb.length < 4) continue;
      if (a === b || a.contains(b) || b.contains(a)) continue;
      // same line-ish, horizontal overlap of text blocks
      const sameBand = Math.abs(ra.top - rb.top) < Math.min(ra.height, rb.height) * 0.4;
      if (!sameBand) continue;
      const xOverlap = Math.max(0, Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left));
      if (xOverlap > 6 && xOverlap > ra.width * 0.5) {
        const bothText = ta.slice(0, 12) + '|' + tb.slice(0, 12);
        if (bothText.split(':').length < 3) { // crude de-dup
          bad.push({ a: bothText, rectA: [Math.round(ra.left), Math.round(ra.top)], rectB: [Math.round(rb.left), Math.round(rb.top)] });
          break;
        }
      }
    }
  }
  return bad.slice(0, 15);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=430,1200'],
  });

  const report = [];
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile, hasTouch: vp.hasTouch, deviceScaleFactor: 2 });
    // Catch console errors
    const consoleErrors = [];
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
    page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message.slice(0, 200)));

    try {
      await page.goto(BASE, { waitUntil: 'networkidle0', timeout: 30000 });
    } catch (e) {
      report.push({ vp: vp.name, error: 'goto: ' + e.message });
      await page.close();
      continue;
    }
    await sleep(1500); // let entrance animations settle

    const vpOut = { vp: vp.name, width: vp.width, height: vp.height, tabs: [], consoleErrors: consoleErrors.slice(0, 5) };

    // Onboarding might block — try to dismiss by checking for its close button.
    // OnboardingModal: likely has a skip / X. Try clicking the first [aria-label*="ermer"] or a button "Commencer".
    let onboardClosed = false;
    try {
      const skipBtn = await page.evaluateHandle(() => {
        const btns = [...document.querySelectorAll('button')];
        const target = btns.find((b) => /(Commencer|Commençons|Entrer|C'est parti|Sauter|Passer|Ignorer)/i.test(b.textContent || ''));
        return target || null;
      });
      if (skipBtn) {
        const el = skipBtn.asElement();
        if (el) { await el.click().catch(() => {}); onboardClosed = true; }
      }
    } catch {}

    // Navigate through each tab
    for (const tab of TABS) {
      // Click the tab via the nav. Buttons labeled with the tab's icon/label.
      const clicked = await page.evaluate((t) => {
        // Match by aria-current or label text
        const buttons = [...document.querySelectorAll('button')];
        const labels = {
          system_solo: ['SYSTÈME', 'Système'],
          dashboard: ['Quêtes'],
          workout: ['Entraînement'],
          focus_timer: ['Focus'],
          weekly_targets: ['Bilan'],
          victory_journal: ['Hauts Faits'],
          notepad: ['Notes'],
          budget: ['Trésorerie'],
          plus: ['Plus'],
        };
        const targets = labels[t] || [];
        const btn = buttons.find((b) => targets.some((tg) => (b.textContent || '').includes(tg)));
        if (btn) { btn.click(); return true; }
        return false;
      }, tab);
      if (!clicked) {
        // The tab may be behind "Plus" sheet
        if (tab !== 'system_solo' && tab !== 'dashboard' && tab !== 'workout' && tab !== 'focus_timer') {
          await page.evaluate(() => {
            const plus = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').includes('Plus'));
            if (plus) plus.click();
          });
          await sleep(400);
          const clicked2 = await page.evaluate((t) => {
            const labels = { weekly_targets: ['Bilan'], victory_journal: ['Hauts Faits'], notepad: ['Notes'], budget: ['Trésorerie'] };
            const btn = [...document.querySelectorAll('button')].find((b) => (labels[t] || []).some((tg) => (b.textContent || '').includes(tg)));
            if (btn) { btn.click(); return true; }
            return false;
          }, tab);
          if (!clicked2) { vpOut.tabs.push({ tab, skipped: true }); continue; }
        } else {
          vpOut.tabs.push({ tab, skipped: true });
          continue;
        }
      }
      await sleep(900); // allow tab transition (filter blur / fade)
      const a = await page.evaluate(audit);
      const oc = await page.evaluate(overlapCheck);
      vpOut.tabs.push({ tab, audit: a, overlap: oc });
      // screenshot for evidence
      await page.screenshot({ path: `scripts/shots/${vp.name.replace(/[^a-z0-9]/gi, '_')}-${tab}.png` });
    }

    // Also screenshot default landing (system_solo)
    await page.goto(BASE, { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(1200);
    await page.screenshot({ path: `scripts/shots/${vp.name.replace(/[^a-z0-9]/gi, '_')}-LANDING.png` });

    report.push(vpOut);
    await page.close();
  }

  await browser.close();
  // Print condensed report
  for (const vp of report) {
    console.log(`\n========== VIEWPORT: ${vp.vp} (${vp.width}x${vp.height}) ==========`);
    if (vp.error) { console.log('  ERROR: ' + vp.error); continue; }
    if (vp.consoleErrors.length) console.log('  [CONSOLE] ' + vp.consoleErrors.join(' | '));
    for (const t of vp.tabs) {
      if (t.skipped) { console.log(`  [${t.tab}] SKIPPED`); continue; }
      const a = t.audit;
      const hFlow = a.hasHScroll ? ` H-SCROLL(docW=${a.scrollWidth}>${a.docClientW})` : '';
      console.log(`  [${t.tab}] scrollW=${a.scrollWidth} clientW=${a.docClientW} scrollH=${a.scrollHeight}${hFlow} overflowEls=${a.overflowCount}`);
      for (const o of a.overflowEls.slice(0, 6)) {
        console.log(`     OVERFLOW: <${o.tag}> ${o.cls} right=${o.right} w=${o.w} text="${o.text}"`);
      }
      for (const o of t.overlap.slice(0, 5)) {
        console.log(`     OVERLAP: "${o.a}" @ ${JSON.stringify(o.rectA)} vs ${JSON.stringify(o.rectB)}`);
      }
    }
  }
  console.log('\nDONE. Screenshots in scripts/shots/');
}

run().catch((e) => { console.error('FATAL', e); process.exit(1); });