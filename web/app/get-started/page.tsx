export const dynamic = "force-static";

import Link from "next/link";

export default function GetStartedPage() {
  return (
    <>
      {/* Header (hero) */}
      <header className="hero-gradient text-white py-5">
        <div className="container py-3">
          <div className="row align-items-center g-4">
            <div className="col-lg-8">
              <h1 className="display-5 fw-bold mb-2">Get Started</h1>
              <p className="lead mb-0 text-white-50">
                Set up trustless inheritance for your Bitcoin/Ethereum in minutes.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="py-5">
        <div className="container">
          {/* Requirements */}
          <section className="mb-5">
            <h2 className="fw-bold section-title mb-4">What You Need</h2>
            <div className="row g-4">
              <div className="col-md-4">
                <div className="card h-100">
                  <div className="card-body">
                    <div className="step-badge mb-3">1</div>
                    <h5 className="card-title">A Secure Wallet</h5>
                    <p className="text-muted mb-0">
                      Hardware or multi-sig-capable wallet for generating keys safely.
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card h-100">
                  <div className="card-body">
                    <div className="step-badge mb-3">2</div>
                    <h5 className="card-title">Heir Contact</h5>
                    <p className="text-muted mb-0">
                      Heir’s public contact for verification and claim initiation.
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card h-100">
                  <div className="card-body">
                    <div className="step-badge mb-3">3</div>
                    <h5 className="card-title">Your Policy</h5>
                    <p className="text-muted mb-0">
                      Choose quorum (e.g., 2-of-3), waiting period, and documents required.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Packages explainer */}
          <section className="mb-5">
            <div className="card border-0 p-4 p-md-5">
              <div className="card-body">
                <div className="d-flex align-items-start gap-3">
                  <div className="step-badge flex-shrink-0">ℹ️</div>
                  <div>
                    <h3 className="fw-bold mb-2">
                      Packages: One Safe per Heir or Asset Bundle
                    </h3>
                    <p className="text-muted mb-3">
                      For clarity and security, create a separate Safe (multisig wallet) for each heir or distinct group of assets (“packages”). This isolates risk, lets you customize thresholds/owners per package, and makes execution simpler.
                    </p>

                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Setup Steps */}
          <section id="setup" className="mb-5">
            <h2 className="fw-bold section-title mb-4">Set Up in 5 Steps</h2>
            <div className="row g-4">
              <div className="col-lg-6">
                <div className="card h-100">
                  <div className="card-body">
                    <span className="step-badge mb-3">1</span>
                    <h5 className="card-title">Generate Keys</h5>
                    <p className="text-muted mb-0">
                      Create a threshold multi-sig (e.g., 2-of-3). Retain Key A, plan to give Key B to your heir, and encrypt Key C for protocol escrow.
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card h-100">
                  <div className="card-body">
                    <span className="step-badge mb-3">2</span>
                    <h5 className="card-title">Configure Policy</h5>
                    <p className="text-muted mb-0">
                      Set waiting period, required evidence (e.g., death certificate), and escalation rules.
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card h-100">
                  <div className="card-body">
                    <span className="step-badge mb-3">3</span>
                    <h5 className="card-title">Encrypt & Escrow</h5>
                    <p className="text-muted mb-0">
                      Encrypt Key C locally. Only the ciphertext is stored; plaintext is never shared.
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card h-100">
                  <div className="card-body">
                    <span className="step-badge mb-3">4</span>
                    <h5 className="card-title">Prepare Heir Kit</h5>
                    <p className="text-muted mb-0">
                      Assemble the USB kit with wallet app, public info, and guidance—never store private keys unencrypted.
                    </p>
                  </div>
                </div>
              </div>
              
            </div>
          </section>

          {/* CTA */}
          <section className="text-center">
            <div className="card border-0 p-4 p-md-5">
              <div className="card-body">
                <h3 className="fw-bold mb-2">Ready to Begin?</h3>
                <p className="text-muted mb-4">
                  Follow the steps above to configure your trustless inheritance policy.
                </p>  
                <Link href="/launch" className="btn btn-success btn-lg px-4">
                  <i className="bi bi-plug"></i> Launch Setup
                </Link>
                <br />
                <br />
                <p><Link href="/launch-manual" className="btn btn-outline-success btn-sm px-4">If your key is already configured (e.g., in Safe or a multisig setup), you can add a new signatory to the protocol — only select this if you’re confident in what you’re doing.</Link></p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
