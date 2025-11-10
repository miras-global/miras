export const dynamic = "force-static";

export default function PricingPage(){
  return (
    <section className="py-5">
      <div className="container">
        <header className="mb-4 text-center">
          <h1 className="fw-bold section-title">Pricing</h1>
          <p className="text-secondary">Transparent fees aligned with network security and sustainability.</p>
        </header>

        <div className="row g-3">
          <div className="col-12 col-md-6">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">Attesters & Validators</h5>
                <p className="card-text">
                  Minimum commitment <span className="price">100 MRS</span> <span className="pill">subject to change/increase over time</span>
                </p>
                <ul className="mb-0">
                  <li>Deposits displayed publicly for trust.</li>
                  <li>Validators may withdraw commitment on exit.</li>
                  <li><strong>Slashing</strong> for misbehavior or violations.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">Create a Miras Contract</h5>
                <p className="card-text">
                  <span className="price">0.4 ETH</span> 
                  <span className="pill ms-2">subject to change</span>
                </p>
                <ul className="mb-0">
                  <li>Encourages a diverse quorum of independent attesters.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3 mt-0">
          <div className="col-12 col-md-6">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">Create a Claim</h5>
                <p className="card-text">
                  <span className="price">40 MRS</span>
                  <span className="pill ms-2">subject to change (reduction only)</span>
                </p>
                <ul className="mb-0">
                  <li>Fees primarily <strong>incentivize validators</strong> to do business.</li>
                  <li>Future reductions possible; no increases under this policy.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">Add an Attester Review</h5>
                <p className="card-text">
                  <span className="price">0.001 ETH</span> <span className="pill">subject to change</span>
                </p>
                <ul className="mb-0">
                  <li>Streamlines reputation building and accountability.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="card mt-3">
          <div className="card-body">
            <h5 className="card-title mb-2">Treasury & Maintenance</h5>
            <p className="mb-0"><strong>25% of all fees</strong> are allocated to the <strong>treasury</strong> for ongoing maintenance and sustainability.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

