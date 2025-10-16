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
    const { audio, imagenes, formato } = req.body;

    // 🧠 Si viene un objeto, usa audio.data
    const audioBase64 =
      typeof audio === "object" && audio.data ? audio.data : audio;

    // 🪄 Decodifica el Base64 a un archivo temporal
    const audioBuffer = Buffer.from(audioBase64, "base64");
    const audioPath = path.join("/tmp", "audio.mp3");
    fs.writeFileSync(audioPath, audioBuffer);

    // 💡 Hasta aquí ya tienes el audio correcto en disco
    // (Puedes probar que funciona antes de integrar ffmpeg)
    console.log("Audio listo:", audioPath);

    res.json({
      status: "ok",
      message: "Audio recibido y decodificado correctamente",
      path: audioPath,
    });
  } catch (err) {
    console.error("Error en render:", err);
    res.status(500).json({ error: err.message });
  }
}
