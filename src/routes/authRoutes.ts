import express from 'express';
import { googleAuth } from '../controllers/authController';


const authRouter = express.Router();

authRouter.post('/google',googleAuth);
export default authRouter;