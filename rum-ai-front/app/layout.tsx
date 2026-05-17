import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "rum-AI",
    description: "Transcribe y analiza tus audios con el poder de rum-AI",
    icons: {
        icon: '/crash.png'
    },

    openGraph: {
        title: "rum-AI | Audio Intelligence",
        description: "Transcribe y separa voces al instante con el motor inteligente de rum-AI.",
        url: "https://rum-ai-murex.vercel.app/",
        siteName: "rum-AI",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "Vista previa de rum-AI — Transcripción Inteligente",
            },
        ],
        locale: "es_PE",
        type: "website",
    },

    twitter: {
        card: "summary_large_image",
        title: "rum-AI | Audio Intelligence",
        description: "Transcribe y separa voces al instante con el motor inteligente de rum-AI.",
        images: ["/og-image.png"],
    },
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es">
        <body className="antialiased bg-[#090d16] text-slate-100 selection:bg-cyan-500/30">
        {children}
        </body>
        </html>
    );
}