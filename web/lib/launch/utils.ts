import { ethers } from "ethers";
import { CHAIN } from "@/lib/config";

export function humanizeEthersError(err: any) {
  const rejected = err?.code === 'ACTION_REJECTED' || err?.code === 4001 || /user rejected/i.test(err?.message || '');
  if (rejected) return { type: 'warning' as const, msg: 'You cancelled the transaction in your wallet.' };
  const raw = err?.reason || err?.error?.message || err?.message || String(err);
  const cleaned = (raw || '').replace(/\s*\(version=[^)]+\)\s*$/, '').trim();
  if (/insufficient funds/i.test(cleaned)) return { type: 'danger' as const, msg: 'Insufficient funds for gas (ETH). Add ETH and try again.' };
  if (/nonce/i.test(cleaned) && /too low/i.test(cleaned)) return { type: 'danger' as const, msg: 'Nonce too low. Try again or reset nonce in your wallet.' };
  return { type: 'danger' as const, msg: cleaned || 'Unknown error' };
}

export function createEnsureNetwork(
  chain: any,
  switchChainAsync: any,
  showAlert: (type: "success" | "info" | "warning" | "danger" | "secondary", msg: string) => void
) {
  return async () => {
    if (!chain) {
      return;
    }
    if (chain.id !== CHAIN.id) {
      try {
        await switchChainAsync({ chainId: CHAIN.id });
      } catch (e: any) {
        showAlert("danger", e?.message || "Failed to switch network");
      }
    }
  };
}

export function createGetEthersSigner(walletClient: any, account: string | null) {
  return () => {
    if (!walletClient) throw new Error("Wallet not connected");
    const eip1193: any = (walletClient as any).provider ?? (walletClient as any);
    const provider = new ethers.providers.Web3Provider(eip1193, 'any');
    return account ? provider.getSigner(account) : provider.getSigner();
  };
}

export function createEnsureAccounts(walletClient: any) {
  return async () => {
    if (!walletClient) throw new Error("Wallet not connected");
    const eip1193: any = (walletClient as any).provider ?? (walletClient as any);
    const provider = new ethers.providers.Web3Provider(eip1193, 'any');
    const accounts = await provider.listAccounts();
    if (!accounts || accounts.length === 0) {
      if (typeof eip1193?.request === 'function') {
        await eip1193.request({ method: 'eth_requestAccounts', params: [] });
      } else {
        await provider.send('eth_requestAccounts', []);
      }
    }
  };
}
