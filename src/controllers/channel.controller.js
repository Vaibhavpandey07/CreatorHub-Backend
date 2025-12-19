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
        return res.status(404).send(new ApiResponse(404, "User Does Not exsits"))
    }   


    const channelUserName = req.body.channelUserName;
    // const channel = await Channels.findOne({user_id:user._id});
    if(user.userType==2){
        return res.status(400).send(new ApiResponse(400, "channel Already exsits"))
        
    }
    else{
        const channelWithUserName = await Channels.findOne({channelUserName});
        if(channelWithUserName){
            return res.status(400).send(new ApiResponse(400, "channel user Name already taken please try a different User Name"))
        }
    }
    
    
    try{

        const dataToSave = {
        "channelName" : req.body.channelName,
        "user_id" : user._id ,
        "description" :req.body.description,
        "channelUserName" : channelUserName,
        "coverImage" : `${env.UPLOAD_COVER_IMAGE_FOLDER}/${req.fileName?.name}`,
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

    try{
        const oldCoverImageFilePath = channel.coverImage;
         await Channels.findByIdAndUpdate({_id:channel._id},{$set : {"coverImage" : `${env.UPLOAD_COVER_IMAGE_FOLDER}/${req.fileName?.name}`}});
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




export {createChannel, updateChannelDetails, updateChannelCoverImage}