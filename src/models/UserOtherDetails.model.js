import mongoose,{Schema} from "mongoose";
import Users from "./Users.model.js";
import { Videos } from "./Videos.model.js";
import { Channels } from "./Channels.model.js";


const userOtherDetailsSchema = new Schema({
    user_id :{type:String, required:true , ref:Users}, 
    watchHistory :[
      { video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Videos,
    },
    updatedAt: {
        type: Date,
        default: Date.now
        }
    }],
    searchHistory :[{type:String}],     
    likedVideos :[{type:Schema.Types.ObjectId, ref:Videos}],
    disLikedVideos :[{type:Schema.Types.ObjectId, ref:Videos}],
    notification :[{type:String}],
    subscribedTo :[{type:Schema.Types.ObjectId, ref:Channels}],            
})

const UserOtherDetails = mongoose.model('UserOtherDetails',userOtherDetailsSchema);

export {UserOtherDetails}