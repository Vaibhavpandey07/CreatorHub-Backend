import {validationResult } from "express-validator"
import Users from "../models/Users.model.js";
import asyncFunctionWraper from "../utlis/AsyncFunctionWraper.util.js";
import { ApiError } from "../utlis/ApiErrors.util.js";



const registration = async(req,res) =>{
    const err = validationResult(req);
    if(err.isEmpty()){
        const found = await Users.findOne({email:req.body.email});
        
        if(!found){
            const dataToSave = {
                "email": req.body.email,
                "firstName" : req.body.firstName,
                "lastName"  : req.body.lastName,
                "fullName" : req.body.firstName+' '+req.body.lastName,
                "password" : req.body.password,
                "profilePhoto": "url",
                "userType" : req.body.userType,
            }
            try{
                await Users.insertOne(dataToSave);
                res.send({"message" : "user Created successfully"})
            }catch(err){
                // console.log(err);

                throw new ApiError(400,"there was a problem while creating a new user")
            }   


        }else{
            console.log(new ApiError(401,"User already exsits"));
            throw new ApiError(401,"User already exsits");

        }

    }
    else{
        throw new ApiError(403,`invalid ${err.errors[0].path}`);
    }
    
}

const login = async(req,res)=>{

    res.send({"message" : "this is a login user controller"})
}

export { registration, login };