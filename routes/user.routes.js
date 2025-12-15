import { Router } from "express";
import { registration, login } from "../controllers/user.controller.js";
import validation from "../middleware/userValidation.middleware.js";
const router = Router()

router.post('/register',validation,registration);
router.get('/login',login);


export default router;
