import express from 'express';
import { loginUser, passwordReset, verifyResetCode,resetPassword ,updateInfo} from '../controllers/loginController';
// import { loginAdmin } from '../controllers/adminController';

const router = express.Router();

// User routes
router.post('/login', loginUser);
router.post('/reset', passwordReset);
router.post('/password-reset', resetPassword);
router.post('/verify-reset-code', verifyResetCode);
router.put('/update-info', updateInfo);


// Admin routes
// router.post('/alogin', loginAdmin);

export { router };
