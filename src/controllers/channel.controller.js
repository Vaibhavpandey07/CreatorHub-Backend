import mongoose from 'mongoose';
import { Channels } from '../models/Channels.model.js';
import Users from '../models/Users.model.js'
import { ApiResponse } from '../utlis/ApiResponse.util.js';
import { env } from '../utlis/getEnvVariable.util.js';
import {withTransaction} from '../utlis/withTransaction.util.js';
import fs from "fs/promises"
import { UserOtherDetails } from '../models/UserOtherDetails.model.js';
import { Subscriptions } from '../models/Subscriptions.model.js';
import { Videos } from '../models/Videos.model.js';
import { Comments } from '../models/Comments.model.js';
import ApiError from '../utlis/ApiErrors.util.js';




const createChannel = async(req,res)=>{
    const user = await Users.findById(req.userId);
    if(!user){
        throw new ApiError(404, "User Does Not exist");
    }   


    const channelUserName = String(req.body.channelUserName);
    // const channel = await Channels.findOne({user_id:user._id});
    if(user.userType==2){
        throw new ApiError(400, "channel Already exist");
        
    }
    
    const channelWithUserName = await Channels.findOne({channelUserName : channelUserName});
    const channelWithUserId = await Channels.findOne({user_id : user._id});

    if(channelWithUserName){
        throw new ApiError(409, "channel user Name already taken please try a different User Name");
    }
    if(channelWithUserId){
        throw new ApiError(422, "User already have a channel",[],{channelUserName : channelWithUserId.channelUserName});
    }
    
    
    
    try{
        let filePath = "";
        if(req.fileName){
            filePath = `${env.UPLOAD_COVER_IMAGE_FOLDER}/${req.fileName[0]?.name}`
        }

        const dataToSave = {
        "channelName" : req.body.channelName,
        "user_id" : user._id ,
        "description" :req.body.description,
        "channelUserName" : channelUserName,
        "profilePhoto" : user.profilePhoto,
        "coverImage" : filePath,
        "contactInfo" : req.body.contactInfo,
        "homeTabSetting" :{'sortBy' : req.body.homeTabSetting?.sortBy},
        "totalSubscriberCount" : 0 ,
        "totalViewCount" : 0,
        
        }

        // await withTransaction(async(session)=>{
            const channel = await Channels.create([dataToSave], { });
            
            user.userType = 2;
            await user.save({validationBeforeSave :false} , {});
            return res.status(201).send(new ApiResponse(201, "Channel Created Successfully",{channelUserName:channel[0].channelUserName}));
        // })


    }catch(err){
        throw new ApiError(500, err.message);
    }



}

const updateChannelDetails = async(req,res)=>{
    const userId = new mongoose.Types.ObjectId(req.userId)
    const channel = await Channels.findOne({'user_id':userId});
    if(!channel){
        throw new ApiError(404, "User does not have a channel");
    }

    const channelUserName = req.body?.channelUserName;
    if(channelUserName){
       const channelWithUserName = await Channels.findOne({channelUserName});
       if(channelWithUserName){
           throw new ApiError(400, "channel user Name already taken please try a different User Name");
        }
    }

    
    
    try{
        const dataToSave = {
        channelName : req.body?.channelName?req.body.channelName:channel.channelName,
        description :req.body?.description?req.body.description:channel.description,
        channelUserName : channelUserName?channelUserName : channel.channelUserName,
        contactInfo : req.body?.contactInfo? req.body.contactInfo : channel.contactInfo,
        homeTabSetting : {'sortBy' : req.body?.homeTabSetting?.sortBy ? req.body?.homeTabSetting?.sortBy : channel.homeTabSetting.sortBy },
        }

        // await withTransaction(async(session)=>{
            await Channels.findOneAndUpdate({_id:channel._id},{$set : dataToSave}, { });
            return res.status(200).send(new ApiResponse(200, "Channel details updated successfully"));
        // })


    }catch(err){
        throw new ApiError(500, err.message);
    }

}



const updateChannelCoverImage  = async(req,res)=>{
    const userId = new mongoose.Types.ObjectId(req.userId)

    const channel = await Channels.findOne({'user_id':userId});
    if(!channel){
        throw new ApiError(404, "User does not have a channel");
    }
    if(!req.fileName){
        throw new ApiError(400,"Please upload a new cover Image");
    }

    try{
        
        const oldCoverImageFilePath = channel.coverImage;
         await Channels.findByIdAndUpdate({_id:channel._id},{$set : {"coverImage" : `${env.UPLOAD_COVER_IMAGE_FOLDER}/${req.fileName[0]?.name}`}});
        try{
            await fs.unlink(oldCoverImageFilePath)
        }catch(err){
            console.log(err);
        }
        
        return res.status(203).send(new ApiResponse(203, "Cover Image Updated successfully"));


    }catch(err){
        throw new ApiError(500, err.message);
    }
}

const subscribeChannel = async(req,res)=>{
    const userId = new mongoose.Types.ObjectId(req.userId)

    const channel = await Channels.findOne({channelUserName:String(req.params.userName)});
    if(!channel){
        throw new ApiError(404, "Channel does not exist");
    }

    if(userId.equals(new mongoose.Types.ObjectId(channel.user_id))){
        throw new ApiError(401, "You can not subscribe your own channel");
    }


    try{    
        const userDetails = await UserOtherDetails.findOne({user_id:userId});
        if(!(userDetails.subscribedTo.some(id=>{
            return id.equals(new mongoose.Types.ObjectId(channel._id))
        }) ) ){


            userDetails.subscribedTo.push(new mongoose.Types.ObjectId(channel._id));
            await userDetails.save({validationBeforeSave:false});
            await Subscriptions.create({subscriber_id:userId, channel_id:new mongoose.Types.ObjectId(channel._id)})

            channel.totalSubscriberCount = await Subscriptions.countDocuments({channel_id: channel._id});

            await channel.save({validationBeforeSave:false});
            return res.status(200).send(new ApiResponse(200,"Channel Subscribed",{"subscribe":true}));
        }
        
        throw new ApiError(200,"Channel already Subscribed",{"subscribe":true});

        
    }catch(err){
        throw new ApiError(500,err.message);
    }
}

const unsubscribeChannel = async(req,res)=>{
    const userId = new mongoose.Types.ObjectId(req.userId)

    const channel = await Channels.findOne({channelUserName:String(req.params.userName)});
    if(!channel){
        throw new ApiError(404, "Channel does not exist");
    }

    if(userId.equals(new mongoose.Types.ObjectId(channel._id))){
        throw new ApiError(401, "You can not unsubscribe your own channel");
    }
    try{    
        const userDetails = await UserOtherDetails.findOne({user_id:userId});
        console.log(userDetails.subscribedTo);
        if(userDetails.subscribedTo.some(id=>{
            return id.equals(new mongoose.Types.ObjectId(channel._id));
        })){
            
            await Subscriptions.findOneAndDelete({subscriber_id:userId, channel_id:new mongoose.Types.ObjectId(channel._id)});

            await UserOtherDetails.findOneAndUpdate({user_id:userId},{$pull:{subscribedTo:channel._id}})

            channel.totalSubscriberCount = await Subscriptions.countDocuments({channel_id: channel._id});
            await channel.save({validationBeforeSave:false});
            return res.status(200).send(new ApiResponse(200,"Channel Unsubscribed",{"subscribe":false}));

        }
         throw new ApiError(200,"Channel already Unsubscribed",{"subscribe":false});
        
    }catch(err){
        throw new ApiError(500,err.message);
    }
}

const getMyChannelDetails = async(req,res)=>{
    const userId = new mongoose.Types.ObjectId(req.userId)

    const channel = await Channels.findOne({user_id:userId});

    if(!channel){
        throw new ApiError(404, "Channel does not exist");
    }

    try{

        const dataToSend = {
            "channelName" : channel.channelName ,
            "description" : channel.description ,
            "channelUserName" : channel.channelUserName ,
            "profilePhoto" : channel.profilePhoto ,
            "coverImage" : channel.coverImage ,
            "contactInfo" : channel.contactInfo ,
            "homeTabSetting" : channel.homeTabSetting ,
            "totalSubscriberCount" : channel.totalSubscriberCount ,
            "totalViewCount" : channel.totalViewCount,
            "owner":true 
        };

        
        return res.status(200).send(new ApiResponse(200, "Channel Details" , dataToSend ));

    }catch(err){
        throw new ApiError(500,err.message);
    }
}




// optionalAuth
const getChannelDetails = async(req,res)=>{
    // console.log(req.params.userName);
    // const userId = new mongoose.Types.ObjectId(req.userId)
    try{

        
        const channel = await Channels.findOne({channelUserName:String(req.params.userName)});
        if(!channel){
            throw new ApiError(404, "Channel Does Not exist");
        }
        const dataToSend = {
            "channelName" : channel.channelName ,
            "description" : channel.description ,
            "channelUserName" : channel.channelUserName ,
            "profilePhoto" : channel.profilePhoto ,
            "coverImage" : channel.coverImage ,
            "contactInfo" : channel.contactInfo ,
            "homeTabSetting" : channel.homeTabSetting ,
            "totalSubscriberCount" : channel.totalSubscriberCount ,
            "totalViewCount" : channel.totalViewCount, 
        };
        if(req.userId){
            const userDetails = await UserOtherDetails.findOne({user_id:req.userId});
            
            if(userDetails && (userDetails.subscribedTo.some(id =>{
                
                return id.equals(new mongoose.Types.ObjectId(channel._id))} )) ) 
            {
                dataToSend.subscribe = true;
            }else {
                dataToSend.subscribe =false;
            }
        }
        
        
        
        return res.status(200).send(new ApiResponse(200, "Channel Details" , dataToSend ));

    }catch(err){
        throw new ApiError(500,err.message);
    }
}

const removeChannel= async(req,res)=>{
    const user = await Users.findById({_id:req.userId})
    if(!user){
        throw new ApiError(400,"User does not exist");
    }
    if(user.userType == 1) {
        throw new ApiError(400,"User does not have a channel");
    }
    
    const channel = await Channels.findOne({user_id:user._id});
    
    if(!channel){
        throw new ApiError(404, "Channel does not exist");
    }


    try{
        
        const allVideos = await Videos.find({channel_id:channel._id});
        const channelVideoIds = await Promise.all( allVideos.map(async(video)=>{
           
            try{
                fs.rm(video.videoPath, { recursive: true, force: true });
                fs.unlink(video.thumbnail);
            }catch(err){
                console.error("Failed to delete original file:", err);
    
            }
            
            await Comments.deleteMany({video_id:video._id});
            return video._id;
            })
        )
        await Videos.deleteMany({_id:{$in :channelVideoIds}});
        await Subscriptions.deleteMany({channel_id:channel._id});

        try{
            fs.unlink(channel.coverImage)
        }catch(err){
            console.error("Failed to delete original file:", err);
        }
        
        await Channels.deleteOne({_id:channel._id});
        
        user.userType=1;
        await user.save({validationBeforeSave:false});
        
        return res.status(200).send(new ApiResponse(200,"Channel Deleted Successfully"));
        

    }catch(err){
        throw new ApiError(500,err.message);
    }



}

const mostSubscribedChannels = async(req,res)=>{
    try{
        let userDetails = null;
        if(req.userId){
            userDetails = await UserOtherDetails.findOne({user_id:new mongoose.Types.ObjectId(req.userId)});    
        }
        const channelResult = Channels.aggregate([
            {$sort : {totalSubscriberCount : 1}},
            {$limit : 20},
            {$project : {
               
            channelName : 1 ,
            description :1,
            channelUserName : 1,
            profilePhoto : 1,
            coverImage : 1,
            contactInfo :1,
            totalSubscriberCount :1,
            totalViewCount :1,
            
            }}
        ])

        const dataToSend = (await channelResult).map((channel)=>{
            if(userDetails){
                console.log(userDetails.subscribedTo)
                if(userDetails.subscribedTo.some((id)=>{
                    return id.equals(channel._id);
                })){
                    channel.subscribe = true;
                }else{
                    channel.subscribe = false;
                }
            }
            delete channel._id;
            return channel;
        })

        res.status(200).send(new ApiResponse(200, "Most Subscribe Channel",dataToSend));

    }catch(err){
       throw new ApiError(500,err.message);
    }
}

export {createChannel, updateChannelDetails, updateChannelCoverImage , getChannelDetails, subscribeChannel,unsubscribeChannel , removeChannel , mostSubscribedChannels , getMyChannelDetails}