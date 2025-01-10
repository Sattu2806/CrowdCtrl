'use client'
import { useSideBarStore } from '@/hooks/ui/sidebarstore';
import { Menu } from 'lucide-react';
import React from 'react';
import { useAuth } from './context/AuthProvider';
import Image from 'next/image';

type Props = {};

const NavBar: React.FC<Props> = () => {
    const {open} = useSideBarStore()
    const {user} = useAuth()
  return (
    <nav className="py-3 px-6 flex items-center justify-between border-b">
      {/* Left Logo */}
      <div className="flex items-center space-x-2">
        {/* <img
          src="/x.png"
          alt="Logo"
          className="h-8 w-8 mr-2"
        /> */}
        <Menu className='cursor-pointer' onClick={open} />
        <p className='text-2xl font-bold font-mono'>CrowdC</p>
        {/* <span className="text-xl font-semibold">MyApp</span> */}
      </div>

      {/* Center Search Bar */}
      {/* <div className="flex-1 mx-6 flex items-center justify-center">
        <input
          type="text"
          placeholder="Search..."
          className="w-full max-w-md px-4 py-2 rounded-full focus:outline-none focus:ring-0 focus:ring-none  dark:bg-neutral-600 bg-neutral-100"
        />
      </div> */}
      {/* Right User Section */}
      <div className="flex items-center space-x-4">
        <Image
          src={user?.image ? user.image : '/x.png'}
          width={100}
          height={100}
          alt="User"
          className="h-8 w-8 rounded-full border-2 border-white"
        />
      </div>
    </nav>
  );
};

export default NavBar;
