import gradio as gr
import spaces
from pipeline import process_youtube_url

@spaces.GPU(duration=60)
def extract_melody(url: str):
    if not url or ("youtube.com" not in url and "youtu.be" not in url):
        return {"error": "Invalid YouTube URL"}
        
    try:
        notes = process_youtube_url(url)
        return {"notes": notes}
    except Exception as e:
        return {"error": str(e)}

# Create a Gradio interface
iface = gr.Interface(
    fn=extract_melody,
    inputs=gr.Textbox(label="YouTube URL", placeholder="https://www.youtube.com/watch?v=..."),
    outputs=gr.JSON(label="Extracted Melody Notes"),
    title="AfinApp Melody Extractor",
    description="Extrae la melodía vocal de una canción en YouTube usando Spleeter y Basic Pitch."
)

if __name__ == "__main__":
    iface.launch()
