import express from 'express';
import { loginUser, passwordReset, verifyResetCode, resetPassword, updateInfo } from '../controllers/loginController';

const router = express.Router();

// Add a test endpoint to verify auth routes are working
router.get('/status', (req, res) => {
  // Make sure to include CORS headers in case this endpoint is directly accessed
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  res.status(200).json({
    status: 'online',
    message: 'Authentication service is running',
    timestamp: new Date().toISOString()
  });
});

// User routes
router.post('/login', loginUser);
router.post('/reset', passwordReset);
router.post('/password-reset', resetPassword);
router.post('/verify-reset-code', verifyResetCode);
router.put('/update-info', updateInfo);

export { router };