import { body , query} from "express-validator"


const validation = [
    body('email').isEmail(),
    body('password').isLength({min:5 , max:30}),
    body('userType').isNumeric()

    ]

export {validation} 