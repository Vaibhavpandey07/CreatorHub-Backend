import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema({
    subscriber_id :{type:Schema.Types.ObjectId , required:true , ref :Users},
    channel_id :{type:Schema.Types.ObjectId , required:true , ref :Channel}
})

const Subscriptions = mongoose.model('Subscriptions',subscriptionSchema);

export {Subscriptions}