import gradio as gr
import spaces
from pipeline import process_audio_file

@spaces.GPU(duration=60)
def extract_melody(audio_file):
    """
    Recibe un archivo de audio subido por el usuario (desde el navegador).
    El navegador se encarga de descargar el audio de YouTube via Cobalt.
    Aquí solo procesamos el archivo con IA.
    """
    if audio_file is None:
        return {"error": "No se recibió archivo de audio."}
        
    try:
        # Gradio pasa la ruta temporal del archivo subido
        file_path = audio_file if isinstance(audio_file, str) else audio_file.name
        notes = process_audio_file(file_path)
        return {"notes": notes}
    except Exception as e:
        return {"error": str(e)}

# Interfaz Gradio que acepta archivos de audio
iface = gr.Interface(
    fn=extract_melody,
    inputs=gr.Audio(type="filepath", label="Archivo de Audio"),
    outputs=gr.JSON(label="Notas de Melodía Extraídas"),
    title="AfinApp Melody Extractor",
    description="Sube un archivo de audio para extraer la melodía vocal con IA (Demucs + Basic Pitch)."
)

if __name__ == "__main__":
    iface.launch()
