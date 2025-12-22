import { Router} from "express";
import { authToken } from "../middleware/auth.middleware.js";


const router = Router();

router.post('/:videoId/comments',authToken,async(req,res)=>{
    res.send("comment routes");
})






export default router; 