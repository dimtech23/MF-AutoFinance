import express from 'express';
import { registerUser } from '../controllers/registrationController';
import {registerAdmin} from '../controllers/clientController';

const router = express.Router();

router.post('/register', registerUser);
router.post('/admin', registerAdmin);

export { router };
