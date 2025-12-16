import { Router } from "express";
import { registration, login, logOut } from "../controllers/user.controller.js";
import {validation} from "../middleware/userValidation.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { convertData } from "../middleware/convertData.middleware.js";
import { authToken } from "../middleware/auth.middleware.js";

const router = Router()
router.post('/register',upload.single('Photo'),convertData,validation,registration);
router.post('/login',login);




router.post('/logout',authToken,logOut);



export default router;
