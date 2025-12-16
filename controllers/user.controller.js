import {validationResult } from "express-validator"
import Users from "../models/Users.model.js";
import { ApiResponse } from "../utlis/ApiResponse.util.js";
import {env} from "../utlis/getEnvVariable.util.js";
import { generateToken } from "../utlis/generateTokens.util.js";



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
                "refreshToken" : ""
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
        res.status(400).send(new ApiResponse(400,`Validation Error : invalid ${err.errors[0].path}`))
    }
    
}

const login = async(req,res)=>{

    if(!req.body.email || !req.body.password){
        return res.status(400).send(new ApiResponse(400,`Please Enter email and password`))
    }

    const user = await Users.findOne({email:req.body.email});
    if(!user){
        return  res.status(400).send(new ApiResponse(400,`No user exsits with this Email`))
    }
    const checkPassword = await user.isPasswordCorrect(req.body.password);
    if(!checkPassword){
        return  res.status(400).send(new ApiResponse(400,`Wrong Password`))
    }

    try{
        const {accessToken , refreshToken} = await generateToken(user._id);
        const options = {httpOnly:true , secure : true}
        
        return  res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(new ApiResponse(200,"User Logged-In successfully"));
    }
    catch(err){
        console.log(err)
        return res.status(500).send(new ApiResponse(500,`Sorry there was a problem`))
    }

}

export { registration, login };