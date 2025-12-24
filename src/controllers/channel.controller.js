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




const createChannel = async(req,res)=>{
    const user = await Users.findById(req.userId);
    if(!user){
        return res.status(404).send(new ApiResponse(404, "User Does Not exist"))
    }   


    const channelUserName = req.body.channelUserName;
    // const channel = await Channels.findOne({user_id:user._id});
    if(user.userType==2){
        return res.status(400).send(new ApiResponse(400, "channel Already exist"))
        
    }
    
    const channelWithUserName = await Channels.findOne({channelUserName});
    if(channelWithUserName){
        return res.status(400).send(new ApiResponse(400, "channel user Name already taken please try a different User Name"))
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
            await Channels.create([dataToSave], { });
            user.userType = 2;
            await user.save({validationBeforeSave :false} , {});
            return res.status(201).send(new ApiResponse(201, "Channel Created Successfully"));
        // })


    }catch(err){
        return res.status(500).send(new ApiResponse(500, err.message));
    }



}

const updateChannelDetails = async(req,res)=>{
    const userId = new mongoose.Types.ObjectId(req.userId)
    const channel = await Channels.findOne({'user_id':userId});
    if(!channel){
        return res.status(404).send(new ApiResponse(404, "User does not have a channel"));
    }

    const channelUserName = req.body?.channelUserName;
    if(channelUserName){
       const channelWithUserName = await Channels.findOne({channelUserName});
       if(channelWithUserName){
           return res.status(400).send(new ApiResponse(400, "channel user Name already taken please try a different User Name"))
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
        return res.status(500).send(new ApiResponse(500, err.message));
    }

}



const updateChannelCoverImage  = async(req,res)=>{
    const userId = new mongoose.Types.ObjectId(req.userId)

    const channel = await Channels.findOne({'user_id':userId});
    if(!channel){
        return res.status(404).send(new ApiResponse(404, "User does not have a channel"));
    }
    if(!req.fileName){
        return res.status(400).send(new ApiResponse(400,"Please upload a new cover Image"))
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
        return res.status(500).send(new ApiResponse(500, err.message));
    }
}

const subscribeChannel = async(req,res)=>{
    const userId = new mongoose.Types.ObjectId(req.userId)

    const channel = await Channels.findOne(req.params.userName);
    if(!channel){
        return res.status(404).send(new ApiResponse(404, "Channel does not exist"));
    }
    if(new mongoose.Types.ObjectId(channel.user_id) === userId){
        return res.status(401).send(new ApiResponse(401, "You can not subscribe your own channel"));
    }
    try{    
        const userDetails = await UserOtherDetails.findOne({user_id:userId});
        if(!(new mongoose.Types.ObjectId(channel._id) in userDetails.subscribedTo)){
            userDetails.subscribedTo.push(new mongoose.Types.ObjectId(channel._id));
            await userDetails.save({validationBeforeSave:false});
            await Subscriptions.create({subscriber_id:userId, channel_id:new mongoose.Types.ObjectId(channel._id)})

            channel.totalSubscriberCount = await Subscriptions.countDocuments({channel_id: channel._id});

            await channel.save({validationBeforeSave:false});
            return res.status(200).send(new ApiResponse(200,"Channel Subscribed",{"subscribe":true}));
        }
        
        return res.status(200).send(new ApiResponse(200,"Channel already Subscribed",{"subscribe":true}));

        
    }catch(err){
        return res.status(500).send(new ApiResponse(500,err.message));
    }
}

const unsubscribeChannel = async(req,res)=>{
    const userId = new mongoose.Types.ObjectId(req.userId)

    const channel = await Channels.findOne(req.params.userName);
    if(!channel){
        return res.status(404).send(new ApiResponse(404, "Channel does not exist"));
    }
    if(new mongoose.Types.ObjectId(channel.user_id) === userId){
        return res.status(401).send(new ApiResponse(401, "You can not unsubscribe your own channel"));
    }
    try{    
        const userDetails = await UserOtherDetails.findOne({user_id:userId});
        if((new mongoose.Types.ObjectId(channel._id) in userDetails.subscribedTo)){
            
            await Subscriptions.findOneAndDelete({subscriber_id:userId, channel_id:new mongoose.Types.ObjectId(channel._id)});

            await UserOtherDetails.findOneAndUpdate({user_id:userId},{$pull:{subscribedTo:channel._id}})

            channel.totalSubscriberCount = await Subscriptions.countDocuments({channel_id: channel._id});
            await channel.save({validationBeforeSave:false});
            return res.status(200).send(new ApiResponse(200,"Channel Unsubscribed",{"subscribe":false}));

        }
        return res.status(200).send(new ApiResponse(200,"Channel already Unsubscribed",{"subscribe":false}));
        
    }catch(err){
        return res.status(500).send(new ApiResponse(500,err.message));
    }
}

// optionalAuth
const getChannelDetails = async(req,res)=>{
    // console.log(req.params.userName);
    // const userId = new mongoose.Types.ObjectId(req.userId)
    try{

        
        const channel = await Channels.findOne({channelUserName:String(req.params.userName)}).select("-user_id -_id");
        if(!channel){
            return res.status(404).send(new ApiResponse(404, "Channel Does Not exist"));
        }
        const data = {
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
            if(userDetails && (new mongoose.Types.ObjectId(channel._id) in userDetails.subscribedTo)){
                data.subscribe = true;
            }else if(!(new mongoose.Types.ObjectId(channel.user_id) === new mongoose.Types.ObjectId(userDetails.user_id))){
                data.subscribe =false;
            }
        }
        
        
        
        return res.status(200).send(new ApiResponse(200, "Channel Details" , data ));
    }catch(err){
        return res.status(500).send(new ApiResponse(500,err.message));
    }
}

const removeChannel= async(req,res)=>{
    const user = await Users.findById({_id:req.userId})
    if(!user){
        return res.status(400).send(new ApiResponse(400,"User does not exist"))
    }
    if(user.userType =1){
        return res.status(400).send(new ApiResponse(400,"User does not have a channel"))
    }
    
    const channel = await Channels.findOne({user_id:user._id});
    
    if(!channel){
        return res.status(404).send(new ApiResponse(404, "Channel does not exist"));
    }


    try{
        const channelVideoIds =[];
        const allVideos = await Videos.find({channel_id:channel._id});
        allVideos.forEach(async(video)=>{
            fs.unlink(video.videoPath);
            fs.unlink(video.thumbnail);
            await Comments.deleteMany({video_id:video._id});
            channelVideoIds.push(video._id);
        })
        await Videos.deleteMany({_id:{$in :{channelVideoIds}}});
        await Subscriptions.deleteMany({channel_id:channel._id});
        fs.unlink(channel.coverImage);
        await Channels.deleteOne({_id:channel._id});
        
        user.userType=1;
        await user.save({validationBeforeSave:false});
        
        return res.status(204).send(new ApiResponse(204,"Channel Deleted Successfully"));
        

    }catch(err){
        return res.status(500).send(new ApiResponse(500,err.message));
    }



}



export {createChannel, updateChannelDetails, updateChannelCoverImage , getChannelDetails, subscribeChannel,unsubscribeChannel , removeChannel}