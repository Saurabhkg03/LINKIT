"use client"

import * as React from "react"
import { Sidebar } from "@/components/sidebar"
import { Menu } from "lucide-react"

export function AppLayoutShell({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    return (
        <div className="flex h-screen bg-(--background) overflow-hidden">
            {/* Desktop Sidebar */}
            <div className="hidden md:block shrink-0">
                <Sidebar />
            </div>

            {/* Mobile Sidebar (Drawer) */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
                    <Sidebar className="relative z-50 h-full w-72 animate-in slide-in-from-left duration-300" />
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full min-w-0 bg-(--background) relative">

                {/* Mobile Header */}
                <div className="md:hidden flex items-center px-4 py-3 border-b border-(--border) bg-(--background)/80 backdrop-blur-md sticky top-0 z-20">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 rounded-md hover:bg-black/5">
                        <Menu size={24} />
                    </button>
                    <span className="font-semibold ml-2">All Links</span>
                </div>

                {/* Content Scrollable */}
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    )
}
