import "dotenv/config";

const API_URL = process.env.API_URL || "http://localhost:3001";
const CRON_SECRET = process.env.CRON_SECRET;

if (!CRON_SECRET) {
  console.error("❌ CRON_SECRET is not defined in environment variables");
  process.exit(1);
}

const triggerScrape = async () => {
  const startTime = performance.now();
  const targetUrl = `${API_URL}/api/v1/webhooks/scrappers/users`;

  console.log(`\n🚀 [Cron] Starting scrape trigger...`);
  console.log(`📍 Target: ${targetUrl}`);

  try {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CRON_SECRET}`,
      },
    });

    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Status ${res.status} (${res.statusText}) - ${text}`);
    }

    const data = await res.json();
    console.log(`\n✅ Scrape triggered successfully!`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`📦 Response:`, JSON.stringify(data, null, 2));
    console.log("-----------------------------------\n");
  } catch (error) {
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.error(`\n❌ Error triggering scrape after ${duration}s:`);
    if (error instanceof Error) {
      console.error(`👉 ${error.message}`);
    } else {
      console.error(`👉`, error);
    }
    process.exit(1);
  }
};

setTimeout(() => {
  setInterval(triggerScrape, 5 * 60 * 1000);
}, 5 * 60 * 1000);
