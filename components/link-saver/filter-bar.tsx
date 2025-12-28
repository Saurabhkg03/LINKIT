import React from 'react';
import { cn } from "@/lib/utils";

interface FilterBarProps {
    currentTag: string | null;
    onSelectTag: (tag: string | null) => void;
}

const FILTERS = ["All", "Video", "Code", "Article", "Shopping", "Music", "Private"];

export function FilterBar({ currentTag, onSelectTag }: FilterBarProps) {
    return (
        <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
            <div className="flex px-1 gap-2">
                {FILTERS.map((tag) => {
                    const isActive = (tag === "All" && !currentTag) || (currentTag?.toLowerCase() === tag.toLowerCase());
                    return (
                        <button
                            key={tag}
                            onClick={() => onSelectTag(tag === "All" ? null : tag.toLowerCase())}
                            className={cn(
                                "px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap",
                                isActive
                                    ? "bg-blue-600 text-white dark:bg-blue-500 dark:text-white shadow-lg scale-105"
                                    : "bg-white dark:bg-zinc-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-700 hover:text-blue-600"
                            )}
                        >
                            {tag}
                        </button>
                    )
                })}
            </div>
        </div>
    );
}
