import { ApiResponse } from "../utlis/ApiResponse.util.js"
import  jwt from "jsonwebtoken"
import { env } from "../utlis/getEnvVariable.util.js"
import Users from "../models/Users.model.js"
import ApiError from "../utlis/ApiErrors.util.js"

const authToken = async( req, res, next)=>{
    const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "") 
    if(!token){
       throw new ApiError(400,"No token found");
    }
    else{
        try{
            const payload = jwt.verify(token , env.ACCESS_TOKEN_SIGN );
            if(!payload?._id){
                throw new ApiError(401,"Token Invalid");
            }
            
            const user = await Users.findById(payload?._id);
            if(!user){
                throw new ApiError(404, "User Does Not exsits");
            }  
            
            req.userId = payload._id;
            next()
        }catch(err){
            if (err instanceof jwt.TokenExpiredError) {
                throw new ApiError(401,"Token Expired");
            }
            throw new ApiError(404,err.message);
        }
    }
}


export {authToken}