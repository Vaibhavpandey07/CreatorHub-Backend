import multer from "multer";
import {env} from "../utlis/getEnvVariable.util.js";
const storage = multer.diskStorage({
    destination : (req,file,cb)=>{
        cb(null, `./public/${env.UPLOAD_FOLDER}`) 
    },
    filename: (req,file,cb)=>{
        cb(null,file.originalname)
    }
})

const upload = multer({storage});

export {upload}