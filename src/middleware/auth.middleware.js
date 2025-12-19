import  jwt from "jsonwebtoken"
import { ApiResponse } from "../utlis/ApiResponse.util.js"
import { env } from "../utlis/getEnvVariable.util.js"
import Users from "../models/Users.model.js"

const authToken = async( req, res, next)=>{
    const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "") 
    if(!token){
        return res.status(401).send(new ApiResponse(401,"No token found"))
    }
    else{
        try{
            const payload = jwt.verify(token , env.ACCESS_TOKEN_SIGN );

            const user = await Users.findById(req.userId);
            if(!user){
                return res.status(404).send(new ApiResponse(404, "User Does Not exsits"))
            }  
            if(!payload?._id){
                return res.status(401).send(new ApiResponse(401,"Token Invalid"))
            }
            req.userId = payload._id;
            next()
        }catch(err){
            if (err instanceof jwt.TokenExpiredError) {
                return res.status(401).send(new ApiResponse(401,"Token Expired"))
            }
            return res.status(401).send(new ApiResponse(401,err.message))
        }
    }
}


export {authToken}