'use client';

import { useState, DragEvent, ChangeEvent, useEffect } from 'react';

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

    const [progress, setProgress] = useState<number>(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (loading) {
            interval = setInterval(() => {
                setProgress((oldProgress) => {
                    if (oldProgress >= 95) {
                        return 95;
                    }
                    const randomIncrement = Math.floor(Math.random() * 8) + 2;
                    return Math.min(oldProgress + randomIncrement, 95);
                });
            }, 400);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [loading]);

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

        setProgress(0);
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
                headers: {
                    "ngrok-skip-browser-warning": "69420"
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('No se pudo conectar con el motor de transcripción. Inténtalo de nuevo.');
            }

            const data = await response.json();

            setProgress(100);

            setTimeout(() => {
                setTranscription(data.text);
                setLanguage(data.language || 'es');

                if (data.segments) {
                    setDialogueSegments(data.segments);
                } else {
                    setDialogueSegments([
                        { speaker: 'Hablante 1', text: data.text, time: '00:00' }
                    ]);
                }
                setLoading(false);
            }, 300);

        } catch (err: any) {
            setError(err.message || 'Error al procesar el audio.');
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (activeTab === 'text') {
            navigator.clipboard.writeText(transcription);
        } else {
            const formattedDialogue = dialogueSegments
                .map(seg => {
                    const t = seg.time ? `[${seg.time}] ` : '';
                    return `${t}${seg.speaker}: ${seg.text}`;
                })
                .join('\n');
            navigator.clipboard.writeText(formattedDialogue);
        }
    };

    const handleExportFile = () => {
        let fileContent = "";

        if (activeTab === 'text') {
            fileContent = transcription;
        } else {
            fileContent = dialogueSegments
                .map(seg => {
                    const timestamp = seg.time ? `[${seg.time}] ` : "";
                    return `${timestamp}${seg.speaker}: ${seg.text}`;
                })
                .join('\n');
        }

        const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `rum_ai_transcripcion_${activeTab}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
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
                            className={`border-4 border-dashed rounded-xl p-8 text-center transition-all relative ${isDragActive
                                ? 'border-[#F15A24] bg-[#FCE3B4]/5 scale-[1.01]'
                                : 'border-[#4A2306]/60 hover:border-[#E25822] bg-[#231F20]/90'
                            }`}
                        >
                            <input
                                type="file"
                                accept="audio/*,video/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                            />
                            <div className="space-y-4">
                                <div className="mx-auto w-14 h-14 rounded-xl bg-[#275BB2]/50 flex items-center justify-center border-2 border-[#4A2306]/40 text-[#00A859] shadow-inner">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                                    </svg>
                                </div>
                                <div className="text-sm">
                                    {file ? (
                                        <p className="font-black text-[#F15A24] bg-[#FCE3B4] py-1.5 px-4 rounded-lg inline-block border-2 border-[#603813] shadow-md relative z-30">
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
                            className={`w-full py-4 px-4 rounded-xl font-black uppercase tracking-wider text-base transition-all flex items-center justify-center gap-2 border-2 border-[#4A2306]/30 ${loading
                                ? 'bg-[#603813]/80 text-[#FED1A7]/40 cursor-not-allowed'
                                : 'bg-gradient-to-r from-[#E25822] to-[#F15A24] hover:from-[#F15A24] hover:to-[#FED1A7] hover:text-[#231F20] text-[#FFFFFF] shadow-lg shadow-[#E25822]/30 active:scale-[0.99] cursor-pointer'
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

                    <div className="mt-4 pt-2 border-t border-[#4A2306]/30 text-[#FED1A7] text-[11px] font-semibold tracking-wide normal-case bg-[#231F20]/40 p-2 rounded-lg text-center select-none flex flex-col sm:flex-row items-center justify-center gap-1.5">
                        <span>💡 Si el bot se encuentra offline o no responde, por favor contacta al soporte técnico:</span>
                        <a
                            href="https://wa.me/447344489147?text=%C2%A1Hola%20Noltek!%20El%20bot%20rum-AI%20est%C3%A1%20offline%2C%20%C2%BFpodr%C3%ADas%20encenderlo%3F"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#F15A24] hover:text-[#ff9f1c] font-black font-mono tracking-wider hover:underline cursor-pointer transition-colors group"
                        >
                            <svg
                                className="w-3.5 h-3.5 text-[#00A859] group-hover:text-[#4caf50] transition-colors fill-current"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.411 0 11.989 0c3.183.001 6.177 1.24 8.43 3.496 2.254 2.256 3.491 5.253 3.491 8.434 0 6.646-5.352 11.993-11.934 11.993-2.002-.001-3.973-.51-5.716-1.486L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.528 1.977 14.07 .953 11.99 .953c-5.441 0-9.866 4.372-9.87 9.802 0 1.63.463 3.224 1.34 4.625l-1.024 3.737 3.83-1.001zM16.6 13.99c-.26-.13-1.532-.756-1.77-.84-.237-.087-.41-.13-.58.13-.17.26-.66.84-.81.1.012-.15-.15-.34-.412-.48-1.123-.56-1.954-1.233-2.67-2.457-.15-.26-.013-.4.124-.538.123-.124.262-.31.393-.46.13-.16.174-.266.26-.44.088-.17.044-.32-.022-.45-.065-.13-.58-1.4-.795-1.92-.21-.51-.425-.44-.58-.44-.152 0-.325-.01-.5-.01-.173 0-.455.06-.693.31-.238.24-.91.89-.91 2.17 0 1.28.932 2.51 1.06 2.69.13.17 1.83 2.79 4.43 3.91.62.27 1.1.43 1.48.55.62.2 1.19.17 1.64.1.5-.07 1.53-.63 1.74-1.23.21-.6.21-1.12.14-1.23-.07-.11-.26-.17-.52-.3z"/>
                            </svg>
                            <span>+44 7344 489147</span>
                        </a>
                    </div>

                    {loading && (
                        <div className="mt-6 space-y-2 animate-fade-in">
                            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-[#FED1A7]">
                                <span>Dejame dormir...</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full h-4 bg-[#231F20] rounded-full border-2 border-[#4A2306]/60 relative overflow-visible">
                                <div
                                    className="h-full bg-gradient-to-r from-[#E25822] to-[#F15A24] rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${progress}%` }}
                                ></div>

                                <div
                                    className="absolute top-1/2 -translate-y-1/2 -ml-4 transition-all duration-300 ease-out z-10"
                                    style={{ left: `${progress}%` }}
                                >
                                    <img
                                        src="/chuki.png"
                                        alt="Chuki"
                                        className="w-9 h-9 object-contain drop-shadow-[0_0_8px_rgba(241,90,36,0.6)] max-w-none"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-3 bg-[#4A2306]/90 border-2 border-[#E25822] rounded-xl text-xs font-black text-[#FCE3B4] flex items-center gap-2 shadow-inner animate-fade-in">
                            🤢🤮 <span>{error}</span>
                        </div>
                    )}
                </div>

                {transcription && (
                    <div className="bg-[#275BB2]/40 backdrop-blur-md border-2 border-[#275BB2]/60 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                        <div className="border-b-2 border-[#603813]/40 px-6 py-4 bg-[#231F20]/95 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setActiveTab('text')}
                                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all border-2 cursor-pointer ${activeTab === 'text'
                                        ? 'bg-[#E25822] text-[#FFFFFF] border-[#FCE3B4] shadow-md'
                                        : 'bg-[#275BB2]/60 text-[#FED1A7] border-[#4A2306]/40 hover:text-[#FFFFFF]'
                                    }`}
                                >
                                    Texto Corrido
                                </button>
                                <button
                                    onClick={() => setActiveTab('dialogue')}
                                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all border-2 cursor-pointer ${activeTab === 'dialogue'
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
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="font-black text-xs text-[#FED1A7] tracking-wider uppercase">
                                                    {seg.speaker}
                                                </span>
                                                {seg.time && (
                                                    <span className="text-[10px] font-mono font-bold bg-[#11294a] text-[#FCE3B4] px-1.5 py-0.2 rounded border border-[#275BB2]/40 shadow-sm select-none">
                                                        [{seg.time}]
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[#FFFFFF] font-medium leading-relaxed">{seg.text}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-6 pt-4 border-t-2 border-[#603813]/20 flex justify-end gap-4">
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-1.5 text-xs font-black text-[#FCE3B4] hover:text-[#E25822] transition-colors uppercase tracking-wider cursor-pointer active:scale-95 select-none"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                                    </svg>
                                    {activeTab === 'text' ? 'Copiar Texto' : 'Copiar Diálogo'}
                                </button>

                                <button
                                    onClick={handleExportFile}
                                    className="flex items-center gap-1.5 text-xs font-black text-[#00A859] hover:text-[#4caf50] transition-colors uppercase tracking-wider cursor-pointer active:scale-95 select-none border border-[#00A859]/30 px-2.5 py-1 rounded-md bg-[#00A859]/5 hover:bg-[#00A859]/10"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                    </svg>
                                    Descargar .TXT
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