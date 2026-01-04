import ApiError from "../utlis/ApiErrors.util.js";

const convertData = (req,res,next)=>{
    try{
        req.body = JSON.parse(req.body.data)
    }
    catch(err){
        throw new ApiError(400,err.message); 
    }
    next();
}
export {convertData}

