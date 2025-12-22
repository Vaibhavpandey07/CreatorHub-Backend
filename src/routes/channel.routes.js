import { Router} from "express";
import { createChannel, updateChannelDetails , updateChannelCoverImage , getChannelDetails, subscribeChannel,unsubscribeChannel } from "../controllers/channel.controller.js";
import { authToken } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

import { convertData } from "../middleware/convertData.middleware.js";
import { optionalAuth } from "../middleware/optionalAuth.middleware.js";



const router = Router();

router.post('/createChannel',authToken,upload.single('coverImage'),convertData,createChannel)
router.patch('/updateChannel',authToken,updateChannelDetails)

router.patch('/updateChannelCoverImage',authToken,upload.single('coverImage'),updateChannelCoverImage)

router.get('/getChannelDetails/:userName',optionalAuth,getChannelDetails);

router.get('/subscribeTo/:userName',authToken,subscribeChannel);
router.get('/unsubscribeTo/:userName',authToken,unsubscribeChannel);






export default router; 