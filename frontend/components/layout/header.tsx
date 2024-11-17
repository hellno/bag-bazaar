import React from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import SearchInput from '../search-input';
import { UserNav } from './user-nav';
import ThemeToggle from './ThemeToggle/theme-toggle';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Header() {
  return (
    <header className="flex h-13 sm:h-16 shrink-0 items-center justify-between gap-1 sm:gap-2 px-2 sm:px-4 transition-[width,height] ease-linear">
      <div className="flex items-center gap-1 sm:gap-2">
        <h2 className="text-lg sm:text-2xl font-bold tracking-tight truncate">
          welcome to the bag bazaar 💰✨
        </h2>
        {/* <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumbs /> */}
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <div className="hidden md:flex">{/* <SearchInput /> */}</div>
        <UserNav />
        <ThemeToggle />
      </div>
    </header>
  );
}
