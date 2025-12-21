import mongoose from "mongoose"
import { Channels } from "../models/Channels.model.js";
import { ApiResponse } from "../utlis/ApiResponse.util.js";
import { env } from "../utlis/getEnvVariable.util.js";
import { videoToHLS } from "../services/convertToHls.services.js";
import path from "path";

const uploadVideo = async(req,res)=>{
    const userId = new mongoose.Types.ObjectId(req.userId);
    const channel = await Channels.findOne({user_id:userId})
    if(!channel){
        return res.status(400).send( new ApiResponse(400, "Please create a channel to Upload Videos"));
    }
    if(!req.fileName){
        return res.status(400).send( new ApiResponse(400, "Please upload video"));
    }


    // let thumbnailPath = `${env.UPLOAD_THUMBNAIL_FOLDER}/` ;
    let videoDetails = {};
    let thumbnailDetails = {};
    
    
    for( let i =0;i<req.fileName.length;i++){
        if(req.fileName[i].type == "video"){
            // videoPath +=req.fileName[i].name;
            videoDetails = req.fileName[i];
        }
        else if(req.fileName[i].type == "thumbnail"){
            // thumbnailPath +=req.fileName[i].name;
            thumbnailDetails = req.fileName[i];
            
        }
    }
    const videoInputPath = `${env.UPLOAD_VIDEO_FOLDER}/${videoDetails?.name}`;
    const fileUniqueName = path.parse(videoDetails?.name).name;
    const videoOutputPath = `${env.UPLOAD_HLS_FOLDER}/${fileUniqueName}`

    const dataToSave = {
        "user_id" : new mongoose.Types.ObjectId(channel.user_id) ,
        "channel_id" : new mongoose.Types.ObjectId(channel._id) ,
        "videoUrl" : `${videoOutputPath}/stream_0.m3u8`,
        "thumbnail" : `${env.UPLOAD_THUMBNAIL_FOLDER}/${thumbnailDetails.name}`,
        "title" : req.body?.title,
        "description" : req.body?.description,
        "category" : req.body?.category,
        "language" : req.body?.language,
        "dateUploaded" : req.body?.dateUploaded,
        "location" : req.body?.location,
        "visibility" : req.body?.visibility,
    }
    
    const videoConvertToHLS = new videoToHLS;
    
    videoConvertToHLS.convertToHLS(videoInputPath,videoOutputPath).then(() => console.log("Done")).catch(console.error);

    return res.send(dataToSave);
}

export {uploadVideo}