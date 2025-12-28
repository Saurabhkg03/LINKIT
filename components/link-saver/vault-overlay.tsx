import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Fingerprint, ScanFace } from 'lucide-react';

interface VaultOverlayProps {
    isOpen: boolean;
    onUnlock: () => void;
    onCancel: () => void;
}

export function VaultOverlay({ isOpen, onUnlock, onCancel }: VaultOverlayProps) {
    const [status, setStatus] = useState<"idle" | "scanning" | "success">("idle");

    useEffect(() => {
        if (isOpen) {
            setStatus("scanning");
            // Mock Biometric Delay
            const timer = setTimeout(() => {
                setStatus("success");
                setTimeout(onUnlock, 800);
            }, 2000);
            return () => clearTimeout(timer);
        } else {
            setStatus("idle");
        }
    }, [isOpen, onUnlock]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl">
            <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-8 flex items-center justify-center">
                    {/* Scanning Ring */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-t-2 border-l-2 border-blue-500 opacity-50"
                    />
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative z-10"
                    >
                        {status === "success" ? (
                            <div className="bg-green-500 p-4 rounded-full text-white shadow-[0_0_30px_rgba(34,197,94,0.6)]">
                                <Lock size={32} className="ml-1" />
                            </div>
                        ) : (
                            <div className="bg-white/10 p-5 rounded-full text-white backdrop-blur-md">
                                <ScanFace size={40} />
                            </div>
                        )}
                    </motion.div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">Hidden Vault</h2>
                <p className="text-slate-400 mb-8">Authenticating via OriginID...</p>

                <button onClick={onCancel} className="text-sm text-slate-500 hover:text-white transition-colors">
                    Cancel
                </button>
            </div>
        </div>
    );
}
