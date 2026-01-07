import mongoose, { Schema } from "mongoose";
import Users from "./Users.model.js";
import { Channels } from "./Channels.model.js";


const uploadedVideosSchema = new Schema({

    user_id : {
        type:Schema.Types.ObjectId,
        required:true,
        ref:Users
    },
    channel_id :{
        type:Schema.Types.ObjectId,
        required:true,
        ref:Channels
    },
    videoInputPath :{type:String , required:true},
    videoOutputPath : {type:String , required:true} ,
    processingPercentage : {type:Number ,required:true},

},{timestamps:true})


const UploadedVideos = mongoose.model('UploadedVideos',uploadedVideosSchema);


export {UploadedVideos};