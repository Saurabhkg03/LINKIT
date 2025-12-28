/* eslint-disable @next/next/no-img-element */
"use client"

import * as React from "react"
import { useAuth } from "@/components/auth-provider"
import { useTheme } from "next-themes"
import { useRouter, useSearchParams } from "next/navigation"
import {
    Star, Trash2, Archive, LogOut,
    Moon, Sun, User,
    LayoutGrid, FileText, Bell, Tag
} from "lucide-react"

import { cn } from "@/lib/utils"

interface SidebarProps {
    className?: string
}

export function Sidebar({ className }: SidebarProps) {
    const { user, logout, signInWithGoogle } = useAuth();
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentFilter = searchParams.get('filter') || 'all';
    const currentTag = searchParams.get('tag');

    const handleNavigation = (filter: string, tag?: string) => {
        const params = new URLSearchParams();
        if (filter && filter !== 'all') params.set('filter', filter);
        if (tag) params.set('tag', tag);
        router.push(`/?${params.toString()}`);
    };

    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className={cn("pb-12 min-h-screen w-64 flex flex-col glass-sidebar", className)}>

            {/* --- PROFILE HEADER --- */}
            <div className="px-4 py-6 border-b border-(--border)">
                {user ? (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-black/5">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full object-cover" />
                            ) : (
                                <User className="m-2 text-slate-400" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{user.displayName || "User"}</p>
                            <p className="text-xs text-muted-foreground truncate opacity-60">{user.email}</p>
                        </div>
                        <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors">
                            <LogOut size={16} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={signInWithGoogle}
                        className="w-full py-2 bg-(--accent) text-(--accent-foreground) rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                    >
                        <User size={16} /> Sign In
                    </button>
                )}
            </div>

            {/* --- NAVIGATION --- */}
            <div className="space-y-4 p-4 flex-1 overflow-y-auto">

                {/* Main Group */}
                <div className="py-2">
                    <h2 className="mb-2 px-2 text-xs font-semibold tracking-tight opacity-50 uppercase">Library</h2>
                    <div className="space-y-1">
                        <NavItem
                            icon={<LayoutGrid size={18} />}
                            label="All Links"
                            active={currentFilter === 'all' && !currentTag}
                            onClick={() => handleNavigation('all')}
                        />
                        <NavItem
                            icon={<Star size={18} />}
                            label="Favorites"
                            active={currentFilter === 'favorites'}
                            onClick={() => handleNavigation('favorites')}
                        />
                        <NavItem
                            icon={<FileText size={18} />}
                            label="Notes"
                            active={currentFilter === 'notes'}
                            onClick={() => handleNavigation('notes')}
                        />
                        <NavItem
                            icon={<Bell size={18} />}
                            label="Reminders"
                            active={currentFilter === 'reminders'}
                            onClick={() => handleNavigation('reminders')}
                        />
                    </div>
                </div>

                {/* Labels Group */}
                <div className="py-2">
                    <div className="flex items-center justify-between px-2 mb-2">
                        <h2 className="text-xs font-semibold tracking-tight opacity-50 uppercase">Labels</h2>
                        {/* <button className="opacity-50 hover:opacity-100"><Plus size={14} /></button> */}
                    </div>
                    <div className="space-y-1">
                        {['Video', 'Code', 'Article', 'Shopping'].map(tag => (
                            <NavItem
                                key={tag}
                                icon={<Tag size={16} />}
                                label={tag}
                                active={currentTag === tag.toLowerCase()}
                                onClick={() => handleNavigation('all', tag.toLowerCase())}
                            />
                        ))}
                    </div>
                </div>

                {/* Bottom Group */}
                <div className="py-2">
                    <div className="space-y-1">
                        <NavItem
                            icon={<Archive size={18} />}
                            label="Archive"
                            active={currentFilter === 'archive'}
                            onClick={() => handleNavigation('archive')}
                        />
                        <NavItem
                            icon={<Trash2 size={18} />}
                            label="Trash"
                            active={currentFilter === 'trash'}
                            onClick={() => handleNavigation('trash')}
                        />
                    </div>
                </div>
            </div>

            {/* --- FOOTER (THEME) --- */}
            <div className="p-4 border-t border-(--border)">
                <div className="flex items-center justify-between p-2 rounded-lg bg-(--background)/50 border border-(--border)">
                    <span className="text-xs font-medium pl-1 opacity-70">Appearance</span>
                    {mounted && (
                        <div className="flex bg-(--background) rounded-md p-0.5 border border-(--border)">
                            <button
                                onClick={() => setTheme("light")}
                                className={cn("p-1.5 rounded-sm transition-all", theme === 'light' ? 'bg-white shadow-sm' : 'hover:bg-black/5')}
                            >
                                <Sun size={14} />
                            </button>
                            <button
                                onClick={() => setTheme("dark")}
                                className={cn("p-1.5 rounded-sm transition-all", theme === 'dark' ? 'bg-slate-700 text-white shadow-sm' : 'hover:bg-black/5')}
                            >
                                <Moon size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                    ? "bg-(--accent) text-(--accent-foreground) shadow-sm"
                    : "hover:bg-(--foreground)/5 text-(--foreground)/70 hover:text-(--foreground)"
            )}
        >
            {icon}
            {label}
        </button>
    )
}
