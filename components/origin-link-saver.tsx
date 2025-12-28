/* eslint-disable @next/next/no-img-element */
"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Plus, Search
} from 'lucide-react';

import { useAuth } from "@/components/auth-provider";
import { LoginOverlay } from '@/components/login-overlay';
import { db } from "@/lib/firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp, updateDoc } from "firebase/firestore";
import { LinkItem, PreviewData } from '@/types/link';

// Sub-components
import { LinkCard } from '@/components/link-saver/link-card';
import { DetailSheet } from '@/components/link-saver/detail-sheet';
import { AddLinkSheet } from '@/components/link-saver/add-link-sheet';
import { VaultOverlay } from '@/components/link-saver/vault-overlay';
import { FilterBar } from '@/components/link-saver/filter-bar';
import { cn } from '@/lib/utils';

// --- HELPERS (Can be moved to a Utils file) ---
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

const fetchMetadata = async (url: string): Promise<PreviewData> => {
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
        try { domain = new URL(url).hostname; } catch (e) { /* ignore */ }
        return {
            title: domain,
            image: null,
            icon: null,
            domain: domain,
            gradient: getGradient(domain),
            tags: getAutoTags(url)
        };
    }
}

export default function OriginLinkSaver() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const filterParam = searchParams.get('filter') || 'all';
    const tagParam = searchParams.get('tag');

    const [links, setLinks] = useState<LinkItem[]>([]);
    const [activeItem, setActiveItem] = useState<LinkItem | null>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    // Vault Logic
    const [isVaultOpen, setIsVaultOpen] = useState(false);
    const [checkingVault, setCheckingVault] = useState(false);

    // Firestore Subscription
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

    // Handle Vault Access
    useEffect(() => {
        if (tagParam === 'private' && !isVaultOpen) {
            setCheckingVault(true);
        }
    }, [tagParam, isVaultOpen]);

    // Actions
    const handleSave = async (url: string, previewData: PreviewData) => {
        if (!user) return;
        try {
            await addDoc(collection(db, `users/${user.uid}/links`), {
                type: "link",
                url: url,
                ...previewData,
                isFavorite: false,
                isArchived: false,
                isTrash: false,
                isPrivate: false,
                createdAt: serverTimestamp()
            });
            setIsAdding(false);
        } catch (error) {
            console.error("Error saving link:", error);
        }
    };

    const handleDelete = async (e: React.MouseEvent | null, id: string, permanent = false) => {
        e?.stopPropagation();
        if (!user) return;
        if (permanent) {
            if (confirm("Permanently delete this link?")) {
                await deleteDoc(doc(db, `users/${user.uid}/links`, id));
                setActiveItem(null);
            }
        } else {
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

    const toggleArchive = async (e: React.MouseEvent, id: string, current: boolean) => {
        e.stopPropagation();
        if (!user) return;
        await updateDoc(doc(db, `users/${user.uid}/links`, id), { isArchived: !current });
    }

    const handleFilterChange = (tag: string | null) => {
        const params = new URLSearchParams();
        if (tag) params.set('tag', tag);
        router.push(`/?${params.toString()}`);
        if (tag !== 'private') setIsVaultOpen(false);
    };

    // Filter Logic
    const filteredLinks = links.filter(item => {
        // 1. Text Search
        if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

        // 2. Trash Filter
        if (filterParam === 'trash') return item.isTrash === true;
        if (item.isTrash) return false;

        // 3. Vault Filter (Private)
        if (tagParam === 'private') {
            return isVaultOpen && item.isPrivate; // Only show if vault unlocked
        }
        if (item.isPrivate) return false; // Hide private items everywhere else

        // 4. Tag Filter
        if (tagParam) return item.tags?.some(t => t.toLowerCase() === tagParam.toLowerCase());

        // 5. Category Filters
        if (filterParam === 'favorites') return item.isFavorite === true;
        if (filterParam === 'archive') return item.isArchived === true;
        if (filterParam === 'all' && item.isArchived) return false;

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
        <div className="p-4 md:p-8 w-full max-w-7xl mx-auto min-h-screen pb-32">

            {/* Header & Search */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <motion.h1
                        layoutId="page-title"
                        className="text-4xl font-bold tracking-tight capitalize text-slate-900 dark:text-white"
                    >
                        {getPageTitle()}
                    </motion.h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">{filteredLinks.length} items</p>
                </div>

                <div className="relative group w-full md:w-80">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Search size={18} className="text-slate-400" />
                    </div>
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search your mind..."
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:ring-4 ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-base shadow-sm focus:shadow-md"
                    />
                </div>
            </div>

            {/* Filter Bar (Chips) */}
            <div className="mb-8">
                <FilterBar currentTag={tagParam} onSelectTag={handleFilterChange} />
            </div>

            {/* Grid Layout (Masonry-like) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode='popLayout'>

                    {/* Add Card */}


                    {/* Link Cards */}
                    {filteredLinks.map((item) => (
                        <LinkCard
                            key={item.id}
                            item={item}
                            isActive={activeItem?.id === item.id}
                            onClick={() => setActiveItem(item)}
                            onToggleFavorite={toggleFavorite}
                            onArchive={toggleArchive}
                            onDelete={handleDelete}
                            onRestore={filterParam === 'trash' ? handleRestore : undefined}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {/* --- OVERLAYS --- */}

            {/* Floating Action Button (Mobile/Desktop) */}
            <AnimatePresence>
                {filterParam === 'all' && !tagParam && !searchQuery && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsAdding(true)}
                        className="fixed bottom-8 right-8 z-40 w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-500 transition-colors"
                    >
                        <Plus size={32} />
                    </motion.button>
                )}
            </AnimatePresence>

            <AddLinkSheet
                isOpen={isAdding}
                onClose={() => setIsAdding(false)}
                onSave={handleSave}
                checkPreview={fetchMetadata}
            />

            <DetailSheet
                item={activeItem}
                onClose={() => setActiveItem(null)}
                onDelete={(id, permanent) => handleDelete(null, id, permanent)}
                onRestore={handleRestore}
            />

            <VaultOverlay
                isOpen={checkingVault}
                onUnlock={() => { setCheckingVault(false); setIsVaultOpen(true); }}
                onCancel={() => { setCheckingVault(false); handleFilterChange(null); }}
            />

        </div>
    );
}
