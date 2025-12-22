import { Router} from "express";
import { authToken } from "../middleware/auth.middleware.js";


const router = Router();

router.post('/user/otherDetails',authToken,async(req,res)=>{
    res.send("other Details routes");
})






export default router; 