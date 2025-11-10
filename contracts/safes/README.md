# Safes System Contract

The safes system maintains a registry of Safe (formerly Gnosis Safe) configurations for inheritance management, collecting a 1 ETH fee per registration or update.

## SafeTable (v1.sol)

Fee-gated registry for managing Safe wallet configurations. Each entry stores the Safe address, waiting period, death certificate requirement, and designated attesters for inheritance claims.

### Deployment Addresses

- **Mainnet Implementation**: `0xC42c67FBd99a5EEfB10A56147859308836adcc8B`
- **Mainnet Proxy**: `0xE29B5B8A909F77223133A67F4fA494DF548DF384`
- **Testnet Implementation**: `0x6a305a72B60C3BA7A14195c255A0412D4d08f1cA`
- **Testnet Proxy**: `0x354Ca87d709fBB8Afc853A7AF6EFB6C865023163`

### Key Features

- Fixed 1 ETH fee per insert/update
- Safe wallet configuration storage
- Waiting period management
- Death certificate flag
- Attester designation (up to 3)
- Treasury-controlled withdrawals
- UUPS upgradeable

### Fee Structure

**Registration/Update Fee**: 1 ETH (fixed, non-configurable)

---

## Data Structure

### Row Struct

```solidity
struct Row {
    uint256 id;                      // Unique row identifier
    address safe_address;            // Safe wallet address
    uint256 waiting_period;          // Days to wait before claim execution
    bool death_certificate;          // Whether death certificate is required
    address[3] attesters;            // Array of up to 3 attester addresses
    uint64 createdAt;               // Creation timestamp
    bytes[] encryptedPhones;        // [Unused in current implementation]
}
```

**Note:** The `encryptedPhones` field exists in the struct but is not used in the current `insert()`, `update()`, or `get()` functions.

---

## Functions

### Initialization

#### `initialize`

```solidity
function initialize(address treasury_) external
```

Initialize the SafeTable contract (called once via proxy).

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `treasury_` | `address` | Treasury address for fee withdrawals |

**Requirements:**
- Can only be called once (via proxy initializer)
- `treasury_` must not be zero address

**Events:** `TreasuryUpdated(address(0), treasury_)`

---

### Core Functions

#### `insert`

```solidity
function insert(
    uint256 id,
    address safe_address,
    uint256 waiting_period,
    bool death_certificate,
    address[3] calldata attesters
) external payable nonReentrant whenInitialized
```

Create a new Safe configuration entry.

**Payment:** Must send at least 1 ETH (`msg.value >= 1 ether`)

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `id` | `uint256` | Unique identifier for this Safe config |
| `safe_address` | `address` | Address of the Safe wallet |
| `waiting_period` | `uint256` | Number of days to wait before claim execution |
| `death_certificate` | `bool` | Whether a death certificate is required |
| `attesters` | `address[3]` | Array of up to 3 attester addresses |

**Requirements:**
- `msg.value >= 1 ether`
- `safe_address` must not be zero address
- `id` must not already exist

**Behavior:**
1. Verifies ETH payment
2. Creates new Row with provided data
3. Adds id to `_ids` array
4. Records creation timestamp

**Events:** 
- `FeeCollected(msg.sender, msg.value)`
- `RowInserted(id, safe_address, waiting_period, death_certificate, attesters, createdAt)`

**Example:**
```javascript
await safeTable.insert(
  1,
  safeWalletAddress,
  30, // 30 days waiting period
  true, // death certificate required
  [attester1, attester2, attester3],
  { value: ethers.utils.parseEther("1.0") }
);
```

#### `update`

```solidity
function update(
    uint256 id,
    uint256 waiting_period,
    bool death_certificate,
    address[3] calldata attesters
) external payable nonReentrant whenInitialized
```

Update an existing Safe configuration.

**Payment:** Must send at least 1 ETH (`msg.value >= 1 ether`)

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `id` | `uint256` | ID of existing Safe config to update |
| `waiting_period` | `uint256` | New waiting period in days |
| `death_certificate` | `bool` | New death certificate requirement |
| `attesters` | `address[3]` | New attester addresses |

**Requirements:**
- `msg.value >= 1 ether`
- `id` must exist in registry
- Row must be found in `_ids` array

**Behavior:**
1. Verifies ETH payment
2. Locates existing row by id
3. Updates waiting_period, death_certificate, and attesters
4. Preserves safe_address and createdAt
5. Charges 1 ETH fee for update

**Events:** 
- `FeeCollected(msg.sender, msg.value)`
- `RowUpdated(id, waiting_period, death_certificate, attesters)`

**Note:** Safe address cannot be changed via update. Create a new entry to register a different Safe.

**Example:**
```javascript
// Update attesters and waiting period
await safeTable.update(
  1,
  45, // new 45 day waiting period
  true,
  [newAttester1, newAttester2, newAttester3],
  { value: ethers.utils.parseEther("1.0") }
);
```

---

### View Functions

#### `get`

```solidity
function get(uint256 id) external view whenInitialized returns (
    address safe_address,
    uint256 waiting_period,
    bool death_certificate,
    address[3] memory attesters,
    uint64 createdAt
)
```

Retrieve Safe configuration by ID.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `id` | `uint256` | Safe configuration ID to query |

**Returns:**
| Name | Type | Description |
|------|------|-------------|
| `safe_address` | `address` | Safe wallet address |
| `waiting_period` | `uint256` | Waiting period in days |
| `death_certificate` | `bool` | Death certificate requirement |
| `attesters` | `address[3]` | Array of attester addresses |
| `createdAt` | `uint64` | Creation timestamp |

**Requirements:**
- `id` must exist in registry
- Contract must be initialized

**Example:**
```javascript
const config = await safeTable.get(1);
console.log("Safe:", config.safe_address);
console.log("Waiting Period:", config.waiting_period, "days");
console.log("Death Certificate Required:", config.death_certificate);
console.log("Attesters:", config.attesters);
```

#### `idsLength`

```solidity
function idsLength() external view whenInitialized returns (uint256)
```

Get total number of registered Safe configurations.

**Returns:** `uint256` - Total count of registered Safes

---

### Treasury Functions

#### `setTreasury`

```solidity
function setTreasury(address newTreasury) external onlyTreasury whenInitialized
```

Change treasury address.

**Access Control:** `onlyTreasury`

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `newTreasury` | `address` | New treasury address |

**Requirements:**
- Caller must be current treasury
- `newTreasury` must not be zero address

**Events:** `TreasuryUpdated(oldTreasury, newTreasury)`

#### `withdraw`

```solidity
function withdraw(uint256 amount) external onlyTreasury nonReentrant
```

Withdraw specific amount of ETH (treasury only).

**Access Control:** `onlyTreasury`

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `amount` | `uint256` | Amount of ETH to withdraw (in wei) |

**Requirements:**
- Caller must be treasury
- Contract balance must be >= `amount`

**Events:** `Withdrawn(treasury, amount)`

**Example:**
```javascript
// Withdraw 10 ETH
await safeTable.connect(treasurySigner).withdraw(
  ethers.utils.parseEther("10")
);
```

#### `withdrawAll`

```solidity
function withdrawAll() external onlyTreasury nonReentrant
```

Withdraw entire ETH balance (treasury only).

**Access Control:** `onlyTreasury`

**Requirements:**
- Caller must be treasury
- Contract must have non-zero balance

**Events:** `Withdrawn(treasury, entireBalance)`

---

### Special Functions

#### `receive`

```solidity
receive() external payable
```

Accept direct ETH transfers to the contract.

**Behavior:**
- Allows the contract to receive ETH without calling a function
- Useful for donations or sending ETH without registering a Safe

**Note:** ETH sent via `receive()` goes to the contract balance and can be withdrawn by treasury.

---

### Upgrade Functions

#### `_authorizeUpgrade`

```solidity
function _authorizeUpgrade(address newImplementation) internal override onlyTreasury
```

Authorization check for UUPS upgrades.

**Access Control:** `onlyTreasury`

**Requirements:**
- Caller must be treasury

---

## Events

```solidity
event RowInserted(
    uint256 indexed id,
    address indexed safe_address,
    uint256 waiting_period,
    bool death_certificate,
    address[3] attesters,
    uint64 createdAt
);

event RowUpdated(
    uint256 indexed id,
    uint256 waiting_period,
    bool death_certificate,
    address[3] attesters
);

event FeeCollected(address indexed from, uint256 amount);

event Withdrawn(address indexed to, uint256 amount);

event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
```

---

## Usage Examples

### Registering a Safe

```javascript
// Deploy or get existing Safe wallet
const safeAddress = "0x..."; // Your Safe wallet address

// Register Safe configuration
const tx = await safeTable.insert(
  1, // unique ID
  safeAddress,
  30, // 30 day waiting period
  true, // death certificate required
  [attester1Address, attester2Address, attester3Address],
  { value: ethers.utils.parseEther("1.0") }
);

await tx.wait();
console.log("Safe registered!");
```

### Updating Safe Configuration

```javascript
// Change waiting period and attesters
await safeTable.update(
  1, // existing ID
  45, // new 45 day waiting period
  false, // death certificate no longer required
  [newAttester1, newAttester2, ethers.constants.AddressZero], // 2 attesters
  { value: ethers.utils.parseEther("1.0") }
);
```

### Querying Safe Configuration

```javascript
// Get Safe config
const config = await safeTable.get(1);

console.log("Safe Address:", config.safe_address);
console.log("Waiting Period:", config.waiting_period, "days");
console.log("Death Cert Required:", config.death_certificate);
console.log("Attesters:", config.attesters);
console.log("Created:", new Date(config.createdAt * 1000));
```

### Treasury Operations

```javascript
// Check balance
const balance = await ethers.provider.getBalance(safeTableAddress);
console.log("Contract balance:", ethers.utils.formatEther(balance), "ETH");

// Withdraw as treasury
await safeTable.connect(treasurySigner).withdraw(
  ethers.utils.parseEther("5.0")
);

// Or withdraw all
await safeTable.connect(treasurySigner).withdrawAll();
```

---

## Integration with Safe Wallets

SafeTable is designed to work with [Safe](https://safe.global) (formerly Gnosis Safe) multi-signature wallets for secure asset management:

### Typical Configuration

```javascript
// Example: 2-of-3 Safe with inheritance
// Owners: User, Heir1, Heir2
// Threshold: 2 signatures required

const safeConfig = {
  safe_address: "0x...", // Safe wallet with 2-of-3 threshold
  waiting_period: 30,    // 30 days after death claim
  death_certificate: true, // Require official documentation
  attesters: [
    doctor_address,      // Medical professional
    lawyer_address,      // Legal professional  
    notary_address       // Notary public
  ]
};
```

### Inheritance Flow

1. **User registers Safe** via `insert()` with attesters and waiting period
2. **Upon death**, heir initiates claim through ClaimsDB
3. **Attesters verify** death and authenticate claim
4. **After waiting_period**, heir gains access to Safe
5. **Safe executes** asset transfer using existing signatures

---

## Security Considerations

- **Fixed Fee**: 1 ETH fee prevents spam registrations
- **Reentrancy Protection**: All payable functions use `nonReentrant` modifier
- **Authorization**: Treasury-only withdrawals and updates
- **Input Validation**: Checks for zero addresses and existing IDs
- **Immutable Safe Address**: Cannot change safe_address via update (prevents hijacking)
- **Event Logging**: All operations emit events for off-chain tracking
- **Upgradeable**: UUPS pattern allows fixing bugs while preserving state

## Design Decisions

### Why 1 ETH Fee?

- **Anti-Spam**: High enough to prevent frivolous registrations
- **Value Storage**: Reflects importance of inheritance configurations
- **Treasury Funding**: Supports ongoing system operations

### Why Pay-Per-Update?

- **Quality Control**: Discourages frequent unnecessary changes
- **Network Value**: Each update is a significant action worth logging
- **Fair Pricing**: Users pay for state changes they make

### Why Fixed Array of 3 Attesters?

- **Gas Efficiency**: Fixed-size arrays are cheaper than dynamic
- **Consensus Model**: 3 attesters provide good balance of security and availability
- **Flexibility**: Can use fewer by setting some to address(0)

---

## Workflow

1. **Safe Deployment**: User creates Safe wallet with owners and threshold
2. **Registration**: User calls `insert()` with Safe config and 1 ETH
3. **Optional Updates**: User calls `update()` to modify config (1 ETH each time)
4. **Claim Creation**: Upon death, heir creates claim via ClaimsDB
5. **Verification**: System uses registered attesters from SafeTable
6. **Execution**: After waiting_period and verifications, heir accesses Safe

---

## Additional Resources

- [Safe Documentation](https://docs.safe.global)
- [Main Contracts README](../README.md)
- [Claims System](../claims/README.md)
- [Attesters System](../attesters/README.md)
- [UUPS Upgradeable Pattern](https://eips.ethereum.org/EIPS/eip-1822)

---

## SafeTable (v4.sol)

V4 removes the numeric/id key and keys rows by `owner` and `safe_address`, allowing a single owner to register multiple safes. Fees are configurable via `fee` and collected on `insert` and `update`.

### Data Model

```solidity
struct Row {
  address owner;              // The owner who registered this configuration (msg.sender)
  address safe_address;       // Safe wallet address
  uint8   waiting_period;     // Days to wait before claim execution
  bool    death_certificate;  // Whether death certificate is required
  address[] attesters;        // Dynamic list of attester addresses
  bytes[]  encryptedPhones;   // Encrypted phone payloads matching attesters
  uint256  feePaid;           // Cumulative wei paid by this owner for this row
  uint64   createdAt;         // Creation timestamp
}
```

Rows are addressed by `(owner, safe_address)`.

### Functions

#### `insert`

```solidity
function insert(
  address safe_address,
  uint8 waiting_period,
  bool death_certificate,
  address[] calldata attesters,
  bytes[] calldata encryptedPhones
) external payable
```

- Creates a new row for `(msg.sender, safe_address)`.
- Requirements:
- **`msg.value >= fee`**
- `encryptedPhones.length == attesters.length`
- Row for `(msg.sender, safe_address)` must not already exist
- Emits: `FeeCollected`, `RowInserted(owner, safe_address, ...)`

#### `update`

```solidity
function update(
  address safe_address,
  uint8 waiting_period,
  bool death_certificate,
  address[] calldata attesters,
  bytes[] calldata encryptedPhones
) external payable
```

- Updates the existing row for `(msg.sender, safe_address)`.
- Requirements:
- Row must exist
- **`msg.value >= fee`**
- `encryptedPhones.length == attesters.length`
- Emits: `FeeCollected`, `RowUpdated(owner, safe_address, ...)`

#### `get`

```solidity
function get(address owner, address safe_address) external view returns (
  address safe,
  uint8 waiting_period,
  bool death_certificate,
  address[] memory attesters,
  uint64 createdAt
)
```

#### `getEncryptedPhones`

```solidity
function getEncryptedPhones(address owner, address safe_address) external view returns (bytes[] memory)
```

#### `hasRow`

```solidity
function hasRow(address owner, address safe_address) external view returns (bool)
```

#### Enumeration Helpers

Implementations may provide:

- `function listSafes(address owner) external view returns (address[] memory)`
- `function countSafes(address owner) external view returns (uint256)`

### Events

```solidity
event RowInserted(
  address indexed owner,
  address indexed safe_address,
  uint8 waiting_period,
  bool death_certificate,
  address[] attesters,
  bytes[] encryptedPhones,
  uint64 createdAt
);

event RowUpdated(
  address indexed owner,
  address indexed safe_address,
  uint8 waiting_period,
  bool death_certificate,
  address[] attesters,
  bytes[] encryptedPhones
);

event FeeCollected(address indexed payer, uint256 amount);
```

### Notes

- One owner can maintain multiple safes; use `(owner, safe_address)` as the key in off-chain indexing.
- `fee` is configurable by treasury via `setFee()`.
- Treasury retains withdraw controls identical to earlier versions.
