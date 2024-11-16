'use client';
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, UserPlus, Send, X } from 'lucide-react';

export default function Component() {
  const [usernames, setUsernames] = useState(['', '', '']);

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

  const handleInvite = () => {
    const validUsernames = usernames.filter(
      (username) => username.trim() !== ''
    );
    console.log('Inviting:', validUsernames);
    // Here you would typically send the invitations
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-3xl space-y-8">
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
      </div>
    </div>
  );
}
