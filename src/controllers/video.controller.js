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
import fs from "fs";
import { Comments } from "../models/Comments.model.js";
import ApiError from "../utlis/ApiErrors.util.js";
import { UploadedVideos } from "../models/UploadedVideos.model.js";




const uploadVideo = async(req,res)=>{
    const userId = new mongoose.Types.ObjectId(req.userId);
    const channel = await Channels.findOne({user_id:userId})
    if(!channel){
        throw new ApiError(400, "Please create a channel to Upload Videos");
    }
    if(!req.fileName){
        throw new ApiError(400, "Please upload video");
    }

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
        "videoInputPath" : `${videoInputPath}`,
        "videoOutputPath" : `${videoOutputPath}`,
        "processingPercentage" : 0,
        
    }

    try{
        const video = await UploadedVideos.create(dataToSave);

        try{
            try{
    
                const videoConvertToHLS = new videoToHLS;
    
                videoConvertToHLS.convertToHLS(video._id ,videoInputPath,videoOutputPath).then(() =>{
                    fs.unlink(videoInputPath, (err) => {
                    if (err) {
                    console.error("Failed to delete original file:", err);
                    } else {
                    console.log("Original file deleted:", videoInputPath);
                    }
                    });
                })

            }catch(err){
                console.log(err.message);   
                }



            return res.status(201).send(new ApiResponse(201,`Video uploaded successfully and now it is being processed`,{"videoId":video._id, "processingPercentage": video.processingPercentage}))

        }catch(err){
            throw new ApiError(500,err.message);

        }

    }
    catch(err){
        throw new ApiError(500,err.message);
    }

}

const getProgress =async(req,res)=>{
    const videoId = req.body.videoId;

    const uploadVideoDetails = await UploadedVideos.findById(videoId)
    if(!uploadVideoDetails){
       throw new ApiError(404, "Video Not Found");
    }

    if(!((new mongoose.Types.ObjectId(uploadVideoDetails.user_id)).equals(new mongoose.Types.ObjectId(req.userId)) )){
        throw new ApiError(401,"You are not Authorized");
    }
    try{
        return res.status(200).send(new ApiResponse(200,"success" ,{"processingPercentage":uploadVideoDetails.processingPercentage}));
    }
    catch(err){
        throw new ApiError(500,err.message)
    }

}

const VideoDetails = async(req,res)=>{
    const userId = new mongoose.Types.ObjectId(req.userId);
    const videoId = req.body.videoId;
    
    
    const uploadVideoDetails = await UploadedVideos.findById(videoId)
    if(!uploadVideoDetails){
       throw new ApiError(404, "Video Not Found");
    }

    if(!((new mongoose.Types.ObjectId(uploadVideoDetails.user_id)).equals(userId) )){
        throw new ApiError(401,"You are not Authorized");
    }




    const channel = await Channels.findOne({user_id:userId})
    if(!channel){
        throw new ApiError(400, "Please create a channel to Upload Videos");
    }
    if(!req.fileName){
        throw new ApiError(400, "Please upload Thumbnail");
    }


    let thumbnailDetails = req.fileName[0];
    

    const videoOutputPath = uploadVideoDetails.videoOutputPath;

    const dataToSave = {
        "user_id" : new mongoose.Types.ObjectId(channel.user_id) ,
        "channel_id" : new mongoose.Types.ObjectId(channel._id) ,
        "videoUrl" : `${videoOutputPath}/master.m3u8`,
        "videoPath" : `${videoOutputPath}`,
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

            return res.status(201).send(new ApiResponse(201,`Video uploaded successfully and now it is live`,{"videoId":video._id}))

        }catch(err){
            throw new ApiError(500,err.message);

        }

    }
    catch(err){
        throw new ApiError(500,err.message);
    }

}

const updateVideoDetails = async(req,res)=>{

    const videoId = req.body?.videoId;
    const video = await Videos.findById(new mongoose.Types.ObjectId(videoId));

    if(!video){
        throw new ApiError(400, "Video does not exist");
    }
    const userId = new mongoose.Types.ObjectId(req.userId);
    const channel = await Channels.findOne({user_id:userId})
    if(!channel){
        throw new ApiError(400, "Please create a channel");
    }



    if(!(video.user_id.equals(channel.user_id) && channel._id.equals( video.channel_id)) ){
       throw new ApiError(400, "only the owner can change details of the video");
    }
    else{
        try{
            

        video.title = req.body.title?req.body.title:video.title;
        video.description = req.body.description?req.body.description:video.description;;
        video.category = req.body.category?req.body.category:video.category;
        video.language = req.body.language?req.body.language:video.language;
        video.location = req.body.location?req.body.location:video.location;
        video.visibility = req.body.visibility?req.body.visibility:video.visibility;
        video.tags = req.body.tags?req.body.tags:video.tags,

        await video.save({validationBeforeSave:false});
        return res.status(200).send(new ApiResponse(200,"Video Details Updated Successfully"));
        
    }
    catch(err){
        throw new ApiError(500,err.message);
    }}
}


const updateThumbnail = async(req,res)=>{

    const videoId = req.body.videoId;
    const userId = new mongoose.Types.ObjectId(req.userId);
    const channel = await Channels.findOne({user_id:userId})
    if(!channel){
        throw new ApiError(400, "Please create a channel");
    }
    const video = await Videos.findById(new mongoose.Types.ObjectId(videoId));

    if(!video){
       throw new ApiError(400, "Video does not exist");
    }


    if(!(video.user_id.equals(channel.user_id) && channel._id.equals(video.channel_id)) ){
        throw new ApiError(400, "only the owner can change details of the video");
    }
    else{
        try{

        fs.unlink(video.thumbnail,(err)=>{
             if (err) {
                console.error("Failed to delete original file:", err);
            } else {
                console.log("Original file deleted:", video.thumbnail);
            }
        })
        video.thumbnail = `${env.UPLOAD_THUMBNAIL_FOLDER}/${req.fileName[0].name}`;

        await video.save({validationBeforeSave:false});
        return res.status(200).send(new ApiResponse(200,"Video Thumbnail Updated Successfully"));
        
    }
    catch(err){
        throw new ApiError(500,err.message);
    }}
}


const likeVideo = async(req,res)=>{
    const userId = req.userId;
    const check = req.body.liked;
    try{
        const videoId = req.body.videoId;
        
        const video = await Videos.findById(new mongoose.Types.ObjectId(videoId));
        if(!video){
            throw new ApiError(504,"Video not Found");
        }

        const userDetails = await UserOtherDetails.findOne({"user_id":new mongoose.Types.ObjectId(userId)});
        if(!userDetails){
            throw new ApiError(504,"User Details not found");           
        }

        

        if( (check && ( userDetails.likedVideos.some(id=>{
            return id.equals(new mongoose.Types.ObjectId(video._id));}
        )) ) ){
            return res.status(409).send(new ApiResponse(409,"Video already Liked",{"like":check}));
        }

        else if( !check && (userDetails.likedVideos.some(id=>{
            return id.equals(new mongoose.Types.ObjectId(video._id));}
        ) )){
            video.likes-=1;
            await UserOtherDetails.findOneAndUpdate({"user_id":new mongoose.Types.ObjectId(userId)} , {$pull:{likedVideos:video._id}}, {upsert: false});

            await video.save({validateBeforeSave:false});

            return res.status(200).send(new ApiResponse(200,"Video unliked"),{"like":check});

        }
        else if( check && (userDetails.disLikedVideos.some(id=>{
            return id.equals(new mongoose.Types.ObjectId(video._id));})) ){

            video.likes+=1;
            video.dislikes-=1;
            await UserOtherDetails.findOneAndUpdate({"user_id":new mongoose.Types.ObjectId(userId)} , {$addToSet:{likedVideos:video._id}, $pull: { disLikedVideos: video._id } }, {upsert: false});
            await video.save({validateBeforeSave:false});

            return res.status(200).send(new ApiResponse(200,"Video liked"),{"like":check});

        }
        else if(check){

            
            video.likes +=1;
            await video.save({validateBeforeSave:false});
            userDetails.likedVideos.push(new mongoose.Types.ObjectId(video._id));
            await userDetails.save({validateBeforeSave:false});
            return res.status(200).send(new ApiResponse(200,"Video Liked",{"like":check}));
            
        }
        else{
           throw new ApiError(400,"Bad Request");;
        }

    }catch(err){

        throw new ApiError(err.statusCode || 500,err.message);
    }
}


const dislikeVideo = async(req,res)=>{
    const userId = req.userId;
    const check = req.body.disliked;
    try{
        const videoId = req.body.videoId;
        
        const video = await Videos.findById(new mongoose.Types.ObjectId(videoId));
        if(!video){
            throw new ApiError(504,"Video not Found");
        }

        const userDetails = await UserOtherDetails.findOne({"user_id":new mongoose.Types.ObjectId(userId)});
        if(!userDetails){
            throw new ApiError(504,"User Details not found");           
        }

        

        if( (check && ( userDetails.disLikedVideos.some(id=>{
            return id.equals(new mongoose.Types.ObjectId(video._id));}
        )) ) ){
            return res.status(409).send(new ApiResponse(409,"Video already disliked",{"dislike":check}));
        }

        else if( !check && (userDetails.disLikedVideos.some(id=>{
            return id.equals(new mongoose.Types.ObjectId(video._id));}
        ) )){
            video.dislikes-=1;
            await UserOtherDetails.findOneAndUpdate({"user_id":new mongoose.Types.ObjectId(userId)} , {$pull:{disLikedVideos:video._id}}, {upsert: false});

            await video.save({validateBeforeSave:false});

            return res.status(200).send(new ApiResponse(200,"Video unDisliked"),{"dislike":check});

        }


        else if( check && (userDetails.likedVideos.some(id=>{
            return id.equals(new mongoose.Types.ObjectId(video._id));})) ){

            video.likes-=1;
            video.dislikes+=1;
            await UserOtherDetails.findOneAndUpdate({"user_id":new mongoose.Types.ObjectId(userId)} , {$pull:{likedVideos:video._id}, $addToSet: { disLikedVideos: video._id } }, {upsert: false});
            await video.save({validateBeforeSave:false});

            return res.status(200).send(new ApiResponse(200,"Video disliked"),{"dislike":check});

        }
        else if(check){

            
            video.dislikes +=1;
            await video.save({validateBeforeSave:false});
            userDetails.disLikedVideos.push(new mongoose.Types.ObjectId(video._id));
            await userDetails.save({validateBeforeSave:false});
            return res.status(200).send(new ApiResponse(200,"Video disliked",{"dislike":check}));
            
        }
        else{
            throw new ApiError(400,"Bad Request");
        }

    }catch(err){

        throw new ApiError(err.statusCode || 500,err.message);
    }
}



const removeVideo = async(req,res)=>{
    const userId  = new mongoose.Types.ObjectId(req.userId);
    const user = await Users.findById(userId);


    const videoId = new mongoose.Types.ObjectId(req.body?.videoId);
    const video = await Videos.findById(videoId);

    
    if(!video){
        throw new ApiError(404,"Video does not exist");
    }

    const channel = await Channels.findOne({user_id:user._id});
    
    if(!channel){
        throw new ApiError(404,"channel does not exist");
    }

    if(!(video.user_id.equals(user._id)) || !(channel._id.equals(video.channel_id))){
        throw new ApiError(401,"You are not the Owner of this video");
    }

    try{

        
        if(!channel){
            throw new ApiError(404,"channel does not exist");
        }

        channel.totalViewCount -= video.views;
        await channel.save({validationBeforeSave:false});


        await Comments.deleteMany({video_id:videoId});

        try{
            fs.rm(video.videoPath, { recursive: true, force: true });
            fs.unlink(video.thumbnail, (err) => {
                    if (err) {
                    console.error("Failed to delete original file:", err);
                    } else {
                    console.log("Original file deleted:", video.thumbnail);
                    }
                    });
        }catch(err){
                    console.error("Failed to delete original file:", err); 

        }
            
        await Videos.findOneAndDelete({_id:videoId});
        return res.status(200).send(new ApiResponse(200,"Video Deleted Successfully"));

    }catch(err){
        throw new ApiError(500,err.message);
    }


}


// optional Auth
const getVideoDetails = async(req,res)=>{
    const videoId = req.params.videoId;

    const video = await Videos.findById(new mongoose.Types.ObjectId(videoId));


    if(!video  ){
        throw new ApiError(400, "Video does not exist");
    }

    const channel = await Channels.findById(new mongoose.Types.ObjectId(video.channel_id));
    if(!channel){
        throw new ApiError(500,"Internal server Error");
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
        "channelDescription" : channel.description,
        "channelUserName" : channel.channelUserName,
        "profilePhoto" :channel.profilePhoto,
        "totalSubscriberCount" :channel.totalSubscriberCount,
        "liked":false,
        "disliked":false,
        "subscribe":false,
        "video_id" :videoId,
    }
    
    if(req.userId){
        
        if(video.visibility.toLowerCase()=="private" && (!(new mongoose.Types.ObjectId(req.userId)).equals(video.user_id)) ){
            throw new ApiError(401,"This is a private video");
        }

        const userDetails = await UserOtherDetails.findOne({user_id:new mongoose.Types.ObjectId(req.userId)});

        if(userDetails.likedVideos.some(id=>{ return id.equals(new mongoose.Types.ObjectId(video._id))})){
            dataToSend.liked = true;
        }
        else if(userDetails.disLikedVideos.some(id=>{ return id.equals(new mongoose.Types.ObjectId(video._id))})){
            dataToSend.disliked = true;
        }

        if(userDetails.subscribedTo.some(id=>{return id.equals(new mongoose.Types.ObjectId(channel._id))})){
            dataToSend.subscribe = true;
        }
        if((new mongoose.Types.ObjectId(req.userId)).equals(video.user_id) ){
            dataToSend.owner = true;

        }
        await UserOtherDetails.findOneAndUpdate({_id:userDetails._id},{
            $addToSet:{watchHistory : new mongoose.Types.ObjectId(video._id)}
        })
        const updated = await UserOtherDetails.findOneAndUpdate(
                        { _id: userDetails._id, "watchHistory.video": video._id},
                        {$set: {
                            "watchHistory.$.updatedAt": new Date()
                            }
                        },
                        { new: true }
                        );

        if (!updated) 
        {
            await UserOtherDetails.findOneAndUpdate({ _id: userDetails._id },
                {
                $push: {
                    watchHistory: {
                    video: video._id,
                    updatedAt: new Date()
                    }
                }
                }
            );
            }

    }
    
    
   
    if((video.visibility.toLowerCase() =="private" && !req.userId)){
        throw new ApiError(401,"This is a private video")
    }

    try{

        video.views +=1;
        channel.totalViewCount+=1;
        await channel.save({validationBeforeSave:false});
        await video.save({validationBeforeSave:false});        
        return res.status(200).send(new ApiResponse(200,"video Details attached",dataToSend));

    }catch(err){
        throw new ApiError(500,err.message);
    }

    
}


const getAllVideos = async(req,res)=>{
    const channelUserName = req.params.userName;
    const query = `${req.query.query?.trim()}`;
    const page = parseInt(req.query.page)|| 1;
    const limit = parseInt(req.query.limit) || 10;

    let sortBy = {$sort:{createdAt:-1}};
    if( query =='popular'){
        sortBy = {$sort:{views:-1}};
    }

    if(!channelUserName){
        throw new ApiError(400,"Please attach channelUserName")
    }
    const channel = await Channels.findOne({channelUserName:channelUserName});
    if(!channel){
        throw new ApiError(400, "Channel Does not exist");
    }
    let owner = false;
    if(req.userId){
        const user = await  Users.findOne({_id:req.userId});
        if(user && ((new mongoose.Types.ObjectId(user?._id)).equals(new mongoose.Types.ObjectId(channel.user_id)))){
            owner = true;
        }
    }
        try{
        const skip = (page-1)*limit;



        const searchResults = await Videos.aggregate([
            {$match: { channel_id:channel._id , visibility:"public"}  },
            sortBy,
            {$skip :skip},
            {$limit : limit+1},

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
                channelName :`${channel.channelName}`,
                channelDescription : `${channel.description}`,
                channelUserName : `${channel.channelUserName}`,
                profilePhoto : `${channel.profilePhoto}`,
                totalSubscriberCount : `${channel.totalSubscriberCount}`
            }

            }
        ]
    )


        const hasMore = searchResults.length>limit?true:false;
        if(hasMore){searchResults.pop()};



        res.status(200).send(new ApiResponse(200,(searchResults.length>0)?"Search Results found":"Search Results not Found",{"data" : searchResults,"hasMore":hasMore,page,limit}));
        
    
    }catch(err){
        console.log(err);
        throw new ApiError(500,err.message);
    }


}


const searchVideos = async(req,res)=>{
    const searchQuery = `${req.query.searchQuery?.trim()}`;
    const page = parseInt(req.query.page)|| 1;
    const limit = parseInt(req.query.limit) || 10;

    

    if(!searchQuery){
        throw new ApiError(200, "No search query");
    }
    
    try{
        const skip = (page-1)*limit;



        const searchResults = await Videos.aggregate([
            {$match:{$text:{$search : searchQuery}, visibility:"public"}},
            {$addFields : {score :{$meta:"textScore"}}},
            {$sort :{score:-1}},
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


        const hasMore = searchResults.length>limit?true:false;
        if(hasMore){searchResults.pop()};



        res.status(200).send(new ApiResponse(200,(searchResults.length>0)?"Search Results found":"Search Results not Found",{"data" : searchResults,"hasMore":hasMore,page,limit}));
        
    
    }catch(err){
        console.log(err);
        throw new ApiError(500,err.message);
    }
}


const searchSuggestions = async(req,res)=>{
    const searchQuery = req.query.searchQuery?.trim();
    if(!searchQuery){
        throw new ApiError(200,"no query found");
    }
    try{

        const results = await Videos.aggregate([
            {

                $match : {$and:[{$or:[{
                    title : {$regex : `^${searchQuery}` , $options:"i"} 
                },{
                    description : {$regex: `^${searchQuery}`,$options:'i'}
                },
                {
                    tags : {$regex: `^${searchQuery}`,$options:'i'}
                }
            ], visibility:'public'}]}
                
                // {title : {$regex : `^${searchQuery}` , $options:"i" },
                //         visibility:"public"}

            },

            {$limit:5},
            {$project : {
                _id:0,
                video_id:'$_id',
                title:1
            }}


        ])

        res.status(200).send(new ApiResponse(200,"suggestions",results));


    }catch(err){
        throw new ApiError(500,err.message);
    }
}


const randomVideosSuggestions = async(req,res)=>{
    const {limit=5 , cursor } = req.query;
    const q = {visibility:"public"}

    if(cursor){
        q._id = {$lt : new mongoose.Types.ObjectId(cursor)};
    }
    try{
        

        let videoResults = await Videos.aggregate([
            {$match:q},
            {$sort : {_id : -1}},

            {$limit :parseInt(limit)+1},
        
            {$lookup : {
                from : "channels",
                localField :"channel_id",
                foreignField:"_id",
                as : "channel"
            }},

            {$unwind :"$channel"},
       
            {$project : {
                _id:1,
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
                totalSubscriberCount : "$channel.totalSubscriberCount",
                
            }

            }
        ]
    )
        // if(!videoResults){throw err}

        const hasMore = videoResults.length>limit?true:false;
        if(hasMore){videoResults.pop()};
        const newCursor = hasMore?videoResults[videoResults.length -1]._id:null;

        videoResults = videoResults.map((ele)=>{
            const {_id,...obj} = ele;
            return obj;
        })

        
        res.status(200).send(new ApiResponse(200,"Results found", {data:videoResults,hasMore,newCursor}));

        
    }catch(err){
        
        throw new ApiError(500,err.message);
    }
}

const latestVideos = async(req,res)=>{
    const {limit=5,cursor} = req.query;
    const q = {visibility:"public"}

    if(cursor){
        q.createdAt = {$lt : new Date(cursor)};
    }

    try{    
        let videoList = await Videos.aggregate([
            {$match:q},
            {$sort :{createdAt:-1,_id:-1}},
            {$limit : parseInt(limit)+1},
     
            {$lookup : {
                from : "channels",
                localField :"channel_id",
                foreignField:"_id",
                as : "channel"
            }},

            {$unwind :"$channel"},
        
            {$project : {
                _id:0,
                video_id:"$_id",
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
                totalSubscriberCount : "$channel.totalSubscriberCount",
                createdAt:"$createdAt"
            }

            }
        ]
    )


    // if(!videoList){throw err}

    const hasMore = videoList.length>limit?true:false;
    if(hasMore){videoList.pop()};
    const newCursor = hasMore?videoList[videoList.length -1].createdAt:null;


    videoList = videoList.map((ele)=>{
        const {createdAt,...obj} = ele;
        return obj;
    })

        
    res.status(200).send(new ApiResponse(200,"Latest Videos", {data:videoList,hasMore,newCursor}));



    }catch(err){
        throw new ApiError(500, err.message);
    }
}

const trendingVideos = async(req,res)=>{

    const {limit=5,cursor,cursorDate} = req.query;
    const q = {visibility:"public"}

    if(cursor){
        q.views = {$lte : Number(cursor)};
    }
    if(cursorDate){
        q.createdAt = {$lt: new Date(cursorDate)}
    };


     try{    
        let videoList = await Videos.aggregate([
            {$match:q},
            {$sort :{views:-1,createdAt:-1}},
            {$limit : parseInt(limit)+1},
       
            {$lookup : {
                from : "channels",
                localField :"channel_id",
                foreignField:"_id",
                as : "channel"
            }},

            {$unwind :"$channel"},
       
            {$project : {
                _id:0,
                video_id:"$_id",
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
                totalSubscriberCount : "$channel.totalSubscriberCount",
                createdAt:"$createdAt"
            }

            }
        ]
    )


    const hasMore = videoList.length>limit?true:false;
    if(hasMore){videoList.pop()};
    const newCursor = hasMore?videoList[videoList.length -1].views:null;
    const cursorDate = hasMore?videoList[videoList.length-1].createdAt:null;

    videoList = videoList.map((ele)=>{
        const {createdAt,...obj} = ele;
        return obj;
    })

        
    res.status(200).send(new ApiResponse(200,"Trending Videos", {data:videoList,hasMore,newCursor, cursorDate}));

    }catch(err){
        throw new ApiError(500, err.message);
    }
}


export {uploadVideo, updateVideoDetails , updateThumbnail ,likeVideo,dislikeVideo, getVideoDetails , getAllVideos , removeVideo, searchVideos , searchSuggestions,randomVideosSuggestions  , trendingVideos, latestVideos, getProgress , VideoDetails}