export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { audio, imagenes, formato } = req.body || {};

  if (!audio || !imagenes?.length) {
    return res.status(400).json({ error: "Faltan datos (audio o imágenes)" });
  }

  res.status(200).json({
    status: "ok",
    mensaje: "Render simulado correctamente",
    formato,
    video_url: "https://ejemplo.com/video.mp4"
  });
}
