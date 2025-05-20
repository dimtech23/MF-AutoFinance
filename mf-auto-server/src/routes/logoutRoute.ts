import express, { Request, Response } from 'express';

const router = express.Router();

router.post('/logout', async (_req: Request, res: Response): Promise<Response> => {
  try {    
    return res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;