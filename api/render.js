import express from "express";
import cors from "cors";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json({ limit: "100mb" }));

app.post("/render", async (req, res) => {
  try {
    const { audio, imagenes, formato } = req.body;

    if (!audio || !imagenes?.length)
      return res.status(400).json({ error: "Faltan datos" });

    const tempDir = "/tmp/render";
    fs.mkdirSync(tempDir, { recursive: true });

    const audioPath = path.join(tempDir, "audio.mp3");
    const audioBuffer = Buffer.from(audio, "base64");
    fs.writeFileSync(audioPath, audioBuffer);

    const listPath = path.join(tempDir, "list.txt");
    const segmentDuration = 5;
    const lines = imagenes.map((img) => `file '${img.url}'\nduration ${segmentDuration}`).join("\n");
    fs.writeFileSync(listPath, lines);

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
          formato === "9:16" ? "-vf scale=1080:1920" : "-vf scale=1920:1080"
        ])
        .save(outputPath)
        .on("end", resolve)
        .on("error", reject);
    });

    const videoData = fs.readFileSync(outputPath);
    const base64 = videoData.toString("base64");

    res.json({
      status: "ok",
      formato,
      video_base64: base64
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () => console.log("Render API activa"));