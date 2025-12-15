import {validationResult } from "express-validator"
import Users from "../models/Users.model.js";
import { ApiResponse } from "../utlis/ApiResponse.util.js";
import {env} from "../utlis/getEnvVariable.util.js";

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
                "profilePhoto": `./${env.UPLOAD_FOLDER}/${req.file.originalname}`,
                "userType" : req.body.userType,
            }
            
            
            try{
                await Users.create(dataToSave);
                res.status(201).send(new ApiResponse(201,"User created successfully"))
            }catch(err){
                console.log(err);
                res.status(500).send(new ApiResponse(500,"there was a problem while creating a new user"))
            }   


        }else{ 
            res.status(400).send(new ApiResponse(400,"User already exsits"))
        }

    }
    else{
        res.status(400).send(new ApiResponse(400,`invalid ${err.errors[0].path}`))
    }
    
}

const login = async(req,res)=>{

    res.send({"message" : "this is a login user controller"})
}

export { registration, login };