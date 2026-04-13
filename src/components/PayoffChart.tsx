"use client";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, Tooltip, Legend } from "recharts";
import { PayoffPoint } from "@/lib/blackScholes";

interface Props {
  data: PayoffPoint[];
  breakevens: { lower: number | null; upper: number | null };
  spot: number;
  entryPrice: number;
}

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0d1117", border: "1px solid #30363d", borderRadius: 6, padding: "8px 12px", fontFamily: "monospace", fontSize: 12 }}>
      <div style={{ color: "#8b949e", marginBottom: 4 }}>S = ${Number(label).toFixed(2)}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <span style={{ color: p.value >= 0 ? "#3fb950" : "#f85149" }}>{p.value >= 0 ? "+" : ""}${Number(p.value).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
};

export default function PayoffChart({ data, breakevens, spot, entryPrice }: Props) {
  const allVals = data.flatMap(d => [d.expiry, d.tZero, d.tHalf]);
  const minY = Math.min(...allVals);
  const maxY = Math.max(...allVals);
  const pad = (maxY - minY) * 0.12;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="#1c2128" vertical={false} />
        <XAxis
          dataKey="S"
          tick={{ fill: "#484f58", fontSize: 10, fontFamily: "monospace" }}
          tickFormatter={v => `$${Number(v).toFixed(0)}`}
          interval={Math.floor(data.length / 8)}
          axisLine={{ stroke: "#21262d" }}
          tickLine={false}
        />
        <YAxis
          domain={[minY - pad, maxY + pad]}
          tick={{ fill: "#484f58", fontSize: 10, fontFamily: "monospace" }}
          tickFormatter={v => `$${Number(v).toFixed(0)}`}
          width={55}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<Tip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, fontFamily: "monospace", paddingTop: 8 }}
          formatter={(v) => <span style={{ color: "#8b949e" }}>{v}</span>}
        />

        {/* zero line */}
        <ReferenceLine y={0} stroke="#30363d" strokeWidth={1} />

        {/* spot */}
        <ReferenceLine x={spot} stroke="#388bfd" strokeWidth={1} strokeDasharray="4 3"
          label={{ value: "SPOT", fill: "#388bfd", fontSize: 9, fontFamily: "monospace", position: "top" }} />

        {/* breakevens */}
        {breakevens.upper && (
          <ReferenceLine x={breakevens.upper} stroke="#d29922" strokeWidth={1} strokeDasharray="3 3"
            label={{ value: "BE", fill: "#d29922", fontSize: 9, fontFamily: "monospace", position: "top" }} />
        )}
        {breakevens.lower && (
          <ReferenceLine x={breakevens.lower} stroke="#d29922" strokeWidth={1} strokeDasharray="3 3"
            label={{ value: "BE", fill: "#d29922", fontSize: 9, fontFamily: "monospace", position: "top" }} />
        )}

        <Line type="monotone" dataKey="expiry" name="Expiry" stroke="#f85149" dot={false} strokeWidth={1.5} strokeDasharray="6 3" />
        <Line type="monotone" dataKey="tHalf" name="T½" stroke="#a371f7" dot={false} strokeWidth={1.5} strokeDasharray="4 3" />
        <Line type="monotone" dataKey="tZero" name="T+0" stroke="#3fb950" dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
