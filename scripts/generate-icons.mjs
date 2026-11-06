import pkg from "file:///D:/VIBE%20CODE%20ANTI%20GRAFITY/testesaja-main/testesaja-main/node_modules/playwright/index.js";
const { chromium } = pkg;
import fs from "fs";
import path from "path";

async function main() {
  const imgPath = "C:/Users/MyBook Hype AMD/.gemini/antigravity/brain/5bbc49be-3ac4-4d0d-afeb-2d565f0b6dc6/.user_uploaded/media_1793776947501_1a48c65a.jpg";
  const base64 = fs.readFileSync(imgPath).toString("base64");
  const dataUri = "data:image/jpeg;base64," + base64;

  const browser = await chromium.launch({ headless: true });

  const sizes = [192, 512];
  for (const s of sizes) {
    const page = await browser.newPage({ viewport: { width: s, height: s } });
    await page.setContent(`<!DOCTYPE html><html><head><style>*{margin:0;padding:0;}body{background:#1E1E1E;overflow:hidden;}img{width:${s}px;height:${s}px;display:block;object-fit:cover;}</style></head><body><img src="${dataUri}" /></body></html>`);
    const outPath = path.resolve(`public/icons/icon-${s}x${s}.png`);
    await page.screenshot({ path: outPath });
    console.log("Generated:", outPath);
    await page.close();
  }

  const maskableOut = path.resolve("public/icons/icon-maskable-512x512.png");
  fs.copyFileSync(path.resolve("public/icons/icon-512x512.png"), maskableOut);
  console.log("Generated maskable:", maskableOut);

  await browser.close();
}

main().catch(console.error);

