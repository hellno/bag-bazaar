'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, UserPlus, Send, X, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';

type Step = 'usernames' | 'processing' | 'verification' | 'completion';

export default function Component() {
  const [currentStep, setCurrentStep] = useState<Step>('usernames');
  const [usernames, setUsernames] = useState(['', '', '']);
  const [isProcessing, setIsProcessing] = useState(false);

  const addUsernameField = () => {
    setUsernames([...usernames, '']);
  };

  const updateUsername = (index: number, value: string) => {
    const newUsernames = [...usernames];
    newUsernames[index] = value;
    setUsernames(newUsernames);
  };

  const removeUsernameField = (index: number) => {
    if (usernames.length > 1) {
      const newUsernames = usernames.filter((_, i) => i !== index);
      setUsernames(newUsernames);
    }
  };

  const handleInvite = async () => {
    const validUsernames = usernames.filter((username) => username.trim() !== '');
    setCurrentStep('processing');
    setIsProcessing(true);
    
    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsProcessing(false);
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
            <div className="space-y-6">
              {usernames.map((username, index) => (
                <div key={index} className="flex items-center gap-4">
                  <Input
                    type="text"
                    placeholder={`Username ${index + 1}`}
                    value={username}
                    onChange={(e) => updateUsername(index, e.target.value)}
                    className="w-full rounded-lg p-6 text-3xl"
                  />
                  {usernames.length > 1 && (
                    <Button
                      onClick={() => removeUsernameField(index)}
                      variant="ghost"
                      className="p-6"
                    >
                      <X className="h-8 w-8 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              onClick={addUsernameField}
              variant="outline"
              className="flex w-full items-center justify-center gap-4 rounded-lg border-2 border-dashed p-6 text-2xl"
            >
              <PlusCircle className="h-8 w-8" />
              Add Another Friend
            </Button>
            <Button
              onClick={handleInvite}
              className="flex w-full items-center justify-center gap-4 rounded-lg bg-blue-600 p-8 text-3xl font-bold text-white hover:bg-blue-700"
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
