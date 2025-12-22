import mongoose from "mongoose"
import { Channels } from "../models/Channels.model.js";
import { Videos } from "../models/Videos.model.js";
import { ApiResponse } from "../utlis/ApiResponse.util.js";
import { env } from "../utlis/getEnvVariable.util.js";
import { videoToHLS } from "../services/convertToHls.services.js";
import path from "path";
import  jwt from "jsonwebtoken"
import Users from "../models/Users.model.js"
import { UserOtherDetails } from "../models/UserOtherDetails.model.js";






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
        "views" : 0,
        "likes":0,
        "dislikes" :0,
        "tags":req.body?.tags //array
    }
    try{
        const video = await Videos.create(dataToSave);

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


        video.title = req.body.title?req.body.title:video.title;
        video.description = req.body.description?req.body.description:video.description;
        video.category = req.body.category?req.body.category:video.category;
        video.language = req.body.language?req.body.language:video.language;
        video.location = req.body.location?req.body.location:video.location;
        video.visibility = req.body.visibility?req.body.visibility:video.visibility;
        video.tags = req.body.tags?req.body.tags:video.tags,

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


const likeDislikeVideo = async(req,res)=>{
    const userId = req.userId;
    const check = req.body.liked;
    try{
        const videoId = req.params.videoId;
        
        const video = await Videos.findById(new mongoose.Types.ObjectId(videoId));
        if(!video){
            return res.status(504).send(new ApiResponse(504,"Video not Found"));
        }

        const userDetails = await UserOtherDetails.findOne({"user_id":new mongoose.Types.ObjectId(userId)});
        if(!userDetails){
            return res.status(504).send(new ApiResponse(504,"User Details not found"));            
        }

        

        if(new mongoose.Types.ObjectId(video._id) in userDetails.likedVideos || new mongoose.Types.ObjectId(video._id) in userDetails.disLikedVideos ){
            return res.status(200).send(new ApiResponse(200,check?"Video already Liked":"Video already disliked"),data={"like":check});
        }

        check?video.likes +=1:video.dislikes+=1;
        await video.save({validateBeforeSave:false});
        check?userDetails.likedVideos.push(new mongoose.Types.ObjectId(video._id)):userDetails.disLikedVideos.push(new mongoose.Types.ObjectId(video._id));
        await userDetails.save({validateBeforeSave:false});

        return res.status(200).send(new ApiResponse(200,check?"Video Liked":"Video disliked"),data={"like":check});


    }catch(err){
        res.status(500).send(new ApiResponse(500,err.message));
    }
}



// optional Auth
const getVideoDetails = async(req,res)=>{
    const videoId = req.params.videoId;

    const video = await Videos.findById(new mongoose.Types.ObjectId(videoId));


    if(!video  ){
        return res.status(400).send( new ApiResponse(400, "Video does not exist"));
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
        "tags":video.tags,
        "channelName" : channel.channelName,
        "description" : channel.description,
        "channelUserName" : channel.channelUserName,
        "profilePhoto" :channel.profilePhoto,
        "totalSubscriberCount" :channel.totalSubscriberCount,
        "liked":false,
        "disliked":false,
    }
    
    if(req.userId){
        
        if(video.visibility.toLowerCase()=="private" && new mongoose.Types.ObjectId(req.userId) != video.user_id){
            return res.status(401).send(new ApiResponse(401,"This is a private video"));
        }

        const userDetails = await UserOtherDetails.findOne({user_id:new mongoose.Types.ObjectId(req.userId)});
        if(new mongoose.Types.ObjectId(video._id) in userDetails.likedVideos){
            dataToSend.liked = true;
        }
        else if(new mongoose.Types.ObjectId(video._id) in userDetails.disLikedVideos){
            dataToSend.disliked = true;
        }
        userDetails.watchHisttory.push({"video_id":new mongoose.Types.ObjectId(video._id)});
        await userDetails.save({validationBeforeSave:false});

    }
    
    
   
    if((video.visibility.toLowerCase() =="private" && !req.userId)){
        return res.status(401).send(new ApiResponse(401,"This is a private video"))
    }

    try{

        video.views +=1;
        channel.totalViewCount+=1;
        await channel.save({validationBeforeSave:false});
        await video.save({validationBeforeSave:false});        
        return res.status(200).send(new ApiResponse(200,"video Details attached",dataToSend));

    }catch(err){
        return res.status(500).send(new ApiResponse(500,err.message));
    }

    
}


const getAllVideos = async(req,res)=>{
    const channelUserName = req.params.userName;

    if(!channelUserName){
        return res.status(400).send(new ApiResponse(400,"Please attach channelUserName"))
    }
    const channel = await Channels.findOne({channelUserName:channelUserName});
    if(!channel){
        return res.status(400).send( new ApiResponse(400, "Channel Does not exist"));
    }
    let owner = false;
    if(req.userId){
        const user = await  Users.findOne({_id:req.userId});
        if(user && (new mongoose.Types.ObjectId(user?._id) === new mongoose.Types.ObjectId(channel.user_id))){
            owner = true;
        }
    }
    try{
        const allVideos = await Videos.find({channel_id:channel._id});

        let videosData = [];



        allVideos.forEach(async(video)=>{
            
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
            if(video.visibility.toLowerCase() =="private" && owner){
                videosData.push(data);
            }
            else if(video.visibility.toLowerCase()=="public"){
                videosData.push(data);
            }
        })

        res.status(200).send(new ApiResponse(200,"All videos retrived successfully",videosData));

    }catch(err){
        res.status(500).send(new ApiResponse(500,err.message));
    }



}





export {uploadVideo, updateVideoDetails , updateThumbnail ,likeDislikeVideo, getVideoDetails , getAllVideos  }