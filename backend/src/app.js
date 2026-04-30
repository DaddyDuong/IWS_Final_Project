import express from 'express';
import { addressesRoutes } from './routes/addresses.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import { cartRoutes } from './routes/cart.routes.js';
import { internalProductsRoutes } from './routes/internalProducts.routes.js';
import { ordersRoutes } from './routes/orders.routes.js';
import { productsRoutes } from './routes/products.routes.js';
import { reviewsRoutes } from './routes/reviews.routes.js';
import { usersRoutes } from './routes/users.routes.js';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/error.js';
import {
  authRateLimiter,
  corsMiddleware,
  globalRateLimiter,
  helmetMiddleware,
} from './middlewares/security.js';

export const app = express();
app.set('trust proxy', env.security.trustProxy);

app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(globalRateLimiter);
app.use(express.json({ limit: '32kb' }));

app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

app.use('/api/v1/addresses', addressesRoutes);
app.use('/api/v1/auth', authRateLimiter, authRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/products', productsRoutes);
app.use('/api/v1/internal/products', internalProductsRoutes);
app.use('/api/v1', reviewsRoutes);
app.use('/api/v1/users', usersRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
