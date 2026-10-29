// Captures the running app into assets/screenshots/. Start the API (port 8000) and the dashboard
// (port 3000) first, then: node scripts/capture_screenshots.js
// Needs `playwright` or `playwright-core`; set BROWSER_CHANNEL=msedge or chrome to use an installed browser.
const path = require('path');

let pw;
try { pw = require('playwright'); } catch { pw = require('playwright-core'); }

const API = process.env.API_URL || 'http://localhost:8000';
const WEB = process.env.WEB_URL || 'http://localhost:3000';
const dir = path.resolve(__dirname, '..', 'assets', 'screenshots');

(async () => {
  const browser = await pw.chromium.launch({ channel: process.env.BROWSER_CHANNEL || undefined });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const shot = (name) => page.screenshot({ path: path.join(dir, name) });
  const main = (y) => page.locator('main').evaluate((el, y) => el.scrollTo(0, y), y);
  const open = async (text) => {
    await page.getByRole('button', { name: new RegExp(text) }).first().click();
    await page.waitForTimeout(900);
  };
  const tab = async (name, y = 0) => {
    await page.getByRole('tab', { name }).click();
    await page.waitForTimeout(400);
    await main(y);
    await page.waitForTimeout(300);
  };

  await page.request.post(`${API}/api/demo/reset`);
  await page.goto(WEB);
  const run = page.getByRole('button', { name: /Run 10 test reports/ }).first();
  await run.waitFor();
  await page.waitForTimeout(1200);
  await shot('01-first-run.png');
  await run.click();
  await page.waitForTimeout(4000);
  await shot('02-queue-sorting-live.png');
  // Wait for all verdicts and for the patch loop on the reproduced bug (live models take minutes).
  for (const deadline = Date.now() + 20 * 60 * 1000; ; ) {
    const r = await (await page.request.get(`${API}/api/reports`)).json();
    const t01 = await (await page.request.get(`${API}/api/reports/T01`)).json();
    const patching = t01.patch && ['queued', 'running'].includes(t01.patch.status);
    if (r.stats.decided === 10 && r.stats.in_progress === 0 && !patching) break;
    if (Date.now() > deadline) throw new Error('timed out waiting for the demo run');
    await page.waitForTimeout(3000);
  }
  await page.waitForTimeout(1500);
  await shot('03-queue-sorted.png');

  await open('CRITICAL: Heap overflow');
  await shot('04-fabricated-card.png');
  await main(620);
  await page.waitForTimeout(300);
  await shot('05-fabricated-evidence.png');

  await open('Heap buffer over-read');
  await shot('06-reproduced-card.png');
  await tab('Sandbox', 400); await shot('07-sandbox-asan.png');
  await tab('Fix', 400); await shot('08-patch-loop.png');
  await main(1400); await page.waitForTimeout(300); await shot('09-patch-checks.png');
  await tab('Private advisory', 400); await shot('10-private-advisory.png');
  await tab('Models', 400); await shot('11-model-panel.png');

  await open('Use-after-free in tp_ini_free');
  await shot('12-prompt-injection.png');

  await page.evaluate(() => { localStorage.setItem('bouncer-theme', 'light'); });
  await page.reload();
  await page.waitForTimeout(1500);
  await shot('13-light-mode.png');
  await page.evaluate(() => { localStorage.removeItem('bouncer-theme'); });
  await page.reload();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1200);
  await shot('14-mobile.png');

  await browser.close();
  console.log('ok');
})().catch((e) => { console.error(e); process.exit(1); });
