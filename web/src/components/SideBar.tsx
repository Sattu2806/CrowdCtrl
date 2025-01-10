'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { useSideBarStore } from '@/hooks/ui/sidebarstore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from 'next-themes'
import { ChartNoAxesColumnIncreasing, Home, MessagesSquare, Moon, Sun } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const SideBar = () => {
    const { isOpen, close } = useSideBarStore()
    const { setTheme } = useTheme()
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const pathname = usePathname() // Get the current pathname
    const router = useRouter()

    const toggleMenu = () => {
      setIsMenuVisible((prev) => !prev);
      router.push('/analytics')
    };

    // Function to check if the current route matches the link
    const isActiveLink = (path: string) => pathname === path ? 'opacity-100 bg-neutral-700' : 'opacity-60'

    return (
        <div>
            <Sheet open={isOpen} onOpenChange={close}>
                <SheetContent side="left" className="flex flex-col h-full w-[300px] sm:w-[300px]">
                    <SheetHeader className='p-2 space-y-4'>
                        <p className='my-3'></p>
                        <Link href='/' className={`flex items-center space-x-3 p-2 rounded-full hover:bg-neutral-700 px-4 cursor-pointer ${isActiveLink('/')}`}>
                            <span><Home className='' strokeWidth={1.5} size={20}/></span>
                            <p className='font-medium text-sm'>Dashboard</p>
                        </Link>
                        <Link href='/comments' className={`flex items-center space-x-3 p-2 rounded-full hover:bg-neutral-700 px-4 ${isActiveLink('/comments')}`}>
                            <span><MessagesSquare className='' strokeWidth={1.5} size={20}/></span>
                            <p className='font-medium text-sm'>Comments</p>
                        </Link>
                        {/* <Link href='/analytics' className={`flex items-center space-x-3 p-2 rounded-full hover:bg-neutral-700 px-4 ${isActiveLink('/analytics')}`}>
                            <span><ChartNoAxesColumnIncreasing className='' strokeWidth={1.5} size={20}/></span>
                            <p className='font-medium text-sm'>Analytics</p>
                        </Link> */}
                        <div>
                            <div
                                className={`flex items-center space-x-3 p-2 rounded-full hover:bg-neutral-700 px-4 ${isActiveLink('/analytics')}`}
                                onClick={toggleMenu}
                            >
                                <span>
                                <ChartNoAxesColumnIncreasing strokeWidth={1.5} size={20} />
                                </span>
                                <p className='font-medium text-sm'>Analytics</p>
                            </div>

                            <div 
                                className={`overflow-hidden transition-all duration-500 ease-in mt-4 px-4 space-y-2 ${isMenuVisible ? 'max-h-[500px]' : 'max-h-0'}`}
                            >
                                <Link href="/youtube" className={`flex items-center space-x-3 p-2 rounded-full hover:bg-neutral-700 px-4 ${isActiveLink('/youtube')}`}>
                                    <img src="/youtube.png" alt="YouTube Logo" className="w-6 h-6" />
                                    <p className="font-medium text-sm">YouTube</p>
                                </Link>

                                <Link href="/linkedin" className={`flex items-center space-x-3 p-2 rounded-full hover:bg-neutral-700 px-4 ${isActiveLink('/linkedin')} `}>
                                    <img src="/linkedin.png" alt="Instagram Logo" className="w-6 h-6" />
                                    <p className="font-medium text-sm">Linkedin</p>
                                </Link>

                                <Link href="/tiktok" className={`flex items-center space-x-3 p-2 rounded-full hover:bg-neutral-700 px-4 ${isActiveLink('/tiktok')} `}>
                                    <img src="/tiktok.png" alt="TikTok Logo" className="w-6 h-6" />
                                    <p className="font-medium text-sm">TikTok</p>
                                </Link>

                                <Link href="/x" className={`flex items-center space-x-3 p-2 rounded-full hover:bg-neutral-700 px-4 ${isActiveLink('/x')} `}>
                                    <img src="/x.png" alt="X (Twitter) Logo" className="w-6 h-6" />
                                    <p className="font-medium text-sm">X</p>
                                </Link>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-auto p-4">
                        {/* Add any content above the tabs here */}
                    </div>

                    <div className="sticky bottom-0 w-full">
                        <Tabs defaultValue="account" className="w-full">
                            <TabsList className="flex justify-center">
                                <TabsTrigger
                                    onClick={() => setTheme("light")}
                                    value="account"
                                    className="flex-1 text-center"
                                >
                                    <Sun />
                                    <span className="ml-2">Light</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    onClick={() => setTheme("dark")}
                                    value="password"
                                    className="flex-1 text-center"
                                >
                                    <Moon />
                                    <span className="ml-2">Dark</span>
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}

export default SideBar
