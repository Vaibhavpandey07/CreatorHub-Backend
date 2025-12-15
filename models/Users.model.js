import mongoose from "mongoose";
import { Schema } from "mongoose";
import bcrypt from 'bcryptjs'
import env from '../utlis/getEnvVariable.util.js'
import jwt from "jsonwebtoken";


const userSchema = new Schema({

    email:{type:String , required :true , unique :true},
    firstName :{type:String , required :true },
    lastName :{type:String , required :true },
    fullName : {type:String,required : true},
    password :{type:String , required :true },
    profilePhoto : {type:String },
    userType :{type:Number , required :true},
    
}, {timestamps:true})

userSchema.pre('save',async function(){
    if(!this.isModified('password')){
        this.password = await bcrypt.hash(this.password , 10);
    }
})

userSchema.methods.isPasswordCorrect = async function(password) {
    
    return await bcrypt.compare(password, this.password);
}


userSchema.methods.generateAccessToken = async function(){
    const payload = {
        email : this.email,
        fullName : this.fullName,
        profilePhoto :this.profilePhoto
    }

    return await jwt.sign(payload , env.ACCESS_TOKEN_SIGN , {expiresIn : env.ACCESS_TOKEN_EXPIRY})
}


userSchema.methods.generateRefreshToken = async function(){
    const payload = {
        email : this.email,
    }
    return await jwt.sign(payload , env.REFRESH_TOKEN_SIGN , {expiresIn : env.REFRESH_TOKEN_EXPIRY})
}

const Users = mongoose.model('Users' , userSchema);

export default Users;
