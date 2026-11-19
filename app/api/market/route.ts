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
    let previousMarket: Awaited<ReturnType<typeof nepse.getTodaysPriceVolumeHistory>>["content"] = [];
    let securities: Awaited<ReturnType<typeof nepse.getSecurityList>> = [];
    if (liveMarket.length === 0) {
      // Walk back over weekdays; querying each candidate also naturally skips
      // exchange holidays because those dates return no quotes.
      const kathmanduNow = new Date(Date.now() + 5 * 60 * 60 * 1000 + 45 * 60 * 1000);
      for (let daysBack = 1; daysBack <= 7 && previousMarket.length === 0; daysBack++) {
        const candidate = new Date(kathmanduNow);
        candidate.setUTCDate(candidate.getUTCDate() - daysBack);
        if (candidate.getUTCDay() === 0 || candidate.getUTCDay() === 6) continue;
        try {
          const result = await nepse.getTodaysPriceVolumeHistory({
            businessDate: candidate.toISOString().slice(0, 10),
            page: 0,
            size: 1000,
          });
          previousMarket = result.content;
        } catch (error) {
          console.error(`Failed to fetch NEPSE prices for ${candidate.toISOString().slice(0, 10)}:`, error);
        }
      }
      if (previousMarket.length === 0) {
        securities = await nepse.getSecurityList().catch((error) => {
          console.error("Failed to fetch fallback security list:", error);
          return [];
        });
      }
    }

    return Response.json(
      { liveMarket, previousMarket, securities, nepseIndex, nepseIndexHistory, fetchedAt: new Date().toISOString() },
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
