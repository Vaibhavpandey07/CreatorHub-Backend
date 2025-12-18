import mongoose from "mongoose"


// ACID Properties
const withTransaction = async function(fn){
    const session = await mongoose.startSession();
    session.startSession();
    try{
        const result = await fn(session);
        await session.commitTransaction();
        return result;
    }catch(err){
        await session.abortTransaction();
        throw err;
    }finally{
        await session.endSession();
    }
}

export {withTransaction}