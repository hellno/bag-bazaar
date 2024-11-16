'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, X } from 'lucide-react';
import { useAddress, useName } from '@coinbase/onchainkit/identity';
import { Button } from './ui/button';

interface AddressInputProps {
  value: string;
  onChange: (value: string, resolvedAddress?: string, isValid: boolean) => void;
  onRemove?: () => void;
  label?: string;
  showRemoveButton?: boolean;
}

interface ResolvedData {
  resolvedAddress?: string;
  resolvedName?: string;
  isValid: boolean;
}

export function AddressInput({
  value,
  onChange,
  onRemove,
  label,
  showRemoveButton = false
}: AddressInputProps) {
  const [input, setInput] = useState(value);
  const [resolvedData, setResolvedData] = useState<ResolvedData>({
    isValid: false
  });

  // Use hooks for ENS resolution
  const { data: resolvedName, isLoading: isLoadingName } = useName({
    address: input
  });
  const { data: resolvedAddress, isLoading: isLoadingAddress } = useAddress({
    name: input
  });

  const isLoading = isLoadingName || isLoadingAddress;

  useEffect(() => {
    validateAndResolveEntry();
  }, [input, resolvedName, resolvedAddress]);

  const validateAndResolveEntry = () => {
    // Don't resolve empty inputs
    if (!input.trim()) {
      setResolvedData({ isValid: false });
      onChange(input, undefined);
      return;
    }

    const isEthAddress = /^0x[a-fA-F0-9]{40}$/.test(input);
    const isEns = input.toLowerCase().endsWith('.eth');
    
    let newResolvedData: ResolvedData = {
      isValid: false
    };

    if (isEthAddress) {
      newResolvedData = {
        resolvedAddress: input,
        resolvedName,
        isValid: true
      };
    } else if (isEns && resolvedAddress) {
      newResolvedData = {
        resolvedAddress,
        resolvedName: input,
        isValid: true
      };
    }

    setResolvedData(newResolvedData);
    onChange(input, newResolvedData.resolvedAddress, newResolvedData.isValid);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInput(newValue);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <div className="flex items-center gap-4">
        <Input
          type="text"
          placeholder="0x... or name.eth"
          value={input}
          onChange={handleInputChange}
          className={`w-full rounded-lg p-6 text-3xl ${
            resolvedData.isValid ? 'border-green-500' : ''
          }`}
        />
        {showRemoveButton && onRemove && (
          <Button onClick={onRemove} variant="ghost" className="p-6">
            <X className="h-8 w-8 text-red-500" />
          </Button>
        )}
      </div>
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Resolving...
        </div>
      )}
      {resolvedData.isValid && (
        <div className="text-sm text-green-600">
          {resolvedData.resolvedAddress &&
            `Address: ${resolvedData.resolvedAddress}`}
          {resolvedData.resolvedName &&
            resolvedData.resolvedName !== input &&
            ` (${resolvedData.resolvedName})`}
        </div>
      )}
    </div>
  );
}
