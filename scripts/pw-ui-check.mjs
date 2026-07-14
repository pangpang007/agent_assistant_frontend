import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.FE_BASE_URL ?? 'https://www.soupcircle.xyz';
const OUT = process.env.PW_OUT ?? '/tmp/pw-soupcircle';

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log('saved', file);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
  });
  const page = await context.newPage();

  // Login page
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 60000 });
  await shot(page, '01-login');

  // Focus + type to catch white input bug
  const email = page.locator('input[type="email"]').first();
  if (await email.count()) {
    await email.click();
    await email.fill('test@example.com');
    await shot(page, '02-login-email-filled');
    const bg = await email.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        backgroundColor: cs.backgroundColor,
        color: cs.color,
        boxShadow: cs.boxShadow,
        webkitTextFill: (cs).webkitTextFillColor || '',
      };
    });
    console.log('email input styles:', JSON.stringify(bg));
  }

  // Register
  await page.goto(`${BASE}/register`, { waitUntil: 'networkidle', timeout: 60000 });
  await shot(page, '03-register');

  // Try home (may redirect login)
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 });
  await shot(page, '04-home-or-redirect');
  console.log('home url:', page.url());

  // Try login if we have credentials
  const emailCred = process.env.FE_EMAIL;
  const passCred = process.env.FE_PASSWORD;
  if (emailCred && passCred) {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', emailCred);
    await page.fill('input[type="password"]', passCred);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await shot(page, '05-after-login');

    const routes = [
      ['/', 'dash'],
      ['/workflows', 'workflows'],
      ['/agents', 'agents'],
      ['/knowledge', 'knowledge'],
      ['/tools', 'tools'],
      ['/logs', 'logs'],
      ['/settings/profile', 'profile'],
      ['/settings/team', 'team'],
      ['/settings/models', 'models'],
      ['/settings/env', 'env'],
    ];
    for (const [route, name] of routes) {
      await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(500);
      await shot(page, `page-${name}`);
      const title = await page.locator('h1').first().textContent().catch(() => '');
      console.log(route, '->', title?.trim(), '|', page.url());
    }
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
