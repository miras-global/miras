import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Miras",
  description:
    "Terms governing the MRS token exchange, inheritance packages, and audited Safe integrations offered by Miras.",
};

export default function TermsOfServicePage() {
  return (
    <section className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10 col-xl-8">
          <h1 className="mb-4">Miras Terms of Service</h1>
          <p className="text-muted">Effective Date: 26 September 2025</p>

          <p>
            These Terms of Service (&quot;Terms&quot;) govern your access to and use of the products and
            services offered by Miras, including the MRS token, exchange interface, inheritance
            orchestration packages, attestation marketplace, and any other tools, APIs, or smart
            contract integrations we provide (collectively, the &quot;Services&quot;). By accessing or using the
            Services, you agree to be bound by these Terms. If you are acting on behalf of a company
            or other legal entity, you represent that you have authority to bind that entity and these
            Terms apply to it as well.
          </p>

          <h2 className="mt-5">1. Eligibility</h2>
          <p>
            You may use the Services only if you are of legal age in your jurisdiction, are capable of
            forming a binding contract, and are not prohibited from using similar services under
            applicable law. You are solely responsible for ensuring that your use of the Services
            complies with all laws, regulations, and policies that apply to you.
          </p>

          <h2 className="mt-4">2. Description of Services</h2>
          <ul>
            <li>
              <strong>MRS Token:</strong> A cryptoasset issued by the Miras ecosystem. MRS has no
              intrinsic monetary value or guarantee of appreciation. The token may be used for
              governance, network participation, or other utilities defined by the Miras DAO.
            </li>
            <li>
              <strong>Exchange Interface:</strong> A front-end that enables interaction with smart
              contracts for the purchase or sale of MRS. All transactions occur on the blockchain and
              are executed by immutable smart contracts outside of Miras&apos; direct control.
            </li>
            <li>
              <strong>Inheritance Packages:</strong> Workflow tooling that helps users assemble estate or
              succession packages leveraging third-party audited Safe contracts and Miras attestation
              mechanisms. These packages remain fully custodial to the end user; Miras never takes
              possession of keys or digital assets.
            </li>
            <li>
              <strong>Third-Party Integrations:</strong> The Services reference audited Safe contracts and
              other external protocols. Miras does not operate, control, or warrant the performance of
              these integrations and provides them &quot;as is&quot; for your convenience.
            </li>
          </ul>

          <h2 className="mt-4">3. Wallets and Security</h2>
          <p>
            You must connect your own compatible wallet to use the Services. You remain fully
            responsible for safeguarding your seed phrases, private keys, hardware devices, and
            authentication mechanisms. Miras never requests your private keys and cannot recover them
            if lost or compromised.
          </p>

          <h2 className="mt-4">4. Assumption of Risk</h2>
          <p>
            You acknowledge the inherent risks of interacting with blockchain technology, including
            but not limited to smart contract vulnerabilities, network congestion, transaction delays,
            slashing events, loss of access to wallets, market volatility, and regulatory changes.
            MRS tokens and inheritance packages may become worthless, illiquid, or inaccessible.
            You alone bear all risks associated with using the Services.
          </p>

          <h2 className="mt-4">5. No Fiduciary Duties</h2>
          <p>
            Miras is a software provider. We do not act as your broker, advisor, custodian, or
            fiduciary. Information provided through the Services, documentation, or community channels
            is for informational purposes only and should not be construed as legal, financial, tax,
            or investment advice.
          </p>

          <h2 className="mt-4">6. Fees and Taxes</h2>
          <p>
            You are responsible for all gas fees, protocol fees, taxes, or assessments arising from
            your use of the Services. Miras may update Fees upon reasonable notice, and the MRS DAO
            may vote to modify token economics or staking requirements at any time.
          </p>

          <h2 className="mt-4">7. Third-Party Audits and Integrations</h2>
          <p>
            References to &quot;third-party audited&quot; Safe contracts or other protocols indicate that those
            contracts have undergone external security reviews. Miras does not conduct independent
            audits, cannot guarantee the sufficiency of any third-party review, and does not warrant
            the continued security or availability of those contracts.
          </p>

          <h2 className="mt-4">8. Disclaimers</h2>
          <p>
            THE SERVICES ARE PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS. MIRAS AND ITS
            CONTRIBUTORS, FOUNDERS, EMPLOYEES, AND AFFILIATES EXPRESSLY DISCLAIM ALL WARRANTIES, WHETHER
            EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WITHOUT LIMITATION WARRANTIES OF MERCHANTABILITY,
            FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, SECURITY, ACCURACY, AND
            RELIABILITY. WE DO NOT GUARANTEE THAT THE SERVICES WILL BE CONTINUOUS, TIMELY, ERROR-FREE, OR
            SECURE.
          </p>

          <h2 className="mt-4">9. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, MIRAS AND ITS CONTRIBUTORS SHALL NOT BE LIABLE FOR
            ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES,
            INCLUDING WITHOUT LIMITATION LOSS OF PROFITS, DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES,
            ARISING OUT OF OR RELATED TO YOUR USE OF (OR INABILITY TO USE) THE SERVICES, EVEN IF WE
            HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. MIRAS&apos; TOTAL LIABILITY UNDER THESE
            TERMS SHALL NOT EXCEED ONE HUNDRED U.S. DOLLARS ($100) IN THE AGGREGATE.
          </p>

          <h2 className="mt-4">10. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless Miras, its affiliates, contributors,
            contractors, and service providers from and against any claims, liabilities, damages,
            losses, and expenses (including attorney fees) arising from your use of the Services or
            violation of these Terms.
          </p>

          <h2 className="mt-4">11. Compliance and Prohibited Conduct</h2>
          <p>
            You may not use the Services in any manner that violates applicable law, including
            sanctions regulations, KYC/AML obligations, or securities laws. You agree not to interfere
            with or disrupt the operation of the Services, attempt to gain unauthorized access to
            systems, or deploy malicious code.
          </p>

          <h2 className="mt-4">12. Modifications</h2>
          <p>
            We may update these Terms at any time. Continued use of the Services after the effective
            date of updated Terms constitutes acceptance of the revised Terms. Material updates will
            be communicated via official Miras channels.
          </p>

          <h2 className="mt-4">13. Termination</h2>
          <p>
            Miras may suspend or terminate your access to the Services at any time for any reason,
            including breach of these Terms. Upon termination, all rights and licenses granted to you
            under these Terms will cease immediately.
          </p>

          <h2 className="mt-4">14. Governing Law and Disputes</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the
            jurisdiction in which the Miras foundation or operating entity is formed, without regard to
            conflict of law principles. Any disputes arising under these Terms shall be resolved in the
            courts of that jurisdiction, unless an alternative dispute resolution mechanism is agreed in
            writing.
          </p>

          <h2 className="mt-4">15. Contact</h2>
          <p>
            Questions about these Terms may be directed to the Miras support team at
            <a href="mailto:legal@miras.global" className="ms-1">legal@miras.global</a>.
          </p>
        </div>
      </div>
    </section>
  );
}
