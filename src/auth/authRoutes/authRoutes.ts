import express from 'express';
import { googleAuth } from '../authController/authController';


const authRouter = express.Router();

authRouter.post('/google',googleAuth);
export default authRouter;