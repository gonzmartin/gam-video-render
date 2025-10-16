export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { audio, imagenes, formato } = req.body;

    if (!audio || !imagenes?.length) {
      return res.status(400).json({ error: "Faltan datos (audio o imágenes)" });
    }

    // Simulación del proceso de render
    console.log("Recibido audio:", audio.substring(0, 30) + "...");
    console.log("Imágenes:", imagenes.length);
    console.log("Formato:", formato);

    res.status(200).json({
      status: "ok",
      mensaje: "Render simulado correctamente",
      formato,
      video_url: "https://ejemplo.com/video.mp4"
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
