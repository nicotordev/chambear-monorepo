
import 'dotenv/config'
import path from "path";
import { brightdataClient } from "../scraping/clients";


async function main() {
  console.log("Starting BrightData SERP Test...");
  console.log("BRIGHTDATA_API_KEY:", process.env.BRIGHTDATA_API_KEY ? "EXISTS" : "MISSING");
  console.log("BRIGHTDATA_SERP_ZONE:", process.env.BRIGHTDATA_SERP_ZONE);

  const query = "intitle:careers \"Full Stack\"";

  console.log(`Executing query: ${query}`);

  try {
    const startTime = Date.now();
    const results = await brightdataClient.searchGoogle(query);
    const duration = Date.now() - startTime;

    console.log(`Search completed in ${duration}ms`);
    console.log(`Total results: ${results.length}`);

    if (results.length > 0) {
      console.log("First 3 results:");
      results.slice(0, 3).forEach((r, i) => {
        console.log(`${i + 1}. ${r.title}`);
        console.log(`   URL: ${r.url}`);
      });
    } else {
      console.log("No results found. This might indicate a parsing issue or a blocked request.");
    }
  } catch (error: any) {
    console.error("Test failed with error:");
    console.error(error);
    if (error.response) {
      console.error("Response data:", JSON.stringify(error.response.data, null, 2));
    }
  }
}

main().catch(console.error);
