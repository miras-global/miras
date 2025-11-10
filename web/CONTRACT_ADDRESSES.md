# Contract Address Configuration

This document explains how contract addresses are managed in the Miras web application.

## Overview

Contract addresses for both Sepolia testnet and Ethereum mainnet are now centralized and configurable through environment variables. This makes it easier to:

- Switch between networks
- Update contract addresses without modifying code
- Deploy to different environments with different configurations

## Configuration Files

### `.env.example`
Template file showing all available environment variables. Copy this to `.env.local` for local development.

### `.env.local`
Local development configuration (gitignored). This is where you set your actual contract addresses.

### `lib/config.ts`
Centralized configuration module that reads environment variables and provides typed configuration objects to the application.

## Environment Variables

All environment variables must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser.

### Network Selection
```bash
NEXT_PUBLIC_NETWORK=sepolia  # or 'mainnet'
```

### Sepolia Testnet Addresses
```bash
NEXT_PUBLIC_SEPOLIA_ATTESTERS_PROXY=0xd40C18eFfD79d28D16ffBEbB8Cb059825376dA7D
NEXT_PUBLIC_SEPOLIA_SAFES_PROXY=0x354Ca87d709fBB8Afc853A7AF6EFB6C865023163
NEXT_PUBLIC_SEPOLIA_CLAIMS_PROXY=0xc9a15ECc6AB6dA17E8EaF9177d31Ef55b0a50Ede
NEXT_PUBLIC_SEPOLIA_TOKEN_ADDRESS=0xb1d080F4F56A6ef848cDfacD7B125ac50B0D2ced
NEXT_PUBLIC_SEPOLIA_EXCHANGE_ADDRESS=0x75378e8a880007136c6C6C179158cc4b348ea89f
```

### Ethereum Mainnet Addresses
```bash
NEXT_PUBLIC_MAINNET_ATTESTERS_PROXY=0x458F7192c97CfC909F0BC323A1306F660c7E91c9
NEXT_PUBLIC_MAINNET_SAFES_PROXY=0xE29B5B8A909F77223133A67F4fA494DF548DF384
NEXT_PUBLIC_MAINNET_CLAIMS_PROXY=0xCBED2362c00587720aC216C37E4b62bCAB2F53E1
NEXT_PUBLIC_MAINNET_TOKEN_ADDRESS=0x95324aE4b5D91C7444868228E10fAa7Fa9Fbe48a
NEXT_PUBLIC_MAINNET_EXCHANGE_ADDRESS=0x17df63dA8E4e42e9636C00d9C18EC0F0A10dA4Da
```

## Usage in Code

Import the configuration in your components:

```typescript
import { CHAIN, NETWORK_CONFIGS } from "@/lib/config";

// Use the active network configuration
const attestersAddress = CHAIN.attestersProxy;

// Or access specific network configs
const sepoliaToken = NETWORK_CONFIGS.sepolia.tokenAddress;
const mainnetToken = NETWORK_CONFIGS.mainnet.tokenAddress;
```

## Switching Networks

To switch between Sepolia and Mainnet:

1. Update `NEXT_PUBLIC_NETWORK` in your `.env.local` file
2. Restart the development server

```bash
# For Sepolia testnet
NEXT_PUBLIC_NETWORK=sepolia

# For Ethereum mainnet
NEXT_PUBLIC_NETWORK=mainnet
```

## Fallback Values

If environment variables are not set, the configuration will fall back to the default addresses specified in `lib/config.ts`. This ensures the application works even without a `.env.local` file.

## Files Modified

The following files were updated to use the centralized configuration:

- `app/launch/page.tsx` - Safe creation and attester selection
- `app/claim/page.tsx` - Claim creation
- `app/register/page.tsx` - Attester registration
- `app/track/page.tsx` - Claim tracking
- `app/exchange/ExchangeClient.tsx` - Token exchange

## Migration Notes

Previously, contract addresses were hardcoded in each component file with an `IS_MAINNET` boolean flag. This has been replaced with a centralized configuration system that reads from environment variables.

The old pattern:
```typescript
const IS_MAINNET = false;
const CHAIN = IS_MAINNET ? { ... } : { ... };
```

The new pattern:
```typescript
import { CHAIN } from "@/lib/config";
// CHAIN is automatically configured based on NEXT_PUBLIC_NETWORK
```
