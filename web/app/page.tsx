import type { Metadata } from "next";
import LearnMorePage from "./learn-more/page";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Miras — Trustless Crypto Inheritance",
  description:
    "How Miras works: Safe multisig, verifiers, waiting period, and policy options for non-custodial on-chain inheritance of Bitcoin and Ethereum.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
  },
};

export default LearnMorePage;
