export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { audio, imagenes, formato } = req.body;

    if (!audio || !imagenes?.length) {
      return res.status(400).json({ error: "Faltan datos (audio o imágenes)" });
    }

    // --- Webhook de n8n (ajústalo con tu URL real) ---
    const N8N_WEBHOOK = "https://tu-dominio-n8n.com/webhook/render-video";

    // --- Enviar a n8n ---
    const response = await fetch(N8N_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audio, imagenes, formato }),
    });

    // --- Leer respuesta del flujo ---
    const data = await response.json();

    return res.status(200).json({
      status: "ok",
      mensaje: "Render enviado a n8n correctamente",
      resultado: data,
    });
  } catch (error) {
    console.error("Error en el proxy:", error);
    return res.status(500).json({ error: error.message });
  }
}
