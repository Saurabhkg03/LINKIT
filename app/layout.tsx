import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { AppLayoutShell } from "@/components/app-layout-shell";
import "./globals.css";

export const metadata: Metadata = {
    title: "Link Saver",
    description: "Next Gen Link Saver",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="antialiased font-sans">
                <AuthProvider>
                    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                        <AppLayoutShell>
                            {children}
                        </AppLayoutShell>
                    </ThemeProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
