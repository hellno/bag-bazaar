'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowRight, Wallet } from 'lucide-react';
import { parseEther, formatEther } from 'viem';
import { useBalance, useWalletClient } from 'wagmi';

interface LoadBagsProps {
  safeAddress: string;
  onSuccess?: () => void;
}

export function LoadBags({ safeAddress, onSuccess }: LoadBagsProps) {
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: walletClient } = useWalletClient();
  
  // Get the safe's current balance
  const { data: safeBalance } = useBalance({
    address: safeAddress as `0x${string}`,
    watch: true,
  });

  // Get the user's wallet balance
  const { data: walletBalance } = useBalance({
    address: walletClient?.account.address,
    watch: true,
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

  const handleSend = async () => {
    if (!validateAmount() || !walletClient) return;

    setIsLoading(true);
    setError(null);

    try {
      const tx = await walletClient.sendTransaction({
        to: safeAddress as `0x${string}`,
        value: parseEther(amount),
      });

      console.log('Transaction sent:', tx);
      
      // Wait for transaction to be mined
      const receipt = await walletClient.waitForTransactionReceipt({ 
        hash: tx 
      });
      
      console.log('Transaction confirmed:', receipt);
      
      // Clear input and call success callback
      setAmount('');
      onSuccess?.();
    } catch (err) {
      console.error('Error sending transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to send ETH');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg bg-gray-50 p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Load your bags with ETH</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Wallet className="h-4 w-4" />
          Balance: {walletBalance ? `${formatEther(walletBalance.value)} ETH` : '...'}
        </div>
      </div>

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
            onClick={handleSend}
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
        
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-500">
        Safe Balance: {safeBalance ? `${formatEther(safeBalance.value)} ETH` : '0 ETH'}
      </div>
    </div>
  );
}
