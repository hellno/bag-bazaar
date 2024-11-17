'use client';
import React from 'react';
import ThemeProvider from './ThemeToggle/theme-provider';
import { SessionProvider, SessionProviderProps } from 'next-auth/react';
import { WagmiProvider } from 'wagmi';
import { OnchainKitProvider, setOnchainKitConfig } from '@coinbase/onchainkit';
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';

setOnchainKitConfig({
  apiKey: process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY!
});
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import {
  mainnet,
  arbitrum,
  base,
  baseSepolia,
  unichainSepolia,
  mantle,
  morph
} from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

const wagmiConfig = getDefaultConfig({
  appName: 'BagBazaar',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!,
  chains: [base, baseSepolia, unichainSepolia, mantle, morph, arbitrum],
  ssr: true // If your dApp uses server side rendering (SSR)
});

const queryClient = new QueryClient();

export default function Providers({
  session,
  children,
  initialState
}: {
  session: SessionProviderProps['session'];
  children: React.ReactNode;
  initialState?: any;
}) {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID!
      }}
    >
      <WagmiProvider config={wagmiConfig} initialState={initialState}>
        <QueryClientProvider client={queryClient}>
          <OnchainKitProvider
            chain={base}
            apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY!}
          >
            <RainbowKitProvider modalSize="compact">
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
              >
                <SessionProvider session={session}>{children}</SessionProvider>
              </ThemeProvider>
            </RainbowKitProvider>
          </OnchainKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
}
