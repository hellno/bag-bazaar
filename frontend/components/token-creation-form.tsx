'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import {
  useWriteContract,
  useAccount,
  useConfig,
  useReadContract
} from 'wagmi';
import { parseEther } from 'viem';
import {
  base,
  baseSepolia,
  mainnet,
  mantle,
  sepolia,
  unichainSepolia,
  morph,
  arbitrum,
  celo
} from 'viem/chains';

const TOKEN_FACTORY_ADDRESSES: { [chainId: number]: `0x${string}` } = {
  [base.id]: '0x928073CC726e717b4C4f6a596198c4374266aEbe',
  [baseSepolia.id]: '0x928073CC726e717b4C4f6a596198c4374266aEbe',
  // [mainnet.id]: '0x0000000000000000000000000000000000000000',
  // [sepolia.id]: '0x0000000000000000000000000000000000000000',
  [unichainSepolia.id]: '0x928073CC726e717b4C4f6a596198c4374266aEbe',
  [mantle.id]: '0x928073CC726e717b4C4f6a596198c4374266aEbe',
  [morph.id]: '0x928073CC726e717b4C4f6a596198c4374266aEbe',
  [arbitrum.id]: '0x928073CC726e717b4C4f6a596198c4374266aEbe',
  [celo.id]: '0x928073CC726e717b4C4f6a596198c4374266aEbe'
} as const;

function getTokenFactoryAddress(chainId: number): `0x${string}` {
  const address = TOKEN_FACTORY_ADDRESSES[chainId];
  if (!address) {
    throw new Error(`No token factory address found for chain ID ${chainId}`);
  }
  return address;
}

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
  },
  {
    inputs: [
      { name: 'deployer', type: 'address' },
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'supply', type: 'uint256' }
    ],
    name: 'generateSalt',
    outputs: [
      { name: 'salt', type: 'bytes32' },
      { name: 'token', type: 'address' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

interface TokenCreationFormProps {
  deployer: `0x${string}`;
  onSubmit: (
    tokenName: string,
    tokenTicker: string,
    txHash: `0x${string}`,
    predictedAddress: `0x${string}`
  ) => void;
  isLoading?: boolean;
}

export function TokenCreationForm({
  deployer,
  onSubmit,
  isLoading: externalLoading
}: TokenCreationFormProps) {
  const [tokenName, setTokenName] = useState('');
  const [tokenTicker, setTokenTicker] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingSalt, setIsGeneratingSalt] = useState(false);

  const { writeContractAsync, isPending: isContractWritePending } =
    useWriteContract();
  const { chain, address } = useAccount();
  const { chains } = useConfig();

  const { data: saltData, isLoading: isSaltLoading } = useReadContract({
    address: getTokenFactoryAddress(chain?.id ?? base.id),
    abi: TOKEN_FACTORY_ABI,
    functionName: 'generateSalt',
    args: [
      address!, // deployer address
      tokenName,
      tokenTicker,
      parseEther('1000000000') // supply
    ],
    query: {
      enabled: !!address && !!tokenName && !!tokenTicker && !!chain
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!chain || !address) {
      setError('Please connect your wallet to continue');
      return;
    }

    if (!chain || !address) {
      setError('Please connect your wallet to continue');
      return;
    }

    if (!saltData) {
      setError('Failed to generate salt');
      return;
    }

    const [salt, predictedAddress] = saltData;
    console.log('Generated salt:', salt);
    console.log('Predicted token address:', predictedAddress);

    try {
      const factoryAddress = getTokenFactoryAddress(chain.id);
      const supply = parseEther('1000000000'); // 1 billion tokens with 18 decimals

      const tx = await writeContractAsync({
        address: factoryAddress,
        abi: TOKEN_FACTORY_ABI,
        functionName: 'deployToken',
        args: [
          tokenName,
          tokenTicker,
          supply,
          // @ts-ignore
          -207400n, // initialTick
          10000, // fee
          salt,
          address // deployer
        ]
      });

      onSubmit(tokenName, tokenTicker, tx, predictedAddress);
    } catch (error) {
      console.error('Error deploying token:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to deploy token'
      );
    }
  };

  const isLoading = externalLoading || isContractWritePending;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-4">
        <label className="block text-xl font-medium text-foreground">
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
        <label className="block text-xl font-medium text-foreground">
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

      {!chain && (
        <p className="text-yellow-600">
          Please connect your wallet to continue
        </p>
      )}
      {chain && !TOKEN_FACTORY_ADDRESSES[chain.id] && (
        <p className="text-red-600">
          Token creation is not supported on {chain.name}. Supported chains:{' '}
          {chains
            .filter((c) => TOKEN_FACTORY_ADDRESSES[c.id])
            .map((c) => c.name)
            .join(', ')}
        </p>
      )}
      <Button
        type="submit"
        disabled={
          isLoading ||
          isSaltLoading ||
          !tokenName ||
          !tokenTicker ||
          !chain ||
          !TOKEN_FACTORY_ADDRESSES[chain?.id]
        }
        className="mt-8 h-16 w-full text-xl"
      >
        {isSaltLoading ? (
          <>
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            Generating Salt...
          </>
        ) : isLoading ? (
          <>
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            Creating Token...
          </>
        ) : (
          'Create Token'
        )}
      </Button>
      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
    </form>
  );
}
