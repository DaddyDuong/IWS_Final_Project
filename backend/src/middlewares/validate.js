export function validateBody(schema) {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return next({
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    req.validatedBody = parsed.data;
    return next();
  };
}

export function validateQuery(schema) {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.query);

    if (!parsed.success) {
      return next({
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }

    req.validatedQuery = parsed.data;
    return next();
  };
}
