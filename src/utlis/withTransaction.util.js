import mongoose from "mongoose"


// ACID Properties
const withTransaction = async function(fn){
    const session = await mongoose.startSession();
    session.startTransaction();
    let result = false;
    try{
        await fn(session);
        await session.commitTransaction();
        result = true;
    }catch(err){
        console.log(err);
        await session.abortTransaction();
        result = false;
        
    }finally{
        await session.endSession();
    }
    return result;
}

export {withTransaction}