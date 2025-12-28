export function errorHandler(err, _req, res, _next) {
  console.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({
    ok: false,
    error: {
      message: err.message || 'Internal error',
      code: err.code || 'INTERNAL_ERROR',
    }
  });
}
