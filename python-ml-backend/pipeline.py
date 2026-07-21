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

import yt_dlp

def download_via_ytdlp(url, temp_dir):
    """
    Usa yt-dlp para descargar el audio, que es más resistente a bloqueos.
    """
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': os.path.join(temp_dir, 'source_audio.%(ext)s'),
        'quiet': True,
        'no_warnings': True,
        'extract_audio': True
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(url, download=True)
            ext = info_dict.get('ext', 'webm')
            return os.path.join(temp_dir, f'source_audio.{ext}')
    except Exception as e:
        raise Exception(f"yt-dlp falló: {str(e)}")

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
            print("Pytubefix falló, usando yt-dlp Fallback:", str(e))
            # Intento 2: yt-dlp Fallback
            raw_audio_path = download_via_ytdlp(url, temp_dir)
            
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
