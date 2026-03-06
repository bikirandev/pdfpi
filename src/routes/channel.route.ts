import { Request, Response, Router } from "express";

const channelRoute = Router();

/**
 * GET /channel/create
 *
 * Placeholder endpoint – channel creation is handled via WebSocket
 * (subscribe/unsubscribe messages).  This REST endpoint is reserved for
 * future use and currently returns a 501 Not Implemented response.
 */
channelRoute.get("/create", (_req: Request, res: Response): any => {
  return res.status(501).json({
    error: true,
    message:
      "Channel creation via REST is not yet implemented. " +
      "Use the WebSocket interface to subscribe/unsubscribe channels.",
  });
});

export default channelRoute;