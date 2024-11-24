import { Router } from "express";

const eventRoute = Router();

// SSE Route
eventRoute.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let count = 0;

  const interval = setInterval(() => {
    if (count < 10) {
      res.write(
        `data: ${JSON.stringify({
          message: `Message ${count + 1}`,
        })}\n\n`
      );
      count++;
    } else {
      clearInterval(interval);
      res.write(
        `data: ${JSON.stringify({
          message: "Process complete",
        })}\n\n`
      );
      res.end();
    }
  }, Math.floor(Math.random() * 1000)); // Random interval between 200ms and 1000ms

  req.on("close", () => {
    clearInterval(interval);
    console.log("Client disconnected");
  });
});

export default eventRoute;
