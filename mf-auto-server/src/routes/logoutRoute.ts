import express, { Request, Response } from 'express';

const router = express.Router();

router.post('/logout', async (req: Request, res: Response) => {
  try {    
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;