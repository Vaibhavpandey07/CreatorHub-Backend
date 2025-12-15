const asyncFunctionWraper =(fn) => async()=>{
    try {
        await fn();
    } catch (error) {
        console.log("This is a async funtion error ",error);
    }
}

export {asyncFunctionWraper};