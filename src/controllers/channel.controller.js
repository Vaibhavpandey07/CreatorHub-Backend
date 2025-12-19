import { Channels } from '../models/Channels.model.js';
import Users from '../models/Users.model.js'
import { ApiResponse } from '../utlis/ApiResponse.util.js';
import { env } from '../utlis/getEnvVariable.util.js';
import {withTransaction} from '../utlis/withTransaction.util.js';



const createChannel = async(req,res)=>{
    const user = await Users.findById(req.userId);
    if(!user){
        return res.status(404).send(new ApiResponse(404, "User Does Not exsits"))
    }   


    const channelUserName = req.body.channelUserName;
    // const channel = await Channels.findOne({user_id:user._id});
    if(user.userType==2){
        return res.status(400).send(new ApiResponse(400, "channel Already exsits"))
        
    }
    else{
        const channelWithUserName = await Channels.findOne({channelUserName});
        if(channelWithUserName){
            return res.status(400).send(new ApiResponse(400, "channel user Name already taken please try a different User Name"))
        }
    }
    
    
    try{

        const dataToSave = {
        "channelName" : req.body.channelName,
        "user_id" : user._id ,
        "description" :req.body.description,
        "channelUserName" : channelUserName,
        "coverImage" : `${env.UPLOAD_COVER_IMAGE_FOLDER}/${req.fileName?.name}`,
        "contactInfo" : req.body.contactInfo,
        "homeTabSetting" :{'sortBy' : req.body.homeTabSetting?.sortBy},
        "totalSubscriberCount" : 0 ,
        "totalViewCount" : 0
        }

        // await withTransaction(async(session)=>{
            
            await Channels.create([dataToSave], {  });
            user.userType = 2;
            await user.save({validationBeforeSave :false} , {});
            return res.status(201).send(new ApiResponse(201, "Channel Created Successfully"));
        // })

    }catch(err){
        return res.status(500).send(new ApiResponse(500, err.message));
    }



}

export {createChannel}