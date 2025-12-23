import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRouter from './routes/user.routes.js';
import channelRouter from './routes/channel.routes.js';
import videoRouter from './routes/video.routes.js';
import commentRouter from './routes/comment.routes.js';
import userOtherDetailsRouter from './routes/userOtherDetails.routes.js';

import cookieParser from 'cookie-parser'

dotenv.config({path:"./.env"})
const app = express();

app.use(cors({
    origin : process.env.ALLOW_ORIGN,
    credentials:true
}));


app.use(express.urlencoded());
app.use(express.json());
app.use(cookieParser());


app.use('/public', express.static('public'));

app.use('/api/v1/users', userRouter);
app.use('/api/v1/channels', channelRouter);
app.use('/api/v1/videos', videoRouter);
app.use('/api/v1/comments', commentRouter);
app.use('/api/v1/userOtherDetails', userOtherDetailsRouter);





app.get('/', (req,res)=>{
    res.status(200).send({"message" : "Hello World!"});
});



export  {app};