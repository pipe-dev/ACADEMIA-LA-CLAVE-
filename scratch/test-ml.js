const fetch = require('node-fetch');

async function testML() {
  console.log("Iniciando prueba del servidor Python ML...");
  
  // A short 15-second vocal scale or similar YouTube video
  const testUrl = "https://www.youtube.com/watch?v=J3mCItn43eQ"; 
  
  try {
    const res = await fetch("http://localhost:7860/extract-melody", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: testUrl })
    });
    
    if (!res.ok) {
      console.error("Error del servidor:", res.status, res.statusText);
      const text = await res.text();
      console.error(text);
      return;
    }
    
    const data = await res.json();
    console.log("¡Éxito! Notas extraídas:", data.notes.length);
    if (data.notes.length > 0) {
      console.log("Primera nota:", data.notes[0]);
    }
  } catch (err) {
    console.error("Error de conexión (¿Está corriendo el servidor Python en el puerto 7860?):", err.message);
  }
}

testML();
