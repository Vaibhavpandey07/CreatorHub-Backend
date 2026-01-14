import { Router } from "express";
import { authToken } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { convertData } from "../middleware/convertData.middleware.js";
import {uploadVideo, updateVideoDetails , updateThumbnail ,likeVideo, dislikeVideo, getVideoDetails , getAllVideos , removeVideo, searchVideos, searchSuggestions, randomVideosSuggestions, trendingVideos, latestVideos, VideoDetails, getProgress  } from "../controllers/video.controller.js";
import { optionalAuth } from "../middleware/optionalAuth.middleware.js";

const router = Router();

// router.post('/uploadVideo',authToken , upload.fields([ { name: 'video', maxCount: 1 },{ name: 'thumbnail', maxCount: 1 }]),convertData,uploadVideo);

router.post('/uploadVideo',authToken,upload.single('video'),uploadVideo);
router.post('/getProgress',authToken,getProgress);

router.post('/uploadVideoDetails',authToken,upload.single('thumbnail'),convertData,VideoDetails);


router.patch('/updateVideoDetails',authToken , updateVideoDetails);
router.patch('/updateThumbnail',authToken,upload.single('thumbnail'),convertData , updateThumbnail);

router.post('/likevideo',authToken , likeVideo);
router.post('/dislikevideo',authToken , dislikeVideo);


router.delete('/removeVideo',authToken , removeVideo);



router.get('/getVideoDetails/:videoId',optionalAuth, getVideoDetails);
router.get('/getAllVideoDetails/:userName',optionalAuth, getAllVideos);

router.get('/searchVideos',searchVideos);
router.get('/searchSuggestion',searchSuggestions);

router.get('/randomVideos',randomVideosSuggestions);
router.get('/trendingVideos',trendingVideos);
router.get('/latestVideos',latestVideos);








export default router;