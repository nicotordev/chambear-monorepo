import 'dotenv/config'

const API_URL = process.env.API_URL || "http://localhost:3001";
const CRON_SECRET = process.env.CRON_SECRET;

if (!CRON_SECRET) {
  console.error("❌ CRON_SECRET is not defined");
  process.exit(1);
}

const triggerScrape = async () => {
  console.log(`Triggering scrape at ${API_URL}/api/v1/webhooks/scrappers/users...`);
  try {
    const res = await fetch(`${API_URL}/api/v1/webhooks/scrappers/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CRON_SECRET}`,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed: ${res.status} ${res.statusText} - ${text}`);
    }

    const data = await res.json();
    console.log("✅ Scrape triggered successfully:", data);
  } catch (error) {
    console.error("❌ Error triggering scrape:", error);
    process.exit(1);
  }
};

triggerScrape();
