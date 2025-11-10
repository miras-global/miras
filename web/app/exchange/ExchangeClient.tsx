'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccount, useWalletClient, useSwitchChain } from 'wagmi';
import { Contract, providers, utils } from "ethers";
import Image from "next/image";
import { NETWORK_CONFIGS } from "@/lib/config";

const STYLE = `
:root{
  --bg:#0b0f19;
  --card:#0f1526;
  --muted:#9aa4bf;
  --text:#e7ecff;
  --accent:#4f7cff;
  --accent-2:#7ef0ff;
  --danger:#ff6b6b;
  --success:#2ce5a7;
  --ring:rgba(127,200,255,.45);
  --input:#121a32;
  --border:#1d2846;
  --shadow:0 10px 25px rgba(6,12,30,.55);
  --radius:18px;
}
*{box-sizing:border-box}
html,body{height:100%}
body{
  margin:0; font-family:Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans", "Apple Color Emoji","Segoe UI Emoji";
  color:var(--text); background:radial-gradient(1200px 800px at 80% -10%, rgba(79,124,255,.25), transparent 60%),
  radial-gradient(1200px 800px at -10% 110%, rgba(126,240,255,.2), transparent 60%), var(--bg);
  display:grid; place-items:center; padding:24px;
}
.center{display:flex; justify-content:center; width:100%;}
.wrap{width:min(920px,100%); margin:0 auto; align-self:center; justify-self:center;}
header{display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:18px;}
.brand{display:flex; align-items:center; gap:12px; font-weight:700; letter-spacing:.3px}
.logo{width:36px; height:36px; border-radius:12px; display:grid; place-items:center; background:conic-gradient(from 210deg at 50% 50%, var(--accent), var(--accent-2)); box-shadow:0 4px 14px rgba(79,124,255,.45);}
.badge{padding:4px 8px; border:1px solid var(--border); border-radius:999px; color:var(--muted); font-size:12px}
.card{background:linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.0)), var(--card); border:1px solid var(--border); border-radius:calc(var(--radius) + 4px); box-shadow:var(--shadow); padding:22px; position:relative; overflow:hidden; color:var(--text);}
.grid{display:grid; grid-template-columns:1.1fr .9fr; gap:18px}
@media (max-width:860px){ .grid{grid-template-columns:1fr;}}
.swap{border:1px solid var(--border); border-radius:var(--radius); padding:18px; background:linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.01));}
.row{display:flex; align-items:center; justify-content:space-between; gap:10px}
.label{font-size:12px; color:var(--muted); letter-spacing:.2px}
.token-box{display:flex; align-items:center; gap:10px; background:var(--input); border:1px solid var(--border); border-radius:14px; padding:10px 12px; min-width:190px}
.token-box img{width:22px; height:22px; border-radius:50%}
.token-box .symbol{font-weight:700}
.amount{flex:1}
.amount input{width:100%; background:var(--input); border:1px solid var(--border); color:var(--text); padding:14px 14px; border-radius:12px; font-size:18px; outline:none; transition:border .2s, box-shadow .2s;}
.amount input:focus{border-color:var(--accent); box-shadow:0 0 0 6px var(--ring)}
.switch{display:grid; place-items:center; margin:14px auto; width:44px; height:44px; border-radius:50%; border:1px dashed var(--border); background:linear-gradient(180deg, rgba(79,124,255,.1), rgba(126,240,255,.06)); cursor:not-allowed; opacity:.8;}
.mini{font-size:12px; color:var(--muted)}
.rate{display:flex; justify-content:space-between; font-size:13px; color:var(--muted); padding-top:8px}
.btn{width:100%; margin-top:14px; padding:14px 16px; border:none; border-radius:14px; cursor:pointer; background:linear-gradient(90deg, var(--accent), var(--accent-2)); color:#0a0f1d; font-weight:800; letter-spacing:.2px; box-shadow:0 10px 22px rgba(79,124,255,.35);}
.btn[disabled]{opacity:.6; cursor:not-allowed;}
.panel{border:1px solid var(--border); border-radius:var(--radius); padding:16px; background:linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,0)); color:var(--text);}
.panel h3{margin:0 0 10px; font-size:16px}
.kv{display:grid; grid-template-columns:1fr auto; gap:10px; font-size:14px}
.kv .k{color:var(--muted)}
.kv .v{font-weight:600}
.notice{margin-top:12px; font-size:12px; color:var(--muted)}
.sep{height:1px; background:linear-gradient(90deg, transparent, var(--border), transparent); margin:12px 0}
footer{margin-top:16px; text-align:center; color:var(--muted); font-size:12px}
a{color:var(--accent-2); text-decoration:none}
.token-row{display:flex; align-items:center; gap:8px}
.pill{font-size:12px; color:var(--muted); border:1px dashed var(--border); border-radius:999px; padding:6px 10px}
.disconnect{font-size:12px; border:none; border-radius:999px; padding:6px 12px; background:rgba(79,124,255,.25); color:var(--text); cursor:pointer; transition:opacity .2s}
.disconnect:hover{opacity:.85}
`;

const CONFIGS: Record<string, {
  CHAIN_ID_HEX: string;
  NETWORK_LABEL: string;
  TOKEN_ADDRESS: string;
  ROUTER_ADDRESS: string;
  ROUTER_ABI: string[];
  ERC20_ABI: string[];
  FIXED_RATE: number;
}> = {
  "0xaa36a7": {
    CHAIN_ID_HEX: "0xaa36a7",
    NETWORK_LABEL: "Ethereum Sepolia",
    TOKEN_ADDRESS: NETWORK_CONFIGS.sepolia.tokenAddress,
    ROUTER_ADDRESS: NETWORK_CONFIGS.sepolia.exchangeAddress,
    ROUTER_ABI: [
      "function buyWhole(uint256 wholeTokens) payable",
      "function buyExact(uint256 tokenAmount) payable",
      "function sellExact(uint256 tokenAmount)",
      "function buyToken(address to) payable"
    ],
    ERC20_ABI: [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
      "function balanceOf(address) view returns (uint256)",
      "function allowance(address owner, address spender) view returns (uint256)",
      "function approve(address spender, uint256 amount) returns (bool)"
    ],
    FIXED_RATE: 10,
  },
  "0x1": {
    CHAIN_ID_HEX: "0x1",
    NETWORK_LABEL: "Ethereum Mainnet",
    TOKEN_ADDRESS: NETWORK_CONFIGS.mainnet.tokenAddress,
    ROUTER_ADDRESS: NETWORK_CONFIGS.mainnet.exchangeAddress,
    ROUTER_ABI: [
      "function buyWhole(uint256 wholeTokens) payable",
      "function buyExact(uint256 tokenAmount) payable",
      "function sellExact(uint256 tokenAmount)",
      "function buyToken(address to) payable"
    ],
    ERC20_ABI: [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
      "function balanceOf(address) view returns (uint256)",
      "function allowance(address owner, address spender) view returns (uint256)",
      "function approve(address spender, uint256 amount) returns (bool)"
    ],
    FIXED_RATE: 10,
  },
};

// Change this to a literal; it no longer depends on CONFIG
const SEPOLIA_CHAIN_METADATA = {
  chainId: "0xaa36a7",
  chainName: "Sepolia",
  nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://rpc.sepolia.org"],
  blockExplorerUrls: ["https://sepolia.etherscan.io"]
};

const MAINNET_CHAIN_METADATA = {
  chainId: "0x1",
  chainName: "Ethereum Mainnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://rpc.flashbots.net", "https://cloudflare-eth.com"],
  blockExplorerUrls: ["https://etherscan.io"]
};

const ETH_LOGO = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 417'><defs><linearGradient id='g' x1='50%' y1='0%' x2='50%' y2='100%'><stop stop-color='%23fff' stop-opacity='.9' offset='0%'/><stop stop-color='%23c9d6ff' offset='100%'/></linearGradient></defs><path fill='url(%23g)' d='M127.6 0L0 214.2 127.6 286l127.6-71.8z'/><path fill='%23fff' d='M127.6 286v129.7l127.7-178.8z'/><path fill='%23c5d4ff' d='M127.6 415.7V286L0 236.9z'/><path fill='%23b3c4ff' d='M0 214.2l127.6 71.8V0z'/></svg>`;

export default function ExchangeClient() {
  const { address, chain } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  
  const account = address || null;
  
  const providerRef = useRef<providers.Web3Provider | null>(null);
  const signerRef = useRef<providers.JsonRpcSigner | null>(null);
  const routerRef = useRef<Contract | null>(null);
  const [amountIn, setAmountIn] = useState("0");
  const [amountOut, setAmountOut] = useState("0");
  const [actionState, setActionState] = useState<"idle" | "connecting" | "swapping">("idle");
  const [implAddress, setImplAddress] = useState<string | null>(null);
  const [chosenMethod, setChosenMethod] = useState<"buyWhole" | "buyToken" | "buyExact" | null>(null);
  const [tokenDecimals, setTokenDecimals] = useState<number>(18);
  const [chainIdHex, setChainIdHex] = useState<string | null>(null);

  const CURRENT = useMemo(() => CONFIGS[chainIdHex ?? "0xaa36a7"], [chainIdHex]);

  const walletLabel = useMemo(() => {
    if (!account) return "Wallet: Not Connected";
    return `Wallet: ${account.slice(0, 6)}…${account.slice(-4)}`;
  }, [account]);

  const buttonLabel = useMemo(() => {
    if (actionState === "connecting") return "Connecting…";
    if (actionState === "swapping") return "Swapping…";
    return account ? "Swap" : "Connect Wallet";
  }, [account, actionState]);

  const ensureQuote = useCallback(
    (value: string) => {
      const parsed = Number.parseFloat(value || "0");
      if (Number.isFinite(parsed)) {
        setAmountOut(String(parsed * CURRENT.FIXED_RATE));
      } else {
        setAmountOut("");
      }
    },
    [CURRENT.FIXED_RATE]
  );

  useEffect(() => {
    ensureQuote(amountIn);
  }, [amountIn, ensureQuote]);

  const ensureChain = useCallback(async () => {
    if (!chain) return;
    const currentChainId = `0x${chain.id.toString(16)}`;
    if (CONFIGS[currentChainId]) return;
    
    try {
      await switchChainAsync({ chainId: 11155111 });
    } catch (switchError: any) {
      console.error("Failed to switch chain:", switchError);
      throw switchError;
    }
  }, [chain, switchChainAsync]);

  useEffect(() => {
    async function initContracts() {
      if (!address || !chain || typeof window === "undefined") {
        providerRef.current = null;
        signerRef.current = null;
        routerRef.current = null;
        setImplAddress(null);
        return;
      }

      try {
        const { ethereum } = window as unknown as { ethereum?: any };
        if (!ethereum) return;

        const currentChainId = `0x${chain.id.toString(16)}`;
        const currentConfig = CONFIGS[currentChainId] ?? CONFIGS["0xaa36a7"];
        setChainIdHex(currentChainId);

        const provider = new providers.Web3Provider(ethereum);
        providerRef.current = provider;
        const signer = provider.getSigner();
        signerRef.current = signer;
        routerRef.current = new Contract(currentConfig.ROUTER_ADDRESS, currentConfig.ROUTER_ABI, signer);
        const erc20 = new Contract(currentConfig.TOKEN_ADDRESS, currentConfig.ERC20_ABI, signer);
        const dec = await erc20.decimals().catch(() => 18);
        setTokenDecimals(Number(dec) || 18);

        // Read ERC1967 implementation slot to display actual implementation address
        try {
          const IMPL_SLOT =
            "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
          const raw = await provider.getStorageAt(currentConfig.ROUTER_ADDRESS, IMPL_SLOT);
          const impl = ("0x" + raw.slice(26)) as string; // last 20 bytes
          const code = await provider.getCode(impl);
          if (code && code !== "0x") {
            setImplAddress(impl);
          } else {
            setImplAddress(null);
          }
        } catch (e) {
          console.warn("Failed to read implementation slot", e);
        }
      } catch (err) {
        console.error("Failed to initialize contracts:", err);
      }
    }

    initContracts();
  }, [address, chain]);

  const swap = useCallback(async () => {
    if (!account) {
      alert("Please connect your wallet using the button in the header.");
      return;
    }
    if (!routerRef.current || !signerRef.current) {
      alert("Router not ready yet.");
      return;
    }

    const value = amountIn.trim();
    const numeric = Number.parseFloat(value);
    if (!value || !Number.isFinite(numeric) || numeric <= 0) {
      alert("Enter an amount");
      return;
    }

    setActionState("swapping");
    try {
      // Compute ETH->token mapping at fixed rate (1 ETH = FIXED_RATE tokens)
      const tokens = numeric * CURRENT.FIXED_RATE;
      const epsilon = 1e-9;
      const wei = utils.parseEther(value);

      // Attempt path A: buyWhole(uint256)
      let method: "buyWhole" | "buyToken" | "buyExact" | null = null;
      let wholeTokens = 0;
      if (Math.abs(tokens - Math.round(tokens)) <= epsilon) {
        wholeTokens = Math.round(tokens);
        try {
          await routerRef.current.callStatic.buyWhole(wholeTokens, { value: wei });
          method = "buyWhole";
        } catch (e) {
          // ignore; try alternative
        }
      }

      // Attempt path B: buyToken(address to)
      if (!method) {
        try {
          await (routerRef.current as any).callStatic.buyToken(account, { value: wei });
          method = "buyToken";
        } catch (e) {
          // still failing; will report detailed errors below
        }
      }

      // Attempt path C: buyExact(uint256 tokenAmount) payable
      if (!method) {
        try {
          // tokenAmount in smallest units. tokens may be fractional; convert to units.
          const tokenAmount = utils.parseUnits(tokens.toString(), tokenDecimals);
          await (routerRef.current as any).callStatic.buyExact(tokenAmount, { value: wei });
          method = "buyExact";
        } catch (e) {
          // still failing
        }
      }

      if (!method) {
        // Re-run to fetch reasons for better UX
        let reasons: string[] = [];
        try {
          if (wholeTokens > 0) {
            await routerRef.current.callStatic.buyWhole(wholeTokens, { value: wei });
          }
        } catch (simErr: any) {
          reasons.push(simErr?.reason || simErr?.shortMessage || simErr?.message || "buyWhole failed");
        }
        try {
          await (routerRef.current as any).callStatic.buyToken(account, { value: wei });
        } catch (simErr: any) {
          reasons.push(simErr?.reason || simErr?.shortMessage || simErr?.message || "buyToken failed");
        }
        try {
          const tokenAmount = utils.parseUnits(tokens.toString(), tokenDecimals);
          await (routerRef.current as any).callStatic.buyExact(tokenAmount, { value: wei });
        } catch (simErr: any) {
          reasons.push(simErr?.reason || simErr?.shortMessage || simErr?.message || "buyExact failed");
        }
        throw new Error(`Both buy paths reverted: ${reasons.join(" | ")}`);
      }

      setChosenMethod(method);

      // Estimate gas for chosen method
      if (method === "buyWhole") {
        await routerRef.current.estimateGas.buyWhole(wholeTokens, { value: wei });
        const tx = await routerRef.current.buyWhole(wholeTokens, { value: wei });
        await tx.wait();
      } else if (method === "buyToken") {
        await (routerRef.current as any).estimateGas.buyToken(account, { value: wei });
        const tx = await (routerRef.current as any).buyToken(account, { value: wei });
        await tx.wait();
      } else {
        const tokenAmount = utils.parseUnits(tokens.toString(), tokenDecimals);
        await (routerRef.current as any).estimateGas.buyExact(tokenAmount, { value: wei });
        const tx = await (routerRef.current as any).buyExact(tokenAmount, { value: wei });
        await tx.wait();
      }
      alert("Swap complete!");
    } catch (err) {
      console.error(err);
      const message = (err as any)?.shortMessage || (err as Error)?.message || "Swap failed";
      alert(message);
    } finally {
      setActionState("idle");
    }
  }, [account, amountIn, CURRENT, tokenDecimals]);

  const handleButtonClick = useCallback(() => {
    void swap();
  }, [swap]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <div className="center">
        <div className="wrap">
        <header>
          <div className="brand">
            <div className="logo" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3l7 4v10l-7 4-7-4V7l7-4z" fill="white" opacity=".95" />
              </svg>
            </div>
            <div>
              Exchange <span className="badge">Beta</span>
            </div>
          </div>
          <div className="token-row" title={`Wallet connection active on ${CURRENT.NETWORK_LABEL}`}>
            <span className="pill">{walletLabel}</span>
            <span className="pill">Network: {CURRENT.NETWORK_LABEL}</span>
          </div>
        </header>

        <div className="card">
          <div className="grid">
            <section className="swap" aria-label="Swap">
              <div className="row" style={{ marginBottom: "10px" }}>
                <div className="label">You pay</div>
                <div className="label">Balance: 0.00</div>
              </div>
              <div className="row" style={{ marginBottom: "8px" }}>
                <div className="token-box" aria-label="From token">
                  <Image src={ETH_LOGO} alt="ETH" width={24} height={24} unoptimized />
                  <div>
                    <div className="symbol">ETH</div>
                    <div className="mini">Ether</div>
                  </div>
                </div>
                <div className="amount">
                  <input
                    id="amountIn"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.0"
                    aria-label="Amount in"
                    value={amountIn}
                    onChange={(event) => setAmountIn(event.target.value)}
                  />
                </div>
              </div>

              <div className="switch" title="Swap direction (visual only)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path
                    d="M7 7h10M13 3l4 4-4 4M17 17H7M11 21l-4-4 4-4"
                    stroke="#cfe0ff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div className="row" style={{ marginBottom: "10px" }}>
                <div className="label">You receive</div>
                <div className="label">Balance: 0.00</div>
              </div>
              <div className="row">
                <div className="token-box" aria-label="To token">
                  <Image src="https://api.iconify.design/mdi:alpha-e-circle.svg?color=white" alt="TOKEN" width={24} height={24} unoptimized />
                  <div>
                    <div className="symbol">MRS</div>
                    <div className="mini">MRS</div>
                  </div>
                </div>
                <div className="amount">
                  <input
                    id="amountOut"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.0"
                    aria-label="Amount out"
                    value={amountOut}
                    readOnly
                  />
                </div>
              </div>

              <div className="rate">
                <div>Rate (fixed): 1 ETH = 10 MRS</div>
                <div>Fee: 0%</div>
              </div>
              <button
                id="actionBtn"
                className="btn"
                onClick={handleButtonClick}
                disabled={actionState !== "idle"}
              >
                {buttonLabel}
              </button>
              <div className="notice">Rate is fixed at 1 ETH = 10 MRS. Set your own pricing in the contract if needed.</div>
            </section>

            <aside className="panel" aria-label="Details">
              <h3>Pool Details (Demo)</h3>
              <div className="kv">
                <div className="k">Pair</div>
                <div className="v">MRS / ETH</div>
                <div className="k">Pricing</div>
                <div className="v">Fixed: 1 ETH = 10 MRS</div>
                <div className="k">Slippage</div>
                <div className="v">N/A (no JS)</div>
                <div className="k">Network</div>
                <div className="v">Ethereum Sepolia</div>
                {implAddress ? (<>
                  <div className="k">Router Impl</div>
                  <div className="v"><code>{implAddress}</code></div>
                </>) : null}
                {chosenMethod ? (<>
                  <div className="k">Method</div>
                  <div className="v"><code>{chosenMethod}</code></div>
                </>) : null}
              </div>
            <div className="sep" />
            <h3>What you can do with MRS (MRS)</h3>
            <ol className="mini" style={{ margin: "8px 0 0 18px", lineHeight: 1.6 }}>
              <li>Become an attester on the network for 100 MRS and earn passive income</li>
              <li>10:1 Ethereum pegged. Please note, it&apos;s not backed by Etheereum yet, and will be floated free for the time being.</li>
              <li>Governance rights with Miras DAO.</li>
            </ol>
            <div className="notice">Tip: Keep this exact layout and progressively enhance with a small JS file later.</div>
            </aside>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
