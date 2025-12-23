import { Router} from "express";
import { authToken } from "../middleware/auth.middleware.js";
import { getWatchHistory, getLikedVideos , getSubscribedChannels, getNotification , clearWatchHistory , removeFromWatchHistory } from "../controllers/userOtherDetails.controller.js";


const router = Router();

router.get('/watchHistory',authToken,getWatchHistory);
router.get('/likedVideos',authToken,getLikedVideos);

router.get('/subscribedChannels',authToken,getSubscribedChannels);
router.get('/notification',authToken,getNotification);

router.patch('/clearWatchHistory',authToken,clearWatchHistory);
router.patch('/removeFromWatchHistory/:videoId',authToken,removeFromWatchHistory);




export default router; 