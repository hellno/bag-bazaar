'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, UserPlus, Send, X, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAddress, useName } from '@coinbase/onchainkit/identity';

type Step = 'usernames' | 'processing' | 'verification' | 'completion';

interface InviteEntry {
  input: string;
  resolvedAddress?: string;
  resolvedName?: string;
  isValid: boolean;
  isLoading: boolean;
}

export default function Component() {
  const [currentStep, setCurrentStep] = useState<Step>('usernames');
  const [entries, setEntries] = useState<InviteEntry[]>([
    { input: '', isValid: false, isLoading: false }
  ]);

  const validateAndResolveEntry = async (input: string, index: number) => {
    const newEntries = [...entries];
    const entry = newEntries[index];
    entry.input = input;
    entry.isLoading = true;
    
    // Reset previous resolutions
    entry.resolvedAddress = undefined;
    entry.resolvedName = undefined;
    
    // Check if it's an ETH address
    const isEthAddress = /^0x[a-fA-F0-9]{40}$/.test(input);
    // Check if it's an ENS name
    const isEns = input.toLowerCase().endsWith('.eth');
    
    try {
      if (isEthAddress) {
        const { data: name, isLoading } = await useName({ address: input });
        entry.resolvedName = name;
        entry.resolvedAddress = input;
        entry.isValid = true;
      } else if (isEns) {
        const { data: address, isLoading } = useAddress({ name: input });
        if (address) {
          entry.resolvedAddress = address;
          entry.resolvedName = input;
          entry.isValid = true;
        }
      }
    } catch (error) {
      console.error('Error resolving address/name:', error);
      entry.isValid = false;
    }
    
    entry.isLoading = false;
    setEntries(newEntries);
  };

  const addEntry = () => {
    setEntries([...entries, { input: '', isValid: false, isLoading: false }]);
  };

  const updateEntry = (index: number, value: string) => {
    validateAndResolveEntry(value, index);
  };

  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index));
    }
  };

  const handleInvite = async () => {
    const validEntries = entries.filter(entry => entry.isValid);
    if (validEntries.length === 0) return;
    
    setCurrentStep('processing');
    
    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setCurrentStep('verification');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'usernames':
        return (
          <>
            <h1 className="flex items-center justify-center gap-4 text-center text-5xl font-bold text-gray-800">
              <UserPlus className="h-16 w-16" />
              Invite Friends
            </h1>
            <p className="text-center text-gray-600 mb-6">
              Enter ETH addresses or ENS names
            </p>
            <div className="space-y-6">
              {entries.map((entry, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center gap-4">
                    <Input
                      type="text"
                      placeholder="0x... or name.eth"
                      value={entry.input}
                      onChange={(e) => updateEntry(index, e.target.value)}
                      className={`w-full rounded-lg p-6 text-3xl ${
                        entry.isValid ? 'border-green-500' : ''
                      }`}
                    />
                    {entries.length > 1 && (
                      <Button
                        onClick={() => removeEntry(index)}
                        variant="ghost"
                        className="p-6"
                      >
                        <X className="h-8 w-8 text-red-500" />
                      </Button>
                    )}
                  </div>
                  {entry.isLoading && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Resolving...
                    </div>
                  )}
                  {entry.isValid && (
                    <div className="text-sm text-green-600">
                      {entry.resolvedAddress && `Address: ${entry.resolvedAddress}`}
                      {entry.resolvedName && ` (${entry.resolvedName})`}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Button
              onClick={addEntry}
              variant="outline"
              className="flex w-full items-center justify-center gap-4 rounded-lg border-2 border-dashed p-6 text-2xl"
            >
              <PlusCircle className="h-8 w-8" />
              Add Another Friend
            </Button>
            <Button
              onClick={handleInvite}
              disabled={!entries.some(entry => entry.isValid)}
              className="flex w-full items-center justify-center gap-4 rounded-lg bg-blue-600 p-8 text-3xl font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-8 w-8" />
              Send Invites
            </Button>
          </>
        );

      case 'processing':
        return (
          <div className="text-center space-y-6">
            <h2 className="text-4xl font-bold">Processing Invites</h2>
            <div className="flex justify-center">
              <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
            </div>
            <p className="text-xl text-gray-600">Please wait while we process your invitations...</p>
          </div>
        );

      case 'verification':
        return (
          <div className="text-center space-y-6">
            <h2 className="text-4xl font-bold">Verify Details</h2>
            <div className="space-y-4">
              <p className="text-xl text-gray-600">Please verify the following details:</p>
              {/* Add verification details here */}
              <Button
                onClick={() => setCurrentStep('completion')}
                className="flex items-center justify-center gap-2 text-xl p-6"
              >
                Continue <ArrowRight className="h-6 w-6" />
              </Button>
            </div>
          </div>
        );

      case 'completion':
        return (
          <div className="text-center space-y-6">
            <h2 className="text-4xl font-bold">All Set!</h2>
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <p className="text-xl text-gray-600">Your invitations have been sent successfully!</p>
            <Button
              onClick={() => setCurrentStep('usernames')}
              className="text-xl p-6"
            >
              Invite More Friends
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-3xl space-y-8">
        {renderStep()}
      </div>
    </div>
  );
}
