export const dynamic = "force-static";

import Link from "next/link";

const REQUIREMENTS = [
  {
    icon: "bi-wallet2",
    n: "01",
    title: "A secure wallet",
    body: "Hardware or multi-sig-capable wallet for generating keys safely.",
  },
  {
    icon: "bi-person-lines-fill",
    n: "02",
    title: "Heir contact",
    body: "Heir’s public contact for verification and claim initiation.",
  },
  {
    icon: "bi-sliders2",
    n: "03",
    title: "Your policy",
    body: "Choose dead man’s switch, quorum (e.g., 2-of-3), waiting period, and required evidence.",
  },
];

const ATTESTER_STEPS = [
  { n: 1, title: "Generate keys",   body: "Create a threshold multi-sig (e.g., 2-of-3). Retain Key A, give Key B to your heir, and encrypt Key C for protocol escrow." },
  { n: 2, title: "Configure policy", body: "Set waiting period, required evidence (e.g., death certificate), and escalation rules." },
  { n: 3, title: "Encrypt & escrow", body: "Encrypt Key C locally. Only the ciphertext is stored; plaintext is never shared." },
  { n: 4, title: "Prepare heir kit", body: "Assemble the USB kit with wallet app, public info, and guidance — never store private keys unencrypted." },
];

export default function GetStartedPage() {
  return (
    <>
      {/* Hero */}
      <section className="hero-gradient">
        <div className="container">
          <div className="row align-items-end g-4">
            <div className="col-lg-8">
              <span className="kicker"><i className="bi bi-rocket-takeoff"></i> Get started</span>
              <h1 className="display-5 mt-3 mb-3">
                Set up trustless inheritance<br/>
                <span className="text-gradient">in minutes.</span>
              </h1>
              <p className="lead mb-0">
                Choose your model, configure policy, and prepare your heir — all without lawyers or custodians.
              </p>
            </div>
            <div className="col-lg-4 text-lg-end">
              <a href="#models" className="btn btn-primary btn-lg">
                Choose a model <i className="bi bi-arrow-down ms-1"></i>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section>
        <div className="container">
          <div className="row mb-4">
            <div className="col-lg-8">
              <h2 className="section-title">What you need</h2>
              <p className="text-muted mt-2 mb-0">Three small ingredients before you launch.</p>
            </div>
          </div>
          <div className="row g-3">
            {REQUIREMENTS.map((r) => (
              <div className="col-md-4" key={r.title}>
                <div className="card h-100">
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div className="step-badge"><i className={`bi ${r.icon}`}></i></div>
                      <span className="text-muted" style={{fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize:'.78rem', letterSpacing:'.08em'}}>{r.n}</span>
                    </div>
                    <h5 className="card-title">{r.title}</h5>
                    <p className="text-muted mb-0">{r.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages explainer */}
      <section style={{paddingTop:0}}>
        <div className="container">
          <div className="card card-glow">
            <div className="card-body" style={{padding:'2rem'}}>
              <div className="d-flex align-items-start gap-3">
                <div className="step-badge flex-shrink-0"><i className="bi bi-boxes"></i></div>
                <div>
                  <h3 className="mb-2">Packages — one Safe per heir or asset bundle</h3>
                  <p className="text-muted mb-0">
                    For clarity and security, create a separate Safe (multisig wallet) for each heir or distinct group of
                    assets. This isolates risk, lets you customize thresholds and owners per package, and makes execution simpler.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Choose Your Model */}
      <section id="models" style={{paddingTop:0}}>
        <div className="container">
          <div className="row mb-4 align-items-end">
            <div className="col-lg-8">
              <h2 className="section-title">Choose your inheritance model</h2>
              <p className="text-muted mt-2 mb-0">Two complementary approaches. Pick the one that fits your situation.</p>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-lg-6">
              <div className="card card-glow h-100 d-flex flex-column">
                <div className="card-header">
                  <i className="bi bi-people me-2" style={{color:'var(--brand)'}}></i>Attester Model
                </div>
                <div className="card-body d-flex flex-column">
                  <p className="text-muted mb-3">
                    Decentralized verification by staked attesters. Strong security through multi-party verification and a configurable waiting period.
                  </p>
                  <h6 className="text-uppercase" style={{letterSpacing:'.1em', fontSize:'.78rem', color:'var(--muted)'}}>Best for</h6>
                  <ul className="text-muted mb-3">
                    <li>Large estates requiring maximum security</li>
                    <li>Users who want third-party verification of death</li>
                    <li>Complex inheritance scenarios with multiple heirs</li>
                  </ul>
                  <h6 className="text-uppercase" style={{letterSpacing:'.1em', fontSize:'.78rem', color:'var(--muted)'}}>How it works</h6>
                  <ul className="text-muted mb-4">
                    <li>Create a 2-of-3 multisig Safe wallet</li>
                    <li>Attesters verify claims and contact you before releasing funds</li>
                    <li>Configurable waiting period (default 90 days)</li>
                    <li>You can cancel claims if you&apos;re still alive</li>
                  </ul>
                  <div className="d-grid gap-2 mt-auto">
                    <Link href="/launch" className="btn btn-primary btn-lg">
                      <i className="bi bi-plug me-2"></i>Launch with Attesters
                    </Link>
                    <Link href="/launch-manual" className="btn btn-outline-secondary btn-sm">
                      Manual setup (existing Safe)
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card h-100 d-flex flex-column">
                <div className="card-header" style={{background:'linear-gradient(135deg, #5ddca4 0%, #58c6e6 100%)', color:'#0b0b0e'}}>
                  <i className="bi bi-clock-history me-2"></i>Dead Man&apos;s Switch
                </div>
                <div className="card-body d-flex flex-column">
                  <p className="text-muted mb-3">
                    A simple time-based contract. If you don&apos;t interact for 1 year, your heir can automatically withdraw all funds. No third parties involved.
                  </p>
                  <h6 className="text-uppercase" style={{letterSpacing:'.1em', fontSize:'.78rem', color:'var(--muted)'}}>Best for</h6>
                  <ul className="text-muted mb-3">
                    <li>Simple, single-heir inheritance</li>
                    <li>Users who prefer fully automated solutions</li>
                    <li>Smaller amounts or backup inheritance plans</li>
                  </ul>
                  <h6 className="text-uppercase" style={{letterSpacing:'.1em', fontSize:'.78rem', color:'var(--muted)'}}>How it works</h6>
                  <ul className="text-muted mb-4">
                    <li>Deploy a simple smart contract with your heir&apos;s address</li>
                    <li>Send ETH to the contract to fund it</li>
                    <li>Any transfer resets the 1-year timer</li>
                    <li>After 1 year of inactivity, heir can withdraw everything</li>
                  </ul>
                  <div className="d-grid mt-auto">
                    <Link href="/switch" className="btn btn-success btn-lg">
                      <i className="bi bi-clock-history me-2"></i>Launch Dead Man&apos;s Switch
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section style={{paddingTop:0}}>
        <div className="container">
          <div className="row mb-4">
            <div className="col-lg-8">
              <h2 className="section-title">Model comparison</h2>
              <p className="text-muted mt-2 mb-0">At a glance.</p>
            </div>
          </div>

          <div className="compare-grid">
            <div className="head">Feature</div>
            <div className="head">Attester Model</div>
            <div className="head">Dead Man&apos;s Switch</div>

            <div>Verification</div>
            <div>Third-party attesters verify death</div>
            <div>Automatic after 1 year of inactivity</div>

            <div>Security level</div>
            <div>High (multi-party verification)</div>
            <div>Medium (time-based only)</div>

            <div>Complexity</div>
            <div>More complex setup</div>
            <div>Simple, single contract</div>

            <div>Cost</div>
            <div>Higher (Safe creation + attester fees)</div>
            <div>Lower (single contract deployment)</div>

            <div>Cancellation</div>
            <div>Can cancel claims anytime</div>
            <div>Reset timer by sending any transfer</div>

            <div>Multiple heirs</div>
            <div>Supported (multiple Safes)</div>
            <div>One heir per contract</div>

            <div>Waiting period</div>
            <div>Configurable (default 90 days)</div>
            <div>Fixed at 1 year</div>
          </div>
        </div>
      </section>

      {/* Setup steps */}
      <section id="setup" style={{paddingTop:0}}>
        <div className="container">
          <div className="row mb-4">
            <div className="col-lg-8">
              <h2 className="section-title">Attester model in 4 steps</h2>
              <p className="text-muted mt-2 mb-0">A quick map of the path you&apos;ll walk through.</p>
            </div>
          </div>

          <div className="row g-3">
            {ATTESTER_STEPS.map((s) => (
              <div className="col-lg-6" key={s.n}>
                <div className="card h-100">
                  <div className="card-body">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <span className="step-badge">{s.n}</span>
                      <h5 className="card-title mb-0">{s.title}</h5>
                    </div>
                    <p className="text-muted mb-0">{s.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
