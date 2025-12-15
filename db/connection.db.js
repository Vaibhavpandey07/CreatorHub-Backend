import mongoose from "mongoose";
import asyncFunctionWraper from "../utlis/AsyncFunctionWraper.util.js";
import env from '../utlis/getEnvVariable.util.js';


const connection = asyncFunctionWraper(()=>{
    return mongoose.connect(`${env.MONGO_CONNECTION_URL}/${env.MONGO_DATABASE_NAME}`);
})

export default connection
