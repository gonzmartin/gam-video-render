import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { audio, imagenes, formato } = req.body;

    if (!audio || !imagenes?.length) {
      return res.status(400).json({ error: "Faltan datos (audio o imágenes)" });
    }

    // 🧠 Crear carpeta temporal
    const tempDir = "/tmp/render";
    fs.mkdirSync(tempDir, { recursive: true });

    // 🎵 Guardar audio recibido (base64)
    const audioPath = path.join(tempDir, "audio.mp3");
    fs.writeFileSync(audioPath, Buffer.from(audio, "base64"));

    // 🖼️ Crear lista de imágenes para ffmpeg
    const listPath = path.join(tempDir, "list.txt");
    const segmentDuration = 5; // segundos por imagen
    const lines = imagenes
      .map((img) => `file '${img.url}'\nduration ${segmentDuration}`)
      .join("\n");
    fs.writeFileSync(listPath, lines);

    // 🎬 Generar video
    const outputPath = path.join(tempDir, "output.mp4");

    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(listPath)
        .inputOptions(["-f concat", "-safe 0"])
        .input(audioPath)
        .outputOptions([
          "-c:v libx264",
          "-c:a aac",
          "-shortest",
          formato === "9:16"
            ? "-vf scale=1080:1920"
            : "-vf scale=1920:1080"
        ])
        .save(outputPath)
        .on("end", resolve)
        .on("error", reject);
    });

    // 📦 Leer y convertir a base64
    const videoBase64 = fs.readFileSync(outputPath).toString("base64");

    res.status(200).json({
      status: "ok",
      mensaje: "Render generado correctamente",
      video_base64: videoBase64
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
}
