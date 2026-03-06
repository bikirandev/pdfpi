import { NextFunction, Request, Response } from "express";

/**
 * Express global error-handling middleware.
 *
 * Catches any error passed to `next(err)` and returns a structured JSON
 * response.  The error stack is only included in the response body when the
 * application is running in development mode to avoid leaking internals.
 */
const globalErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = 500;
  const message = err.message || "An unexpected error occurred";

  return res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

export default globalErrorHandler;
