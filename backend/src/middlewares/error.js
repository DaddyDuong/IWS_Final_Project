export function notFoundHandler(_req, _res, next) {
  next({ status: 404, message: 'Not found' });
}

export function errorHandler(err, _req, res, _next) {
  const status = err?.status ?? 500;
  const message = err?.message ?? 'Internal server error';
  const response = {
    success: false,
    error: {
      message,
    },
  };

  if (err?.details) {
    response.error.details = err.details;
  }

  res.status(status).json(response);
}
