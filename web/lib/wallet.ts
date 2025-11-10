"use client";

import { ethers } from "ethers";

export type WalletState = {
  account: string | null;
  chainId: number | null;
};

// --- Legacy helpers (window.ethereum) ---
export function hasEthereum(): boolean {
  return typeof window !== "undefined" && typeof (window as any).ethereum !== "undefined";
}

export async function requestAccounts(): Promise<string[]> {
  if (!hasEthereum()) throw new Error("No Ethereum provider found. Install MetaMask.");
  const eth = (window as any).ethereum;
  const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
  return accounts;
}

export function getBrowserProvider(): ethers.providers.Web3Provider {
  if (!hasEthereum()) throw new Error("No Ethereum provider found. Install MetaMask.");
  const eth = (window as any).ethereum;
  return new ethers.providers.Web3Provider(eth, 'any');
}

export function getSigner(): ethers.Signer {
  const provider = getBrowserProvider();
  const signer = provider.getSigner();
  return signer;
}

export async function getNetworkChainId(): Promise<number> {
  const provider = getBrowserProvider();
  const network = await provider.getNetwork();
  // In ethers v5, network.chainId is a number
  return Number((network as any).chainId ?? network.chainId);
}

export function getContract(
  address: string,
  abi: any,
  signerOrProvider?: ethers.Signer | ethers.providers.Provider
) {
  const sp = signerOrProvider ?? getBrowserProvider();
  return new ethers.Contract(address, abi, sp);
}

export async function connectWallet(): Promise<WalletState> {
  const accounts = await requestAccounts();
  const account = accounts?.[0] ?? null;
  const chainId = await getNetworkChainId();
  return { account, chainId };
}

// --- Wagmi-bound helpers (use the connected wallet's provider) ---
export function getBoundEip1193(walletClient: any): any {
  return (walletClient as any)?.transport || (walletClient as any)?.provider || walletClient;
}

export function getBoundProvider(walletClient: any): ethers.providers.Web3Provider {
  const eip1193 = getBoundEip1193(walletClient);
  return new ethers.providers.Web3Provider(eip1193, 'any');
}

export function getBoundSigner(walletClient: any, account?: string | null): ethers.Signer {
  const provider = getBoundProvider(walletClient);
  return account ? provider.getSigner(account) : provider.getSigner();
}

export async function ensureAccountsOn(walletClient: any): Promise<void> {
  const eip1193 = getBoundEip1193(walletClient);
  if (typeof eip1193?.request === 'function') {
    await eip1193.request({ method: 'eth_requestAccounts', params: [] });
  } else {
    const provider = getBoundProvider(walletClient);
    await provider.send('eth_requestAccounts', []);
  }
}

export function getContractBound(
  walletClient: any,
  address: string,
  abi: any
) {
  const provider = getBoundProvider(walletClient);
  return new ethers.Contract(address, abi, provider);
}

// --- Namespaced Safe storage key helpers ---
export function getSafeNamespaceKey(chainKeyName: string, account: string): string {
  return `miras_safe_address_${chainKeyName}-${ethers.utils.getAddress(account)}`;
}

export function readSafeFromStorage(chainKeyName: string, account: string): string | null {
  const key = getSafeNamespaceKey(chainKeyName, account);
  try { return localStorage.getItem(key); } catch { return null; }
}

export function writeSafeToStorage(chainKeyName: string, account: string, safeAddr: string): void {
  const key = getSafeNamespaceKey(chainKeyName, account);
  try { localStorage.setItem(key, safeAddr); } catch {}
}
