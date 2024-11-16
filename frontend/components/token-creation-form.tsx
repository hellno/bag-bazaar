'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useWriteContract } from 'wagmi';
import { parseEther } from 'viem';

const TOKEN_FACTORY_ABI = [
  {
    inputs: [
      { name: '_name', type: 'string' },
      { name: '_symbol', type: 'string' },
      { name: '_supply', type: 'uint256' },
      { name: '_initialTick', type: 'int24' },
      { name: '_fee', type: 'uint24' },
      { name: '_salt', type: 'bytes32' },
      { name: '_deployer', type: 'address' }
    ],
    name: 'deployToken',
    outputs: [
      { name: 'token', type: 'address' },
      { name: 'tokenId', type: 'uint256' }
    ],
    stateMutability: 'payable',
    type: 'function'
  }
] as const;

const TOKEN_FACTORY_ADDRESS = '0x4D4c405b2Ff2342bA3cE3c2c6087F3CEf9b6d2eA' as `0x${string}`;

interface TokenCreationFormProps {
  onSubmit: (tokenName: string, tokenTicker: string) => void;
  isLoading?: boolean;
}

export function TokenCreationForm({
  onSubmit,
  isLoading: externalLoading
}: TokenCreationFormProps) {
  const [tokenName, setTokenName] = useState('');
  const [tokenTicker, setTokenTicker] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { writeContractAsync, isPending: isContractWritePending } = useWriteContract();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      const defaultParams = {
        supply: parseEther('1000000000'), // 1 billion tokens with 18 decimals
        initialTick: -207400n,
        fee: 10000,
        salt: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
        deployer: '0xC2C0CfE4df39eB89e77F232cc0354731B37157C8' as `0x${string}`
      };

      const tx = await writeContractAsync({
        address: TOKEN_FACTORY_ADDRESS,
        abi: TOKEN_FACTORY_ABI,
        functionName: 'deployToken',
        args: [
          tokenName,
          tokenTicker,
          defaultParams.supply,
          defaultParams.initialTick,
          defaultParams.fee,
          defaultParams.salt,
          defaultParams.deployer
        ]
      });

      onSubmit(tokenName, tokenTicker);
    } catch (error) {
      console.error('Error deploying token:', error);
      setError(error instanceof Error ? error.message : 'Failed to deploy token');
    }
  };

  const isLoading = externalLoading || isContractWritePending;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-4">
        <label className="block text-xl font-medium text-gray-700">
          Token Name
          <Input
            type="text"
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            placeholder="ETHGlobalWifiSucks"
            className="mt-2 h-16 text-2xl"
            required
          />
        </label>
        <p className="text-sm text-gray-500">
          Choose a memorable name for your token
        </p>
      </div>

      <div className="space-y-4">
        <label className="block text-xl font-medium text-gray-700">
          Token Symbol
          <Input
            type="text"
            value={tokenTicker}
            onChange={(e) => setTokenTicker(e.target.value.toUpperCase())}
            placeholder="NOWIFI"
            className="mt-2 h-16 text-2xl uppercase"
            maxLength={5}
            required
          />
        </label>
        <p className="text-sm text-gray-500">
          A short symbol for your token (max 5 characters)
        </p>
      </div>

      <Button
        type="submit"
        disabled={isLoading || !tokenName || !tokenTicker}
        className="mt-8 h-16 w-full text-xl"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            Creating Token...
          </>
        ) : (
          'Create Token'
        )}
      </Button>
      {error && (
        <p className="mt-4 text-sm text-red-500">{error}</p>
      )}
    </form>
  );
}
