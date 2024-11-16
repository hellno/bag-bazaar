'use client';

import { useState, useEffect } from 'react';
import { LoadBags } from '@/components/load-bags';
import { Button } from '@/components/ui/button';
import { TokenCreationForm } from '@/components/token-creation-form';
import { BlockscoutLink } from '@/components/ui/blockscout-link';
import { AddressInput } from '@/components/address-input';
import {
  PlusCircle,
  UserPlus,
  Send,
  CirclePlus,
  Loader2,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { useAddress, useName } from '@coinbase/onchainkit/identity';
import { baseSepolia } from 'viem/chains';
import { createPublicClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { createPimlicoClient } from 'permissionless/clients/pimlico';
import { entryPoint07Address } from 'viem/account-abstraction';
import { toSafeSmartAccount } from 'permissionless/accounts';
import { createSmartAccountClient } from 'permissionless';

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http('https://sepolia.base.org')
});

const paymasterClient = createPimlicoClient({
  transport: http(
    `https://api.pimlico.io/v2/base-sepolia/rpc?apikey=${process.env.NEXT_PUBLIC_PIMLICO_API_KEY}`
  ),
  entryPoint: {
    address: entryPoint07Address,
    version: '0.7'
  }
});

type Step =
  | 'usernames'
  | 'processing'
  | 'verification'
  | 'completion'
  | 'token-creation'
  | 'token-pending'
  | 'token-success';

interface SafeDeploymentStatus {
  isDeploying: boolean;
  safeAddress?: string;
  tokenAddress?: string;
  error?: string;
}

interface InviteEntry {
  input: string;
  resolvedAddress?: string;
  isValid: boolean;
}

export default function Component() {
  // const [currentStep, setCurrentStep] = useState<Step>('usernames');
  const [currentStep, setCurrentStep] = useState<Step>('completion');
  const [entries, setEntries] = useState<InviteEntry[]>([
    { input: '', isValid: false }
  ]);
  const [safeDeploymentStatus, setSafeDeploymentStatus] =
    useState<SafeDeploymentStatus>({
      isDeploying: false,
      safeAddress: '0x06B03d36d8f1A9DB0a94d2024EFC1b1FE2C59770'
    });

  const addEntry = () => {
    setEntries([...entries, { input: '', isValid: false }]);
  };

  const updateEntry = (
    index: number,
    input: string,
    isValid: boolean,
    resolvedAddress?: string
  ) => {
    const newEntries = [...entries];
    newEntries[index] = { input, resolvedAddress, isValid };
    setEntries(newEntries);
  };

  const removeEntry = (index: number) => {
    console.log('Removing entry at index:', index);
    console.log('Current entries:', entries);

    if (entries.length > 1) {
      const newEntries = entries.filter((_, i) => i !== index);
      console.log('New entries after removal:', newEntries);
      setEntries(newEntries);
    }
  };

  const deploySafe = async (validEntries: InviteEntry[]) => {
    console.log('Starting Safe deployment with entries:', validEntries);
    setSafeDeploymentStatus({ isDeploying: true });

    try {
      const ownerAddresses = validEntries
        .filter((entry) => entry.resolvedAddress)
        .map((entry) => entry.resolvedAddress as string) as `0x${string}`[];
      console.log('Filtered owner addresses:', ownerAddresses);

      // Create signer from private key
      console.log('Creating signer from private key...');
      const owner = privateKeyToAccount(
        process.env.NEXT_PUBLIC_SIGNER_PRIVATE_KEY as `0x${string}`
      );
      console.log('Signer created');

      // Create Safe Account
      console.log('Creating Safe account...');
      const safeAccount = await toSafeSmartAccount({
        client: publicClient,
        entryPoint: {
          address: entryPoint07Address,
          version: '0.7'
        },
        owners: [owner],
        attesters: ownerAddresses,
        attestersThreshold: Math.ceil((ownerAddresses.length + 1) / 2), // Including the deployer
        saltNonce: BigInt(Date.now()), // Use timestamp as nonce for uniqueness
        version: '1.4.1'
      });
      console.log('Safe account created with config:', safeAccount);

      // Create Smart Account Client
      console.log('Creating smart account client...');
      const smartAccountClient = createSmartAccountClient({
        account: safeAccount,
        chain: baseSepolia,
        paymaster: paymasterClient,
        bundlerTransport: http(
          `https://api.pimlico.io/v2/base-sepolia/rpc?apikey=${process.env.NEXT_PUBLIC_PIMLICO_API_KEY}`
        ),
        userOperation: {
          estimateFeesPerGas: async () =>
            (await paymasterClient.getUserOperationGasPrice()).fast
        }
      });
      console.log('Smart account client created');

      // Deploy the Safe
      console.log('Deploying Safe...');
      const initTx = await smartAccountClient.sendTransaction({
        to: await safeAccount.getAddress(),
        data: '0x',
        value: 0n
      });
      console.log('Safe deployed with transaction:', initTx);

      const safeAddress = await safeAccount.getAddress();
      console.log('Safe deployed at address:', safeAddress);

      setSafeDeploymentStatus({
        isDeploying: false,
        safeAddress
      });

      return safeAddress;
    } catch (error) {
      // Type guard to ensure error is an Error object
      const err = error as Error;

      console.error('Error deploying Safe:', err);
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });

      setSafeDeploymentStatus({
        isDeploying: false,
        error: `Failed to deploy Safe: ${err.message}`
      });
      throw err;
    }
  };

  const handleInvite = async () => {
    const validEntries = entries.filter((entry) => entry.isValid);
    if (validEntries.length === 0) return;

    setCurrentStep('processing');

    try {
      const safeAddress = await deploySafe(validEntries);
      console.log('safeAddress', safeAddress);
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
                  key={`address-input-${index}-${entries.length}`}
                  value={entry.input}
                  onChange={(value, isValid, resolvedAddress) =>
                    updateEntry(index, value, isValid, resolvedAddress)
                  }
                  onRemove={
                    entries.length > 1 ? () => removeEntry(index) : undefined
                  }
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
              <CirclePlus className="h-8 w-8" />
              Create shared bag
            </Button>
          </>
        );

      case 'processing':
        return (
          <div className="space-y-6 text-center">
            <h2 className="text-4xl font-bold">Creating shared bag 💰</h2>
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
            <h2 className="text-4xl font-bold">Shared bag is ready 🎒</h2>
            <div className="space-y-4">
              <p className="text-xl text-gray-600"></p>
              {safeDeploymentStatus.safeAddress && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="font-mono text-sm">
                    Safe Address:{' '}
                    <BlockscoutLink
                      address={safeDeploymentStatus.safeAddress}
                    />
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
            <h2 className="text-4xl font-bold">Shared bag is ready 🎒</h2>
            <div className="rounded-lg bg-gray-50 p-6">
              <p className="mb-4 text-xl text-gray-600">
                Prepare your shared bag
              </p>
              <div className="mb-6 font-mono text-sm">
                Safe Address:{' '}
                <BlockscoutLink
                  address={safeDeploymentStatus.safeAddress ?? ''}
                />
              </div>

              {safeDeploymentStatus.safeAddress && (
                <LoadBags
                  safeAddress={safeDeploymentStatus.safeAddress}
                  onSuccess={() => setCurrentStep('token-creation')}
                />
              )}
            </div>
          </div>
        );

      case 'token-creation':
        return (
          <div className="space-y-6">
            <h2 className="text-center text-4xl font-bold">Create Your Token 🪙</h2>
            <div className="rounded-lg bg-gray-50 p-8">
              <p className="mb-8 text-center text-xl text-gray-600">
                Choose a name and symbol for your shared token
              </p>
              <TokenCreationForm
                onSubmit={(name, ticker) => {
                  console.log('Creating token:', { name, ticker });
                  setCurrentStep('token-pending');
                }}
              />
            </div>
          </div>
        );

      case 'token-pending':
        return (
          <div className="space-y-6 text-center">
            <h2 className="text-4xl font-bold">Creating Tokens...</h2>
            <div className="flex justify-center">
              <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
            </div>
            <p className="text-xl text-gray-600">
              Please wait while we create your tokens
            </p>
            {/* Add the placeholder button */}
            <Button
              onClick={() => setCurrentStep('token-success')}
              variant="outline"
              className="mt-4"
            >
              Skip waiting (dev only)
            </Button>
          </div>
        );

      case 'token-success':
        return (
          <div className="space-y-6 text-center">
            <h2 className="text-4xl font-bold">Success! 🎉</h2>
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
            <div className="rounded-lg bg-gray-50 p-6">
              <p className="mb-4 text-xl text-gray-600">
                Your tokens have been created successfully
              </p>
              <div className="mb-4 font-mono text-sm">
                Token Address:{' '}
                {safeDeploymentStatus.tokenAddress && (
                  <BlockscoutLink address={safeDeploymentStatus.tokenAddress} />
                )}
              </div>
              <Button
                onClick={() => (window.location.href = '/dashboard')}
                className="flex w-full items-center justify-center gap-2 p-6 text-xl"
              >
                Go to Dashboard <ArrowRight className="h-6 w-6" />
              </Button>
            </div>
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
