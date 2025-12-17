import  jwt from "jsonwebtoken"
import { ApiResponse } from "../utlis/ApiResponse.util.js"
import { env } from "../utlis/getEnvVariable.util.js"

const authToken = async( req, res, next)=>{
    const token = req.cookies.accessToken || req.header("Authorization").replace("Bearer ", "") 
    if(!token){
        res.status(400).send(new ApiResponse(400,"No token found"))
    }else{
        const payload = jwt.verify(token , env.ACCESS_TOKEN_SIGN );
        
        if(!payload._id){
            res.status(401).send(new ApiResponse(401,"Token Invalid or expired"))
        }

        req.userId = payload._id;
        next()
    }
}


export {authToken}