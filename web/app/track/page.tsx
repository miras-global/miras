"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from "ethers";
import { getBoundProvider, hasEthereum, getBrowserProvider } from "@/lib/wallet";
import { CHAIN } from "@/lib/config";
import { decryptString } from "@/lib/crypto";

// Minimal ABI for ClaimsDB v3.1 (encryptedSafe + attester scan)
const CLAIMS_DB_ABI = [
  "function getClaimsByAttester(address) view returns (uint256[] outIds, address[] claimers, string[] encryptedSafes, address[] attestors, string[] encryptedPhones, uint64[] createdAts, uint8[] statuses)"
] as const;


function statusToLabel(s: number): string {
  switch (s) {
    case 0: return "Pending";
    case 1: return "Approved";
    case 2: return "Rejected";
    case 3: return "Cancelled";
    default: return `Unknown(${s})`;
  }
}

type ClaimRow = {
  id: number;
  claimer: string;
  safe: string;
  attestor: string;
  createdAt: number;
  status: number;
};

export default function TrackPage() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const account = address || null;
  
  const [contractAddress, setContractAddress] = useState<string>(CHAIN.claimsProxy);
  const [attestor, setAttestor] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [results, setResults] = useState<ClaimRow[]>([]);
  const [scanned, setScanned] = useState<number>(0);

  const normalizedAttestor = useMemo(() => attestor.trim().toLowerCase(), [attestor]);

  const useConnectedAsAttestor = useCallback(() => {
    if (address) {
      setAttestor(address);
    } else {
      setError("Please connect your wallet using the button in the header.");
    }
  }, [address]);


  const fetchClaims = useCallback(async () => {
    setError("");
    setLoading(true);
    setResults([]);
    setScanned(0);
    try {
      if (!ethers.utils.isAddress(contractAddress)) {
        throw new Error("Invalid ClaimsDB address");
      }
      if (!ethers.utils.isAddress(attestor)) {
        throw new Error("Invalid attestor address");
      }

      // Load attester keystore from localStorage and prompt for passphrase
      let keystoreJson: string | null = null;
      try { keystoreJson = localStorage.getItem("miras_attester_keystore"); } catch {}
      if (!keystoreJson) {
        throw new Error("Attester keystore not found in localStorage (miras_attester_keystore)");
      }
      const pass = window.prompt("Enter your attester keystore passphrase to decrypt Safe IDs");
      if (pass == null) {
        throw new Error("Passphrase entry cancelled");
      }
      const wallet = await ethers.Wallet.fromEncryptedJson(keystoreJson, pass);
      const priv = wallet.privateKey;

      const provider = walletClient
        ? getBoundProvider(walletClient)
        : (hasEthereum() ? getBrowserProvider() : new ethers.providers.StaticJsonRpcProvider(CHAIN.rpc, { chainId: CHAIN.id, name: CHAIN.name }));
      
      const network = await provider.getNetwork();
      console.log('Detected network:', network);
      console.log('Expected network:', CHAIN);
      
      if (network.chainId !== CHAIN.id) {
        throw new Error(`Wrong network! Connected to chainId ${network.chainId} but expected ${CHAIN.id} (${CHAIN.name}). Please switch your wallet to ${CHAIN.name}.`);
      }
      
      const contract = new ethers.Contract(contractAddress, CLAIMS_DB_ABI as any, provider);
      
      console.log('Calling getClaimsByAttester with attestor:', attestor);
      console.log('Contract address:', contractAddress);
      console.log('Provider:', provider);
      
      const [outIds, claimers, encryptedSafes, attestors, encryptedPhones, createdAts, statuses] = await (contract as any).getClaimsByAttester(attestor);

      const rows: ClaimRow[] = [];
      for (let i = 0; i < outIds.length; i++) {
        const id = Number(outIds[i]);
        let safeDecrypted = "";
        try { 
          console.log(`Decrypting claim ${id}, encrypted safe:`, encryptedSafes[i]);
          console.log(`Private key:`, priv);
          safeDecrypted = decryptString(priv, encryptedSafes[i]); 
          console.log(`Successfully decrypted claim ${id}:`, safeDecrypted);
        } catch (e) {
          console.error(`Failed to decrypt claim ${id}:`, e);
          console.error(`Encrypted data:`, encryptedSafes[i]);
          console.error(`Private key length:`, priv.length);
        }
        rows.push({
          id,
          claimer: claimers[i],
          safe: safeDecrypted || "(decrypt failed)",
          attestor: attestors[i],
          createdAt: Number(createdAts[i]),
          status: Number(statuses[i]),
        });
        if (i % 25 === 0) setScanned(i + 1);
      }

      setResults(rows);
      setScanned(outIds.length);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [attestor, contractAddress, walletClient]);

  return (
    <div className="container my-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h4 m-0">Attester Claims Tracker</h1>
        {account && <span className="text-muted small">Connected: {account}</span>}
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label">ClaimsDB Contract Address</label>
              <input
                type="text"
                className="form-control"
                value={contractAddress}
                placeholder="0x..."
                onChange={(e) => setContractAddress(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">Attestor Address</label>
              <input
                type="text"
                className="form-control"
                value={attestor}
                placeholder="0x..."
                onChange={(e) => setAttestor(e.target.value)}
              />
            </div>
            <div className="col-12 d-flex gap-2">
              <button className="btn btn-primary" onClick={useConnectedAsAttestor}>
                Use Connected Wallet as Attestor
              </button>
              <button
                className="btn btn-success"
                disabled={loading}
                onClick={fetchClaims}
              >
                {loading ? "Loading..." : "Fetch Claims"}
              </button>
            </div>
            {error && (
              <div className="col-12">
                <div className="alert alert-danger" role="alert">{error}</div>
              </div>
            )}
            {!loading && scanned > 0 && (
              <div className="col-12">
                <div className="text-muted small">Scanned {scanned} ids</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-sm table-striped table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Claimer</th>
                  <th scope="col">Safe</th>
                  <th scope="col">Attestor</th>
                  <th scope="col">Created</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      {loading ? "Fetching..." : "No claims for this attestor (in scanned range)."}
                    </td>
                  </tr>
                )}
                {results.map((r) => (
                  <tr key={r.id}>
                    <td className="fw-monospace">{r.id}</td>
                    <td className="fw-monospace">{r.claimer}</td>
                    <td className="fw-monospace">{r.safe}</td>
                    <td className="fw-monospace">{r.attestor}</td>
                    <td>{new Date(r.createdAt * 1000).toLocaleString()}</td>
                    <td><span className="badge text-bg-secondary">{statusToLabel(r.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <p className="text-muted small mt-3">
        Scans latest IDs first (up to 2000) and lists up to 200 matches. Adjust limits in code if needed.
      </p>
    </div>
  );
}
