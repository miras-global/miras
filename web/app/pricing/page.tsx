export const dynamic = "force-static";

const TIERS = [
  {
    icon: "bi-shield-check",
    title: "Attesters & Validators",
    price: "100 MRS",
    note: "subject to change/increase over time",
    bullets: [
      "Deposits displayed publicly for trust",
      "Validators may withdraw commitment on exit",
      <><strong>Slashing</strong> for misbehavior or violations</>,
    ],
  },
  {
    icon: "bi-rocket-takeoff",
    title: "Create a Miras contract",
    price: "0.4 ETH",
    note: "subject to change",
    bullets: [
      "Encourages a diverse quorum of independent attesters",
    ],
  },
  {
    icon: "bi-flag",
    title: "Create a claim",
    price: "40 MRS",
    note: "subject to change (reduction only)",
    bullets: [
      <>Fees primarily <strong>incentivize validators</strong> to do business</>,
      "Future reductions possible; no increases under this policy",
    ],
  },
  {
    icon: "bi-chat-square-quote",
    title: "Add an attester review",
    price: "0.001 ETH",
    note: "subject to change",
    bullets: [
      "Streamlines reputation building and accountability",
    ],
  },
];

export default function PricingPage(){
  return (
    <>
      {/* Hero */}
      <section className="hero-gradient">
        <div className="container">
          <div className="row align-items-end g-4">
            <div className="col-lg-8">
              <span className="kicker"><i className="bi bi-coin"></i> Pricing</span>
              <h1 className="display-5 mt-3 mb-3">
                Transparent fees,<br/>
                <span className="text-gradient">aligned with security.</span>
              </h1>
              <p className="lead mb-0">
                Fees fund the network — incentivizing validators, securing claims, and sustaining the protocol.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section>
        <div className="container">
          <div className="row g-3">
            {TIERS.map((t) => (
              <div className="col-12 col-md-6" key={t.title}>
                <div className="card card-glow h-100">
                  <div className="card-body">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div className="step-badge"><i className={`bi ${t.icon}`}></i></div>
                      <h5 className="card-title mb-0">{t.title}</h5>
                    </div>
                    <div className="d-flex align-items-baseline flex-wrap gap-2 mb-3">
                      <span className="price">{t.price}</span>
                      <span className="pill">{t.note}</span>
                    </div>
                    <ul className="list-unstyled mb-0">
                      {t.bullets.map((b, i) => <li key={i} className="mb-2">{b}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card mt-4">
            <div className="card-body" style={{padding:'1.75rem'}}>
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="step-badge"><i className="bi bi-bank"></i></div>
                  <div>
                    <h5 className="mb-1">Treasury & maintenance</h5>
                    <p className="text-muted mb-0">
                      <strong>25% of all fees</strong> are allocated to the treasury for ongoing maintenance and sustainability.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
