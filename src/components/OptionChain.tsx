"use client";

interface OptionRow {
  strike: number;
  lastPrice: number;
  bid: number;
  ask: number;
  iv: number;
  delta: number | null;
  gamma: number | null;
  theta: number | null;
  openInterest: number;
  volume: number;
  inTheMoney: boolean;
}

interface Props {
  calls: OptionRow[];
  puts: OptionRow[];
  spot: number;
  side: "call" | "put";
  selectedStrike: number | null;
  onSelect: (row: OptionRow) => void;
}

function fmt(n: number | null, dec = 2) {
  if (n === null || isNaN(n)) return "—";
  return n.toFixed(dec);
}
function fmtK(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

export default function OptionChain({ calls, puts, spot, side, selectedStrike, onSelect }: Props) {
  const rows = side === "call" ? calls : puts;

  return (
    <div style={{ fontFamily: "monospace", fontSize: 11, overflowY: "auto", height: "100%" }}>
      {/* Header */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "52px 44px 44px 44px 42px 40px 40px 40px",
        gap: 0,
        padding: "6px 8px",
        borderBottom: "1px solid #21262d",
        color: "#484f58",
        position: "sticky",
        top: 0,
        background: "#0d1117",
        zIndex: 1,
      }}>
        <span>Strike</span>
        <span style={{ textAlign: "right" }}>Last</span>
        <span style={{ textAlign: "right" }}>Bid</span>
        <span style={{ textAlign: "right" }}>Ask</span>
        <span style={{ textAlign: "right" }}>IV%</span>
        <span style={{ textAlign: "right" }}>Δ</span>
        <span style={{ textAlign: "right" }}>OI</span>
        <span style={{ textAlign: "right" }}>Vol</span>
      </div>

      {/* Rows */}
      {rows.map((row) => {
        const isSelected = selectedStrike === row.strike;
        const isATM = Math.abs(row.strike - spot) < spot * 0.005;
        return (
          <div
            key={row.strike}
            onClick={() => onSelect(row)}
            style={{
              display: "grid",
              gridTemplateColumns: "52px 44px 44px 44px 42px 40px 40px 40px",
              gap: 0,
              padding: "5px 8px",
              cursor: "pointer",
              background: isSelected
                ? "#1c2128"
                : row.inTheMoney
                ? "rgba(63,185,80,0.04)"
                : "transparent",
              borderLeft: isSelected ? "2px solid #388bfd" : "2px solid transparent",
              borderBottom: isATM ? "1px solid #21262d" : "1px solid transparent",
            }}
          >
            <span style={{ color: isATM ? "#e6edf3" : row.inTheMoney ? "#3fb950" : "#8b949e", fontWeight: isATM ? 600 : 400 }}>
              {row.strike.toFixed(0)}
              {isATM && <span style={{ color: "#388bfd", marginLeft: 3, fontSize: 9 }}>◆</span>}
            </span>
            <span style={{ textAlign: "right", color: "#e6edf3" }}>{fmt(row.lastPrice)}</span>
            <span style={{ textAlign: "right", color: "#8b949e" }}>{fmt(row.bid)}</span>
            <span style={{ textAlign: "right", color: "#8b949e" }}>{fmt(row.ask)}</span>
            <span style={{ textAlign: "right", color: "#d29922" }}>{fmt(row.iv, 1)}</span>
            <span style={{ textAlign: "right", color: side === "call" ? "#3fb950" : "#f85149" }}>
              {fmt(row.delta, 3)}
            </span>
            <span style={{ textAlign: "right", color: "#484f58" }}>{fmtK(row.openInterest)}</span>
            <span style={{ textAlign: "right", color: "#484f58" }}>{fmtK(row.volume)}</span>
          </div>
        );
      })}
    </div>
  );
}
