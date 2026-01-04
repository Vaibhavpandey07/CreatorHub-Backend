class ApiError extends Error {
    constructor(statusCode, message="something went wrong" , errors =[]){
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.data = null;
        this.name = "ApiError";

        Error.captureStackTrace(this,this.constructor);
        
    }
}

export default ApiError