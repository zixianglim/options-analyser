"use client";

import { BSResult } from "@/lib/blackScholes";

interface Props {
  result: BSResult;
  type: "call" | "put";
}

const metrics = [
  {
    key: "price",
    label: "Theoretical Price",
    format: (v: number) => `$${v.toFixed(4)}`,
    desc: "Fair value per BS model",
    color: "text-emerald-400",
  },
  {
    key: "delta",
    label: "Delta (Δ)",
    format: (v: number) => v.toFixed(4),
    desc: "Price change per $1 move in underlying",
    color: "text-sky-400",
  },
  {
    key: "gamma",
    label: "Gamma (Γ)",
    format: (v: number) => v.toFixed(6),
    desc: "Delta change per $1 move in underlying",
    color: "text-violet-400",
  },
  {
    key: "theta",
    label: "Theta (Θ)",
    format: (v: number) => v.toFixed(4),
    desc: "Price decay per calendar day",
    color: "text-amber-400",
  },
  {
    key: "vega",
    label: "Vega (V)",
    format: (v: number) => v.toFixed(4),
    desc: "Price change per 1% move in IV",
    color: "text-pink-400",
  },
  {
    key: "rho",
    label: "Rho (ρ)",
    format: (v: number) => v.toFixed(4),
    desc: "Price change per 1% move in rate",
    color: "text-orange-400",
  },
];

export default function GreeksTable({ result, type }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {metrics.map(({ key, label, format, desc, color }) => {
        const val = result[key as keyof BSResult] as number;
        return (
          <div
            key={key}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-1"
          >
            <span className="text-xs text-zinc-500 font-mono">{label}</span>
            <span className={`text-xl font-semibold font-mono ${color}`}>
              {format(val)}
            </span>
            <span className="text-xs text-zinc-600">{desc}</span>
          </div>
        );
      })}
    </div>
  );
}
