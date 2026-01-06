import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "Latitude and longitude are required" },
      { status: 400 },
    );
  }

  const token = process.env.LOCATIONIQ_ACCESS_TOKEN;

  if (!token) {
    console.error(
      "LOCATIONIQ_ACCESS_TOKEN is not defined in environment variables",
    );
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  try {
    const url = `https://us1.locationiq.com/v1/reverse.php?key=${token}&lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    console.log("Fetching from LocationIQ:", url.replace(token, "[REDACTED]"));

    const response = await fetch(url, {
      headers: {
        "Accept-Language": "es,en", // Prefer Spanish
        Referer: req.headers.get("referer") || "http://localhost:3000",
      },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    const errorText = await response.text();
    console.error(`LocationIQ API error (${response.status}):`, errorText);

    // Fallback to Nominatim if LocationIQ fails (especially for 403 Access Restricted)
    console.info("Falling back to Nominatim (OpenStreetMap)...");
    const nominatimResponse = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "es,en",
          "User-Agent": "Chambear-App/1.0 (Contact: admin@chambear.com)",
        },
      },
    );

    if (nominatimResponse.ok) {
      const data = await nominatimResponse.json();
      return NextResponse.json(data);
    }

    return NextResponse.json(
      {
        error: "All geocoding services failed",
        locationiq_status: response.status,
      },
      { status: 502 },
    );
  } catch (error: any) {
    console.error("Reverse geocoding API route error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
