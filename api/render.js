import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { audio, imagenes = [], formato = "9:16" } = req.body;

    // 🧠 Audio Base64 → archivo temporal
    const audioBase64 =
      typeof audio === "object" && audio.data ? audio.data : audio;
    const audioBuffer = Buffer.from(audioBase64, "base64");
    const audioPath = path.join("/tmp", "audio.mp3");
    fs.writeFileSync(audioPath, audioBuffer);

    // 📸 Crear lista temporal con las imágenes
    const listPath = path.join("/tmp", "list.txt");
    const listContent = imagenes
      .map((img) => `file '${img.url}'\nduration ${img.fin - img.inicio}`)
      .join("\n");
    fs.writeFileSync(listPath, listContent);

    const outputPath = path.join("/tmp", "video.mp4");

    // 🎬 Generar vídeo con ffmpeg
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(listPath)
        .inputOptions(["-f concat", "-safe 0"])
        .input(audioPath)
        .outputOptions([
          "-vf",
          formato === "9:16"
            ? "scale=1080:1920:force_original_aspect_ratio=decrease"
            : "scale=1920:1080:force_original_aspect_ratio=decrease",
          "-shortest",
        ])
        .on("end", resolve)
        .on("error", reject)
        .save(outputPath);
    });

    res.json({
      status: "ok",
      message: "Vídeo renderizado correctamente",
      video_url: outputPath,
    });
  } catch (err) {
    console.error("❌ Error en render:", err);
    res.status(500).json({ error: err.message });
  }
}
