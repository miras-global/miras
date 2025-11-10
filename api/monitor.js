// Node 18+
// One-file combined monitor for: Attesters, Safes, Claims
// npm i ethers dotenv redis
import { Contract, Interface, WebSocketProvider } from "ethers";
import { createClient } from "redis";
import 'dotenv/config';

// ---------- CONFIG / CLI ----------
// CLI: --mainnet, --sepolia, --both (default)
const argv = new Set(process.argv.slice(2));
const MODE = argv.has('--mainnet') ? 'mainnet' : argv.has('--sepolia') ? 'sepolia' : argv.has('--both') ? 'both' : 'both';

function buildNetworkConfig(network) {
  const isSepolia = network === 'sepolia';
  const prefix = isSepolia ? 'SEPOLIA' : 'MAINNET';

  const defRpc = isSepolia
    ? (process.env.SEPOLIA_RPC_WS || 'wss://sepolia.infura.io/ws/v3/5659d972536049cb8f625160ba3b3701')
    : (process.env.MAINNET_RPC_WS || '');

  // Defaults pulled from repo where available; override with env
  const defAttesters = isSepolia
    ? (process.env.SEPOLIA_ATTESTERS_PROXY || '0xd40C18eFfD79d28D16ffBEbB8Cb059825376dA7D')
    : (process.env.MAINNET_ATTESTERS_PROXY || '');

  const defSafes = isSepolia
    ? (process.env.SEPOLIA_SAFES_PROXY || '0x354Ca87d709fBB8Afc853A7AF6EFB6C865023163')
    : (process.env.MAINNET_SAFES_PROXY || '');

  const defClaims = isSepolia
    ? (process.env.SEPOLIA_CLAIMS_PROXY || '0xc9a15ECc6AB6dA17E8EaF9177d31Ef55b0a50Ede')
    : (process.env.MAINNET_CLAIMS_PROXY || '0xCBED2362c00587720aC216C37E4b62bCAB2F53E1');

  const RPC_WS = process.env[`${prefix}_RPC_WS`] || defRpc;
  const ATTESTERS_ADDRESS = process.env[`${prefix}_ATTESTERS_PROXY`] || defAttesters;
  const SAFES_ADDRESS = process.env[`${prefix}_SAFES_PROXY`] || defSafes;
  const CLAIMS_ADDRESS = process.env[`${prefix}_CLAIMS_PROXY`] || defClaims;

  const START_BLOCK_ENV = process.env[`${prefix}_START_BLOCK`];
  const START_BLOCK = START_BLOCK_ENV ? Number(START_BLOCK_ENV) : null;
  const CONFIRMATIONS = Number(process.env[`${prefix}_CONFIRMATIONS`]) || Number(process.env.CONFIRMATIONS) || 5;

  return { network, RPC_WS, ATTESTERS_ADDRESS, SAFES_ADDRESS, CLAIMS_ADDRESS, START_BLOCK, CONFIRMATIONS };
}

// ---------- ABIs ----------
// Attesters proxy: event + optional view for bootstrap
const ATTESTERS_ABI = [
  "event AttesterUpserted(address indexed attester, string publicKey, string name, string meta, uint64 updatedAt)",
  "function getAttesters(uint256 offset, uint256 max) view returns (address[] wallets, string[] publicKeys, string[] names, string[] metas, uint64[] updatedAts, bool[] existences, bool[] slashed)"
];

// Safes latest: string[] encryptedPhones (V4/V5)
const SAFES_ABI = [
  "event RowInserted(bytes32 indexed id, address safe_address, uint8 waiting_period, bool death_certificate, address[] attesters, bytes[] encryptedPhones, uint64 createdAt)",
  "event RowUpdated(bytes32 indexed id, uint8 waiting_period, bool death_certificate, address[] attesters, bytes[] encryptedPhones)",
  "function idsLength() view returns (uint256)",
  "function ids(uint256 index) view returns (bytes32)",
  "function get(bytes32 id) view returns (address safe_address, uint8 waiting_period, bool death_certificate, address[] attesters, uint64 createdAt)",
  "function getEncryptedPhones(bytes32 id) view returns (bytes[])"
];

// Claims v2.1
const CLAIMS_ABI = [
  "event ClaimCreated(uint256 indexed id, address indexed claimer, address indexed safe, address attestor, string encryptedPhone, uint64 createdAt)",
  "event StatusChanged(uint256 indexed id, uint8 fromStatus, uint8 toStatus)",
  "event PhoneUpdated(uint256 indexed id, string oldEncryptedPhone, string newEncryptedPhone)",
  "event AttestorUpdated(uint256 indexed id, address oldAttestor, address newAttestor)",
  "event Withdrawn(address indexed to, uint256 amount)",
  "event TreasuryChanged(address indexed oldTreasury, address indexed newTreasury)",
  "event RegisterFeeUpdated(uint256 oldFee, uint256 newFee)",
  "event FeeReceived(address indexed payer, uint256 amount)",
  "function idsLength() view returns (uint256)",
  "function ids(uint256 index) view returns (uint256)",
  "function getClaim(uint256 id) view returns (address claimer, address safe, address attestor, string encryptedPhone, uint64 createdAt, uint8 status)"
];

// ---------- REDIS CLIENT ----------
let redisClient = null;

async function getRedisClient() {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = createClient({ url: redisUrl });
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    await redisClient.connect();
  }
  return redisClient;
}

// ---------- UTIL ----------
async function readLastProcessed(redis, key) {
  try {
    const s = await redis.get(key);
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  } catch { return null; }
}

async function writeLastProcessed(redis, key, blockNumber) {
  await redis.set(key, String(blockNumber));
}

async function storeRecord(redis, key, record) {
  await redis.set(key, JSON.stringify(record));
}

async function queryFilterChunked(contract, filter, from, to, chunkSize = 100) {
  const allLogs = [];
  for (let start = from; start <= to; start += chunkSize) {
    const end = Math.min(start + chunkSize - 1, to);
    const logs = await contract.queryFilter(filter, start, end);
    allLogs.push(...logs);
  }
  return allLogs;
}

// ---------- ATTESTERS WATCHER ----------
async function runAttestersWatcher(cfg) {
  const { network, RPC_WS, ATTESTERS_ADDRESS, START_BLOCK, CONFIRMATIONS } = cfg;
  if (!RPC_WS || !ATTESTERS_ADDRESS) { console.error(`[${network}] Attesters missing RPC or address, skipping.`); return; }

  const redis = await getRedisClient();
  const STATE_KEY = `lastBlock:attesters:${network}`;

  const provider = new WebSocketProvider(RPC_WS);
  const contract = new Contract(ATTESTERS_ADDRESS, ATTESTERS_ABI, provider);
  const filter = contract.filters.AttesterUpserted();

  let currentBlock = await provider.getBlockNumber();
  let lastProcessed = START_BLOCK != null ? START_BLOCK : currentBlock;
  console.log(`[${network}] Attesters connected. Head: ${currentBlock}. From: ${lastProcessed}. Conf: ${CONFIRMATIONS}`);

  try {
    const pattern = `attester:${network}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
      console.log(`[${network}] Attesters: cleared ${keys.length} previous Redis entries.`);
    }
  } catch (err) {
    console.error(`[${network}] Attesters: error clearing Redis:`, err?.message || err);
  }

  try {
    const [wallets, publicKeys, names, metas, updatedAts] = await contract.getAttesters(0, 1000);
    for (let i = 0; i < wallets.length; i++) {
      const address = String(wallets[i] || '').toLowerCase();
      const rec = {
        address,
        public_key: publicKeys[i] ?? '',
        name: names[i] ?? '',
        meta: metas[i] ?? '',
        updated_at: (updatedAts[i] != null ? updatedAts[i].toString() : '0')
      };
      await storeRecord(redis, `attester:${network}:${address}`, rec);
    }
    if (wallets.length > 0) console.log(`[${network}] Attesters repopulated ${wallets.length} entries from Ethereum.`);
  } catch (err) {
    console.error(`[${network}] Attesters repopulate error:`, err?.message || err);
  }

  provider.on('block', async (bn) => {
    currentBlock = bn;
    const safeHead = currentBlock - CONFIRMATIONS;
    if (safeHead <= lastProcessed) return;

    const from = lastProcessed + 1;
    const to = safeHead;
    try {
      console.log(`[${network}] Attesters: scanning ${from} -> ${to} ...`);
      const logs = await queryFilterChunked(contract, filter, from, to);
      for (const log of logs) {
        const address = (log.args?.attester || '').toString().toLowerCase();
        const rec = {
          address,
          public_key: String(log.args?.publicKey || ''),
          name: String(log.args?.name || ''),
          meta: String(log.args?.meta || ''),
          updated_at: String(log.args?.updatedAt || 0),
          _blockNumber: log.blockNumber,
          _txHash: log.transactionHash,
        };
        await storeRecord(redis, `attester:${network}:${address}`, rec);
      }
      lastProcessed = to;
      await writeLastProcessed(redis, STATE_KEY, lastProcessed);
    } catch (err) {
      console.error(`[${network}] Attesters scan error:`, err?.message || err);
    }
  });

  provider._websocket?.on('close', (code) => {
    console.error(`[${network}] Attesters WS closed (${code}).`);
  });
}

// ---------- SAFES WATCHER (latest: bytes[] encryptedPhones) ----------
async function runSafesWatcher(cfg) {
  const { network, RPC_WS, SAFES_ADDRESS, START_BLOCK, CONFIRMATIONS } = cfg;
  if (!RPC_WS || !SAFES_ADDRESS) { console.error(`[${network}] Safes missing RPC or address, skipping.`); return; }

  const redis = await getRedisClient();
  const STATE_KEY = `lastBlock:safes:${network}`;

  const provider = new WebSocketProvider(RPC_WS);
  const contract = new Contract(SAFES_ADDRESS, SAFES_ABI, provider);

  let currentBlock = await provider.getBlockNumber();
  let lastProcessed = START_BLOCK != null ? START_BLOCK : currentBlock;
  console.log(`[${network}] Safes connected. Head: ${currentBlock}. From: ${lastProcessed}. Conf: ${CONFIRMATIONS}`);

  try {
    const pattern = `safe:${network}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
      console.log(`[${network}] Safes: cleared ${keys.length} previous Redis entries.`);
    }
  } catch (err) {
    console.error(`[${network}] Safes: error clearing Redis:`, err?.message || err);
  }

  try {
    const idsLength = await contract.idsLength();
    console.log(`[${network}] Safes: repopulating ${idsLength} entries from Ethereum...`);
    for (let i = 0; i < idsLength; i++) {
      const id = await contract.ids(i);
      const [safe_address, waiting_period, death_certificate, attesters, createdAt] = await contract.get(id);
      const encryptedPhones = await contract.getEncryptedPhones(id);
      
      const rec = {
        id: id.toString(),
        safe_address: String(safe_address || ''),
        waiting_period: Number(waiting_period || 0),
        death_certificate: Boolean(death_certificate || false),
        attesters: (attesters || []).map(String),
        encryptedPhones: (encryptedPhones || []).map(ep => ep.toString()),
        createdAt: Number(createdAt || 0),
      };
      await storeRecord(redis, `safe:${network}:${id}`, rec);
    }
    if (idsLength > 0) console.log(`[${network}] Safes repopulated ${idsLength} entries from Ethereum.`);
  } catch (err) {
    console.error(`[${network}] Safes repopulate error:`, err?.message || err);
  }

  provider.on('block', async (bn) => {
    currentBlock = bn;
    const safeHead = currentBlock - CONFIRMATIONS;
    if (safeHead <= lastProcessed) return;

    const from = lastProcessed + 1;
    const to = safeHead;
    try {
      console.log(`[${network}] Safes: scanning ${from} -> ${to} ...`);
      const inserted = await queryFilterChunked(contract, contract.filters.RowInserted(), from, to);
      for (const log of inserted) {
        const id = log.args?.id?.toString();
        const [safe_address, waiting_period, death_certificate, attesters, createdAt] = await contract.get(log.args?.id);
        const encryptedPhones = await contract.getEncryptedPhones(log.args?.id);
        
        const rec = {
          id,
          safe_address: String(safe_address || ''),
          waiting_period: Number(waiting_period || 0),
          death_certificate: Boolean(death_certificate || false),
          attesters: (attesters || []).map(String),
          encryptedPhones: (encryptedPhones || []).map(ep => ep.toString()),
          createdAt: Number(createdAt || 0),
        };
        await storeRecord(redis, `safe:${network}:${id}`, rec);
      }

      const updated = await queryFilterChunked(contract, contract.filters.RowUpdated(), from, to);
      for (const log of updated) {
        const id = log.args?.id?.toString();
        const [safe_address, waiting_period, death_certificate, attesters, createdAt] = await contract.get(log.args?.id);
        const encryptedPhones = await contract.getEncryptedPhones(log.args?.id);
        
        const rec = {
          id,
          safe_address: String(safe_address || ''),
          waiting_period: Number(waiting_period || 0),
          death_certificate: Boolean(death_certificate || false),
          attesters: (attesters || []).map(String),
          encryptedPhones: (encryptedPhones || []).map(ep => ep.toString()),
          createdAt: Number(createdAt || 0),
        };
        await storeRecord(redis, `safe:${network}:${id}`, rec);
      }

      lastProcessed = to;
      await writeLastProcessed(redis, STATE_KEY, lastProcessed);
    } catch (err) {
      console.error(`[${network}] Safes scan error:`, err?.message || err);
    }
  });

  provider._websocket?.on('close', (code) => {
    console.error(`[${network}] Safes WS closed (${code}).`);
  });
}

// ---------- CLAIMS WATCHER ----------
async function runClaimsWatcher(cfg) {
  const { network, RPC_WS, CLAIMS_ADDRESS, START_BLOCK, CONFIRMATIONS } = cfg;
  if (!RPC_WS || !CLAIMS_ADDRESS) { console.error(`[${network}] Claims missing RPC or address, skipping.`); return; }

  const redis = await getRedisClient();
  const STATE_KEY = `lastBlock:claims:${network}`;

  const provider = new WebSocketProvider(RPC_WS);
  const contract = new Contract(CLAIMS_ADDRESS, CLAIMS_ABI, provider);

  let currentBlock = await provider.getBlockNumber();
  let lastProcessed = START_BLOCK != null ? START_BLOCK : currentBlock;
  console.log(`[${network}] Claims connected. Head: ${currentBlock}. From: ${lastProcessed}. Conf: ${CONFIRMATIONS}`);

  try {
    const pattern = `claim:${network}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
      console.log(`[${network}] Claims: cleared ${keys.length} previous Redis entries.`);
    }
  } catch (err) {
    console.error(`[${network}] Claims: error clearing Redis:`, err?.message || err);
  }

  try {
    const idsLength = await contract.idsLength();
    console.log(`[${network}] Claims: repopulating ${idsLength} entries from Ethereum...`);
    for (let i = 0; i < idsLength; i++) {
      const id = await contract.ids(i);
      const [claimer, safe, attestor, encryptedPhone, createdAt, status] = await contract.getClaim(id);
      
      const rec = {
        id: Number(id || 0),
        claimer: String(claimer || ''),
        safe: String(safe || ''),
        attestor: String(attestor || ''),
        encryptedPhone: String(encryptedPhone || ''),
        createdAt: Number(createdAt || 0),
        status: Number(status || 0),
      };
      await storeRecord(redis, `claim:${network}:${id}`, rec);
    }
    if (idsLength > 0) console.log(`[${network}] Claims repopulated ${idsLength} entries from Ethereum.`);
  } catch (err) {
    console.error(`[${network}] Claims repopulate error:`, err?.message || err);
  }

  provider.on('block', async (bn) => {
    currentBlock = bn;
    const safeHead = currentBlock - CONFIRMATIONS;
    if (safeHead <= lastProcessed) return;

    const from = lastProcessed + 1;
    const to = safeHead;
    try {
      console.log(`[${network}] Claims: scanning ${from} -> ${to} ...`);

      const affectedIds = new Set();

      const created = await queryFilterChunked(contract, contract.filters.ClaimCreated(), from, to);
      for (const log of created) {
        affectedIds.add(Number(log.args?.id || 0));
      }

      const status = await queryFilterChunked(contract, contract.filters.StatusChanged(), from, to);
      for (const log of status) {
        affectedIds.add(Number(log.args?.id || 0));
      }

      const phone = await queryFilterChunked(contract, contract.filters.PhoneUpdated(), from, to);
      for (const log of phone) {
        affectedIds.add(Number(log.args?.id || 0));
      }

      const att = await queryFilterChunked(contract, contract.filters.AttestorUpdated(), from, to);
      for (const log of att) {
        affectedIds.add(Number(log.args?.id || 0));
      }

      for (const id of affectedIds) {
        const [claimer, safe, attestor, encryptedPhone, createdAt, status] = await contract.getClaim(id);
        
        const rec = {
          id,
          claimer: String(claimer || ''),
          safe: String(safe || ''),
          attestor: String(attestor || ''),
          encryptedPhone: String(encryptedPhone || ''),
          createdAt: Number(createdAt || 0),
          status: Number(status || 0),
        };
        await storeRecord(redis, `claim:${network}:${id}`, rec);
      }

      lastProcessed = to;
      await writeLastProcessed(redis, STATE_KEY, lastProcessed);
    } catch (err) {
      console.error(`[${network}] Claims scan error:`, err?.message || err);
    }
  });

  provider._websocket?.on('close', (code) => {
    console.error(`[${network}] Claims WS closed (${code}).`);
  });
}

// ---------- MAIN ----------
async function main() {
  const tasks = [];
  if (MODE === 'sepolia' || MODE === 'both') {
    const cfg = buildNetworkConfig('sepolia');
    tasks.push(runAttestersWatcher(cfg));
    //tasks.push(runSafesWatcher(cfg));
    //tasks.push(runClaimsWatcher(cfg));
  }
  if (MODE === 'mainnet' || MODE === 'both') {
    const cfg = buildNetworkConfig('mainnet');
    tasks.push(runAttestersWatcher(cfg));
    //tasks.push(runSafesWatcher(cfg));
    //tasks.push(runClaimsWatcher(cfg));
  }
  if (tasks.length === 0) {
    console.error('No network selected. Use --sepolia, --mainnet, or --both');
    process.exit(1);
  }
  // Keep alive
  await new Promise(() => {});
}

main().catch((e) => { console.error(e); process.exit(1); });
