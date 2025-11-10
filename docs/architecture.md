# Miras System Architecture

## Overview

Miras is a trustless, blockchain-based cryptocurrency inheritance system that enables secure transfer of digital assets to designated heirs without relying on custodians or intermediaries. The system operates on Ethereum (Mainnet and Sepolia testnet) and provides a complete solution for estate planning in the crypto ecosystem.

## High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        WEB[Next.js Web Application]
        WALLET[Wallet Integration<br/>RainbowKit + Wagmi]
        CRYPTO[Client-Side Encryption<br/>ECIES]
    end
    
    subgraph "Blockchain Layer"
        ATTESTERS[AttestersV4 Contract<br/>Verifier Registry]
        CLAIMS[ClaimsDBV3.1 Contract<br/>Claims Management]
        SAFES[SafeTableV6 Contract<br/>Safe Configuration]
        TOKEN[MRS Token Contract<br/>ERC-20]
        EXCHANGE[Exchange Contract<br/>ETH ↔ MRS]
        GNOSIS[Gnosis Safe<br/>2-of-3 Multisig]
    end
    
    subgraph "Backend Layer"
        API[PHP API<br/>Data Query Service]
        MONITOR[Node.js Monitor<br/>Event Listener]
        REDIS[(Redis Cache<br/>Indexed Data)]
    end
    
    subgraph "External"
        ETHEREUM[Ethereum Network<br/>Mainnet/Sepolia]
    end
    
    WEB --> WALLET
    WEB --> CRYPTO
    WALLET --> ATTESTERS
    WALLET --> CLAIMS
    WALLET --> SAFES
    WALLET --> TOKEN
    WALLET --> EXCHANGE
    WALLET --> GNOSIS
    
    ATTESTERS --> ETHEREUM
    CLAIMS --> ETHEREUM
    SAFES --> ETHEREUM
    TOKEN --> ETHEREUM
    EXCHANGE --> ETHEREUM
    GNOSIS --> ETHEREUM
    
    MONITOR --> ETHEREUM
    MONITOR --> REDIS
    API --> REDIS
    WEB --> API
    
    style WEB fill:#e1f5ff
    style ATTESTERS fill:#fff4e6
    style CLAIMS fill:#fff4e6
    style SAFES fill:#fff4e6
    style TOKEN fill:#fff4e6
    style EXCHANGE fill:#fff4e6
    style GNOSIS fill:#fff4e6
    style REDIS fill:#f3e5f5
```

## Component Architecture

### 1. Frontend Layer (Next.js Application)

The frontend is built with Next.js 14 and provides user-facing interfaces for all protocol interactions.

```mermaid
graph LR
    subgraph "Next.js App Router"
        LAUNCH[Launch Page<br/>Safe Creation]
        CLAIM[Claim Page<br/>Initiate Claims]
        REGISTER[Register Page<br/>Attester Onboarding]
        TRACK[Track Page<br/>Claims Dashboard]
        EXCHANGE_UI[Exchange Page<br/>Token Swap]
    end
    
    subgraph "Shared Libraries"
        CONFIG[config.ts<br/>Network Config]
        WALLET_LIB[wallet.ts<br/>Ethers.js Bridge]
        CRYPTO_LIB[crypto.ts<br/>ECIES Encryption]
        WAGMI_LIB[wagmi.ts<br/>Wallet Connectors]
    end
    
    subgraph "Web3 Providers"
        WAGMI_PROVIDER[WagmiProvider]
        RAINBOW[RainbowKitProvider]
        QUERY[QueryClientProvider]
    end
    
    LAUNCH --> CONFIG
    CLAIM --> CONFIG
    REGISTER --> CONFIG
    TRACK --> CONFIG
    EXCHANGE_UI --> CONFIG
    
    LAUNCH --> WALLET_LIB
    CLAIM --> WALLET_LIB
    REGISTER --> WALLET_LIB
    TRACK --> WALLET_LIB
    
    LAUNCH --> CRYPTO_LIB
    CLAIM --> CRYPTO_LIB
    TRACK --> CRYPTO_LIB
    REGISTER --> CRYPTO_LIB
    
    WAGMI_PROVIDER --> WAGMI_LIB
    RAINBOW --> WAGMI_LIB
    
    style LAUNCH fill:#e3f2fd
    style CLAIM fill:#e3f2fd
    style REGISTER fill:#e3f2fd
    style TRACK fill:#e3f2fd
    style EXCHANGE_UI fill:#e3f2fd
```

**Key Components:**

- **Launch Page**: Handles Safe wallet creation, seed generation, and attester selection
- **Claim Page**: Enables heirs to initiate inheritance claims
- **Register Page**: Attester onboarding and staking interface
- **Track Page**: Allows attesters to view and manage assigned claims
- **Exchange Page**: Fixed-rate token exchange (10 MRS = 1 ETH)

**Shared Libraries:**

- **config.ts**: Centralized network configuration with contract addresses
- **wallet.ts**: Bridges Wagmi wallet clients to Ethers.js signers
- **crypto.ts**: ECIES encryption/decryption utilities
- **wagmi.ts**: Wallet connector configuration

### 2. Smart Contract Layer

The smart contract layer implements the core protocol logic using UUPS upgradeable patterns.

```mermaid
graph TB
    subgraph "Core Contracts"
        ATTESTERS_IMPL[AttestersV4<br/>Implementation]
        CLAIMS_IMPL[ClaimsDBV3.1<br/>Implementation]
        SAFES_IMPL[SafeTableV6<br/>Implementation]
    end
    
    subgraph "Proxy Contracts"
        ATTESTERS_PROXY[Attesters Proxy<br/>0x458F...91c9]
        CLAIMS_PROXY[Claims Proxy<br/>0xCE7E...571De]
        SAFES_PROXY[SafeTable Proxy<br/>0xE29B...F384]
    end
    
    subgraph "Token Contracts"
        MRS_TOKEN[MRS Token<br/>0x9532...e48a]
        EXCHANGE_IMPL[Exchange Implementation]
        EXCHANGE_PROXY[Exchange Proxy<br/>0x17df...DA4Da]
    end
    
    subgraph "External Contracts"
        GNOSIS_SAFE[Gnosis Safe<br/>User's Multisig Wallet]
        SAFE_FACTORY[Safe Factory<br/>Deployment]
    end
    
    ATTESTERS_PROXY -->|delegatecall| ATTESTERS_IMPL
    CLAIMS_PROXY -->|delegatecall| CLAIMS_IMPL
    SAFES_PROXY -->|delegatecall| SAFES_IMPL
    EXCHANGE_PROXY -->|delegatecall| EXCHANGE_IMPL
    
    ATTESTERS_IMPL -->|requires| MRS_TOKEN
    CLAIMS_IMPL -->|requires| MRS_TOKEN
    EXCHANGE_IMPL -->|holds| MRS_TOKEN
    
    SAFES_IMPL -->|stores config for| GNOSIS_SAFE
    SAFE_FACTORY -->|deploys| GNOSIS_SAFE
    
    style ATTESTERS_IMPL fill:#fff9c4
    style CLAIMS_IMPL fill:#fff9c4
    style SAFES_IMPL fill:#fff9c4
    style EXCHANGE_IMPL fill:#fff9c4
    style MRS_TOKEN fill:#c8e6c9
```

**Contract Relationships:**

- **Proxy Pattern**: All core contracts use UUPS (Universal Upgradeable Proxy Standard)
- **Token Dependencies**: AttestersV4 and ClaimsDBV3.1 require MRS token for fees
- **Safe Integration**: SafeTableV6 stores configuration for Gnosis Safe wallets

### 3. Backend Services Layer

The backend services provide event indexing and data caching for improved frontend performance.

```mermaid
graph LR
    subgraph "Event Monitoring"
        MONITOR[monitor.js<br/>Node.js Service]
        ATTESTERS_WATCHER[Attesters Watcher<br/>AttesterUpserted events]
        SAFES_WATCHER[Safes Watcher<br/>RowInserted/Updated events]
        CLAIMS_WATCHER[Claims Watcher<br/>ClaimCreated events]
    end
    
    subgraph "Data Storage"
        REDIS[(Redis Cache)]
        ATTESTER_KEYS[attester:network:address]
        SAFE_KEYS[safe:network:id]
        CLAIM_KEYS[claim:network:id]
        BLOCK_KEYS[lastBlock:module:network]
    end
    
    subgraph "API Service"
        API[index.php<br/>HTTP API]
        ATTESTERS_ENDPOINT[GET /?module=attesters]
        SAFES_ENDPOINT[GET /?module=safes]
        CLAIMS_ENDPOINT[GET /?module=claims]
    end
    
    MONITOR --> ATTESTERS_WATCHER
    MONITOR --> SAFES_WATCHER
    MONITOR --> CLAIMS_WATCHER
    
    ATTESTERS_WATCHER --> ATTESTER_KEYS
    SAFES_WATCHER --> SAFE_KEYS
    CLAIMS_WATCHER --> CLAIM_KEYS
    
    ATTESTER_KEYS --> REDIS
    SAFE_KEYS --> REDIS
    CLAIM_KEYS --> REDIS
    BLOCK_KEYS --> REDIS
    
    API --> ATTESTERS_ENDPOINT
    API --> SAFES_ENDPOINT
    API --> CLAIMS_ENDPOINT
    
    ATTESTERS_ENDPOINT --> REDIS
    SAFES_ENDPOINT --> REDIS
    CLAIMS_ENDPOINT --> REDIS
    
    style MONITOR fill:#e8f5e9
    style API fill:#e8f5e9
    style REDIS fill:#f3e5f5
```

**Backend Components:**

- **monitor.js**: Listens to blockchain events and indexes data into Redis
- **index.php**: Provides HTTP API for querying cached blockchain data
- **Redis**: Fast key-value store for indexed blockchain data

## Data Flow Architecture

### Safe Creation Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant AttestersV4
    participant SafeFactory
    participant SafeTableV6
    participant GnosisSafe
    
    User->>Frontend: Initiate Safe Creation
    Frontend->>Frontend: Generate 3 Seeds<br/>(User, Heir, Protocol)
    Frontend->>User: Challenge Seed Verification
    User->>Frontend: Verify Seeds
    Frontend->>AttestersV4: pickAttesters(3)
    AttestersV4-->>Frontend: Return 3 Attesters
    Frontend->>Frontend: Encrypt Data with<br/>Attester Public Keys
    Frontend->>SafeFactory: Deploy Safe<br/>(2-of-3 Multisig)
    SafeFactory-->>GnosisSafe: Create Safe
    GnosisSafe-->>Frontend: Safe Address
    Frontend->>SafeTableV6: insert(safe_address,<br/>waiting_period, attesters)
    SafeTableV6-->>Frontend: Confirmation
    Frontend->>User: Safe Created Successfully
```

### Claim Initiation Flow

```mermaid
sequenceDiagram
    participant Heir
    participant Frontend
    participant MRS_Token
    participant ClaimsDBV3_1
    participant Attester
    
    Heir->>Frontend: Initiate Claim
    Frontend->>Frontend: Encrypt Claim Data<br/>with Attester Public Key
    Frontend->>MRS_Token: approve(ClaimsDB, 10 MRS)
    MRS_Token-->>Frontend: Approval Confirmed
    Frontend->>ClaimsDBV3_1: createClaim(encryptedSafe,<br/>attestor, encryptedPhone, 10 MRS)
    ClaimsDBV3_1->>MRS_Token: transferFrom(heir, contract, 10 MRS)
    MRS_Token-->>ClaimsDBV3_1: Transfer Success
    ClaimsDBV3_1-->>Frontend: Claim ID
    Frontend->>Heir: Claim Created (ID: X)
    
    Note over Attester: Attester receives notification
    Attester->>ClaimsDBV3_1: getClaimsByAttester(address)
    ClaimsDBV3_1-->>Attester: Claim Details (encrypted)
    Attester->>Attester: Decrypt with Private Key
    Attester->>Attester: Verify Death Certificate
```

### Attester Registration Flow

```mermaid
sequenceDiagram
    participant Attester
    participant Frontend
    participant MRS_Token
    participant AttestersV4
    
    Attester->>Frontend: Register as Attester
    Frontend->>Frontend: Generate Keypair<br/>(Public/Private)
    Frontend->>Frontend: Save Encrypted Keystore
    Frontend->>MRS_Token: approve(AttestersV4, 100 MRS)
    MRS_Token-->>Frontend: Approval Confirmed
    Frontend->>AttestersV4: upsertAttester(publicKey,<br/>name, meta, 100 MRS)
    AttestersV4->>MRS_Token: transferFrom(attester, contract, 100 MRS)
    MRS_Token-->>AttestersV4: Transfer Success
    AttestersV4->>AttestersV4: Store Attester Profile
    AttestersV4-->>Frontend: Registration Confirmed
    Frontend->>Attester: Registration Complete
```

## Security Architecture

### Cryptographic Key Management

```mermaid
graph TB
    subgraph "Safe Multisig Keys"
        KEY_A[Key A<br/>User Retains]
        KEY_B[Key B<br/>Given to Heir Offline]
        KEY_C[Key C<br/>Protocol Encrypted]
    end
    
    subgraph "Attester Keys"
        ATTESTER_PUB[Public Key<br/>Stored On-Chain]
        ATTESTER_PRIV[Private Key<br/>Encrypted Keystore]
    end
    
    subgraph "Encryption"
        ECIES[ECIES Encryption<br/>Elliptic Curve]
        CLIENT_SIDE[Client-Side Only<br/>Never Transmitted]
    end
    
    KEY_A -->|2-of-3| SAFE_THRESHOLD[Safe Threshold]
    KEY_B -->|2-of-3| SAFE_THRESHOLD
    KEY_C -->|2-of-3| SAFE_THRESHOLD
    
    ATTESTER_PUB -->|encrypts| SENSITIVE_DATA[Sensitive Data<br/>Phone, Safe Info]
    ATTESTER_PRIV -->|decrypts| SENSITIVE_DATA
    
    ECIES -->|protects| ATTESTER_PRIV
    ECIES -->|protects| KEY_C
    
    CLIENT_SIDE -->|generates| KEY_A
    CLIENT_SIDE -->|generates| KEY_B
    CLIENT_SIDE -->|generates| KEY_C
    CLIENT_SIDE -->|generates| ATTESTER_PRIV
    
    style KEY_A fill:#ffcdd2
    style KEY_B fill:#ffcdd2
    style KEY_C fill:#ffcdd2
    style ATTESTER_PRIV fill:#c5cae9
    style CLIENT_SIDE fill:#c8e6c9
```

**Security Principles:**

1. **No Single Point of Failure**: 2-of-3 multisig ensures no single party can access funds
2. **Client-Side Encryption**: All private keys generated in browser, never transmitted
3. **Decentralized Verification**: Randomly selected, staked attesters confirm user status
4. **Privacy**: Sensitive information encrypted with attester public keys before on-chain storage
5. **Economic Security**: Attesters stake 100 MRS tokens, subject to slashing for misbehavior

### Access Control Architecture

```mermaid
graph TB
    subgraph "AttestersV4 Access Control"
        ADMIN_A[Admin/Withdrawer]
        ATTESTER_USER[Attester User]
        
        ADMIN_A -->|can| SLASH[Slash Attesters]
        ADMIN_A -->|can| SET_FEE_A[Set Register Fee]
        ADMIN_A -->|can| WITHDRAW_A[Withdraw Fees]
        ADMIN_A -->|can| UPGRADE_A[Upgrade Contract]
        
        ATTESTER_USER -->|can| REGISTER[Register/Update Profile]
        ATTESTER_USER -->|can| RESIGN[Request Resignation]
        ATTESTER_USER -->|can| WITHDRAW_DEPOSIT[Withdraw Deposit]
    end
    
    subgraph "ClaimsDBV3.1 Access Control"
        TREASURY_C[Treasury]
        CLAIMER[Claimer User]
        
        TREASURY_C -->|can| SET_STATUS[Set Claim Status]
        TREASURY_C -->|can| WITHDRAW_C[Withdraw Tokens]
        TREASURY_C -->|can| UPGRADE_C[Upgrade Contract]
        
        CLAIMER -->|can| CREATE_CLAIM[Create Claim]
        CLAIMER -->|can| UPDATE_PHONE[Update Encrypted Phone]
        CLAIMER -->|can| UPDATE_ATTESTOR[Update Attestor]
    end
    
    subgraph "SafeTableV6 Access Control"
        TREASURY_S[Treasury]
        SAFE_OWNER[Safe Owner]
        
        TREASURY_S -->|can| SET_FEE_S[Set Fee]
        TREASURY_S -->|can| WITHDRAW_S[Withdraw ETH]
        TREASURY_S -->|can| UPGRADE_S[Upgrade Contract]
        
        SAFE_OWNER -->|can| INSERT[Insert Safe Config]
        SAFE_OWNER -->|can| UPDATE[Update Safe Config]
    end
    
    style ADMIN_A fill:#ffebee
    style TREASURY_C fill:#ffebee
    style TREASURY_S fill:#ffebee
    style ATTESTER_USER fill:#e8f5e9
    style CLAIMER fill:#e8f5e9
    style SAFE_OWNER fill:#e8f5e9
```

## Network Architecture

### Deployment Architecture

```mermaid
graph TB
    subgraph "Mainnet Deployment"
        MAIN_ATTESTERS[AttestersV4 Proxy<br/>0x458F...91c9]
        MAIN_CLAIMS[ClaimsDBV3.1 Proxy<br/>0xCE7E...571De]
        MAIN_SAFES[SafeTableV6 Proxy<br/>0xE29B...F384]
        MAIN_TOKEN[MRS Token<br/>0x9532...e48a]
        MAIN_EXCHANGE[Exchange Proxy<br/>0x17df...DA4Da]
    end
    
    subgraph "Sepolia Testnet Deployment"
        TEST_ATTESTERS[AttestersV4 Proxy<br/>0xdB4E...E665]
        TEST_CLAIMS[ClaimsDBV3.1 Proxy<br/>0x81bE...7418]
        TEST_SAFES[SafeTableV6 Proxy<br/>0xE06c...c886]
        TEST_TOKEN[MRS Token<br/>Testnet]
        TEST_EXCHANGE[Exchange Proxy<br/>Testnet]
    end
    
    subgraph "Configuration"
        ENV_VAR[NEXT_PUBLIC_NETWORK]
        CONFIG_TS[lib/config.ts]
    end
    
    ENV_VAR -->|mainnet| CONFIG_TS
    ENV_VAR -->|sepolia| CONFIG_TS
    
    CONFIG_TS -->|selects| MAIN_ATTESTERS
    CONFIG_TS -->|selects| MAIN_CLAIMS
    CONFIG_TS -->|selects| MAIN_SAFES
    CONFIG_TS -->|selects| MAIN_TOKEN
    CONFIG_TS -->|selects| MAIN_EXCHANGE
    
    CONFIG_TS -->|selects| TEST_ATTESTERS
    CONFIG_TS -->|selects| TEST_CLAIMS
    CONFIG_TS -->|selects| TEST_SAFES
    CONFIG_TS -->|selects| TEST_TOKEN
    CONFIG_TS -->|selects| TEST_EXCHANGE
    
    style MAIN_ATTESTERS fill:#1976d2,color:#fff
    style MAIN_CLAIMS fill:#1976d2,color:#fff
    style MAIN_SAFES fill:#1976d2,color:#fff
    style MAIN_TOKEN fill:#1976d2,color:#fff
    style MAIN_EXCHANGE fill:#1976d2,color:#fff
    style TEST_ATTESTERS fill:#7b1fa2,color:#fff
    style TEST_CLAIMS fill:#7b1fa2,color:#fff
    style TEST_SAFES fill:#7b1fa2,color:#fff
    style TEST_TOKEN fill:#7b1fa2,color:#fff
    style TEST_EXCHANGE fill:#7b1fa2,color:#fff
```

## Technology Stack

### Frontend Stack

- **Framework**: Next.js 14 (React 18, TypeScript)
- **Web3 Integration**: Wagmi, RainbowKit, Ethers.js
- **Wallet Support**: MetaMask, WalletConnect, Coinbase Wallet, etc.
- **Encryption**: ECIES (Elliptic Curve Integrated Encryption Scheme)
- **Styling**: Tailwind CSS (inferred from modern Next.js setup)

### Smart Contract Stack

- **Language**: Solidity 0.8.24
- **Upgradeability**: UUPS (Universal Upgradeable Proxy Standard)
- **Standards**: ERC-20 (MRS Token), EIP-2612 (Permit), ERC-1967 (Proxy)
- **External Dependencies**: OpenZeppelin contracts, Gnosis Safe

### Backend Stack

- **Event Monitoring**: Node.js with Ethers.js
- **API**: PHP
- **Cache**: Redis
- **RPC**: WebSocket connections to Ethereum nodes (Infura)

## Scalability Considerations

### Current Architecture

- **On-Chain Storage**: Minimal data stored on-chain (addresses, encrypted blobs)
- **Off-Chain Indexing**: Redis cache for fast queries
- **Event-Driven**: Backend monitors events and updates cache asynchronously

### Future Enhancements

- **Layer 2 Integration**: Deploy to Optimism, Arbitrum, or other L2s for lower fees
- **IPFS Storage**: Store large encrypted data on IPFS, reference hashes on-chain
- **Subgraph**: Use The Graph protocol for more sophisticated queries
- **Multi-Chain**: Support multiple EVM-compatible chains

## Conclusion

The Miras architecture is designed with security, decentralization, and user privacy as core principles. The three-layer architecture (Frontend, Blockchain, Backend) provides a robust foundation for trustless cryptocurrency inheritance, with clear separation of concerns and upgradeable smart contracts for future improvements.
