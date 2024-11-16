'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { signOut, useSession } from 'next-auth/react';
import {
  Avatar,
  Identity,
  Name,
  Badge,
  Address
} from '@coinbase/onchainkit/identity';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

export function UserNav() {
  const { address, isConnected } = useAccount();
  if (!isConnected) {
    return <ConnectButton />;
  }
  return (
    <Identity
      address={address}
      schemaId="0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9"
    >
      <Avatar />
      <Name>
        <Badge />
      </Name>
      <Address />
    </Identity>
  );
}
