import os
import subprocess
import tempfile
import shutil
from basic_pitch.inference import predict

try:
    from basic_pitch import ICASSP_2022_MODEL_PATH
except ImportError:
    ICASSP_2022_MODEL_PATH = None  # Newer versions don't need explicit model path


def process_audio_file(audio_file_path: str):
    """
    Recibe un archivo de audio ya descargado, separa las voces con Demucs,
    extrae el pitch con Basic Pitch, y retorna las notas.
    """
    with tempfile.TemporaryDirectory() as temp_dir:
        # Copiar el archivo al directorio temporal con nombre limpio
        ext = os.path.splitext(audio_file_path)[1] or '.m4a'
        local_path = os.path.join(temp_dir, f'source_audio{ext}')
        shutil.copy2(audio_file_path, local_path)
        
        wav_path = os.path.join(temp_dir, 'source_audio.wav')

        # 1. Convertir a WAV estándar para Demucs/BasicPitch
        subprocess.run([
            "ffmpeg", "-y", "-i", local_path, 
            "-vn", "-acodec", "pcm_s16le", "-ar", "44100", "-ac", "2", 
            wav_path
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        if not os.path.exists(wav_path):
            raise Exception("No se pudo convertir el audio a WAV.")

        # 2. Separar voces con Demucs
        demucs_out = os.path.join(temp_dir, 'demucs_out')
        
        subprocess.run([
            "demucs", "--two-stems", "vocals", "-n", "htdemucs", 
            "-o", demucs_out, wav_path
        ], check=True)
        
        vocals_path = os.path.join(demucs_out, 'htdemucs', 'source_audio', 'vocals.wav')
        
        if not os.path.exists(vocals_path):
            raise Exception("Demucs no pudo separar las voces.")

        # 3. Extraer pitch con basic-pitch
        predict_args = [vocals_path]
        if ICASSP_2022_MODEL_PATH is not None:
            predict_args.append(ICASSP_2022_MODEL_PATH)
        
        model_output, midi_data, note_events = predict(
            *predict_args,
            onset_threshold=0.5,
            frame_threshold=0.3,
            minimum_note_length=100,
            minimum_frequency=None,
            maximum_frequency=None
        )

        # 4. Formatear para el frontend
        notes = []
        for start_time, end_time, pitch_midi, amplitude, pitch_bends in note_events:
            notes.append({
                "start": float(start_time),
                "end": float(end_time),
                "pitch": int(pitch_midi),
                "amplitude": float(amplitude)
            })
            
        return notes
