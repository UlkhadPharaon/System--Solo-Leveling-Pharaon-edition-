// Repro: toggle the Personalization modal open->closed->open and watch for
// the hooks-order crash ("Rendered fewer hooks than during the previous render").
import puppeteer from 'puppeteer-core';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: false,
  args: ['--user-data-dir=C:/Users/ulric/AppData/Local/Temp/karise-e2e-profile', '--no-first-run'],
});
const page = await browser.newPage();
let hookCrash = '';
page.on('pageerror', e => { if (/Rendered fewer hooks|Rendered more hooks/i.test(e.message)) hookCrash = e.message; });
await page.goto('http://localhost:3001', { waitUntil: 'networkidle2' });
await page.evaluate(() => localStorage.setItem('aura_onboarding_completed', 'true'));
await page.reload({ waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 1500));
const clickPerso = async () => {
  const ok = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent?.trim() === 'Personnaliser');
    if (!b) return false;
    b.click(); return true;
  });
  if (!ok) { // header may be scrolled/hidden — dispatch via React props path: use user menu
    await page.evaluate(() => {
      const m = [...document.querySelectorAll('button')].find(x => (x.getAttribute('aria-label') || '') === 'Menu utilisateur');
      m?.click();
    });
    await new Promise(r => setTimeout(r, 600));
    return page.evaluate(() => {
      const item = [...document.querySelectorAll('button, [role="menuitem"]')].find(x => x.textContent?.includes('Personnaliser'));
      if (!item) return false;
      item.click(); return true;
    });
  }
  return ok;
};
console.log('open #1:', await clickPerso());
await new Promise(r => setTimeout(r, 2000));
const modalUp1 = await page.evaluate(() => document.body.innerText.includes('Cinéma') || document.body.innerText.includes('Notifications'));
const closed = await page.evaluate(() => {
  // any button whose svg is an X icon inside the topmost panel
  const panels = [...document.querySelectorAll('.bg-panel, [role="dialog"]')];
  for (const p of panels.reverse()) {
    const btns = [...p.querySelectorAll('button')];
    const x = btns[0]; // close X is conventionally first
    if (x) { x.click(); return true; }
  }
  return false;
});
console.log('modal was open #1:', modalUp1, '| attempted close:', closed);
await new Promise(r => setTimeout(r, 1200));
const modalGone = await page.evaluate(() => !document.querySelector('.bg-panel'));
console.log('modal gone after close:', modalGone);
console.log('open #2:', await clickPerso());
await new Promise(r => setTimeout(r, 2500));
console.log('hook crash:', hookCrash ? hookCrash.slice(0, 300) : 'none');
console.log('MODAL-CRASH=' + (hookCrash ? 'CONFIRMED' : 'NOT-REPRODUCED'));
await browser.close();
