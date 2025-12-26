import { Router} from "express";
import { authToken } from "../middleware/auth.middleware.js";
import {commentToVideo , replyToComment , getComments,getCommentReplies,removeComment} from "../controllers/comments.controller.js";

const router = Router();

router.post('/commentToVideo/:videoId',authToken,commentToVideo);
router.post('/replyToComment/:videoId/:commentId',authToken,replyToComment);

router.get('/getComments/:videoId',getComments);
router.get('/CommentReplies/:videoId/:commentId',getCommentReplies);

router.delete('/removeComment/:videoId/:commentId',authToken , removeComment);


export default router; 