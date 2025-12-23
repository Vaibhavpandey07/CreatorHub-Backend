import { Router } from "express";
import { registration, login, logOut, updateUserDetails ,getNewAccesstoken ,updateProfilePhoto , removeUser, resetPassword , getUserDetails} from "../controllers/user.controller.js";
import {validation} from "../middleware/userValidation.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { convertData } from "../middleware/convertData.middleware.js";
import { authToken } from "../middleware/auth.middleware.js";

const router = Router()


router.post('/register',upload.single('profilePhoto'),convertData,validation,registration);
router.post('/login',login);

router.get('/userDetails',authToken , getUserDetails );
router.get('/getAccessToken',getNewAccesstoken);
router.get('/logout',authToken,logOut);

router.patch('/updateDetails',authToken,updateUserDetails);
router.patch('/resetPassword',authToken,resetPassword);
router.patch('/updateProfilePhoto',authToken,upload.single('profilePhoto'),updateProfilePhoto);

router.delete('/removeUser',authToken,removeUser);

export default router;
