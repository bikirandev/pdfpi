import { NextFunction, Request, Response } from "express";
import { timingSafeEqual } from "crypto";
import config from "../config";

/**
 * API key authentication middleware.
 *
 * When `API_KEY` is set in the environment, every request to protected routes
 * must include a matching key via the `x-api-key` header or `apiKey` query
 * parameter. If `API_KEY` is empty, authentication is disabled (open access).
 */
const apiKeyAuth = (req: Request, res: Response, next: NextFunction): any => {
  const key = config.apiKey;
  if (!key) return next(); // auth disabled

  const provided =
    (req.headers["x-api-key"] as string) || (req.query.apiKey as string);

  if (
    !provided ||
    provided.length !== key.length ||
    !timingSafeEqual(Buffer.from(provided), Buffer.from(key))
  ) {
    return res.status(401).json({
      error: true,
      message: "Unauthorized – invalid or missing API key.",
    });
  }

  next();
};

export default apiKeyAuth;
