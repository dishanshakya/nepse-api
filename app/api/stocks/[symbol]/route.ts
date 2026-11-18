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
    const [details, history] = await Promise.all([
      nepse.getSecurityDetails(symbol),
      nepse.getSecurityPriceVolumeHistory(symbol),
    ]);
    return Response.json({ details, history: history.content, fetchedAt: new Date().toISOString() }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error(`Failed to fetch ${symbol} details:`, error);
    return Response.json({ error: "Stock details are temporarily unavailable." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
