import mongoose, { Schema } from "mongoose";
import Users from "./Users.model.js";

const channelSchema = new Schema({
    channelName : {type:String , required : true},
    user_id :{type : Schema.Types.ObjectId, ref : Users, unique:true},
    description :{type:String , required : true},
    channelUserName :{type:String, required:true  },
    coverImage :{type:String , required : true},
    contactInfo :{type:String },
    homeTabSetting :{type:Object ,},
    totalSubscriberCount :{type:Number , required : true},
    totalViewCount : {type:Number , required : true}

}, {timeStamp:true})

const Channels = mongoose.model('Channels',channelSchema);

export {Channels};
