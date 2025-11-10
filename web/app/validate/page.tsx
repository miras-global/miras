"use client";

export default function ValidatePage(){
  return (
    <section className="py-5">
      <div className="container">
        <header className="mb-4 text-center">
          <h1 className="fw-bold section-title">Validate</h1>
          <p className="text-secondary">Review evidence, coordinate attestations, and finalize outcomes.</p>
        </header>

        <div className="row g-3">
          <div className="col-12 col-lg-7">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">Review Claim</h5>
                <div className="mb-3">
                  <label className="form-label">Claim ID</label>
                  <input className="form-control" placeholder="#123" disabled />
                </div>
                <div className="mb-3">
                  <label className="form-label">Attester Quorum</label>
                  <input className="form-control" placeholder="e.g., 3 of 5" disabled />
                </div>
                <div className="mb-3">
                  <label className="form-label">Notes</label>
                  <textarea className="form-control" rows={4} placeholder="Your review notes" disabled />
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-success" disabled>Approve</button>
                  <button className="btn btn-outline-secondary" disabled>Request Changes</button>
                </div>
                <p className="small text-secondary mt-2 mb-0">Signature and transaction flow to be added later.</p>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-5">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">Staking & Incentives</h5>
                <p className="mb-2">Operational fees primarily incentivize validators to do business.</p>
                <p className="mb-0"><strong>20% of fees</strong> go to the treasury for maintenance.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
