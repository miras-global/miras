# Claims System Contract

The claims system manages inheritance claims with ERC-20 token fees, allowing claimers to create claims that must be verified by designated attesters before approval.

## ClaimsDBV2 (v2.1.sol)

Upgradeable contract for managing inheritance claims with ERC-20 token fee structure. Claimers pay a fee in MRS tokens to create claims, which are then reviewed by the treasury before approval.

### Deployment Addresses

- **Mainnet Implementation**: `0xCBED2362c00587720aC216C37E4b62bCAB2F53E1`
- **Mainnet Proxy**: `0x6eED1ce777F9ab8a75245D6538640Ab71B27C106`
- **Testnet Proxy**: `0xEc29414ABc3868954DE8cd450ed4635A6229BbBd`

### Key Features

- ERC-20 token (MRS) fee system (default: 10 MRS per claim)
- Claim status management (Pending, Approved, Rejected, Cancelled)
- Encrypted phone number storage
- Treasury-controlled approvals
- Fee-on-transfer token support
- UUPS upgradeable

### Fee Structure

**Default Registration Fee**: 10 MRS tokens (configurable by treasury)

---

## Data Structures

### Claim Struct

```solidity
struct Claim {
    uint256 id;                    // Unique claim identifier
    address claimer;               // Address creating the claim
    address safe;                  // Safe contract address
    address attestor;              // Designated attestor address
    bytes encryptedPhone;          // Encrypted phone number
    uint256 amount;                // Claim amount
    Status status;                 // Current status
    uint64 createdAt;             // Creation timestamp
    uint64 updatedAt;             // Last update timestamp
}
```

### Status Enum

```solidity
enum Status {
    Pending,    // 0 - Awaiting review
    Approved,   // 1 - Approved by treasury
    Rejected,   // 2 - Rejected by treasury
    Cancelled   // 3 - Cancelled by claimer
}
```

---

## Functions

### Initialization

#### `initialize`

```solidity
function initialize(address treasury_, address feeToken_) external
```

Initialize the claims contract (called once via proxy).

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `treasury_` | `address` | Treasury address for approvals and withdrawals |
| `feeToken_` | `address` | ERC-20 token address for fees (MRS) |

**Requirements:**
- Can only be called once (via proxy initializer)
- Both addresses must not be zero

**Events:** `TreasuryUpdated(address(0), treasury_)`

#### `initializeDefault`

```solidity
function initializeDefault(address treasury_, address feeToken_) external
```

Initialize with default register fee of 10 tokens (10e18 wei).

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `treasury_` | `address` | Treasury address |
| `feeToken_` | `address` | Fee token address (MRS) |

**Requirements:**
- Can only be called once
- Both addresses must not be zero

**Events:** 
- `TreasuryUpdated(address(0), treasury_)`
- `RegisterFeeUpdated(0, 10e18)`

---

### Core Functions

#### `createClaim`

```solidity
function createClaim(
    address safe,
    address attestor,
    bytes calldata encryptedPhone,
    uint256 amount
) external nonReentrant whenInitialized returns (uint256)
```

Create a new inheritance claim by paying the registration fee.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `safe` | `address` | Safe contract address holding assets |
| `attestor` | `address` | Designated attestor for verification |
| `encryptedPhone` | `bytes` | Encrypted phone number for contact |
| `amount` | `uint256` | Claimed inheritance amount |

**Returns:** `uint256` - New claim ID

**Requirements:**
- Contract must be initialized
- Caller must have approved contract to spend >= `registerFee` tokens
- Caller must have sufficient token balance
- `safe` and `attestor` must not be zero addresses

**Behavior:**
1. Transfers fee tokens from caller to contract (handles fee-on-transfer tokens)
2. Creates new claim with Pending status
3. Increments claim counter
4. Stores claim data

**Events:** 
- `FeeCollected(msg.sender, actualFeeReceived)`
- `ClaimCreated(claimId, msg.sender, safe, attestor, encryptedPhone, amount, createdAt)`

**Example:**
```javascript
await mrsToken.approve(claimsDBAddress, ethers.utils.parseEther("10"));
const tx = await claimsDB.createClaim(
  safeAddress,
  attesterAddress,
  encryptedPhoneBytes,
  claimAmount
);
```

---

### Claim Management

#### `setStatus`

```solidity
function setStatus(uint256 claimId, Status newStatus) external onlyTreasury whenInitialized
```

Update claim status (treasury only).

**Access Control:** `onlyTreasury`

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `claimId` | `uint256` | Claim ID to update |
| `newStatus` | `Status` | New status (0=Pending, 1=Approved, 2=Rejected, 3=Cancelled) |

**Requirements:**
- Caller must be treasury
- Claim must exist (`claimId < _ids.length`)

**Events:** `StatusUpdated(claimId, oldStatus, newStatus, block.timestamp)`

#### `updateEncryptedPhone`

```solidity
function updateEncryptedPhone(uint256 claimId, bytes calldata newEncryptedPhone) external whenInitialized
```

Update encrypted phone number (claimer only, while pending).

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `claimId` | `uint256` | Claim ID to update |
| `newEncryptedPhone` | `bytes` | New encrypted phone data |

**Requirements:**
- Caller must be the original claimer
- Claim status must be Pending
- Claim must exist

**Events:** `EncryptedPhoneUpdated(claimId, newEncryptedPhone, block.timestamp)`

#### `updateAttestor`

```solidity
function updateAttestor(uint256 claimId, address newAttestor) external whenInitialized
```

Update designated attestor (claimer only, while pending).

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `claimId` | `uint256` | Claim ID to update |
| `newAttestor` | `address` | New attestor address |

**Requirements:**
- Caller must be the original claimer
- Claim status must be Pending
- Claim must exist
- `newAttestor` must not be zero address

**Events:** `AttestorUpdated(claimId, oldAttestor, newAttestor, block.timestamp)`

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

#### `setRegisterFee`

```solidity
function setRegisterFee(uint256 newFee) external onlyTreasury
```

Update claim registration fee.

**Access Control:** `onlyTreasury`

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `newFee` | `uint256` | New fee amount in token wei |

**Requirements:**
- Caller must be treasury

**Events:** `RegisterFeeUpdated(oldFee, newFee)`

#### `withdrawTokens`

```solidity
function withdrawTokens(uint256 amount) external onlyTreasury nonReentrant
```

Withdraw collected fee tokens (treasury only).

**Access Control:** `onlyTreasury`

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `amount` | `uint256` | Amount of tokens to withdraw |

**Requirements:**
- Caller must be treasury
- Contract token balance must be >= `amount`

**Events:** `Withdrawn(treasury, amount)`

#### `withdrawAllTokens`

```solidity
function withdrawAllTokens() external onlyTreasury nonReentrant
```

Withdraw entire token balance (treasury only).

**Access Control:** `onlyTreasury`

**Requirements:**
- Caller must be treasury
- Contract must have non-zero token balance

**Events:** `Withdrawn(treasury, entireBalance)`

---

### View Functions

#### `getClaim`

```solidity
function getClaim(uint256 claimId) external view whenInitialized returns (
    uint256 id,
    address claimer,
    address safe,
    address attestor,
    bytes memory encryptedPhone,
    uint256 amount,
    Status status,
    uint64 createdAt,
    uint64 updatedAt
)
```

Retrieve full claim details.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `claimId` | `uint256` | Claim ID to query |

**Returns:** All fields from the Claim struct

**Requirements:**
- Contract must be initialized
- Claim must exist (`claimId < _ids.length`)

#### `idsLength`

```solidity
function idsLength() external view whenInitialized returns (uint256)
```

Get total number of claims created.

**Returns:** `uint256` - Total claim count

#### `treasury`

```solidity
function treasury() external view returns (address)
```

Get current treasury address.

#### `registerFee`

```solidity
function registerFee() external view returns (uint256)
```

Get current registration fee amount.

#### `feeToken`

```solidity
function feeToken() external view returns (address)
```

Get fee token contract address (MRS).

#### `contractBalance`

```solidity
function contractBalance() external view returns (uint256)
```

Get contract's token balance.

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

### Internal Helper Functions

#### `_pullReceived`

```solidity
function _pullReceived(address token, address from, uint256 expectedAmount) internal returns (uint256)
```

Transfer tokens and return actual amount received (handles fee-on-transfer tokens).

**Note:** Used internally to support tokens that charge a fee on transfer.

#### `_safeTransfer`

```solidity
function _safeTransfer(address token, address to, uint256 amount) internal
```

Safely transfer tokens with success verification.

#### `_safeTransferFrom`

```solidity
function _safeTransferFrom(address token, address from, address to, uint256 amount) internal
```

Safely transfer tokens from one address to another with success verification.

---

## Events

```solidity
event ClaimCreated(
    uint256 indexed id,
    address indexed claimer,
    address indexed safe,
    address attestor,
    bytes encryptedPhone,
    uint256 amount,
    uint64 createdAt
);

event StatusUpdated(
    uint256 indexed id,
    Status oldStatus,
    Status newStatus,
    uint64 updatedAt
);

event EncryptedPhoneUpdated(
    uint256 indexed id,
    bytes newEncryptedPhone,
    uint64 updatedAt
);

event AttestorUpdated(
    uint256 indexed id,
    address oldAttestor,
    address newAttestor,
    uint64 updatedAt
);

event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

event RegisterFeeUpdated(uint256 oldFee, uint256 newFee);

event FeeCollected(address indexed from, uint256 amount);

event Withdrawn(address indexed to, uint256 amount);
```

---

## Usage Examples

### Creating a Claim

```javascript
// Approve ClaimsDB to spend MRS tokens
await mrsToken.approve(claimsDBAddress, ethers.utils.parseEther("10"));

// Encrypt phone number (off-chain)
const encryptedPhone = encryptPhoneNumber(phoneNumber, publicKey);

// Create claim
const tx = await claimsDB.createClaim(
  safeContractAddress,
  attesterAddress,
  encryptedPhone,
  ethers.utils.parseEther("100") // claim amount
);

// Get claim ID from event
const receipt = await tx.wait();
const event = receipt.events.find(e => e.event === 'ClaimCreated');
const claimId = event.args.id;
```

### Treasury Approving a Claim

```javascript
// Treasury approves claim
await claimsDB.connect(treasurySigner).setStatus(
  claimId,
  1 // Status.Approved
);
```

### Updating Claim Information

```javascript
// Claimer updates attestor while claim is pending
await claimsDB.updateAttestor(claimId, newAttesterAddress);

// Claimer updates encrypted phone
await claimsDB.updateEncryptedPhone(claimId, newEncryptedPhone);
```

### Treasury Withdrawing Fees

```javascript
// Withdraw specific amount
await claimsDB.connect(treasurySigner).withdrawTokens(
  ethers.utils.parseEther("100")
);

// Or withdraw all
await claimsDB.connect(treasurySigner).withdrawAllTokens();
```

---

## Security Considerations

- **Reentrancy Protection**: Core functions use `nonReentrant` modifier
- **Fee-on-Transfer Support**: Uses `_pullReceived()` to handle tokens with transfer fees
- **Authorization**: Treasury-only functions for sensitive operations
- **Input Validation**: Checks for zero addresses and claim existence
- **Status Protection**: Claimers can only modify pending claims
- **Event Logging**: All state changes emit events for off-chain tracking

## Workflow

1. **Claim Creation**: User approves and calls `createClaim()`, paying 10 MRS fee
2. **Pending Review**: Claim enters Pending status, awaiting treasury review
3. **Optional Updates**: Claimer can update phone/attestor while pending
4. **Treasury Decision**: Treasury calls `setStatus()` to approve/reject
5. **Execution**: If approved, off-chain systems trigger inheritance distribution
6. **Fee Collection**: Treasury periodically withdraws collected fees

## Additional Resources

- [Main Contracts README](../README.md)
- [Attesters System](../attesters/README.md)
- [Safe Configuration](../safes/README.md)
