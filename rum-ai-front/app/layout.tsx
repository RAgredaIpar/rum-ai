import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "rum-AI",
    description: "Transcribe y analiza tus audios con el poder de rum-AI",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="antialiased bg-[#090d16] text-slate-100 selection:bg-cyan-500/30">
                {children}
            </body>
        </html>
    );
}