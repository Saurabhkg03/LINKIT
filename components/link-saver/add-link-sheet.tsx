/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, X, Link2 } from 'lucide-react';
import { PreviewData } from '@/types/link';

interface AddLinkSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (url: string, preview: PreviewData) => void;
    checkPreview: (url: string) => Promise<PreviewData>;
}

const MOCK_CLIPBOARD = [
    { title: "Notery - Dribbble shot", url: "https://dribbble.com/shots/26879391" },
    { title: "React Docs", url: "https://react.dev" },
    { title: "Apple Design Resources", url: "https://developer.apple.com/design" }
];

export function AddLinkSheet({ isOpen, onClose, onSave, checkPreview }: AddLinkSheetProps) {
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);

    const handleUrlInput = async (url: string) => {
        setInputValue(url);
        if (!url.startsWith('http')) return;
        setIsLoading(true);
        try {
            const data = await checkPreview(url);
            setPreviewData(data);
        } finally { setIsLoading(false); }
    };

    const handleMockPaste = (url: string) => {
        handleUrlInput(url);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 50 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[36px] shadow-2xl p-6 overflow-hidden border border-slate-100 dark:border-zinc-800"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold dark:text-white">New Link</h2>
                        <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"><X size={20} className="dark:text-white" /></button>
                    </div>

                    {/* Input Area */}
                    <div className="relative mb-6">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Search size={18} /></div>
                        <input
                            value={inputValue}
                            onChange={(e) => handleUrlInput(e.target.value)}
                            placeholder="Paste URL..."
                            className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl py-4 pl-10 pr-4 outline-none focus:ring-4 ring-blue-500/10 focus:border-blue-500/50 transition-all font-medium dark:text-white text-lg"
                            autoFocus
                        />
                    </div>

                    {/* Clipboard Carousel (Mock) */}
                    {!previewData && (
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 pl-1">Recently Copied</h3>
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                {MOCK_CLIPBOARD.map((clip, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleMockPaste(clip.url)}
                                        className="shrink-0 flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:border-blue-200 transition-all text-xs font-medium max-w-[150px]"
                                    >
                                        <Link2 size={12} className="shrink-0 text-blue-500" />
                                        <span className="truncate">{clip.title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Preview Card */}
                    <AnimatePresence>
                        {previewData && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
                                <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700">
                                    <div className="w-20 h-20 rounded-xl bg-slate-200 dark:bg-zinc-700 shrink-0 overflow-hidden shadow-inner">
                                        {previewData.image && <img src={previewData.image} className="w-full h-full object-cover" alt={previewData.title || "Preview"} />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm line-clamp-1 dark:text-white">{previewData.title}</h4>
                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{previewData.description}</p>
                                        <span className="inline-block mt-2 text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md uppercase tracking-wider">{previewData.domain}</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        onClick={() => onSave(inputValue, previewData!)}
                        disabled={!previewData}
                        className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-blue-500/20 text-lg"
                    >
                        {isLoading ? <Loader2 className="animate-spin mx-auto" /> : "Save to Library"}
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
