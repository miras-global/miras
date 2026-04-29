export const dynamic = "force-static";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learn More — Trustless Crypto Inheritance | Miras",
  description: "How Miras works: Safe multisig, verifiers, waiting period, and policy options for non-custodial on-chain inheritance of Bitcoin and Ethereum.",
  keywords: [
    "how it works",
    "crypto inheritance",
    "trustless inheritance",
    "safe multisig",
    "2-of-3 multisig",
    "verifiers",
    "waiting period",
    "death certificate",
    "bitcoin",
    "ethereum",
    "wBTC",
    "tBTC",
    "web3 estate planning",
    "on-chain will",
    "miras"
  ],
  alternates: {
    canonical: "/learn-more",
  },
  openGraph: {
    url: "/learn-more",
  },
};

const STEPS = [
  {
    icon: "bi-shield-lock",
    title: "Create a threshold multi-sig",
    body: (
      <>
        <p>
          Default <strong>2-of-3</strong> (configurable). You generate three keys —
          <strong> Key A</strong> stays with you, <strong>Key B</strong> is for your heir, and
          <strong> Key C</strong> is encrypted on your device and escrowed by the protocol
          <em> (the protocol never sees the plaintext).</em>
        </p>
        <div className="note">
          While alive, you control all three keys. After distribution and escrow, no single
          party — heir or protocol — can move funds alone.
        </div>
      </>
    ),
  },
  {
    icon: "bi-person-check",
    title: "Your heir initiates a claim",
    body: (
      <>
        <p>
          When the time comes, your heir starts a claim on the protocol. A staked
          <strong> verifier pool</strong> is randomly selected and assigned.
        </p>
        <div className="note">Verifiers have funds at risk and are slashable for bad behavior.</div>
      </>
    ),
  },
  {
    icon: "bi-hourglass-split",
    title: "Waiting & verification",
    body: (
      <>
        <p>
          A <strong>waiting period</strong> begins — default <strong>3 months</strong>, configurable longer.
          Verifiers must contact you to confirm you’re alive. Optional extra evidence such as a
          <strong> death certificate</strong> can be required.
        </p>
        <div className="note">If you confirm you’re alive on-chain, the claim is canceled.</div>
      </>
    ),
  },
  {
    icon: "bi-check2-circle",
    title: "Automatic release",
    body: (
      <>
        <p>
          If the waiting period elapses without objection and conditions are met, the protocol enables
          a valid <strong>2-of-3</strong> path for your heir to receive the assets.
        </p>
        <div className="note">Funds move only when quorum is satisfied. No party can bypass policy.</div>
      </>
    ),
  },
  {
    icon: "bi-usb-drive",
    title: "Heir Readiness Kit (offline)",
    body: (
      <>
        <p>
          Step-by-step instructions to prepare a <strong>USB disk</strong> for your heir
          (wallet app, public info, recovery guides). Private keys are never stored unencrypted.
        </p>
      </>
    ),
  },
];

const FAQS: { q: string; a: React.ReactNode }[] = [
  { q: "What if I’m alive and someone files a claim?",
    a: "You submit a simple on-chain objection (or respond to verifier outreach). The claim is canceled and funds remain in place." },
  { q: "Can anyone see my keys or move funds without me?",
    a: "No. The protocol only holds an encrypted key. Neither the protocol, a company, nor an individual can meet quorum alone." },
  { q: "Do I have to use 2-of-3?",
    a: "No. You can choose higher thresholds (e.g., 3-of-5) or multiple heirs. The same trustless rules apply." },
  { q: "Can I require a death certificate?",
    a: "Yes. You can make release conditions stricter by requiring documents such as a death certificate in addition to the waiting period and verifier checks." },
  { q: "Do you generate private keys, and is the code open-source?",
    a: <>This app may generate private keys for heirs and the protocol-related escrow key entirely <strong>client-side</strong> in your browser. All cryptographic operations occur locally; plaintext keys are never transmitted. The codebase is <strong>open-source</strong> for transparency and auditability.</> },
  { q: "What smart contracts secure the funds?",
    a: <>We use <a href="https://safe.global/" target="_blank" rel="noopener">Safe</a> (formerly Gnosis Safe), a widely adopted and <strong>well-audited</strong> multisig smart contract system. Learn more in the <a href="https://docs.safe.global/" target="_blank" rel="noopener">Safe documentation</a>.</> },
  { q: "How can I include Bitcoin (BTC)?",
    a: (
      <>
        To bring BTC into an EVM policy, use an ERC-20 representation:
        <ul className="mt-2 mb-0">
          <li><strong>wBTC</strong> — <a href="https://wbtc.network/" target="_blank" rel="noopener">Wrapped Bitcoin</a> (custodial): BTC is held by a custodian; you receive ERC-20 wBTC on Ethereum.</li>
          <li><strong>tBTC</strong> — <a href="https://threshold.network/tbtc" target="_blank" rel="noopener">tBTC</a> (trustless): a decentralized bridge mints ERC-20 tBTC backed by BTC without a single custodian.</li>
        </ul>
      </>
    )
  },
  { q: "How do I handle multiple heirs or different asset bundles?",
    a: (
      <>
        For clarity and security, create a <strong>separate Safe</strong> per heir or asset bundle. This isolates risk,
        lets you customize thresholds per heir, and simplifies execution.
      </>
    )
  },
  { q: "Will my information and assets be publicly visible?",
    a: "No. Only the attestors you assign can decrypt your contact details and Safe address. The public sees only encrypted blobs on-chain." },
];

export default function LearnMorePage(){
  return (
    <>
      {/* Hero */}
      <section className="hero-gradient">
        <div className="container">
          <div className="row align-items-end g-4">
            <div className="col-lg-8">
              <span className="kicker"><i className="bi bi-stars"></i> How it works</span>
              <h1 className="display-5 mt-3 mb-3">
                Trustless inheritance,<br/>
                <span className="text-gradient">enforced on-chain.</span>
              </h1>
              <p className="lead mb-0">
                Pass on Bitcoin and Ethereum to your family — no lawyers, no custodians, no middlemen.
                Secure, automated estate planning for crypto.
              </p>
            </div>
            <div className="col-lg-4 text-lg-end">
              <a href="/get-started" className="btn btn-primary btn-lg">
                Get started <i className="bi bi-arrow-right ms-1"></i>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section>
        <div className="container">
          <div className="row mb-4 align-items-end">
            <div className="col-lg-8">
              <h2 className="section-title">How it works</h2>
              <p className="text-muted mt-2 mb-0">
                Every step is enforced by smart contracts. No custodian, no company, no individual can move funds alone.
              </p>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-lg-7">
              <div className="timeline">
                {STEPS.map((s, i) => (
                  <div key={s.title} className="step">
                    <div className="step-badge"><i className={`bi ${s.icon}`}></i></div>
                    <div>
                      <h5>
                        <span className="me-2 text-muted" style={{fontWeight:500}}>0{i+1}</span>
                        {s.title}
                      </h5>
                      {s.body}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-lg-5">
              {/* Security Model */}
              <div className="card card-glow mb-3">
                <div className="card-body">
                  <h5 className="card-title mb-3">
                    <i className="bi bi-shield-check me-2" style={{color:'var(--brand)'}}></i>Security model
                  </h5>
                  <ul className="list-unstyled mb-0">
                    <li className="mb-2"><strong>Trustless:</strong> Keys, policies, and claims enforced by smart contracts.</li>
                    <li className="mb-2"><strong>Key privacy:</strong> Protocol stores only an encrypted key (never usable alone).</li>
                    <li className="mb-2"><strong>Quorum required:</strong> No single party can move funds unilaterally.</li>
                    <li className="mb-2"><strong>Incentive aligned:</strong> Verifiers are staked and slashable.</li>
                    <li><strong>Auditability:</strong> All actions are visible on-chain, personal data stays off-chain.</li>
                  </ul>
                </div>
              </div>

              <div className="card mb-3">
                <div className="card-body">
                  <h5 className="card-title mb-3">
                    <i className="bi bi-sliders me-2" style={{color:'var(--brand-violet)'}}></i>Policy options
                  </h5>
                  <ul className="list-unstyled mb-0">
                    <li className="mb-2">Waiting period: <strong>3+ months</strong> (configurable).</li>
                    <li className="mb-2">Extra documents: <strong>death certificate</strong>, notarized proof, etc.</li>
                    <li>Multi-heir, multi-jurisdiction, and higher quorums (e.g., <strong>3-of-5</strong>).</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{paddingTop:0}}>
        <div className="container">
          <div className="row mb-4">
            <div className="col-lg-8">
              <h2 className="section-title">Frequently asked</h2>
              <p className="text-muted mt-2 mb-0">Questions we hear most often.</p>
            </div>
          </div>
          <div className="row g-3">
            <div className="col-12">
              <div className="accordion" id="faqAccordion">
                {FAQS.map((f, i) => {
                  const id = `faq${i}`;
                  return (
                    <div className="accordion-item" key={id}>
                      <h3 className="accordion-header" id={`${id}h`}>
                        <button
                          className="accordion-button collapsed"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target={`#${id}`}
                          aria-expanded="false"
                          aria-controls={id}
                        >
                          {f.q}
                        </button>
                      </h3>
                      <div id={id} className="accordion-collapse collapse" aria-labelledby={`${id}h`} data-bs-parent="#faqAccordion">
                        <div className="accordion-body">{f.a}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{paddingTop:0}}>
        <div className="container">
          <div className="card card-glow" style={{padding:'2rem'}}>
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
              <div>
                <h3 className="mb-1">Ready to plan your crypto estate?</h3>
                <p className="text-muted mb-0">Set up trustless inheritance in minutes — no signups, no custodians.</p>
              </div>
              <div className="d-flex gap-2 flex-wrap">
                <a className="btn btn-primary" href="/get-started">Get started</a>
                <a className="btn btn-outline-secondary" href="/pricing">See pricing</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
