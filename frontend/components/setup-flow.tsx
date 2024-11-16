'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AddressInput } from '@/components/address-input';
import {
  PlusCircle,
  UserPlus,
  Send,
  X,
  Loader2,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { useAddress, useName } from '@coinbase/onchainkit/identity';
import Safe, { SafeAccountConfig } from '@safe-global/protocol-kit';
import { baseSepolia } from 'viem/chains';

type Step = 'usernames' | 'processing' | 'verification' | 'completion';

interface SafeDeploymentStatus {
  isDeploying: boolean;
  safeAddress?: string;
  error?: string;
}

interface InviteEntry {
  input: string;
  resolvedAddress?: string;
}

export default function Component() {
  const [currentStep, setCurrentStep] = useState<Step>('usernames');
  const [entries, setEntries] = useState<InviteEntry[]>([
    { input: '' }
  ]);
  const [safeDeploymentStatus, setSafeDeploymentStatus] =
    useState<SafeDeploymentStatus>({
      isDeploying: false
    });

  const addEntry = () => {
    setEntries([...entries, { input: '' }]);
  };

  const updateEntry = (index: number, input: string, resolvedAddress?: string) => {
    const newEntries = [...entries];
    newEntries[index] = { input, resolvedAddress };
    setEntries(newEntries);
  };

  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index));
    }
  };

  const deploySafe = async (validEntries: InviteEntry[]) => {
    setSafeDeploymentStatus({ isDeploying: true });
    try {
      const ownerAddresses = validEntries
        .filter((entry) => entry.resolvedAddress)
        .map((entry) => entry.resolvedAddress as string);

      const safeAccountConfig: SafeAccountConfig = {
        owners: ownerAddresses,
        threshold: Math.ceil(ownerAddresses.length / 2)
      };

      const protocolKit = await Safe.init({
        provider: baseSepolia.rpcUrls.default.http[0],
        signer: window.ethereum,
        predictedSafe: {
          safeAccountConfig
        }
      });

      const deploymentTransaction =
        await protocolKit.createSafeDeploymentTransaction();

      const client = await protocolKit.getSafeProvider().getExternalSigner();
      const transactionHash = await client.sendTransaction({
        to: deploymentTransaction.to,
        value: BigInt(deploymentTransaction.value),
        data: deploymentTransaction.data as `0x${string}`,
        chain: sepolia
      });

      const transactionReceipt = await client.waitForTransactionReceipt({
        hash: transactionHash
      });

      const safeAddress = await protocolKit.getAddress();

      setSafeDeploymentStatus({
        isDeploying: false,
        safeAddress
      });

      return safeAddress;
    } catch (error) {
      console.error('Error deploying Safe:', error);
      setSafeDeploymentStatus({
        isDeploying: false,
        error: 'Failed to deploy Safe'
      });
      throw error;
    }
  };

  const handleInvite = async () => {
    const validEntries = entries.filter((entry) => entry.isValid);
    if (validEntries.length === 0) return;

    setCurrentStep('processing');

    try {
      const safeAddress = await deploySafe(validEntries);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCurrentStep('verification');
    } catch (error) {
      console.error('Failed to process invites:', error);
    }
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
            {/* <p className="mb-6 text-center text-gray-600">
              Enter ETH addresses or ENS names
            </p> */}
            <div className="space-y-6">
              {entries.map((entry, index) => (
                <AddressInput
                  key={index}
                  value={entry.input}
                  onChange={(value, resolvedAddress) => 
                    updateEntry(index, value, resolvedAddress)}
                  onRemove={entries.length > 1 ? () => removeEntry(index) : undefined}
                  showRemoveButton={entries.length > 1}
                />
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
              disabled={!entries.some((entry) => entry.isValid)}
              className="flex w-full items-center justify-center gap-4 rounded-lg bg-blue-600 p-8 text-3xl font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-8 w-8" />
              Send Invites
            </Button>
          </>
        );

      case 'processing':
        return (
          <div className="space-y-6 text-center">
            <h2 className="text-4xl font-bold">Processing Invites</h2>
            <div className="flex justify-center">
              <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
            </div>
            <p className="text-xl text-gray-600">
              {safeDeploymentStatus.isDeploying
                ? 'Deploying Safe smart account...'
                : 'Processing your invitations...'}
            </p>
            {safeDeploymentStatus.error && (
              <p className="text-red-500">{safeDeploymentStatus.error}</p>
            )}
          </div>
        );

      case 'verification':
        return (
          <div className="space-y-6 text-center">
            <h2 className="text-4xl font-bold">Verify Details</h2>
            <div className="space-y-4">
              <p className="text-xl text-gray-600">
                Safe account deployed successfully!
              </p>
              {safeDeploymentStatus.safeAddress && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="font-mono text-sm">
                    Safe Address: {safeDeploymentStatus.safeAddress}
                  </p>
                </div>
              )}
              <Button
                onClick={() => setCurrentStep('completion')}
                className="flex items-center justify-center gap-2 p-6 text-xl"
              >
                Continue <ArrowRight className="h-6 w-6" />
              </Button>
            </div>
          </div>
        );

      case 'completion':
        return (
          <div className="space-y-6 text-center">
            <h2 className="text-4xl font-bold">All Set!</h2>
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
            <p className="text-xl text-gray-600">
              Your invitations have been sent successfully!
            </p>
            <Button
              onClick={() => setCurrentStep('usernames')}
              className="p-6 text-xl"
            >
              Invite More Friends
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-3xl space-y-8">{renderStep()}</div>
    </div>
  );
}
