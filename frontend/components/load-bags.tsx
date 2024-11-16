'use client';
/* eslint-disable  @typescript-eslint/no-explicit-any */
import {
  SwapDefault,
  Swap,
  SwapAmountInput,
  SwapToggleButton,
  SwapButton,
  SwapMessage,
  SwapToast
} from '@coinbase/onchainkit/swap';
import { useState, useEffect } from 'react';
import { getTokens, getSwapQuote } from '@coinbase/onchainkit/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Wallet, Send, ArrowRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAccount, useWriteContract } from 'wagmi';
import type { Token } from '@coinbase/onchainkit/token';
import {
  parseEther,
  formatEther,
  createPublicClient,
  http,
  formatUnits,
  parseUnits
} from 'viem';

const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const;
import { base } from 'viem/chains';
import { useBalance, useWalletClient } from 'wagmi';

const publicClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org')
});
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
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

interface LoadBagsProps {
  safeAddress: string;
  onSuccess?: () => void;
}

const WETH_TOKEN: Token = {
  name: 'Wrapped ETH',
  address: '0x4200000000000000000000000000000000000006',
  symbol: 'WETH',
  decimals: 18,
  chainId: base.id,
  image:
    'https://wallet-api-production.s3.amazonaws.com/uploads/tokens/weth_288.png'
};

const USDC_TOKEN: Token = {
  name: 'USDC',
  address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
  symbol: 'USDC',
  decimals: 6,
  image:
    'https://d3r81g40ycuhqg.cloudfront.net/wallet/wais/44/2b/442b80bd16af0c0d9b22e03a16753823fe826e5bfd457292b55fa0ba8c1ba213-ZWUzYjJmZGUtMDYxNy00NDcyLTg0NjQtMWI4OGEwYjBiODE2',
  chainId: base.id
};

const DEGEN_TOKEN: Token = {
  name: 'DEGEN',
  address: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
  decimals: 18,
  chainId: base.id,
  symbol: 'DEGEN',
  image: 'https://basescan.org/token/images/degentips_32.png'
};

const WETH_ADDRESS = WETH_TOKEN.address;
export function LoadBags({ safeAddress, onSuccess }: LoadBagsProps) {
  const { address } = useAccount();
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  console.log('availabletokens', availableTokens);
  // Fetch available tokens on component mount
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setIsLoadingTokens(true);
        const tokens = await getTokens({
          limit: '20'
        });

        // Check if tokens is an array (Token[]) and not an APIError
        if (Array.isArray(tokens)) {
          setAvailableTokens(tokens);
          if (tokens.length > 0) {
            setSelectedToken(tokens[0]);
          }
        } else {
          // Handle API Error
          console.error('Failed to fetch tokens:', tokens);
          setError('Failed to load available tokens');
          setAvailableTokens([]); // Set empty array as fallback
        }
      } catch (err) {
        console.error('Failed to fetch tokens:', err);
        setError('Failed to load available tokens');
        setAvailableTokens([]); // Set empty array as fallback
      } finally {
        setIsLoadingTokens(false);
      }
    };

    fetchTokens();
  }, [address]);
  const [usdBalance, setUsdBalance] = useState<string>('0.00');

  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: walletClient } = useWalletClient();
  const { data: tokenBalance } = useBalance({
    address: walletClient?.account.address,
    token: WETH_ADDRESS as `0x${string}`,
    chainId: base.id
  });

  const { data: safeBalance } = useBalance({
    address: safeAddress as `0x${string}`,
    token: WETH_ADDRESS as `0x${string}`,
    chainId: base.id
  });

  const getUSDValue = async (wethBalance: bigint) => {
    try {
      const wethAmount = formatEther(wethBalance);
      const quote = await getSwapQuote({
        from: WETH_TOKEN,
        to: USDC_TOKEN,
        amount: wethAmount,
        useAggregator: false
      });

      // USDC has 6 decimals, so we format accordingly
      const usdValue = (Number(quote.toAmount) / 1e6).toFixed(2);
      setUsdBalance(usdValue);
    } catch (error) {
      console.error('Error getting USD value:', error);
      setUsdBalance('0.00');
    }
  };

  useEffect(() => {
    if (safeBalance?.value) {
      getUSDValue(safeBalance.value);
    }
  }, [safeBalance?.value]);

  // Get the user's wallet balance
  const { data: walletBalance } = useBalance({
    address: walletClient?.account.address
  });

  const { writeContractAsync } = useWriteContract();

  const handleSendToken = async () => {
    // First check if we have WETH token and valid amount
    if (!amount || !safeAddress) {
      setError('Missing amount or safe address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const parsedAmount = parseEther(amount);

      // Use the WETH token address directly since that's what we're sending
      await writeContractAsync({
        abi: ERC20_ABI,
        address: WETH_ADDRESS as `0x${string}`, // Use the constant WETH address
        functionName: 'transfer',
        args: [safeAddress as `0x${string}`, parsedAmount]
      });

      onSuccess?.();
    } catch (err) {
      console.error('Send token error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send token');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!walletClient || !amount || !safeAddress) {
      setError('Missing required parameters');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!selectedToken) {
        throw new Error('No token selected');
      }

      const toToken: Token = {
        name: 'Wrapped ETH',
        address: '0x4200000000000000000000000000000000000006',
        symbol: 'WETH',
        decimals: 18,
        image:
          'https://wallet-api-production.s3.amazonaws.com/uploads/tokens/weth_288.png',
        chainId: 8453
      };

      // Build swap transaction
      const swapTx = await buildSwapTransaction({
        fromAddress: walletClient.account.address,
        from: selectedToken,
        to: toToken,
        amount: amount,
        useAggregator: true
      });

      // Execute the transaction
      const hash = await walletClient.sendTransaction({
        to: swapTx.to as `0x${string}`,
        // data: swapTx.data as `0x${string}`,
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
      <div className="mt-4 text-2xl text-gray-900">
        Shared balance: ${usdBalance}
        <div className="text-sm text-gray-500">
          ({safeBalance ? `${formatEther(safeBalance.value)} WETH` : '0 WETH'})
        </div>
      </div>

      <Tabs defaultValue="send" className="mt-12 w-full">
        <TabsList className="grid h-12 w-full grid-cols-2 text-2xl">
          <TabsTrigger className="text-xl" value="send">
            Send to shared bag
          </TabsTrigger>
          <TabsTrigger className="text-xl" value="swap">
            Swap tokens
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
              <Wallet className="h-4 w-4" />
              Balance:{' '}
              {tokenBalance ? `${formatEther(tokenBalance.value)} WETH` : '...'}
            </div>

            <div className="mt-4 space-y-4">
              <Input
                type="text"
                placeholder="Amount in WETH"
                value={amount}
                onChange={handleAmountChange}
                className="h-16 text-2xl"
                disabled={isLoading}
              />

              <Button
                onClick={handleSendToken}
                disabled={isLoading || !amount}
                className="h-16 w-full text-xl"
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    Send WETH to Safe <Send className="ml-2 h-6 w-6" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="swap" className="space-y-4">
          <div className="rounded-lg border p-4">
            <SwapDefault from={availableTokens} to={[WETH_TOKEN]} />
          </div>
        </TabsContent>
      </Tabs>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
