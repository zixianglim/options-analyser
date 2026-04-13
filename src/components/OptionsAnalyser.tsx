"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { blackScholes, generatePayoffData, calcBreakevens, BSResult } from "@/lib/blackScholes";
import PayoffChart from "@/components/PayoffChart";
import OptionChain from "@/components/OptionChain";

// ── types ────────────────────────────────────────────────────────────────────
interface Quote { ticker: string; price: number; change: number; changePct: number; marketState: string }
interface OptionRow { strike: number; lastPrice: number; bid: number; ask: number; iv: number; delta: number | null; gamma: number | null; theta: number | null; openInterest: number; volume: number; inTheMoney: boolean }
interface ChainData { spot: number; expirationDates: number[]; calls: OptionRow[]; puts: OptionRow[] }

// ── helpers ──────────────────────────────────────────────────────────────────
function fmtDate(unix: number) {
  return new Date(unix * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}
function dte(unix: number) {
  return Math.max(1, Math.round((unix * 1000 - Date.now()) / 86400000));
}

// ── component ────────────────────────────────────────────────────────────────
export default function OptionsAnalyser() {
  const [ticker, setTicker] = useState("SPY");
  const [inputTicker, setInputTicker] = useState("SPY");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [chain, setChain] = useState<ChainData | null>(null);
  const [selectedExpiry, setSelectedExpiry] = useState<number | null>(null);
  const [selectedStrike, setSelectedStrike] = useState<number | null>(null);
  const [side, setSide] = useState<"call" | "put">("call");
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [manualIV, setManualIV] = useState<number | null>(null);
  const [rfRate, setRfRate] = useState(5.25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"payoff" | "chain">("payoff");

  // fetch quote
  const fetchQuote = useCallback(async (t: string) => {
    setLoading(true); setError("");
    try {
      const r = await fetch(`/api/quote?ticker=${t}`);
      const d = await r.json();
      if (d.error) { setError(d.error); setLoading(false); return; }
      setQuote(d);
    } catch { setError("Network error"); }
    setLoading(false);
  }, []);

  // fetch chain
  const fetchChain = useCallback(async (t: string, expiry?: number) => {
    const url = expiry ? `/api/options?ticker=${t}&expiry=${expiry}` : `/api/options?ticker=${t}`;
    try {
      const r = await fetch(url);
      const d = await r.json();
      if (d.error) return;
      setChain(d);
      if (!expiry && d.expirationDates?.length) setSelectedExpiry(d.expirationDates[0]);
    } catch {}
  }, []);

  useEffect(() => { fetchQuote("SPY"); fetchChain("SPY"); }, []);

  const handleSearch = () => {
    const t = inputTicker.toUpperCase().trim();
    if (!t) return;
    setTicker(t); setSelectedStrike(null); setSelectedExpiry(null); setChain(null); setManualIV(null);
    fetchQuote(t); fetchChain(t);
  };

  const handleExpiry = (unix: number) => {
    setSelectedExpiry(unix); setSelectedStrike(null); setManualIV(null);
    fetchChain(ticker, unix);
  };

  // derive selected row
  const selectedRow = useMemo(() => {
    if (!chain || !selectedStrike) return null;
    const rows = side === "call" ? chain.calls : chain.puts;
    return rows.find(r => r.strike === selectedStrike) ?? null;
  }, [chain, selectedStrike, side]);

  // BS inputs
  const spot = quote?.price ?? chain?.spot ?? 500;
  const strike = selectedStrike ?? spot;
  const iv = manualIV ?? selectedRow?.iv ?? 25;
  const T = selectedExpiry ? Math.max(dte(selectedExpiry) / 365, 1 / 365) : 30 / 365;

  const bsInputs = useMemo(() => ({
    S: spot, K: strike, T, r: rfRate / 100, sigma: iv / 100, type: side,
  }), [spot, strike, T, rfRate, iv, side]);

  const bsResult: BSResult = useMemo(() => blackScholes(bsInputs), [bsInputs]);
  const entryPrice = bsResult.price;
  const payoffData = useMemo(() => generatePayoffData(bsInputs, entryPrice), [bsInputs, entryPrice]);
  const breakevens = useMemo(() => calcBreakevens(bsInputs, entryPrice), [bsInputs, entryPrice]);

  const dirMult = direction === "long" ? 1 : -1;

  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", color: "#e6edf3", fontFamily: "monospace", fontSize: 12 }}>

      {/* ── TOP BAR ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, borderBottom: "1px solid #21262d", padding: "0 16px", height: 44 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingRight: 16, borderRight: "1px solid #21262d", marginRight: 16, height: "100%" }}>
          <div style={{ width: 20, height: 20, background: "#388bfd", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>Δ</div>
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: "0.05em" }}>OptionsIQ</span>
        </div>

        {/* Ticker search */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 20 }}>
          <input
            value={inputTicker}
            onChange={e => setInputTicker(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="SPY"
            style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 6, padding: "4px 10px", color: "#e6edf3", fontFamily: "monospace", fontSize: 13, fontWeight: 700, width: 80, outline: "none" }}
          />
          <button
            onClick={handleSearch}
            style={{ background: "#1c2128", border: "1px solid #30363d", borderRadius: 6, color: "#8b949e", padding: "4px 10px", cursor: "pointer", fontFamily: "monospace", fontSize: 11 }}
          >GO</button>
        </div>

        {/* Quote */}
        {quote && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginRight: 20 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#e6edf3" }}>${quote.price.toFixed(2)}</span>
            <span style={{ fontSize: 12, color: quote.change >= 0 ? "#3fb950" : "#f85149" }}>
              {quote.change >= 0 ? "▲" : "▼"} {Math.abs(quote.change).toFixed(2)} ({Math.abs(quote.changePct).toFixed(2)}%)
            </span>
            <span style={{ fontSize: 10, color: "#484f58", background: "#161b22", padding: "2px 6px", borderRadius: 4 }}>
              {quote.marketState}
            </span>
          </div>
        )}

        {loading && <span style={{ color: "#484f58", fontSize: 11 }}>loading...</span>}
        {error && <span style={{ color: "#f85149", fontSize: 11 }}>{error}</span>}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* RF rate input */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#484f58", fontSize: 11 }}>
          <span>RF%</span>
          <input
            type="number"
            value={rfRate}
            step={0.25}
            onChange={e => setRfRate(parseFloat(e.target.value) || 0)}
            style={{ width: 52, background: "#161b22", border: "1px solid #21262d", borderRadius: 4, color: "#8b949e", padding: "3px 6px", fontFamily: "monospace", fontSize: 11, outline: "none" }}
          />
        </div>
      </div>

      {/* ── GREEKS BAR ── */}
      <div style={{ display: "flex", borderBottom: "1px solid #21262d", background: "#0d1117" }}>
        {[
          { label: "THEO PRICE", value: `$${bsResult.price.toFixed(4)}`, color: "#e6edf3" },
          { label: "DELTA", value: (dirMult * bsResult.delta).toFixed(4), color: side === "call" ? "#3fb950" : "#f85149" },
          { label: "GAMMA", value: (dirMult * bsResult.gamma).toFixed(5), color: "#a371f7" },
          { label: "THETA/day", value: (dirMult * bsResult.theta).toFixed(4), color: "#d29922" },
          { label: "VEGA/1%", value: (dirMult * bsResult.vega).toFixed(4), color: "#388bfd" },
          { label: "RHO/1%", value: (dirMult * bsResult.rho).toFixed(4), color: "#8b949e" },
          { label: "IV (used)", value: `${iv.toFixed(1)}%`, color: "#d29922" },
          { label: "DTE", value: selectedExpiry ? `${dte(selectedExpiry)}d` : "30d", color: "#484f58" },
        ].map(({ label, value, color }, i, arr) => (
          <div key={label} style={{ flex: 1, padding: "7px 12px", borderRight: i < arr.length - 1 ? "1px solid #21262d" : "none" }}>
            <div style={{ color: "#484f58", marginBottom: 2, fontSize: 10 }}>{label}</div>
            <div style={{ color, fontWeight: 600, fontSize: 12 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", height: "calc(100vh - 44px - 52px)" }}>

        {/* ── LEFT: chain + controls ── */}
        <div style={{ borderRight: "1px solid #21262d", display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Controls */}
          <div style={{ padding: "10px 12px", borderBottom: "1px solid #21262d", display: "flex", flexDirection: "column", gap: 8 }}>

            {/* Call / Put + Long / Short */}
            <div style={{ display: "flex", gap: 6 }}>
              {(["call", "put"] as const).map(s => (
                <button key={s} onClick={() => setSide(s)} style={{
                  flex: 1, padding: "5px 0", borderRadius: 6, border: "1px solid",
                  borderColor: side === s ? (s === "call" ? "#3fb950" : "#f85149") : "#21262d",
                  background: side === s ? (s === "call" ? "rgba(63,185,80,0.12)" : "rgba(248,81,73,0.12)") : "#161b22",
                  color: side === s ? (s === "call" ? "#3fb950" : "#f85149") : "#484f58",
                  cursor: "pointer", fontFamily: "monospace", fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                }}>{s}</button>
              ))}
              {(["long", "short"] as const).map(d => (
                <button key={d} onClick={() => setDirection(d)} style={{
                  flex: 1, padding: "5px 0", borderRadius: 6, border: "1px solid",
                  borderColor: direction === d ? "#388bfd" : "#21262d",
                  background: direction === d ? "rgba(56,139,253,0.12)" : "#161b22",
                  color: direction === d ? "#388bfd" : "#484f58",
                  cursor: "pointer", fontFamily: "monospace", fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                }}>{d}</button>
              ))}
            </div>

            {/* Expiry selector */}
            {chain?.expirationDates && chain.expirationDates.length > 0 && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {chain.expirationDates.slice(0, 8).map(unix => (
                  <button key={unix} onClick={() => handleExpiry(unix)} style={{
                    padding: "3px 8px", borderRadius: 4, border: "1px solid",
                    borderColor: selectedExpiry === unix ? "#388bfd" : "#21262d",
                    background: selectedExpiry === unix ? "rgba(56,139,253,0.15)" : "#161b22",
                    color: selectedExpiry === unix ? "#388bfd" : "#484f58",
                    cursor: "pointer", fontFamily: "monospace", fontSize: 10,
                  }}>{fmtDate(unix)} <span style={{ color: "#484f58" }}>{dte(unix)}d</span></button>
                ))}
              </div>
            )}

            {/* Strike + IV override */}
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#484f58", fontSize: 10, marginBottom: 3 }}>STRIKE</div>
                <input
                  type="number"
                  value={selectedStrike ?? ""}
                  placeholder={`${spot.toFixed(0)}`}
                  onChange={e => setSelectedStrike(parseFloat(e.target.value) || null)}
                  style={{ width: "100%", background: "#161b22", border: "1px solid #30363d", borderRadius: 6, color: "#e6edf3", padding: "5px 8px", fontFamily: "monospace", fontSize: 12, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#484f58", fontSize: 10, marginBottom: 3 }}>IV% OVERRIDE</div>
                <input
                  type="number"
                  value={manualIV ?? ""}
                  placeholder={`${iv.toFixed(1)} (auto)`}
                  onChange={e => setManualIV(e.target.value ? parseFloat(e.target.value) : null)}
                  style={{ width: "100%", background: "#161b22", border: "1px solid #30363d", borderRadius: 6, color: "#e6edf3", padding: "5px 8px", fontFamily: "monospace", fontSize: 12, outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>

            {/* Selected strike summary */}
            {selectedRow && (
              <div style={{ background: "#161b22", borderRadius: 6, padding: "6px 10px", border: "1px solid #21262d", display: "flex", gap: 16 }}>
                <div><span style={{ color: "#484f58", fontSize: 10 }}>BID </span><span style={{ color: "#f85149" }}>${selectedRow.bid.toFixed(2)}</span></div>
                <div><span style={{ color: "#484f58", fontSize: 10 }}>ASK </span><span style={{ color: "#3fb950" }}>${selectedRow.ask.toFixed(2)}</span></div>
                <div><span style={{ color: "#484f58", fontSize: 10 }}>OI </span><span style={{ color: "#8b949e" }}>{selectedRow.openInterest.toLocaleString()}</span></div>
                <div><span style={{ color: "#484f58", fontSize: 10 }}>VOL </span><span style={{ color: "#8b949e" }}>{selectedRow.volume.toLocaleString()}</span></div>
              </div>
            )}
          </div>

          {/* Chain table */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {chain ? (
              <OptionChain
                calls={chain.calls}
                puts={chain.puts}
                spot={spot}
                side={side}
                selectedStrike={selectedStrike}
                onSelect={row => {
                  setSelectedStrike(row.strike);
                  setManualIV(null); // use chain IV
                }}
              />
            ) : (
              <div style={{ padding: 20, color: "#484f58", textAlign: "center" }}>
                {loading ? "Fetching option chain..." : "Search a ticker to load chain"}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: chart + summary ── */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Chart header */}
          <div style={{ padding: "10px 16px", borderBottom: "1px solid #21262d", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "#8b949e", fontSize: 11 }}>
              {ticker} &nbsp;
              <span style={{ color: side === "call" ? "#3fb950" : "#f85149", textTransform: "uppercase" }}>{direction} {side}</span>
              {selectedStrike && <span style={{ color: "#e6edf3" }}> ${selectedStrike}</span>}
              {selectedExpiry && <span style={{ color: "#484f58" }}> · {fmtDate(selectedExpiry)}</span>}
            </span>
            <div style={{ flex: 1 }} />
            {/* Legend */}
            {[
              { label: "Expiry", color: "#f85149" },
              { label: "T½", color: "#a371f7" },
              { label: "T+0", color: "#3fb950" },
            ].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#8b949e" }}>
                <div style={{ width: 20, height: 2, background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>

          {/* Payoff chart */}
          <div style={{ flex: 1, padding: "12px 8px 0" }}>
            <PayoffChart data={payoffData} breakevens={breakevens} spot={spot} entryPrice={entryPrice} />
          </div>

          {/* Breakeven summary */}
          <div style={{ borderTop: "1px solid #21262d", display: "grid", gridTemplateColumns: "repeat(5, 1fr)" }}>
            {[
              { label: "THEO PRICE", value: `$${entryPrice.toFixed(4)}`, color: "#e6edf3" },
              { label: "MAX PROFIT", value: side === "call" ? "Unlimited" : `$${((strike - entryPrice) * 100).toFixed(0)}`, color: "#3fb950" },
              { label: "MAX LOSS", value: `$${(entryPrice * 100).toFixed(0)}/contract`, color: "#f85149" },
              { label: "BREAKEVEN", value: breakevens.upper ? `$${breakevens.upper.toFixed(2)}` : breakevens.lower ? `$${breakevens.lower.toFixed(2)}` : "—", color: "#d29922" },
              { label: "P/L RATIO", value: side === "call" ? "∞" : `${((strike - entryPrice) / entryPrice).toFixed(1)}x`, color: "#8b949e" },
            ].map(({ label, value, color }, i, arr) => (
              <div key={label} style={{ padding: "10px 14px", borderRight: i < arr.length - 1 ? "1px solid #21262d" : "none" }}>
                <div style={{ color: "#484f58", fontSize: 10, marginBottom: 3 }}>{label}</div>
                <div style={{ color, fontWeight: 600, fontSize: 12 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
