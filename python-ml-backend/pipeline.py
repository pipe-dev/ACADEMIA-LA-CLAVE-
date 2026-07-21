import os
import subprocess
import tempfile
import shutil
import numpy as np
import librosa


def process_audio_file(audio_file_path: str):
    """
    Recibe un archivo de audio, separa voces con Demucs,
    extrae pitch con librosa.pyin (pura matemática, cero modelos),
    y retorna las notas.
    """
    with tempfile.TemporaryDirectory() as temp_dir:
        ext = os.path.splitext(audio_file_path)[1] or '.m4a'
        local_path = os.path.join(temp_dir, f'source_audio{ext}')
        shutil.copy2(audio_file_path, local_path)
        
        wav_path = os.path.join(temp_dir, 'source_audio.wav')

        # 1. Convertir a WAV
        subprocess.run([
            "ffmpeg", "-y", "-i", local_path, 
            "-vn", "-acodec", "pcm_s16le", "-ar", "22050", "-ac", "1", 
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

        # 3. Extraer pitch con librosa.pyin (pura matemática, 0 dependencias extra)
        # Bajamos el sample rate a 4000 Hz. 
        # Teorema de Nyquist: con 4000 Hz podemos detectar frecuencias hasta 2000 Hz.
        # La voz humana (incluso un C6 soprano) no pasa de 1047 Hz. ¡Esto va a volar!
        y, sr = librosa.load(vocals_path, sr=4000, mono=True)
        
        f0, voiced_flag, voiced_probs = librosa.pyin(
            y, 
            fmin=librosa.note_to_hz('C2'),   # ~65 Hz
            fmax=librosa.note_to_hz('C6'),   # ~1047 Hz
            sr=sr,
            frame_length=512,
            hop_length=128
        )
        
        times = librosa.times_like(f0, sr=sr, hop_length=128)
        
        # 4. Convertir frames de f0 a eventos de notas MIDI
        notes = _frames_to_notes(f0, voiced_flag, voiced_probs, times)
            
        return notes


def _frames_to_notes(f0, voiced_flag, voiced_probs, times):
    """
    Agrupa frames consecutivos con la misma nota MIDI en eventos.
    Retorna lista de {start, end, pitch, amplitude}.
    """
    notes = []
    current_note = None
    note_start = 0.0
    note_amplitudes = []
    
    for i in range(len(f0)):
        if voiced_flag[i] and not np.isnan(f0[i]):
            midi_note = int(round(librosa.hz_to_midi(f0[i])))
            
            if midi_note != current_note:
                # Guardar nota anterior
                if current_note is not None and (times[i] - note_start) >= 0.05:
                    notes.append({
                        "start": float(round(note_start, 3)),
                        "end": float(round(times[i], 3)),
                        "pitch": current_note,
                        "amplitude": float(round(np.mean(note_amplitudes), 3))
                    })
                # Iniciar nueva nota
                current_note = midi_note
                note_start = times[i]
                note_amplitudes = [float(voiced_probs[i])]
            else:
                note_amplitudes.append(float(voiced_probs[i]))
        else:
            # Silencio: cerrar nota actual
            if current_note is not None and (times[i] - note_start) >= 0.05:
                notes.append({
                    "start": float(round(note_start, 3)),
                    "end": float(round(times[i], 3)),
                    "pitch": current_note,
                    "amplitude": float(round(np.mean(note_amplitudes), 3))
                })
            current_note = None
            note_amplitudes = []
    
    # Cerrar última nota
    if current_note is not None and len(times) > 0:
        notes.append({
            "start": float(round(note_start, 3)),
            "end": float(round(times[-1], 3)),
            "pitch": current_note,
            "amplitude": float(round(np.mean(note_amplitudes), 3))
        })
    
    return notes
