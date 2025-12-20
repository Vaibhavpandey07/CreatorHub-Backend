import { Router } from "express";
import { authToken } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { convertData } from "../middleware/convertData.middleware.js";
import { uploadVideo } from "../controllers/video.controller.js";

const router = Router();

router.post('/uploadVideo',authToken , upload.fields([ { name: 'video', maxCount: 1 },{ name: 'thumbnail', maxCount: 1 }]),convertData,uploadVideo);

export default router;