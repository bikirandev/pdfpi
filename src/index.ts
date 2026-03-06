import cors from "cors";
import http from "http";
import express, { NextFunction, Request, Response } from "express";
import { WebSocket, WebSocketServer } from "ws";
import globalErrorHandler from "./middleware/globalErrorHandler";
import notFound from "./middleware/notFound";
import pdfRoute from "./routes/pdf.route";
import channelRoute from "./routes/channel.route";
import downloadDir from "./utils/downloadDir";
import publicDir from "./utils/publicDir";
import { ChannelManager } from "./utils/channelManager";
import eventRoute from "./routes/events.route";
import scrapRoute from "./routes/scrap.route";

const app = express();
const port = 7301;

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const channelManager = new ChannelManager();

// Parse incoming JSON bodies (up to 10 MB)
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Serve generated PDFs as static files
app.use("/downloads", express.static(downloadDir()));

// Serve landing page and other public assets
app.use(express.static(publicDir()));

// API routes
app.use("/pdf", pdfRoute);
app.use("/api/scraped-data", scrapRoute);
app.use("/channel", channelRoute);
app.use("/events", eventRoute);

// 404 handler – must be registered after all routes
app.use((req: Request, res: Response, next: NextFunction): any =>
  notFound(req, res, next)
);

// Global error handler – must be the last middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction): any =>
  globalErrorHandler(err, req, res, next)
);

// WebSocket – real-time channel subscriptions
wss.on("connection", (ws: WebSocket) => {
  console.log("New WebSocket client connected");

  ws.on("message", (raw: Buffer) => {
    try {
      const data = JSON.parse(raw.toString());

      if (data.type === "subscribe") {
        channelManager.subscribeClient(ws, data.channelId);
      } else if (data.type === "unsubscribe") {
        channelManager.unsubscribeClient(ws, data.channelId);
      }
    } catch (parseErr) {
      const preview = raw.toString().slice(0, 100);
      console.warn(`Received invalid WebSocket message (not valid JSON): "${preview}"`);
    }
  });

  ws.on("close", () => {
    channelManager.removeClient(ws);
    console.log("WebSocket client disconnected");
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
