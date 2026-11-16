import { Nepse } from "@rumess/nepse-api";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET() {
  try {
    const nepse = new Nepse();

    // The upstream library documents this workaround for NEPSE certificate
    // issues. It is intentionally opt-in because it disables TLS verification.
    if (process.env.ENABLE_INSECURE_TLS === "true") {
      nepse.setTLSVerification(false);
    }

    const [liveMarket, nepseIndex, nepseIndexHistory] = await Promise.all([
      nepse.getLiveMarket(),
      nepse.getNepseIndex(),
      nepse.getNepseIndexDailyGraph(),
    ]);

    return Response.json(
      { liveMarket, nepseIndex, nepseIndexHistory, fetchedAt: new Date().toISOString() },
      {
        headers: {
          // Vercel's CDN may reuse a successful response for 60 seconds and
          // serve stale data briefly while refreshing it in the background.
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error("Failed to fetch NEPSE market data:", error);
    return Response.json(
      { error: "Market data is temporarily unavailable." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
