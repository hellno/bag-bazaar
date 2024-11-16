'use client';
import React from 'react';
import ThemeProvider from './ThemeToggle/theme-provider';
import { SessionProvider, SessionProviderProps } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { getConfig } from '@/wagmi';

// Create a client
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
    <WagmiProvider config={getConfig()} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY!}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <SessionProvider session={session}>{children}</SessionProvider>
          </ThemeProvider>
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
