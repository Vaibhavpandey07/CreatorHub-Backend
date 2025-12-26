import mongoose, { Schema } from "mongoose";
import Users from "./Users.model.js";
import { Channels } from "./Channels.model.js";
const subscriptionSchema = new Schema({
    subscriber_id :{type:Schema.Types.ObjectId , required:true , ref :Users},
    channel_id :{type:Schema.Types.ObjectId , required:true , ref :Channels}
},{timestamps:true})

const Subscriptions = mongoose.model('Subscriptions',subscriptionSchema);

export {Subscriptions}