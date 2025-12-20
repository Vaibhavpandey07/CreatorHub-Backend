import mongoose from 'mongoose';
import { Channels } from '../models/Channels.model.js';
import Users from '../models/Users.model.js'
import { ApiResponse } from '../utlis/ApiResponse.util.js';
import { env } from '../utlis/getEnvVariable.util.js';
import {withTransaction} from '../utlis/withTransaction.util.js';
import fs from "fs/promises"



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
    else{
        const channelWithUserName = await Channels.findOne({channelUserName});
        if(channelWithUserName){
            return res.status(400).send(new ApiResponse(400, "channel user Name already taken please try a different User Name"))
        }
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
        "totalViewCount" : 0
        }

        await withTransaction(async(session)=>{
            await Channels.create([dataToSave], { session });
            user.userType = 2;
            await user.save({validationBeforeSave :false} , {session});
            return res.status(201).send(new ApiResponse(201, "Channel Created Successfully"));
        })


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

        await withTransaction(async(session)=>{
            await Channels.findOneAndUpdate({_id:channel._id},{$set : dataToSave}, { session });
            return res.status(200).send(new ApiResponse(200, "Channel details updated successfully"));
        })


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

const getChannelDetails = async(req,res)=>{
    // console.log(req.params.userName);
    // const userId = new mongoose.Types.ObjectId(req.userId)

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
        "totalViewCount" : channel.totalViewCount 
    }
    return res.status(200).send(new ApiResponse(200, "Channel Details" , data ))
}


export {createChannel, updateChannelDetails, updateChannelCoverImage , getChannelDetails}