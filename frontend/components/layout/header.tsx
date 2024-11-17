import React from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import SearchInput from '../search-input';
import { UserNav } from './user-nav';
import ThemeToggle from './ThemeToggle/theme-toggle';

export default function Header() {
  return (
    <header className="flex flex-col shrink-0 items-center justify-between gap-1 px-2 transition-[width,height] ease-linear sm:h-16 sm:gap-2 sm:px-4 md:flex-row">
      <div className="flex items-center gap-1 sm:gap-2">
        <h1 className="mt-12 truncate text-2xl font-bold tracking-tight sm:text-4xl">
          bag bazaar 💰✨
        </h1>
        {/* <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        */}
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <div className="hidden md:flex">{/* <SearchInput /> */}</div>
        <UserNav />
        <ThemeToggle />
      </div>
    </header>
  );
}
