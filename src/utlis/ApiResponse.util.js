class ApiResponse {
   constructor(statusCode, message="",data={}, errors =[] ){
        this.message = message;
        this.statusCode = statusCode;
        this.errors = errors;
        this.data = data;
        this.success = statusCode<400;
    }
}

export {ApiResponse}