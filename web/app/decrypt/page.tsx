"use client";

import { useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import { encryptString as encStr, decryptString as decStr } from "@/lib/crypto";

export default function DecryptPage() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<string>("");
  const [addr, setAddr] = useState<string>("");
  const [pub, setPub] = useState<string>("");
  const [priv, setPriv] = useState<string>("");
  const [derivePriv, setDerivePriv] = useState<string>("");
  const [derivePub, setDerivePub] = useState<string>("");
  const [cipher, setCipher] = useState<string>("");
  const [plain, setPlain] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).encryptString = encStr;
      (window as any).decryptString = decStr;
      (window as any).mirasCrypto = { encryptString: encStr, decryptString: decStr };
      (window as any).derivePubFromPriv = (priv: string) => new ethers.Wallet(priv)._signingKey().publicKey;
    }
    return () => {
      if (typeof window !== "undefined") {
        try {
          delete (window as any).encryptString;
          delete (window as any).decryptString;
          delete (window as any).mirasCrypto;
          delete (window as any).derivePubFromPriv;
        } catch {}
      }
    };
  }, []);

  async function onPickFile() {
    if (!fileRef.current) return;
    fileRef.current.value = "";
    fileRef.current.click();
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setStatus("Reading file…");
      const text = await file.text();
      const passphrase = prompt("Enter passphrase for the keystore:");
      if (passphrase == null) {
        setStatus("Cancelled");
        return;
      }

      setStatus("Decrypting keystore…");
      const wallet = await ethers.Wallet.fromEncryptedJson(text, passphrase);
      const privHex = wallet.privateKey; // 0x...
      const pubHex = wallet._signingKey().publicKey; // 0x04...
      const address = await wallet.getAddress();

      setPriv(privHex);
      setPub(pubHex);
      setAddr(address);
      setStatus("Decrypted successfully");

      if (typeof window !== "undefined") {
        (window as any).mirasTest = { priv: privHex, pub: pubHex, addr: address };
        console.log("mirasTest available on window:", (window as any).mirasTest);
        console.log("mirasCrypto available on window:", (window as any).mirasCrypto);
      }
    } catch (err: any) {
      console.error(err);
      setStatus(err?.message || "Error decrypting keystore");
    }
  }

  function onDerivePub() {
    try {
      const input = derivePriv.trim();
      if (!input) { setDerivePub(""); return; }
      const w = new ethers.Wallet(input);
      const p = w._signingKey().publicKey; // 0x04...
      setDerivePub(p);
      if (typeof window !== "undefined") {
        (window as any).mirasDerived = { priv: input, pub: p };
        console.log("mirasDerived available on window:", (window as any).mirasDerived);
      }
    } catch (e: any) {
      setDerivePub(`Error: ${e?.message || String(e)}`);
    }
  }

  function onDecrypt() {
    try {
      const k = derivePriv.trim();
      const c = cipher.trim();
      if (!k || !c) { setPlain(""); return; }
      const p = decStr(k, c);
      setPlain(p);
    } catch (e: any) {
      setPlain(`Error: ${e?.message || String(e)}`);
    }
  }

  return (
    <section className="py-5">
      <div className="container">
        <header className="mb-4">
          <h1 className="fw-bold">Decrypt</h1>
          <p className="text-secondary mb-0">
            Upload your ethers keystore JSON, decrypt with passphrase, and expose keys to the console.
          </p>
        </header>

        <div className="card">
          <div className="card-body">

            <div className="mt-4">
              <h6>Derive public key from private key</h6>
              <div className="mb-2">
                <label className="form-label mb-1">Private Key (0x...)</label>
                <input
                  className="form-control"
                  placeholder="0x..."
                  value={derivePriv}
                  onChange={(e) => setDerivePriv(e.target.value)}
                />
              </div>
              <div className="d-flex gap-2 align-items-center mb-2">
                <button className="btn btn-outline-primary" onClick={onDerivePub}>Derive Public Key</button>
                <span className="text-secondary small">Also exposed as window.derivePubFromPriv(priv)</span>
              </div>
              <div className="mb-2">
                <label className="form-label mb-1">Derived Public Key (uncompressed 0x04...)</label>
                <textarea className="form-control" rows={3} readOnly value={derivePub} placeholder="—" />
              </div>
            </div>

            <hr className="my-4" />

            <div className="mt-4">
              <h6>Decrypt message</h6>
              <div className="mb-2">
                <label className="form-label mb-1">Ciphertext (base64)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Base64 ciphertext"
                  value={cipher}
                  onChange={(e) => setCipher(e.target.value)}
                />
              </div>
              <div className="d-flex gap-2 align-items-center mb-2">
                <button className="btn btn-primary" onClick={onDecrypt}>Decrypt</button>
                <span className="text-secondary small">Uses the private key entered above</span>
              </div>
              <div className="mb-2">
                <label className="form-label mb-1">Plaintext</label>
                <textarea className="form-control" rows={3} readOnly value={plain} placeholder="—" />
              </div>
            </div>

            <div>
              <h6>Console helpers</h6>
              <ul className="mb-2">
                <li><code>window.mirasTest</code> → {`{ priv, pub, addr }`}</li>
                <li><code>window.encryptString(pub, msg)</code></li>
                <li><code>window.decryptString(priv, b64)</code></li>
                <li><code>window.mirasCrypto</code> → {`{ encryptString, decryptString }`}</li>
              </ul>
              <pre className="small bg-light p-2 rounded mb-0">{`// Example in Chrome console:
// After upload:
const b64 = encryptString(mirasTest.pub, "hello");
const msg = decryptString(mirasTest.priv, b64);
console.log({ b64, msg });`}</pre>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
