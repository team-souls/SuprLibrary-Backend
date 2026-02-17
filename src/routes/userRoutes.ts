import express from 'express';
import { getAllUsers ,searchUserByEmail,promoteToOwner, createLibrary,userProfile} from '../controllers/userControllers.js';

const userRouter = express.Router();

userRouter.get('/', getAllUsers);
userRouter.get('/profile',userProfile);
userRouter.get('/search', searchUserByEmail);
userRouter.post('/promote', promoteToOwner);
userRouter.post('/library', createLibrary);
export default userRouter;