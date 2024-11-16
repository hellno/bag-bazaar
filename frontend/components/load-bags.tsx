'use client';
/* eslint-disable  @typescript-eslint/no-explicit-any */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Wallet, Send, ArrowRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWriteContract } from 'wagmi';
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

export function LoadBags({ safeAddress, onSuccess }: LoadBagsProps) {
  const WETH_ADDRESS = '0x4200000000000000000000000000000000000006';
  const [selectedToken] = useState<Token>({
    name: 'Wrapped ETH',
    address: WETH_ADDRESS,
    symbol: 'WETH',
    decimals: 18,
    chainId: base.id,
    image:
      'https://wallet-api-production.s3.amazonaws.com/uploads/tokens/weth_288.png'
  });

  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: walletClient } = useWalletClient();
  const { data: tokenBalance } = useBalance({
    address: walletClient?.account.address,
    token: WETH_ADDRESS as `0x${string}`,
    chainId: base.id
  });

  // Get the safe's current balance
  const { data: safeBalance } = useBalance({
    address: safeAddress as `0x${string}`
  });

  // Get the user's wallet balance
  const { data: walletBalance } = useBalance({
    address: walletClient?.account.address
  });

  const { writeContract } = useWriteContract();

  const handleSendToken = async () => {
    if (!selectedToken || !amount || !safeAddress) {
      setError('Missing required parameters');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const parsedAmount = parseUnits(amount, selectedToken.decimals);

      await writeContract({
        abi: ERC20_ABI,
        address: selectedToken.address as `0x${string}`,
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
      <div className="mt-4 text-xl text-gray-900">
        Safe Balance:{' '}
        {safeBalance ? `${formatEther(safeBalance.value)} ETH` : '0 ETH'}
      </div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Wallet className="h-4 w-4" />
          Balance:{' '}
          {tokenBalance
            ? `${formatEther(tokenBalance.value)} ${selectedToken?.symbol}`
            : '...'}
        </div>
      </div>

      <Tabs defaultValue="send" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="send">Send Tokens</TabsTrigger>
          <TabsTrigger value="swap">Swap Tokens</TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="mb-4 text-lg font-medium">Send WETH to Safe</h3>

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
            <h3 className="mb-4 text-lg font-medium">Swap Tokens</h3>
            <Select
              className="h-16 text-2xl"
              value={selectedToken?.address ?? ''}
              onValueChange={(value) => {
                const token = availableTokens.find((t) => t.address === value);
                setSelectedToken(token ?? null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select token">
                  <div className="flex items-center gap-2">
                    {selectedToken.image && (
                      <img
                        src={selectedToken.image}
                        alt={selectedToken.symbol}
                        className="h-5 w-5 rounded-full"
                      />
                    )}
                    <span>{selectedToken.symbol}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={WETH_ADDRESS}>
                  <div className="flex items-center gap-2">
                    <img
                      src={selectedToken.image}
                      alt={selectedToken.symbol}
                      className="h-5 w-5 rounded-full"
                    />
                    <span>{selectedToken.symbol}</span>
                    <span className="text-sm text-gray-500">
                      ({selectedToken.name})
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="mt-4 space-y-4">
              <Input
                type="text"
                placeholder={`Amount in ${selectedToken?.symbol ?? ''}`}
                value={amount}
                onChange={handleAmountChange}
                className="h-16 text-2xl"
                disabled={isLoading}
              />
              <Button
                onClick={handleSwap}
                disabled={isLoading || !amount || !selectedToken}
                className="h-16 w-full text-xl"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Swap Tokens <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
