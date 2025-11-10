"use client";

import { useEffect, useState } from "react";
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from "ethers";
import { encryptString as encStr, decryptString as decStr } from '@/lib/crypto';
import { getBoundSigner, ensureAccountsOn } from '@/lib/wallet';
import { CHAIN } from "@/lib/config";

// Network configuration from centralized config
const REGISTRY_CHAIN = {
  name: CHAIN.name,
  explorer: CHAIN.explorer,
  registry: CHAIN.attestersProxy,
};

type AttesterProfile = {
  name: string;
  email: string;
  website: string;
  phone: string;
};

type AttesterKeys = {
  priv: string;
  pub: string; // uncompressed public key hex (0x04...)
};

export default function RegisterPage(){
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [profile, setProfile] = useState<AttesterProfile>({ name: "", email: "", website: "", phone: "" });
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [keys, setKeys] = useState<AttesterKeys | null>(null);
  const [keysConfirmed, setKeysConfirmed] = useState(false);
  const [keystoreJson, setKeystoreJson] = useState<string | null>(null);
  const [staking, setStaking] = useState(false);
  const [stakeTx, setStakeTx] = useState<string | null>(null);
  const [stakeError, setStakeError] = useState<string | null>(null);

  const STORAGE_KEY_PROFILE = "miras_attester_profile";
  const STORAGE_KEY_PUBKEY = "miras_attester_pubkey";
  const STORAGE_KEY_KEYSTORE = "miras_attester_keystore"; // encrypted JSON v3
  const STORAGE_KEY_KEYS_CONFIRMED = "miras_attester_keys_confirmed";

  // Prefill from storage if available (backward compatible with older schema {contact, policy})
  useEffect(() => {
    if (typeof window === "undefined") return;
    try{
      const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (raw){
        const parsed = JSON.parse(raw) as any;
        setProfile({
          name: parsed?.name || "",
          email: parsed?.email || parsed?.contact || "",
          website: parsed?.website || "",
          phone: parsed?.phone || "",
        });
        setSaved(Boolean((parsed?.name || parsed?.email || parsed?.contact || parsed?.website || parsed?.phone)));
      }
    }catch{}

    try{
      const pub = localStorage.getItem(STORAGE_KEY_PUBKEY);
      const ks = localStorage.getItem(STORAGE_KEY_KEYSTORE);
      if (pub){
        // only restore public from storage; no plaintext private key is stored
        setKeys(k => ({ priv: k?.priv || "", pub } as AttesterKeys));
      }
      if (ks){ setKeystoreJson(ks); }
    }catch{}

    try{
      const c = localStorage.getItem(STORAGE_KEY_KEYS_CONFIRMED);
      setKeysConfirmed(c === "true");
    }catch{}

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).encryptString = encStr;
      (window as any).decryptString = decStr;
      (window as any).mirasCrypto = { encryptString: encStr, decryptString: decStr };
    }
    return () => {
      if (typeof window !== "undefined") {
        try {
          delete (window as any).encryptString;
          delete (window as any).decryptString;
          delete (window as any).mirasCrypto;
        } catch {}
      }
    };
  }, []);

  function canSave(){
    const nameOk = profile.name.trim().length > 0;
    const emailOk = (() => {
      const v = profile.email.trim();
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
      return v.length > 0 && re.test(v);
    })();
    return nameOk && emailOk;
  }

  function validateProfile(){
    const errs: string[] = [];
    const name = profile.name.trim();
    const email = profile.email.trim();
    const website = profile.website.trim();
    const phone = profile.phone.trim();
    if (name.length === 0) errs.push("Display Name is required");
    if (email.length === 0) {
      errs.push("Email is required");
    } else {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
      if (!re.test(email)) errs.push("Email format is invalid");
    }
    if (website.length > 0) {
      try{
        const u = new URL(website);
        if (!(u.protocol === 'http:' || u.protocol === 'https:')) throw new Error();
      }catch{
        errs.push("Website must be a valid http(s) URL");
      }
    }
    if (phone.length > 0) {
      const rePhone = /^\+?[0-9 ()-]{7,}$/;
      if (!rePhone.test(phone)) errs.push("Phone number looks invalid");
    }
    return { ok: errs.length === 0, errs };
  }

  function ensureKeysExist(): AttesterKeys{
    if (keys?.priv && keys?.pub) return keys;
    const wallet = ethers.Wallet.createRandom();
    const priv = wallet.privateKey; // 0x...
    const pub = wallet._signingKey().publicKey; // uncompressed 0x04...
    const pair: AttesterKeys = { priv, pub };
    try{ localStorage.setItem(STORAGE_KEY_PUBKEY, pub); }catch{}
    setKeys(pair);
    return pair;
  }

  async function onSaveProfile(){
    setSaving(true);
    try{
      const v = validateProfile();
      if (!v.ok){
        alert(v.errs.join("\n"));
        return;
      }
      if (typeof window !== "undefined"){
        localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
      }
      // generate keys only if not created before (does not store plaintext private key)
      const pair = ensureKeysExist();
      setSaved(true);

      // Prompt for passphrase right after saving profile
      const pass = window.prompt("Set a passphrase to encrypt your private key (min 8 characters). This protects your keystore.");
      if (pass && pass.length >= 8){
        try{
          const wallet = new ethers.Wallet(pair.priv);
          const json = await wallet.encrypt(pass);
          setKeystoreJson(json);
          try{ localStorage.setItem(STORAGE_KEY_KEYSTORE, json); }catch{}
        }catch{}
      } else if (pass !== null) {
        // user entered but too short
        alert("Passphrase too short. You can click 'Save Profile' again later to set a passphrase and create the keystore.");
      }
    }finally{ setSaving(false); }
  }

  function onDownloadKeystore(){
    if (!keystoreJson) return;
    const blob = new Blob([keystoreJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `miras-attester-keystore.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function onConfirmKeysSaved(){
    // Only allow confirmation after a keystore exists
    if (!keystoreJson) return;
    setKeysConfirmed(true);
    try{ localStorage.setItem(STORAGE_KEY_KEYS_CONFIRMED, "true"); }catch{}
  }

  async function onApproveAndStake(){
    setStakeError(null);
    setStakeTx(null);
    if (!keysConfirmed){ return; }
    if (!walletClient || !address){ setStakeError("Please connect your wallet using the button in the header."); return; }
    if (!keys?.pub){ setStakeError("Public key not found. Save profile to generate keys."); return; }
    try{
      setStaking(true);
      await ensureAccountsOn(walletClient);
      const signer = getBoundSigner(walletClient, address);
      // Contract setup
      const REGISTRY_ADDR = ethers.utils.getAddress(REGISTRY_CHAIN.registry);
      
      const ABI = [
  "function registerFee() view returns (uint256)",
  "function feeToken() view returns (address)",
  "function upsertAttester(string publicKey,string name,string meta,uint256 amount)"
];
      const contract = new ethers.Contract(REGISTRY_ADDR, new ethers.utils.Interface(ABI), signer);

      // Query required fee
      const fee: ethers.BigNumber = await contract.registerFee();
      const tokenAddr: string = await contract.feeToken();
      const erc20 = new ethers.Contract(
        tokenAddr,
        [
          "function approve(address spender, uint256 amount) returns (bool)"
        ],
        signer
      );

      // Approve registry to pull the fee
      await (await erc20.approve(REGISTRY_ADDR, fee)).wait();

      // Build meta JSON
      const metaObj = {
        email: profile.email,
        website: profile.website,
        phone: profile.phone,
        ts: new Date().toISOString(),
      };
      const meta = JSON.stringify(metaObj);

      // Ensure public key hex (0x04...)
      const pubHex = keys.pub.startsWith("0x") ? keys.pub : ("0x" + keys.pub);

      


      const tx = await contract.upsertAttester(pubHex, profile.name, meta, fee);
      setStakeTx(tx.hash);
      await tx.wait();
    }catch(e:any){
      const msg = e?.error?.message || e?.reason || e?.message || String(e);
      setStakeError(msg);
    }finally{
      setStaking(false);
    }
  }

  return (
    <section className="py-5">
      <div className="container">
        <header className="mb-4 text-center">
          <h1 className="fw-bold section-title">Register as Attester</h1>
          <p className="text-secondary">Create your profile and prepare your staking commitment.</p>
        </header>

        {/* Why become an Attester */}
        <div className="alert alert-info" role="alert">
          <h5 className="alert-heading mb-2">Why become an Attester?</h5>
          <ul className="mb-2">
            <li><strong>Earn per claim</strong>: Receive fees for each claim you review and attest.</li>
            <li><strong>Lightweight work</strong>: Verify evidence and attest—simple, review-style tasks.</li>
            <li><strong>Your stake remains yours</strong>: You do not lose your crypto unless you are <em>slashed</em> for egregious mistakes or bad faith.</li>
            <li><strong>Future rewards</strong>: You may become eligible for governance tokens in the future <em>(not guaranteed)</em>.</li>
          </ul>
          <small className="text-secondary d-block">Registry contract: <a target="_blank" rel="noopener" href={`${REGISTRY_CHAIN.explorer}/address/${REGISTRY_CHAIN.registry}`}>{REGISTRY_CHAIN.registry}</a> on {REGISTRY_CHAIN.name}</small>
        </div>

        <div className="row g-3">
          {/* Step 1: Public Profile */}
          <div className="col-12 col-lg-7">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">Step 1 — Public Profile</h5>
                <div className="mb-3">
                  <label className="form-label">Display Name</label>
                  <input
                    className="form-control"
                    placeholder="Your name or organization"
                    value={profile.name}
                    onChange={(e)=>setProfile(p=>({...p, name:e.target.value}))}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="you@example.com"
                    value={profile.email}
                    onChange={(e)=>setProfile(p=>({...p, email:e.target.value}))}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Website</label>
                  <input
                    className="form-control"
                    placeholder="https://..."
                    value={profile.website}
                    onChange={(e)=>setProfile(p=>({...p, website:e.target.value}))}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="+1 555 123 4567"
                    value={profile.phone}
                    onChange={(e)=>setProfile(p=>({...p, phone:e.target.value}))}
                  />
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button className="btn btn-primary" onClick={onSaveProfile} disabled={!loaded || saving || !canSave()}>
                    {saving ? 'Saving…' : 'Save Profile'}
                  </button>
                  {saved && <span className="badge bg-success">Saved</span>}
                </div>
                {!canSave() && (
                  <p className="small text-secondary mt-2 mb-0">Enter at least Display Name and Email to continue.</p>
                )}
              </div>
            </div>
          </div>

          {/* Step 2: Your Attester Keys (generated locally) */}
          <div className="col-12 col-lg-5">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">Step 2 — Your Attester Keys</h5>
                <p className="text-secondary">Keys are generated in your browser. After saving your profile, you&apos;ll be prompted to set a passphrase to encrypt your private key.</p>
                <div className="mb-3">
                  <label className="form-label">Public Key</label>
                  <textarea className="form-control" rows={2} readOnly placeholder="Click Save Profile to generate"
                    value={keys?.pub || ""}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Private Key</label>
                  <textarea className="form-control" rows={2} readOnly placeholder="Click Save Profile to generate"
                    value={keys?.priv || ""}
                  />
                </div>
                <div className="d-flex flex-wrap gap-2 mt-2">
                  <button className="btn btn-outline-primary" disabled={!keystoreJson} onClick={onDownloadKeystore}><i className="bi bi-download"></i> Download Keystore (JSON)</button>
                  <button className="btn btn-outline-success" disabled={!keystoreJson || keysConfirmed} onClick={onConfirmKeysSaved}>{keysConfirmed ? 'Saved ✓' : 'I saved these'}</button>
                </div>
                {!keys && <p className="small text-secondary mt-2 mb-0">Generate keys by saving your profile in Step 1.</p>}
                {!keystoreJson && keys && <p className="small text-warning mt-2 mb-0">You have not created a keystore yet. Click &quot;Save Profile&quot; again to set your passphrase and create the encrypted keystore.</p>}
                {keystoreJson && <p className="small text-secondary mt-2 mb-0">Encrypted keystore saved locally. You can also download it.</p>}
              </div>
            </div>
          </div>

          {/* Step 3: Stake */}
          <div className="col-12">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">Step 3 — Stake</h5>
                <p className="text-secondary">Minimum commitment <span className="price">100 MRS</span> <span className="pill">subject to change</span></p>
                <div className="mb-3" style={{maxWidth: 320}}>
                  <label className="form-label">Amount</label>
                  <input type="number" className="form-control" placeholder="100" value={100} disabled />
                </div>
                <button
                  className="btn btn-success"
                  disabled={!keysConfirmed || staking}
                  onClick={onApproveAndStake}
                  title={keysConfirmed ? undefined : 'Confirm you saved your keys (Step 2) to continue'}
                >
                  {staking ? 'Submitting…' : 'Approve & Stake'}
                </button>
                {stakeTx && (
                  <p className="small text-secondary mt-2 mb-0">Transaction sent: <a href={`${REGISTRY_CHAIN.explorer}/tx/${stakeTx}`} target="_blank" rel="noopener">{stakeTx}</a></p>
                )}
                {stakeError && (
                  <p className="small text-danger mt-2 mb-0">{stakeError}</p>
                )}
                {!keysConfirmed && (
                  <p className="small text-secondary mt-2 mb-0">Confirm you saved your keys in Step 2 to enable staking.</p>
                )}
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title mb-2">Requirements</h5>
                <ul className="mb-0">
                  <li>10 MRS minimum stake (subject to change)</li>
                  <li>Public profile</li>
                  <li>Securely store your attester keys</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
