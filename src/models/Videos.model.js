import mongoose, { Schema } from "mongoose";

const videoSchema = new mongoose.Schema({
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
    videoUrl : {type:String , required:true} ,
    thumbnail : {type:String,required:true},
    title : {type:String,required:true},
    description : {type:String,required:true},
    category : {type:String,required:true},
    language : {type:String,required:true},
    dateUploaded : {type:Date,required:true},
    location : {type:String,required:true},
    visibility : {type:String,required:true},
})


const Videos = mongoose.model('Videos' , videoSchema);

export {Videos}