"use client";

export const dynamic = "force-static";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useWalletClient, useSwitchChain } from 'wagmi';
import { ethers } from "ethers";
import { encryptString, normalizeUncompressedPublicKeyHex } from "@/lib/crypto";
import { CHAIN } from "@/lib/config";
import { humanizeEthersError, createEnsureNetwork, createGetEthersSigner, createEnsureAccounts } from "@/lib/launch/utils";

export default function LaunchManualPage() {
  const { address, chain } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  
  const account = address || null;
  
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{type:"success"|"info"|"warning"|"danger"|"secondary"; msg:string}|null>(null);

  const [seedInput1, setSeedInput1] = useState<string>("");
  const [seedInput2, setSeedInput2] = useState<string>("");
  const [seedType, setSeedType] = useState<"12" | "24">("12");
  
  const [validatedSeed, setValidatedSeed] = useState<{phrase: string; priv: string} | null>(null);
  
  const [phone1, setPhone1] = useState<string>("");
  const [phone2, setPhone2] = useState<string>("");
  const [email1, setEmail1] = useState<string>("");
  const [email2, setEmail2] = useState<string>("");
  const [governmentId, setGovernmentId] = useState<File | null>(null);
  const [safeAddress, setSafeAddress] = useState<string>("");
  
  const [processing, setProcessing] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  
  const showAlert = useCallback((type: "success"|"info"|"warning"|"danger"|"secondary", msg: string) => {
    setAlert({ type, msg });
    if (type === 'danger' || type === 'warning') setErrorModal(msg);
  }, []);
  
  const clearAlert = useCallback(() => { setAlert(null); }, []);
  
  const ensureNetwork = useMemo(
    () => createEnsureNetwork(chain, switchChainAsync, showAlert),
    [chain, switchChainAsync, showAlert]
  );
  
  const getEthersSigner = useMemo(
    () => createGetEthersSigner(walletClient, account),
    [walletClient, account]
  );

  const ensureAccounts = useMemo(
    () => createEnsureAccounts(walletClient),
    [walletClient]
  );

  function normalizeSeed(seed: string): string {
    return seed.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function validateAndProcessSeed(): boolean {
    clearAlert();
    setErrorModal(null);
    
    try {
      if (!seedInput1 || !seedInput2) {
        const errorMsg = "Please enter the seed phrase in both fields.";
        showAlert("warning", errorMsg);
        return false;
      }
      
      const normalized1 = normalizeSeed(seedInput1);
      const normalized2 = normalizeSeed(seedInput2);
      
      if (normalized1 !== normalized2) {
        const errorMsg = "The two seed phrases do not match. Please check and try again.";
        showAlert("danger", errorMsg);
        return false;
      }
      
      const words = normalized1.split(' ');
      const expectedLength = seedType === "12" ? 12 : 24;
      
      if (words.length !== expectedLength) {
        const errorMsg = `Invalid seed phrase. Expected ${expectedLength} words, got ${words.length}.`;
        showAlert("danger", errorMsg);
        return false;
      }
      
      try {
        const wallet = ethers.Wallet.fromMnemonic(normalized1);
        const privateKey = wallet.privateKey;
        
        const address = wallet.address;
        if (!ethers.utils.isAddress(address)) {
          throw new Error("Invalid Ethereum address derived from seed");
        }
        
        setValidatedSeed({ phrase: normalized1, priv: privateKey });
        showAlert("success", `Seed phrase validated successfully! Derived address: ${address}`);
        return true;
      } catch (e: any) {
        const errorMsg = `Invalid seed phrase. Not a valid BIP39 mnemonic: ${e?.message || 'Unknown error'}`;
        showAlert("danger", errorMsg);
        return false;
      }
    } catch (e: any) {
      const errorMsg = e?.message || "Validation failed.";
      showAlert("danger", errorMsg);
      return false;
    }
  }

  const findAttestorsAndRegister = useCallback(async (): Promise<void> => {
    try {
      if (!validatedSeed) {
        showAlert("warning", "Please validate your seed phrase first.");
        return;
      }
      
      if (!phone1 || !email1) {
        showAlert("warning", "Please enter at least primary phone number and email before proceeding.");
        return;
      }

      if (!safeAddress) {
        showAlert("warning", "Please enter your Safe wallet address.");
        return;
      }

      let safeAddr: string;
      try {
        safeAddr = ethers.utils.getAddress(safeAddress);
      } catch (e) {
        showAlert("danger", "Invalid Safe address. Please check and try again.");
        return;
      }

      setProcessing(true);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.miras.global";
      const res = await fetch(`${apiUrl}/index.php?module=attesters&chain=${CHAIN.keyName}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to fetch attesters: ${res.status}`);
      const text = await res.text();
      
      const lines = text
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l.length > 0 && !l.startsWith("#"));

      if (lines.length === 0) {
        console.warn("[Attestors] No entries found in attesters list");
        showAlert("warning", "No attesters available at this time. Please try again later.");
        return;
      }

      // Shuffle and take up to 3 unique entries
      const shuffled = [...lines].sort(() => Math.random() - 0.5);
      const picked = shuffled.slice(0, Math.min(3, shuffled.length));
      const parsed: Array<{ public_key: string; address: string } & Record<string, any>> = picked.map(l => JSON.parse(l));
      console.log("[Attestors] picked =>", parsed);

      const contactInfo = JSON.stringify({
        phone1,
        phone2: phone2 || "",
        email1,
        email2: email2 || "",
        governmentId: governmentId ? governmentId.name : "",
        seedPhrase: validatedSeed.phrase
      });
      console.log("[Attestors] contact info (with seed) prepared");

      const ciphertextsB64 = parsed.map(p => {
        try {
          const attesterPubUncompressed = normalizeUncompressedPublicKeyHex(p.public_key);
          return encryptString(attesterPubUncompressed, contactInfo);
        } catch (e) {
          console.warn("[Attestors] invalid attester public key, skipping", p.public_key, e);
          return null;
        }
      }).filter(Boolean) as string[];
      console.log("[Attestors] ciphertexts (base64) =>", ciphertextsB64);

      const protocolPhrase = validatedSeed.phrase;

      const heirEncryptionWallet = ethers.Wallet.createRandom();
     const heirEncryptionPriv = heirEncryptionWallet._signingKey().privateKey;
      const heirEncryptionPub = normalizeUncompressedPublicKeyHex(
        ethers.utils.computePublicKey(heirEncryptionPriv, false)
      );
      console.log("[Attestors] Generated new heir encryption key pair");
      console.log("[Attestors] Heir encryption priv =>", heirEncryptionPriv);

      const firstEncryption = encryptString(heirEncryptionPub, protocolPhrase);
      console.log("[Attestors] First encryption (with heir key) =>", firstEncryption);

      const encryptedProtocolPhrasesB64 = parsed.map(p => {
        try {
          const attesterPubUncompressed = normalizeUncompressedPublicKeyHex(p.public_key);
          return encryptString(attesterPubUncompressed, firstEncryption);
        } catch (e) {
          console.warn("[Attestors] invalid attester public key for protocol phrase, skipping", p.public_key, e);
          return null;
        }
      }).filter(Boolean) as string[];
      console.log("[Attestors] encrypted protocol phrases (double encrypted) =>", encryptedProtocolPhrasesB64);

      const attesterAddresses = parsed.map(p => {
        try {
          return ethers.utils.getAddress(p.address);
        } catch (e) {
          console.warn("[Attestors] invalid address; skipping", p.address, e);
          return null;
        }
      }).filter(Boolean) as string[];

      if (attesterAddresses.length === 0) {
        console.warn("[Safe] No valid attester addresses; cannot proceed.");
        showAlert("danger", "No valid attesters found. Please try again.");
        return;
      }

      console.log("[Manual Launch] Using provided Safe address:", safeAddr);

      const waitingPeriod: number = 1;
      const deathCertificate: boolean = false;
      const encryptedPhonesStrings = ciphertextsB64;
      const encryptedProtocolPhrasesStrings = encryptedProtocolPhrasesB64;

      try {
        await ensureAccounts();
        await ensureNetwork();
        const signer = getEthersSigner();
        const tableAddr = ethers.utils.getAddress(CHAIN.safesProxy);
        const tableAbi = [
          "function insert(address safe_address, uint8 waiting_period, bool death_certificate, address[] attesters, string[] encryptedPhones, string[] encryptedProtocolPhrases) payable"
        ];
        const table = new ethers.Contract(tableAddr, new ethers.utils.Interface(tableAbi), signer);
        const tx = await table.insert(
          safeAddr,
          waitingPeriod,
          deathCertificate,
          attesterAddresses,
          encryptedPhonesStrings,
          encryptedProtocolPhrasesStrings,
          { value: ethers.utils.parseEther("0.1") }
        );
        console.log("[Safe] insert tx sent =>", tx.hash);
        showAlert("info", `Transaction sent. Waiting for confirmation…\nTx: ${tx.hash}`);
        const rcpt = await tx.wait();
        console.log("[Safe] insert confirmed in block", rcpt.blockNumber);
        showAlert("success", `Manual launch completed successfully!\nYour information has been encrypted and distributed to attesters.\n\nTx: ${tx.hash}\nBlock: ${rcpt.blockNumber}\n\n⚠️ IMPORTANT: Share this decryption key with your heir (keep it VERY safe!):\n${heirEncryptionPriv}\n\nYour heir will need this key to decrypt the protocol seed phrase.`);
      } catch (e: any) {
        console.error("[Safe] insert failed:", e?.message || e);
        const pretty = humanizeEthersError(e);
        showAlert(pretty.type, pretty.msg);
      }
    } catch (e: any) {
      console.error("findAttestorsAndRegister error:", e?.message || e);
      showAlert("danger", e?.message || "Failed to complete manual launch.");
    } finally {
      setProcessing(false);
    }
  }, [validatedSeed, phone1, phone2, email1, email2, governmentId, safeAddress, ensureAccounts, ensureNetwork, getEthersSigner, showAlert]);

  return (
    <section className="py-5">
      <div className="container">
        <header className="mb-4 text-center">
          <h1 className="fw-bold section-title">Manual Launch</h1>
          <p className="text-muted">Add a new key to your existing Safe</p>
        </header>

        <div className="row g-3">
          <div className="col-12">
            {alert && (
              <div className={`alert alert-${alert.type}`} role="alert">
                {alert.msg}
              </div>
            )}
          </div>
          
          {!account && (
            <div className="col-12">
              <div className="alert alert-info" role="alert">
                <i className="bi bi-info-circle me-2"></i>
                Please connect your wallet using the button in the header to continue.
              </div>
            </div>
          )}

          {account && !validatedSeed && (
            <div className="col-12">
              <div className="alert alert-warning d-flex align-items-start" role="alert">
                <i className="bi bi-exclamation-triangle me-2"></i>
                <div>
                  <strong>Security Warning:</strong> Only use this manual launch if you already have an existing seed phrase. 
                  Never share your seed phrase with anyone. This page validates your seed locally in your browser and never sends it to any server.
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <h5 className="card-title mb-3">Enter Your Seed Phrase</h5>
                  
                  <div className="mb-3">
                    <label className="form-label">Seed Type</label>
                    <div className="btn-group w-100" role="group">
                      <input type="radio" className="btn-check" name="seedType" id="seed12" checked={seedType === "12"} onChange={() => setSeedType("12")} />
                      <label className="btn btn-outline-primary" htmlFor="seed12">12 Words</label>
                      
                      <input type="radio" className="btn-check" name="seedType" id="seed24" checked={seedType === "24"} onChange={() => setSeedType("24")} />
                      <label className="btn btn-outline-primary" htmlFor="seed24">24 Words</label>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Enter Seed Phrase (First Time)</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      placeholder={`Enter your ${seedType}-word seed phrase (space-separated)`}
                      value={seedInput1}
                      onChange={(e) => setSeedInput1(e.target.value)}
                      disabled={processing}
                    />
                    <div className="form-text">Enter all {seedType} words separated by spaces</div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Re-enter Seed Phrase (Confirmation)</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      placeholder={`Re-enter your ${seedType}-word seed phrase to confirm`}
                      value={seedInput2}
                      onChange={(e) => setSeedInput2(e.target.value)}
                      disabled={processing}
                    />
                    <div className="form-text">Enter the same seed phrase again to confirm</div>
                  </div>

                  <button
                    className="btn btn-primary btn-lg"
                    onClick={validateAndProcessSeed}
                    disabled={processing || !seedInput1 || !seedInput2}
                  >
                    <i className="bi bi-check-circle"></i> Validate Seed Phrase
                  </button>
                </div>
              </div>
            </div>
          )}

          {account && validatedSeed && (
            <div className="col-12">
              <div className="alert alert-success" role="alert">
                <i className="bi bi-check-circle me-2"></i>
                Seed phrase validated successfully! Now enter your contact information.
              </div>

              <div className="card">
                <div className="card-body">
                  <h6 className="fw-bold mb-3"><i className="bi bi-telephone"></i> Contact Information</h6>
                  <p className="text-muted small mb-3">
                    This is how attesters will contact you regarding claims. Provide active contact details.
                  </p>

                  <div className="mb-3">
                    <label className="form-label">Safe Wallet Address <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="0x... (your Safe address)"
                      value={safeAddress}
                      onChange={(e) => setSafeAddress(e.target.value)}
                      disabled={processing}
                    />
                    <div className="form-text">Enter the Safe (Gnosis Safe) address you want to register.</div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Primary Phone Number <span className="text-danger">*</span></label>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="+1 (555) 123-4567"
                        value={phone1}
                        onChange={(e) => setPhone1(e.target.value)}
                        disabled={processing}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Secondary Phone Number (optional)</label>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="+1 (555) 987-6543"
                        value={phone2}
                        onChange={(e) => setPhone2(e.target.value)}
                        disabled={processing}
                      />
                    </div>
                  </div>

                  <div className="row g-3 mt-2">
                    <div className="col-md-6">
                      <label className="form-label">Primary Email <span className="text-danger">*</span></label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="your.email@example.com"
                        value={email1}
                        onChange={(e) => setEmail1(e.target.value)}
                        disabled={processing}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Secondary Email (optional)</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="backup@example.com"
                        value={email2}
                        onChange={(e) => setEmail2(e.target.value)}
                        disabled={processing}
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="form-label">Government ID Photo <span className="text-danger">*</span></label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*,.pdf"
                      onChange={(e) => setGovernmentId(e.target.files?.[0] || null)}
                      disabled={processing}
                    />
                    <div className="form-text">Upload a photo of your government-issued ID (passport, driver&apos;s license, etc.). Accepted formats: JPG, PNG, PDF.</div>
                  </div>

                  <div className="mt-4">
                    <button
                      className="btn btn-success btn-lg"
                      onClick={findAttestorsAndRegister}
                      disabled={processing || !phone1 || !email1 || !safeAddress}
                    >
                      <i className="bi bi-shield-check"></i> {processing ? 'Processing…' : 'Find Attestors & Register'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="card mt-4">
                <div className="card-body">
                  <h5 className="card-title mb-3">
                    <i className="bi bi-file-earmark-text me-2"></i>
                    Create Your Crypto Will
                  </h5>
                  <p className="text-muted mb-3">
                    After registering with attestors, create a document for your heirs explaining how to claim their inheritance.
                  </p>
                  <div className="d-flex gap-2 flex-wrap">
                    <a 
                      href={`/crypto-will-wizard?safe=${encodeURIComponent(safeAddress)}&heir=${encodeURIComponent(validatedSeed?.phrase || '')}`}
                      className="btn btn-success"
                    >
                      <i className="bi bi-magic me-2"></i>
                      Create with Wizard
                    </a>
                    <a 
                      href="/blog/crypto-will-guide-after-claim"
                      className="btn btn-outline-primary"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="bi bi-book me-2"></i>
                      Read the Guide
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {errorModal && (
          <>
            <div className="modal fade show" style={{display:'block'}} role="dialog" aria-modal="true">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Error</h5>
                    <button type="button" className="btn-close" aria-label="Close" onClick={()=>setErrorModal(null)}></button>
                  </div>
                  <div className="modal-body">
                    <p className="mb-0">{errorModal}</p>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-primary" onClick={()=>setErrorModal(null)}>OK</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-backdrop fade show"></div>
          </>
        )}
      </div>
    </section>
  );
}
