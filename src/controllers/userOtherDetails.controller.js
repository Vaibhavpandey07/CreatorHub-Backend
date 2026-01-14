import mongoose from "mongoose";
import { Channels } from "../models/Channels.model.js";
import { UserOtherDetails } from "../models/UserOtherDetails.model.js";
import Users from "../models/Users.model.js";
import { Videos } from "../models/Videos.model.js";
import { ApiResponse } from "../utlis/ApiResponse.util.js";
import ApiError from "../utlis/ApiErrors.util.js";


const getWatchHistory = async(req , res )=>{
    const userId = req.userId;
    const page = parseInt(req.query.page)|| 1;
    const limit = parseInt(req.query.limit) || 10;

    const user = await UserOtherDetails.findOne({user_id:userId});
    if(!user){
        throw new ApiError(500,"Unable to find UserDetails")
    }

    
    

    try {

        const skip = (page-1)*limit;


        const videoIds = user.watchHistory.map(item => item.video);

        const results = await Videos.aggregate([
            {$match:{_id:{$in : videoIds}} },
            {$sort:{updatedAt:-1}},
            {$skip :skip},
            {$limit : limit+1},

            {$lookup : {
                from : "channels",
                localField :"channel_id",
                foreignField:"_id",
                as : "channel"
            }},

            {$unwind :"$channel"},

            {$project : {
                _id:0,
                video_id: "$_id",
                thumbnail:1,
                title:1,
                description:1,
                category:1,
                language:1,
                dateUploaded:1,
                location:1,
                views:1,
                likes:1,
                dislikes:1,
                channelName :"$channel.channelName",
                channelDescription : "$channel.description",
                channelUserName : "$channel.channelUserName",
                profilePhoto : "$channel.profilePhoto",
                totalSubscriberCount : "$channel.totalSubscriberCount"
            }

            }
        ]
    )


        const hasMore = results.length>limit?true:false;
        if(hasMore){results.pop()};



        res.status(200).send(new ApiResponse(200,(results.length>0)?" Results found":" Results not Found",{"data" : results,"hasMore":hasMore,page,limit}));


    }catch(err){
        throw new ApiError(500,err.message);
    }


}

const getLikedVideos = async(req , res )=>{
    const userId = req.userId;
    const page = parseInt(req.query.page)|| 1;
    const limit = parseInt(req.query.limit) || 10;

    const user = await UserOtherDetails.findOne({user_id:userId});
    if(!user){
        throw new ApiError(500,"Unable to find UserDetails")
    }

    
    

    try {

        const skip = (page-1)*limit;



        const results = await Videos.aggregate([
            {$match:{_id:{$in : user.likedVideos}} },
            {$skip :skip},
            {$limit : limit+1},

            {$lookup : {
                from : "channels",
                localField :"channel_id",
                foreignField:"_id",
                as : "channel"
            }},

            {$unwind :"$channel"},

            {$project : {
                _id:0,
                video_id: "$_id",
                thumbnail:1,
                title:1,
                description:1,
                category:1,
                language:1,
                dateUploaded:1,
                location:1,
                views:1,
                likes:1,
                dislikes:1,
                channelName :"$channel.channelName",
                channelDescription : "$channel.description",
                channelUserName : "$channel.channelUserName",
                profilePhoto : "$channel.profilePhoto",
                totalSubscriberCount : "$channel.totalSubscriberCount"
            }

            }
        ]
    )


        const hasMore = results.length>limit?true:false;
        if(hasMore){results.pop()};



        res.status(200).send(new ApiResponse(200,(results.length>0)?" Results found":" Results not Found",{"data" : results,"hasMore":hasMore,page,limit}));


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
                    "coverImage" :channel.coverImage,
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
        user.watchHistory = [];
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
        await UserOtherDetails.findOneAndUpdate({user_id:userId},{$pull:{watchHistory:{ video: videoId } }});
        res.status(200).send(new ApiResponse(200,"Video Removed from watch History"));
    }catch(err){
        throw new ApiError(500,err.message);

    }
}



export {getWatchHistory, getLikedVideos , getSubscribedChannels, getNotification , clearWatchHistory , removeFromWatchHistory};