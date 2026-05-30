const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const sourcePath = path.resolve(__dirname, '..', 'og-image.html');
  const outPath = path.resolve(__dirname, '..', 'og-image.png');

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  await page.goto('file://' + sourcePath, { waitUntil: 'networkidle' });
  // Give Google Fonts a moment to render
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);

  await page.screenshot({ path: outPath, type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
  console.log('Wrote:', outPath);

  await browser.close();
})();
