import { NextFunction, Request, Response } from "express";

/**
 * Express 404 middleware.
 *
 * Registered after all route handlers.  Returns a uniform JSON response when
 * no other route matched the incoming request.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const notFound = (_req: Request, res: Response, _next: NextFunction) => {
  return res.status(404).json({
    error: true,
    message: "Not Found",
  });
};

export default notFound;
