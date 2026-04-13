import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker") ?? "SPY";
  const clean = ticker.toUpperCase().trim();

  try {
    // Fetch quote
    const quoteRes = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${clean}?interval=1d&range=1d`,
      { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 60 } }
    );
    const quoteJson = await quoteRes.json();
    const meta = quoteJson?.chart?.result?.[0]?.meta;
    if (!meta) return NextResponse.json({ error: "Ticker not found" }, { status: 404 });

    const price = meta.regularMarketPrice ?? meta.previousClose;
    const prevClose = meta.previousClose ?? price;
    const change = price - prevClose;
    const changePct = (change / prevClose) * 100;

    return NextResponse.json({
      ticker: clean,
      price,
      prevClose,
      change,
      changePct,
      currency: meta.currency ?? "USD",
      marketState: meta.marketState ?? "CLOSED",
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch quote" }, { status: 500 });
  }
}
