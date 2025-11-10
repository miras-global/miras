"use client";

export const dynamic = "force-static";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useWalletClient, useSwitchChain } from 'wagmi';
import { ethers } from "ethers";
import { decryptString, encryptString, normalizeUncompressedPublicKeyHex } from "@/lib/crypto";
import { CHAIN } from "@/lib/config";
import { humanizeEthersError as sharedHumanizeEthersError, createEnsureNetwork, createGetEthersSigner, createEnsureAccounts } from "@/lib/launch/utils";

// Hoisted constants
const SAFE_130 = {
  factory: ethers.utils.getAddress('0xa6b71e26c5e0845f74c812102ca7114b6a896ab2'),
  singleton: ethers.utils.getAddress('0xd9db270c1b5e3bd161e8c8503c55ceabee709552'),
  fallbackHandler: ethers.utils.getAddress('0xf48f2b2d2a534e402487b3ee7c18c33aec0fe5e4')
} as const;
const FACTORY_ABI = [
  "event ProxyCreation(address proxy,address singleton)",
  "function createProxyWithNonce(address _singleton,bytes initializer,uint256 saltNonce) returns (address proxy)"
] as const;
const SAFE_ABI = [
  "function setup(address[] _owners,uint256 _threshold,address to,bytes data,address fallbackHandler,address paymentToken,uint256 payment,address payable paymentReceiver) payable"
] as const;

export default function LaunchPage() {
  const { address, chain } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  
  const account = address || null;
  const chainId = chain?.id || null;
  
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{type:"success"|"info"|"warning"|"danger"|"secondary"; msg:string}|null>(null);

  // Seeds state
  type Seed = { phrase: string | null; priv: string | null; revealed: boolean };
  const [heir, setHeir] = useState<Seed>({ phrase: null, priv: null, revealed: false });
  const [proto, setProto] = useState<Seed>({ phrase: null, priv: null, revealed: false });
  const [confirmWritten, setConfirmWritten] = useState(false);
  const [heirIdx, setHeirIdx] = useState<number[]>([]);
  const [protoIdx, setProtoIdx] = useState<number[]>([]);
  const [heirWordsInput, setHeirWordsInput] = useState(["", "", ""]);
  const [protoWordsInput, setProtoWordsInput] = useState(["", "", ""]);
  const [canCreateSafe, setCanCreateSafe] = useState(false);
  const [signing, setSigning] = useState(false);
  const [creating, setCreating] = useState(false);
  const [safeAddress, setSafeAddress] = useState<string | null>(null);
  // UI: if a Safe already exists, hide the creation panel until user opts-in
  const [showNewLaunch, setShowNewLaunch] = useState(false);
  // Modal state (PHP parity): confirmation before verify, centralized error modal
  const [confirmModal, setConfirmModal] = useState<null | { title: string; body: string; onConfirm: () => void }>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [phone1, setPhone1] = useState<string>("");
  const [phone2, setPhone2] = useState<string>("");
  const [email1, setEmail1] = useState<string>("");
  const [email2, setEmail2] = useState<string>("");
  const [governmentId, setGovernmentId] = useState<File | null>(null);

  function randomUniqueIndices(count:number, max:number){ const set = new Set<number>(); while (set.size < count) set.add(Math.floor(Math.random()*max)); return Array.from(set).sort((a,b)=>a-b); }
  const setChallenges = useCallback(() => { if (heir.phrase) setHeirIdx(randomUniqueIndices(3,12)); if (proto.phrase) setProtoIdx(randomUniqueIndices(3,12)); }, [heir.phrase, proto.phrase]);
  
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

  const humanizeEthersError = sharedHumanizeEthersError;

  // Read namespaced safe address once account is known

  useEffect(() => {
    if (typeof window !== "undefined" && account) {
      try {
        const key = `${CHAIN.keyName}-${ethers.utils.getAddress(account)}`;
        const saved = localStorage.getItem(`miras_safe_address_${key}`);
        if (saved) setSafeAddress(saved); else setSafeAddress(null);
      } catch { setSafeAddress(null); }
    } else if (typeof window !== "undefined" && !account) {
      setSafeAddress(null);
    }
  }, [account, chainId]);

  useEffect(() => {
    // Listen to wallet account/network changes and clear cached state accordingly
    if (typeof window === 'undefined') return;
    const eth: any = (window as any).ethereum;
    if (!eth || !eth.on) return;
    const onAccountsChanged = (acs: string[]) => {
      if (!acs || acs.length === 0) {
        setSafeAddress(null);
      }
    };
    const onDisconnect = () => {
      setSafeAddress(null);
    };
    eth.on('accountsChanged', onAccountsChanged);
    eth.on('disconnect', onDisconnect);
    return () => {
      try { eth.removeListener && eth.removeListener('accountsChanged', onAccountsChanged); } catch {}
      try { eth.removeListener && eth.removeListener('disconnect', onDisconnect); } catch {}
    };
  }, [creating]);

  // If an account is present (including restored), ensure seeds/challenges are initialized
  useEffect(() => {
    (async () => {
      if (account) {
        if (!heir.phrase) await generateSeed("heir");
        if (!proto.phrase) await generateSeed("proto");
        setChallenges();
        setHeirWordsInput(["","",""]);
        setProtoWordsInput(["","",""]);
        setCanCreateSafe(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  // When the creation panel becomes visible, ensure challenges are initialized
  useEffect(() => {
    const panelVisible = !safeAddress || showNewLaunch;
    if (panelVisible && account) {
      const needsHeir = !!heir.phrase && heirIdx.length !== 3;
      const needsProto = !!proto.phrase && protoIdx.length !== 3;
      if (needsHeir || needsProto) {
        setChallenges();
      }
    }
  }, [account, safeAddress, showNewLaunch, heir.phrase, proto.phrase, heirIdx.length, protoIdx.length, setChallenges]);

  // Toggle visibility of creation panel based on presence of a Safe
  useEffect(() => {
    if (safeAddress) {
      setShowNewLaunch(false);
    } else {
      setShowNewLaunch(true);
    }
  }, [safeAddress]);

  // While creating a Safe, show a loading cursor globally
useEffect(() => {
  if (typeof document === "undefined") return;
  if (creating) {
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
}, [creating]);


async function slow_findAttestors() {
  try {
    if (!walletClient) throw new Error("Please connect your wallet from the header");
    await ensureAccounts();
    const signer = getEthersSigner();
    const addr = ethers.utils.getAddress(CHAIN.attestersProxy);
    const abi = [
      "function pickAttesters(uint256 num) view returns (address[] memory)",
    ];
    const contract = new ethers.Contract(addr, new ethers.utils.Interface(abi), signer);
    const picked: string[] = await contract.pickAttesters(3);
    console.log("[Attesters] pickAttesters(3) =>", picked);
    
    // with given attesters
    // find their public key by interacting wiht the AttesterRegistry contract
    // use function getAttester(address wallet)
    // publicKey is the second param
    /*
    function getAttester(address wallet)
        external
        view
        returns (
            address,
            bytes memory,
            string memory,
            string memory,
            uint64,
            bool,
            bool,
            uint256, // totalFeesPaid
            uint256, // lastFeePaid
            uint64,  // lastPaidAt
            uint256, // totalOverpaid
            uint256  // lastOverpaid
        )
            */
    const registryAddr = CHAIN.attestersProxy;
    
    const registryAbi = [
      "function getAttester(address wallet) view returns (address, bytes memory, string memory, string memory, uint64, bool, bool, uint256, uint256, uint64, uint256, uint256)"
    ];
    const registryContract = new ethers.Contract(registryAddr, new ethers.utils.Interface(registryAbi), signer);
    //const publicKeys: string[] = await Promise.all(picked.map((addr) => registryContract.getAttester(addr)));
    const publicKeys = await Promise.all(picked.map((addr) => registryContract.getAttester(addr)));
    // go thru publicKeys array and fetch the second params
    // go thru publicKeys array and fetch the second params (bytes publicKey)
    const publicKeysArray = publicKeys.map((pk) => pk[1]);
    console.log("[Attesters] publicKeysArray =>", publicKeysArray);

    // Encrypt the message with each public key using ECIES (secp256k1)
    // 1) Convert bytes to hex
    const pubHexRaw = publicKeysArray.map((pk) =>
      typeof pk === "string" ? pk : ethers.utils.hexlify(pk)
    );

    const ciphertextsB64 = [];
for (const h of pubHexRaw) {
  try {
    const u = normalizeUncompressedPublicKeyHex(ethers.utils.computePublicKey(h, false));
    ciphertextsB64.push(encryptString(u, "emre"));
  } catch (e) {
    console.warn("Skipping invalid public key:", h, e);
  }
}
console.log("[Attesters] ciphertexts (base64) =>", ciphertextsB64);
    

    console.log("[Attesters] publicKeys =>", publicKeys);

    return picked;
  } catch (e: any) {
    console.error("findAttestors error:", e?.message || e);
    return [] as string[];
  }
}

type AttesterEntry = { public_key: string } & Record<string, any>;

const findAttestors = useCallback(async (): Promise<AttesterEntry[]> => {
  try {
    if (!phone1 || !email1) {
      showAlert("warning", "Please enter at least primary phone number and email before finding attestors.");
      return [] as AttesterEntry[];
    }

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

    console.log("[Attestors] heir private key =>", heir.priv);
    console.log("[Attestors] protocol phrase =>", proto.phrase);
    // Option A: strictly in-memory only; do not read from localStorage
    let protocolPhrase: string | null = proto.phrase ?? null;
    let heirPriv: string | null = heir.priv ?? null;
    if (!heirPriv || !protocolPhrase) {
      throw new Error("Seeds are not ready yet. Connect/generate seeds first.");
    }
    
    // Generate a NEW random key pair for double encryption
    const heirEncryptionWallet = ethers.Wallet.createRandom();
    const heirEncryptionPriv = heirEncryptionWallet._signingKey().privateKey;
    const heirEncryptionPub = normalizeUncompressedPublicKeyHex(
      ethers.utils.computePublicKey(heirEncryptionPriv, false)
    );
    console.log("[Attestors] Generated new heir encryption key pair");
    console.log("[Attestors] Heir encryption priv =>", heirEncryptionPriv);
    
    // FIRST: Encrypt protocolPhrase with the NEW heir encryption public key
    const firstEncryption = encryptString(heirEncryptionPub, protocolPhrase);
    console.log("[Attestors] First encryption (with heir key) =>", firstEncryption);

    const contactInfo = JSON.stringify({
      phone1,
      phone2: phone2 || "",
      email1,
      email2: email2 || "",
      governmentId: governmentId ? governmentId.name : ""
    });
    console.log("[Attestors] contact info =>", contactInfo);

    // for each parsed item, encrypt the contact info with the public key
    const ciphertextsB64 = parsed.map(p => {
      try {
        // `public_key` is expected to be an uncompressed secp256k1 key (0x04...)
        const attesterPubUncompressed = normalizeUncompressedPublicKeyHex(p.public_key);
        return encryptString(attesterPubUncompressed, contactInfo);
      } catch (e) {
        console.warn("[Attestors] invalid attester public key, skipping", p.public_key, e);
        return null;
      }
    }).filter(Boolean) as string[];
    console.log("[Attestors] ciphertexts (base64) =>", ciphertextsB64);

    /*
        struct Row {
        address safe_address;
        uint8 waiting_period;        // like tinyint
        bool death_certificate;      // boolean flag
        address[] attesters;         // list of attesters
        bytes[] encryptedPhones;     // NOTE: not set/returned by insert/update/get
        uint64 createdAt;            // timestamp
    }

    above is from safes/v1.sol
    it is on sepolia (testnet) 0x354Ca87d709fBB8Afc853A7AF6EFB6C865023163
    what we want next is to insert this safe as a row
    picked attesters will be in the array
    and ciphertexts will be in the encryptedPhones array
    */

    
    // Build attester addresses (address[]) from public keys for on-chain insert
const attesterAddresses = parsed.map(p => {
  try {
    return ethers.utils.getAddress(p.address);
  } catch (e) {
    console.warn("[Attestors] invalid address; skipping", p.address, e);
    return null;
  }
}).filter(Boolean) as string[];

if (attesterAddresses.length === 0) {
  console.warn("[Safe] No valid attester addresses; skipping insert.");
  return parsed;
}

// We need a Safe address to associate with this row
const userSafeAddr = safeAddress; // from component state
if (!userSafeAddr) {
  console.warn("[Safe] No user Safe address in state; create Safe first.");
  return parsed;
}

// Compute params for insert (V4 keys by msg.sender + safe_address)
const waitingPeriod: number = 1;       // uint8
const deathCertificate: boolean = false;

const encryptedPhonesStrings = ciphertextsB64;

const encryptedProtocolPhrasesStrings = parsed.map(p => {
  try {
    const attesterPubUncompressed = normalizeUncompressedPublicKeyHex(p.public_key);
    // Encrypt the already-encrypted protocol phrase with the attestor's public key
    return encryptString(attesterPubUncompressed, firstEncryption);
  } catch (e) {
    console.warn("[Attestors] invalid attester public key for protocol phrase, skipping", p.public_key, e);
    return null;
  }
}).filter(Boolean) as string[];
console.log("[Safe] encryptedPhonesStrings =>", encryptedPhonesStrings);
console.log("[Safe] encryptedProtocolPhrasesStrings (double encrypted) =>", encryptedProtocolPhrasesStrings);

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
    ethers.utils.getAddress(userSafeAddr),
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
  showAlert("success", `Safe entry created successfully!\n\nTx: ${tx.hash}\nBlock: ${rcpt.blockNumber}\n\n⚠️ IMPORTANT: Share this decryption key with your heir (keep it VERY safe!):\n${heirEncryptionPriv}\n\nYour heir will need this key to decrypt the protocol seed phrase.`);
} catch (e: any) {
  console.error("[Safe] insert failed:", e?.message || e);
  const pretty = humanizeEthersError(e);
  showAlert(pretty.type, pretty.msg);
}






    return parsed;
  } catch (e: any) {
    console.error("findAttestors error:", e?.message || e);
    showAlert("danger", e?.message || "Failed to find attestors and create Safe entry.");
    return [] as AttesterEntry[];
  }
}, [heir.priv, proto.phrase, safeAddress, ensureAccounts, ensureNetwork, phone1, phone2, email1, email2, governmentId, showAlert, getEthersSigner, humanizeEthersError]);

// Expose to console
useEffect(() => {
  if (typeof window !== "undefined") {
    (window as any).findAttestors = findAttestors; // usage: findAttestors()
    (window as any).encryptString = encryptString; // usage: findAttestors()
    (window as any).decryptString = decryptString; // usage: findAttestors()
  }
}, [findAttestors]);

  // Test helper: autofill seed verification inputs using current indices
  const autofillSeedChecks = useCallback(function autofillSeedChecks(){
    try{
      if (!account){ showAlert('warning','Connect your wallet first.'); return; }
      if (!heir.phrase || !proto.phrase){ showAlert('warning','Seeds are not ready yet. Please connect or regenerate.'); return; }
      if (heirIdx.length !== 3 || protoIdx.length !== 3){
        setChallenges();
        showAlert('info','Challenges regenerated. Click Autofill again.');
        return;
      }
      const heirWords = (heir.phrase||'').split(/\s+/);
      const protoWords = (proto.phrase||'').split(/\s+/);
      setHeirWordsInput([
        heirWords[heirIdx[0]] || '',
        heirWords[heirIdx[1]] || '',
        heirWords[heirIdx[2]] || ''
      ]);
      setProtoWordsInput([
        protoWords[protoIdx[0]] || '',
        protoWords[protoIdx[1]] || '',
        protoWords[protoIdx[2]] || ''
      ]);
      showAlert('success','Seed checks auto-filled for testing.');
    }catch(e:any){
      showAlert('danger', e?.message || 'Autofill failed.');
    }
  }, [account, heir.phrase, proto.phrase, heirIdx, protoIdx, setChallenges, setHeirWordsInput, setProtoWordsInput, showAlert]);

  async function onSignIn(){
    if (!walletClient || !address) {
      showAlert("warning", "Please connect your wallet from the header.");
      return;
    }
    clearAlert();
    setSigning(true);
    try{
      const ts = new Date().toISOString();
      const message = `Sign in to MRS\nAddress: ${address}\nTime: ${ts}`;
      await walletClient.signMessage({ message });
      showAlert("success","Message signed. You are authenticated.");
      if (!heir.phrase) await generateSeed("heir");
      if (!proto.phrase) await generateSeed("proto");
      setConfirmWritten(false);
      setChallenges();
      setHeirWordsInput(["","",""]);
      setProtoWordsInput(["","",""]);
      setCanCreateSafe(false);
    }catch(e:any){
      showAlert("danger", e?.message || "User rejected or signing failed.");
    }finally{ setSigning(false); }
  }

  async function generateSeed(kind: "heir"|"proto"){
    const wallet = ethers.Wallet.createRandom();
    const phrase = wallet.mnemonic && (wallet as any).mnemonic?.phrase ? (wallet as any).mnemonic.phrase : null;
    const priv = wallet.privateKey;
    if (kind === "heir") setHeir({ phrase, priv, revealed:false });
    else setProto({ phrase, priv, revealed:false });
    // Option A: do not persist to localStorage at all. Only keep in memory and ask user to back up offline.
  }
  function maskSeed(kind: "heir"|"proto"): { seed: string; priv: string }{
    return {
      seed: "•••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• (click Reveal)",
      priv: "Private key: •••••• (click Reveal)",
    };
  }
  async function revealSeed(kind: "heir"|"proto"){ 
    let s = kind === "heir" ? heir : proto;
    if (!s.phrase || !s.priv){
      // Generate on-demand quietly
      await generateSeed(kind);
      setChallenges();
      s = kind === "heir" ? { ...heir, phrase: (await Promise.resolve(heir.phrase)), priv: heir.priv } : { ...proto, phrase: (await Promise.resolve(proto.phrase)), priv: proto.priv };
    }
    if (kind === "heir") setHeir({ ...s, revealed:true }); else setProto({ ...s, revealed:true });
    setTimeout(()=>{ if (kind === "heir") setHeir(h=>({ ...h, revealed:false })); else setProto(p=>({ ...p, revealed:false })); }, 5000);
  }
  function normalizeWord(s:string){ return (s||"").trim().toLowerCase(); }
  const onVerifySeeds = useCallback(function onVerifySeeds(): boolean{
    clearAlert();
    setErrorModal(null); // Clear any existing error modal
    try{
      if (!confirmWritten){ 
        const errorMsg = "Please confirm you have written down both seeds securely.";
        showAlert("warning", errorMsg);
        setErrorModal(errorMsg);
        return false; 
      }
      if (!heir.phrase || !proto.phrase){ 
        const errorMsg = "Seeds are not ready yet. Please connect your wallet and generate seeds.";
        showAlert("warning", errorMsg);
        setErrorModal(errorMsg);
        return false; 
      }
      if (heirIdx.length !== 3 || protoIdx.length !== 3){ 
        const errorMsg = "Verification prompts are not ready. Please reconnect or regenerate seeds.";
        showAlert("warning", errorMsg);
        setErrorModal(errorMsg);
        return false; 
      }
      const heirWords = (heir.phrase||"").split(/\s+/);
      const protoWords = (proto.phrase||"").split(/\s+/);
      if (heirWords.length !== 12 || protoWords.length !== 12){ 
        const errorMsg = "Invalid seed format. Regenerate and try again.";
        showAlert("danger", errorMsg);
        setErrorModal(errorMsg);
        return false; 
      }
      const heirOk = heirIdx.every((idx,i)=> normalizeWord(heirWordsInput[i]) === normalizeWord(heirWords[idx]));
      const protoOk = protoIdx.every((idx,i)=> normalizeWord(protoWordsInput[i]) === normalizeWord(protoWords[idx]));
      if (!heirOk || !protoOk){ 
        const errorMsg = "One or more words are incorrect. Please check your notes and try again.";
        showAlert("danger", errorMsg);
        setErrorModal(errorMsg);
        return false; 
      }
      showAlert("success","Seeds verified. You may now create your Safe wallet. This will require an on-chain transaction and gas.");
      setCanCreateSafe(true);
      return true;
    }catch(e:any){ 
      const errorMsg = e?.message || "Verification failed.";
      showAlert("danger", errorMsg);
      setErrorModal(errorMsg);
      return false;
    }
  }, [clearAlert, confirmWritten, showAlert, heir.phrase, proto.phrase, heirIdx, protoIdx, heirWordsInput, protoWordsInput]);

  const createSafe = useCallback(async function createSafe(){
    clearAlert();
    setCreating(true);
    try{
      if (!account){ showAlert('warning','Connect and sign in first.'); return; }
      await ensureAccounts();
      await ensureNetwork();
      const signer = getEthersSigner();
      const safeIface = new ethers.utils.Interface(SAFE_ABI);
      const ZERO = ethers.constants.AddressZero;
      // derive owners
      const heirAddr = ethers.Wallet.fromMnemonic(String(heir.phrase)).address;
      const protoAddr = ethers.Wallet.fromMnemonic(String(proto.phrase)).address;
      const owners = [account, heirAddr, protoAddr];
      const threshold = 2;
      const initializer = safeIface.encodeFunctionData('setup', [owners, ethers.BigNumber.from(threshold), ZERO, '0x', SAFE_130.fallbackHandler, ZERO, 0, ZERO]);
      const factory = new ethers.Contract(SAFE_130.factory, new ethers.utils.Interface(FACTORY_ABI), signer);
      const saltNonce = ethers.BigNumber.from(ethers.utils.hexlify(ethers.utils.randomBytes(32)));
      showAlert('info','Preparing deployment… Please confirm the transaction in your wallet.');
      const tx = await factory.createProxyWithNonce(SAFE_130.singleton, initializer, saltNonce);
      showAlert('info', `Transaction sent. Waiting for confirmation…\nTx: ${tx.hash}`);
      const receipt = await tx.wait();
      let created: string | null = null;
      for (const log of receipt.logs){
        try{
          const parsed = (factory.interface as ethers.utils.Interface).parseLog(log);
          if (parsed.name === 'ProxyCreation'){ created = parsed.args.proxy; break; }
        }catch{}
      }
      if (!created) throw new Error('Could not find ProxyCreation event in receipt');
      setSafeAddress(created);
      try{
        const key = `${CHAIN.keyName}-${ethers.utils.getAddress(account)}`;
        localStorage.setItem(`miras_safe_address_${key}`, created);
      }catch{}
      showAlert('success', `Safe created at: ${created}\nTx: ${tx.hash}`);
    }catch(err:any){
      const pretty = humanizeEthersError(err);
      showAlert(pretty.type, pretty.msg);
    }finally{ setCreating(false); }
  }, [clearAlert, account, ensureAccounts, ensureNetwork, getEthersSigner, heir.phrase, proto.phrase, showAlert, humanizeEthersError]);

  // Combined action: verify first, then create on success
  async function onVerifyAndCreate(){
    const ok = onVerifySeeds();
    if (ok){
      await createSafe();
    }
  }

  // Expose console helpers
  useEffect(() => {
    (window as any).autofill = autofillSeedChecks; // usage: autofill()
    (window as any).verifySeeds = onVerifySeeds; // usage: verifySeeds()
    (window as any).createSafeWallet = createSafe; // usage: createSafeWallet()
  }, [autofillSeedChecks, onVerifySeeds, createSafe]);

  

  return (
    <section className="py-5">
      <div className="container">
        <header className="mb-4 text-center">
          <h1 className="fw-bold section-title">Launch</h1>
        </header>

        

        <div className="row g-3">


        {safeAddress && (
          <div className="mt-4">
          <div className="card mt-4">
            <div className="card-body">
              <h6 className="fw-bold mb-2"><i className="bi bi-shield-check"></i> Your Safe</h6>
              <div className="mb-2">
                <label className="form-label mb-1">Safe Address</label>
                <div className="input-group">
                  <input type="text" className="form-control" readOnly value={safeAddress} />
                  <button className="btn btn-outline-secondary" type="button" onClick={async()=>{ try{ await navigator.clipboard.writeText(safeAddress); showAlert('success','Safe address copied.'); }catch{ showAlert('danger','Copy failed. Please copy manually.'); } }}><i className="bi bi-clipboard"></i> Copy</button>
                </div>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <a className="btn btn-outline-primary" target="_blank" rel="noopener" href={`https://app.safe.global/home?safe=${CHAIN.safePrefix}:${safeAddress}`}><i className="bi bi-box-arrow-up-right"></i> Open in Safe App</a>
                <a className="btn btn-outline-primary" target="_blank" rel="noopener" href={`${CHAIN.explorer}/address/${safeAddress}`}><i className="bi bi-search"></i> View on Explorer</a>
              </div>
              <small className="text-muted d-block mt-2">We saved this address locally on your device for convenience.</small>
            </div>
          </div>

          <div className="card mt-3">
            <div className="card-body">
              <h6 className="fw-bold mb-3"><i className="bi bi-telephone"></i> Contact Information</h6>
              <p className="text-muted small mb-3">
                This is how they&apos;ll contact you regarding claims, so it&apos;s important you provide active numbers and don&apos;t ignore calls. If you ignore calls for an extended period of time, the claim will succeed.
              </p>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Primary Phone Number <span className="text-danger">*</span></label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="+1 (555) 123-4567"
                    value={phone1}
                    onChange={(e) => setPhone1(e.target.value)}
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
                />
                <div className="form-text">Upload a photo of your government-issued ID (passport, driver&apos;s license, etc.). Accepted formats: JPG, PNG, PDF.</div>
              </div>
            </div>
          </div>
          </div>
        )}


        <div className="col-12">
          {alert && (
            <div className={`alert alert-${alert.type}`} role="alert">
              {alert.msg}
            </div>
          )}
        </div>
        
        {(!safeAddress || showNewLaunch) && !account && (
        <div className="col-12">
          <div className="alert alert-info" role="alert">
            <i className="bi bi-info-circle me-2"></i>
            Please connect your wallet using the button in the header to continue.
          </div>
        </div>
        )}

              {/*
        <div className="col-12 col-lg-6">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title"><i className="bi bi-gear me-2" />Configuration</h5>
              <div className="mb-3">
                <label className="form-label">Registry Address</label>
                <input className="form-control" placeholder="0x..." disabled />
              </div>
              <div className="mb-3">
                <label className="form-label">Treasury Address</label>
                <input className="form-control" placeholder="0x..." disabled />
              </div>
              <button className="btn btn-outline-secondary" disabled>Save Config</button>
            </div>
          </div>
        </div>



        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-3"><i className="bi bi-list-check me-2" />Checklist</h5>
              <ul className="mb-0">
                <li>Set Registry address</li>
                <li>Nominate multisig ownership</li>
                <li>Verify contracts on the explorer</li>
              </ul>
            </div>
          </div>
        </div>
        */}
      </div>


      {/* Launch new Safe CTA (only when a Safe already exists) */}
      {safeAddress && !showNewLaunch && (
        <div className="mt-4 text-center">
          <div className="d-flex justify-content-center gap-2 flex-wrap">
            <button className="btn btn-primary btn-lg d-none" onClick={()=>setShowNewLaunch(true)}>
              <i className="bi bi-rocket-takeoff"></i> Launch a new one…
            </button>
            <button className="btn btn-primary btn-lg" type="button" onClick={() => { findAttestors(); }}>
              <i className="bi bi-search"></i> Find Attestors
            </button>
          </div>
          
          <div className="card mt-4">
            <div className="card-body">
              <h5 className="card-title mb-3">
                <i className="bi bi-file-earmark-text me-2"></i>
                Create Your Crypto Will
              </h5>
              <p className="text-muted mb-3">
                Now that you&apos;ve set up your Safe and shared keys with attestors, create a document for your heirs explaining how to claim their inheritance.
              </p>
              <div className="d-flex gap-2 flex-wrap justify-content-center">
                <a 
                  href={`/crypto-will-wizard?safe=${encodeURIComponent(safeAddress)}&heir=${encodeURIComponent(heir.phrase || '')}`}
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

      {/* Seed + Safe creation panel (hidden if a Safe exists unless user opts in) */}
      {(!safeAddress || showNewLaunch) && (
      <div className="mt-4">
        <div className="alert alert-info d-flex align-items-start" role="alert">
          <i className="bi bi-shield-check me-2"></i>
          <div>
            For best security, connect via a wallet that supports hardware wallets. Keys below are generated entirely in your browser and never leave your device.
          </div>
        </div>

        <h5 className="fw-bold mb-2">Generate Recovery Seeds</h5>
        <p className="text-muted">Create two independent seeds: one for your Heir and one for the Protocol Escrow. You can click to reveal and regenerate as needed. Keep them offline and secure.</p>

        <div className="row g-3">
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0">Heir Seed (12 words)</h6>
                  <div className="btn-group">
                    <button className="btn btn-sm btn-outline-secondary" disabled={!account} onClick={()=>revealSeed('heir')}><i className="bi bi-eye"></i> Reveal</button>
                    <button className="btn btn-sm btn-outline-primary" disabled={!account} onClick={()=>{ generateSeed('heir'); setChallenges(); if (heir.revealed) revealSeed('heir'); }}><i className="bi bi-arrow-repeat"></i> Regenerate</button>
                  </div>
                </div>
                <textarea className="form-control" style={{height:96}} readOnly placeholder="•••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• (click Reveal)" value={heir.revealed && heir.phrase ? heir.phrase : maskSeed('heir').seed}></textarea>
                
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0">Protocol Seed (12 words)</h6>
                  <div className="btn-group">
                    <button className="btn btn-sm btn-outline-secondary" disabled={!account} onClick={()=>revealSeed('proto')}><i className="bi bi-eye"></i> Reveal</button>
                    <button className="btn btn-sm btn-outline-primary" disabled={!account} onClick={()=>{ generateSeed('proto'); setChallenges(); if (proto.revealed) revealSeed('proto'); }}><i className="bi bi-arrow-repeat"></i> Regenerate</button>
                  </div>
                </div>
                <textarea className="form-control" style={{height:96}} readOnly placeholder="•••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• (click Reveal)" value={proto.revealed && proto.phrase ? proto.phrase : maskSeed('proto').seed}></textarea>
                
              </div>
            </div>
          </div>
        </div>

        <div className="form-check mt-3">
          <input className="form-check-input" type="checkbox" id="confirmWriteDown" disabled={!account} checked={confirmWritten} onChange={(e)=>setConfirmWritten(e.target.checked)} />
          <label className="form-check-label" htmlFor="confirmWriteDown">I have written down both seeds securely (offline).</label>
        </div>

        <div className="row g-3 align-items-stretch mt-2">
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-body">
                <h6 className="mb-2">Heir Seed Check</h6>
                <div className="row g-2">
                  <div className="col-12">
                    <label className="form-label">Enter word #<span>{heirIdx[0] !== undefined ? heirIdx[0]+1 : '?'}</span></label>
                    <input type="text" className="form-control" placeholder="word" disabled={!account} value={heirWordsInput[0]} onChange={(e)=>setHeirWordsInput([e.target.value, heirWordsInput[1], heirWordsInput[2]])} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Enter word #<span>{heirIdx[1] !== undefined ? heirIdx[1]+1 : '?'}</span></label>
                    <input type="text" className="form-control" placeholder="word" disabled={!account} value={heirWordsInput[1]} onChange={(e)=>setHeirWordsInput([heirWordsInput[0], e.target.value, heirWordsInput[2]])} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Enter word #<span>{heirIdx[2] !== undefined ? heirIdx[2]+1 : '?'}</span></label>
                    <input type="text" className="form-control" placeholder="word" disabled={!account} value={heirWordsInput[2]} onChange={(e)=>setHeirWordsInput([heirWordsInput[0], heirWordsInput[1], e.target.value])} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-body">
                <h6 className="mb-2">Protocol Seed Check</h6>
                <div className="row g-2">
                  <div className="col-12">
                    <label className="form-label">Enter word #<span>{protoIdx[0] !== undefined ? protoIdx[0]+1 : '?'}</span></label>
                    <input type="text" className="form-control" placeholder="word" disabled={!account} value={protoWordsInput[0]} onChange={(e)=>setProtoWordsInput([e.target.value, protoWordsInput[1], protoWordsInput[2]])} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Enter word #<span>{protoIdx[1] !== undefined ? protoIdx[1]+1 : '?'}</span></label>
                    <input type="text" className="form-control" placeholder="word" disabled={!account} value={protoWordsInput[1]} onChange={(e)=>setProtoWordsInput([protoWordsInput[0], e.target.value, protoWordsInput[2]])} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Enter word #<span>{protoIdx[2] !== undefined ? protoIdx[2]+1 : '?'}</span></label>
                    <input type="text" className="form-control" placeholder="word" disabled={!account} value={protoWordsInput[2]} onChange={(e)=>setProtoWordsInput([protoWordsInput[0], protoWordsInput[1], e.target.value])} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2 mt-3">
          <button
            className="btn btn-success btn-lg"
            onClick={onVerifyAndCreate}
            disabled={creating}
          >
            <i className="bi bi-wallet2"></i> {creating ? 'Creating Safe…' : 'Verify & Create Safe Wallet'}
          </button>
        </div>
      </div>
      )}

      {/* Modals */}
      {confirmModal && (
        <>
          <div className="modal fade show" style={{display:'block'}} role="dialog" aria-modal="true">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{confirmModal.title}</h5>
                  <button type="button" className="btn-close" aria-label="Close" onClick={()=>setConfirmModal(null)}></button>
                </div>
                <div className="modal-body">
                  <p className="mb-0">{confirmModal.body}</p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={()=>setConfirmModal(null)}>Cancel</button>
                  <button type="button" className="btn btn-primary" onClick={confirmModal.onConfirm}>Continue</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

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
