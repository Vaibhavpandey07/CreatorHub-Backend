// import Ffmpeg from "fluent-ffmpeg";
// import ffmpegPath from "ffmpeg-static";
// import path from "path";
// import fs from "fs";

// Ffmpeg.setFfmpegPath(ffmpegPath);

// class videoToHLS {

//     constructor(){
//         this.start = false;
//         this.progress =0;
//         this.err= false;
//         this.end =false;
//     };

//     convertToHLS(inputPath, outputDir){
//         return new Promise((resolve, reject) => {
            
//             if (!fs.existsSync(outputDir)) {
//                 fs.mkdirSync(outputDir, { recursive: true });
//             }
             
//             Ffmpeg(inputPath)
//             .outputOptions([
//         "-filter_complex",
//         "[0:v]split=3[v1][v2][v3];" +
//         "[v1]scale='min(1920,iw)':'min(1080,ih)'[v1out];" +
//         "[v2]scale='min(1280,iw)':'min(720,ih)'[v2out];" +
//         "[v3]scale='min(854,iw)':'min(480,ih)'[v3out]",

//         // STREAM 1 – 1080p
//         "-map", "[v1out]",
//         "-map", "0:a?",
//         "-c:v:0", "libx264",
//         "-b:v:0", "5000k",

//         // STREAM 2 – 720p
//         "-map", "[v2out]",
//         "-map", "0:a?",
//         "-c:v:1", "libx264",
//         "-b:v:1", "2800k",

//         // STREAM 3 – 480p
//         "-map", "[v3out]",
//         "-map", "0:a?",
//         "-c:v:2", "libx264",
//         "-b:v:2", "1400k",

//         "-c:a", "aac",
//         "-hls_time", "6",
//         "-hls_list_size", "0",
//         "-f", "hls"
//             ])
//             .output(path.join(outputDir, "stream_%v.m3u8"))
//             .on("start", command => {
//                 this.start = true;
//                 // console.log("FFmpeg started:", command);
//             })
//             .on("progress", progress => {
//                 this.progress = progress.percent?.toFixed(2);
//                 console.log(`Processing: ${progress.percent?.toFixed(2)}%`);
//             })
//             .on("end", () => {
//                 this.end = true,
//                 fs.unlink(inputPath, (err) => {
//                     if (err) {
//                     console.error("Failed to delete original file:", err);
//                     } else {
//                     console.log("Original file deleted:", inputPath);
//                     }
//                 });
//                 console.log("HLS conversion finished");
//                 resolve();
//             })
//             .on("error", err => {
//                 this.err = true;
//                 console.error("FFmpeg error:", err);
//                 reject(err);
//             })
//             .run();
//         });
//     }

// }


// export {videoToHLS};
    

import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import fs from "fs";
import path from "path";
import { UploadedVideos } from "../models/UploadedVideos.model.js";

ffmpeg.setFfmpegPath(ffmpegPath);

class videoToHLS {

        constructor(){
        this.start = false;
        this.progress =0;
        this.err= false;
        this.end =false;
    };
  async convertToHLS(videoId,inputPath, outputDir) {


      // CREATE DIRECTORIES FIRST
      ["1080p", "720p", "480p"].forEach(dir => {
        const fullPath = path.join(outputDir, dir);
        if (!fs.existsSync(fullPath)) {
          fs.mkdirSync(fullPath, { recursive: true });
        }
      });

      const renditions = [
        { name: "1080p", w: 1920, h: 1080, br: "5000k" },
        { name: "720p",  w: 1280, h: 720,  br: "2800k" },
        { name: "480p",  w: 854,  h: 480,  br: "1400k" },
        ];

    for (const r of renditions) {
        const uploadVideoDetails = await UploadedVideos.findById(videoId)
        let lastSavedProgress = uploadVideoDetails.processingPercentage;
         let thisVideoPercent =0;

    await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
        .videoCodec("libx264")
        .size(`${r.w}x${r.h}`)
        .outputOptions([
            "-preset veryfast",
            `-b:v ${r.br}`,
            "-c:a aac",
            "-hls_time 6",
            "-hls_playlist_type vod",
            "-hls_list_size 0",
            "-hls_flags independent_segments"
        ])
        .output(`${outputDir}/${r.name}/index.m3u8`)
        .on("start", command => {
                this.start = true;
                // console.log("FFmpeg started:", command);
            })
        .on("progress", async(progress) => {

            const current = Math.floor(progress.percent);

            const percentDiff = current - thisVideoPercent;
    
            if (percentDiff >= 9 || current === 100) {

                thisVideoPercent = current;
                

                await UploadedVideos.updateOne(
                { _id: videoId },
                {
                    processingPercentage: Math.floor(lastSavedProgress+(current/renditions.length)),
                }
                );
            }
            })
        .on("end", () => {
            this.end = true,
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

    const master = 
`#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
1080p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720
720p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=854x480
480p/index.m3u8`;

    fs.writeFileSync(`${outputDir}/master.m3u8`, master.trim());


    await UploadedVideos.updateOne(
    { _id: videoId },
    {
        processingPercentage: 100,
    }
    );

     
    
}
}
export { videoToHLS };

