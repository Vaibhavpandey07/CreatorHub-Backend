import { Router } from "express";
import { authToken } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { convertData } from "../middleware/convertData.middleware.js";
import { uploadVideo, updateVideoDetails , updateThumbnail , getVideoDetails , getAllVideos ,getAllMyChannelVideos } from "../controllers/video.controller.js";

const router = Router();

router.post('/uploadVideo',authToken , upload.fields([ { name: 'video', maxCount: 1 },{ name: 'thumbnail', maxCount: 1 }]),convertData,uploadVideo);


router.patch('/updateVideoDetails',authToken , updateVideoDetails);
router.patch('/updateVideoDetails',authToken,upload.single('thumbnail'),convertData , updateThumbnail);

router.get('/getVideoDetails/:videoId',getVideoDetails);
router.get('/getAllVideoDetails/:userName',getAllVideos);

router.get('/getAllMyChannelVideos',authToken,getAllMyChannelVideos);






export default router;