import type { Metadata } from "next";
import ExchangeClient from "./ExchangeClient";

export const metadata: Metadata = {
  title: "Simple Token ↔ ETH Exchange",
  description: "Static demo interface for a fixed price token exchange.",
};

export default function ExchangePage() {
  return <ExchangeClient />;
}
