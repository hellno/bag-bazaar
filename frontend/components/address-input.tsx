'use client';

import { useCallback, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, X } from 'lucide-react';
import { useAddress, useName } from '@coinbase/onchainkit/identity';
import { Button } from './ui/button';
import debounce from 'lodash/debounce';

interface AddressInputProps {
  value: string;
  onChange: (value: string, isValid: boolean, resolvedAddress?: string) => void;
  onRemove?: () => void;
  label?: string;
  showRemoveButton?: boolean;
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    address: input as `0x${string}`
  });
  const { data: resolvedAddress, isLoading: isLoadingAddress } = useAddress({
    name: input
  });

  const isLoading = isLoadingName || isLoadingAddress;

  // Separate validation logic
  const validateEntry = useCallback((input: string) => {
    if (!input.trim()) {
      return { isValid: false };
    }

    const isEthAddress = /^0x[a-fA-F0-9]{40}$/.test(input);
    const isEns = input.toLowerCase().endsWith('.eth');
    const isEmail = EMAIL_REGEX.test(input);

    if (isEthAddress) {
      return {
        resolvedAddress: input,
        isValid: true
      };
    } else if (isEns && resolvedAddress) {
      return {
        resolvedAddress,
        resolvedName: input,
        isValid: true
      };
    } else if (isEmail) {
      return {
        resolvedName: input,
        isValid: true
      };
    }

    return { isValid: false };
  }, [resolvedAddress]);

  // Debounce the onChange callback
  const debouncedOnChange = useCallback(
    debounce((value: string, isValid: boolean, resolvedAddress?: string) => {
      onChange(value, isValid, resolvedAddress);
    }, 500),
    [onChange]
  );

  useEffect(() => {
    const newResolvedData = validateEntry(input);
    setResolvedData(newResolvedData);
    debouncedOnChange(input, newResolvedData.isValid, newResolvedData.resolvedAddress);

    return () => {
      debouncedOnChange.cancel();
    };
  }, [input, validateEntry, debouncedOnChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <div className="flex items-center gap-4">
        <Input
          type="text"
          placeholder="name.eth or email@example.com"
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
