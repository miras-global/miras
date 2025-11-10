# Miras Smart Contracts Documentation

This document provides detailed documentation of the core smart contracts in the Miras inheritance system, including source code excerpts and explanations.

## Table of Contents

1. [Overview](#overview)
2. [AttestersV4 Contract](#attestersv4-contract)
3. [ClaimsDBV3.1 Contract](#claimsdbv31-contract)
4. [SafeTableV6 Contract](#safetablev6-contract)
5. [UUPS Upgradeability Pattern](#uups-upgradeability-pattern)
6. [Security Considerations](#security-considerations)

---

## Overview

The Miras protocol consists of three core upgradeable smart contracts that work together to enable trustless cryptocurrency inheritance:

- **AttestersV4**: Registry of third-party verifiers who stake tokens and verify inheritance claims
- **ClaimsDBV3.1**: Database of inheritance claims with encrypted data and status management
- **SafeTableV6**: Registry of Gnosis Safe configurations with inheritance parameters

All contracts use the UUPS (Universal Upgradeable Proxy Standard) pattern for upgradeability and follow OpenZeppelin security best practices.

### Contract Addresses

**Mainnet:**
- AttestersV4 Proxy: `0x458F...91c9`
- ClaimsDBV3.1 Proxy: `0xCE7E...571De`
- SafeTableV6 Proxy: `0xE29B...F384`
- MRS Token: `0x9532...e48a`

**Sepolia Testnet:**
- AttestersV4 Proxy: `0xdB4E...E665`
- ClaimsDBV3.1 Proxy: `0x81bE...7418`
- SafeTableV6 Proxy: `0xE06c...c886`

---

## AttestersV4 Contract

**File**: `contracts/attesters/v4.sol`

**Purpose**: Manages the registry of attesters who verify inheritance claims. Attesters must stake 100 MRS tokens to register and can be slashed for misbehavior.

### Data Structures

```solidity
struct Attester {
    address wallet;           // Attester's wallet address
    string publicKey;         // ECIES public key for encryption
    string name;              // Display name
    string meta;              // Additional metadata (bio, contact)
    uint64 updatedAt;         // Last update timestamp
    bool exists;              // Currently active
    bool isSlashed;           // Penalized for misbehavior
    uint256 totalFeesPaid;    // Cumulative fees paid
    uint256 lastFeePaid;      // Most recent fee amount
    uint64 lastPaidAt;        // Timestamp of last payment
    uint256 totalOverpaid;    // Cumulative overpayments
    uint256 lastOverpaid;     // Most recent overpayment
}
```

**Key Fields:**
- `publicKey`: Uncompressed ECIES public key (65 bytes hex) used to encrypt claim data
- `exists`: Boolean indicating if attester is active and can receive claims
- `isSlashed`: Permanent penalty flag preventing withdrawal and selection
- `totalFeesPaid`: Tracks all registration fees paid (including updates)

### Core Functions

#### Registration: `upsertAttester()`

```solidity
function upsertAttester(
    string calldata publicKey,
    string calldata name,
    string calldata meta,
    uint256 amount
) external nonReentrant whenInitialized {
    uint256 fee = _registerFee;
    require(amount >= fee, "fee too low");
    require(bytes(name).length <= NAME_MAX_LEN, "name too long");
    require(bytes(meta).length <= META_MAX_LEN, "meta too long");
    require(feeTokenContract.transferFrom(msg.sender, address(this), amount), "transferFrom failed");
    
    uint256 overpaid = amount - fee;
    Attester storage a = attesters[msg.sender];
    bool firstTime = !a.exists && _resignRequestedAt[msg.sender] == 0 && a.wallet == address(0);
    
    a.wallet = msg.sender;
    a.publicKey = publicKey;
    a.name = name;
    a.meta = meta;
    a.updatedAt = uint64(block.timestamp);
    a.exists = true;
    
    if (firstTime) { _wallets.push(msg.sender); }
    
    a.totalFeesPaid += fee;
    a.lastFeePaid = fee;
    a.lastPaidAt = uint64(block.timestamp);
    a.totalOverpaid += overpaid;
    a.lastOverpaid = overpaid;
    
    _feePool += fee;
    _overpayAndDonationPool += overpaid;
    
    uint256 oldDep = _refundableDeposit[msg.sender];
    if (oldDep != fee) {
        if (oldDep > 0) { _depositLiability -= oldDep; }
        _refundableDeposit[msg.sender] = fee;
        _depositLiability += fee;
    }
    
    if (_resignRequestedAt[msg.sender] != 0) {
        _resignRequestedAt[msg.sender] = 0;
    }
    
    emit FeeCollected(msg.sender, fee, overpaid);
    emit AttesterUpserted(msg.sender, publicKey, name, meta, a.updatedAt);
}
```

**Functionality:**
1. Validates fee amount (must be ≥ 100 MRS)
2. Validates name and metadata length constraints
3. Transfers MRS tokens from attester to contract
4. Separates fee from overpayment
5. Updates or creates attester profile
6. Tracks deposit liability for refundable stakes
7. Cancels any pending resignation
8. Emits events for indexing

**Key Features:**
- **Reentrancy Protection**: `nonReentrant` modifier prevents reentrancy attacks
- **Overpayment Handling**: Excess tokens tracked separately in `_overpayAndDonationPool`
- **Deposit Liability**: Tracks refundable stakes to prevent treasury from withdrawing staked funds
- **Idempotent**: Can be called multiple times to update profile

#### Attester Selection: `pickAttesters()`

```solidity
function pickAttesters(uint256 num) public view whenInitialized returns (address[] memory picked) {
    uint256 total = _wallets.length;
    uint256 lActiveCount = 0;
    for (uint256 i = 0; i < total; i++) {
        if (attesters[_wallets[i]].exists) lActiveCount++;
    }
    if (lActiveCount == 0) return new address[](0);
    if (num > lActiveCount) num = lActiveCount;

    address[] memory active = new address[](lActiveCount);
    uint256 idx = 0;
    for (uint256 i = 0; i < total; i++) {
        address w = _wallets[i];
        if (attesters[w].exists) active[idx++] = w;
    }

    picked = new address[](num);
    uint256[] memory indices = new uint256[](lActiveCount);
    for (uint256 i = 0; i < lActiveCount; i++) indices[i] = i;
    
    uint256 rand = uint256(keccak256(abi.encodePacked(blockhash(block.number - 1), msg.sender, lActiveCount)));
    for (uint256 i = 0; i < num; i++) {
        rand = uint256(keccak256(abi.encodePacked(rand, i)));
        uint256 j = i + (rand % (lActiveCount - i));
        (indices[i], indices[j]) = (indices[j], indices[i]);
        picked[i] = active[indices[i]];
    }
}
```

**Functionality:**
1. Counts active attesters (exists = true, not slashed)
2. Creates array of active attester addresses
3. Pseudo-randomly shuffles indices using blockhash
4. Returns requested number of attesters

**Randomness Source:**
- Uses `blockhash(block.number - 1)` for pseudo-randomness
- Includes `msg.sender` to prevent manipulation
- Fisher-Yates shuffle algorithm for fair selection

**Security Note**: This is pseudo-random, not cryptographically secure. For production, consider using Chainlink VRF for true randomness.

#### Resignation: `requestResign()` and `withdrawDeposit()`

```solidity
function requestResign() external whenInitialized {
    Attester storage a = attesters[msg.sender];
    require(a.exists, "not active");
    require(!_isSlashed(msg.sender), "slashed");
    
    a.exists = false;
    a.updatedAt = uint64(block.timestamp);
    _resignRequestedAt[msg.sender] = uint64(block.timestamp);
    _resignRequestedAtBlock[msg.sender] = uint64(block.number);
    
    emit AttesterDeleted(msg.sender, a.exists);
}

function withdrawDeposit() external nonReentrant whenInitialized {
    uint256 amount = _refundableDeposit[msg.sender];
    require(amount > 0, "no deposit");
    require(!_isSlashed(msg.sender), "slashed");
    
    uint64 reqAt = _resignRequestedAt[msg.sender];
    require(reqAt > 0, "no resign req");
    
    if (_resignWaitBlocks > 0) {
        uint64 reqBlock = _resignRequestedAtBlock[msg.sender];
        require(reqBlock > 0, "no resign block");
        require(block.number >= uint256(reqBlock) + uint256(_resignWaitBlocks), "wait blocks");
    } else {
        require(block.timestamp >= uint256(reqAt) + uint256(_resignWaitSeconds), "wait time");
    }
    
    _refundableDeposit[msg.sender] = 0;
    _resignRequestedAt[msg.sender] = 0;
    _resignRequestedAtBlock[msg.sender] = 0;
    _depositLiability -= amount;
    
    require(feeTokenContract.transfer(msg.sender, amount), "transfer failed");
}
```

**Resignation Flow:**
1. **Request**: Attester calls `requestResign()`, becomes inactive immediately
2. **Waiting Period**: Default 30 days (`_resignWaitSeconds`) must elapse
3. **Withdrawal**: After waiting period, attester calls `withdrawDeposit()` to receive staked tokens

**Key Features:**
- **Immediate Deactivation**: Attester cannot receive new claims after resignation request
- **Waiting Period**: Prevents rapid exit during active claims
- **Slashing Protection**: Slashed attesters cannot withdraw
- **Deposit Liability**: Properly tracked to prevent treasury withdrawal conflicts

#### Slashing: `slash()`

```solidity
function slash(address wallet, bool slashed) external onlyAdmin {
    Attester storage a = attesters[wallet];
    require(a.exists || _resignRequestedAt[wallet] != 0 || a.wallet == wallet, "not found");
    
    a.isSlashed = slashed;
    a.updatedAt = uint64(block.timestamp);
    
    emit AttesterSlashed(wallet, slashed);
}
```

**Functionality:**
- Admin-only function to penalize misbehaving attesters
- Sets `isSlashed = true` to permanently prevent withdrawal
- Can also unslash by setting `slashed = false`

**Use Cases:**
- Attester provides false verification
- Attester colludes with claimer
- Attester fails to respond to claims
- Attester violates protocol rules

### Access Control

```solidity
modifier onlyAdmin() {
    require(_initialized, "not initialized");
    require(msg.sender == _withdrawer, "not admin");
    _;
}
```

**Admin Powers:**
- Set registration fee
- Slash/unslash attesters
- Withdraw collected fees
- Upgrade contract implementation
- Transfer admin role

**Admin Address**: `_withdrawer` (also called admin/treasury in context)

### Fee Management

```solidity
function withdraw(uint256 amount) external onlyAdmin nonReentrant {
    uint256 bal = feeTokenContract.balanceOf(address(this));
    require(bal >= amount, "insufficient balance");
    
    uint256 available = bal > _depositLiability ? (bal - _depositLiability) : 0;
    require(available >= amount, "exceeds available");
    
    uint256 fromOverpay = amount <= _overpayAndDonationPool ? amount : _overpayAndDonationPool;
    uint256 fromFee = amount - fromOverpay;
    
    if (fromOverpay > 0) _overpayAndDonationPool -= fromOverpay;
    if (fromFee > 0) {
        require(_feePool >= fromFee, "fee pool short");
        _feePool -= fromFee;
    }
    
    require(feeTokenContract.transfer(_withdrawer, amount), "transfer failed");
    emit Withdrawn(_withdrawer, amount, fromFee, fromOverpay);
}
```

**Key Concepts:**
- **Fee Pool**: Non-refundable registration fees
- **Overpay Pool**: Excess payments beyond required fee
- **Deposit Liability**: Refundable stakes that must remain in contract
- **Available Balance**: `balance - depositLiability`

**Safety**: Admin can only withdraw available balance, protecting staked deposits.

---

## ClaimsDBV3.1 Contract

**File**: `contracts/claims/v3.1.sol`

**Purpose**: Manages inheritance claims with encrypted data. Heirs pay 10 MRS to create claims, which are verified by attesters and approved/rejected by treasury.

### Data Structures

```solidity
enum Status { Pending, Approved, Rejected, Cancelled }

struct Claim {
    address claimer;         // Who created the claim (heir)
    string encryptedSafe;    // Encrypted safe address
    address attestor;        // Designated attestor
    string encryptedPhone;   // Encrypted phone number
    uint64 createdAt;        // Timestamp at creation
    Status status;           // Current status
}
```

**Key Fields:**
- `encryptedSafe`: Safe address encrypted with attester's public key
- `encryptedPhone`: Contact phone encrypted with attester's public key
- `attestor`: Single attester assigned to verify this claim
- `status`: Enum representing claim lifecycle state

### Core Functions

#### Claim Creation: `createClaim()`

```solidity
function createClaim(
    string calldata encryptedSafe,
    address attestor,
    string calldata encryptedPhone,
    uint256 amount
) external whenInitialized nonReentrant returns (uint256 id) {
    require(amount > 0, "amount=0");
    require(attestor != address(0), "attestor=0");

    // Pull tokens; verify actual amount received against registerFee (handles fee-on-transfer)
    uint256 received = _pullReceived(feeToken, msg.sender, amount);
    require(received >= registerFee, "fee too low");

    unchecked { id = ++nextId; }
    Claim storage c = claims[id];
    c.claimer = msg.sender;
    c.encryptedSafe = encryptedSafe;    
    c.attestor = attestor;
    c.encryptedPhone = encryptedPhone;
    c.createdAt = uint64(block.timestamp);
    c.status = Status.Pending;

    ids.push(id);

    emit ClaimCreated(id, msg.sender, encryptedSafe, attestor, encryptedPhone, c.createdAt);
    emit FeeReceived(msg.sender, received);
}
```

**Functionality:**
1. Validates input parameters
2. Pulls MRS tokens from claimer (handles fee-on-transfer tokens)
3. Creates new claim with auto-incremented ID
4. Stores encrypted data on-chain
5. Sets initial status to Pending
6. Emits events for backend indexing

**Fee Handling:**
- Uses `_pullReceived()` to handle fee-on-transfer tokens
- Measures actual received amount vs. requested amount
- Requires received amount ≥ `registerFee` (10 MRS)

**Encryption:**
- `encryptedSafe`: Safe address encrypted with attester's public key
- `encryptedPhone`: Phone number encrypted with attester's public key
- Only the designated attester can decrypt this data

#### Status Management: `setStatus()`

```solidity
function setStatus(uint256 id, Status newStatus) external onlyTreasury {
    Claim storage c = _mustGet(id);
    Status old = c.status;
    if (old != newStatus) {
        c.status = newStatus;
        emit StatusChanged(id, old, newStatus);
    }
}
```

**Functionality:**
- Treasury-only function to update claim status
- Validates claim exists
- Emits event if status changes

**Status Transitions:**
- Pending → Approved: Verification successful
- Pending → Rejected: Verification failed
- Pending → Cancelled: Owner objected or fraud detected

#### Claimer Updates: `updateEncryptedPhone()` and `updateAttestor()`

```solidity
function updateEncryptedPhone(uint256 id, string calldata newEncryptedPhone) external whenInitialized {
    Claim storage c = _mustGet(id);
    require(msg.sender == c.claimer, "not claimer");
    require(c.status == Status.Pending, "locked");
    
    string memory old = c.encryptedPhone;
    c.encryptedPhone = newEncryptedPhone;
    emit PhoneUpdated(id, old, newEncryptedPhone);
}

function updateAttestor(uint256 id, address newAttestor) external whenInitialized {
    require(newAttestor != address(0), "attestor=0");
    Claim storage c = _mustGet(id);
    require(msg.sender == c.claimer, "not claimer");
    require(c.status == Status.Pending, "locked");
    
    address old = c.attestor;
    c.attestor = newAttestor;
    emit AttestorUpdated(id, old, newAttestor);
}
```

**Functionality:**
- Claimer can update phone or attestor while claim is Pending
- Once status changes to Approved/Rejected/Cancelled, claim is locked
- Useful if attester becomes unresponsive or contact info changes

**Security:**
- Only claimer can update their own claim
- Only Pending claims can be modified
- Emits events for audit trail

#### Attester Query: `getClaimsByAttester()`

```solidity
function getClaimsByAttester(address _attestor)
    external
    view
    whenInitialized
    returns (
        uint256[] memory outIds,
        address[] memory claimers,
        string[] memory encryptedSafes,
        address[] memory attestors,
        string[] memory encryptedPhones,
        uint64[] memory createdAts,
        Status[] memory statuses
    )
{
    // First pass: count matches
    uint256 count = 0;
    for (uint256 i = 0; i < ids.length; i++) {
        if (claims[ids[i]].attestor == _attestor) {
            unchecked { count++; }
        }
    }

    // Allocate outputs
    outIds = new uint256[](count);
    claimers = new address[](count);
    encryptedSafes = new string[](count);
    attestors = new address[](count);
    encryptedPhones = new string[](count);
    createdAts = new uint64[](count);
    statuses = new Status[](count);

    if (count == 0) {
        return (outIds, claimers, encryptedSafes, attestors, encryptedPhones, createdAts, statuses);
    }

    // Second pass: fill arrays (newest first)
    uint256 idx = 0;
    for (uint256 i = ids.length; i > 0; i--) {
        uint256 id = ids[i - 1];
        Claim storage c = claims[id];
        if (c.attestor == _attestor) {
            outIds[idx] = id;
            claimers[idx] = c.claimer;
            encryptedSafes[idx] = c.encryptedSafe;
            attestors[idx] = c.attestor;
            encryptedPhones[idx] = c.encryptedPhone;
            createdAts[idx] = c.createdAt;
            statuses[idx] = c.status;
            unchecked { idx++; }
            if (idx == count) break;
        }
    }

    return (outIds, claimers, encryptedSafes, attestors, encryptedPhones, createdAts, statuses);
}
```

**Functionality:**
1. Two-pass algorithm: count matches, then fill arrays
2. Returns claims in reverse chronological order (newest first)
3. Includes all claim data for attester to decrypt and verify

**Use Case:**
- Attester visits Track page
- Calls this function with their address
- Receives all assigned claims with encrypted data
- Decrypts data with their private key
- Verifies claims off-chain

### Fee-on-Transfer Token Handling

```solidity
function _pullReceived(IERC20 token, address from, uint256 requested) internal returns (uint256 received) {
    uint256 beforeBal = token.balanceOf(address(this));
    require(_safeTransferFrom(token, from, address(this), requested), "transferFrom failed");
    unchecked {
        received = token.balanceOf(address(this)) - beforeBal;
    }
    require(received > 0, "nothing received");
}
```

**Purpose**: Handles tokens that charge fees on transfer (e.g., some deflationary tokens)

**Mechanism:**
1. Record balance before transfer
2. Execute transfer
3. Measure actual received amount
4. Return received amount for validation

**Safety**: Ensures contract receives at least the required fee, even if token charges transfer fees.

### Access Control

```solidity
modifier onlyTreasury() {
    require(_initialized, "not initialized");
    require(msg.sender == treasury, "not treasury");
    _;
}
```

**Treasury Powers:**
- Set claim status (Approved/Rejected/Cancelled)
- Update treasury address
- Update register fee
- Withdraw collected tokens
- Upgrade contract implementation

---

## SafeTableV6 Contract

**File**: `contracts/safes/v6.sol`

**Purpose**: Registry of Gnosis Safe configurations with inheritance parameters. Owners pay 0.1 ETH to register or update their Safe configuration.

### Data Structures

```solidity
struct Row {
    address owner;                          // Who registered the Safe
    address safe_address;                   // Gnosis Safe contract address
    uint8 waiting_period;                   // Months before claim can be approved
    bool death_certificate;                 // Whether death certificate is required
    address[] attesters;                    // Array of 3 attester addresses
    string[] encryptedPhones;               // Encrypted contact info for each attester
    uint256 feePaid;                        // Total ETH paid for this Safe
    uint64 createdAt;                       // Registration timestamp
    string[] encryptedProtocolPhrases;      // Encrypted protocol seeds for each attester
}
```

**Key Fields:**
- `safe_address`: Primary key for lookups (one Safe per address)
- `waiting_period`: Time in months before claim can be approved (e.g., 3 months)
- `attesters`: Array of 3 attester addresses selected during Safe creation
- `encryptedPhones`: Heir's contact info encrypted for each attester
- `encryptedProtocolPhrases`: Protocol seed (Key C) encrypted for each attester

### Core Functions

#### Safe Registration: `insert()`

```solidity
function insert(
    address safe_address,
    uint8 waiting_period,
    bool death_certificate,
    address[] calldata attesters,
    string[] calldata encryptedPhones,
    string[] calldata encryptedProtocolPhrases
) external payable whenInitialized {
    Row storage r = rows[safe_address];
    require(r.createdAt == 0, "exists");
    require(msg.value >= fee, "fee not met");
    require(attesters.length == encryptedPhones.length, "length mismatch");

    r.owner = msg.sender;
    r.safe_address = safe_address;
    r.waiting_period = waiting_period;
    r.death_certificate = death_certificate;
    r.createdAt = uint64(block.timestamp);
    r.feePaid += msg.value;

    for (uint256 i = 0; i < attesters.length; i++) {
        r.attesters.push(attesters[i]);
        r.encryptedPhones.push(encryptedPhones[i]);
        r.encryptedProtocolPhrases.push(encryptedProtocolPhrases[i]);
    }

    ownerSafes[msg.sender].push(safe_address);
    totalSafes += 1;

    emit FeeCollected(msg.sender, msg.value);
    emit RowInserted(msg.sender, safe_address, waiting_period, death_certificate, attesters, encryptedPhones, encryptedProtocolPhrases, r.createdAt);
}
```

**Functionality:**
1. Validates Safe doesn't already exist
2. Validates fee payment (≥ 0.1 ETH)
3. Validates array lengths match
4. Creates new row with configuration
5. Stores encrypted data for each attester
6. Tracks Safe in owner's list
7. Increments total Safe count

**Fee Handling:**
- Requires minimum 0.1 ETH
- Excess ETH kept in contract (no refund)
- All fees withdrawable by treasury

**Encrypted Data:**
- `encryptedPhones[i]`: Heir's phone encrypted with `attesters[i]` public key
- `encryptedProtocolPhrases[i]`: Protocol seed encrypted with `attesters[i]` public key

#### Safe Update: `update()`

```solidity
function update(
    address safe_address,
    uint8 waiting_period,
    bool death_certificate,
    address[] calldata attesters,
    string[] calldata encryptedPhones,
    string[] calldata encryptedProtocolPhrases
) external payable whenInitialized {
    Row storage r = rows[safe_address];
    require(r.createdAt != 0, "missing");
    require(r.owner == msg.sender, "not owner");
    require(msg.value >= fee, "fee not met");
    require(attesters.length == encryptedPhones.length, "length mismatch");

    r.waiting_period = waiting_period;
    r.death_certificate = death_certificate;
    r.feePaid += msg.value;

    delete r.attesters;
    delete r.encryptedPhones;
    delete r.encryptedProtocolPhrases;
    for (uint256 i = 0; i < attesters.length; i++) {
        r.attesters.push(attesters[i]);
        r.encryptedPhones.push(encryptedPhones[i]);
        r.encryptedProtocolPhrases.push(encryptedProtocolPhrases[i]);
    }

    emit FeeCollected(msg.sender, msg.value);
    emit RowUpdated(msg.sender, safe_address, waiting_period, death_certificate, attesters, encryptedPhones, encryptedProtocolPhrases);
}
```

**Functionality:**
1. Validates Safe exists
2. Validates caller is owner
3. Validates fee payment
4. Deletes old arrays
5. Stores new configuration
6. Increments total fees paid

**Use Cases:**
- Change waiting period
- Update attesters (if one becomes unresponsive)
- Toggle death certificate requirement
- Update encrypted contact info

#### Safe Lookup: `get()`

```solidity
function get(address safe_address) external view whenInitialized returns (
    address owner,
    address _safe_address,
    uint8 waiting_period,
    bool death_certificate,
    address[] memory attesters,
    string[] memory encryptedPhones,
    string[] memory encryptedProtocolPhrases,
    uint64 createdAt
) {
    Row storage r = rows[safe_address];
    return (r.owner, r.safe_address, r.waiting_period, r.death_certificate, r.attesters, r.encryptedPhones, r.encryptedProtocolPhrases, r.createdAt);
}
```

**Functionality:**
- Direct lookup by Safe address
- Returns all configuration data
- No ownership check (public data)

**Use Case:**
- Heir looks up Safe configuration before creating claim
- Frontend displays Safe details
- Backend indexes Safe data

#### Owner Enumeration: `listSafes()`

```solidity
function listSafes(address owner) external view whenInitialized returns (address[] memory) {
    return ownerSafes[owner];
}
```

**Functionality:**
- Returns all Safe addresses registered by an owner
- Useful for users with multiple Safes

### Access Control

```solidity
modifier onlyTreasury() {
    require(_initialized && !_initializing, "not initialized");
    require(msg.sender == treasury, "not treasury");
    _;
}
```

**Treasury Powers:**
- Set treasury address
- Set fee amount
- Withdraw collected ETH
- Upgrade contract implementation

**Owner Powers:**
- Insert new Safe configuration
- Update own Safe configuration

### Fee Management

```solidity
function withdraw(uint256 amount) external onlyTreasury nonReentrant {
    (bool ok, ) = payable(treasury).call{value: amount}("");
    require(ok, "withdraw failed");
    emit Withdrawn(treasury, amount);
}

function withdrawAll() external onlyTreasury nonReentrant {
    uint256 bal = address(this).balance;
    (bool ok, ) = payable(treasury).call{value: bal}("");
    require(ok, "withdraw failed");
    emit Withdrawn(treasury, bal);
}
```

**Functionality:**
- Treasury can withdraw any amount up to contract balance
- Uses low-level `call` for ETH transfer
- Reentrancy protected

**Revenue Model:**
- 0.1 ETH per Safe registration
- 0.1 ETH per Safe update
- All fees go to treasury for protocol operations

---

## UUPS Upgradeability Pattern

All three core contracts use the UUPS (Universal Upgradeable Proxy Standard) pattern for upgradeability.

### Base Contract: `_upgradeable.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

abstract contract UUPSUpgradeable {
    bytes32 private constant IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
    
    event Upgraded(address indexed implementation);
    
    function upgradeTo(address newImplementation) external {
        _authorizeUpgrade(newImplementation);
        _upgradeToAndCall(newImplementation, bytes(""), false);
    }
    
    function upgradeToAndCall(address newImplementation, bytes memory data) external payable {
        _authorizeUpgrade(newImplementation);
        _upgradeToAndCall(newImplementation, data, true);
    }
    
    function _authorizeUpgrade(address newImplementation) internal virtual;
    
    function _upgradeToAndCall(address newImplementation, bytes memory data, bool forceCall) internal {
        // ... implementation details ...
        emit Upgraded(newImplementation);
    }
}
```

### Authorization in Each Contract

**AttestersV4:**
```solidity
function _authorizeUpgrade(address) internal override onlyAdmin {}
```

**ClaimsDBV3.1:**
```solidity
function _authorizeUpgrade(address) internal override onlyTreasury {}
```

**SafeTableV6:**
```solidity
function _authorizeUpgrade(address) internal override onlyTreasury {}
```

### Upgrade Process

1. **Deploy New Implementation**: Deploy new contract version
2. **Authorize Upgrade**: Only admin/treasury can authorize
3. **Update Proxy**: Proxy's implementation slot points to new contract
4. **Preserve State**: All storage remains in proxy contract
5. **Emit Event**: `Upgraded` event emitted for tracking

### Proxy Contract Example

```solidity
// contracts/attesters/proxy.sol
contract AttestersProxy {
    constructor(address _logic, bytes memory _data) {
        // Set implementation slot
        // Call initialize on implementation
    }
    
    fallback() external payable {
        // Delegate all calls to implementation
        address impl = _implementation();
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), impl, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }
}
```

**Key Concepts:**
- **Proxy**: Fixed address, holds state, delegates calls
- **Implementation**: Contains logic, can be upgraded
- **Storage Layout**: Must be preserved across upgrades
- **Initialization**: Use `initialize()` instead of `constructor()`

---

## Security Considerations

### Reentrancy Protection

All state-changing functions use `nonReentrant` modifier:

```solidity
uint256 private _locked; // or _entered

modifier nonReentrant() {
    require(_locked == 0, "reentrancy");
    _locked = 1;
    _;
    _locked = 0;
}
```

**Protected Functions:**
- `upsertAttester()`
- `withdrawDeposit()`
- `withdraw()` (all contracts)
- `createClaim()`

### Access Control

**Role-Based Access:**
- **Admin/Treasury**: Upgrade contracts, set fees, withdraw funds, manage status
- **Attester**: Register, resign, update profile
- **Claimer**: Create claims, update pending claims
- **Owner**: Register Safe, update Safe configuration

**Modifiers:**
- `onlyAdmin()`: Restricts to admin address
- `onlyTreasury()`: Restricts to treasury address
- `whenInitialized()`: Prevents calls before initialization

### Integer Overflow Protection

Solidity 0.8.x has built-in overflow protection, but contracts use `unchecked` blocks where safe:

```solidity
unchecked { id = ++nextId; }  // Safe: ID only increments
unchecked { count++; }         // Safe: Bounded by array length
```

### Fee-on-Transfer Token Support

ClaimsDBV3.1 handles fee-on-transfer tokens:

```solidity
function _pullReceived(IERC20 token, address from, uint256 requested) internal returns (uint256 received) {
    uint256 beforeBal = token.balanceOf(address(this));
    require(_safeTransferFrom(token, from, address(this), requested), "transferFrom failed");
    unchecked {
        received = token.balanceOf(address(this)) - beforeBal;
    }
    require(received > 0, "nothing received");
}
```

### Deposit Liability Protection

AttestersV4 tracks refundable deposits separately:

```solidity
uint256 available = bal > _depositLiability ? (bal - _depositLiability) : 0;
require(available >= amount, "exceeds available");
```

**Ensures**: Treasury cannot withdraw staked tokens that attesters can reclaim.

### Slashing Protection

Slashed attesters cannot:
- Withdraw their stake
- Be selected by `pickAttesters()`
- Request resignation (already slashed)

```solidity
require(!_isSlashed(msg.sender), "slashed");
```

### Initialization Protection

All contracts use initialization instead of constructors:

```solidity
constructor() {
    _initialized = true; // Lock implementation
}

function initialize(...) external {
    require(!_initialized, "already initialized");
    // ... initialization logic ...
    _initialized = true;
}
```

**Prevents**: Implementation contract from being initialized, only proxy can initialize.

### Event Emission

All state changes emit events for:
- **Transparency**: Users can track all actions
- **Indexing**: Backend can build queryable cache
- **Auditing**: Complete audit trail of all operations

**Key Events:**
- `AttesterUpserted`, `AttesterDeleted`, `AttesterSlashed`
- `ClaimCreated`, `StatusChanged`, `PhoneUpdated`
- `RowInserted`, `RowUpdated`, `FeeCollected`

---

## Summary

The Miras smart contracts provide a secure, upgradeable foundation for trustless cryptocurrency inheritance:

- **AttestersV4**: Manages verifier registry with staking and slashing
- **ClaimsDBV3.1**: Handles claim lifecycle with encrypted data
- **SafeTableV6**: Stores Safe configurations with inheritance parameters

**Key Security Features:**
- UUPS upgradeability for future improvements
- Reentrancy protection on all critical functions
- Role-based access control
- Deposit liability tracking
- Fee-on-transfer token support
- Comprehensive event emission

**Architecture Principles:**
- Separation of concerns (three specialized contracts)
- Minimal on-chain storage (encrypted blobs)
- Upgradeable without state migration
- Admin controls with clear authorization

These contracts form the immutable core of the Miras protocol, enabling secure inheritance without custodians or intermediaries.
