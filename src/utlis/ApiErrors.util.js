class ApiError extends Error {
    constructor(statusCode, message="something went wrong" , errors =[],data={}){
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.data = data;
        this.name = "ApiError";

        Error.captureStackTrace(this,this.constructor);
        
    }
}

export default ApiError