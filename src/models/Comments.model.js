import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema({
    user_id :{type:Schema.Types.ObjectId, required:true, ref:Users},
    video_id : {type:Schema.Types.ObjectId, required:true , ref:Videos},
    message :{type:String, required:true},
    reply : [{type:Schema.Types.ObjectId, ref:Comments}], 
})

const Comments = mongoose.model('Comments',commentSchema);

export {Comments}