"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from "ethers";
import { getBoundSigner, getBoundProvider, ensureAccountsOn } from "@/lib/wallet";
import { encryptString, encryptToBytes, normalizeUncompressedPublicKeyHex } from "@/lib/crypto";
import { CHAIN, NETWORK_CONFIGS } from "@/lib/config";

const LS_KEYS = { reg: "miras_registry_address" } as const;
const ZERO32 = "0x" + "0".repeat(64);

// Gasless flow: we no longer use on-chain attester registry or claims contract here
const SAFES_ABI = [
  "function get(address) view returns (address,address,uint8,bool,address[],string[],string[],uint64)"
];
const CLAIMS_ABI = [
  "function registerFee() view returns (uint256)",
  "function feeToken() view returns (address)",
  "function createClaim(string,address,string,uint256) returns (uint256)",
  "function getClaimBySafeId(string) view returns (address,string,address,string,uint64,uint8)"
];
const ERC20_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];
const ATTESTERS_ABI = [
  "function getAttester(address) view returns (address,string,string,string,uint64,bool,bool,uint256,uint256,uint64,uint256,uint256)"
];

// Address book per network
const ADDRESS_BOOK: Record<"sepolia" | "mainnet", { SAFES_ADDRESS: string; ATTESTERS_ADDRESS: string; CLAIMS_ADDRESS: string }> = {
  sepolia: {
    SAFES_ADDRESS: NETWORK_CONFIGS.sepolia.safesProxy,
    ATTESTERS_ADDRESS: NETWORK_CONFIGS.sepolia.attestersProxy,
    CLAIMS_ADDRESS: NETWORK_CONFIGS.sepolia.claimsProxy,
  },
  mainnet: {
    SAFES_ADDRESS: NETWORK_CONFIGS.mainnet.safesProxy,
    ATTESTERS_ADDRESS: NETWORK_CONFIGS.mainnet.attestersProxy,
    CLAIMS_ADDRESS: NETWORK_CONFIGS.mainnet.claimsProxy,
  },
};

type AlertType = "success" | "info" | "warning" | "danger";

export default function ClaimPage() {
  const { address, chain } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const account = address || null;
  const chainId = chain?.id || null;
  const net: "sepolia" | "mainnet" = chainId === 1 ? "mainnet" : "sepolia";
  const { SAFES_ADDRESS, ATTESTERS_ADDRESS, CLAIMS_ADDRESS } = ADDRESS_BOOK[net];
  
  const [alert, setAlert] = useState<{ type: AlertType; msg: string } | null>(null);
  const [status, setStatus] = useState<string>("No claim started yet.");

  const [registryAddress, setRegistryAddress] = useState<string>("");
  const [claimTarget, setClaimTarget] = useState<string>("");
  const [deathCert, setDeathCert] = useState<File | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  const networkName = useMemo(() => "Ethereum Mainnet", []);

  useEffect(() => {
    try {
      const r = localStorage.getItem(LS_KEYS.reg);
      if (r) setRegistryAddress(r);
    } catch {}
  }, []);

  function showAlert(type: AlertType, msg: string) {
    setAlert({ type, msg });
  }
  function clearAlert() {
    setAlert(null);
  }

  const getEthersSigner = () => {
    if (!walletClient) throw new Error("Wallet not connected");
    return getBoundSigner(walletClient, address || undefined);
  };

  type AttesterEntry = { public_key: string } & Record<string, any>;
  async function startClaim() {
    clearAlert();
    try {
      const target = claimTarget.trim();
      if (!target) {
        showAlert("warning", "Enter a registration ID.");
        return;
      }

      const regAddr = target.trim();
      if (!/^0x[a-fA-F0-9]{40}$/.test(regAddr)) {
        showAlert("warning", "Set a valid Registry address in Settings.");
        return;
      }

      const phone = phoneNumber.trim();
      if (!phone) {
        showAlert("warning", "Please enter a phone number.");
        return;
      }
      const phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        showAlert("warning", "Please enter a valid phone number with at least 10 digits.");
        return;
      }

      const emailValue = email.trim();
      if (!emailValue) {
        showAlert("warning", "Please enter an email address.");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailValue)) {
        showAlert("warning", "Please enter a valid email address.");
        return;
      }

      // Optional cert hash (no upload, compute locally)
      let deathCertHash = ZERO32;
      const file = deathCert;
      if (file) {
        const buf = new Uint8Array(await file.arrayBuffer());
        deathCertHash = ethers.utils.keccak256(buf);
      }

      if (!walletClient || !address) {
        showAlert("warning", "Please connect your wallet using the button in the header.");
        return;
      }
      
      await ensureAccountsOn(walletClient);
      const signer = getEthersSigner();

      // check if the safe is registered in the safes contract
      const safes = new ethers.Contract(SAFES_ADDRESS, SAFES_ABI, signer);
      const [owner,, , , attesters] = await safes.get(target);
      if (owner === ethers.constants.AddressZero) { 
        showAlert("warning","Safe not found"); 
        return; 
      }

            //const attestersContract = new ethers.Contract(ATTESTERS_ADDRESS, ATTESTERS_ABI, signer);
      const claims = new ethers.Contract(CLAIMS_ADDRESS, CLAIMS_ABI, signer);
      const feeTokenAddr = await claims.feeToken();
      const token = new ethers.Contract(feeTokenAddr, ERC20_ABI, signer);
      const fee = await claims.registerFee();



    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.miras.global";
    const res = await fetch(`${apiUrl}/index.php?module=attesters&chain=${CHAIN.keyName}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch attesters.txt: ${res.status}`);
    const text = await res.text();
    // Split lines, trim, remove empties and comments
    const lines = text
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.startsWith("#"));

    if (lines.length === 0) {
      console.warn("[Attestors] No entries found in attesters.txt");
      return [] as AttesterEntry[];
    }

    // Shuffle and take up to 3 unique entries
    const shuffled = [...lines].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, Math.min(3, shuffled.length));
    // json parse inside the array
    const parsed: AttesterEntry[] = picked.map(l => JSON.parse(l));
    console.log("[Attestors] picked =>", parsed);

    for (const att of parsed) {
      const pubKeyBytes = att.public_key;
      const payload = JSON.stringify({ phone: phoneDigits, email: emailValue });
      const encrypted = encryptString(pubKeyBytes, payload);

      const encryptedSafe = encryptString(pubKeyBytes, target);
      
        /*
        console.log("Checking attester", att);
        const [, pubKeyBytes, , , , exists] = await attestersContract.getAttester(att);
        console.log("exists", exists);
        console.log("pubKeyBytes", pubKeyBytes);
        console.log("pubKeyBytes length", pubKeyBytes.length);
        if (!exists || !pubKeyBytes || pubKeyBytes.length === 0) continue;

        const payload = JSON.stringify({ phone: phoneDigits, email: emailValue });
        const encrypted = encryptString(pubKeyBytes, payload);
*/
        const allowance = await token.allowance(address, CLAIMS_ADDRESS);
        if (allowance.lt(fee)) {
          const txApprove = await token.approve(CLAIMS_ADDRESS, fee);
          await txApprove.wait();
        }

        console.log("Creating claim for attester", att);
        console.log("Encrypted payload:", encrypted);
        console.log("Fee:", fee);
        console.log("Safe:", target);
        console.log("Death cert hash:", deathCertHash);
        console.log("Target:", target);
        console.log("Attester:", att);
        console.log("Encrypted Safe:", encryptedSafe);
        console.log("Fee:", fee);
        const tx = await claims.createClaim(encryptedSafe, att.address, encrypted, fee);
        await tx.wait();
        console.log("Claim created with tx hash", tx.hash);
        showAlert("success", "Claim initiated on-chain with tx hash: " + encryptedSafe + ". Record ID: " + tx.hash + " to track status.");
      }

      /*
      // Gasless variant: fetch attesters from API (like Launch page) and encrypt payload for each
      type AttesterEntry = { public_key: string } & Record<string, any>;
      const chainKey = chainId === 1 ? "mainnet" : "testnet";
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.miras.global";
      const res = await fetch(`${apiUrl}/attesters.php?chain=${chainKey}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to fetch attesters: ${res.status}`);
      const text = await res.text();
      const lines = text
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l.length > 0 && !l.startsWith("#"));
      const picked = [...lines].sort(() => Math.random() - 0.5).slice(0, Math.min(3, lines.length));
      const parsed: AttesterEntry[] = picked.map(l => JSON.parse(l));

      const payload = JSON.stringify({ phone: phoneDigits, email: emailValue, safe: target });
      const ciphertextsB64 = parsed.map(p => {
        try {
          const pubUncompressed = normalizeUncompressedPublicKeyHex(p.public_key);
          return encryptString(pubUncompressed, payload);
        } catch (e) {
          console.warn("[Claim] invalid attester public key, skipping", p.public_key, e);
          return null;
        }
      }).filter(Boolean) as string[];

      console.log("[Claim] prepared encrypted payloads for attesters:", ciphertextsB64);
      // TODO: Submit ciphertexts to a backend to notify attesters off-chain, if available.
      */

      
      setStatus("Claim started (gasless). Waiting for attester responses and timelock.");
    } catch (err) {
      console.error(err);
      showAlert("danger", "Failed to start claim.");
    }
  }

  async function trackStatus() {
    clearAlert();
    try {
      const trackId = window.prompt("Please enter tracking ID");

      if (!walletClient || !address) {
        showAlert("warning", "Please connect your wallet using the button in the header.");
        return;
      }
      
      await ensureAccountsOn(walletClient);
      const signer = getEthersSigner();


      const provider = getBoundProvider(walletClient);
      const registry = new ethers.Contract(CLAIMS_ADDRESS, CLAIMS_ABI, signer);
      const res = await registry.getClaimBySafeId(trackId);
const [claimer, encryptedSafe, attestor, encryptedPhone, createdAt, status] = res as [
  string,
  string,
  string,
  string,
  ethers.BigNumber,
  ethers.BigNumber
];

const toNum = (v: any): number => {
  if (v && typeof v.toNumber === "function") return v.toNumber();
  if (typeof v === "bigint") return Number(v);
  return Number(v);
};

const createdAtVal = toNum(createdAt);
const statusVal = toNum(status);

setStatus(
  `Claimer: ${claimer} | Attestor: ${attestor} | CreatedAt: ${createdAtVal} | Status: ${statusVal}`
);
    } catch (err) {
      console.error(err);
      showAlert("danger", "Failed to query status.");
    }
  }

  return (
    <>
      <header className="hero-gradient text-white py-5">
        <div className="container py-3">
          <h1 className="display-6 fw-bold mb-2">Start a Claim</h1>
          <p className="lead text-white-50 mb-0">
            Begin the inheritance process for a Safe, submit required documentation, and track progress.
          </p>
        </div>
      </header>

      <section className="py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card p-4 p-md-5">
                <div className="card-body">
                  <div className={`alert ${alert ? `alert-${alert.type}` : "d-none"}`} role="alert">
                    {alert?.msg}
                  </div>

                  {account && (
                    <div className="mb-4">
                      <div className="small text-secondary">
                        Connected: <span className="font-monospace">{account}</span>
                        {chainId ? ` (chain ${chainId})` : ""}
                      </div>
                    </div>
                  )}
                  {!account && (
                    <div className="alert alert-info mb-4" role="alert">
                      <i className="bi bi-info-circle me-2"></i>
                      Please connect your wallet using the button in the header to continue.
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label">Safe Address</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="0x..."
                      value={claimTarget}
                      onChange={(e) => setClaimTarget(e.target.value)}
                    />
                  </div>

{/*
                  <div className="mb-3">
                    <label className="form-label">Death Certificate (optional)</label>
                    <input
                      type="file"
                      className="form-control"
                      accept="application/pdf,image/*"
                      onChange={(e) => setDeathCert(e.target.files?.[0] || null)}
                    />
                    <div className="form-text">If the policy requires a certificate, we compute its hash locally and submit only the hash.</div>
                  </div>
                  */}

                  <div className="mb-3">
                    <label className="form-label">Phone Number <span className="text-danger">*</span></label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="+1 (555) 123-4567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                    <div className="form-text">This is how they&apos;ll contact you regarding the claim verification.</div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Email <span className="text-danger">*</span></label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <div className="form-text">This is how they&apos;ll contact you regarding the claim verification.</div>
                  </div>

                  <div className="d-flex flex-wrap gap-2">
                    <button className="btn btn-primary" onClick={startClaim}>
                      <i className="bi bi-flag"></i> Start Claim
                    </button>
                    
                  </div>

                  <hr />
                  <h6 className="fw-bold">Status</h6>
                  <div className="small text-muted">{status}</div>
                  <br />
                  <button className="btn btn-outline-secondary" onClick={trackStatus}>
                      <i className="bi bi-search"></i> Track Status
                    </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
