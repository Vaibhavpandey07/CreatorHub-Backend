import mongoose, { Schema } from "mongoose";

const videoAnalyticSchema = new mongoose.Schema({
    user_id:{type :Schema.Types.ObjectId, required:true , ref:Users},
    video_id :{type :Schema.Types.ObjectId, required:true, ref:Videos},
    views :{type :Number, required:true },
    likes :{type :Number, required:true },
    dislike :{type :Number, required:true }
})

const VideoAnalytics = mongoose.model('VideoAnalytics',videoAnalyticSchema);

export {VideoAnalytics}