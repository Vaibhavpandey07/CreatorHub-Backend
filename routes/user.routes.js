import { Router } from "express";
import { registration, login } from "../controllers/user.controller.js";
import {validation} from "../middleware/userValidation.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { convertData } from "../middleware/convertData.middleware.js";

const router = Router()
router.post('/register',upload.single('Photo'),convertData,validation,registration);
router.post('/login',login);


export default router;
