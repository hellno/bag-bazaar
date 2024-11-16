'use client';
/* eslint-disable  @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowRight, Wallet } from 'lucide-react';
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
  [NetworkEnum.ARBITRUM]: {
    // 42161
    name: 'Arbitrum',
    tokens: {
      USDC: {
        address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        symbol: 'USDC',
        name: 'USD Coin'
      },
      WETH: {
        address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
        symbol: 'WETH',
        name: 'Wrapped Ethereum'
      }
    }
  },
  [NetworkEnum.COINBASE]: {
    // 8453
    name: 'Base',
    tokens: {
      ETH: {
        address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        symbol: 'ETH',
        name: 'Ethereum'
      },
      USDC: {
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        symbol: 'USDC',
        name: 'USD Coin'
      },
      WETH: {
        address: '0x4200000000000000000000000000000000000006',
        symbol: 'WETH',
        name: 'Wrapped Ethereum'
      }
    }
  },
  [NetworkEnum.ETHEREUM]: {
    // 1
    name: 'Ethereum',
    tokens: {
      WETH: {
        symbol: 'WETH',
        name: 'Wrapped Ethereum',
        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
      }
    }
  },
  [NetworkEnum.OPTIMISM]: {
    // 10
    name: 'OP Mainnet',
    tokens: {
      WETH: {
        symbol: 'WETH',
        name: 'Wrapped Ethereum',
        address: '0x4200000000000000000000000000000000000006'
      }
    }
  },
  [NetworkEnum.GNOSIS]: {
    // 100
    name: 'Gnosis',
    tokens: {
      WETH: {
        symbol: 'WETH',
        name: 'Wrapped Ethereum',
        address: '0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1'
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
            onClick={handleCrossChainTransfer}
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
