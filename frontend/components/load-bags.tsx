'use client';
/* eslint-disable  @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowRight, Wallet } from 'lucide-react';
import { buildSwapTransaction } from '@coinbase/onchainkit/api';
import type { Token } from '@coinbase/onchainkit/token';
import { parseEther, formatEther, createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { useBalance, useWalletClient } from 'wagmi';

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http('https://sepolia.base.org')
});
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { buildSwapTransaction } from '@coinbase/onchainkit/api';
import type { Token } from '@coinbase/onchainkit/token';
import { encodePacked, keccak256 } from 'viem';

// Helper function for random bytes generation using Web Crypto API
function getRandomBytes32(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return (
    '0x' +
    Array.from(array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  );
}

// Type definitions
type SupportedToken =
  keyof (typeof SUPPORTED_NETWORKS)[NetworkEnum.ARBITRUM]['tokens'];

// Type guards for validation
function isValidNetwork(
  chain: number
): chain is keyof typeof SUPPORTED_NETWORKS {
  return chain in SUPPORTED_NETWORKS;
}

function isValidToken(
  network: keyof typeof SUPPORTED_NETWORKS,
  token: string
): token is keyof (typeof SUPPORTED_NETWORKS)[typeof network]['tokens'] {
  return token in SUPPORTED_NETWORKS[network].tokens;
}

const SUPPORTED_NETWORKS = {
  [NetworkEnum.BASE]: {
    name: 'Base',
    tokens: {
      ETH: {
        name: 'Ethereum',
        address: '',
        symbol: 'ETH',
        decimals: 18,
        image: 'https://wallet-api-production.s3.amazonaws.com/uploads/tokens/eth_288.png',
        chainId: 8453
      },
      USDC: {
        name: 'USD Coin',
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        symbol: 'USDC',
        decimals: 6,
        image: 'https://d3r81g40ycuhqg.cloudfront.net/wallet/wais/44/2b/442b80bd16af0c0d9b22e03a16753823fe826e5bfd457292b55fa0ba8c1ba213',
        chainId: 8453
      }
    }
  }
} as const;

interface LoadBagsProps {
  safeAddress: string;
  onSuccess?: () => void;
}

export function LoadBags({ safeAddress, onSuccess }: LoadBagsProps) {
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceChain, setSourceChain] = useState<NetworkEnum>(
    NetworkEnum.ARBITRUM
  );
  const [selectedToken, setSelectedToken] = useState<SupportedToken>('WETH');

  const { data: walletClient } = useWalletClient();
  const { data: tokenBalance } = useBalance({
    address: walletClient?.account.address,
    token:
      isValidNetwork(sourceChain) && isValidToken(sourceChain, selectedToken)
        ? (SUPPORTED_NETWORKS[sourceChain].tokens[selectedToken]
            .address as `0x${string}`)
        : undefined,
    chainId: sourceChain
    // watch: true
  });

  // Get the safe's current balance
  const { data: safeBalance } = useBalance({
    address: safeAddress as `0x${string}`
    // watch: true
  });

  // Get the user's wallet balance
  const { data: walletBalance } = useBalance({
    address: walletClient?.account.address
    // watch: true
  });

  const handleSwap = async () => {
    if (!walletClient || !amount || !safeAddress) {
      setError('Missing required parameters');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get token configurations
      const fromTokenConfig = SUPPORTED_NETWORKS[sourceChain].tokens[selectedToken];
      
      // Create token objects for OnchainKit
      const fromToken: Token = {
        name: fromTokenConfig.name,
        address: fromTokenConfig.address,
        symbol: fromTokenConfig.symbol,
        decimals: fromTokenConfig.decimals,
        image: fromTokenConfig.image,
        chainId: fromTokenConfig.chainId
      };

      const toToken: Token = {
        name: 'Ethereum',
        address: '',
        symbol: 'ETH',
        decimals: 18,
        image: 'https://wallet-api-production.s3.amazonaws.com/uploads/tokens/eth_288.png',
        chainId: baseSepolia.id
      };

      // Build swap transaction
      const swapTx = await buildSwapTransaction({
        fromAddress: walletClient.account.address,
        from: fromToken,
        to: toToken,
        amount: amount,
        useAggregator: false
      });

      // Execute the transaction
      const hash = await walletClient.sendTransaction({
        to: swapTx.to as `0x${string}`,
        data: swapTx.data as `0x${string}`,
        value: BigInt(swapTx.value || 0)
      });

      console.log('Swap transaction submitted:', hash);
      
      // Wait for transaction confirmation
      await publicClient.waitForTransactionReceipt({ hash });
      
      // Call success callback if provided
      onSuccess?.();

    } catch (err) {
      console.error('Swap error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process swap');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimals
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };

  return (
    <div className="space-y-4 rounded-lg bg-gray-50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium">Load your shared bag</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Wallet className="h-4 w-4" />
          Balance:{' '}
          {tokenBalance
            ? `${formatEther(tokenBalance.value)} ${selectedToken}`
            : '...'}
        </div>
      </div>

      <Select
        value={sourceChain.toString()}
        onValueChange={(value) => {
          setSourceChain(Number(value) as NetworkEnum);
          setSelectedToken('WETH');
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select source chain" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(SUPPORTED_NETWORKS).map(([chainId, network]) => (
            <SelectItem key={chainId} value={chainId}>
              {network.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={selectedToken}
        onValueChange={(value: string) =>
          setSelectedToken(value as SupportedToken)
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Select token" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(SUPPORTED_NETWORKS[sourceChain].tokens).map(
            ([symbol, token]) => (
              <SelectItem key={symbol} value={symbol}>
                <div className="flex items-center gap-2">
                  <span>{(token as { symbol: string }).symbol}</span>
                  <span className="text-sm text-gray-500">
                    ({(token as { name: string }).name})
                  </span>
                </div>
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>

      <div className="space-y-2">
        <div className="flex gap-4">
          <Input
            type="text"
            placeholder={`Amount in ${selectedToken}`}
            value={amount}
            onChange={handleAmountChange}
            className="text-xl"
            disabled={isLoading}
          />
          <Button
            onClick={handleSwap}
            disabled={isLoading || !amount}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Send <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      <div className="mt-4 text-sm text-gray-500">
        Safe Balance:{' '}
        {safeBalance ? `${formatEther(safeBalance.value)} ETH` : '0 ETH'}
      </div>
    </div>
  );
}
