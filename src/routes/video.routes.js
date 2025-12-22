import { Router } from "express";
import { authToken } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { convertData } from "../middleware/convertData.middleware.js";
import {uploadVideo, updateVideoDetails , updateThumbnail ,likeDislikeVideo, getVideoDetails , getAllVideos  } from "../controllers/video.controller.js";
import { optionalAuth } from "../middleware/optionalAuth.middleware.js";

const router = Router();

router.post('/uploadVideo',authToken , upload.fields([ { name: 'video', maxCount: 1 },{ name: 'thumbnail', maxCount: 1 }]),convertData,uploadVideo);


router.patch('/updateVideoDetails',authToken , updateVideoDetails);
router.patch('/updateVideoDetails',authToken,upload.single('thumbnail'),convertData , updateThumbnail);

router.post('/likeDislikevideo/:videoId',authToken , likeDislikeVideo);


router.get('/getVideoDetails/:videoId',optionalAuth, getVideoDetails);
router.get('/getAllVideoDetails/:userName',optionalAuth, getAllVideos);







export default router;