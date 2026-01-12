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
                      Choose dead man&apos;s switch, quorum (e.g., 2-of-3), waiting period, and documents required.
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
          

 

          {/* Choose Your Model */}
          <section className="mb-5">
            <h2 className="fw-bold section-title mb-4">Choose Your Inheritance Model</h2>
            <p className="text-muted mb-4">
              Miras offers two different approaches to crypto inheritance. Choose the one that best fits your needs.
            </p>
            <div className="row g-4">
              <div className="col-lg-6">
                <div className="card h-100 border-primary">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0"><i className="bi bi-people me-2"></i>Attester Model</h5>
                  </div>
                  <div className="card-body">
                    <p className="text-muted mb-3">
                      A decentralized verification system where staked attesters verify inheritance claims. This model provides strong security through multi-party verification and configurable waiting periods.
                    </p>
                    <h6 className="fw-bold">Best for:</h6>
                    <ul className="text-muted mb-3">
                      <li>Large estates requiring maximum security</li>
                      <li>Users who want third-party verification of death</li>
                      <li>Complex inheritance scenarios with multiple heirs</li>
                    </ul>
                    <h6 className="fw-bold">How it works:</h6>
                    <ul className="text-muted mb-3">
                      <li>Create a 2-of-3 multisig Safe wallet</li>
                      <li>Attesters verify claims and contact you before releasing funds</li>
                      <li>Configurable waiting period (default 90 days)</li>
                      <li>You can cancel claims if you&apos;re still alive</li>
                    </ul>
                    <div className="d-grid gap-2">
                      <Link href="/launch" className="btn btn-primary btn-lg">
                        <i className="bi bi-plug me-2"></i>Launch with Attesters
                      </Link>
                      <Link href="/launch-manual" className="btn btn-outline-primary btn-sm">
                        Manual Setup (existing Safe)
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card h-100 border-success">
                  <div className="card-header bg-success text-white">
                    <h5 className="mb-0"><i className="bi bi-clock-history me-2"></i>Dead Man&apos;s Switch</h5>
                  </div>
                  <div className="card-body">
                    <p className="text-muted mb-3">
                      A simple time-based inheritance contract. If you don&apos;t interact with the contract for 1 year, your heir can automatically withdraw all funds. No attesters or third parties involved.
                    </p>
                    <h6 className="fw-bold">Best for:</h6>
                    <ul className="text-muted mb-3">
                      <li>Simple, single-heir inheritance</li>
                      <li>Users who prefer fully automated solutions</li>
                      <li>Smaller amounts or backup inheritance plans</li>
                    </ul>
                    <h6 className="fw-bold">How it works:</h6>
                    <ul className="text-muted mb-3">
                      <li>Deploy a simple smart contract with your heir&apos;s address</li>
                      <li>Send ETH to the contract to fund it</li>
                      <li>Any transfer resets the 1-year timer</li>
                      <li>After 1 year of inactivity, heir can withdraw everything</li>
                    </ul>
                    <div className="d-grid">
                      <Link href="/switch" className="btn btn-success btn-lg">
                        <i className="bi bi-clock-history me-2"></i>Launch Dead Man&apos;s Switch
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Comparison Table */}
          <section className="mb-5">
            <h2 className="fw-bold section-title mb-4">Model Comparison</h2>
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>Feature</th>
                    <th>Attester Model</th>
                    <th>Dead Man&apos;s Switch</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Verification</strong></td>
                    <td>Third-party attesters verify death</td>
                    <td>Automatic after 1 year of inactivity</td>
                  </tr>
                  <tr>
                    <td><strong>Security Level</strong></td>
                    <td>High (multi-party verification)</td>
                    <td>Medium (time-based only)</td>
                  </tr>
                  <tr>
                    <td><strong>Complexity</strong></td>
                    <td>More complex setup</td>
                    <td>Simple, single contract</td>
                  </tr>
                  <tr>
                    <td><strong>Cost</strong></td>
                    <td>Higher (Safe creation + attester fees)</td>
                    <td>Lower (single contract deployment)</td>
                  </tr>
                  <tr>
                    <td><strong>Cancellation</strong></td>
                    <td>Can cancel claims anytime</td>
                    <td>Reset timer by sending any transfer</td>
                  </tr>
                  <tr>
                    <td><strong>Multiple Heirs</strong></td>
                    <td>Supported (multiple Safes)</td>
                    <td>One heir per contract</td>
                  </tr>
                  <tr>
                    <td><strong>Waiting Period</strong></td>
                    <td>Configurable (default 90 days)</td>
                    <td>Fixed at 1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>


         {/* Setup Steps */}
          
          <section id="setup" className="mb-5">
            <h2 className="fw-bold section-title mb-4">Attester Model in 4 Steps</h2>
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
          


        </div>
      </main>
    </>
  );
}
