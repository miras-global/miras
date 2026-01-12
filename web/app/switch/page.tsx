"use client";

export const dynamic = "force-static";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useWalletClient, useSwitchChain } from 'wagmi';
import { ethers } from "ethers";
import { CHAIN } from "@/lib/config";
import { humanizeEthersError, createEnsureNetwork, createGetEthersSigner, createEnsureAccounts } from "@/lib/launch/utils";

const DEAD_MANS_SWITCH_BYTECODE = "0x60806040526001600455348015610014575f5ffd5b50604051610d3e380380610d3e833981016040819052610033916100df565b6001600160a01b03811661005a5760405163d92e233d60e01b815260040160405180910390fd5b5f8054336001600160a01b03199182168117909255600280549091166001600160a01b038416179055426003819055604080516020808252600690820152656465706c6f7960d01b918101919091529091907feb6cc3361f335e99597cbe03f79fa5f0677da1cbb9a70919567df75fc7065e7f9060600160405180910390a35061010c565b5f602082840312156100ef575f5ffd5b81516001600160a01b0381168114610105575f5ffd5b9392505050565b610c25806101195f395ff3fe6080604052600436106100eb575f3560e01c80635c36b1861161008957806391f2ebb81161005857806391f2ebb81461027d578063e30c39781461029c578063f2fde38b146102bb578063f5fce245146102da5761010b565b80635c36b1861461020b57806379ba50971461021f5780637e0692ca146102335780638da5cb5b146102475761010b565b806323defc77116100c557806323defc77146101a457806333f707d1146101c35780634177e528146101e257806342848489146101f65761010b565b806312065fe01461014b5780631d7866de1461016c57806323452b9c146101905761010b565b3661010b57610109333460405180602001604052805f8152506102f1565b005b61010933345f368080601f0160208091040260200160405190810160405280939291908181526020018383808284375f920191909152506102f192505050565b348015610156575f5ffd5b50475b6040519081526020015b60405180910390f35b348015610177575f5ffd5b5061018061037c565b6040519015158152602001610163565b34801561019b575f5ffd5b50610109610397565b3480156101af575f5ffd5b506101096101be366004610b0b565b61046f565b3480156101ce575f5ffd5b506101096101dd366004610b38565b610539565b3480156101ed575f5ffd5b506101596106ca565b348015610201575f5ffd5b5061015960035481565b348015610216575f5ffd5b506101096106fe565b34801561022a575f5ffd5b5061010961074d565b34801561023e575f5ffd5b50610109610876565b348015610252575f5ffd5b505f54610265906001600160a01b031681565b6040516001600160a01b039091168152602001610163565b348015610288575f5ffd5b50600254610265906001600160a01b031681565b3480156102a7575f5ffd5b50600154610265906001600160a01b031681565b3480156102c6575f5ffd5b506101096102d5366004610b0b565b6109e8565b3480156102e5575f5ffd5b506101596301e1338081565b826001600160a01b03167f45518f48c7a4bd6dc24decd40277fd5a175071c296edff58eb507adffe4f563d838360405161032c929190610b7d565b60405180910390a25f546001600160a01b0390811690841603610377576103776040518060400160405280600d81526020016c1bdddb995c8b59195c1bdcda5d609a1b815250610ac7565b505050565b5f6301e1338060035461038f9190610bb1565b421015905090565b5f546001600160a01b031633146103c1576040516330cd747160e01b815260040160405180910390fd5b6001546001600160a01b03166103ea57604051633e31d61b60e11b815260040160405180910390fd5b600180546001600160a01b03191690555f80546040516001600160a01b03909116917f6ecd4842251bedd053b09547c0fabaab9ec98506ebf24469e8dd5560412ed37f91a261046d6040518060400160405280601881526020017f7472616e736665724f776e6572736869702d63616e63656c0000000000000000815250610ac7565b565b5f546001600160a01b03163314610499576040516330cd747160e01b815260040160405180910390fd5b6001600160a01b0381166104c05760405163d92e233d60e01b815260040160405180910390fd5b600280546001600160a01b038381166001600160a01b0319831681179093556040519116919082907f4e6093f85fa64484abd692810d8a44d508792ff7b7a021d9fbd69fa1c6ff18a0905f90a36105356040518060400160405280600781526020016639b2ba2432b4b960c91b815250610ac7565b5050565b5f546001600160a01b03163314610563576040516330cd747160e01b815260040160405180910390fd5b6002600454036105a75760405162461bcd60e51b815260206004820152600a6024820152695245454e5452414e435960b01b60448201526064015b60405180910390fd5b6002600455475f82156105ba57826105bc565b815b9050818111156105df57604051631e9acf1760e31b815260040160405180910390fd5b5f80546040516001600160a01b039091169083908381818185875af1925050503d805f8114610629576040519150601f19603f3d011682016040523d82523d5f602084013e61062e565b606091505b5050905080610650576040516312171d8360e31b815260040160405180910390fd5b5f546040518381526001600160a01b03909116907fa919fadcfa556a012bab31b15f596ea7ccd397adbf10e15f176db9055ab361c49060200160405180910390a26106bf6040518060400160405280600d81526020016c6f776e6572576974686472617760981b815250610ac7565b505060016004555050565b5f5f6301e133806003546106de9190610bb1565b90508042106106ee575f91505090565b6106f84282610bca565b91505090565b5f546001600160a01b03163314610728576040516330cd747160e01b815260040160405180910390fd5b61046d6040518060400160405280600481526020016370696e6760e01b815250610ac7565b6001546001600160a01b031661077657604051633e31d61b60e11b815260040160405180910390fd5b6001546001600160a01b031633146107a157604051630614e5c760e21b815260040160405180910390fd5b5f8054600180546001600160a01b038082166001600160a01b031980861682178755909216909255604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a34260038190555f546040516001600160a01b03909116907feb6cc3361f335e99597cbe03f79fa5f0677da1cbb9a70919567df75fc7065e7f9061086b9060208082526018908201527f7472616e736665724f776e6572736869702d6163636570740000000000000000604082015260600190565b60405180910390a350565b6002546001600160a01b031633146108a1576040516308419e5560e41b815260040160405180910390fd5b6002600454036108e05760405162461bcd60e51b815260206004820152600a6024820152695245454e5452414e435960b01b604482015260640161059e565b60026004556108ed61037c565b61090a5760405163828630fb60e01b815260040160405180910390fd5b475f81900361092c5760405163043f9e1160e41b815260040160405180910390fd5b6002546040515f916001600160a01b03169083908381818185875af1925050503d805f8114610976576040519150601f19603f3d011682016040523d82523d5f602084013e61097b565b606091505b505090508061099d576040516312171d8360e31b815260040160405180910390fd5b6002546040518381526001600160a01b03909116907feea87a41220b81eeb4e50ecacbc3ab9de582fbbda30acea32e115cd73066acd69060200160405180910390a250506001600455565b5f546001600160a01b03163314610a12576040516330cd747160e01b815260040160405180910390fd5b6001600160a01b038116610a395760405163d92e233d60e01b815260040160405180910390fd5b600180546001600160a01b0319166001600160a01b038381169182179092555f8054604051929316917f38d16b8cac22d99fc7c124b9cd0de2d3fa1faef420bfe791d8c362d765e227009190a3610ac46040518060400160405280601781526020017f7472616e736665724f776e6572736869702d7374617274000000000000000000815250610ac7565b50565b4260038190555f546040516001600160a01b03909116907feb6cc3361f335e99597cbe03f79fa5f0677da1cbb9a70919567df75fc7065e7f9061086b908590610bdd565b5f60208284031215610b1b575f5ffd5b81356001600160a01b0381168114610b31575f5ffd5b9392505050565b5f60208284031215610b48575f5ffd5b5035919050565b5f81518084528060208401602086015e5f602082860101526020601f19601f83011685010191505092915050565b828152604060208201525f610b956040830184610b4f565b949350505050565b634e487b7160e01b5f52601160045260245ffd5b80820180821115610bc457610bc4610b9d565b92915050565b81810381811115610bc457610bc4610b9d565b602081525f610b316020830184610b4f56fea2646970667358221220949a93c29245f8bfb4627cc93ffef298a31861482518547c6bac52024a6584a664736f6c63430008210033";

const DEAD_MANS_SWITCH_ABI = [
  "constructor(address _heir)",
  "function owner() view returns (address)",
  "function pendingOwner() view returns (address)",
  "function heir() view returns (address)",
  "function lastActivityTimestamp() view returns (uint256)",
  "function TIMEOUT_PERIOD() view returns (uint256)",
  "function isTimedOut() view returns (bool)",
  "function timeUntilTimeout() view returns (uint256)",
  "function ownerWithdraw(uint256 amount)",
  "function heirWithdraw()",
  "function setHeir(address newHeir)",
  "function ping()",
  "function getBalance() view returns (uint256)",
  "function transferOwnership(address newOwner)",
  "function acceptOwnership()",
  "function cancelOwnershipTransfer()",
  "event DepositReceived(address indexed from, uint256 amount, bytes data)",
  "event OwnerActivity(address indexed owner, uint256 indexed timestamp, string action)",
  "event OwnerWithdrawal(address indexed owner, uint256 amount)",
  "event HeirWithdrawal(address indexed heir, uint256 amount)",
  "event HeirChanged(address indexed oldHeir, address indexed newHeir)",
  "event OwnershipTransferStarted(address indexed previousOwner, address indexed pendingOwner)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
  "event OwnershipTransferCanceled(address indexed owner)"
];

export default function SwitchPage() {
  const { address, chain } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  
  const account = address || null;
  
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{type:"success"|"info"|"warning"|"danger"|"secondary"; msg:string}|null>(null);

  type Seed = { phrase: string | null; priv: string | null; addr: string | null; revealed: boolean };
  const [heir, setHeir] = useState<Seed>({ phrase: null, priv: null, addr: null, revealed: false });
  const [confirmWritten, setConfirmWritten] = useState(false);
  const [heirIdx, setHeirIdx] = useState<number[]>([]);
  const [heirWordsInput, setHeirWordsInput] = useState(["", "", ""]);
  const [canDeploy, setCanDeploy] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  function randomUniqueIndices(count:number, max:number){ 
    const set = new Set<number>(); 
    while (set.size < count) set.add(Math.floor(Math.random()*max)); 
    return Array.from(set).sort((a,b)=>a-b); 
  }
  
  const setChallenges = useCallback(() => { 
    if (heir.phrase) setHeirIdx(randomUniqueIndices(3,12)); 
  }, [heir.phrase]);
  
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

  useEffect(() => {
    if (typeof window !== "undefined" && account) {
      try {
        const key = `${CHAIN.keyName}-${ethers.utils.getAddress(account)}`;
        const saved = localStorage.getItem(`miras_switch_address_${key}`);
        if (saved) setContractAddress(saved); else setContractAddress(null);
      } catch { setContractAddress(null); }
    } else if (typeof window !== "undefined" && !account) {
      setContractAddress(null);
    }
  }, [account]);

  useEffect(() => {
    (async () => {
      if (account) {
        if (!heir.phrase) await generateSeed();
        setChallenges();
        setHeirWordsInput(["","",""]);
        setCanDeploy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  useEffect(() => {
    if (account && heir.phrase && heirIdx.length !== 3) {
      setChallenges();
    }
  }, [account, heir.phrase, heirIdx.length, setChallenges]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (deploying) {
      const prev = document.body.style.cursor;
      document.body.setAttribute("data-prev-cursor", prev);
      document.body.style.cursor = "wait";
    } else {
      const prev = document.body.getAttribute("data-prev-cursor");
      document.body.style.cursor = prev || "";
      document.body.removeAttribute("data-prev-cursor");
    }
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.cursor = "";
        document.body.removeAttribute("data-prev-cursor");
      }
    };
  }, [deploying]);

  async function generateSeed() {
    const wallet = ethers.Wallet.createRandom();
    const phrase = wallet.mnemonic.phrase;
    const priv = wallet.privateKey;
    const addr = wallet.address;
    setHeir({ phrase, priv, addr, revealed: false });
  }

  function maskSeed(): { seed: string } {
    if (!heir.phrase) return { seed: "" };
    const words = heir.phrase.split(" ");
    const masked = words.map((w, i) => (heir.revealed ? w : "****"));
    return { seed: masked.join(" ") };
  }

  function revealSeed() {
    if (heir.phrase) {
      setHeir({ ...heir, revealed: !heir.revealed });
    }
  }

  const onVerifySeeds = useCallback((): boolean => {
    clearAlert();
    if (!heir.phrase) {
      showAlert("warning", "Please generate a seed first.");
      return false;
    }
    if (!confirmWritten) {
      showAlert("warning", "Please confirm you have written down the seed securely.");
      return false;
    }
    const words = heir.phrase.split(" ");
    for (let i = 0; i < 3; i++) {
      const idx = heirIdx[i];
      const expected = words[idx]?.toLowerCase().trim();
      const actual = heirWordsInput[i]?.toLowerCase().trim();
      if (expected !== actual) {
        showAlert("danger", `Word #${idx + 1} does not match. Please check your seed phrase.`);
        return false;
      }
    }
    setCanDeploy(true);
    showAlert("success", "Seed verified successfully! You can now deploy the contract.");
    return true;
  }, [clearAlert, confirmWritten, heir.phrase, heirIdx, heirWordsInput, showAlert]);

  const deployContract = useCallback(async () => {
    clearAlert();
    if (!heir.addr) {
      showAlert("warning", "Please generate and verify the heir seed first.");
      return;
    }
    setDeploying(true);
    try {
      await ensureAccounts();
      await ensureNetwork();
      const signer = getEthersSigner();
      
      const factory = new ethers.ContractFactory(
        DEAD_MANS_SWITCH_ABI,
        DEAD_MANS_SWITCH_BYTECODE,
        signer
      );
      
      showAlert("info", "Deploying Dead Man's Switch contract... Please confirm the transaction in your wallet.");
      
      const contract = await factory.deploy(heir.addr);
      showAlert("info", `Transaction sent. Waiting for confirmation...\nTx: ${contract.deployTransaction.hash}`);
      
      await contract.deployed();
      
      const deployed = contract.address;
      setContractAddress(deployed);
      
      if (typeof window !== "undefined" && account) {
        try {
          const key = `${CHAIN.keyName}-${ethers.utils.getAddress(account)}`;
          localStorage.setItem(`miras_switch_address_${key}`, deployed);
        } catch {}
      }
      
      showAlert("success", `Dead Man's Switch contract deployed successfully!\n\nContract Address: ${deployed}\n\nYou can now send ETH to this address. Remember: if no transfer is received for 1 year, your heir will be able to withdraw all funds.`);
    } catch (err: any) {
      const pretty = humanizeEthersError(err);
      showAlert(pretty.type, pretty.msg);
    } finally {
      setDeploying(false);
    }
  }, [clearAlert, account, ensureAccounts, ensureNetwork, getEthersSigner, heir.addr, showAlert]);

  async function onVerifyAndDeploy() {
    const ok = onVerifySeeds();
    if (ok) {
      await deployContract();
    }
  }

  return (
    <section className="py-5">
      <div className="container">
        <header className="mb-4 text-center">
          <h1 className="fw-bold section-title">Dead Man&apos;s Switch</h1>
          <p className="text-muted">Simple time-based inheritance for your crypto assets</p>
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

          {account && !contractAddress && (
            <>
              <div className="col-12">
                <div className="alert alert-info d-flex align-items-start" role="alert">
                  <i className="bi bi-info-circle me-2"></i>
                  <div>
                    <strong>How it works:</strong> This contract will hold your funds and automatically release them to your heir if you don&apos;t interact with it for 1 year. Only your own deposits or pings reset the timer (third-party deposits do not, preventing griefing).
                  </div>
                </div>
              </div>

              <div className="col-12">
                <h5 className="fw-bold mb-2">Generate Heir Seed</h5>
                <p className="text-muted">Create a seed phrase for your heir. They will use this to access the funds after the timeout period.</p>

                <div className="card">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="mb-0">Heir Seed (12 words)</h6>
                      <div className="btn-group">
                        <button className="btn btn-sm btn-outline-secondary" disabled={!account} onClick={revealSeed}>
                          <i className="bi bi-eye"></i> {heir.revealed ? "Hide" : "Reveal"}
                        </button>
                        <button className="btn btn-sm btn-outline-primary" disabled={!account} onClick={() => { generateSeed(); setChallenges(); }}>
                          <i className="bi bi-arrow-repeat"></i> Regenerate
                        </button>
                      </div>
                    </div>
                    <textarea 
                      className="form-control" 
                      style={{height: 96}} 
                      readOnly 
                      placeholder="Connect wallet to generate seed..." 
                      value={heir.revealed && heir.phrase ? heir.phrase : maskSeed().seed}
                    />
                    {heir.addr && (
                      <div className="mt-2">
                        <small className="text-muted">Heir Address: <code>{heir.addr}</code></small>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-12">
                <div className="form-check mt-3">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="confirmWriteDown" 
                    disabled={!account} 
                    checked={confirmWritten} 
                    onChange={(e) => setConfirmWritten(e.target.checked)} 
                  />
                  <label className="form-check-label" htmlFor="confirmWriteDown">
                    I have written down the seed securely (offline) and will give it to my heir.
                  </label>
                </div>
              </div>

              <div className="col-12">
                <div className="card">
                  <div className="card-body">
                    <h6 className="mb-2">Heir Seed Verification</h6>
                    <p className="text-muted small">Enter the requested words to verify you&apos;ve saved the seed correctly.</p>
                    <div className="row g-2">
                      <div className="col-md-4">
                        <label className="form-label">Word #{heirIdx[0] !== undefined ? heirIdx[0] + 1 : '?'}</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="word" 
                          disabled={!account} 
                          value={heirWordsInput[0]} 
                          onChange={(e) => setHeirWordsInput([e.target.value, heirWordsInput[1], heirWordsInput[2]])} 
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Word #{heirIdx[1] !== undefined ? heirIdx[1] + 1 : '?'}</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="word" 
                          disabled={!account} 
                          value={heirWordsInput[1]} 
                          onChange={(e) => setHeirWordsInput([heirWordsInput[0], e.target.value, heirWordsInput[2]])} 
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Word #{heirIdx[2] !== undefined ? heirIdx[2] + 1 : '?'}</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="word" 
                          disabled={!account} 
                          value={heirWordsInput[2]} 
                          onChange={(e) => setHeirWordsInput([heirWordsInput[0], heirWordsInput[1], e.target.value])} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12">
                <div className="d-flex flex-wrap gap-2 mt-3">
                  <button
                    className="btn btn-success btn-lg"
                    onClick={onVerifyAndDeploy}
                    disabled={deploying || !account}
                  >
                    <i className="bi bi-rocket-takeoff"></i> {deploying ? 'Deploying...' : 'Verify & Deploy Contract'}
                  </button>
                </div>
              </div>
            </>
          )}

          {account && contractAddress && (
            <>
              <div className="col-12">
                <div className="card">
                  <div className="card-body">
                    <h6 className="fw-bold mb-2"><i className="bi bi-shield-check"></i> Your Dead Man&apos;s Switch Contract</h6>
                    <div className="mb-2">
                      <label className="form-label mb-1">Contract Address</label>
                      <div className="input-group">
                        <input type="text" className="form-control" readOnly value={contractAddress} />
                        <button 
                          className="btn btn-outline-secondary" 
                          type="button" 
                          onClick={async () => { 
                            try { 
                              await navigator.clipboard.writeText(contractAddress); 
                              showAlert('success', 'Contract address copied.'); 
                            } catch { 
                              showAlert('danger', 'Copy failed. Please copy manually.'); 
                            } 
                          }}
                        >
                          <i className="bi bi-clipboard"></i> Copy
                        </button>
                      </div>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      <a 
                        className="btn btn-outline-primary" 
                        target="_blank" 
                        rel="noopener" 
                        href={`${CHAIN.explorer}/address/${contractAddress}`}
                      >
                        <i className="bi bi-search"></i> View on Explorer
                      </a>
                    </div>
                    <small className="text-muted d-block mt-2">
                      Send ETH from your connected wallet to fund it. Only your own deposits reset the 1-year timer.
                    </small>
                  </div>
                </div>
              </div>

              <div className="col-12">
                <div className="card mt-3 border-warning">
                  <div className="card-body">
                    <h5 className="card-title mb-3">
                      <i className="bi bi-exclamation-triangle text-warning me-2"></i>
                      Important: Instructions for Your Heir
                    </h5>
                    <p className="text-muted mb-3">
                      Share the following information with your heir securely. They will need this to claim the funds after the timeout period.
                    </p>
                    
                    <div className="bg-light p-3 rounded mb-3">
                      <h6 className="fw-bold">For Your Heir:</h6>
                      <ol className="mb-0">
                        <li className="mb-2">
                          <strong>Contract Address:</strong> <code>{contractAddress}</code>
                        </li>
                        <li className="mb-2">
                          <strong>Your Seed Phrase:</strong> The 12-word seed phrase you were given. Import this into a wallet like MetaMask to access your heir address.
                        </li>
                        <li className="mb-2">
                          <strong>Wait Period:</strong> You can only withdraw funds if the owner has not interacted with the contract for 1 year (365 days). Only owner deposits or pings reset the timer.
                        </li>
                        <li className="mb-2">
                          <strong>How to Claim:</strong>
                          <ul>
                            <li>Import your seed phrase into MetaMask or another Ethereum wallet</li>
                            <li>Go to the contract on Etherscan: <a href={`${CHAIN.explorer}/address/${contractAddress}#writeContract`} target="_blank" rel="noopener">{CHAIN.explorer}/address/{contractAddress}</a></li>
                            <li>Connect your wallet and call the <code>heirWithdraw()</code> function</li>
                            <li>All funds will be transferred to your address</li>
                          </ul>
                        </li>
                      </ol>
                    </div>

                    <div className="alert alert-info mb-0">
                      <i className="bi bi-info-circle me-2"></i>
                      <strong>Tip:</strong> You can also use the <a href="/crypto-will-wizard" className="alert-link">Crypto Will Wizard</a> to create a document with these instructions for your heir.
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 mt-3 text-center">
                <button 
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    if (typeof window !== "undefined" && account) {
                      const key = `${CHAIN.keyName}-${ethers.utils.getAddress(account)}`;
                      localStorage.removeItem(`miras_switch_address_${key}`);
                    }
                    setContractAddress(null);
                    generateSeed();
                    setChallenges();
                    setConfirmWritten(false);
                    setCanDeploy(false);
                    setHeirWordsInput(["", "", ""]);
                  }}
                >
                  <i className="bi bi-plus-circle"></i> Deploy Another Contract
                </button>
              </div>
            </>
          )}
        </div>

        {errorModal && (
          <>
            <div className="modal fade show" style={{display:'block'}} role="dialog" aria-modal="true">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Error</h5>
                    <button type="button" className="btn-close" aria-label="Close" onClick={() => setErrorModal(null)}></button>
                  </div>
                  <div className="modal-body">
                    <p className="mb-0">{errorModal}</p>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-primary" onClick={() => setErrorModal(null)}>OK</button>
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