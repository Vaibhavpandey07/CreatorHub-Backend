import mongoose from "mongoose"
import { Channels } from "../models/Channels.model.js";
import { ApiResponse } from "../utlis/ApiResponse.util.js";
import { env } from "../utlis/getEnvVariable.util.js";

const uploadVideo = async(req,res)=>{
    const userId = new mongoose.Types.ObjectId(req.userId);
    const channel = await Channels.findOne({user_id:userId})
    if(!channel){
        return res.status(400).send( new ApiResponse(400, "Please create a channel to Upload Videos"));
    }
    if(!req.fileName){
        return res.status(400).send( new ApiResponse(400, "Please upload video"));
    }


    let videoPath = `${env.UPLOAD_VIDEO_FOLDER}/`;
    let thumbnailPath = `${env.UPLOAD_THUMBNAIL_FOLDER}/` ;

    for( let i =0;i<req.fileName.length;i++){
        if(req.fileName[i].type == "video"){
            videoPath +=req.fileName[i].name;
        }
        else if(req.fileName[i].type == "thumbnail"){
            thumbnailPath +=req.fileName[i].name;
        }
    }


    const dataToSave = {
    "user_id" : new mongoose.Types.ObjectId(channel.user_id) ,
    "channel_id" : new mongoose.Types.ObjectId(channel._id) ,
    "videoSegment480p" : videoPath,
    "videoSegment720p" : "videoSegment720p",
    "videoSegment1080p" : "videoSegment1080p",
    "thumbnail" : thumbnailPath,
    "title" : req.body?.title,
    "description" : req.body?.description,
    "category" : req.body?.category,
    "language" : req.body?.language,
    "dateUploaded" : req.body?.dateUploaded,
    "location" : req.body?.location,
    "visibility" : req.body?.visibility,
    }
    console.log(req.file?.path);
    return res.send(dataToSave);
}

export {uploadVideo}