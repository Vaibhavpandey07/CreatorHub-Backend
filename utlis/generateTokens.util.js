import Users from "../models/Users.model.js";


const generateToken = async function (_id) {

    const user = await Users.findById({_id});
    if(user){

        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
        
        user.refreshToken = refreshToken;
        await user.save({validationBeforeSave : false})
        return {accessToken , refreshToken}
        
    }
}


export {generateToken}