import { getDefaultConfig, connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  rainbowWallet,
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
  braveWallet,
  trustWallet,
  ledgerWallet,
  argentWallet,
  imTokenWallet,
  omniWallet,
  tahoWallet,
  zerionWallet,
  rabbyWallet,
  safeWallet,
  coreWallet,
  bitgetWallet,
  okxWallet,
  phantomWallet,
  injectedWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { mainnet, sepolia } from 'wagmi/chains';
import { createConfig, http, cookieStorage, createStorage } from 'wagmi';
import { TESTNET_ONLY } from '@/lib/config';

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Popular',
      wallets: [
        metaMaskWallet,
        rainbowWallet,
        coinbaseWallet,
        braveWallet,
        walletConnectWallet,
      ],
    },
    {
      groupName: 'More Wallets',
      wallets: [
        trustWallet,
        ledgerWallet,
        rabbyWallet,
        zerionWallet,
        safeWallet,
        argentWallet,
        okxWallet,
        bitgetWallet,
        phantomWallet,
        coreWallet,
        tahoWallet,
        omniWallet,
        imTokenWallet,
        injectedWallet,
      ],
    },
  ],
  {
    appName: 'Miras - Trustless Inheritance',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  }
);

// TESTNET_ONLY: When true, only Sepolia is offered to wallets.
// Set TESTNET_ONLY to false in config.ts to restore mainnet.
export const wagmiConfig = TESTNET_ONLY
  ? createConfig({
      connectors,
      chains: [sepolia],
      transports: { [sepolia.id]: http() },
      ssr: true,
      storage: createStorage({ storage: cookieStorage }),
    })
  : createConfig({
      connectors,
      chains: [mainnet, sepolia],
      transports: { [mainnet.id]: http(), [sepolia.id]: http() },
      ssr: true,
      storage: createStorage({ storage: cookieStorage }),
    });
