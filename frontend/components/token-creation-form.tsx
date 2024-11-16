'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface TokenCreationFormProps {
  onSubmit: (tokenName: string, tokenTicker: string) => void;
  isLoading?: boolean;
}

export function TokenCreationForm({ onSubmit, isLoading }: TokenCreationFormProps) {
  const [tokenName, setTokenName] = useState('');
  const [tokenTicker, setTokenTicker] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(tokenName, tokenTicker);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-4">
        <label className="block text-xl font-medium text-gray-700">
          Token Name
          <Input
            type="text"
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            placeholder="e.g. My Awesome Token"
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
            placeholder="e.g. TOKEN"
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
    </form>
  );
}
