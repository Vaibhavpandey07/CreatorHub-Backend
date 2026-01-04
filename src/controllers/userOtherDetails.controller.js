import mongoose from "mongoose";
import { Channels } from "../models/Channels.model.js";
import { UserOtherDetails } from "../models/UserOtherDetails.model.js";
import Users from "../models/Users.model.js";
import { Videos } from "../models/Videos.model.js";
import { ApiResponse } from "../utlis/ApiResponse.util.js";
import ApiError from "../utlis/ApiErrors.util.js";


const getWatchHistory = async(req , res )=>{
    const userId = req.userId;
    const user = await UserOtherDetails.findOne({user_id:userId});
    const videosList = await Videos.find( {_id:{$in : user.watchHisttory}} );
    

    try {

        const videosData = await Promise.all( videosList.map(async(video)=>{
                
                const channel = await Channels.findById(video.channel_id);
                
                const dataToSend = {
                    "video_id":video._id,
                    // "channel_id" : video.channel_id ,
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
                
                // videosData.push(data); 
                return dataToSend;  
            })
        )
            
        
        
        res.status(200).send(new ApiResponse(200,"All videos retrived successfully",videosData));


    }catch(err){
        throw new ApiError(500,err.message);
    }

}

const getLikedVideos = async(req , res )=>{
    const userId = req.userId;
    const user = await UserOtherDetails.findOne({user_id:userId});
    const videosList = await Videos.find( {_id:{$in : user.likedVideos}} );
    

    try {

        const videosData = await Promise.all( videosList.map(async(video)=>{
        
            const channel = await Channels.findById(video.channel_id);
            
            const dataToSend = {
                "video_id":video._id,
                // "channel_id" : video.channel_id ,
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
        
            // videosData.push(data); 
            return dataToSend;  
            })
        )
        res.status(200).send(new ApiResponse(200,"All videos retrived successfully",videosData));


    }catch(err){
        throw new ApiError(500,err.message);
    }

}

const getSubscribedChannels = async(req,res)=>{
    const userId = req.userId;
    const user = await UserOtherDetails.findOne({user_id:userId});
    const channelList = await Channels.find( {_id:{$in : user.subscribedTo}} );
    

    try {

        const channelData = await Promise.all(channelList.map(async(channel)=>{
            
                
                
                const dataToSend = {
                    "channelName" : channel.channelName ,
                    "description" : channel.description ,
                    "channelUserName" : channel.channelUserName ,
                    "profilePhoto" : channel.profilePhoto ,
                    "totalSubscriberCount" : channel.totalSubscriberCount ,
                    "totalViewCount" : channel.totalViewCount, 
                };
                return dataToSend  
            })
        )

        res.status(200).send(new ApiResponse(200,"All channels retrived successfully",channelData));


    }catch(err){
        throw new ApiError(500,err.message);
    }

}

const getNotification = async(req,res)=>{
    try{
        const userId = req.userId;
        const user = await UserOtherDetails.findOne({user_id:userId});
        const data= user.notification;
        res.status(200).send(new ApiResponse(200,"notification",data));

    }catch(err){
        throw new ApiError(500,err.message);

    }
}

const clearWatchHistory = async(req,res)=>{
    try{
        const userId = req.userId;
        const user = await UserOtherDetails.findOne({user_id:userId});
        user.watchHisttory = [];
        await user.save({validationBeforeSave:false});
        res.status(200).send(new ApiResponse(200,"all Videos Removed from watch History"));


    }catch(err){
        throw new ApiError(500,err.message);

    }
}

const removeFromWatchHistory = async(req,res)=>{
    try{
        const userId = req.userId;
        const videoId = new mongoose.Types.ObjectId(req.params.videoId);
        await UserOtherDetails.findOneAndUpdate({user_id:userId},{$pull:{watchHisttory:videoId}});
        res.status(200).send(new ApiResponse(200,"Video Removed from watch History"));
    }catch(err){
        throw new ApiError(500,err.message);

    }
}



export {getWatchHistory, getLikedVideos , getSubscribedChannels, getNotification , clearWatchHistory , removeFromWatchHistory};