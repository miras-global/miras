# Smart Contracts Documentation

This directory contains all smart contracts for the Miras trustless inheritance system. The contracts implement a comprehensive solution for blockchain-based inheritance management with attestation, claims processing, and token economics.

## Architecture Overview

The Miras system uses the **UUPS (Universal Upgradeable Proxy Standard)** pattern for all core contracts, enabling future enhancements while preserving deployed addresses and state. Each contract is deployed behind an ERC1967 proxy.

### Contract Hierarchy

```
contracts/
├── proxy.sol              # Base ERC1967Proxy implementation
├── _upgradeable.sol       # Base contract with UUPS support
├── token/                 # Token economics system
│   ├── token.sol         # MRS ERC-20 token
│   ├── exchangeV1.sol    # Fixed-rate ETH ↔ MRS exchange
│   ├── wrappedToken.sol  # Governance wrapper with voting
│   └── exchangeProxy.sol # Proxy for ExchangeV1
├── claims/                # Claims management system
│   ├── v2.1.sol          # ClaimsDBV2 with ERC-20 fees
│   └── proxy.sol         # Proxy for ClaimsDBV2
├── attesters/             # Attester registry system
│   ├── v2.sol            # AttestersV2 with ERC-20 fees
│   └── proxy.sol         # Proxy for AttestersV2
└── safes/                 # Safe configuration registry
    ├── v1.sol            # SafeTable with ETH fees
    └── proxy.sol         # Proxy for SafeTable
```

## Core Contracts

### Token System
- **[MRS (token.sol)](./token/README.md)** - ERC-20 token with minting, burning, and EIP-2612 permit
- **[ExchangeV1 (exchangeV1.sol)](./token/README.md)** - Fixed 10:1 (MRS:ETH) exchange
- **[VotesWrapper (wrappedToken.sol)](./token/README.md)** - ERC20Votes governance wrapper

### Claims System
- **[ClaimsDBV2 (v2.1.sol)](./claims/README.md)** - Inheritance claims with 10 MRS token fee

### Attesters System
- **[AttestersV2 (v2.sol)](./attesters/README.md)** - Verifier registry with 100 MRS token fee

### Safes System
- **[SafeTable (v1.sol)](./safes/README.md)** - Safe configuration registry with 1 ETH fee

## UUPS Upgradeable Pattern

All core contracts inherit from `UUPSUpgradeable` which provides:

1. **Proxy Delegation**: All state stored in proxy, logic in implementation
2. **Upgrade Authorization**: Only authorized addresses can upgrade
3. **State Preservation**: Upgrades maintain all existing data
4. **Address Stability**: Public contract addresses never change

### How Upgrades Work

```solidity
// 1. Deploy new implementation contract
NewImplementation newImpl = new NewImplementation();

// 2. Call upgradeTo on the proxy (must be authorized)
UUPSUpgradeable(proxyAddress).upgradeTo(address(newImpl));

// 3. Proxy now delegates to new implementation
// All state preserved, new logic active
```

Each contract implements `_authorizeUpgrade()` to control who can perform upgrades (usually owner, admin, or treasury).

## Network Deployments

### Mainnet Addresses

| Contract | Address | Proxy |
|----------|---------|-------|
| MRS | `0x95324aE4b5D91C7444868228E10fAa7Fa9Fbe48a` | N/A (not upgradeable) |
| ExchangeV1 | `0x7937A695Cc89a39ef6711bb7616f5ad41e094786` | `0x17df63dA8E4e42e9636C00d9C18EC0F0A10dA4Da` |
| ClaimsDBV2 | `0xCBED2362c00587720aC216C37E4b62bCAB2F53E1` | `0x6eED1ce777F9ab8a75245D6538640Ab71B27C106` |
| AttestersV2 | `0x2F66691B69f9eBca6DF1Dce18DD469E05bb4aa35` | `0x458F7192c97CfC909F0BC323A1306F660c7E91c9` |
| SafeTable | `0xC42c67FBd99a5EEfB10A56147859308836adcc8B` | `0xE29B5B8A909F77223133A67F4fA494DF548DF384` |

### Testnet Addresses

| Contract | Address | Proxy |
|----------|---------|-------|
| MRS | `0xb1d080F4F56A6ef848cDfacD7B125ac50B0D2ced` | N/A |
| ExchangeV1 | `0x4457e7ed86d8a360bce9d6098023fe7163930476` | `0x75378e8a880007136c6C6C179158cc4b348ea89f` |
| ClaimsDBV2 | (see proxy) | `0xEc29414ABc3868954DE8cd450ed4635A6229BbBd` |
| AttestersV4 | (see proxy) | `0xd40C18eFfD79d28D16ffBEbB8Cb059825376dA7D` |
| SafeTableV2 | (see proxy) | `0x354Ca87d709fBB8Afc853A7AF6EFB6C865023163` |

## Deployment Order

When deploying from scratch, follow this sequence:

1. **Token** (`token.sol`) - Deploy first as it's needed by other contracts
2. **Exchange Implementation** (`exchangeV1.sol`) - Deploy implementation
3. **Exchange Proxy** (`exchangeProxy.sol`) - Deploy with initialization data
4. **Claims Implementation** (`v2.1.sol`) - Deploy implementation
5. **Claims Proxy** (`proxy.sol`) - Deploy with initialization data
6. **Attesters Implementation** (`v2.sol`) - Deploy implementation  
7. **Attesters Proxy** (`proxy.sol`) - Deploy with initialization data
8. **Safes Implementation** (`v1.sol`) - Deploy implementation
9. **Safes Proxy** (`proxy.sol`) - Deploy with initialization data

## Fee Structure

| Action | Fee | Payment Method |
|--------|-----|----------------|
| Token Exchange | 10 MRS = 1 ETH | Fixed rate |
| Register Attester | 100 MRS | ERC-20 tokens |
| Create Claim | 10 MRS | ERC-20 tokens |
| Register Safe | 1 ETH | Native ETH |

## Security Features

- **Reentrancy Guards**: All state-changing functions protected
- **Access Control**: Role-based permissions (owner, admin, treasury)
- **Input Validation**: Size limits, zero-address checks, fee enforcement
- **Slashing Mechanism**: Attesters can be penalized for misbehavior
- **Upgrade Authorization**: Only authorized roles can upgrade contracts
- **Event Emission**: All significant actions logged on-chain

## Development

### Prerequisites

- Solidity ^0.8.20
- OpenZeppelin Contracts (UUPSUpgradeable, ReentrancyGuard)
- Hardhat or Foundry for deployment

### Testing

```bash
# Run tests
npm test

# Run specific contract tests
npm test -- --grep "MRS"
npm test -- --grep "ExchangeV1"
```

### Deployment

See individual contract READMEs for detailed deployment instructions and initialization parameters.

## Additional Resources

- [Token System Documentation](./token/README.md)
- [Claims System Documentation](./claims/README.md)
- [Attesters System Documentation](./attesters/README.md)
- [Safes System Documentation](./safes/README.md)
- [Main Project README](../README.md)
