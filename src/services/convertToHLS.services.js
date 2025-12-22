import Ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import path from "path";
import fs from "fs";

Ffmpeg.setFfmpegPath(ffmpegPath);

class videoToHLS {

    constructor(){
        this.start = false;
        this.progress =0;
        this.err= false;
        this.end =false;
    };

    convertToHLS(inputPath, outputDir){
        return new Promise((resolve, reject) => {
            
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
             
            Ffmpeg(inputPath)
            .outputOptions([
        "-filter_complex",
        "[0:v]split=3[v1][v2][v3];" +
        "[v1]scale='min(1920,iw)':'min(1080,ih)'[v1out];" +
        "[v2]scale='min(1280,iw)':'min(720,ih)'[v2out];" +
        "[v3]scale='min(854,iw)':'min(480,ih)'[v3out]",

        // STREAM 1 – 1080p
        "-map", "[v1out]",
        "-map", "0:a?",
        "-c:v:0", "libx264",
        "-b:v:0", "5000k",

        // STREAM 2 – 720p
        "-map", "[v2out]",
        "-map", "0:a?",
        "-c:v:1", "libx264",
        "-b:v:1", "2800k",

        // STREAM 3 – 480p
        "-map", "[v3out]",
        "-map", "0:a?",
        "-c:v:2", "libx264",
        "-b:v:2", "1400k",

        "-c:a", "aac",
        "-hls_time", "6",
        "-hls_list_size", "0",
        "-f", "hls"
            ])
            .output(path.join(outputDir, "stream_%v.m3u8"))
            .on("start", command => {
                this.start = true;
                // console.log("FFmpeg started:", command);
            })
            .on("progress", progress => {
                this.progress = progress.percent?.toFixed(2);
                console.log(`Processing: ${progress.percent?.toFixed(2)}%`);
            })
            .on("end", () => {
                this.end = true,
                fs.unlink(inputPath, (err) => {
                    if (err) {
                    console.error("Failed to delete original file:", err);
                    } else {
                    console.log("Original file deleted:", inputPath);
                    }
                });
                console.log("HLS conversion finished");
                resolve();
            })
            .on("error", err => {
                this.err = true;
                console.error("FFmpeg error:", err);
                reject(err);
            })
            .run();
        });
    }

}


export {videoToHLS};
    