/* eslint-disable @next/next/no-img-element */
"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/components/auth-provider";
import { Loader2 } from "lucide-react";

export function LoginOverlay() {
    const { signInWithGoogle, loading } = useAuth();

    if (loading) return null; // Or a splash screen

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-2xl max-w-sm w-full text-center"
            >
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.333.533 12S5.867 24 12.48 24c3.44 0 6.013-1.133 8.053-3.24 2.107-2.187 2.76-5.453 2.76-7.88 0-.8-.067-1.453-.173-1.96h-10.643z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
                <p className="text-slate-500 text-sm mb-8">Sign in to sync your links across all devices securely.</p>

                <button
                    onClick={signInWithGoogle}
                    className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                >
                    <span>Sign in with Google</span>
                </button>
            </motion.div>
        </div>
    );
}
