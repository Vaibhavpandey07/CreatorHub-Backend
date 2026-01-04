import ApiError from "../utlis/ApiErrors.util.js";


const errorMiddleware = (err,req,res,next)=>{
    let statusCode = err.statusCode || 500;
    let message = err.message || "Something went Wrong";
    let errors = err.erros || [];

    // if (!(err instanceof ApiError)) {
    //     console.error("UNEXPECTED ERROR:", err);
    // }

    res.status(statusCode).send({
        success: false,
        statusCode : statusCode,
        message:message,
        errors:errors
    })

}

export default errorMiddleware