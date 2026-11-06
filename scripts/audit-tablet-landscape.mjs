import pkg from "file:///D:/VIBE CODE ANTI GRAFITY/testesaja-main/testesaja-main/node_modules/playwright/index.js";
const { chromium } = pkg;
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('C:/Users/MyBook Hype AMD/.gemini/antigravity/brain/5bbc49be-3ac4-4d0d-afeb-2d565f0b6dc6/tablet_landscape_screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

const VIEWPORTS = [
  { name: 'ipad-landscape-1024x768', width: 1024, height: 768 },
  { name: 'ipad-air-landscape-1180x820', width: 1180, height: 820 },
  { name: 'android-tablet-1280x800', width: 1280, height: 800 }
];

const PAGES = [
  { name: 'landing', path: '/' },
  { name: 'dashboard', path: '/belajar' },
  { name: 'vocabulary', path: '/belajar/vocabulary' },
  { name: 'adventure-hub', path: '/belajar/adventure' },
  { name: 'collection', path: '/belajar/collection' },
  { name: 'profile', path: '/belajar/profile' }
];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1
    });
    const page = await context.newPage();

    for (const p of PAGES) {
      await page.goto(`http://localhost:5173${p.path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);

      const metrics = await page.evaluate(() => {
        const docW = document.documentElement.scrollWidth;
        const winW = window.innerWidth;
        return {
          docWidth: docW,
          winWidth: winW,
          hasHorizontalScroll: docW > winW
        };
      });

      const shotPath = path.join(OUT_DIR, `${vp.name}-${p.name}.png`);
      await page.screenshot({ path: shotPath });

      results.push({
        viewport: vp.name,
        page: p.name,
        ...metrics,
        shotPath
      });
      console.log(`[${vp.name}] ${p.name}: docW=${metrics.docWidth}, winW=${metrics.winWidth}, hScroll=${metrics.hasHorizontalScroll}`);
    }
    await context.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT_DIR, 'results.json'), JSON.stringify(results, null, 2));
  console.log('Tablet landscape audit completed successfully.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
