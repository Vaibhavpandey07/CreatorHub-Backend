import Users from "../models/Users.model.js";


const generateToken = async function (_id) {

    const user = await Users.findById({_id});
    if(user){
        
        const newAccessToken = await user.generateAccessToken()
        const newRefreshToken = await user.generateRefreshToken()
        user.refreshToken = newRefreshToken;
        await user.save({validationBeforeSave : false})
        return {newAccessToken , newRefreshToken}
        
    }
    return {undefined,undefined}
}


export {generateToken}