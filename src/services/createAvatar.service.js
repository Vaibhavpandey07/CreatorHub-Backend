import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";

export const createAvatar = async(inputPath, outputPath, size = 256) => {
  await new Promise((resolve, reject) => {
    if (!fs.existsSync(inputPath)) {
      return reject(new Error("Input file does not exist"));
    }

    ffmpeg(inputPath)
      .outputOptions([
        "-vf",
        `scale=${size}:${size}:force_original_aspect_ratio=increase,crop=${size}:${size}`,
        "-q:v 3"
      ])
      .on("start", (cmd) => console.log("FFmpeg: convertion Started"))
      .on("end", () => resolve(outputPath))
      .on("error", (err) => reject(err))
      .save(outputPath);
  });

  


};
