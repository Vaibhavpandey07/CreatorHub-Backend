import mongoose, { Schema } from "mongoose";
import Users from "./Users.model.js";

const channelSchema = new Schema({
    user_id :{type : Schema.Types.ObjectId, ref : Users, unique:true},
    channelName : {type:String , required : true},
    description :{type:String , required : true},
    channelUserName :{type:String, required:true  },
    profilePhoto :{type:String,required:true},
    coverImage :{type:String , required : true},
    contactInfo :{type:String },
    homeTabSetting :{type:Object ,},
    totalSubscriberCount :{type:Number , required : true},
    totalViewCount : {type:Number , required : true},

}, {timeStamps:true})

const Channels = mongoose.model('Channels',channelSchema);

export {Channels};
