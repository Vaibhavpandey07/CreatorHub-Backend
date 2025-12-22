import mongoose, { Schema } from "mongoose";
import Users from "./Users.model.js";
import { Videos } from "./Videos.model.js";

const videoAnalyticSchema = new mongoose.Schema({
    user_id:{type :Schema.Types.ObjectId, required:true , ref:Users},
    video_id :{type :Schema.Types.ObjectId, required:true, ref:Videos},
    views :{type :Number, required:true },
    likes :{type :Number, required:true },
    dislikes :{type :Number, required:true }
})

const VideoAnalytics = mongoose.model('VideoAnalytics',videoAnalyticSchema);

export {VideoAnalytics}