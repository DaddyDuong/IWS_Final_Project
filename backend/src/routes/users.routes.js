import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';

export const usersRoutes = Router();

usersRoutes.get('/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    data: req.authUser,
  });
});
