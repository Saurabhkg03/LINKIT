"use client"

import { Suspense } from 'react';
import OriginLinkSaver from "@/components/origin-link-saver";

export default function Home() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-black">
                <div className="animate-pulse text-slate-400">Loading LinkIt...</div>
            </div>
        }>
            <OriginLinkSaver />
        </Suspense>
    );
}
