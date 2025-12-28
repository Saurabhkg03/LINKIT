/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { motion } from 'framer-motion';
import { Star, ExternalLink, Archive as ArchiveIcon, Bell, Trash2, RefreshCw } from 'lucide-react';
import { cn } from "@/lib/utils";
import { LinkItem } from '@/types/link';

interface LinkCardProps {
    item: LinkItem;
    isActive: boolean;
    onClick: () => void;
    onToggleFavorite: (e: React.MouseEvent, id: string, current: boolean) => void;
    onArchive?: (e: React.MouseEvent, id: string, current: boolean) => void;
    onDelete: (e: React.MouseEvent, id: string, permanent: boolean) => void;
    onRestore?: (id: string) => void;
}

export function LinkCard({
    item,
    onClick,
    onToggleFavorite,
    onArchive,
    onDelete,
    onRestore
}: LinkCardProps) {
    return (
        <motion.div
            layoutId={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={cn(
                "group relative h-[340px] rounded-[32px] overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col border",
                item.theme?.background || "bg-white dark:bg-slate-900",
                item.theme?.border || "border-slate-100 dark:border-slate-800"
            )}
        >
            {/* Image Area */}
            <div className="h-[50%] w-full relative overflow-hidden bg-slate-100 dark:bg-zinc-800">
                {item.image ? (
                    <img
                        src={item.image}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        alt={item.title || "Link"}
                    />
                ) : (
                    <div className={cn("w-full h-full flex items-center justify-center", item.theme?.background || "bg-slate-100 dark:bg-slate-800")}>
                        <span className={cn("text-4xl font-bold opacity-20", item.theme?.text || "text-slate-900 dark:text-slate-100")}>{item.domain?.substring(0, 1).toUpperCase()}</span>
                    </div>
                )}

                {/* Favorite Indicator (Top Left) */}
                {item.isFavorite && (
                    <div className="absolute top-3 left-3 p-1.5 rounded-full bg-yellow-400 text-white shadow-sm z-10">
                        <Star size={12} fill="currentColor" />
                    </div>
                )}

                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <div className="bg-white/80 dark:bg-black/60 backdrop-blur p-1.5 rounded-full text-black dark:text-white">
                        <ExternalLink size={12} />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className={cn("p-5 flex flex-col flex-1 justify-between z-10", item.theme?.background || "bg-white dark:bg-slate-900")}>
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        {item.tags?.[0] && (
                            <span className={cn("text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md", item.theme?.accent || "text-blue-600", "bg-white/50 dark:bg-black/20")}>
                                {item.tags[0]}
                            </span>
                        )}
                        <span className={cn("text-[10px] font-medium uppercase tracking-widest truncate", item.theme?.accent || "text-slate-500")}>
                            {item.domain}
                        </span>
                    </div>
                    <h3 className={cn("font-bold text-lg leading-tight line-clamp-2 mb-1", item.theme?.text || "text-slate-900 dark:text-slate-50")}>
                        {item.title}
                    </h3>
                    <p className={cn("text-xs line-clamp-1 font-medium", item.theme?.description || "text-slate-500 dark:text-slate-400")}>
                        {item.description || "No description"}
                    </p>
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/50">
                    {/* Favorite */}
                    <button
                        onClick={(e) => onToggleFavorite(e, item.id, !!item.isFavorite)}
                        className={cn("p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors active:scale-90", item.isFavorite ? "text-yellow-500" : "text-slate-400 dark:text-slate-500")}
                        title="Favorite"
                    >
                        <Star size={18} fill={item.isFavorite ? "currentColor" : "none"} />
                    </button>

                    {/* Archive */}
                    {onArchive && (
                        <button
                            onClick={(e) => onArchive(e, item.id, !!item.isArchived)}
                            className={cn("p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors active:scale-90", item.isArchived ? "text-blue-500" : "text-slate-400 dark:text-slate-500")}
                            title="Archive"
                        >
                            <ArchiveIcon size={18} />
                        </button>
                    )}

                    {/* Reminder (Mock) */}
                    <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 dark:text-slate-500 hover:text-blue-500 transition-colors active:scale-90"
                        title="Reminder"
                    >
                        <Bell size={18} />
                    </button>

                    {/* Restore / Delete */}
                    {item.isTrash && onRestore ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); onRestore(item.id); }}
                            className="p-2 rounded-full hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 transition-colors active:scale-90"
                            title="Restore"
                        >
                            <RefreshCw size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={(e) => onDelete(e, item.id, false)}
                            className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors active:scale-90"
                            title="Move to Trash"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}

                    {/* Open */}
                    <button
                        onClick={(e) => { e.stopPropagation(); item.url && window.open(item.url, '_blank'); }}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 dark:text-slate-500 hover:text-blue-500 transition-colors active:scale-90"
                        title="Open Link"
                    >
                        <ExternalLink size={18} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
