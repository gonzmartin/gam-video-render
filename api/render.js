import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { audio, imagenes = [], formato = "9:16" } = req.body;

    // 🎧 1. Procesar audio Base64 (viene directo o dentro de un objeto)
    const audioBase64 =
      typeof audio === "object" && audio.data ? audio.data : audio;
    if (!audioBase64) throw new Error("Audio no recibido o vacío");

    const audioBuffer = Buffer.from(audioBase64, "base64");
    const audioPath = path.join("/tmp", "audio.mp3");
    fs.writeFileSync(audioPath, audioBuffer);
    console.log("✅ Audio guardado:", audioPath);

    // 📸 2. Descargar imágenes temporalmente a /tmp
    const localImages = [];
    for (let i = 0; i < imagenes.length; i++) {
      const img = imagenes[i];
      const response = await fetch(img.url);
      if (!response.ok) throw new Error(`Error al descargar imagen ${i}`);
      const buffer = await response.arrayBuffer();
      const localPath = path.join("/tmp", `img_${i}.jpg`);
      fs.writeFileSync(localPath, Buffer.from(buffer));
      localImages.push({
        path: localPath,
        duracion: img.fin - img.inicio,
      });
    }

    if (localImages.length === 0)
      throw new Error("No se recibieron imágenes válidas");

    // 🧾 3. Crear list.txt con formato concat correcto
    const listPath = path.join("/tmp", "list.txt");
    const listContent =
      localImages
        .map(
          (img) =>
            `file '${img.path.replace(/'/g, "'\\''")}'\nduration ${img.duracion}`
        )
        .join("\n") + "\n"; // ⚠️ línea vacía final obligatoria

    fs.writeFileSync(listPath, listContent, "utf8");
    console.log("✅ Archivo list.txt creado correctamente");
    console.log(listContent);

    // 🎬 4. Generar vídeo con ffmpeg
    const outputPath = path.join("/tmp", "video.mp4");

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
        .on("start", (cmd) => console.log("🎥 ffmpeg cmd:", cmd))
        .on("end", resolve)
        .on("error", reject)
        .save(outputPath);
    });

    console.log("✅ Render finalizado correctamente");

    // 📦 5. Devolver resultado
    res.json({
      status: "ok",
      message: "🎬 Vídeo renderizado correctamente",
      video_path: outputPath,
    });
  } catch (err) {
    console.error("❌ Error en render:", err);
    res.status(500).json({ error: err.message });
  }
}
