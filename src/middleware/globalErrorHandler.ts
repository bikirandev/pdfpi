import { NextFunction, Request, Response } from "express";
import config from "../config";

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
  const message = err.message || "An unexpected error occurred";

  return res.status(500).json({
    error: true,
    message,
    stack: config.nodeEnv === "development" ? err.stack : undefined,
  });
};

export default globalErrorHandler;
