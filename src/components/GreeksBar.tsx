"use client";
import { BSResult } from "@/lib/blackScholes";

interface Props {
  result: BSResult;
  entryPrice: number;
  type: "call" | "put";
}

export default function GreeksBar({ result, entryPrice, type }: Props) {
  const items = [
    { label: "PRICE", value: `$${result.price.toFixed(4)}`, color: "#e6edf3" },
    { label: "DELTA", value: result.delta.toFixed(4), color: type === "call" ? "#3fb950" : "#f85149" },
    { label: "GAMMA", value: result.gamma.toFixed(5), color: "#a371f7" },
    { label: "THETA", value: result.theta.toFixed(4), color: "#d29922" },
    { label: "VEGA", value: result.vega.toFixed(4), color: "#388bfd" },
    { label: "RHO", value: result.rho.toFixed(4), color: "#8b949e" },
    { label: "IV (used)", value: "—", color: "#484f58" },
  ];

  return (
    <div style={{
      display: "flex",
      gap: 0,
      borderBottom: "1px solid #21262d",
      fontFamily: "monospace",
      fontSize: 11,
    }}>
      {items.map(({ label, value, color }, i) => (
        <div key={label} style={{
          flex: 1,
          padding: "8px 12px",
          borderRight: i < items.length - 1 ? "1px solid #21262d" : "none",
        }}>
          <div style={{ color: "#484f58", marginBottom: 3, fontSize: 10 }}>{label}</div>
          <div style={{ color, fontWeight: 600 }}>{value}</div>
        </div>
      ))}
    </div>
  );
}
