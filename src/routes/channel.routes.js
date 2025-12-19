import { Router} from "express";
import { createChannel } from "../controllers/channel.controller.js";
import { authToken } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

import { convertData } from "../middleware/convertData.middleware.js";



const router = Router();

router.post('/createChannel',authToken,upload.single('coverImage'),convertData,createChannel)

export default router; 