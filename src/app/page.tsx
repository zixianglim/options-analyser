import OptionsAnalyser from "@/components/OptionsAnalyser";

export const metadata = {
  title: "OptionsIQ — Professional Options Analyser",
  description: "Real-time Black-Scholes options pricing, greeks, payoff diagrams and option chain for US equities.",
};

export default function Home() {
  return <OptionsAnalyser />;
}
