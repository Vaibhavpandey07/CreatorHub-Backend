class ApiError extends Error {
    constructor(statusCode, message="something went wrong" , stack ="" , errors =[]){
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.errors = errors;
        this.data = null;

        if(stack){
            this.stack = stack;
        }else{
            Error.captureStackTrace(this,this.constructor);
        }
    }
}

export {ApiError}