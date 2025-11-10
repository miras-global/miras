# Attesters System Contract

The attesters system manages a registry of trusted verifiers who validate inheritance claims. Attesters must stake MRS tokens to register and can be slashed for misbehavior.

## AttestersV2 (v2.sol)

Upgradeable contract for managing attester registration with ERC-20 token staking. Includes slashing mechanisms, fee tracking, and pseudo-random attester selection for claims.

### Deployment Addresses

- **Mainnet Implementation**: `0x2F66691B69f9eBca6DF1Dce18DD469E05bb4aa35`
- **Mainnet Proxy**: `0x458F7192c97CfC909F0BC323A1306F660c7E91c9`
- **Testnet Proxy**: `0xd40C18eFfD79d28D16ffBEbB8Cb059825376dA7D`

### Key Features

- ERC-20 token (MRS) registration fee (default: 100 MRS)
- Attester profile management (publicKey, name, metadata)
- Admin-controlled slashing for misbehavior
- Two-pool system: fee pool and overpay/donation pool
- Pseudo-random attester selection
- Fee tracking per attester
- UUPS upgradeable

### Fee Structure

**Default Registration Fee**: 100 MRS tokens (configurable by admin)

**Overpayment**: Extra tokens beyond the fee are tracked separately and can be donated

---

## Data Structures

### Attester Struct

```solidity
struct Attester {
    address wallet;           // Attester's wallet address
    bytes publicKey;          // Public key for encryption
    string name;              // Display name
    string meta;              // Additional metadata (JSON, URL, etc.)
    uint64 updatedAt;        // Last update timestamp
    bool exists;             // Active status
    bool isSlashed;          // Slashing status
    uint256 totalFeesPaid;   // Cumulative fees paid
    uint256 lastFeePaid;     // Most recent fee payment
    uint64 lastPaidAt;       // Timestamp of last payment
    uint256 totalOverpaid;   // Cumulative overpayments
    uint256 lastOverpaid;    // Most recent overpayment
}
```

### Constants

```solidity
uint256 constant NAME_MAX_LEN = 128;  // Max name length
uint256 constant META_MAX_LEN = 512;  // Max metadata length
```

---

## Functions

### Initialization

#### `initialize`

```solidity
function initialize(address admin_, address feeToken_, uint256 registerFee_) external
```

Initialize the attesters contract (called once via proxy).

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `admin_` | `address` | Admin address for management |
| `feeToken_` | `address` | ERC-20 token address for fees (MRS) |
| `registerFee_` | `uint256` | Initial registration fee amount |

**Requirements:**
- Can only be called once (via proxy initializer)
- All addresses must not be zero
- `registerFee_` must be > 0

**Events:** 
- `AdminTransferred(address(0), admin_)`
- `RegisterFeeUpdated(0, registerFee_)`

#### `initializeDefault`

```solidity
function initializeDefault(address admin_, address feeToken_) external
```

Initialize with default register fee of 100 tokens (100e18 wei).

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `admin_` | `address` | Admin address |
| `feeToken_` | `address` | Fee token address (MRS) |

**Requirements:**
- Can only be called once
- Both addresses must not be zero

**Events:** 
- `AdminTransferred(address(0), admin_)`
- `RegisterFeeUpdated(0, 100e18)`

---

### Core Functions

#### `upsertAttester`

```solidity
function upsertAttester(
    bytes calldata publicKey,
    string calldata name,
    string calldata meta,
    uint256 amount
) external nonReentrant whenInitialized
```

Register as a new attester or update existing registration.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `publicKey` | `bytes` | Public key for encrypted communications |
| `name` | `string` | Display name (max 128 chars) |
| `meta` | `string` | Metadata JSON or URL (max 512 chars) |
| `amount` | `uint256` | Token amount to pay (must be >= registerFee) |

**Requirements:**
- Contract must be initialized
- `amount >= registerFee`
- `name.length <= 128`
- `meta.length <= 512`
- Caller must have approved contract to spend >= `amount` tokens
- Caller must have sufficient token balance

**Behavior:**
1. Transfers tokens from caller
2. Calculates overpay = `amount - registerFee`
3. Creates/updates attester profile
4. Adds to `_wallets` array if first registration
5. Updates fee tracking (total and last payment)
6. Adds fee to `_feePool`, overpay to `_overpayAndDonationPool`

**Events:** 
- `FeeCollected(msg.sender, registerFee, overpay)`
- `AttesterUpserted(msg.sender, publicKey, name, meta, timestamp)`

**Example:**
```javascript
// Approve tokens
await mrsToken.approve(attestersAddress, ethers.utils.parseEther("150"));

// Register with 50 MRS overpay
await attesters.upsertAttester(
  publicKeyBytes,
  "Dr. Smith",
  '{"specialty": "inheritance law"}',
  ethers.utils.parseEther("150") // 100 fee + 50 overpay
);
```

#### `deleteSelf`

```solidity
function deleteSelf() external whenInitialized
```

Mark your attester profile as inactive (fee history preserved).

**Requirements:**
- Caller must have an existing attester profile
- Contract must be initialized

**Behavior:**
- Sets `exists = false`
- Updates `updatedAt` timestamp
- Preserves fee payment history

**Events:** `AttesterDeleted(msg.sender, false)`

**Note:** This is a soft delete. The attester remains in the `_wallets` array and historical data is preserved.

---

### Admin Functions

#### `slash`

```solidity
function slash(address wallet, bool slashed) external onlyAdmin
```

Slash or unslash an attester for misbehavior.

**Access Control:** `onlyAdmin`

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `wallet` | `address` | Attester wallet address |
| `slashed` | `bool` | true to slash, false to unslash |

**Requirements:**
- Caller must be admin
- Attester must exist

**Events:** `AttesterSlashed(wallet, slashed)`

**Use Cases:**
- Slash for failing to verify claims properly
- Slash for fraudulent activity
- Unslash after resolution or appeal

#### `transferAdmin`

```solidity
function transferAdmin(address newAdmin) external onlyAdmin
```

Initiate admin transfer (step 1 of 2).

**Access Control:** `onlyAdmin`

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `newAdmin` | `address` | Proposed new admin address |

**Requirements:**
- Caller must be current admin
- `newAdmin` must not be zero address

**Events:** `AdminTransferInitiated(_admin, newAdmin)`

**Note:** New admin must call `acceptAdmin()` to complete transfer.

#### `acceptAdmin`

```solidity
function acceptAdmin() external
```

Accept admin role (step 2 of 2).

**Requirements:**
- Caller must be the pending admin

**Events:** `AdminTransferred(oldAdmin, newAdmin)`

#### `setWithdrawer`

```solidity
function setWithdrawer(address w) external onlyAdmin
```

Set withdrawal destination address.

**Access Control:** `onlyAdmin`

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `w` | `address` | New withdrawer address |

**Requirements:**
- Caller must be admin
- `w` must not be zero address

**Events:** `WithdrawerUpdated(oldWithdrawer, w)`

#### `setRegisterFee`

```solidity
function setRegisterFee(uint256 newFee) external onlyAdmin
```

Update registration fee amount.

**Access Control:** `onlyAdmin`

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `newFee` | `uint256` | New fee amount in token wei |

**Events:** `RegisterFeeUpdated(oldFee, newFee)`

---

### Withdrawal Functions

#### `withdraw`

```solidity
function withdraw(uint256 amount) external onlyAdmin nonReentrant
```

Withdraw tokens (deducts from overpay pool first, then fee pool).

**Access Control:** `onlyAdmin`

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `amount` | `uint256` | Amount of tokens to withdraw |

**Requirements:**
- Caller must be admin
- Contract balance must be >= `amount`
- If withdrawing from fee pool, `_feePool` must have sufficient balance

**Behavior:**
1. Deducts from `_overpayAndDonationPool` first
2. If more needed, deducts from `_feePool`
3. Transfers to `_withdrawer` address

**Events:** `Withdrawn(withdrawer, amount, fromFee, fromOverpay)`

#### `withdrawOverpay`

```solidity
function withdrawOverpay(uint256 amount) external onlyAdmin nonReentrant
```

Withdraw only from overpay/donation pool (leaves fee pool intact).

**Access Control:** `onlyAdmin`

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `amount` | `uint256` | Amount to withdraw from overpay pool |

**Requirements:**
- Caller must be admin
- `_overpayAndDonationPool >= amount`

**Events:** `OverpayWithdrawn(withdrawer, amount)`

#### `withdrawAll`

```solidity
function withdrawAll() external onlyAdmin nonReentrant
```

Withdraw entire token balance.

**Access Control:** `onlyAdmin`

**Requirements:**
- Caller must be admin
- Contract must have non-zero balance

**Behavior:**
- Withdraws all tokens while maintaining pool accounting
- Prioritizes overpay pool, then fee pool

**Events:** `Withdrawn(withdrawer, totalBalance, fromFee, fromOverpay)`

---

### Donation Function

#### `donate`

```solidity
function donate(uint256 amount) external nonReentrant
```

Donate tokens to the overpay/donation pool.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `amount` | `uint256` | Amount of tokens to donate |

**Requirements:**
- `amount > 0`
- Caller must have approved contract to spend >= `amount` tokens

**Behavior:**
- Transfers tokens from caller
- Adds to `_overpayAndDonationPool`

**Events:** `DonationReceived(msg.sender, amount)`

---

### View Functions

#### `getAttester`

```solidity
function getAttester(address wallet) external view whenInitialized returns (
    address,
    bytes memory,
    string memory,
    string memory,
    uint64,
    bool,
    bool,
    uint256,
    uint256,
    uint64,
    uint256,
    uint256
)
```

Get complete attester profile.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `wallet` | `address` | Attester wallet address |

**Returns:** 
1. `address` - wallet
2. `bytes` - publicKey
3. `string` - name
4. `string` - meta
5. `uint64` - updatedAt
6. `bool` - exists
7. `bool` - isSlashed
8. `uint256` - totalFeesPaid
9. `uint256` - lastFeePaid
10. `uint64` - lastPaidAt
11. `uint256` - totalOverpaid
12. `uint256` - lastOverpaid

#### `getAttesters`

```solidity
function getAttesters(uint256 offset, uint256 max) external view whenInitialized returns (
    address[] memory wallets,
    bytes[] memory publicKeys,
    string[] memory names,
    string[] memory metas,
    uint64[] memory updatedAts,
    bool[] memory existences,
    bool[] memory slashed
)
```

Get paginated list of all registered attesters.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `offset` | `uint256` | Starting index |
| `max` | `uint256` | Maximum results to return |

**Returns:** Arrays of attester data (parallel arrays)

#### `getActiveAttesters`

```solidity
function getActiveAttesters(uint256 offset, uint256 max) external view whenInitialized returns (
    address[] memory wallets,
    bytes[] memory publicKeys,
    string[] memory names,
    string[] memory metas,
    uint64[] memory updatedAts,
    bool[] memory slashed
)
```

Get paginated list of active attesters only.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `offset` | `uint256` | Starting index in active set |
| `max` | `uint256` | Maximum results to return |

**Returns:** Arrays of active attester data

**Note:** Only includes attesters where `exists == true`

#### `pickAttesters`

```solidity
function pickAttesters(uint256 num) public view whenInitialized returns (address[] memory)
```

Pseudo-randomly select N active attesters.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `num` | `uint256` | Number of attesters to select |

**Returns:** `address[]` - Array of selected attester addresses

**Behavior:**
- Filters to only active attesters
- Uses Fisher-Yates shuffle with block hash seed
- If `num > activeCount`, returns all active attesters
- Returns empty array if no active attesters

**Randomness Source:** `keccak256(blockhash(block.number - 1), msg.sender, activeCount)`

**Note:** Not cryptographically secure randomness, suitable for convenience but not high-stakes applications.

#### `pickAttesters` (no args)

```solidity
function pickAttesters() external view whenInitialized returns (address[] memory)
```

Select 3 random active attesters (default).

**Returns:** `address[]` - Array of 3 attester addresses (or fewer if less than 3 active)

#### `attesterCount`

```solidity
function attesterCount() external view whenInitialized returns (uint256)
```

Get total number of registered attesters (includes inactive).

#### `activeCount`

```solidity
function activeCount() public view whenInitialized returns (uint256)
```

Get number of active attesters only.

#### `feeToken`

```solidity
function feeToken() external view returns (address)
```

Get fee token contract address (MRS).

#### `registerFee`

```solidity
function registerFee() external view returns (uint256)
```

Get current registration fee amount.

#### `withdrawer`

```solidity
function withdrawer() external view returns (address)
```

Get withdrawal destination address.

#### `pendingAdmin`

```solidity
function pendingAdmin() external view returns (address)
```

Get pending admin address (during transfer).

#### `contractTokenBalance`

```solidity
function contractTokenBalance() external view returns (uint256)
```

Get contract's total token balance.

#### `pools`

```solidity
function pools() external view returns (uint256 feePool, uint256 overpayDonationPool)
```

Get current pool balances.

**Returns:**
- `feePool` - Accumulated registration fees
- `overpayDonationPool` - Accumulated overpayments and donations

#### `feeInfo`

```solidity
function feeInfo(address wallet) external view whenInitialized returns (
    uint256 totalFeesPaid,
    uint256 lastFeePaid,
    uint64 lastPaidAt,
    uint256 totalOverpaid,
    uint256 lastOverpaid
)
```

Get fee payment history for an attester.

---

### Upgrade Functions

#### `_authorizeUpgrade`

```solidity
function _authorizeUpgrade(address newImplementation) internal override onlyAdmin
```

Authorization check for UUPS upgrades.

**Access Control:** `onlyAdmin`

---

## Events

```solidity
event AttesterUpserted(
    address indexed wallet,
    bytes publicKey,
    string name,
    string meta,
    uint64 updatedAt
);

event AttesterDeleted(address indexed wallet, bool exists);

event AttesterSlashed(address indexed wallet, bool slashed);

event FeeCollected(address indexed from, uint256 feeAmount, uint256 overpay);

event Withdrawn(address indexed to, uint256 amount, uint256 fromFee, uint256 fromOverpay);

event OverpayWithdrawn(address indexed to, uint256 amount);

event DonationReceived(address indexed from, uint256 amount);

event AdminTransferred(address indexed oldAdmin, address indexed newAdmin);

event AdminTransferInitiated(address indexed currentAdmin, address indexed pendingAdmin);

event WithdrawerUpdated(address indexed oldWithdrawer, address indexed newWithdrawer);

event RegisterFeeUpdated(uint256 oldFee, uint256 newFee);
```

---

## Usage Examples

### Registering as an Attester

```javascript
// Generate keypair for encryption (off-chain)
const { publicKey, privateKey } = generateKeyPair();

// Approve tokens (100 MRS fee + optional overpay)
await mrsToken.approve(attestersAddress, ethers.utils.parseEther("120"));

// Register
await attesters.upsertAttester(
  publicKey,
  "Dr. Jane Smith",
  JSON.stringify({
    specialty: "Estate Law",
    location: "New York",
    website: "https://example.com"
  }),
  ethers.utils.parseEther("120") // 100 fee + 20 overpay
);
```

### Updating Attester Profile

```javascript
// Update with same or higher fee
await mrsToken.approve(attestersAddress, ethers.utils.parseEther("100"));
await attesters.upsertAttester(
  newPublicKey,
  "Dr. Jane Smith, Esq.",
  JSON.stringify({ specialty: "Inheritance & Trusts" }),
  ethers.utils.parseEther("100")
);
```

### Admin Slashing an Attester

```javascript
// Slash for misbehavior
await attesters.connect(adminSigner).slash(attesterAddress, true);

// Later, unslash after resolution
await attesters.connect(adminSigner).slash(attesterAddress, false);
```

### Picking Random Attesters for a Claim

```javascript
// Get 3 random active attesters
const selectedAttesters = await attesters.pickAttesters();

// Or specify a different number
const fiveAttesters = await attesters["pickAttesters(uint256)"](5);
```

### Admin Withdrawing Fees

```javascript
// Withdraw overpay only
await attesters.connect(adminSigner).withdrawOverpay(
  ethers.utils.parseEther("50")
);

// Withdraw from any pool
await attesters.connect(adminSigner).withdraw(
  ethers.utils.parseEther("200")
);

// Withdraw everything
await attesters.connect(adminSigner).withdrawAll();
```

### Transferring Admin

```javascript
// Step 1: Current admin initiates
await attesters.connect(currentAdmin).transferAdmin(newAdminAddress);

// Step 2: New admin accepts
await attesters.connect(newAdmin).acceptAdmin();
```

---

## Security Considerations

- **Reentrancy Protection**: All state-changing functions use `nonReentrant` modifier
- **Two-Step Admin Transfer**: Prevents accidental admin loss
- **Slashing Mechanism**: Allows punishing misbehaving attesters
- **Pool Separation**: Fee pool separate from overpay/donation pool
- **Input Validation**: Name/meta length limits prevent gas attacks
- **Authorization**: Admin-only functions for sensitive operations
- **Soft Deletion**: Preserves historical data when attester deactivates

## Workflow

1. **Registration**: Attester approves and calls `upsertAttester()` with 100 MRS + optional overpay
2. **Active Service**: Attester appears in `pickAttesters()` results for claim assignments
3. **Monitoring**: System tracks attester performance off-chain
4. **Slashing**: If misbehavior detected, admin calls `slash(address, true)`
5. **Updates**: Attester can call `upsertAttester()` again to update profile
6. **Deactivation**: Attester can call `deleteSelf()` to mark inactive
7. **Fee Collection**: Admin periodically withdraws accumulated fees

## Two-Pool System

The contract maintains two separate pools:

1. **Fee Pool** (`_feePool`): Exact registration fees paid
2. **Overpay/Donation Pool** (`_overpayAndDonationPool`): Extra payments beyond fees

**Withdrawal Priority:**
- `withdraw()`: Deducts from overpay pool first, then fee pool
- `withdrawOverpay()`: Only deducts from overpay pool
- `withdrawAll()`: Withdraws all while maintaining pool consistency

This separation allows tracking of earned fees vs. voluntary contributions.

## Additional Resources

- [Main Contracts README](../README.md)
- [Claims System](../claims/README.md)
- [Token System](../token/README.md)
