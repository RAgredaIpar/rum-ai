import os
import shutil
import gc
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import torch
from faster_whisper import WhisperModel
from pyannote.audio import Pipeline
from dotenv import load_dotenv
from pydub import AudioSegment

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

HF_TOKEN = os.getenv("HF_TOKEN")
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

print(f"Iniciando rum-AI Backend en: {DEVICE.upper()}")

try:
    diarization_pipeline = Pipeline.from_pretrained(
        "pyannote/speaker-diarization-3.1",
        token=HF_TOKEN
    )
    diarization_pipeline.to(torch.device("cpu"))
    print("✅ Pyannote Diarization cargado en CPU (Ahorrando VRAM).")
except Exception as e:
    print(f"❌ Error al cargar Pyannote: {e}. Verifica tu HF_TOKEN.")

print("📦 Cargando Whisper Large-v3 Turbo...")
whisper_model = WhisperModel("large-v3-turbo", device=DEVICE, compute_type="int8")
print("✅ Whisper listo para la acción.")


def format_seconds_to_time(seconds: float) -> str:
    minutes = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{minutes:02d}:{secs:02d}"


@app.post("/transcribe")
async def transcribe_multi_voice(file: UploadFile = File(...)):
    input_tmp_path = f"temp_{file.filename}"
    processed_wav_path = f"processed_{file.filename}.wav"

    try:
        with open(input_tmp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        try:
            audio = AudioSegment.from_file(input_tmp_path)
            audio = audio.set_frame_rate(16000).set_channels(1)
            audio.export(processed_wav_path, format="wav")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error al procesar el formato de audio: {e}")

        diarization_output = diarization_pipeline(processed_wav_path)
        annotation = diarization_output.speaker_diarization

        speaker_turns = []
        for turn, _, speaker in annotation.itertracks(yield_label=True):
            speaker_turns.append({
                "start": turn.start,
                "end": turn.end,
                "speaker": speaker.replace("SPEAKER_", "Hablante ")
            })

        del diarization_output
        del annotation
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

        if not speaker_turns:
            segments, info = whisper_model.transcribe(processed_wav_path, vad_filter=True)
            text_full = " ".join([seg.text for seg in segments])
            return {
                "text": text_full,
                "language": info.language,
                "segments": [{"speaker": "Hablante 1", "text": text_full, "time": "00:00"}]
            }

        segments, info = whisper_model.transcribe(processed_wav_path, word_timestamps=True, vad_filter=True)
        all_segments = list(segments)
        text_full = " ".join([seg.text for seg in all_segments])

        dialogue_output = []
        for segment in all_segments:
            current_speaker = "Hablante Desconocido"
            mid_time = (segment.start + segment.end) / 2

            for turn in speaker_turns:
                if turn["start"] <= mid_time <= turn["end"]:
                    current_speaker = turn["speaker"]
                    break

            segment_time = format_seconds_to_time(segment.start)

            if dialogue_output and dialogue_output[-1]["speaker"] == current_speaker:
                dialogue_output[-1]["text"] += f" {segment.text.strip()}"
            else:
                dialogue_output.append({
                    "speaker": current_speaker,
                    "text": segment.text.strip(),
                    "time": segment_time
                })

        return {
            "text": text_full,
            "language": info.language,
            "segments": dialogue_output
        }

    except Exception as e:
        print(f"❌ ERROR EXACTO: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error en el procesamiento: {str(e)}")

    finally:
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

        for path in [input_tmp_path, processed_wav_path]:
            if os.path.exists(path):
                try:
                    os.remove(path)
                except Exception as e:
                    print(f"⚠️ No se pudo eliminar {path}: {e}")