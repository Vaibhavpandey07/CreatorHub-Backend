import mongoose from "mongoose"
import { Channels } from "../models/Channels.model.js";
import { Videos } from "../models/Videos.model.js";
import { ApiResponse } from "../utlis/ApiResponse.util.js";
import { env } from "../utlis/getEnvVariable.util.js";
import { videoToHLS } from "../services/convertToHls.services.js";
import path from "path";
import  jwt from "jsonwebtoken"
import Users from "../models/Users.model.js"






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
        "dateUploaded" : Date.now(),
        "location" : req.body?.location,
        "visibility" : req.body?.visibility,
    }
    try{
        const video = await Videos.create(dataToSave);
        await VideoAnalytics.create({
            user_id:new mongoose.Types.ObjectId(channel.user_id),
            video_id : new mongoose.Types.ObjectId(video._id),
            views:0,
            likes:0,
            dislike:0,
        })
        try{
            const videoConvertToHLS = new videoToHLS;
    
            videoConvertToHLS.convertToHLS(videoInputPath,videoOutputPath).then(() => console.log("Done")).catch(console.error);

            return res.status(201).send(new ApiResponse(201,`Video uploaded successfully and now it is being processed`,{"videoURL":dataToSave.videoUrl}))
        }catch(err){
            return res.status(500).send(new ApiResponse(500,err.message));

        }

    }
    catch(err){
        return res.status(500).send(new ApiResponse(500,err.message));
    }

}

const updateVideoDetails = async(req,res)=>{

    const videoId = req.body.videoId;
    const userId = new mongoose.Types.ObjectId(req.userId);
    const channel = await Channels.findOne({user_id:userId})
    if(!channel){
        return res.status(400).send( new ApiResponse(400, "Please create a channel"));
    }
    const video = await Videos.findById(new mongoose.Types.ObjectId(videoId));

    if(!video){
        return res.status(400).send( new ApiResponse(400, "Video does not exist"));
    }


    if(!(video.user_id == channel.user_id && channel._id == video.channel_id)){
        return res.status(400).send( new ApiResponse(400, "only the owner can change details of the video"));
    }
    else{
        try{


        video.title = req.body.title?req.body.title:channel.title;
        video.description = req.body.description?req.body.description:channel.description;
        video.category = req.body.category?req.body.category:channel.category;
        video.language = req.body.language?req.body.language:channel.language;
        video.location = req.body.location?req.body.location:channel.location;
        video.visibility = req.body.visibility?req.body.visibility:channel.visibility;

        await video.save({validationBeforeSave:false});
        return res.status(200).send(new ApiResponse(200,"Video Details Updated Successfully"));
        
    }
    catch(err){
        return res.status(500).send(new ApiResponse(500,err.message));
    }}
}


const updateThumbnail = async(req,res)=>{

    const videoId = req.body.videoId;
    const userId = new mongoose.Types.ObjectId(req.userId);
    const channel = await Channels.findOne({user_id:userId})
    if(!channel){
        return res.status(400).send( new ApiResponse(400, "Please create a channel"));
    }
    const video = await Videos.findById(new mongoose.Types.ObjectId(videoId));

    if(!video){
        return res.status(400).send( new ApiResponse(400, "Video does not exist"));
    }


    if(!(video.user_id == channel.user_id && channel._id == video.channel_id)){
        return res.status(400).send( new ApiResponse(400, "only the owner can change details of the video"));
    }
    else{
        try{


        video.thumbnail = `${env.UPLOAD_THUMBNAIL_FOLDER}/${req.fileName[0].name}`;

        await video.save({validationBeforeSave:false});
        return res.status(200).send(new ApiResponse(200,"Video Thumbnail Updated Successfully"));
        
    }
    catch(err){
        return res.status(500).send(new ApiResponse(500,err.message));
    }}
}


const getVideoDetails = async(req,res)=>{
    const videoId = req.params.videoId;

    const video = await Videos.findById(new mongoose.Types.ObjectId(videoId));


    if(!video  ){
        return res.status(400).send( new ApiResponse(400, "Video does not exist"));
    }

    else if(video.visibility =="private"){
    
        const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "") 
        if(!token){
            return res.status(401).send(new ApiResponse(401,"No token found"))
        }
        else{
            try{
                const payload = jwt.verify(token , env.ACCESS_TOKEN_SIGN );
                if(!payload?._id){
                    return res.status(401).send(new ApiResponse(401,"Token Invalid"))
                }
                
                const user = await Users.findById(payload?._id);
                if(!user){
                    return res.status(404).send(new ApiResponse(404, "User Does Not exsits"))
                }  
                
                req.userId = payload._id;
                if(!(new mongoose.Types.ObjectId(videoId) == video.user_id)){
                    return res.status(401).send(new ApiResponse(401,"this is a private Video")); 
                }

                const channel = await Channels.findById(new mongoose.Types.ObjectId(video.channel_id));
                if(!channel){
                    return res.status(500).send(new ApiResponse(500,"Internal server Error"));
                }
                const dataToSend= {
                    "videoUrl" : video.videoUrl,
                    "thumbnail" : video.thumbnail,
                    "title" : video.title,
                    "description" : video.description,
                    "category" : video.category,
                    "language" : video.language,
                    "dateUploaded" : video.dateUploaded,
                    "location" : video.location,
                    "views":video.views,
                    "likes":video.likes,
                    "dislikes" : video.dislikes,
                    "channelName" : channel.channelName,
                    "description" : channel.description,
                    "channelUserName" : channel.channelUserName,
                    "profilePhoto" :channel.profilePhoto,
                    "totalSubscriberCount" :channel.totalSubscriberCount
                }
                video.views +=1;
                await video.save({validationBeforeSave:false});

                return res.status(200).send(new ApiResponse(200,"video Details attached",dataToSend));


            }catch(err){
                if (err instanceof jwt.TokenExpiredError) {
                    return res.status(401).send(new ApiResponse(401,"Token Expired"))
                }
                return res.status(401).send(new ApiResponse(401,err.message))
            }
        }

    }else{

        try{
                const channel = await Channels.findById(new mongoose.Types.ObjectId(video.channel_id));
                if(!channel){
                    return res.status(500).send(new ApiResponse(500,"Internal server Error"));
                }
                const dataToSend= {
                    "videoUrl" : video.videoUrl,
                    "thumbnail" : video.thumbnail,
                    "title" : video.title,
                    "description" : video.description,
                    "category" : video.category,
                    "language" : video.language,
                    "dateUploaded" : video.dateUploaded,
                    "location" : video.location,
                    "views":video.views,
                    "likes":video.likes,
                    "dislikes" : video.dislikes,
                    "channelName" : channel.channelName,
                    "description" : channel.description,
                    "channelUserName" : channel.channelUserName,
                    "profilePhoto" :channel.profilePhoto,
                    "totalSubscriberCount" :channel.totalSubscriberCount
                }
            video.views +=1;
            await video.save({validationBeforeSave:false});        
            return res.status(200).send(new ApiResponse(200,"video Details attached",dataToSend));
        }catch(err){
            return res.status(500).send(new ApiResponse(500,err.message));
        }

    }
}


const getAllVideos = async(req,res)=>{
    const channelUserName = req.params.userName;

    if(!channelUserName){
        return res.status(400).send(new ApiResponse(400,"Please attach channelUserName"))
    }
    const channel = await Channels.findOne({channelUserName:channelUserName});
    if(!channel){
        return res.status(400).send( new ApiResponse(400, "Please create a channel"));
    }

    try{
        const allVideos = await Videos.find({channel_id:channel._id});

        let videosData = [];

        allVideos.forEach(async(video)=>{
            if(video.visibility!="private"){

                const data = {
                    "video_id":video._id,
                    "channel_id" : video.channel_id ,
                    // "videoUrl" : video.videoUrl,
                    "thumbnail" : video.thumbnail,
                    "title" : video.title,
                    "description" : video.description,
                    "category" : video.category,
                    "language" : video.language,
                    "dateUploaded" : video.dateUploaded,
                    "location" : video.location,
                    "views":video.views,
                    "likes":video.likes,
                    "dislikes" : video.dislikes,
                    "channelName" : channel.channelName,
                    "description" : channel.description,
                    "channelUserName" : channel.channelUserName,
                    "profilePhoto" :channel.profilePhoto,
                    "totalSubscriberCount" :channel.totalSubscriberCount


                }
                videosData.push(data);
            }
        })

        res.status(200).send(new ApiResponse(200,"All videos retrived successfully",videosData));

    }catch(err){
        res.status(500).send(new ApiResponse(500,err.message));
    }



}

const getAllMyChannelVideos = async(req,res)=>{
    
    const userId = new mongoose.Types.ObjectId(req.userId);
    const channel = await Channels.findOne({user_id:userId})
    
    if(!channel){
        return res.status(400).send( new ApiResponse(400, "Please create a channel"));
    }

    try{
        const allVideos = await Videos.find({channel_id:channel._id});

        let videosData = [];

        allVideos.forEach((video)=>{
            
                const data = {
                    "video_id":video._id,
                    "channel_id" : video.channel_id ,
                    // "videoUrl" : video.videoUrl,
                    "thumbnail" : video.thumbnail,
                    "title" : video.title,
                    "description" : video.description,
                    "category" : video.category,
                    "language" : video.language,
                    "dateUploaded" : video.dateUploaded,
                    "location" : video.location,
                    "visibility" :video.visibility,
                    "views":video.views,
                    "likes":video.likes,
                    "dislikes" : video.dislikes,
                    "channelName" : channel.channelName,
                    "description" : channel.description,
                    "channelUserName" : channel.channelUserName,
                    "profilePhoto" :channel.profilePhoto,
                    "totalSubscriberCount" :channel.totalSubscriberCount
                }
                videosData.push(data);
            
        })

        res.status(200).send(new ApiResponse(200,"All videos retrived successfully",videosData));

    }catch(err){
        res.status(500).send(new ApiResponse(500,err.message));
    }



}





export {uploadVideo, updateVideoDetails , updateThumbnail , getVideoDetails , getAllVideos , getAllMyChannelVideos}