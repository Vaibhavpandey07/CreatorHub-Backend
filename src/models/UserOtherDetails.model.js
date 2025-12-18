import mongoose,{Schema} from "mongoose";

const userOtherDetailsSchema = new Schema({
    user_id :{type:String, required:true , ref:Users}, 
    watchHisttory :[{type:Schema.Types.ObjectId, ref:Videos}],           
    searchHistory :[{type:String}],     
    likedVideos :[{type:Schema.Types.ObjectId, ref:Videos}],
    notification :[{type:String}],
    subscribedTo :[{type:Schema.Types.ObjectId, ref:Channels}],            
})

const UserOtherDetails = mongoose.model('UserOtherDetails',userOtherDetailsSchema);

export {UserOtherDetails}