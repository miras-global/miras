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

export default function LearnMorePage(){
  return (
    <>
      {/* Hero */}
      <section className="hero-gradient text-white py-5">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-lg-8">
              <h1 className="display-5 fw-bold mb-3">Trustless Inheritance Solution</h1>
              <p className="lead mb-1">Pass On Your Bitcoin and Ethereum Assets to Your Family — No Lawyers, No Middlemen</p>
              <p className="text-white-50 mb-0">Secure, automated, and decentralized estate planning for crypto.</p>
            </div>
            <div className="col-lg-4 text-lg-end">
              <div className="d-grid gap-2 d-lg-inline-flex">
                
                <a href="/get-started" className="btn btn-primary btn-lg px-4">Get Started</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Learn More */}
      <section id="learn-more" className="py-5">
        <div className="container">
          <div className="row mb-4">
            <div className="col-lg-8">
              <h2 className="fw-bold section-title">How It Works?</h2>
              <p className="text-muted mb-0">All logic is enforced on-chain. No custodian, no company, no individual can move funds alone.</p>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-lg-7">
              {/* Steps */}
              <ol className="list-group">
                <li className="list-group-item">
                  <h5 className="mb-1 d-inline"><i className="bi bi-shield-lock me-2"></i>Create a Threshold Multi-Sig</h5>
                  <p className="mb-2">
                    Default: <strong>2-of-3</strong> (configurable). You generate three keys:
                    <br/>• <strong>Key A</strong> you keep.
                    <br/>• <strong>Key B</strong> you may later give to your heir.
                    <br/>• <strong>Key C</strong> is encrypted on your device and stored by the protocol <em>(the protocol never sees the plaintext key)</em>.
                  </p>
                  <div className="small text-muted">
                    Result: While you are alive, you control all three keys and can always move your funds.
                    After you pass a key to your heir and escrow one with the protocol, no single party
                    (not your heir, nor the protocol) can access the funds alone.
                  </div>
                </li>

                <li className="list-group-item">
                  <h5 className="mb-1 d-inline"><i className="bi bi-person-check me-2"></i>Your Heir Initiates a Claim</h5>
                  <p className="mb-2">
                    When the time comes, your heir starts a claim (“trade”) on the protocol. A staked
                    <strong> verifier pool</strong> is randomly selected and assigned to the case.
                  </p>
                  <div className="small text-muted">Verifiers have funds at risk and are slashable for bad behavior.</div>
                </li>

                <li className="list-group-item">
                  <h5 className="mb-1 d-inline"><i className="bi bi-hourglass-split me-2"></i>Waiting &amp; Verification</h5>
                  <p className="mb-2">
                    A <strong>waiting period</strong> begins — default <strong>3 months</strong> (you can set longer).
                    During this window, verifiers must <strong>contact you</strong> to confirm you are alive and object if needed.
                    You can require extra evidence such as a <strong>death certificate</strong>.
                  </p>
                  <div className="small text-muted">If you confirm you’re alive (on-chain signal), the claim is canceled.</div>
                </li>

                <li className="list-group-item">
                  <h5 className="mb-1 d-inline"><i className="bi bi-check2-circle me-2"></i>Automatic Release (If Conditions Met)</h5>
                  <p className="mb-2">
                    If the waiting period elapses without your objection and all conditions are satisfied,
                    the protocol enables a valid <strong>2-of-3</strong> signature path for your heir to receive the assets.
                  </p>
                  <div className="small text-muted">Funds move only when quorum is satisfied; no one can bypass policy.</div>
                </li>

                <li className="list-group-item">
                  <h5 className="mb-1 d-inline"><i className="bi bi-usb-drive me-2"></i>Heir Readiness Kit (Offline)</h5>
                  <p className="mb-0">
                    We provide step-by-step instructions to prepare a <strong>USB disk</strong> for your heir
                    (wallet app, public info, recovery guides). The USB never contains your private key unencrypted.
                  </p>
                </li>
              </ol>
            </div>

            <div className="col-lg-5">
              {/* Security / Policy Cards */}
              <div className="card mb-3">
                <div className="card-body">
                  <h5 className="card-title mb-3">Security Model</h5>
                  <ul className="list-unstyled mb-0">
                    <li className="mb-2">• <strong>Trustless:</strong> Keys, policies, and claims enforced by smart contracts.</li>
                    <li className="mb-2">• <strong>Key Privacy:</strong> Protocol stores only an <em>encrypted</em> key (never usable alone).</li>
                    <li className="mb-2">• <strong>Quorum Required:</strong> No single party can move funds unilaterally.</li>
                    <li className="mb-2">• <strong>Incentive Aligned:</strong> Verifiers are staked and slashable.</li>
                    <li className="mb-0">• <strong>Auditability:</strong> All actions are visible on-chain, personal data stays off-chain.</li>
                  </ul>
                </div>
              </div>

              <div className="card mb-3">
                <div className="card-body">
                  <h5 className="card-title mb-3">Policy Options</h5>
                  <ul className="list-unstyled mb-0">
                    <li className="mb-2">• Waiting period: <strong>3+ months</strong> (configurable).</li>
                    <li className="mb-2">• Extra documents: <strong>death certificate</strong>, notarized proof, etc.</li>
                    <li className="mb-0">• Multi-heir, multi-jurisdiction, and higher quorums (e.g., <strong>3-of-5</strong>).</li>
                  </ul>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <h5 className="card-title mb-3">FAQ</h5>
                  <div className="accordion" id="faqAccordion">
                    <div className="accordion-item">
                      <h2 className="accordion-header" id="q1h">
                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#q1" aria-expanded="true" aria-controls="q1">
                          What if I’m alive and someone files a claim?
                        </button>
                      </h2>
                      <div id="q1" className="accordion-collapse collapse" aria-labelledby="q1h" data-bs-parent="#faqAccordion">
                        <div className="accordion-body">
                          You submit a simple on-chain objection (or respond to verifier outreach). The claim is canceled, funds remain in place.
                        </div>
                      </div>
                    </div>

                    <div className="accordion-item">
                      <h2 className="accordion-header" id="q2h">
                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#q2" aria-expanded="false" aria-controls="q2">
                          Can anyone see my keys or move funds without me?
                        </button>
                      </h2>
                      <div id="q2" className="accordion-collapse collapse" aria-labelledby="q2h" data-bs-parent="#faqAccordion">
                        <div className="accordion-body">
                          No. The protocol only holds an encrypted key. Neither the protocol, a company, nor an individual can meet quorum alone.
                        </div>
                      </div>
                    </div>

                    <div className="accordion-item">
                      <h2 className="accordion-header" id="q3h">
                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#q3" aria-expanded="false" aria-controls="q3">
                          Do I have to use 2-of-3?
                        </button>
                      </h2>
                      <div id="q3" className="accordion-collapse collapse" aria-labelledby="q3h" data-bs-parent="#faqAccordion">
                        <div className="accordion-body">
                          No. You can choose higher thresholds (e.g., 3-of-5) or multiple heirs. The same trustless rules apply.
                        </div>
                      </div>
                    </div>

                    <div className="accordion-item">
                      <h2 className="accordion-header" id="q4h">
                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#q4" aria-expanded="false" aria-controls="q4">
                          Can I require a death certificate?
                        </button>
                      </h2>
                      <div id="q4" className="accordion-collapse collapse" aria-labelledby="q4h" data-bs-parent="#faqAccordion">
                        <div className="accordion-body">
                          Yes. You can make release conditions stricter by requiring documents such as a death certificate in addition to the waiting period and verifier checks.
                        </div>
                      </div>
                    </div>

                    <div className="accordion-item">
                      <h2 className="accordion-header" id="q5h">
                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#q5" aria-expanded="false" aria-controls="q5">
                          Do you generate private keys, and is the code open-source?
                        </button>
                      </h2>
                      <div id="q5" className="accordion-collapse collapse" aria-labelledby="q5h" data-bs-parent="#faqAccordion">
                        <div className="accordion-body">
                          This app may generate private keys for heirs and the protocol-related escrow key entirely <strong>client-side</strong> in your browser. All cryptographic operations occur locally; plaintext keys are never transmitted. The codebase is <strong>open-source</strong> for transparency and auditability.
                        </div>
                      </div>
                    </div>

                    <div className="accordion-item">
                      <h2 className="accordion-header" id="q6h">
                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#q6" aria-expanded="false" aria-controls="q6">
                          What smart contracts secure the funds?
                        </button>
                      </h2>
                      <div id="q6" className="accordion-collapse collapse" aria-labelledby="q6h" data-bs-parent="#faqAccordion">
                        <div className="accordion-body">
                          We use <a href="https://safe.global/" target="_blank" rel="noopener">Safe</a> (formerly Gnosis Safe), a widely adopted and <strong>well-audited</strong> multisig smart contract system. Learn more in the <a href="https://docs.safe.global/" target="_blank" rel="noopener">Safe documentation</a>.
                        </div>
                      </div>
                    </div>

                    <div className="accordion-item">
                      <h2 className="accordion-header" id="q7h">
                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#q7" aria-expanded="false" aria-controls="q7">
                          How can I include Bitcoin (BTC)?
                        </button>
                      </h2>
                      <div id="q7" className="accordion-collapse collapse" aria-labelledby="q7h" data-bs-parent="#faqAccordion">
                        <div className="accordion-body">
                          To bring BTC into an EVM policy, use an ERC‑20 representation:
                          <ul className="mt-2 mb-0">
                            <li><strong>wBTC</strong> — <a href="https://wbtc.network/" target="_blank" rel="noopener">Wrapped Bitcoin</a> (custodial): BTC is held by a custodian; you receive ERC‑20 wBTC on Ethereum.</li>
                            <li><strong>tBTC</strong> — <a href="https://threshold.network/tbtc" target="_blank" rel="noopener">tBTC</a> (trustless): a decentralized bridge mints ERC‑20 tBTC backed by BTC without a single custodian.</li>
                          </ul>
                          Choose based on your trust preferences. In custodial models (e.g., wBTC), your BTC is held in custody; in trustless models (e.g., tBTC), custody is decentralized by protocol design.
                        </div>
                      </div>
                    </div>

                    <div className="accordion-item">
                      <h2 className="accordion-header" id="q8h">
                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#q8" aria-expanded="false" aria-controls="q8">
                          How do I handle multiple heirs or different asset bundles?
                        </button>
                      </h2>
                      <div id="q8" className="accordion-collapse collapse" aria-labelledby="q8h" data-bs-parent="#faqAccordion">
                        <div className="accordion-body">
                          For clarity and security, create a <strong>separate Safe (multisig wallet)</strong> for each heir or for each distinct group of assets (“packages”). This lets you:
                          <ul className="mt-2">
                            <li><strong>Isolate risk</strong>: Each Safe holds its own assets and rules; issues in one do not affect others.</li>
                            <li><strong>Customize thresholds</strong>: Use different owner sets or 2-of-3 policies per heir or package.</li>
                            <li><strong>Allocate precisely</strong>: Fund each Safe with only the assets intended for that heir or package.</li>
                            <li><strong>Simplify execution</strong>: Clear separation makes triggering claims and reviews per package straightforward.</li>
                          </ul>
                          In practice, repeat the setup flow to deploy multiple Safes—one per heir or package—then move the corresponding assets into each Safe.
                        </div>
                      </div>
                    </div>

                    <div className="accordion-item">
                      <h2 className="accordion-header" id="q9h">
                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#q9" aria-expanded="false" aria-controls="q9">
                          Will my information and assets be publicly visible?
                        </button>
                      </h2>
                      <div id="q9" className="accordion-collapse collapse" aria-labelledby="q9h" data-bs-parent="#faqAccordion">
                        <div className="accordion-body">
                          No. Your private keys are never exposed. Only the attestors you assign can view your contact details and Safe information, and even they cannot see any of your private keys. Your sensitive data (e.g., Safe address and contact info) is stored on Ethereum as <strong>ciphertext</strong>, encrypted separately with each attestor’s public key. The public can only see encrypted blobs; only your selected attestors can decrypt their copy.
                        </div>
                      </div>
                    </div>

                  </div>{/* /accordion */}
                </div>
              </div>
            </div>
          </div>

          
        </div>
      </section>
    </>
  );
}
