export function notFoundHandler(_req, _res, next) {
  next({ status: 404, message: 'Not found' });
}

export function errorHandler(err, _req, res, _next) {
  const status = err?.status ?? err?.statusCode ?? 500;
  const message = status >= 500 ? 'Internal server error' : (err?.message ?? 'Bad request');
  const response = {
    success: false,
    error: {
      message,
    },
  };

  if (err?.code) {
    response.error.code = err.code;
  }

  if (status < 500 && err?.details) {
    response.error.details = err.details;
  }

  res.status(status).json(response);
}
