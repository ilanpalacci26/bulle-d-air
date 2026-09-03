const path = require('path');
const { chromium } = require('C:/Users/ilanp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ['notifications'] });
  const page = await context.newPage();
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });
  page.on('pageerror', error => errors.push(`page: ${error.message}`));
  const base = process.argv[2] || 'http://localhost:8888';

  await page.goto(base, { waitUntil: 'networkidle' });
  await page.fill('#username', 'Camille Test');
  await page.fill('#flight-1', 'AF123');
  await page.click('#add-leg');
  await page.fill('#flight-2', 'BA123');
  await page.locator('.theme-option', { hasText: 'Super Mario' }).click();
  for (let i = 0; i < 3; i += 1) await page.click('#add-passenger');
  const names = ['Camille', 'Alex', 'Sam', 'Lou'];
  for (let i = 0; i < names.length; i += 1) await page.locator('.passenger-name').nth(i).fill(names[i]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.resolve('.impeccable/review/create-desktop.png'), fullPage: true });
  await page.click('.primary-action[type="submit"]');
  await page.waitForSelector('.success-panel', { timeout: 15000 });
  const password = (await page.locator('#generated-password').textContent()).trim();
  const shareUrl = await page.locator('#share-link').inputValue();
  if (!password || !shareUrl.includes('?trip=')) throw new Error('Creation result missing credentials or link');

  await page.goto(shareUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.tracker', { timeout: 30000 });
  await page.waitForSelector('.flight-facts', { timeout: 15000 });
  const flightFacts = await page.locator('.flight-facts').innerText();
  if (!flightFacts.includes('Départ prévu') || !flightFacts.includes('Arrivée estimée')) throw new Error('Flight timing details missing');
  await page.waitForSelector('.maplibregl-canvas', { timeout: 15000 });
  await page.waitForTimeout(8000);
  const desktop = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: innerWidth,
    flightChips: document.querySelectorAll('.flight-chip').length,
    crew: document.querySelectorAll('.crew-stack > span').length,
    theme: document.body.dataset.theme,
    status: document.querySelector('.status-block strong')?.textContent,
  }));
  await page.screenshot({ path: path.resolve('.impeccable/review/tracker-desktop.png'), fullPage: true });
  await page.click('[data-theme="pokemon"]');
  if ((await page.locator('body').getAttribute('data-theme')) !== 'pokemon') throw new Error('Theme switch failed');
  await page.click('#notifications');
  await page.click('#manage');
  await page.fill('#manage-form input[name="username"]', 'Camille Test');
  await page.fill('#manage-form input[name="password"]', password);
  await page.selectOption('#manage-form select[name="theme"]', 'lego');
  await page.click('#manage-form .primary-action');
  await page.waitForSelector('#manage-drawer', { state: 'hidden' });
  if ((await page.locator('body').getAttribute('data-theme')) !== 'lego') throw new Error('Authenticated update failed');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.resolve('.impeccable/review/tracker-mobile.png'), fullPage: true });
  const mobile = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth, mapHeight: document.querySelector('#map').getBoundingClientRect().height }));

  const result = { created: true, passwordLength: password.length, desktop, mobile, errors };
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  if (errors.length || desktop.width > desktop.viewport || mobile.width > mobile.viewport || desktop.flightChips !== 2 || desktop.crew !== 4) process.exit(1);
})().catch(error => { console.error(error); process.exit(1); });
