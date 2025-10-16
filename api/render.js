import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { audio, imagenes, formato } = req.body;

    if (!audio || !imagenes?.length) {
      return res.status(400).json({ error: "Faltan datos (audio o imágenes)" });
    }

    const tempDir = "/tmp/render";
    fs.mkdirSync(tempDir, { recursive: true });

    // Guardar audio
    const audioPath = path.join(tempDir, "audio.mp3");
    const audioBuffer = Buffer.from(audio, "base64");
    fs.writeFileSync(audioPath, audioBuffer);

    // Crear archivo de lista para ffmpeg
    const listPath = path.join(tempDir, "list.txt");
    const segmentDuration = 5;
    const lines = imagenes
      .map((img) => `file '${img.url}'\nduration ${segmentDuration}`)
      .join("\n");
    fs.writeFileSync(listPath, lines);

    // Salida
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

    // Convertir a base64
    const videoData = fs.readFileSync(outputPath);
    const base64 = videoData.toString("base64");

    res.status(200).json({
      status: "ok",
      formato,
      video_base64: base64,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
