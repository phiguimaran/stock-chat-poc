#!/usr/bin/env python3
import sys
import json
import os
import traceback
from faster_whisper import WhisperModel

def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "ok": False,
            "error": "ruta de audio requerida"
        }))
        sys.exit(1)

    audio_path = sys.argv[1]

    if not os.path.isfile(audio_path):
        print(json.dumps({
            "ok": False,
            "error": f"archivo no existe: {audio_path}"
        }))
        sys.exit(1)

    try:
        # Cargar modelo (CPU only)
        model = WhisperModel(
            "small",
            device="cpu",
            compute_type="int8"
        )

        segments, info = model.transcribe(
            audio_path,
            beam_size=5,
            vad_filter=True
        )

        texto = ""
        for seg in segments:
            texto += seg.text.strip() + " "

        texto = texto.strip()

        print(json.dumps({
            "ok": True,
            "language": info.language,
            "text": texto
        }))

    except Exception as e:
        print(json.dumps({
            "ok": False,
            "error": str(e),
            "trace": traceback.format_exc()
        }))
        sys.exit(2)


if __name__ == "__main__":
    main()

