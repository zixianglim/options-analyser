"use client";

import { useState } from "react";
import { blackScholes, BSInputs } from "@/lib/blackScholes";

export interface Leg {
  id: string;
  type: "call" | "put";
  direction: "long" | "short";
  strike: number;
  iv: number;
  dte: number;
  qty: number;
}

interface Props {
  spot: number;
  rate: number;
  onChange: (legs: Leg[]) => void;
}

const PRESETS: { label: string; legs: Omit<Leg, "id">[] }[] = [
  {
    label: "Long Call",
    legs: [{ type: "call", direction: "long", strike: 0, iv: 25, dte: 30, qty: 1 }],
  },
  {
    label: "Long Put",
    legs: [{ type: "put", direction: "long", strike: 0, iv: 25, dte: 30, qty: 1 }],
  },
  {
    label: "Bull Call Spread",
    legs: [
      { type: "call", direction: "long", strike: 0, iv: 25, dte: 30, qty: 1 },
      { type: "call", direction: "short", strike: 5, iv: 25, dte: 30, qty: 1 },
    ],
  },
  {
    label: "Straddle",
    legs: [
      { type: "call", direction: "long", strike: 0, iv: 25, dte: 30, qty: 1 },
      { type: "put", direction: "long", strike: 0, iv: 25, dte: 30, qty: 1 },
    ],
  },
  {
    label: "Iron Condor",
    legs: [
      { type: "put", direction: "long", strike: -10, iv: 25, dte: 30, qty: 1 },
      { type: "put", direction: "short", strike: -5, iv: 25, dte: 30, qty: 1 },
      { type: "call", direction: "short", strike: 5, iv: 25, dte: 30, qty: 1 },
      { type: "call", direction: "long", strike: 10, iv: 25, dte: 30, qty: 1 },
    ],
  },
];

function uid() {
  return Math.random().toString(36).slice(2, 8);
}

export default function MultiLegBuilder({ spot, rate, onChange }: Props) {
  const [legs, setLegs] = useState<Leg[]>([]);

  const update = (updated: Leg[]) => {
    setLegs(updated);
    onChange(updated);
  };

  const addLeg = () => {
    update([
      ...legs,
      {
        id: uid(),
        type: "call",
        direction: "long",
        strike: spot,
        iv: 25,
        dte: 30,
        qty: 1,
      },
    ]);
  };

  const removeLeg = (id: string) => update(legs.filter((l) => l.id !== id));

  const editLeg = (id: string, field: keyof Leg, value: any) => {
    update(legs.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    const newLegs = preset.legs.map((l) => ({
      ...l,
      id: uid(),
      strike: spot + l.strike,
    }));
    update(newLegs);
  };

  // Net greeks across all legs
  const netGreeks = legs.reduce(
    (acc, leg) => {
      const T = leg.dte / 365;
      const sigma = leg.iv / 100;
      const dir = leg.direction === "long" ? 1 : -1;
      const bs = blackScholes({ S: spot, K: leg.strike, T, r: rate / 100, sigma, type: leg.type });
      return {
        delta: acc.delta + dir * bs.delta * leg.qty,
        gamma: acc.gamma + dir * bs.gamma * leg.qty,
        theta: acc.theta + dir * bs.theta * leg.qty,
        vega: acc.vega + dir * bs.vega * leg.qty,
        cost: acc.cost + dir * bs.price * leg.qty,
      };
    },
    { delta: 0, gamma: 0, theta: 0, vega: 0, cost: 0 }
  );

  return (
    <div className="space-y-4">
      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p)}
            className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:border-violet-500 hover:text-violet-400 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Legs */}
      {legs.length === 0 && (
        <p className="text-zinc-600 text-sm italic">No legs added. Pick a preset or add manually.</p>
      )}

      {legs.map((leg, i) => (
        <div key={leg.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-500">Leg {i + 1}</span>
            <button
              onClick={() => removeLeg(leg.id)}
              className="text-xs text-zinc-600 hover:text-red-400 transition-colors"
            >
              remove
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500">Type</label>
              <select
                value={leg.type}
                onChange={(e) => editLeg(leg.id, "type", e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-violet-500"
              >
                <option value="call">Call</option>
                <option value="put">Put</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500">Direction</label>
              <select
                value={leg.direction}
                onChange={(e) => editLeg(leg.id, "direction", e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-violet-500"
              >
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500">Strike ($)</label>
              <input
                type="number"
                value={leg.strike}
                onChange={(e) => editLeg(leg.id, "strike", parseFloat(e.target.value))}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500">IV (%)</label>
              <input
                type="number"
                value={leg.iv}
                onChange={(e) => editLeg(leg.id, "iv", parseFloat(e.target.value))}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500">DTE</label>
              <input
                type="number"
                value={leg.dte}
                onChange={(e) => editLeg(leg.id, "dte", parseInt(e.target.value))}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500">Qty</label>
              <input
                type="number"
                value={leg.qty}
                min={1}
                onChange={(e) => editLeg(leg.id, "qty", parseInt(e.target.value))}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={addLeg}
        className="w-full py-2 border border-dashed border-zinc-700 rounded-xl text-sm text-zinc-500 hover:border-violet-500 hover:text-violet-400 transition-colors"
      >
        + add leg
      </button>

      {/* Net greeks summary */}
      {legs.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 mb-3 font-mono">Net position greeks</p>
          <div className="grid grid-cols-5 gap-3 text-center">
            {[
              { label: "Net cost", val: `$${netGreeks.cost.toFixed(3)}`, color: "text-emerald-400" },
              { label: "Net Δ", val: netGreeks.delta.toFixed(4), color: "text-sky-400" },
              { label: "Net Γ", val: netGreeks.gamma.toFixed(6), color: "text-violet-400" },
              { label: "Net Θ/day", val: netGreeks.theta.toFixed(4), color: "text-amber-400" },
              { label: "Net V", val: netGreeks.vega.toFixed(4), color: "text-pink-400" },
            ].map(({ label, val, color }) => (
              <div key={label}>
                <p className="text-xs text-zinc-600 mb-1">{label}</p>
                <p className={`text-sm font-mono font-semibold ${color}`}>{val}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
