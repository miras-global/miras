import Image from "next/image";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Miras — Trustless Crypto Inheritance",
  description: "Trustless, non-custodial crypto inheritance using Safe multisig and verifiers. Plan your estate for Bitcoin and Ethereum without custodians.",
  keywords: [
    "crypto inheritance",
    "trustless inheritance",
    "non-custodial",
    "multisig",
    "2-of-3",
    "bitcoin",
    "ethereum",
    "web3 estate planning",
    "on-chain will",
    "miras"
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
  },
};

export default function HomePage(){
  const year = new Date().getFullYear();
  return (
    <>
      <section className="landing-hero">
        <div className="container-xl">
          <div className="row align-items-center g-5">
            {/* Left copy */}
            <div className="col-12 col-lg-6 order-2 order-lg-1">
              <div className="mb-4 d-flex gap-2 flex-wrap">
                <span className="badge-chip">Trustless • Non‑custodial</span>
                <span className="badge-chip">Safe Multisig • On‑chain</span>
                <span className="badge-chip">BTC &amp; ETH Ready</span>
              </div>
              <h1 className="display-4 fw-semibold mb-3">
                Death happens.<br/>
                <span className="text-white-50">Be ready.</span>
              </h1>
              <p className="lead mb-4">Trustless inheritance for your crypto — no lawyers, no custodians. You keep control while you’re alive; your heir can’t move funds alone; the protocol can’t either.</p>

              <ul className="list-unstyled mb-4 small text-white-50">
                <li className="mb-2">• <strong>2‑of‑3 Safe</strong>: You hold Key A; you hand Key B to your heir; Key C is <em>encrypted</em> and escrowed by the protocol (never usable alone).</li>
                <li className="mb-2">• <strong>Staked verifiers</strong>: Randomly selected, slashable for misconduct; they must reach you to confirm status.</li>
                <li className="mb-2">• <strong>Waiting period</strong>: Default <strong>3 months</strong> (configurable). Your <strong>on‑chain objection cancels</strong> any claim.</li>
                <li className="mb-2">• <strong>Automatic release</strong>: If conditions are met, the policy enables the valid quorum path; funds move only with required signatures.</li>
                <li className="mb-0">• <strong>Heir Readiness Kit</strong>: Optional offline USB guide; keys never stored in plaintext.</li>
              </ul>

              <div className="d-flex flex-wrap gap-3">
                <a href="/get-started" className="btn btn-light px-4 py-2 fw-semibold">Get Started</a>
                <a href="/learn-more" className="btn btn-outline-secondary px-4 py-2">Learn more</a>
              </div>
            </div>

            {/* Right art */}
            <div className="col-12 col-lg-6 order-1 order-lg-2">
              <div className="position-relative mx-auto" style={{maxWidth: "640px"}}>
                <Image src="/reaper.png" alt="Hooded reaper with scythe illustration" className="w-100 h-auto" style={{maxHeight: "72vh", objectFit: "contain", filter: "drop-shadow(0 24px 60px rgba(0,0,0,.65)) brightness(1.04) contrast(1.06)"}} width={640} height={800} unoptimized />
              </div>
            </div>
          </div>

          {/* Footer line */}
          <div className="mt-5 footer-line"></div>
          <div className="py-3 small text-white-50 d-flex flex-wrap gap-3">
            <span>© {year} miras.global </span>
            <span className="ms-auto">Security‑audited • Non‑custodial • Self‑sovereign</span>
          </div>
        </div>
      </section>
    </>
  );
}
