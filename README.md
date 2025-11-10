# Miras - Trustless Inheritance Solution

> **Status**: Active development | Open source | Community-driven

Pass on your Bitcoin and Ethereum assets to your family — no lawyers, no middlemen. Secure, automated, and decentralized estate planning for cryptocurrency.

## Overview

Miras is a trustless blockchain-based inheritance system that enables cryptocurrency holders to create secure inheritance plans using multi-signature wallets, staked verifiers, and time-locked claims. The system ensures that no single party (not the heir, the protocol, or any individual) can access funds alone, while providing a clear mechanism for heirs to claim assets after proper verification.

### Key Features

- **🔒 Trustless Security**: Multi-signature wallets enforce that no single party can move funds unilaterally
- **🔑 Key Privacy**: Protocol stores only encrypted keys; plaintext keys never leave your device
- **⏱️ Time-Locked Claims**: Configurable waiting periods (default: 3 months) with owner notification
- **👥 Staked Verifiers**: Attesters have funds at risk and are slashable for bad behavior
- **🔍 Transparency**: All actions are visible on-chain; personal data stays off-chain
- **⚙️ Flexible Configuration**: Support for multiple heirs, higher quorums (3-of-5), and custom requirements

## How It Works

### 1. Create a Threshold Multi-Sig

Default configuration is **2-of-3** (customizable). You generate three keys:

- **Key A**: You keep this key
- **Key B**: You may later give this to your heir
- **Key C**: Encrypted on your device and stored by the protocol (protocol never sees plaintext)

**Result**: While you're alive, you control all three keys and can always move your funds. After passing keys to your heir and escrowing one with the protocol, no single party can access funds alone.

### 2. Heir Initiates a Claim

When the time comes, your heir starts a claim on the protocol. A staked **verifier pool** is randomly selected and assigned to the case. Verifiers have funds at risk and are slashable for bad behavior.

### 3. Waiting & Verification

A **waiting period** begins (default: 3 months, configurable). During this window:
- Verifiers must contact you to confirm you're alive
- You can require extra evidence (e.g., death certificate)
- If you confirm you're alive via on-chain signal, the claim is canceled

### 4. Automatic Release

If the waiting period elapses without your objection and all conditions are satisfied, the protocol enables a valid **2-of-3** signature path for your heir to receive the assets. Funds move only when quorum is satisfied.

## Smart Contracts Architecture

All core contracts use the **UUPS (Universal Upgradeable Proxy Standard)** pattern for upgradeability.

### MRS Token

ERC-20 token with governance features and gasless approvals.

**Features:**
- Owner-controlled minting with optional supply cap
- Burnable by token holders
- EIP-2612 permit support for gasless approvals
- Standard ERC-20 semantics

**Addresses:**
- **Mainnet**: `0x95324aE4b5D91C7444868228E10fAa7Fa9Fbe48a`
- **Sepolia Testnet**: `0xb1d080F4F56A6ef848cDfacD7B125ac50B0D2ced`

### Exchange (Fixed Rate)

Fixed-rate exchange facilitating conversion between ETH and MRS tokens.

**Exchange Rate**: 10 MRS = 1 ETH

**Addresses:**
- **Mainnet**: `0x7937A695Cc89a39ef6711bb7616f5ad41e094786`
- **Sepolia Testnet**: `0x4457e7ed86d8a360bce9d6098023fe7163930476`

### Claims Database

Manages inheritance claims with ERC-20 token fees and slashing support.

**Features:**
- Fee-based claim creation (default: 10 MRS tokens)
- Claim status tracking (Pending, Approved, Rejected, Canceled)
- Encrypted phone data storage for heir verification
- Treasury-controlled fee management
- Slashing mechanism for bad actors

**Addresses:**
- **Mainnet**: `0xCBED2362c00587720aC216C37E4b62bCAB2F53E1`

### Attesters Registry

Registry of verified attesters who validate inheritance claims.

**Features:**
- Registration fee: 100 MRS tokens (default)
- Public attester profiles (name, email, website, phone)
- Slashing mechanism for misbehavior
- Fee tracking and history
- Admin-controlled withdrawals

**Addresses:**
- **Mainnet**: `0x2F66691B69f9eBca6DF1Dce18DD469E05bb4aa35`
- **Sepolia Testnet**: `0xd40C18eFfD79d28D16ffBEbB8Cb059825376dA7D`

### Safe Table Registry

Fee-gated registry for managing Safe (Gnosis Safe) inheritance configurations.

**Features:**
- Insert/update fee: 1 ETH per operation
- Stores Safe address, waiting period, and attester assignments
- Treasury-controlled fee collection
- Reentrancy protection

**Addresses:**
- **Mainnet**: `0xC42c67FBd99a5EEfB10A56147859308836adcc8B`
- **Sepolia Testnet**: `0xA52Da13D9cEa091cF6932b4fEB05f44074ef8D2e`

## Token Economics

### MRS

- **Fixed Exchange Rate**: 10 MRS = 1 ETH
- **Supply**: Mintable by owner with optional cap
- **Utility**: Used for all protocol fees (claims, attester registration)
- **Burning**: Optional burning by token holders

### Fee Structure

| Action | Fee | Notes |
|--------|-----|-------|
| Register as Attester | 100 MRS | Staked, slashable |
| Create Claim | 10 MRS | Paid to treasury |
| Safe Table Insert/Update | 1 ETH | Paid to treasury |
| Create Miras Contract | 0.1 ETH per attester | Minimum 3 attesters |
| Add Attester Review | 0.01 ETH | For reputation building |

**Treasury Allocation**: 20% of all fees go to treasury for maintenance and sustainability.

## Web Interface

Built with **Next.js 14**, **React**, and **Bootstrap 5**.

### Pages

- **Home** (`/`): Introduction and how-it-works guide
- **Get Started** (`/get-started`): Step-by-step setup guide
- **Register** (`/register`): Attester registration with client-side key generation
- **Exchange** (`/exchange`): Token ↔ ETH exchange interface
- **Claim** (`/claim`): Create and manage inheritance claims
- **Validate** (`/validate`): Attester validation interface
- **Track** (`/track`): Track claim status
- **Pricing** (`/pricing`): Transparent fee structure

### Security Features

- **Client-side key generation**: Private keys never leave your browser
- **Encrypted keystores**: JSON v3 keystore with user-defined passphrase
- **MetaMask integration**: Secure wallet connections
- **No server-side secrets**: All cryptographic operations occur locally

## Project Structure

```
miras/
├── contracts/              # Smart contracts (Solidity)
│   ├── token/             # MRS token and exchange
│   │   ├── token.sol      # MRS ERC-20 token
│   │   └── exchangeV1.sol # Fixed-rate exchange
│   ├── claims/            # Claims database
│   │   └── v2.1.sol       # Claims management
│   ├── attesters/         # Attesters registry
│   │   └── v2.sol         # Attester registration
│   ├── safes/             # Safe table registry
│   │   └── v1.sol         # Safe management
│   ├── proxy.sol          # ERC1967 proxy implementation
│   └── _upgradeable.sol   # UUPS base contract
├── web/                   # Next.js web application
│   ├── app/               # Pages and routes
│   ├── components/        # React components
│   └── lib/               # Utilities (crypto, wallet)
├── handlers/              # Event monitoring scripts
└── scripts/               # Deployment and utility scripts
```

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- Yarn or npm
- MetaMask or compatible Web3 wallet

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/esokullu/miras.git
   cd miras
   ```

2. **Install root dependencies**
   ```bash
   yarn install
   ```

3. **Setup web application**
   ```bash
   cd web
   npm install
   npm run dev
   ```
   
   The web app will be available at `http://localhost:3000`

4. **Setup event handlers** (optional)
   ```bash
   cd handlers
   npm install
   node monitor-attesters.js
   ```

### Smart Contract Development

The project uses **Hardhat** with OpenZeppelin's upgrades plugin.

**Deployment order:**
1. Token contract
2. Exchange contract
3. Exchange proxy

See `contracts/README.md` for detailed deployment instructions.

### Event Monitoring

Event handlers listen to contract events and populate the public attesters database.

**Configuration** (environment variables):
- `RPC_WS`: WebSocket RPC endpoint
- `CONTRACT_ADDRESS`: Address to monitor
- `START_BLOCK`: Starting block number

See `handlers/README.md` for detailed setup.

## Security Model

### Trustless Design

- **No single point of control**: 2-of-3 multisig enforced by Safe contracts
- **Key privacy**: Protocol only stores encrypted keys
- **Quorum enforcement**: Smart contracts ensure minimum signatures required
- **Transparent operations**: All actions recorded on blockchain

### Incentive Alignment

- **Staked attesters**: Attesters must stake MRS tokens to participate
- **Slashing mechanism**: Bad actors lose their stake
- **Fee-based economy**: Sustainable incentives for honest behavior

### Auditability

- **Open source**: All code publicly available
- **On-chain transparency**: All critical actions recorded on blockchain
- **Well-audited dependencies**: Uses Safe (Gnosis Safe) for multisig functionality

## Bitcoin Support

To include Bitcoin in your inheritance plan, use an ERC-20 representation:

- **wBTC** ([Wrapped Bitcoin](https://wbtc.network/)): Custodial BTC-backed ERC-20
- **tBTC** ([Threshold Network](https://threshold.network/tbtc)): Trustless decentralized BTC bridge

Choose based on your trust preferences. Custodial options (wBTC) involve a trusted custodian, while trustless options (tBTC) use decentralized protocols.

## Networks

- **Mainnet**: Ethereum
- **Testnet**: Sepolia

## FAQ

**Q: What if I'm alive and someone files a claim?**  
A: Submit a simple on-chain objection or respond to verifier outreach. The claim is canceled, and funds remain secure.

**Q: Can anyone see my keys or move funds without me?**  
A: No. The protocol only holds an encrypted key. No single party can meet the 2-of-3 quorum alone.

**Q: Do I have to use 2-of-3?**  
A: No. You can choose higher thresholds (e.g., 3-of-5) or multiple heirs with custom configurations.

**Q: Can I require a death certificate?**  
A: Yes. You can make release conditions stricter by requiring additional documentation beyond the waiting period.

**Q: Is the code open source?**  
A: Yes. All code is open source for transparency and auditability. The codebase generates keys client-side, and plaintext keys are never transmitted.

**Q: How do I handle multiple heirs?**  
A: Create a separate Safe (multisig wallet) for each heir or asset bundle. This isolates risk, allows custom thresholds per heir, and simplifies execution.

## Resources

- **Safe Documentation**: https://docs.safe.global/
- **EIP-2612 (Permit)**: https://eips.ethereum.org/EIPS/eip-2612
- **UUPS Proxy Pattern**: https://eips.ethereum.org/EIPS/eip-1822

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT

## Legal Notice

This is a non-custodial, protocol-based inheritance workflow. It is not legal or tax advice. Please consult local regulations and legal professionals as needed for your jurisdiction.

---

**Note**: Miras provides the technical infrastructure for trustless inheritance. Users are responsible for understanding and complying with applicable laws in their jurisdictions.
