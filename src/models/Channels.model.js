import mongoose, { Schema } from "mongoose";

const channelSchema = new Schema({
    channelName : {type:String , required : true},
    user_id :{type : Schema.Types.ObjectId, ref : Users},
    description :{type:String , required : true},
    url :{type:String },
    coverImage :{type:String , required : true},
    contactInfo :{type:String },
    homeTabSetting :{type:Object ,},
    totalSubscriberCount :{type:Number , required : true},
    totalViewCount : {type:Number , required : true}

}, {timeStamp:true})

const Channels = mongoose.model('Channels',channelSchema);

export {Channels};
