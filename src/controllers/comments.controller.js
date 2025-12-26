import mongoose from "mongoose";
import { Videos } from "../models/Videos.model.js";
import { ApiResponse } from "../utlis/ApiResponse.util.js";
import { Comments } from "../models/Comments.model.js";
import Users from "../models/Users.model.js";


const commentToVideo = async(req,res)=>{
    const userId = new mongoose.Types.ObjectId(req.userId);
    const videoId = new mongoose.Types.ObjectId(req.params.videoId) ;
    const video = await Videos.findById(videoId);
    if(!video){
        return res.status(404).send(new ApiResponse(404,"video does not exist"));
    }
    const user = await Users.findById(userId);
    try{
        const dataToSave = {
            "user_id":userId,
            "user_fullName" : user.fullName,
            "user_profilePhoto" : user.profilePhoto,
            "video_id":videoId,
            "message" : req.body?.message,
            "parentComment_id" : null,
            "replyCount": 0
        }
        await Comments.create(dataToSave);
        return res.status(200).send( new ApiResponse(200,"Comment added"))
    }catch(err){
        return res.status(500).send(new ApiResponse(500,err.message));
    }
}

const replyToComment = async(req,res)=>{
    const userId = new mongoose.Types.ObjectId(req.userId);
    const videoId = new mongoose.Types.ObjectId(req.params.videoId) ;
    const video = await Videos.findById(videoId);

    const commentId = new mongoose.Types.ObjectId(req.params.commentId);
    
    const comment = await Comments.findById(commentId);
    if(!comment){
        return res.status(404).send( new ApiResponse(404, "Comment does not exist"));
    }
    if(!video){
        return res.status(404).send(new ApiResponse(404,"video does not exist"));
    }

    try{
        const user = await Users.findById(userId);

        const dataToSave = {
            "user_id":userId,
            "user_fullName" : user.fullName,
            "user_profilePhoto" : user.profilePhoto,
            "video_id":videoId,
            "message" : req.body?.message,
            "parentComment_id" : new mongoose.Types.ObjectId(comment._id),
            "replyCount":0,
        }

        comment.replyCount+=1;
        await comment.save({validationBeforeSave:false});
        await Comments.create(dataToSave);

        return res.status(200).send( new ApiResponse(200,"Comment added"))
        
    }catch(err){
        return res.status(500).send(new ApiResponse(500,err.message));
    }

}


const getComments = async(req,res)=>{
    const videoId = new mongoose.Types.ObjectId(req.params.videoId) ;
    const video = await Videos.findById(videoId);

    if(!video){
        return res.status(404).send(new ApiResponse(404,"video does not exist"));
    }
    try{
        const comments = await Comments.find({$and : [{video_id:videoId},{parentComment_id:null}]});
        
        const allComments = comments.map((e)=>{
            return {
                "commentId":e._id,
                "user":e.user_fullName,
                "profilePhoto" :e.user_profilePhoto,
                "message":e.message,
                "replyCount" : e.replyCount
            }
        });

        return res.status(200).send(new ApiResponse(200,"all comments",data={"comments":allComments}));

    }catch(err){
        return res.status(500).send(new ApiResponse(500,err.message));
    }
}

const getCommentReplies = async(req,res)=>{
    const videoId = new mongoose.Types.ObjectId(req.params.videoId) ;
    const video = await Videos.findById(videoId);

    if(!video){
        return res.status(404).send(new ApiResponse(404,"video does not exist"));
    }
    try{
        const comments = await Comments.find({parentComment_id:new mongoose.Types.ObjectId(req.params?.commentId)});
        
        const allComments = comments.map((e)=>{
            return {
                "commentId":e._id,
                "user":e.user_fullName,
                "profilePhoto" :e.user_profilePhoto,
                "message":e.message,
                "replyCount" : e.replyCount
            }
        });

        return res.status(200).send(new ApiResponse(200,"all comments",data={"comments":allComments}));

    }catch(err){
        return res.status(500).send(new ApiResponse(500,err.message));
    }
}

const removeComment = async(req,res)=>{
    const userId = new mongoose.Types.ObjectId(req.userId);
    const commentId = new mongoose.Types.ObjectId(req.params?.commentId);
    const videoId = new mongoose.Types.ObjectId(req.params.videoId) ;
    
    const user = await Users.findById(userId);
    const comment = await Comments.findById(commentId); 
    if(!comment){
        return res.status(404).send(new ApiResponse(404,"Comment does not exist"));
    }


    if(!(user._id.equals(comment.user_id))){
        return res.status(401).send(new ApiResponse(401,"You are not authorized to delete this comment"));
    }

    const video = await Videos.findById(videoId);
    if(!video ){
        return res.status(404).send(new ApiResponse(404,"video does not exist"));
    }

    try{
        if(comment.parentComment_id!=null){
            const parentComment = await Comments.findById(new mongoose.Types.ObjectId(comment.parentComment_id));
            parentComment.replyCount -=1;
            parentComment.save({validationBeforeSave:false});
        }
        await Comments.deleteMany({parentComment_id:commentId});
        await Comments.deleteOne({_id:commentId});

        return res.status(200).send(new ApiResponse(200,"Comment Deleted successfully"));

    }catch(err){
        return res.status(500).send(new ApiResponse(500,err.message));
    }
}

export {commentToVideo , replyToComment , getComments,getCommentReplies,removeComment};