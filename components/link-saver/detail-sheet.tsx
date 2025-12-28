/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Trash2, RefreshCw, BookOpen } from 'lucide-react';
import { cn } from "@/lib/utils";
import { LinkItem } from '@/types/link';

interface DetailSheetProps {
    item: LinkItem | null;
    onClose: () => void;
    onDelete: (id: string, permanent: boolean) => void;
    onRestore: (id: string) => void;
}

export function DetailSheet({ item, onClose, onDelete, onRestore }: DetailSheetProps) {
    const [isReaderMode, setIsReaderMode] = useState(false);

    if (!item) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />
                <motion.div
                    layoutId={item.id}
                    className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] border border-white/10"
                >
                    {/* Reader Mode Overlay */}
                    <AnimatePresence>
                        {isReaderMode && (
                            <motion.div
                                initial={{ opacity: 0, y: 100 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 100 }}
                                className="absolute inset-0 z-20 bg-[#f9f9f9] dark:bg-[#111] p-8 overflow-y-auto"
                            >
                                <button
                                    onClick={() => setIsReaderMode(false)}
                                    className="fixed top-8 right-8 p-2 rounded-full bg-slate-200 dark:bg-slate-800"
                                >
                                    <X size={20} />
                                </button>
                                <div className="max-w-prose mx-auto mt-12">
                                    <h1 className="text-3xl font-serif font-bold mb-4 text-slate-900 dark:text-slate-100">{item.title}</h1>
                                    <div className="text-xl font-serif leading-relaxed text-slate-800 dark:text-slate-300 opacity-90">
                                        {item.description || "No content to display in reader mode."}
                                    </div>
                                    <p className="mt-8 text-sm text-slate-400 italic">reader mode simulation</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Header Image */}
                    <div className="relative h-72 shrink-0 bg-slate-100 dark:bg-black">
                        {item.image ? (
                            <img src={item.image} className="w-full h-full object-cover" alt={item.title} />
                        ) : (
                            <div className={cn("w-full h-full flex items-center justify-center", item.theme?.background || "bg-slate-100 dark:bg-slate-800")}>
                                <span className={cn("text-6xl font-bold opacity-20", item.theme?.text || "text-slate-900 dark:text-slate-100")}>{item.domain?.substring(0, 1).toUpperCase()}</span>
                            </div>
                        )}
                        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 transition-colors z-10"><X size={20} /></button>

                        <div className="absolute bottom-4 left-4 flex gap-2">
                            <button
                                onClick={() => setIsReaderMode(true)}
                                className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20 text-xs font-bold uppercase tracking-wider hover:bg-white/30 transition-colors flex items-center gap-2"
                            >
                                <BookOpen size={14} /> Reader View
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 overflow-y-auto bg-white dark:bg-[#1c1c1e] text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="bg-slate-100 dark:bg-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">{item.domain}</span>
                            {item.tags?.map(t => <span key={t} className="text-xs text-blue-500 font-bold">#{t}</span>)}
                        </div>

                        <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-6 tracking-tight">{item.title}</h2>

                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 text-lg">
                            {item.description || "No description provided."}
                        </p>

                        <div className="flex gap-4">
                            <button onClick={() => item.url && window.open(item.url, '_blank')} className="flex-1 py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30">
                                <ExternalLink size={20} /> Open Link
                            </button>

                            {item.isTrash ? (
                                <button onClick={() => onRestore(item.id)} className="px-6 rounded-2xl bg-green-50 dark:bg-green-900/20 text-green-600 font-bold hover:bg-green-100 transition-colors flex items-center gap-2">
                                    <RefreshCw size={20} /> Restore
                                </button>
                            ) : (
                                <button onClick={() => onDelete(item.id, false)} className="px-6 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-200 font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors" title="Move to Trash">
                                    <Trash2 size={20} />
                                </button>
                            )}

                            {item.isTrash && (
                                <button onClick={() => onDelete(item.id, true)} className="px-6 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 font-bold hover:bg-red-100 transition-colors" title="Delete Forever">
                                    <Trash2 size={20} />
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
