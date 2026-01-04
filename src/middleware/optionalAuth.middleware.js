
import  jwt from "jsonwebtoken"
import { env } from "../utlis/getEnvVariable.util.js"
import Users from "../models/Users.model.js"

const optionalAuth = async( req, res, next)=>{
    const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "") 
    if(!token){
        req.userId = null;
        next();
    }
    else{
        try{
            const payload = jwt.verify(token , env.ACCESS_TOKEN_SIGN );
            const user = await Users.findById(payload?._id);
            if(user){
                req.userId = payload?._id;
            }else{
                req.userId = null;
            }
            
            next();
        
        }catch(err){
            req.userId = null;
            next();
        }
    }
}


export {optionalAuth}