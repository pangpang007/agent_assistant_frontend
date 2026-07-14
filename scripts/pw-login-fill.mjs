import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' });
await page.goto('https://www.soupcircle.xyz/login', { waitUntil: 'networkidle' });
const inputs = page.locator('input');
console.log('input count', await inputs.count());
for (let i = 0; i < await inputs.count(); i++) {
  console.log(i, await inputs.nth(i).getAttribute('type'), await inputs.nth(i).getAttribute('placeholder'));
}
await inputs.first().click();
await inputs.first().fill('test@example.com');
await page.waitForTimeout(400);
await page.screenshot({ path: '/tmp/pw-soupcircle/02-login-filled.png', fullPage: true });
console.log(JSON.stringify(await inputs.first().evaluate((el) => {
  const cs = getComputedStyle(el);
  const parent = el.parentElement ? getComputedStyle(el.parentElement) : null;
  return { inputBg: cs.backgroundColor, inputColor: cs.color, parentBg: parent?.backgroundColor, parentBorder: parent?.borderColor };
}), null, 2));
await browser.close();
