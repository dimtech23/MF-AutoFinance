import { Request, Response } from 'express';
// import { emailService } from "../services/emailService";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    // Log the login attempt
    console.log(`Login attempt for: ${email}`);

    const user = await User.findOne({ email }).collation({ locale: 'en', strength: 2 });

    if (!user) {
      console.log(`Login failed: No user found with email ${email}`);
      res.status(404).json({ message: 'No account associated with this email. Please check the email entered or register.' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      console.log(`Login failed: Incorrect password for ${email}`);
      res.status(401).json({ message: 'Incorrect password. Please try again' });
      return;
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Log successful login
    console.log(`Login successful for ${email}`);

    // Ensure these CORS headers are set for the login response
    const origin = req.headers.origin;
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    }

    res.status(200).json({ 
      message: 'Login successful', 
      token,
      user: {
        id: user._id,
        role: user.role,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const generateCode = (length: number) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"; 
  const charLen = characters.length;
  let code = "";
  for (let i = 0; i < length; i++) {
    code += characters.charAt(Math.floor(Math.random() * charLen)); 
  }
  return code;
};

export const passwordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ message: 'No account associated with this email. Please check the email entered or register.' });
      return;
    }

    const resetCode = generateCode(6);
    const resetCodeExpiry = new Date();
    resetCodeExpiry.setMinutes(resetCodeExpiry.getMinutes() + 10);

    user.resetCode = resetCode;
    user.resetCodeExpiry = resetCodeExpiry;

    await user.save();  
    // await emailService.sendEmail({
    //   to: email,
    //   subject: 'Password Reset Request',
    //   template: 'passwordReset',
    //   context: {
    //     resetCode,
    //   },
    // });

    res.status(200).json({ message: 'Password Reset Request Sent!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const verifyResetCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, resetCode } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ message: 'No account associated with this email.' });
      return;
    }

    if (!user.resetCode || !user.resetCodeExpiry || user.resetCode !== resetCode) {
      res.status(400).json({ message: 'Invalid or expired reset code.' });
      return;
    }

    if (user.resetCodeExpiry < new Date()) {
      res.status(400).json({ message: 'The reset code has expired.' });
      return;
    }

    res.status(200).json({ message: 'Reset code verified. Proceed to reset password.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, newEmail, newPassword } = req.body; 
    const user = await User.findOne({ _id: userId });

    if (!user) {
      res.status(400).json({ message: "User not found!" });
      return;
    }

    // Handle email update
    if (newEmail) {
      const existingUser = await User.findOne({ email: newEmail }).exec();

      if (existingUser && existingUser._id && existingUser._id.toString() !== userId) {
        res.status(409).json({ message: 'This email is already in use.' });
        return;
      }

      user.email = newEmail;
    }

    // Handle password update
    if (newPassword) {
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    res.status(200).json({ message: 'User updated successfully.' });
  } catch (error) {
    console.error('Error in updateInfo:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, resetCode, newPassword } = req.body; 
    const user = await User.findOne({ email });

    if (!user || user.resetCode !== resetCode || (user.resetCodeExpiry && user.resetCodeExpiry < new Date())) {
      res.status(400).json({ message: 'Invalid or expired reset code.' });
      return;
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetCode = undefined; 
    user.resetCodeExpiry = undefined; 
    await user.save();

    res.status(200).json({ message: 'Password successfully reset.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
