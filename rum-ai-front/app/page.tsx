'use client';

import { useState, DragEvent, ChangeEvent } from 'react';

interface DialogueSegment {
    speaker: string;
    text: string;
    time?: string;
}

export default function RumAIPage() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [isDragActive, setIsDragActive] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'text' | 'dialogue'>('text');

    const [transcription, setTranscription] = useState<string>('');
    const [language, setLanguage] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [dialogueSegments, setDialogueSegments] = useState<DialogueSegment[]>([]);

    const handleDrag = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragActive(true);
        } else if (e.type === "dragleave") {
            setIsDragActive(false);
        }
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setError('');
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('¡Wumpa! Sube un archivo de audio o video para empezar.');
            return;
        }

        setLoading(true);
        setError('');
        setTranscription('');
        setDialogueSegments([]);

        const formData = new FormData();
        formData.append('file', file);

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

        if (!backendUrl) {
            setError('Falta configurar la variable de entorno del sistema.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${backendUrl}/transcribe`, {
method: 'POST',
    body: formData,
});

if (!response.ok) {
    throw new Error('No se pudo conectar con el motor de transcripción. Inténtalo de nuevo.');
}

const data = await response.json();

setTranscription(data.text);
setLanguage(data.language || 'es');

if (data.segments) {
    setDialogueSegments(data.segments);
} else {
    setDialogueSegments([
        { speaker: 'Hablante 1', text: data.text }
    ]);
}

} catch (err: any) {
    setError(err.message || 'Error al procesar el audio.');
} finally {
    setLoading(false);
}
};

return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-[#11294a] via-[#16355f] to-[#0d1f38] text-[#FFFFFF]">

        <nav className="border-b border-[#275BB2]/40 bg-[#231F20]/80 backdrop-blur-xl px-6 py-4 sticky top-0 z-50 shadow-lg">
            <div className="w-full flex justify-between items-center max-w-7xl mx-auto">

                <div className="flex items-center gap-4">
                    <div className="w-[70px] h-[100px] rounded-xl overflow-hidden bg-[#E25822] border-2 border-[#FCE3B4] flex items-center justify-center shadow-xl relative group transition-transform hover:scale-105">
                        <img
                            src="/crash.jpg"
                            alt="Profile"
                            className="w-full h-full object-cover object-top scale-110"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    </div>
                    <span className="text-3xl font-black tracking-tight text-[#FFFFFF] font-sans drop-shadow-sm">
                            rum-<span className="text-[#F15A24]">AI</span>
                        </span>
                </div>

                <div className="text-right">
                    <p className="font-serif italic text-lg md:text-xl text-[#FCE3B4] tracking-wide font-medium antialiased drop-shadow-md select-none opacity-90">
                        “Descansando de dormir”
                    </p>
                </div>

            </div>
        </nav>

        <main className="flex-grow max-w-4xl w-full mx-auto p-6 md:py-12 space-y-8">

            <div className="text-center space-y-3">
                <h2 className="text-4xl font-black tracking-tight text-[#FFFFFF] sm:text-5xl uppercase drop-shadow-lg">
                    Transcribe tu Audio al Instante
                </h2>
                <p className="text-[#FED1A7] max-w-xl mx-auto text-base font-medium opacity-90">
                    Sube tus archivos de voz y deja que nuestra inteligencia procese cada palabra de forma rápida y precisa.
                </p>
            </div>

            <div className="bg-[#275BB2]/40 backdrop-blur-md border-2 border-[#275BB2]/60 rounded-2xl p-6 shadow-2xl transition-all">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        className={`border-4 border-dashed rounded-xl p-8 text-center transition-all relative ${
                            isDragActive
                                ? 'border-[#F15A24] bg-[#FCE3B4]/5 scale-[1.01]'
                                : 'border-[#4A2306]/60 hover:border-[#E25822] bg-[#231F20]/90'
                        }`}
                    >
                        <input
                            type="file"
                            accept="audio/*,video/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="space-y-4">
                            <div className="mx-auto w-14 h-14 rounded-xl bg-[#275BB2]/50 flex items-center justify-center border-2 border-[#4A2306]/40 text-[#00A859]">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75V16.5m0 0V12m0 4.5h4.5M12 16.5h-4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                            </div>
                            <div className="text-sm">
                                {file ? (
                                    <p className="font-black text-[#F15A24] bg-[#FCE3B4] py-1.5 px-4 rounded-lg inline-block border-2 border-[#603813] shadow-md">
                                        🚀🚀🚀 Cargado: {file.name}
                                    </p>
                                ) : (
                                    <p className="text-[#FED1A7] font-medium">
                                        <span className="text-[#F15A24] font-black hover:underline cursor-pointer">Selecciona un archivo</span> o arrástralo aquí
                                    </p>
                                )}
                            </div>
                            <p className="text-xs text-[#FFFFFF]/60 font-semibold uppercase tracking-wider">Formatos: MP3, WAV, M4A, FLAC, MP4</p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !file}
                        className={`w-full py-4 px-4 rounded-xl font-black uppercase tracking-wider text-base transition-all flex items-center justify-center gap-2 border-2 border-[#4A2306]/30 ${
                            loading
                                ? 'bg-[#603813]/80 text-[#FED1A7]/40 cursor-not-allowed'
                                : 'bg-gradient-to-r from-[#E25822] to-[#F15A24] hover:from-[#F15A24] hover:to-[#FED1A7] hover:text-[#231F20] text-[#FFFFFF] shadow-lg shadow-[#E25822]/30 active:scale-[0.99]'
                        }`}
                    >
                        {loading ? (
                            <>
                                <div className="h-4 w-4 border-2 border-[#00A859] border-t-transparent rounded-full animate-spin"></div>
                                <span>Procesando el audio...</span>
                            </>
                        ) : (
                            '¡Iniciar Transcripción!'
                        )}
                    </button>
                </form>

                {error && (
                    <div className="mt-4 p-3 bg-[#4A2306]/90 border-2 border-[#E25822] rounded-xl text-xs font-black text-[#FCE3B4] flex items-center gap-2 shadow-inner">
                        🤢🤮 {error}
                    </div>
                )}
            </div>

            {transcription && (
                <div className="bg-[#275BB2]/40 backdrop-blur-md border-2 border-[#275BB2]/60 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                    <div className="border-b-2 border-[#603813]/40 px-6 py-4 bg-[#231F20]/95 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveTab('text')}
                                className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all border-2 ${
                                    activeTab === 'text'
                                        ? 'bg-[#E25822] text-[#FFFFFF] border-[#FCE3B4] shadow-md'
                                        : 'bg-[#275BB2]/60 text-[#FED1A7] border-[#4A2306]/40 hover:text-[#FFFFFF]'
                                }`}
                            >
                                Texto Corrido
                            </button>
                            <button
                                onClick={() => setActiveTab('dialogue')}
                                className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all border-2 ${
                                    activeTab === 'dialogue'
                                        ? 'bg-[#E25822] text-[#FFFFFF] border-[#FCE3B4] shadow-md'
                                        : 'bg-[#275BB2]/60 text-[#FED1A7] border-[#4A2306]/40 hover:text-[#FFFFFF]'
                                }`}
                            >
                                Identificación de Voces
                            </button>
                        </div>
                        <span className="text-xs font-black uppercase bg-[#00A859]/90 text-[#FFFFFF] border-2 border-[#FCE3B4] px-3 py-1 rounded-md self-start sm:self-auto shadow-sm">
                                Idioma: {language}
                            </span>
                    </div>

                    <div className="p-6 bg-[#231F20]/20">
                        {activeTab === 'text' ? (
                            <div className="text-[#FFFFFF] text-sm leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto pr-2 font-semibold">
                                {transcription}
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                {dialogueSegments.map((seg, idx) => (
                                    <div key={idx} className="flex flex-col gap-1 text-sm border-l-4 border-[#F15A24] pl-4 py-1.5 bg-[#231F20]/50 rounded-r-lg pr-2">
                                            <span className="font-black text-xs text-[#FED1A7] tracking-wider uppercase">
                                                {seg.speaker}
                                            </span>
                                        <p className="text-[#FFFFFF] font-medium leading-relaxed">{seg.text}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-6 pt-4 border-t-2 border-[#603813]/20 flex justify-end">
                            <button
                                onClick={() => navigator.clipboard.writeText(transcription)}
                                className="flex items-center gap-1.5 text-xs font-black text-[#FCE3B4] hover:text-[#E25822] transition-colors uppercase tracking-wider"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                                </svg>
                                Copiar Transcripción
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </main>

        <footer className="border-t border-[#275BB2]/20 py-5 bg-[#231F20]/95 text-center text-xs font-bold text-[#FED1A7] tracking-wide shadow-inner">
            &copy; {new Date().getFullYear()} <span className="text-[#FFFFFF]">rum-AI</span> — Creado y Desarrollado por <span className="text-[#E25822] hover:text-[#F15A24] transition-colors uppercase font-black">Noltek</span>.
        </footer>
    </div>
);
}
