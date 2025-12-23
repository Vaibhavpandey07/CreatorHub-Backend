import mongoose, { Schema } from "mongoose";
import Users from "./Users.model.js";
import {Videos} from "./Videos.model.js";


const commentSchema = new Schema({
    user_id :{type:Schema.Types.ObjectId, required:true, ref:Users},
    user_fullName :{type:String, required:true},
    user_profilePhoto :{type:String},
    video_id : {type:Schema.Types.ObjectId, required:true , ref:Videos},
    message :{type:String, required:true},
    parentComment_id:{type:Schema.Types.ObjectId , default:null},
    replyCount: { type: Number, default: 0 }
    
},{timestamps:true})

const Comments = mongoose.model('Comments',commentSchema);

export {Comments}