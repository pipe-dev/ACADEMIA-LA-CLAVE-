export interface YoutubeSearchResult {
  id: string;
  title: string;
  thumbnail: string;
  score?: number;
}

export async function searchYoutubeTop3(query: string): Promise<YoutubeSearchResult[]> {
  try {
    // Usamos nuestra API interna (Edge Function) para evitar bloqueos por extensiones en el cliente
    // y distribuir el tráfico en la red Edge de Vercel.
    const response = await fetch(`/api/yt-search?q=${encodeURIComponent(query)}`);
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.videos || [];
  } catch (error) {
    console.error("Error searching YouTube:", error);
    return [];
  }
}
