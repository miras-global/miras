import "./globals.css";
import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import '@rainbow-me/rainbowkit/styles.css';
import BootstrapClient from "@/components/BootstrapClient";
import RouteContainer from "@/components/RouteContainer";
import LayoutChrome from "@/components/LayoutChrome";
import { Providers } from "./providers";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Miras",
  description: "Trustless inheritance and claims with attesters and validators",
  keywords: [
    "Miras",
    "crypto inheritance",
    "bitcoin inheritance",
    "ethereum inheritance",
    "on-chain inheritance",
    "decentralized inheritance",
    "trustless inheritance",
    "estate planning",
    "non-custodial",
    "multisig",
    "2-of-3 multisig",
    "Safe",
    "Gnosis Safe",
    "verifiers",
    "attesters",
    "web3 estate",
    "on-chain will",
    "inheritance protocol"
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://miras.global"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: "Miras — Trustless Crypto Inheritance",
    description: "Trustless inheritance for your crypto — Safe multisig, staked verifiers, and configurable waiting period.",
    url: "/",
    siteName: "Miras",
    images: [
      {
        url: "/reaper.png",
        width: 1200,
        height: 630,
        alt: "Miras — Trustless Crypto Inheritance",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Miras — Trustless Crypto Inheritance",
    description: "Non-custodial, on-chain estate planning using Safe multisig and verifiers.",
    images: ["/reaper.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Privacy-friendly analytics by Plausible */}
        <Script
          async
          src={process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || ""}
        />
        <Script id="plausible-init" strategy="afterInteractive">{`
  window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
  plausible.init()
        `}</Script>
      </head>
      <body>
        <Providers>
          <BootstrapClient />
          <LayoutChrome>
            <RouteContainer>
              {children}
            </RouteContainer>
          </LayoutChrome>
        </Providers>
      </body>
    </html>
  );
}

