import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import torch
from faster_whisper import WhisperModel
from pyannote.audio import Pipeline
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Permitir la conexión desde tu Front de Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── CONFIGURACIÓN DE TOKENS Y HARDWARE ───
# Reemplaza esto con tu token real de Hugging Face
HF_TOKEN = os.getenv("HF_TOKEN")
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

print(f"🚀 Iniciando rum-AI Backend en: {DEVICE.upper()}")

# ─── CARGA DE MODELOS EN MEMORIA ───
# 1. Cargamos el pipeline de Diarización de Pyannote en la GPU
try:
    diarization_pipeline = Pipeline.from_pretrained(
        "pyannote/speaker-diarization-3.1",
        token=HF_TOKEN
    )
    diarization_pipeline.to(torch.device(DEVICE))
    print("✅ Pyannote Diarization cargado con éxito.")
except Exception as e:
    print(f"❌ Error al cargar Pyannote: {e}. Verifica tu HF_TOKEN.")

# 2. Cargamos Whisper Large-v3 Turbo optimizado para cuidar tu VRAM (usa ~3GB)
print("📦 Cargando Whisper Large-v3 Turbo...")
whisper_model = WhisperModel("large-v3-turbo", device=DEVICE, compute_type="int8_float16")
print("✅ Whisper listo para la acción.")


@app.post("/transcribe")
async def transcribe_multi_voice(file: UploadFile = File(...)):
    # 1. Guardar el archivo temporalmente en el disco
    temp_file = f"temp_{file.filename}"
    with open(temp_file, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # 2. Paso 1: Diarización (Separar quién habla y en qué segundo)
        # Ejecuta la segmentación de voces en el archivo
        diarization = diarization_pipeline(temp_file)

        # Guardamos la estructura de los turnos de habla
        speaker_turns = []
        for turn, _, speaker in diarization.itertracks(yield_label=True):
            speaker_turns.append({
                "start": turn.start,
                "end": turn.end,
                "speaker": speaker.replace("SPEAKER_", "Hablante ")
            })

        # Si el audio es muy corto o no detecta múltiples personas, hacemos fallback a transcripción estándar
        if not speaker_turns:
            segments, info = whisper_model.transcribe(temp_file, vad_filter=True)
            text_full = " ".join([seg.text for seg in segments])
            return {
                "text": text_full,
                "language": info.language,
                "segments": [{"speaker": "Hablante 1", "text": text_full}]
            }

        # 3. Paso 2: Transcripción Inteligente Acoplada
        # Le pasamos el audio completo a Whisper pero activando la extracción de marcas de tiempo por palabra
        segments, info = whisper_model.transcribe(temp_file, word_timestamps=True, vad_filter=True)
        all_segments = list(segments)

        # Texto completo plano para cumplir con la primera pestaña del Front
        text_full = " ".join([seg.text for seg in all_segments])

        # 4. Paso 3: Mapeo y Fusión (Cruzar las palabras de Whisper con los tiempos de Pyannote)
        dialogue_output = []

        for segment in all_segments:
            # Buscamos qué hablante coincide mejor con el tiempo de inicio de este segmento de Whisper
            current_speaker = "Hablante Desconocido"
            mid_time = (segment.start + segment.end) / 2

            for turn in speaker_turns:
                if turn["start"] <= mid_time <= turn["end"]:
                    current_speaker = turn["speaker"]
                    break

            # Si el último fragmento fue del mismo hablante, los agrupamos para que no se vea cortado
            if dialogue_output and dialogue_output[-1]["speaker"] == current_speaker:
                dialogue_output[-1]["text"] += f" {segment.text.strip()}"
            else:
                dialogue_output.append({
                    "speaker": current_speaker,
                    "text": segment.text.strip()
                })

        # 5. Limpieza y respuesta
        os.remove(temp_file)
        return {
            "text": text_full,
            "language": info.language,
            "segments": dialogue_output
        }

    except Exception as e:
        if os.path.exists(temp_file):
            os.remove(temp_file)
        raise HTTPException(status_code=500, detail=f"Error en el procesamiento: {str(e)}")