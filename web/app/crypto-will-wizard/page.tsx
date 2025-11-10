"use client";

export const dynamic = "force-dynamic";

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';

function WizardInner() {
  const searchParams = useSearchParams();
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [yourName, setYourName] = useState('');
  const [safeAddress, setSafeAddress] = useState('');
  const [heirSeedPhrase, setHeirSeedPhrase] = useState('');
  const [encryptedPassphrase, setEncryptedPassphrase] = useState('');
  const [generatedDocument, setGeneratedDocument] = useState('');

  useEffect(() => {
    const safe = searchParams.get('safe');
    const heir = searchParams.get('heir');
    
    if (safe) setSafeAddress(safe);
    if (heir) setHeirSeedPhrase(heir);
  }, [searchParams]);

  const generateDocument = () => {
    const doc = `**Your Crypto Will – How to Claim & Access the Inheritance**

Dear ${beneficiaryName || '[Beneficiary Name]'},

Below is a simple, step‑by‑step guide that will help you claim and access the crypto assets after I'm gone.

If I can't be there to walk you through it, the only thing that will let you reach the money and tokens entrusted to me are a set of cryptographic keys. This document lists everything you'll need in plain language—no blockchain knowledge required.

If you'd rather have help, work with someone you trust and stay by their side throughout the process. In professional hands it should take less than an hour.

---

## 1. What you'll use first – The "Safe" (a multi‑signature Ethereum wallet)

| Item | Details |
|------|---------|
| **Wallet address** | \`${safeAddress || '[SAFE_ADDRESS]'}\` |
| **View balance & transaction history** | \`https://app.safe.global/apps?safe=eth:${safeAddress || '[SAFE_ADDRESS]'}\` |
| **First seed phrase (BIP‑39)** | \`${heirSeedPhrase || 'WORD1 WORD2 WORD3 … WORD12'}\` |

> **Keep this phrase in a secure place – never write it on the same paper as your bank card or phone number.** You'll need to type it into a wallet (e.g., MetaMask) exactly as shown, including the order of words and spaces.

---

## 2. Claiming my assets after I'm gone

1. **Visit the claim portal** – \`https://miras.global/claim\`
2. **Fill in your contact details** (name, email, phone).  
   *The service needs this to verify you are an authorized claimant.*
3. Click "Submit" and wait for a confirmation e‑mail.

> The team normally takes about **three months** to process a claim. They'll confirm my death with the estate lawyer or executor before releasing any funds.

---

## 3. Getting the second recovery key

Once your claim is approved, you will receive an *encrypted* file (or email) that contains the second part of the key needed for the Safe. To decrypt it:

1. Go to \`https://miras.global/decrypt\`
2. Paste the following **decryption passphrase** into the box and press "Decrypt":

   \`${encryptedPassphrase || '0x[ENCRYPTION_KEY]'}\`

3. The screen will display a **second BIP‑39 seed phrase** (or a raw private key).  
   *If it's a raw key, you can import it into MetaMask as "Import Wallet → Private Key".*

---

## 4. Using both keys to access the Safe

1. Open MetaMask and click "Add Account".
2. Import **first seed phrase** (the one listed above).
3. Import **second seed phrase / private key** obtained in step 3.
4. Once both accounts are visible, go back to \`https://app.safe.global/apps?safe=eth:${safeAddress || '[SAFE_ADDRESS]'}\` and log in with the Safe address.  
   The Safe will now recognize that you hold both required keys.

You can then:

- View all tokens and Ether inside the Safe.
- Send funds out or transfer them to any other wallet you choose.

---

## 5. If something goes wrong

| Scenario | What to do |
|----------|------------|
| **Claim portal is down** | Use a reputable Ethereum wallet that supports BIP‑39 (e.g., MetaMask, Ledger Live). The keys will still work on the blockchain. Both Safe and the claim service are open source, so you can use them independently. |
| **Forgot a word in a seed phrase** | There's no recovery – make sure you store each phrase securely. |
| **Someone else claims your name** | Only someone with both keys can control the Safe. Keep the keys safe once you have them. |

---

## 6. Final safety tips

1. **Never share any of these phrases online.**
2. Store each phrase on a separate medium: one on a paper wallet inside a safe deposit box, another in a hardware wallet or a password‑protected digital file.
3. If you're uncomfortable doing this yourself, find a **trusted** crypto professional to walk you through the steps and verify everything.

---

> **I love you, ${beneficiaryName || '[Beneficiary Name]'}.** I trust that you will keep these instructions safe and use them responsibly.

With all my love,  
${yourName || '[Your Name]'}

---

*For more information about setting up your Miras inheritance plan, visit [miras.global](https://miras.global) or contact us at [team@miras.global](mailto:team@miras.global).*`;

    setGeneratedDocument(doc);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedDocument);
      alert('Document copied to clipboard! You can now paste it into a text editor and save it.');
    } catch (err) {
      alert('Failed to copy to clipboard. Please select and copy the text manually.');
    }
  };

  const downloadAsText = () => {
    const blob = new Blob([generatedDocument], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'crypto-will.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printDocument = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Your Crypto Will</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
              h1, h2 { color: #333; }
              table { border-collapse: collapse; width: 100%; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #f2f2f2; }
              code { background-color: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
              blockquote { background-color: #f9f9f9; border-left: 4px solid #ccc; padding: 10px 20px; margin: 20px 0; }
              @media print { body { padding: 20px; } }
            </style>
          </head>
          <body>
            <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${generatedDocument.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <section className="py-5">
      <div className="container">
        <header className="mb-4 text-center">
          <h1 className="fw-bold section-title">Create Your Crypto Will</h1>
          <p className="text-muted">Fill in the details below to generate a personalized inheritance document for your heirs</p>
        </header>

        <div className="row">
          <div className="col-lg-6">
            <div className="card mb-4">
              <div className="card-body">
                <h5 className="card-title mb-3">
                  <i className="bi bi-pencil-square me-2"></i>
                  Fill in Your Information
                </h5>

                <div className="mb-3">
                  <label className="form-label">Your Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="John Doe"
                    value={yourName}
                    onChange={(e) => setYourName(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Beneficiary Name (Heir) <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Jane Doe"
                    value={beneficiaryName}
                    onChange={(e) => setBeneficiaryName(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Safe Wallet Address <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="0x..."
                    value={safeAddress}
                    onChange={(e) => setSafeAddress(e.target.value)}
                  />
                  <div className="form-text">The Ethereum address of your Gnosis Safe</div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Heir Seed Phrase (12 words) <span className="text-danger">*</span></label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="word1 word2 word3 ..."
                    value={heirSeedPhrase}
                    onChange={(e) => setHeirSeedPhrase(e.target.value)}
                  />
                  <div className="form-text">The 12-word recovery phrase you generated for your heir</div>
                </div>



                <div className="mb-3">
                  <label className="form-label">Encryption Private Key</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="0x..."
                    value={encryptedPassphrase}
                    onChange={(e) => setEncryptedPassphrase(e.target.value)}
                  />
                  <div className="form-text">The passphrase needed to decrypt the second key</div>
                </div>

                <button
                  className="btn btn-primary btn-lg w-100"
                  onClick={generateDocument}
                >
                  <i className="bi bi-file-earmark-text me-2"></i>
                  Generate Document
                </button>
              </div>
            </div>

            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              <strong>Need help?</strong> Read our comprehensive guide on{' '}
              <Link href="/blog/crypto-will-guide-after-claim" className="alert-link">
                creating your Crypto Will
              </Link>
            </div>
          </div>

          <div className="col-lg-6">
            {!generatedDocument ? (
              <div className="card">
                <div className="card-body text-center py-5">
                  <i className="bi bi-file-earmark-text" style={{ fontSize: '4rem', color: '#ccc' }}></i>
                  <p className="text-muted mt-3">Fill in the form and click &quot;Generate Document&quot; to see your personalized Crypto Will</p>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title mb-3">
                    <i className="bi bi-file-earmark-check me-2"></i>
                    Your Generated Document
                  </h5>

                  <div className="d-flex gap-2 mb-3 flex-wrap">
                    <button className="btn btn-success" onClick={copyToClipboard}>
                      <i className="bi bi-clipboard me-2"></i>
                      Copy to Clipboard
                    </button>
                    <button className="btn btn-primary" onClick={downloadAsText}>
                      <i className="bi bi-download me-2"></i>
                      Download as Text
                    </button>
                    <button className="btn btn-outline-primary" onClick={printDocument}>
                      <i className="bi bi-printer me-2"></i>
                      Print
                    </button>
                  </div>

                  <div 
                    className="border rounded p-3" 
                    style={{ 
                      maxHeight: '600px', 
                      overflowY: 'auto', 
                      backgroundColor: '#f8f9fa',
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {generatedDocument}
                  </div>

                  <div className="alert alert-warning mt-3">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    <strong>Security Reminder:</strong> Store this document securely offline. Never email it or store it in cloud services without strong encryption.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">
                <i className="bi bi-shield-check me-2"></i>
                Next Steps
              </h5>
              <ol className="mb-0">
                <li className="mb-2">Review the generated document carefully to ensure all information is correct</li>
                <li className="mb-2">Print the document on durable paper and store it in a fireproof safe or safe deposit box</li>
                <li className="mb-2">Save a copy to a password-protected USB drive and store it separately</li>
                <li className="mb-2">Inform your beneficiaries where to find this document when needed</li>
                <li className="mb-2">Update the document whenever you change your Safe configuration or recovery keys</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function CryptoWillWizard() {
  return (
    <Suspense fallback={<section className="py-5"><div className="container"><p className="text-muted">Loading…</p></div></section>}>
      <WizardInner />
    </Suspense>
  );
}
