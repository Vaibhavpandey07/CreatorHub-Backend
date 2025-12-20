import { ApiResponse } from "../utlis/ApiResponse.util.js";

const convertData = (req,res,next)=>{
    try{
        req.body = JSON.parse(req.body.data)
    }
    catch(err){
        res.status(400).send(new ApiResponse(400,err.message))
    }
    next();
}
export {convertData}

