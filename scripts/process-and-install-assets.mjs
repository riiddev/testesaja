import pkg from "file:///D:/VIBE CODE ANTI GRAFITY/testesaja-main/testesaja-main/node_modules/playwright/index.js";
const { chromium } = pkg;
import fs from "fs";
import path from "path";

const ASSET_MAPPING = [
  // 1. Stories (JPG -> WebP)
  {
    category: "stories",
    sourceRel: "aset-sinau/stories/Gemini_Generated_Image_ (18).jpg",
    destRel: "public/assets/stories/story-01-cover.webp",
    type: "webp",
    label: "Story 1 Cover: Kopi Pertama di Kota Baru"
  },
  {
    category: "stories",
    sourceRel: "aset-sinau/stories/Gemini_Generated_Image_ (19).jpg",
    destRel: "public/assets/stories/story-02-cover.webp",
    type: "webp",
    label: "Story 2 Cover: Tersesat di Bandara"
  },
  {
    category: "stories",
    sourceRel: "aset-sinau/stories/Gemini_Generated_Image_ (20).jpg",
    destRel: "public/assets/stories/story-03-cover.webp",
    type: "webp",
    label: "Story 3 Cover: Pasar Malam Misterius"
  },
  {
    category: "stories",
    sourceRel: "aset-sinau/stories/Gemini_Generated_Image_ (21).jpg",
    destRel: "public/assets/stories/story-04-cover.webp",
    type: "webp",
    label: "Story 4 Cover: Surat dari Kakek"
  },
  {
    category: "stories",
    sourceRel: "aset-sinau/stories/Gemini_Generated_Image_ (22).jpg",
    destRel: "public/assets/stories/story-05-cover.webp",
    type: "webp",
    label: "Story 5 Cover: Misteri Kamar Kos Nomor 7"
  },
  {
    category: "stories",
    sourceRel: "aset-sinau/stories/Gemini_Generated_Image_ (23).jpg",
    destRel: "public/assets/stories/story-06-cover.webp",
    type: "webp",
    label: "Story 6 Cover: Hari Pertama Magang"
  },
  {
    category: "stories",
    sourceRel: "aset-sinau/stories/Gemini_Generated_Image_ (24).jpg",
    destRel: "public/assets/stories/story-07-cover.webp",
    type: "webp",
    label: "Story 7 Cover: Kamera yang Tertinggal"
  },
  {
    category: "stories",
    sourceRel: "aset-sinau/stories/Gemini_Generated_Image_ (25).jpg",
    destRel: "public/assets/stories/story-08-cover.webp",
    type: "webp",
    label: "Story 8 Cover: Festival Kota Tua"
  },
  {
    category: "stories",
    sourceRel: "aset-sinau/stories/Gemini_Generated_Image_ (26).jpg",
    destRel: "public/assets/stories/story-09-cover.webp",
    type: "webp",
    label: "Story 9 Cover: Tersesat di Pulau Tanpa Sinyal"
  },
  {
    category: "stories",
    sourceRel: "aset-sinau/stories/Gemini_Generated_Image_ (27).jpg",
    destRel: "public/assets/stories/story-10-cover.webp",
    type: "webp",
    label: "Story 10 Cover: Wawancara Beasiswa Impian"
  },

  // 2. UI (JPG -> Transparent PNG)
  {
    category: "ui",
    sourceRel: "aset-sinau/ui/Gemini_Generated_Image_ (11).jpg",
    destRel: "public/assets/ui/sinau-coin.png",
    type: "png-floodfill",
    label: "Sinau Coin Currency"
  },

  // 3. Borders (JPG with Magenta Key -> Transparent PNG)
  {
    category: "borders",
    sourceRel: "aset-sinau/borders/Gemini_Generated_Image_ (12).jpg",
    destRel: "public/assets/borders/border-daun.png",
    type: "png-border",
    label: "Border Daun (Laurel Wreath)"
  },
  {
    category: "borders",
    sourceRel: "aset-sinau/borders/Gemini_Generated_Image_ (17).jpg",
    destRel: "public/assets/borders/border-tinta.png",
    type: "png-border",
    label: "Border Tinta (Ink Droplets & Splatters)"
  },
  {
    category: "borders",
    sourceRel: "aset-sinau/borders/Gemini_Generated_Image_ (13).jpg",
    destRel: "public/assets/borders/border-kawung.png",
    type: "png-border",
    label: "Border Kawung (Batik Motif)"
  },
  {
    category: "borders",
    sourceRel: "aset-sinau/borders/Gemini_Generated_Image_ (14).jpg",
    destRel: "public/assets/borders/border-emas.png",
    type: "png-border",
    label: "Border Emas (Gold Studs & Dots)"
  },
  {
    category: "borders",
    sourceRel: "aset-sinau/borders/Gemini_Generated_Image_ (15).jpg",
    destRel: "public/assets/borders/border-buku.png",
    type: "png-border",
    label: "Border Buku (Open Manuscript Books)"
  },
  {
    category: "borders",
    sourceRel: "aset-sinau/borders/Gemini_Generated_Image_ (16).jpg",
    destRel: "public/assets/borders/border-kanci.png",
    type: "png-border",
    label: "Border Kanci (Mousedeer Ears Accent)"
  },

  // 4. Mascot Expressions & Outfits (JPG -> Transparent PNG)
  {
    category: "mascot",
    sourceRel: "aset-sinau/mascot/Gemini_Generated_Image_.jpg",
    destRel: "public/assets/mascot/kanci-base.png",
    type: "png-floodfill",
    label: "Kanci Base (Neutral with Bag)"
  },
  {
    category: "mascot",
    sourceRel: "aset-sinau/mascot/Gemini_Generated_Image_ (2).jpg",
    destRel: "public/assets/mascot/kanci-happy.png",
    type: "png-floodfill",
    label: "Kanci Happy (Jumping Joyful)"
  },
  {
    category: "mascot",
    sourceRel: "aset-sinau/mascot/Gemini_Generated_Image_ (3).jpg",
    destRel: "public/assets/mascot/kanci-thinking.png",
    type: "png-floodfill",
    label: "Kanci Thinking (Hand to Chin)"
  },
  {
    category: "mascot",
    sourceRel: "aset-sinau/mascot/Gemini_Generated_Image_ (4).jpg",
    destRel: "public/assets/mascot/kanci-celebrating.png",
    type: "png-floodfill",
    label: "Kanci Celebrating (Party Confetti)"
  },
  {
    category: "mascot",
    sourceRel: "aset-sinau/mascot/Gemini_Generated_Image_ (28).jpg",
    destRel: "public/assets/mascot/kanci-sleepy.png",
    type: "png-floodfill",
    label: "Kanci Sleepy (Yawning)"
  },
  {
    category: "mascot",
    sourceRel: "aset-sinau/mascot/Gemini_Generated_Image_ (5).jpg",
    destRel: "public/assets/mascot/kanci-encouraging.png",
    type: "png-floodfill",
    label: "Kanci Encouraging (Fist Pump)"
  },
  {
    category: "mascot",
    sourceRel: "aset-sinau/mascot/Gemini_Generated_Image_ (6).jpg",
    destRel: "public/assets/mascot/kanci-reading.png",
    type: "png-floodfill",
    label: "Kanci Reading (Green Book - Primary)"
  },
  {
    category: "mascot",
    sourceRel: "aset-sinau/mascot/Gemini_Generated_Image_ (7).jpg",
    destRel: "public/assets/mascot/kanci-outfit-kacamata.png",
    type: "png-floodfill",
    label: "Outfit Kacamata (Round Spectacles)"
  },
  {
    category: "mascot",
    sourceRel: "aset-sinau/mascot/Gemini_Generated_Image_ (8).jpg",
    destRel: "public/assets/mascot/kanci-outfit-petualang.png",
    type: "png-floodfill",
    label: "Outfit Petualang (Safari Hat & Compass)"
  },
  {
    category: "mascot",
    sourceRel: "aset-sinau/mascot/Gemini_Generated_Image_ (9).jpg",
    destRel: "public/assets/mascot/kanci-outfit-syal.png",
    type: "png-floodfill",
    label: "Outfit Syal (Beanie & Scarf)"
  },
  {
    category: "mascot",
    sourceRel: "aset-sinau/mascot/Gemini_Generated_Image_ (10).jpg",
    destRel: "public/assets/mascot/kanci-outfit-headphone.png",
    type: "png-floodfill",
    label: "Outfit Headphone (Over-ear Headphones)"
  }
];

async function main() {
  console.log("=== SINAUENGLISH V2 — Asset Installation Pipeline ===");

  // 1. Ensure target directories exist
  const dirs = [
    "public/assets/mascot",
    "public/assets/ui",
    "public/assets/borders",
    "public/assets/stories"
  ];
  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Directory confirmed: ${dir}`);
  }

  // 2. Launch browser for canvas processing
  console.log("\nLaunching Chromium browser for pixel processing...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const results = [];

  for (const item of ASSET_MAPPING) {
    const srcPath = path.resolve(item.sourceRel);
    const destPath = path.resolve(item.destRel);

    if (!fs.existsSync(srcPath)) {
      console.error(`ERROR: Source file missing: ${srcPath}`);
      results.push({
        ...item,
        status: "MISSING_SOURCE"
      });
      continue;
    }

    const srcStat = fs.statSync(srcPath);
    const srcBase64 = fs.readFileSync(srcPath).toString("base64");
    const dataUri = `data:image/jpeg;base64,${srcBase64}`;

    console.log(`Processing: ${path.basename(item.sourceRel)} -> ${path.basename(item.destRel)} [${item.type}]...`);

    let outputDataUri = null;

    if (item.type === "webp") {
      // Direct WebP conversion at 0.85 quality
      outputDataUri = await page.evaluate(async (uri) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/webp", 0.85));
          };
          img.src = uri;
        });
      }, dataUri);
    } else if (item.type === "png-border") {
      // Border: Magenta center removal + defringe + outer white flood fill
      outputDataUri = await page.evaluate(async (uri) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const w = img.width;
            const h = img.height;
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);

            const imgData = ctx.getImageData(0, 0, w, h);
            const data = imgData.data;

            // Step 1: Magenta center keying & defringing
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              
              const distMagenta = Math.sqrt((r - 255) ** 2 + g ** 2 + (b - 255) ** 2);
              if (distMagenta < 140) {
                data[i + 3] = 0;
              } else if (r > g + 40 && b > g + 40) {
                const brightness = (r + g + b) / 3;
                if (brightness < 120) {
                  data[i] = g;
                  data[i + 2] = g;
                } else {
                  data[i + 3] = 0;
                }
              }
            }

            // Step 2: Outer flood fill
            const visited = new Uint8Array(w * h);
            const queue = [0, w - 1, (h - 1) * w, (h - 1) * w + (w - 1)];
            for (const idx of queue) visited[idx] = 1;

            let head = 0;
            while (head < queue.length) {
              const idx = queue[head++];
              const px = (idx % w);
              const py = Math.floor(idx / w);
              const p4 = idx * 4;

              const r = data[p4];
              const g = data[p4 + 1];
              const b = data[p4 + 2];

              const isWhite = (r > 225 && g > 225 && b > 225);
              if (isWhite) {
                data[p4 + 3] = 0;

                const neighbors = [];
                if (px > 0) neighbors.push(idx - 1);
                if (px < w - 1) neighbors.push(idx + 1);
                if (py > 0) neighbors.push(idx - w);
                if (py < h - 1) neighbors.push(idx + w);

                for (const n of neighbors) {
                  if (!visited[n]) {
                    visited[n] = 1;
                    const nr = data[n * 4];
                    const ng = data[n * 4 + 1];
                    const nb = data[n * 4 + 2];
                    if (nr > 215 && ng > 215 && nb > 215) {
                      queue.push(n);
                    }
                  }
                }
              }
            }

            ctx.putImageData(imgData, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          };
          img.src = uri;
        });
      }, dataUri);
    } else if (item.type === "png-floodfill") {
      // Mascot / UI: Flood fill white background from 4 outer edges
      outputDataUri = await page.evaluate(async (uri) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const w = img.width;
            const h = img.height;
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);

            const imgData = ctx.getImageData(0, 0, w, h);
            const data = imgData.data;

            const visited = new Uint8Array(w * h);
            const queue = [];

            for (let x = 0; x < w; x++) {
              queue.push(x);
              queue.push((h - 1) * w + x);
              visited[x] = 1;
              visited[(h - 1) * w + x] = 1;
            }
            for (let y = 1; y < h - 1; y++) {
              queue.push(y * w);
              queue.push(y * w + (w - 1));
              visited[y * w] = 1;
              visited[y * w + (w - 1)] = 1;
            }

            let head = 0;
            while (head < queue.length) {
              const idx = queue[head++];
              const px = idx % w;
              const py = Math.floor(idx / w);
              const p4 = idx * 4;

              const r = data[p4];
              const g = data[p4 + 1];
              const b = data[p4 + 2];

              if (r > 238 && g > 238 && b > 238) {
                data[p4 + 3] = 0;

                const neighbors = [];
                if (px > 0) neighbors.push(idx - 1);
                if (px < w - 1) neighbors.push(idx + 1);
                if (py > 0) neighbors.push(idx - w);
                if (py < h - 1) neighbors.push(idx + w);

                for (const n of neighbors) {
                  if (!visited[n]) {
                    visited[n] = 1;
                    const nr = data[n * 4];
                    const ng = data[n * 4 + 1];
                    const nb = data[n * 4 + 2];
                    if (nr > 232 && ng > 232 && nb > 232) {
                      queue.push(n);
                    }
                  }
                }
              }
            }

            ctx.putImageData(imgData, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          };
          img.src = uri;
        });
      }, dataUri);
    }

    const base64Data = outputDataUri.split(",")[1];
    const outBuffer = Buffer.from(base64Data, "base64");
    fs.writeFileSync(destPath, outBuffer);

    const destStat = fs.statSync(destPath);
    const reductionPercent = (((srcStat.size - destStat.size) / srcStat.size) * 100).toFixed(1);

    results.push({
      category: item.category,
      label: item.label,
      originalFile: path.basename(item.sourceRel),
      newFile: path.basename(item.destRel),
      destRel: item.destRel,
      format: item.type === "webp" ? "WebP" : "PNG (Transparent)",
      originalSizeBytes: srcStat.size,
      newSizeBytes: destStat.size,
      originalSizeKb: (srcStat.size / 1024).toFixed(1),
      newSizeKb: (destStat.size / 1024).toFixed(1),
      reductionPercent: Number(reductionPercent),
      status: "SUCCESS"
    });

    console.log(`  -> Saved: ${(destStat.size / 1024).toFixed(1)} KB (orig: ${(srcStat.size / 1024).toFixed(1)} KB)`);
  }

  await browser.close();

  // Save summary JSON
  fs.writeFileSync("scripts/assets-summary.json", JSON.stringify(results, null, 2));
  console.log(`\nAll ${results.length} assets successfully processed and saved!`);
}

main().catch(console.error);
