import {validationResult } from "express-validator"
import Users from "../models/Users.model.js";
import { ApiResponse } from "../utlis/ApiResponse.util.js";
import {env} from "../utlis/getEnvVariable.util.js";
import { generateToken } from "../utlis/generateTokens.util.js";
import  jwt from "jsonwebtoken"
import { Channels } from "../models/Channels.model.js";
import mongoose from "mongoose";
import { withTransaction } from "../utlis/withTransaction.util.js";
import fs from "fs/promises"
import { UserOtherDetails } from "../models/UserOtherDetails.model.js";
import { Subscriptions } from "../models/Subscriptions.model.js";
import { Videos } from "../models/Videos.model.js";
import { Comments } from "../models/Comments.model.js";



const registration = async(req,res) =>{
    const err = validationResult(req);
    
    if(err.isEmpty()){
        const found = await Users.findOne({email:req.body.email});
        if(!found){
            let filePath = ""
            if(req.fileName){
                filePath = `${env.UPLOAD_PROFILE_PHOTO_FOLDER}/${req.fileName[0]?.name}`
            }        
            
            const dataToSave = {
                "email": req.body.email,
                "firstName" : req.body.firstName,
                "lastName"  : req.body.lastName,
                "fullName" : req.body.firstName+' '+req.body.lastName,
                "password" : req.body.password,
                "profilePhoto": filePath,
                "userType" : 1,
                "refreshToken" : ""
            }
            
            
            try{
                const user = await Users.create(dataToSave);
                await UserOtherDetails.create({"user_id" : new mongoose.Types.ObjectId(user._id) , "watchHisttory":[],"searchHistory":[] , "likedVideos":[],"disLikedVideos":[],"notification":[] , "subscribedTo":[]})
                res.status(201).send(new ApiResponse(201,"User created successfully"))
            }catch(err){
                console.log(err);
                res.status(500).send(new ApiResponse(500,"there was a problem while creating a new user"))
            }   


        }else{ 
            res.status(400).send(new ApiResponse(400,"User already exist"))
        }

    }
    else{
        res.status(400).send(new ApiResponse(400,`Validation Error : invalid ${err.errors[0].path}`))
    }
    
}

const login = async(req,res)=>{

    if(!req.body.email || !req.body.password){
        return res.status(400).send(new ApiResponse(400,`Please Enter email and password`))
    }

    const user = await Users.findOne({email:req.body.email});
    if(!user){
        return  res.status(400).send(new ApiResponse(400,`No user exist with this Email`))
    }
    const checkPassword = await user.isPasswordCorrect(req.body.password);
    if(!checkPassword){
        return  res.status(400).send(new ApiResponse(400,`Wrong Password`))
    }

    try{
        const {newAccessToken , newRefreshToken} = await generateToken(user._id);
        const options = {httpOnly:true , secure : true}
        
        return  res.status(200).cookie("accessToken",newAccessToken,options).cookie("refreshToken",newRefreshToken,options).json(new ApiResponse(200,"User Logged-In successfully"));
    }
    catch(err){
        console.log(err)
        return res.status(500).send(new ApiResponse(500,`Sorry there was a problem`))
    }

}


const logOut = async(req,res)=>{
    const user = await Users.findById({_id:req.userId})
    if(!user){
        return res.status(400).send(new ApiResponse(400,"User does not exist"))
    }
    user.refreshToken = "";
    await user.save({validateBeforeSave :false});

    const options = {httpOnly :true, secure :true};

    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken",options).send(new ApiResponse(200,"Logged Out successfully"))
    

}


const updateUserDetails = async (req,res) =>{
    const user = await Users.findById({_id:req.userId})
    if(!user){
        return res.status(400).send(new ApiResponse(400,"User does not exist"))
    }
    if(!req.body.email && !req.body.firstName && !req.body.lastName){
        return res.status(400).send(new ApiResponse(400,"Please Enter fields to update"))
    }
    
    try{
        const dataToSave = {
            email:req.body.email?req.body.email:user.email ,
            firstName : req.body.firstName?req.body.firstName:user.firstName,
            lastName : req.body.lastName?req.body.lastName:user.lastName,
        }
        dataToSave.fullName = dataToSave.firstName+' '+dataToSave.lastName
        await Users.findOneAndUpdate({_id:req.userId},{$set:dataToSave})
    
        return res.status(200).send(new ApiResponse(200,"User Details Updated Successfully"))
    }catch(err){
        return res.status(500).send(new ApiResponse(500,err.message))
    }

}



const getNewAccesstoken = async(req,res) =>{
    const refreshToken = req.cookies.refreshToken || req.header("refreshToken")?.replace("Bearer ", "") 
    if(!refreshToken){
        res.status(401).send(new ApiResponse(401,"No token found"))
    }
    else{
        try{
            const payload = jwt.verify(refreshToken , env.REFRESH_TOKEN_SIGN );
            if(!payload?._id){
                res.status(401).send(new ApiResponse(401,"Token Invalid"))

            }
            const {newAccessToken , newRefreshToken} = await generateToken(payload._id); 
            
            // console.log(newAccessToken,newRefreshToken)
                if(newAccessToken && newRefreshToken){
                    const options = {httpOnly:true , secure : true}                
                    return  res.status(200).cookie("accessToken",newAccessToken,options).cookie("refreshToken",newRefreshToken,options).json(new ApiResponse(200,"New Token has been generated"));
                }
            else{
                return  res.status(500).send(new ApiResponse(500,"something went wrong"));
            }


            
        }catch(err){
            if (err instanceof jwt.TokenExpiredError) {
                return res.status(401).send(new ApiResponse(401,"Refresh Token Expired LogIn Again"))
            }
            return res.status(401).send(new ApiResponse(401,err.message))
        }
    }

}


const updateProfilePhoto =async(req,res)=>{
    const user = await Users.findById({_id:req.userId})
    if(!user){
        return res.status(400).send(new ApiResponse(400,"User does not exist"))
    }
    if(!req.fileName){
        return res.status(400).send(new ApiResponse(400,"Please upload Image"))
    }
    try{
        await withTransaction(async(session)=>{
            const oldProfilePhoto = user.profilePhoto;
            await Users.findByIdAndUpdate({_id:req.userId},{$set:{'profilePhoto':`${env.UPLOAD_PROFILE_PHOTO_FOLDER}/${req.fileName[0]?.name}`}} , {session})
            const channel = await Channels.findOne({user_id:new mongoose.Types.ObjectId(req.userId)})
            if(channel){
                channel.profilePhoto = `${env.UPLOAD_PROFILE_PHOTO_FOLDER}/${req.fileName[0]?.name}`;
                await channel.save({validationBeforeSave :false},{session});
            }
            try{
                await fs.unlink(oldProfilePhoto)
            }catch(err){
                console.log(err);
            }
            return res.status(200).send(new ApiResponse(200,"User Profile Photo Updated Successfully"))
        })
    }
    catch(err){
        return res.status(500).send(new ApiResponse(500,err.message))
    }
}


const resetPassword = async(req,res)=>{
    const user = await Users.findById({_id:req.userId})
    if(!user){
        return res.status(400).send(new ApiResponse(400,"User does not exist"))
    }
    try{
        const password   = req.body.password
        const newPassword = req.body.newPassword;

         const checkPassword = await user.isPasswordCorrect(req.body.password);
        
         if(!checkPassword){
            return  res.status(400).send(new ApiResponse(401,`Password Does not match`))
        }
        
        try{
            user.password = newPassword;
            await user.save({validateBeforeSave:false});
            return res.status(200).send(new ApiResponse(200,"Password Changed successfully"))
        }
        catch(err){
            return res.status(200).send(new ApiResponse(200,err.message))
        }
    
    
    }
    catch(err){
        return res.status(500).send(new ApiResponse(500,err.message))
    }
}


const removeUser = async(req,res)=>{
    const user = await Users.findById({_id:req.userId})
    if(!user){
        return res.status(400).send(new ApiResponse(400,"User does not exist"))
    }
     try{
                
        const channel = await Channels.findOne({user_id:user._id});
        if(channel){
            const allVideos = await Videos.find({channel_id:channel._id});
            const channelVideoIds = await Promise.all(allVideos.map(async(video)=>{
                    try{fs.unlink(video.videoPath, (err) => {
                        if (err) {
                            console.error("Failed to delete original file:", err);
                        } else {
                            console.log("Original file deleted:", video.videoPath);
                        }
                    });
            
            
                    fs.unlink(video.thumbnail, (err) => {
                        if (err) {
                            console.error("Failed to delete original file:", err);
                        } else {
                            console.log("Original file deleted:", video.thumbnail);
                        }
                    });}catch(err){}
                    await Comments.deleteMany({video_id:video._id});
                    return video._id;
                })
            )
            await Videos.deleteMany({_id:{$in :channelVideoIds}});
            await Subscriptions.deleteMany({channel_id:channel._id});
            try{fs.unlink(channel.coverImage, (err) => {
                if (err) {
                    console.error("Failed to delete original file:", err);
                } else {
                    console.log("Original file deleted:", channel.coverImage);
                }
            });}catch(err){} 
    
            await Channels.deleteOne({_id:channel._id});
        }
        await Subscriptions.deleteMany({user_id:user._id});
        await UserOtherDetails.deleteOne({user_id:user._id});
        fs.unlink(user.profilePhoto);

        await Users.deleteOne({_id:user._id});

        return res.status(200).send(new ApiResponse(200,"User Deleted succussfully"));
                    


    
    }
    catch(err){
        return res.status(500).send(new ApiResponse(500,err.message))
    }
}


const getUserDetails = async(req,res)=>{
    const user = await Users.findById({_id:req.userId}).select("-_id -password -refreshToken")
    if(!user){
        return res.status(400).send(new ApiResponse(400,"User does not exist"))
    }
    try{
        const data={
            "firstName":user.firstName,
            "lastName" : user.lastName,
            "email" :user.email,
            "fullName" :user.fullName,
            "profilePhoto":user.profilePhoto,
            "Creator" : user.userType==2?true:false,
        }
        return res.status(200).send(new ApiResponse(200,"success",data))
    }
    catch(err){
        return res.status(500).send(new ApiResponse(500,err.message))
    }
}


export { registration, login , logOut , updateUserDetails , getNewAccesstoken , updateProfilePhoto , removeUser , resetPassword , getUserDetails};