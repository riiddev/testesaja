const { chromium } = require('D:/VIBE CODE ANTI GRAFITY/testesaja-main/testesaja-main/node_modules/playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  console.log('Navigating to https://themainideas.com/ ...');
  try {
    await page.goto('https://themainideas.com/', { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e) {
    console.log('Wait timeout, continuing:', e.message);
  }
  await page.waitForTimeout(3000);

  const targetDir = path.resolve('docs/screenshots/reference');
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  // Desktop screenshot of landing page
  console.log('Capturing root desktop screenshots...');
  await page.screenshot({ path: path.join(targetDir, 'desktop-landing.png'), fullPage: false });
  await page.screenshot({ path: path.join(targetDir, 'desktop-landing-full.png'), fullPage: true });

  // Mobile screenshot of landing page
  console.log('Capturing root mobile screenshots...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(targetDir, 'mobile-landing.png'), fullPage: false });
  await page.screenshot({ path: path.join(targetDir, 'mobile-landing-full.png'), fullPage: true });

  // Reset viewport to desktop for style extraction
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(1000);

  // Extract navigation links
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href]')).map(a => ({
      text: a.innerText.trim(),
      href: a.getAttribute('href')
    })).filter(l => l.text && l.href);
  });

  // Extract comprehensive styles from landing page
  const landingDesignData = await page.evaluate(() => {
    const bodyStyles = getComputedStyle(document.body);

    const extractStyles = (el) => {
      if (!el) return null;
      const s = getComputedStyle(el);
      return {
        tag: el.tagName,
        className: el.className,
        text: (el.innerText || '').slice(0, 100),
        color: s.color,
        backgroundColor: s.backgroundColor,
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        lineHeight: s.lineHeight,
        letterSpacing: s.letterSpacing,
        borderRadius: s.borderRadius,
        padding: s.padding,
        margin: s.margin,
        border: s.border,
        boxShadow: s.boxShadow
      };
    };

    const h1 = document.querySelector('h1');
    const h2 = document.querySelector('h2');
    const h3 = document.querySelector('h3');
    const p = document.querySelector('p');
    const buttons = Array.from(document.querySelectorAll('button, a.button, a.btn, [role="button"], a[class*="btn"], a[class*="button"]')).slice(0, 8).map(extractStyles);
    const nav = document.querySelector('nav, header');
    const footer = document.querySelector('footer');
    const cards = Array.from(document.querySelectorAll('[class*="card"], article, .group, [class*="item"], [class*="feature"]')).slice(0, 8).map(extractStyles);

    const allElements = Array.from(document.querySelectorAll('*'));
    const textColors = new Set();
    const bgColors = new Set();
    const fontFamilies = new Set();
    const borderRadii = new Set();
    const shadows = new Set();
    const borders = new Set();

    allElements.forEach(el => {
      const s = getComputedStyle(el);
      if (s.color && s.color !== 'rgba(0, 0, 0, 0)') textColors.add(s.color);
      if (s.backgroundColor && s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== 'transparent') bgColors.add(s.backgroundColor);
      if (s.fontFamily) fontFamilies.add(s.fontFamily);
      if (s.borderRadius && s.borderRadius !== '0px') borderRadii.add(s.borderRadius);
      if (s.boxShadow && s.boxShadow !== 'none') shadows.add(s.boxShadow);
      if (s.border && !s.border.startsWith('0px')) borders.add(s.border);
    });

    return {
      title: document.title,
      body: {
        fontFamily: bodyStyles.fontFamily,
        fontSize: bodyStyles.fontSize,
        color: bodyStyles.color,
        backgroundColor: bodyStyles.backgroundColor
      },
      h1: extractStyles(h1),
      h2: extractStyles(h2),
      h3: extractStyles(h3),
      p: extractStyles(p),
      buttons,
      nav: extractStyles(nav),
      footer: extractStyles(footer),
      cards,
      palette: {
        textColors: Array.from(textColors),
        bgColors: Array.from(bgColors)
      },
      fontFamilies: Array.from(fontFamilies),
      borderRadii: Array.from(borderRadii),
      shadows: Array.from(shadows),
      borders: Array.from(borders)
    };
  });

  landingDesignData.links = links;
  fs.writeFileSync('docs/themainideas-landing-extracted.json', JSON.stringify(landingDesignData, null, 2));
  console.log('Saved docs/themainideas-landing-extracted.json');

  await browser.close();
  console.log('Complete extraction finished!');
})();
