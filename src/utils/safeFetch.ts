import { toast } from 'react-hot-toast';

export async function safeFetch<T = any>(
  url: string,
  options?: RequestInit
): Promise<T | null> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ Error de red:", response.status, response.statusText);
      console.error("Contenido recibido:", text.slice(0, 100));
      
      // Mostrar mensaje de error al usuario
      toast.error(`Error: ${response.statusText}`);
      return null;
    }

    const contentType = response.headers.get("Content-Type") || "";
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      console.error("❌ No es JSON válido. Contenido:", text.slice(0, 100));
      toast.error("Error: Respuesta no válida del servidor");
      return null;
    }

    return await response.json();
  } catch (error: any) {
    console.error("❌ Error inesperado:", error.message);
    toast.error(`Error: ${error.message}`);
    return null;
  }
}
