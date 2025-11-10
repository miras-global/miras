# Token System Contracts

The token system provides the economic foundation for the Miras inheritance platform, including the native MRS token, a fixed-rate exchange, and a governance-enabled wrapper.

## Contracts Overview

1. **MRS (token.sol)** - Native ERC-20 token with owner-controlled minting
2. **ExchangeV1 (exchangeV1.sol)** - Fixed-rate exchange: 10 MRS = 1 ETH
3. **VotesWrapper (wrappedToken.sol)** - ERC20Votes governance wrapper

---

## MRS (token.sol)

Minimal ERC-20 token implementation with owner-controlled minting, optional burning, and EIP-2612 permit support for gasless approvals.

### Deployment Addresses

- **Mainnet**: `0x95324aE4b5D91C7444868228E10fAa7Fa9Fbe48a`
- **Testnet**: `0xb1d080F4F56A6ef848cDfacD7B125ac50B0D2ced`

### Key Features

- Standard ERC-20 functionality
- Owner-controlled minting with optional supply cap
- Optional token burning by holders
- EIP-2612 permit for gasless approvals
- Ownership transfer and renouncement

### Constructor

```solidity
constructor(
    string memory name_,
    string memory symbol_,
    uint8 decimals_,
    uint256 initialSupply_,
    address initialHolder_
)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `name_` | `string` | Token name (e.g., "MRS") |
| `symbol_` | `string` | Token symbol (e.g., "MRS") |
| `decimals_` | `uint8` | Decimal places (typically 18) |
| `initialSupply_` | `uint256` | Initial token supply to mint |
| `initialHolder_` | `address` | Recipient of initial supply |

**Events Emitted:**
- `Transfer(address(0), initialHolder_, initialSupply_)`
- `OwnershipTransferred(address(0), msg.sender)`

---

### Functions

#### Standard ERC-20 Functions

##### `transfer`

```solidity
function transfer(address to, uint256 value) external returns (bool)
```

Transfer tokens from caller to recipient.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `to` | `address` | Recipient address |
| `value` | `uint256` | Amount to transfer |

**Returns:** `bool` - Always true on success

**Requirements:**
- `to` must not be zero address
- Caller must have balance >= `value`

**Events:** `Transfer(msg.sender, to, value)`

##### `approve`

```solidity
function approve(address spender, uint256 value) external returns (bool)
```

Approve spender to transfer tokens on behalf of caller.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `spender` | `address` | Address authorized to spend |
| `value` | `uint256` | Allowance amount |

**Returns:** `bool` - Always true

**Events:** `Approval(msg.sender, spender, value)`

##### `transferFrom`

```solidity
function transferFrom(address from, address to, uint256 value) external returns (bool)
```

Transfer tokens from one address to another using allowance.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `from` | `address` | Source address |
| `to` | `address` | Destination address |
| `value` | `uint256` | Amount to transfer |

**Returns:** `bool` - Always true on success

**Requirements:**
- `to` must not be zero address
- `from` must have balance >= `value`
- Caller must have allowance >= `value`

**Events:** `Transfer(from, to, value)`

##### `increaseAllowance`

```solidity
function increaseAllowance(address spender, uint256 added) external returns (bool)
```

Increase the allowance granted to a spender.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `spender` | `address` | Address to increase allowance for |
| `added` | `uint256` | Amount to add to current allowance |

**Events:** `Approval(msg.sender, spender, newAllowance)`

##### `decreaseAllowance`

```solidity
function decreaseAllowance(address spender, uint256 subtracted) external returns (bool)
```

Decrease the allowance granted to a spender.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `spender` | `address` | Address to decrease allowance for |
| `subtracted` | `uint256` | Amount to subtract from current allowance |

**Requirements:**
- Current allowance must be >= `subtracted`

**Events:** `Approval(msg.sender, spender, newAllowance)`

---

#### Minting and Burning

##### `mint`

```solidity
function mint(address to, uint256 amount) external
```

Mint new tokens to an address.

**Access Control:** `onlyOwner`

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `to` | `address` | Recipient of minted tokens |
| `amount` | `uint256` | Amount to mint |

**Requirements:**
- Caller must be owner
- If cap is set, `totalSupply + amount` must not exceed cap

**Events:** `Transfer(address(0), to, amount)`

##### `burn`

```solidity
function burn(uint256 amount) external
```

Burn tokens from caller's balance.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `amount` | `uint256` | Amount to burn |

**Requirements:**
- Caller must have balance >= `amount`

**Events:** `Transfer(msg.sender, address(0), amount)`

---

#### Supply Cap Management

##### `setCap`

```solidity
function setCap(uint256 newCap) external
```

Set maximum token supply (one-time operation).

**Access Control:** `onlyOwner`

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `newCap` | `uint256` | Maximum supply cap |

**Requirements:**
- Caller must be owner
- Cap must not be already set (`_cap == 0`)
- `newCap` must be >= current total supply

**Events:** `CapUpdated(0, newCap)`

---

#### EIP-2612 Permit

##### `permit`

```solidity
function permit(
    address owner,
    address spender,
    uint256 value,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
) external
```

Approve spending via EIP-712 signature (gasless approval).

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `owner` | `address` | Token owner granting approval |
| `spender` | `address` | Address being approved |
| `value` | `uint256` | Allowance amount |
| `deadline` | `uint256` | Signature expiration timestamp |
| `v` | `uint8` | Signature component |
| `r` | `bytes32` | Signature component |
| `s` | `bytes32` | Signature component |

**Requirements:**
- `deadline` must be >= current block timestamp
- Signature must be valid for the given parameters
- Recovered signer must match `owner`

**Events:** `Approval(owner, spender, value)`

##### `DOMAIN_SEPARATOR`

```solidity
function DOMAIN_SEPARATOR() public view returns (bytes32)
```

Returns the EIP-712 domain separator for permit signatures.

**Returns:** `bytes32` - Domain separator hash

---

#### Ownership Management

##### `transferOwnership`

```solidity
function transferOwnership(address newOwner) external
```

Transfer contract ownership to a new address.

**Access Control:** `onlyOwner`

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `newOwner` | `address` | New owner address |

**Requirements:**
- Caller must be owner
- `newOwner` must not be zero address

**Events:** `OwnershipTransferred(owner, newOwner)`

##### `renounceOwnership`

```solidity
function renounceOwnership() external
```

Renounce ownership, leaving contract without an owner.

**Access Control:** `onlyOwner`

**Events:** `OwnershipTransferred(owner, address(0))`

---

#### View Functions

##### `name`, `symbol`, `decimals`

```solidity
function name() external view returns (string memory)
function symbol() external view returns (string memory)
function decimals() external view returns (uint8)
```

Standard ERC-20 metadata.

##### `totalSupply`

```solidity
function totalSupply() external view returns (uint256)
```

Total token supply in circulation.

##### `balanceOf`

```solidity
function balanceOf(address account) external view returns (uint256)
```

Token balance of an account.

##### `allowance`

```solidity
function allowance(address owner, address spender) external view returns (uint256)
```

Current allowance granted by owner to spender.

##### `cap`

```solidity
function cap() external view returns (uint256)
```

Maximum supply cap (0 if not set).

##### `nonces`

```solidity
function nonces(address owner) external view returns (uint256)
```

Current permit nonce for an address (used in EIP-2612).

---

### Events

```solidity
event Transfer(address indexed from, address indexed to, uint256 value);
event Approval(address indexed owner, address indexed spender, uint256 value);
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
event CapUpdated(uint256 oldCap, uint256 newCap);
```

---

## ExchangeV1 (exchangeV1.sol)

Fixed-rate exchange contract for MRS. Allows users to buy and sell MRS tokens at a rate of 10 MRS = 1 ETH.

### Deployment Addresses

- **Mainnet Implementation**: `0x7937A695Cc89a39ef6711bb7616f5ad41e094786`
- **Mainnet Proxy**: `0x17df63dA8E4e42e9636C00d9C18EC0F0A10dA4Da`
- **Testnet Implementation**: `0x4457e7ed86d8a360bce9d6098023fe7163930476`
- **Testnet Proxy**: `0x75378e8a880007136c6C6C179158cc4b348ea89f`

### Key Features

- Fixed exchange rate: 10 MRS = 1 ETH
- Buy MRS tokens with ETH
- Sell MRS tokens for ETH
- Owner-controlled withdrawals
- UUPS upgradeable

### Exchange Rate

```
10 MRS = 1 ETH
1 MRS = 0.1 ETH
1 ETH = 10 MRS
```

---

### Functions

#### Initialization

##### `initialize`

```solidity
function initialize(address owner_, address token_) external
```

Initialize the exchange proxy (called once after deployment).

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `owner_` | `address` | Contract owner address |
| `token_` | `address` | MRS token address |

**Requirements:**
- Can only be called once (via proxy)
- `owner_` and `token_` must not be zero addresses

**Events:** `OwnershipTransferred(address(0), owner_)`

---

#### Trading Functions

##### `receive`

```solidity
receive() external payable
```

Purchase MRS tokens by sending ETH directly to the contract.

**Payment:** Must send ETH with transaction

**Behavior:**
- Calculates `tokenAmount = msg.value * 10` (assuming 18 decimals)
- Transfers MRS tokens to sender
- Emits purchase event

**Requirements:**
- Contract must have sufficient MRS token balance
- `msg.value > 0`

**Events:** `Purchase(msg.sender, tokenAmount, msg.value)`

##### `sellExact`

```solidity
function sellExact(uint256 tokenAmount) external nonReentrant
```

Sell exact amount of MRS tokens for ETH.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `tokenAmount` | `uint256` | Amount of MRS tokens to sell |

**Behavior:**
- Calculates `ethAmount = tokenAmount / 10` (assuming 18 decimals)
- Transfers MRS tokens from caller to contract
- Transfers ETH to caller

**Requirements:**
- Caller must have approved contract to spend >= `tokenAmount` MRS
- Caller must have balance >= `tokenAmount` MRS
- Contract must have balance >= `ethAmount` ETH
- `tokenAmount > 0`

**Events:** `Sale(msg.sender, tokenAmount, ethAmount)`

---

#### Admin Functions

##### `transferOwnership`

```solidity
function transferOwnership(address newOwner) external
```

Transfer contract ownership.

**Access Control:** `onlyOwner`

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `newOwner` | `address` | New owner address |

**Requirements:**
- Caller must be owner
- `newOwner` must not be zero address

**Events:** `OwnershipTransferred(owner, newOwner)`

##### `withdrawETH`

```solidity
function withdrawETH(uint256 amount) external nonReentrant
```

Withdraw ETH from the exchange.

**Access Control:** `onlyOwner`

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `amount` | `uint256` | Amount of ETH to withdraw (in wei) |

**Requirements:**
- Caller must be owner
- Contract balance must be >= `amount`

**Events:** `WithdrawETH(owner, amount)`

##### `withdrawToken`

```solidity
function withdrawToken(uint256 amount) external nonReentrant
```

Withdraw MRS tokens from the exchange.

**Access Control:** `onlyOwner`

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `amount` | `uint256` | Amount of tokens to withdraw |

**Requirements:**
- Caller must be owner
- Token balance must be >= `amount`

**Events:** `WithdrawToken(owner, amount)`

---

#### Upgrade Functions

##### `_authorizeUpgrade`

```solidity
function _authorizeUpgrade(address newImplementation) internal override
```

Authorization check for UUPS upgrades.

**Access Control:** `onlyOwner`

**Requirements:**
- Caller must be owner

---

#### View Functions

##### `calculateETH`

```solidity
function calculateETH(uint256 tokenAmount) public pure returns (uint256)
```

Calculate ETH amount for a given token amount.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `tokenAmount` | `uint256` | Amount of MRS tokens |

**Returns:** `uint256` - Equivalent ETH amount (tokenAmount / 10)

---

### Events

```solidity
event Purchase(address indexed buyer, uint256 tokenAmount, uint256 ethAmount);
event Sale(address indexed seller, uint256 tokenAmount, uint256 ethAmount);
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
event WithdrawETH(address indexed to, uint256 amount);
event WithdrawToken(address indexed to, uint256 amount);
```

---

## VotesWrapper (wrappedToken.sol)

ERC-20 wrapper that adds ERC20Votes-compatible governance functionality to MRS. Users deposit MRS to receive wrapped voting-enabled tokens 1:1 and can withdraw back at any time.

### Key Features

- 1:1 wrapping of underlying MRS token
- ERC20Votes compatibility for governance
- Delegation of voting power
- Historical vote tracking via checkpoints
- Full ERC-20 functionality

---

### Constructor

```solidity
constructor(
    IERC20Minimal _underlying,
    string memory _name,
    string memory _symbol
)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `_underlying` | `IERC20Minimal` | Address of MRS token to wrap |
| `_name` | `string` | Wrapped token name (e.g., "Wrapped MRS") |
| `_symbol` | `string` | Wrapped token symbol (e.g., "wMRS") |

---

### Functions

#### Wrapping/Unwrapping

##### `deposit`

```solidity
function deposit(uint256 amount) external returns (bool)
```

Deposit MRS tokens to receive wrapped tokens (self).

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `amount` | `uint256` | Amount of MRS to wrap |

**Requirements:**
- Caller must have approved contract to spend >= `amount` MRS
- `amount > 0`

**Events:** 
- `Transfer(address(0), msg.sender, amount)`

**Returns:** `bool` - Always true on success

##### `depositFor`

```solidity
function depositFor(address to, uint256 amount) public returns (bool)
```

Deposit MRS tokens to mint wrapped tokens for another address.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `to` | `address` | Recipient of wrapped tokens |
| `amount` | `uint256` | Amount of MRS to wrap |

**Requirements:**
- Caller must have approved contract to spend >= `amount` MRS
- `to` must not be zero address
- `amount > 0`

**Events:** `Transfer(address(0), to, amount)`

**Returns:** `bool` - Always true on success

##### `withdraw`

```solidity
function withdraw(uint256 amount) external returns (bool)
```

Unwrap tokens to receive back underlying MRS.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `amount` | `uint256` | Amount to unwrap |

**Requirements:**
- Caller must have balance >= `amount`
- `amount > 0`

**Events:** `Transfer(msg.sender, address(0), amount)`

**Returns:** `bool` - Always true on success

---

#### Governance/Voting Functions

##### `delegate`

```solidity
function delegate(address delegatee) external
```

Delegate voting power to another address.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `delegatee` | `address` | Address to delegate votes to (use address(0) to self-delegate) |

**Events:** 
- `DelegateChanged(msg.sender, oldDelegate, delegatee)`
- `DelegateVotesChanged(oldDelegate, oldVotes, newVotes)` (if applicable)
- `DelegateVotesChanged(delegatee, oldVotes, newVotes)` (if applicable)

##### `getVotes`

```solidity
function getVotes(address account) public view returns (uint256)
```

Get current voting power for an account.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `account` | `address` | Address to query |

**Returns:** `uint256` - Current votes (from most recent checkpoint)

##### `getPastVotes`

```solidity
function getPastVotes(address account, uint256 blockNumber) public view returns (uint256)
```

Get historical voting power at a specific block.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `account` | `address` | Address to query |
| `blockNumber` | `uint256` | Historical block number |

**Requirements:**
- `blockNumber` must be < current block number

**Returns:** `uint256` - Votes at specified block

##### `getPastTotalSupply`

```solidity
function getPastTotalSupply(uint256 blockNumber) public view returns (uint256)
```

Get historical total voting supply at a specific block.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `blockNumber` | `uint256` | Historical block number |

**Requirements:**
- `blockNumber` must be < current block number

**Returns:** `uint256` - Total supply at specified block

---

#### Standard ERC-20 Functions

##### `transfer`, `approve`, `transferFrom`

Standard ERC-20 functions with voting power tracking. See MRS documentation for parameter details.

**Note:** All transfers automatically move voting power from sender's delegate to recipient's delegate.

##### `increaseAllowance`, `decreaseAllowance`

Allowance management helpers. See MRS documentation for details.

---

#### Ownership Functions

##### `transferOwnership`

```solidity
function transferOwnership(address newOwner) external
```

Transfer contract ownership.

**Access Control:** `onlyOwner`

##### `renounceOwnership`

```solidity
function renounceOwnership() external
```

Renounce contract ownership.

**Access Control:** `onlyOwner`

---

#### View Functions

##### `underlying`

```solidity
function underlying() public view returns (IERC20Minimal)
```

Returns the underlying MRS token address.

##### `delegates`

```solidity
function delegates(address account) public view returns (address)
```

Returns the current delegate for an account.

##### Standard ERC-20 Views

`name()`, `symbol()`, `decimals()`, `totalSupply()`, `balanceOf()`, `allowance()` - standard ERC-20 metadata and state.

---

### Events

```solidity
event Transfer(address indexed from, address indexed to, uint256 value);
event Approval(address indexed owner, address indexed spender, uint256 value);
event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);
event DelegateVotesChanged(address indexed delegate, uint256 previousBalance, uint256 newBalance);
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
```

---

## Usage Examples

### Buying MRS Tokens

```javascript
// Send ETH to exchange contract
const tx = await signer.sendTransaction({
  to: exchangeAddress,
  value: ethers.utils.parseEther("1.0") // Buy 10 MRS
});
```

### Selling MRS Tokens

```javascript
// First approve exchange
await mrsToken.approve(exchangeAddress, ethers.utils.parseEther("10"));

// Then sell
await exchange.sellExact(ethers.utils.parseEther("10")); // Sell 10 MRS for 1 ETH
```

### Wrapping for Governance

```javascript
// Approve wrapper
await mrsToken.approve(wrapperAddress, amount);

// Wrap tokens
await wrapper.deposit(amount);

// Delegate votes
await wrapper.delegate(delegateAddress);
```

### Gasless Approval with Permit

```javascript
// Create permit signature (off-chain)
const signature = await signer._signTypedData(domain, types, value);
const { v, r, s } = ethers.utils.splitSignature(signature);

// Execute permit (on-chain, can be done by anyone)
await mrsToken.permit(owner, spender, amount, deadline, v, r, s);
```

---

## Security Considerations

- **Reentrancy Protection**: Exchange functions use `nonReentrant` modifier
- **Approval Race Condition**: Use `increaseAllowance`/`decreaseAllowance` instead of direct `approve`
- **Permit Replay**: Each permit signature has a unique nonce
- **Supply Cap**: Once set, prevents uncontrolled inflation
- **Ownership**: Can be renounced to make contracts immutable
- **Vote Manipulation**: Delegation changes and transfers tracked via checkpoints

## Additional Resources

- [EIP-20: Token Standard](https://eips.ethereum.org/EIPS/eip-20)
- [EIP-2612: Permit Extension](https://eips.ethereum.org/EIPS/eip-2612)
- [EIP-712: Typed Structured Data](https://eips.ethereum.org/EIPS/eip-712)
- [ERC20Votes: OpenZeppelin](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20Votes)
