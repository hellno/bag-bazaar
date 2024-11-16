'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowRight, Wallet } from 'lucide-react';
import { parseEther, formatEther } from 'viem';
import { useBalance, useWalletClient } from 'wagmi';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  SDK,
  HashLock,
  PrivateKeyProviderConnector,
  NetworkEnum
} from '@1inch/cross-chain-sdk';
import { encodePacked, keccak256 } from 'viem';

// Helper function for random bytes generation
function getRandomBytes32() {
  return '0x' + Buffer.from(randomBytes(32)).toString('hex');
}

const SUPPORTED_NETWORKS = {
  [NetworkEnum.ARBITRUM]: {
    name: 'Arbitrum',
    usdcAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    wethAddress: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1'
  },
  [NetworkEnum.COINBASE]: {
    name: 'Base',
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    degenAddress: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed',
    wethAddress: '0x4200000000000000000000000000000000000006'
  },
  [NetworkEnum.ETHEREUM]: {
    name: 'Ethereum',
    wethAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
  },
  [NetworkEnum.OPTIMISM]: {
    name: 'OP Mainnet',
    wethAddress: '0x4200000000000000000000000000000000000006'
  },
  [NetworkEnum.GNOSIS]: {
    name: 'Gnosis',
    wethAddress: '0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1'
  }
};

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

  const { data: walletClient } = useWalletClient();

  // Get the safe's current balance
  const { data: safeBalance } = useBalance({
    address: safeAddress as `0x${string}`,
    watch: true
  });

  // Get the user's wallet balance
  const { data: walletBalance } = useBalance({
    address: walletClient?.account.address,
    watch: true
  });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimals
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };

  const validateAmount = () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    if (!walletBalance) {
      setError('Unable to fetch wallet balance');
      return false;
    }

    const amountWei = parseEther(amount);
    if (amountWei > walletBalance.value) {
      setError('Insufficient balance');
      return false;
    }

    return true;
  };

  const handleCrossChainTransfer = async () => {
    if (!validateAmount() || !walletClient) return;

    setIsLoading(true);
    setError(null);

    try {
      // Initialize 1inch SDK
      const client = createWalletClient({
        chain: mainnet,
        transport: custom(window.ethereum)
      });
      const blockchainProvider = new PrivateKeyProviderConnector(
        process.env.NEXT_PUBLIC_WALLET_KEY!,
        web3Instance
      );

      const sdk = new SDK({
        url: 'https://api.1inch.dev/fusion-plus',
        authKey: process.env.NEXT_PUBLIC_DEV_PORTAL_KEY!,
        blockchainProvider
      });

      // Setup cross-chain transfer parameters
      const params = {
        srcChainId: sourceChain,
        dstChainId: NetworkEnum.COINBASE,
        srcTokenAddress: SUPPORTED_NETWORKS[sourceChain].usdcAddress,
        dstTokenAddress: SUPPORTED_NETWORKS[NetworkEnum.COINBASE].wethAddress,
        amount: parseEther(amount).toString(),
        enableEstimate: true,
        walletAddress: walletClient.account.address
      };

      // Get quote
      const quote = await sdk.getQuote(params);
      const secretsCount = quote.getPreset().secretsCount;

      // Generate secrets and hashes
      const secrets = Array.from({ length: secretsCount }).map(() =>
        getRandomBytes32()
      );
      const secretHashes = secrets.map((x) => HashLock.hashSecret(x));

      // Create hash lock
      const hashLock =
        secretsCount === 1
          ? HashLock.forSingleFill(secrets[0])
          : HashLock.forMultipleFills(
              secretHashes.map((secretHash, i) =>
                keccak256(
                  encodePacked(
                    ['uint64', 'bytes32'],
                    [i, secretHash.toString()]
                  )
                )
              )
            );

      // Place order
      const quoteResponse = await sdk.placeOrder(quote, {
        walletAddress: walletClient.account.address,
        hashLock,
        secretHashes
      });

      // Monitor order status
      const intervalId = setInterval(async () => {
        try {
          const orderStatus = await sdk.getOrderStatus(quoteResponse.orderHash);
          if (orderStatus.status === 'executed') {
            clearInterval(intervalId);
            setIsLoading(false);
            onSuccess?.();
          }

          const fillsObject = await sdk.getReadyToAcceptSecretFills(
            quoteResponse.orderHash
          );
          if (fillsObject.fills.length > 0) {
            for (const fill of fillsObject.fills) {
              await sdk.submitSecret(
                quoteResponse.orderHash,
                secrets[fill.idx]
              );
            }
          }
        } catch (err) {
          console.error('Error monitoring order:', err);
        }
      }, 5000);
    } catch (err) {
      console.error('Error in cross-chain transfer:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to process cross-chain transfer'
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg bg-gray-50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium">Load your shared bag</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Wallet className="h-4 w-4" />
          Balance:{' '}
          {walletBalance ? `${formatEther(walletBalance.value)} ETH` : '...'}
        </div>
      </div>

      <Select
        value={sourceChain.toString()}
        onValueChange={(value) => setSourceChain(Number(value) as NetworkEnum)}
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

      <div className="space-y-2">
        <div className="flex gap-4">
          <Input
            type="text"
            placeholder="Amount in ETH"
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
