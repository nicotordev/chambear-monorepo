import "dotenv/config";

const CRON_SECRET = process.env.CRON_SECRET;
const URL = process.env.URL;

if (!CRON_SECRET) {
  console.error("❌ CRON_SECRET is not defined in environment variables");
  process.exit(1);
}

const attemptTrigger = async (): Promise<boolean> => {
  const targetUrl = `${URL}`;

  console.log(`📍 Attempting target: ${targetUrl}`);
  const startTime = performance.now();

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
    console.log(`✅ Scrape triggered successfully at ${targetUrl}`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`📦 Response:`, JSON.stringify(data, null, 2));
    return true;
  } catch (error: any) {
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.warn(
      `⚠️  Failed attempt at ${targetUrl} after ${duration}s: ${error.message}`
    );
    if (error.cause) {
      console.warn(`   Cause:`, error.cause);
    }
    return false;
  }
};

const main = async () => {
  console.log(`
🚀 [Cron] Starting scrape trigger process...`);

  // Candidate URLs to try
  const candidates: string[] = [];

  if (URL) {
    candidates.push(URL);
  }

  // Add fallbacks for Docker/Local environments
  // We avoid adding duplicates if ENV_API_URL is already one of them
  const fallbacks = ["http://backend:3001", "http://localhost:3001"];

  for (const fb of fallbacks) {
    if (fb !== URL) {
      candidates.push(fb);
    }
  }

  for (const baseUrl of candidates) {
    const success = await attemptTrigger();
    if (success) {
      console.log("-----------------------------------\n");
      process.exit(0);
    }
  }

  console.error("\n❌ All attempts failed. Could not trigger scrape.");
  process.exit(1);
};

main();
