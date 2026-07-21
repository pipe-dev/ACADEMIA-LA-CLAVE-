import os
import subprocess
import tempfile
import requests
import re
from basic_pitch.inference import predict
from basic_pitch import ICASSP_2022_MODEL_PATH
from pytubefix import YouTube

def extract_video_id(url):
    match = re.search(r"(?:v=|\/)([0-9A-Za-z_-]{11}).*", url)
    return match.group(1) if match else None

def download_via_piped(video_id, temp_dir):
    """
    Usa la API pública de Piped para extraer el audio directamente.
    """
    instances = [
        "https://pipedapi.kavin.rocks",
        "https://pipedapi.tokhmi.xyz",
        "https://pipedapi.smnz.de",
        "https://api.piped.projectsegfau.lt"
    ]
    
    for instance in instances:
        try:
            api_url = f"{instance}/streams/{video_id}"
            res = requests.get(api_url, timeout=15)
            if res.status_code == 200:
                data = res.json()
                audio_streams = data.get("audioStreams", [])
                
                if audio_streams:
                    # Sort by bitrate descending
                    audio_streams.sort(key=lambda x: int(x.get('bitrate', 0)), reverse=True)
                    audio_url = audio_streams[0].get('url')
                    
                    audio_res = requests.get(audio_url, timeout=30)
                    audio_res.raise_for_status()
                    
                    raw_audio_path = os.path.join(temp_dir, 'source_audio.m4a')
                    with open(raw_audio_path, 'wb') as f:
                        f.write(audio_res.content)
                    return raw_audio_path
        except Exception:
            continue
            
    raise Exception("Todos los mercenarios (Piped API) fallaron.")

def process_youtube_url(url: str):
    """
    Downloads YouTube audio, separates vocals, extracts pitch, and returns notes.
    """
    with tempfile.TemporaryDirectory() as temp_dir:
        raw_audio_path = None
        
        try:
            # Intento 1: Pytubefix directo
            yt = YouTube(url, client='TV') # 'TV' client is very resilient
            audio_stream = yt.streams.get_audio_only()
            raw_audio_path = audio_stream.download(output_path=temp_dir, filename='source_audio.mp4')
        except Exception as e:
            print("Pytubefix falló, usando Piped API Fallback (Mercenario):", str(e))
            # Intento 2: Piped API Fallback
            video_id = extract_video_id(url)
            if not video_id:
                raise Exception("URL de YouTube inválida.")
            raw_audio_path = download_via_piped(video_id, temp_dir)
            
        if not raw_audio_path:
            raise Exception("No se pudo descargar el audio.")
            
        wav_path = os.path.join(temp_dir, 'source_audio.wav')

        
        # Convert to standard WAV for Demucs/BasicPitch
        subprocess.run([
            "ffmpeg", "-y", "-i", raw_audio_path, 
            "-vn", "-acodec", "pcm_s16le", "-ar", "44100", "-ac", "2", 
            wav_path
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        if not os.path.exists(wav_path):
            raise Exception("Failed to download or convert audio to WAV.")

        # 2. Separate vocals using Demucs (better quality and Python 3.12 compatible)
        demucs_out = os.path.join(temp_dir, 'demucs_out')
        
        # Run demucs CLI
        subprocess.run([
            "demucs", "--two-stems", "vocals", "-n", "htdemucs", 
            "-o", demucs_out, wav_path
        ], check=True)
        
        # Path to the isolated vocals (demucs outputs to <out_dir>/htdemucs/<filename>/vocals.wav)
        vocals_path = os.path.join(demucs_out, 'htdemucs', 'source_audio', 'vocals.wav')
        
        if not os.path.exists(vocals_path):
            raise Exception("Failed to separate vocals using Demucs.")

        # 3. Extract pitch using basic-pitch
        model_output, midi_data, note_events = predict(
            vocals_path,
            ICASSP_2022_MODEL_PATH,
            onset_threshold=0.5,
            frame_threshold=0.3,
            minimum_note_length=100,
            minimum_frequency=None,
            maximum_frequency=None
        )

        # 4. Format the output for the React frontend
        notes = []
        for start_time, end_time, pitch_midi, amplitude, pitch_bends in note_events:
            notes.append({
                "start": float(start_time),
                "end": float(end_time),
                "pitch": int(pitch_midi),
                "amplitude": float(amplitude)
            })
            
        return notes
