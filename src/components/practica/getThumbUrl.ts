/**
 * Optimiza la URL de una carátula de mzstatic (Apple Music) al tamaño pedido.
 * Apple genera cualquier tamaño del lado del servidor cambiando el segmento
 * final `/600x600bb.jpg` por `/{size}x{size}bb.jpg`, así pedimos exactamente
 * lo que se muestra (evita descargar 600x600 para una carátula de 52px).
 */
export function getThumbUrl(url: string, size: number): string {
  if (!url) return url;
  return url.replace(
    /\/(\d+)x\1(?:[a-z]+)?\.(?:jpg|png)$/i,
    `/${size}x${size}bb.jpg`
  );
}
