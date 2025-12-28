/* eslint-disable @next/next/no-img-element */
"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import {
    Plus, Search, Trash2, ExternalLink, X,
    Loader2, Bell, RefreshCw, Star, Archive as ArchiveIcon
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { LoginOverlay } from '@/components/login-overlay';
import { db } from "@/lib/firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp, updateDoc } from "firebase/firestore";

// --- HELPERS ---

const getAutoTags = (url: string) => {
    const tags = [];
    const lowerUrl = url.toLowerCase();

    if (lowerUrl.includes('youtube') || lowerUrl.includes('vimeo')) tags.push('Video');
    if (lowerUrl.includes('github') || lowerUrl.includes('stackoverflow')) tags.push('Code');
    if (lowerUrl.includes('amazon') || lowerUrl.includes('ebay')) tags.push('Shopping');
    if (lowerUrl.includes('medium') || lowerUrl.includes('dev.to')) tags.push('Article');
    if (lowerUrl.includes('spotify') || lowerUrl.includes('music')) tags.push('Music');
    return tags.length > 0 ? tags : ['Web'];
};

const getGradient = (domain: string) => {
    if (domain.includes('youtube')) return "from-red-500/20 via-red-900/20 to-transparent";
    if (domain.includes('spotify')) return "from-green-500/20 via-green-900/20 to-transparent";
    if (domain.includes('github')) return "from-slate-500/20 via-slate-900/20 to-transparent";
    return "from-blue-500/20 via-blue-900/20 to-transparent";
};

const fetchMetadata = async (url: string) => {
    try {
        const response = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
        const json = await response.json();
        if (json.status === 'success') {
            const { title, description, image, logo, publisher } = json.data;
            const domain = publisher || new URL(url).hostname.replace('www.', '');
            return {
                title: title || domain,
                description: description,
                image: image?.url || null,
                icon: logo?.url || null,
                domain: domain,
                gradient: getGradient(domain.toLowerCase()),
                tags: getAutoTags(url)
            };
        }
        throw new Error('Failed');
    } catch (error) {
        let domain = "unknown";
        try { domain = new URL(url).hostname; } catch (e) { }
        return {
            title: domain,
            image: null,
            icon: null,
            domain: domain,
            gradient: getGradient(domain),
            tags: getAutoTags(url)
        };
    }
};

interface LinkItem {
    id: string;
    type: "link" | "stack" | "vault";
    title: string;
    url?: string;
    domain?: string;
    image?: string | null;
    icon?: string | null;
    tags?: string[];
    gradient?: string;
    description?: string;
    count?: number;

    // Status flags
    isFavorite?: boolean;
    isArchived?: boolean;
    isTrash?: boolean;

    createdAt?: any;
}

export default function OriginLinkSaver() {
    const { user, loading: authLoading } = useAuth();
    const searchParams = useSearchParams();
    const filterParam = searchParams.get('filter') || 'all';
    const tagParam = searchParams.get('tag');

    const [links, setLinks] = useState<LinkItem[]>([]);
    const [activeItem, setActiveItem] = useState<LinkItem | null>(null);

    const [searchQuery, setSearchQuery] = useState("");

    const [isAdding, setIsAdding] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [previewData, setPreviewData] = useState<{ title?: string; description?: string; image?: string | null } | null>(null);

    // Firestore
    useEffect(() => {
        if (!user) {
            setLinks([]);
            return;
        }
        const q = query(collection(db, `users/${user.uid}/links`), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedLinks: LinkItem[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as LinkItem));
            setLinks(fetchedLinks);
        });
        return () => unsubscribe();
    }, [user]);

    // Handlers
    const handleUrlInput = async (url: string) => {
        setInputValue(url);
        if (!url.startsWith('http')) return;
        setIsLoading(true);
        try {
            const data = await fetchMetadata(url);
            setPreviewData(data);
        } finally { setIsLoading(false); }
    };

    const handleSave = async () => {
        if (!previewData || !user) return;
        try {
            await addDoc(collection(db, `users/${user.uid}/links`), {
                type: "link",
                url: inputValue,
                ...previewData,
                isFavorite: false,
                isArchived: false,
                isTrash: false,
                createdAt: serverTimestamp()
            });
            setIsAdding(false);
            setInputValue("");
            setPreviewData(null);
        } catch (error) {
            console.error("Error saving link:", error);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string, permanent = false) => {
        e.stopPropagation();
        if (!user) return;
        if (permanent) {
            if (confirm("Permanently delete this link?")) {
                await deleteDoc(doc(db, `users/${user.uid}/links`, id));
                setActiveItem(null);
            }
        } else {
            // Move to trash
            await updateDoc(doc(db, `users/${user.uid}/links`, id), { isTrash: true });
            setActiveItem(null);
        }
    };

    const handleRestore = async (id: string) => {
        if (!user) return;
        await updateDoc(doc(db, `users/${user.uid}/links`, id), { isTrash: false });
        setActiveItem(null);
    }

    const toggleFavorite = async (e: React.MouseEvent, id: string, current: boolean) => {
        e.stopPropagation();
        if (!user) return;
        await updateDoc(doc(db, `users/${user.uid}/links`, id), { isFavorite: !current });
    }

    const handleArchive = async (e: React.MouseEvent, id: string, current: boolean) => {
        e.stopPropagation();
        if (!user) return;
        await updateDoc(doc(db, `users/${user.uid}/links`, id), { isArchived: !current });
    }

    // Filter Logic
    const filteredLinks = links.filter(item => {
        // 1. Text Search
        if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

        // 2. Trash Filter
        if (filterParam === 'trash') {
            return item.isTrash === true;
        }
        if (item.isTrash) return false; // Don't show trash items in other views

        // 3. Tag Filter
        if (tagParam) {
            return item.tags?.some(t => t.toLowerCase() === tagParam.toLowerCase());
        }

        // 4. Category Filters
        if (filterParam === 'favorites') return item.isFavorite === true;
        if (filterParam === 'archive') return item.isArchived === true;
        if (filterParam === 'all' && item.isArchived) return false; // Archive hides from "All" usually

        return true;
    });

    if (!user && !authLoading) return <LoginOverlay />;

    const getPageTitle = () => {
        if (tagParam) return `#${tagParam}`;
        switch (filterParam) {
            case 'favorites': return 'Favorites';
            case 'archive': return 'Archive';
            case 'trash': return 'Trash';
            default: return 'All Links';
        }
    };

    return (
        <div className="p-4 md:p-8 w-full max-w-7xl mx-auto min-h-screen">

            {/* Search Header for Content Area */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight capitalize">{getPageTitle()}</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{filteredLinks.length} items</p>
                </div>

                <div className="relative group w-full md:w-72">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-slate-400" />
                    </div>
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 transition-all outline-none text-sm text-slate-900 dark:text-white"
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode='popLayout'>

                    {/* Add New Card (Only on 'all' view) */}
                    {filterParam === 'all' && !tagParam && !searchQuery && (
                        <motion.div
                            layout
                            onClick={() => setIsAdding(true)}
                            className="h-[320px] rounded-[24px] border-2 border-dashed border-slate-200 dark:border-zinc-700 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer flex flex-col items-center justify-center gap-3 transition-colors group"
                        >
                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 group-hover:scale-110 transition-transform flex items-center justify-center">
                                <Plus size={24} className="text-slate-400" />
                            </div>
                            <span className="font-semibold text-slate-500">Add New Link</span>
                        </motion.div>
                    )}

                    {/* Links */}
                    {filteredLinks.map((item) => (
                        <motion.div
                            key={item.id}
                            layoutId={item.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setActiveItem(item)}
                            className="group relative h-[340px] rounded-[24px] overflow-hidden cursor-pointer bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 dark:border-zinc-800 flex flex-col"
                        >
                            {/* Image Area */}
                            <div className="h-[50%] w-full relative overflow-hidden bg-slate-100 dark:bg-zinc-800">
                                {item.image ? (
                                    <img src={item.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={item.title} />
                                ) : (
                                    <div className={cn("w-full h-full bg-linear-to-br", item.gradient || "from-slate-200 to-slate-300")} />
                                )}

                                {/* Favorite Indicator (Top Left) */}
                                {item.isFavorite && (
                                    <div className="absolute top-3 left-3 p-1.5 rounded-full bg-yellow-400 text-white shadow-sm">
                                        <Star size={12} fill="currentColor" />
                                    </div>
                                )}

                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-white/80 dark:bg-black/60 backdrop-blur p-1.5 rounded-full text-black dark:text-white"><ExternalLink size={12} /></div>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="p-4 flex flex-col flex-1 justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        {item.tags?.[0] && (
                                            <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">
                                                {item.tags[0]}
                                            </span>
                                        )}
                                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest truncate">{item.domain}</span>
                                    </div>
                                    <h3 className="font-bold text-slate-900 dark:text-slate-100 leading-tight line-clamp-2 mb-1">
                                        {item.title}
                                    </h3>
                                    <p className="text-xs text-slate-500 line-clamp-1 opacity-70">
                                        {item.description}
                                    </p>
                                </div>

                                {/* Action Bar */}
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/50">
                                    {/* Favorite */}
                                    <button
                                        onClick={(e) => toggleFavorite(e, item.id, !!item.isFavorite)}
                                        className={cn("p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors", item.isFavorite ? "text-yellow-500" : "text-slate-400 dark:text-slate-500")}
                                        title="Favorite"
                                    >
                                        <Star size={16} fill={item.isFavorite ? "currentColor" : "none"} />
                                    </button>

                                    {/* Archive */}
                                    <button
                                        onClick={(e) => handleArchive(e, item.id, !!item.isArchived)}
                                        className={cn("p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors", item.isArchived ? "text-blue-500" : "text-slate-400 dark:text-slate-500")}
                                        title="Archive"
                                    >
                                        <ArchiveIcon size={16} />
                                    </button>

                                    {/* Reminder (Future) */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); alert("Reminders coming soon!") }}
                                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 dark:text-slate-500 hover:text-blue-500 transition-colors"
                                        title="Reminder"
                                    >
                                        <Bell size={16} />
                                    </button>

                                    {/* Delete */}
                                    <button
                                        onClick={(e) => handleDelete(e, item.id, false)}
                                        className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors"
                                        title="Move to Trash"
                                    >
                                        <Trash2 size={16} />
                                    </button>

                                    {/* Open */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); item.url && window.open(item.url, '_blank'); }}
                                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 dark:text-slate-500 hover:text-blue-500 transition-colors"
                                        title="Open Link"
                                    >
                                        <ExternalLink size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* --- ADD SHEET (Modal) --- */}
            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAdding(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-6 overflow-hidden border border-slate-100 dark:border-zinc-800"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold dark:text-white">New Link</h2>
                                <button onClick={() => setIsAdding(false)} className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"><X size={20} className="dark:text-white" /></button>
                            </div>

                            <div className="relative mb-4">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Search size={18} /></div>
                                <input
                                    value={inputValue}
                                    onChange={(e) => handleUrlInput(e.target.value)}
                                    placeholder="Paste URL..."
                                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 ring-blue-500/50 transition-all font-medium dark:text-white"
                                    autoFocus
                                />
                            </div>

                            <AnimatePresence>
                                {previewData && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
                                        <div className="flex gap-4 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700">
                                            <div className="w-16 h-16 rounded-lg bg-slate-200 dark:bg-zinc-700 shrink-0 overflow-hidden">
                                                {previewData.image && <img src={previewData.image} className="w-full h-full object-cover" alt={previewData.title || "Preview"} />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm line-clamp-1 dark:text-white">{previewData.title}</h4>
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{previewData.description}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                onClick={handleSave}
                                disabled={!previewData}
                                className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/20"
                            >
                                {isLoading ? <Loader2 className="animate-spin mx-auto" /> : "Save to Library"}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- DETAIL MODAL --- */}
            <AnimatePresence>
                {activeItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveItem(null)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                        <motion.div
                            layoutId={activeItem.id}
                            className="relative w-full max-w-2xl bg-white dark:bg-[#1c1c1e] rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] border border-white/10"
                        >
                            {/* Header Image */}
                            <div className="relative h-64 shrink-0 bg-slate-100 dark:bg-black">
                                {activeItem.image ? (
                                    <img src={activeItem.image} className="w-full h-full object-cover" alt={activeItem.title} />
                                ) : (
                                    <div className={cn("w-full h-full bg-linear-to-br", activeItem.gradient)} />
                                )}
                                <button onClick={() => setActiveItem(null)} className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 transition-colors"><X size={20} /></button>
                            </div>

                            {/* Content */}
                            <div className="p-6 md:p-8 overflow-y-auto bg-white dark:bg-[#1c1c1e] text-slate-900 dark:text-slate-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="bg-slate-100 dark:bg-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">{activeItem.domain}</span>
                                    {activeItem.tags?.map(t => <span key={t} className="text-xs text-blue-500 font-bold">#{t}</span>)}
                                </div>

                                <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-4">{activeItem.title}</h2>

                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 text-lg">
                                    {activeItem.description || "No description provided."}
                                </p>

                                <div className="flex gap-3">
                                    <button onClick={() => activeItem.url && window.open(activeItem.url, '_blank')} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors flex items-center justify-center gap-2">
                                        <ExternalLink size={18} /> Open Link
                                    </button>

                                    {activeItem.isTrash ? (
                                        <button onClick={() => handleRestore(activeItem.id)} className="px-5 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 font-bold hover:bg-green-100 transition-colors flex items-center gap-2">
                                            <RefreshCw size={20} /> Restore
                                        </button>
                                    ) : (
                                        <button onClick={(e) => handleDelete(e, activeItem.id, false)} className="px-5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-200 font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors" title="Move to Trash">
                                            <Trash2 size={20} />
                                        </button>
                                    )}

                                    {activeItem.isTrash && (
                                        <button onClick={(e) => handleDelete(e, activeItem.id, true)} className="px-5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 font-bold hover:bg-red-100 transition-colors" title="Delete Forever">
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}
