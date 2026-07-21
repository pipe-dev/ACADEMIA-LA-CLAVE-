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

def download_via_cobalt(url, temp_dir):
    """
    Usa la API pública de Cobalt.tools para extraer el audio como MP3 directamente,
    evadiendo las restricciones de YouTube.
    """
    cobalt_api = "https://api.cobalt.tools/api/json"
    
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        # Cobalt public instance requires Origin and Referer
        "Origin": "https://cobalt.tools",
        "Referer": "https://cobalt.tools/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }
    
    payload = {
        "url": url,
        "isAudioOnly": True,
        "aFormat": "mp3"
    }
    
    try:
        res = requests.post(cobalt_api, json=payload, headers=headers, timeout=20)
        res.raise_for_status()
        data = res.json()
        
        if data.get("status") in ["redirect", "stream"]:
            download_url = data.get("url")
            audio_res = requests.get(download_url, headers={"User-Agent": headers["User-Agent"]}, timeout=30)
            audio_res.raise_for_status()
            
            raw_audio_path = os.path.join(temp_dir, 'source_audio.mp3')
            with open(raw_audio_path, 'wb') as f:
                f.write(audio_res.content)
            return raw_audio_path
        else:
            raise Exception(f"Cobalt error: {data.get('text', 'Unknown status')}")
            
    except Exception as e:
        raise Exception(f"Fallo en el mercenario (Cobalt API): {str(e)}")

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
            print("Pytubefix falló, usando Cobalt Fallback (Mercenario):", str(e))
            # Intento 2: Cobalt API Fallback
            raw_audio_path = download_via_cobalt(url, temp_dir)
            
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
