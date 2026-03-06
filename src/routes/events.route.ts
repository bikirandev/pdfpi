import { Router } from "express";

const eventRoute = Router();

/**
 * GET /events
 *
 * Server-Sent Events (SSE) endpoint.  Streams up to 10 progress messages to
 * the connected client at random intervals and then closes the stream.
 *
 * The client can listen with:
 *   ```js
 *   const source = new EventSource('/events');
 *   source.onmessage = (e) => console.log(JSON.parse(e.data));
 *   ```
 */
eventRoute.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let count = 0;

  const interval = setInterval(() => {
    if (count < 10) {
      res.write(
        `data: ${JSON.stringify({ message: `Message ${count + 1}` })}\n\n`
      );
      count++;
    } else {
      clearInterval(interval);
      res.write(`data: ${JSON.stringify({ message: "Process complete" })}\n\n`);
      res.end();
    }
  }, Math.floor(Math.random() * 1000));

  // Clean up the interval if the client disconnects early
  req.on("close", () => {
    clearInterval(interval);
    console.log("SSE client disconnected");
  });
});

export default eventRoute;
