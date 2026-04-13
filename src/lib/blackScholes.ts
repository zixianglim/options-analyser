function cdf(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const t = 1.0 / (1.0 + p * Math.abs(x));
  const poly = t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))));
  return 0.5 * (1.0 + sign * (1.0 - poly * Math.exp(-x * x)));
}

function pdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

export interface BSInputs {
  S: number;
  K: number;
  T: number;
  r: number;
  sigma: number;
  type: "call" | "put";
}

export interface BSResult {
  price: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  d1: number;
  d2: number;
}

export function blackScholes(inputs: BSInputs): BSResult {
  const { S, K, T, r, sigma, type } = inputs;
  if (T <= 0 || sigma <= 0 || S <= 0 || K <= 0) {
    const intrinsic = type === "call" ? Math.max(S - K, 0) : Math.max(K - S, 0);
    return { price: intrinsic, delta: intrinsic > 0 ? (type === "call" ? 1 : -1) : 0, gamma: 0, theta: 0, vega: 0, rho: 0, d1: 0, d2: 0 };
  }
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  let price: number, delta: number, rho: number;
  if (type === "call") {
    price = S * cdf(d1) - K * Math.exp(-r * T) * cdf(d2);
    delta = cdf(d1);
    rho = K * T * Math.exp(-r * T) * cdf(d2) * 0.01;
  } else {
    price = K * Math.exp(-r * T) * cdf(-d2) - S * cdf(-d1);
    delta = cdf(d1) - 1;
    rho = -K * T * Math.exp(-r * T) * cdf(-d2) * 0.01;
  }
  const gamma = pdf(d1) / (S * sigma * sqrtT);
  const theta = (-(S * pdf(d1) * sigma) / (2 * sqrtT) -
    (type === "call"
      ? r * K * Math.exp(-r * T) * cdf(d2)
      : -r * K * Math.exp(-r * T) * cdf(-d2))) / 365;
  const vega = S * pdf(d1) * sqrtT * 0.01;
  return { price, delta, gamma, theta, vega, rho, d1, d2 };
}

export interface PayoffPoint {
  S: number;
  expiry: number;
  tZero: number;
  tHalf: number;
}

export function generatePayoffData(inputs: BSInputs, entryPrice: number, numPoints = 120): PayoffPoint[] {
  const { S } = inputs;
  const low = S * 0.75, high = S * 1.25;
  const step = (high - low) / numPoints;
  return Array.from({ length: numPoints + 1 }, (_, i) => {
    const price = low + i * step;
    const expiry = (inputs.type === "call"
      ? Math.max(price - inputs.K, 0)
      : Math.max(inputs.K - price, 0)) - entryPrice;
    const tZero = blackScholes({ ...inputs, S: price }).price - entryPrice;
    const tHalf = blackScholes({ ...inputs, S: price, T: Math.max(inputs.T / 2, 0.0001) }).price - entryPrice;
    return {
      S: parseFloat(price.toFixed(2)),
      expiry: parseFloat(expiry.toFixed(3)),
      tZero: parseFloat(tZero.toFixed(3)),
      tHalf: parseFloat(tHalf.toFixed(3)),
    };
  });
}

export function calcBreakevens(inputs: BSInputs, entryPrice: number) {
  return inputs.type === "call"
    ? { lower: null, upper: inputs.K + entryPrice }
    : { lower: inputs.K - entryPrice, upper: null };
}
