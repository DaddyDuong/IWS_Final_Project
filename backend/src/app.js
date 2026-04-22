import express from 'express';
import { authRoutes } from './routes/auth.routes.js';
import { internalProductsRoutes } from './routes/internalProducts.routes.js';
import { productsRoutes } from './routes/products.routes.js';
import { usersRoutes } from './routes/users.routes.js';
import { errorHandler, notFoundHandler } from './middlewares/error.js';

export const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productsRoutes);
app.use('/api/v1/internal/products', internalProductsRoutes);
app.use('/api/v1/users', usersRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
