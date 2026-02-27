const axios = require("axios");
const FormData = require("form-data");
const { chromium, devices } = require("playwright");

const MAP_URL = process.env.MAP_URL;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

const INTERVAL_MS = (process.env.INTERVAL_SECONDS || 180) * 1000;
const WAIT_MS = Number(process.env.WAIT_MS || 12000);

if (!WEBHOOK_URL || !MAP_URL) {
  console.error("Brakuje MAP_URL lub WEBHOOK_URL");
  process.exit(1);
}

async function sendToDiscord(pngBuffer) {
  const form = new FormData();
  form.append("content", "📸 EarthSMP — screen co 3 min");
  form.append("file", pngBuffer, { filename: "earthsmp.png", contentType: "image/png" });

  await axios.post(WEBHOOK_URL, form, { headers: form.getHeaders() });
}

async function takeScreenshot() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"]
  });

  const device = devices["iPhone 12"];
  const context = await browser.newContext({ ...device });

  const page = await context.newPage();
  await page.goto(MAP_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(WAIT_MS);

  const screenshot = await page.screenshot({
    type: "png",
    fullPage: true
  });

  await browser.close();
  return screenshot;
}

async function loop() {
  while (true) {
    const start = Date.now();
    try {
      const img = await takeScreenshot();
      await sendToDiscord(img);
      console.log("✅ sent");
    } catch (err) {
      console.error("❌", err?.message || err);
    }

    const elapsed = Date.now() - start;
    const wait = Math.max(0, INTERVAL_MS - elapsed);
    await new Promise(r => setTimeout(r, wait));
  }
}

loop();
