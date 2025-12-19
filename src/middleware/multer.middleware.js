import multer from "multer";
import {env} from "../utlis/getEnvVariable.util.js";
import { uuid } from "uuidv4";
import path from 'path'


const storage = multer.diskStorage({
        destination : (req,file,cb)=>{
            let folderName = env.UPLOAD_FOLDER
            console.log(file.fieldname)
            if(file.fieldname =='profilePhoto'){
                folderName = env.UPLOAD_PROFILE_PHOTO_FOLDER
            }
            else if(file.fieldname == 'coverImage'){
                folderName = env.UPLOAD_COVER_IMAGE_FOLDER
            }
            else if(file.fieldname == 'video'){
                folderName = env.UPLOAD_VIDEO_FOLDER
            }

            cb(null, folderName) 
        },
        filename: (req,file,cb)=>{
            const uniqueName = `${uuid()}-${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`;
            req.fileName = {name:uniqueName , type:file.fieldname};
            cb(null,uniqueName)
        }
    })
      


const upload = multer({storage});
    
export {upload }