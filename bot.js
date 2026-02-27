const { chromium } = require("playwright");
const axios = require("axios");

const WEBHOOK_URL = process.env.WEBHOOK_URL;
const MAP_URL = process.env.MAP_URL;
const INTERVAL = parseInt(process.env.INTERVAL_SECONDS || "180");

async function takeScreenshot() {
  const browser = await chromium.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.goto(MAP_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(5000);

  const screenshot = await page.screenshot();
  await browser.close();

  return screenshot;
}

async function sendToWebhook(imageBuffer) {
  await axios.post(WEBHOOK_URL, imageBuffer, {
    headers: {
      "Content-Type": "application/octet-stream"
    }
  });
}

async function job() {
  try {
    console.log("Robię screena...");
    const image = await takeScreenshot();
    await sendToWebhook(image);
    console.log("Wysłane ✅");
  } catch (err) {
    console.error("Błąd:", err);
  }
}

setInterval(job, INTERVAL * 1000);
job();


// --- SERWER DLA RENDER (WYMAGANY) ---

const http = require("http");
const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Bot is running");
}).listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
