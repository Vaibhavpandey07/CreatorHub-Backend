const convertData = (req,res,next)=>{
    req.body = JSON.parse(req.body.data)
    next();
}
export {convertData}

