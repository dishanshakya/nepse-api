import { Nepse } from "@rumess/nepse-api";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET(_request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol: rawSymbol } = await params;
  const symbol = decodeURIComponent(rawSymbol).trim().toUpperCase();
  if (!/^[A-Z0-9._-]{1,20}$/.test(symbol)) {
    return Response.json({ error: "Invalid stock symbol." }, { status: 400 });
  }

  try {
    const nepse = new Nepse();
    if (process.env.ENABLE_INSECURE_TLS === "true") nepse.setTLSVerification(false);
    const [detailsResult, historyResult] = await Promise.allSettled([
      nepse.getSecurityDetails(symbol),
      nepse.getSecurityPriceVolumeHistory(symbol),
    ]);
    const details = detailsResult.status === "fulfilled" ? detailsResult.value : null;
    const history = historyResult.status === "fulfilled" ? historyResult.value.content : [];

    if (detailsResult.status === "rejected") console.error(`Failed to fetch ${symbol} security details:`, detailsResult.reason);
    if (historyResult.status === "rejected") console.error(`Failed to fetch ${symbol} price history:`, historyResult.reason);

    if (!details && history.length === 0) {
      throw new Error("NEPSE returned neither security details nor price history");
    }

    return Response.json({ details, history, fetchedAt: new Date().toISOString() }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error(`Failed to fetch ${symbol} details:`, error);
    return Response.json({ error: "Stock details are temporarily unavailable." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
