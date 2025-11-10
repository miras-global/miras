/**
 * Centralized configuration for contract addresses
 * Reads from environment variables with fallback to hardcoded values
 */

const IS_MAINNET = process.env.NEXT_PUBLIC_NETWORK === 'mainnet';

export type NetworkConfig = {
  id: number;
  hex: string;
  name: string;
  keyName: string;
  rpc: string;
  explorer: string;
  safePrefix: string;
  attestersProxy: string;
  safesProxy: string;
  claimsProxy: string;
  tokenAddress: string;
  exchangeAddress: string;
};

const SEPOLIA_CONFIG: NetworkConfig = {
  id: 11155111,
  hex: "0xaa36a7",
  name: "Sepolia",
  keyName: "sepolia",
  rpc: "https://rpc.ankr.com/eth_sepolia",
  explorer: "https://sepolia.etherscan.io",
  safePrefix: "sep",
  attestersProxy: process.env.NEXT_PUBLIC_SEPOLIA_ATTESTERS_PROXY || "0xd40C18eFfD79d28D16ffBEbB8Cb059825376dA7D",
  safesProxy: process.env.NEXT_PUBLIC_SEPOLIA_SAFES_PROXY || "0x354Ca87d709fBB8Afc853A7AF6EFB6C865023163",
  claimsProxy: process.env.NEXT_PUBLIC_SEPOLIA_CLAIMS_PROXY || "0xf5CFc97131F2a341062347888116e2586498D12f",
  tokenAddress: process.env.NEXT_PUBLIC_SEPOLIA_TOKEN_ADDRESS || "0xb1d080F4F56A6ef848cDfacD7B125ac50B0D2ced",
  exchangeAddress: process.env.NEXT_PUBLIC_SEPOLIA_EXCHANGE_ADDRESS || "0x75378e8a880007136c6C6C179158cc4b348ea89f",
};

const MAINNET_CONFIG: NetworkConfig = {
  id: 1,
  hex: "0x1",
  name: "Ethereum Mainnet",
  keyName: "mainnet",
  rpc: "https://rpc.ankr.com/eth",
  explorer: "https://etherscan.io",
  safePrefix: "eth",
  attestersProxy: process.env.NEXT_PUBLIC_MAINNET_ATTESTERS_PROXY || "0x458F7192c97CfC909F0BC323A1306F660c7E91c9",
  safesProxy: process.env.NEXT_PUBLIC_MAINNET_SAFES_PROXY || "0xE29B5B8A909F77223133A67F4fA494DF548DF384",
  claimsProxy: process.env.NEXT_PUBLIC_MAINNET_CLAIMS_PROXY || "0xCBED2362c00587720aC216C37E4b62bCAB2F53E1",
  tokenAddress: process.env.NEXT_PUBLIC_MAINNET_TOKEN_ADDRESS || "0x95324aE4b5D91C7444868228E10fAa7Fa9Fbe48a",
  exchangeAddress: process.env.NEXT_PUBLIC_MAINNET_EXCHANGE_ADDRESS || "0x17df63dA8E4e42e9636C00d9C18EC0F0A10dA4Da",
};

export const CHAIN = IS_MAINNET ? MAINNET_CONFIG : SEPOLIA_CONFIG;

export const NETWORK_CONFIGS = {
  sepolia: SEPOLIA_CONFIG,
  mainnet: MAINNET_CONFIG,
};

export function getNetworkConfig(network: 'sepolia' | 'mainnet'): NetworkConfig {
  return NETWORK_CONFIGS[network];
}
